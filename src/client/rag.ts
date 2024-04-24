import { v4 as uuidv4 } from "uuid";
import { App, AuthAppConfig } from "./app";
import { Workflow } from "./workflow";
import * as fs from "fs";
import yaml from "js-yaml";
import { resources_pb2 } from "clarifai_grpc";
import {
  JavaScriptValue,
  Struct,
} from "google-protobuf/google/protobuf/struct_pb";
import { Inputs } from "clarifai";
import { Model } from "./model";
import { User } from "./user";
import { MAX_UPLOAD_BATCH_SIZE } from "../constants/rag";
import { UserError } from "../errors";
import { convert_messages_to_str } from "clarifai";
import { format_assistant_message } from "clarifai";
import { load_documents } from "clarifai";
import { split_document } from "clarifai";
import { AuthConfig } from "../utils/types";
import { ClarifaiAppUrl, ClarifaiUrl, ClarifaiUrlHelper } from "../urls/helper";
import {
  ModelVersion,
  OutputInfo,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { validateWorkflow } from "../workflows/validate";

const DEFAULT_RAG_PROMPT_TEMPLATE =
  "Context information is below:\n{data.hits}\nGiven the context information and not prior knowledge, answer the query.\nQuery: {data.text.raw}\nAnswer: ";

type UrlAuthConfig = Omit<AuthConfig, "userId" | "appId"> & {
  appId?: undefined;
  userId?: undefined;
};

type RAGConfig =
  | {
      workflowUrl: ClarifaiUrl;
      workflow?: undefined;
      authConfig?: UrlAuthConfig;
    }
  | {
      workflowUrl?: undefined;
      workflow: Workflow;
      authConfig?: AuthConfig;
    };

type workflowSchema = ReturnType<typeof validateWorkflow>;

export class RAG {
  private promptWorkflow: Workflow;
  private app: App;

  private chatStateId: string;

  constructor({ workflowUrl, workflow, authConfig = {} }: RAGConfig) {
    if (workflowUrl && workflow) {
      throw new UserError(
        "Only one of workflowUrl or workflow can be specified.",
      );
    }
    if (workflowUrl) {
      if (authConfig.userId || authConfig.appId) {
        throw UserError(
          "userId and appId should not be specified in authConfig when using workflowUrl.",
        );
      }
      console.info("workflow_url:%s", workflowUrl);
      const [userId, appId, , ,] =
        ClarifaiUrlHelper.splitClarifaiUrl(workflowUrl);
      const w = new Workflow({
        url: workflowUrl,
        authConfig: authConfig as UrlAuthConfig,
      });
      this.promptWorkflow = w;
      this.app = new App({
        authConfig: {
          ...authConfig,
          userId,
          appId,
        } as AuthConfig,
      });
    } else if (workflow) {
      this.promptWorkflow = workflow;
      this.app = new App({
        authConfig: authConfig as AuthConfig,
      });
    }
  }

  static async setup({
    authConfig,
    appUrl,
    llmUrl = "https://clarifai.com/mistralai/completion/models/mistral-7B-Instruct",
    baseWorkflow = "Text",
    workflowYamlFilename = "prompter_wf.yaml",
    promptTemplate = DEFAULT_RAG_PROMPT_TEMPLATE,
    workflowId,
    minScore = 0.95,
    maxResults = 5,
  }: {
    authConfig?: AuthConfig | AuthAppConfig;
    appUrl?: ClarifaiAppUrl;
    llmUrl?: ClarifaiUrl;
    baseWorkflow?: string;
    workflowYamlFilename?: string;
    promptTemplate?: string;
    workflowId?: string;
    minScore?: number;
    maxResults?: number;
  }) {
    const { userId, appId } = authConfig ?? {};
    const nowTs = Date.now().toString();
    const [, , resourceType, resourceId] =
      ClarifaiUrlHelper.splitClarifaiUrl(llmUrl);
    if (resourceType !== "models") {
      throw new UserError("llmUrl must be a model URL.");
    }
    let app: App;
    if (userId && !appUrl) {
      const user = new User(authConfig as AuthConfig);
      const appId = `rag_app_${nowTs}`;
      const appObj = await user.createApp({
        appId: appId,
        baseWorkflow: baseWorkflow,
      });
      if (authConfig && !authConfig?.appId) authConfig.appId = appObj.id;
      if (authConfig && !authConfig?.userId) authConfig.userId = userId;
      app = new App({
        authConfig: authConfig as AuthConfig,
      });
    }

    if (!userId && appUrl) {
      app = new App({
        url: appUrl,
        authConfig: authConfig as AuthAppConfig,
      });
      const [userIdFromUrl, appIdFromUrl] =
        ClarifaiUrlHelper.splitClarifaiAppUrl(appUrl);
      if (authConfig && !authConfig?.appId) authConfig.appId = appIdFromUrl;
      if (authConfig && !authConfig?.userId) authConfig.userId = userIdFromUrl;
      // const user = new User({
      //   ...(authConfig as AuthAppConfig),
      //   userId: userIdFromUrl,
      //   appId: appIdFromUrl,
      // });
    }

    if (userId && appUrl) {
      throw new UserError("Must provide one of userId or appUrl, not both.");
    }

    if (appId && appUrl) {
      throw new UserError("Must provide one of appId or appUrl, not both.");
    }

    if (!userId && !appUrl) {
      throw new UserError(
        "userId or appUrl must be provided. The userId can be found at https://clarifai.com/settings.",
      );
    }

    // @ts-expect-error - app has been assigned but not picked up by typescript
    const llmObject = await app.model({ modelId: resourceId });

    if (!llmObject) {
      throw new UserError("LLM model not found.");
    }

    const params = Struct.fromJavaScript({
      minScore,
      maxResults,
      promptTemplate,
    });

    const outputInfo = new OutputInfo().setParams(params);

    const modelId =
      workflowId !== null
        ? `prompter-${workflowId}-${nowTs}`
        : `rag-prompter-${nowTs}`;

    // @ts-expect-error - app has been assigned but not picked up by typescript
    const prompterModelObj = await app.createModel({
      modelId,
      params: {
        modelTypeId: "rag-prompter",
      },
    });
    const prompterModel = new Model({
      authConfig: authConfig as AuthConfig,
      modelId: prompterModelObj.id,
    });
    const prompterModelVersion = await prompterModel.createVersion(
      new ModelVersion().setOutputInfo(outputInfo),
    );

    if (!prompterModelVersion?.id) {
      throw new Error("Prompter model version creation failed.");
    }

    workflowId = workflowId ? workflowId : `rag-wf-${nowTs}`;
    const workflowObject: workflowSchema = {
      workflow: {
        id: workflowId,
        nodes: [
          {
            id: "rag-prompter",
            model: {
              modelId: prompterModelObj.id,
              modelVersionId: prompterModelVersion.id,
            },
          },
          {
            id: "llm",
            model: {
              modelId: llmObject.id,
              userId: llmObject.userId,
              appId: llmObject.appId,
            },
            nodeInputs: [
              {
                nodeId: "rag-prompter",
              },
            ],
          },
        ],
      },
    };
    const workflowYaml = yaml.dump(workflowObject, { noRefs: true });
    fs.writeFileSync(workflowYamlFilename, workflowYaml);
    // @ts-expect-error - app has been assigned but not picked up by typescript
    const wf = await app.createWorkflow({
      configFilePath: workflowYamlFilename,
    });
    const workflow = new Workflow({
      workflowId: wf.id,
      authConfig: authConfig as AuthConfig,
    });
    return new RAG({ workflow });
  }

  upload({
    filePath,
    folderPath,
    url,
    batchSize = 128,
    chunkSize = 1024,
    chunkOverlap = 200,
    datasetId,
    metadata,
  }: {
    filePath?: string;
    folderPath?: string;
    url?: string;
    batchSize?: number;
    chunkSize?: number;
    chunkOverlap?: number;
    datasetId?: string;
    metadata?: Record<string, JavaScriptValue>;
  }): void {
    if (batchSize > MAX_UPLOAD_BATCH_SIZE) {
      throw new UserError(
        `batch_size cannot be greater than ${MAX_UPLOAD_BATCH_SIZE}`,
      );
    }

    if (
      (filePath && (folderPath || url)) ||
      (folderPath && (filePath || url)) ||
      (url && (filePath || folderPath))
    ) {
      throw new UserError(
        "Only one of file_path, folder_path, or url can be specified.",
      );
    }

    const documents = load_documents({
      file_path: filePath,
      folder_path: folderPath,
      url,
    });

    const text_chunks: string[] = [];
    const metadata_list: object[] = [];

    for (const doc of documents) {
      let doc_i = 0;
      const cur_text_chunks = split_document({
        text: doc.text,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        ...kwargs,
      });
      text_chunks.push(...cur_text_chunks);
      metadata_list.push(...Array(cur_text_chunks.length).fill(doc.metadata));
      if (text_chunks.length > batchSize) {
        for (let idx = 0; idx < text_chunks.length; idx += batchSize) {
          if (idx + batchSize > text_chunks.length) {
            continue;
          }
          const batch_texts = text_chunks.slice(idx, idx + batchSize);
          const batch_ids = Array(batchSize)
            .fill(null)
            .map(() => uuidv4());
          const batch_metadatas = metadata_list.slice(idx, idx + batchSize);
          const meta_list = batch_metadatas.map((meta: any) => {
            const meta_struct = new Struct();
            meta_struct.update(meta);
            meta_struct.update({ doc_chunk_no: doc_i });
            if (metadata && typeof metadata === "object") {
              meta_struct.update(metadata);
            }
            doc_i += 1;
            return meta_struct;
          });
          const input_batch = batch_texts.map((text: string, i: number) => {
            return this.app.inputs().get_text_input({
              input_id: batch_ids[i],
              raw_text: text,
              dataset_id: datasetId,
              metadata: meta_list[i],
            });
          });
          this.app.inputs().upload_inputs({ inputs: input_batch });
          text_chunks.splice(idx, batchSize);
          metadata_list.splice(idx, batchSize);
        }
      }
    }

    if (text_chunks.length > 0) {
      const batch_size = text_chunks.length;
      const batch_ids = Array(batch_size)
        .fill(null)
        .map(() => uuidv4());
      const batch_metadatas = metadata_list.slice(0, batch_size);
      const meta_list = batch_metadatas.map((meta: any) => {
        const meta_struct = new Struct();
        meta_struct.update(meta);
        meta_struct.update({ doc_chunk_no: doc_i });
        if (metadata && typeof metadata === "object") {
          meta_struct.update(metadata);
        }
        doc_i += 1;
        return meta_struct;
      });
      const input_batch = text_chunks.map((text: string, i: number) => {
        return this.app.inputs().get_text_input({
          input_id: batch_ids[i],
          raw_text: text,
          dataset_id: datasetId,
          metadata: meta_list[i],
        });
      });
      this.app.inputs().upload_inputs({ inputs: input_batch });
      text_chunks.splice(0, batch_size);
      metadata_list.splice(0, batch_size);
    }
  }

  chat(
    messages: { role: string; content: string }[],
    client_manage_state: boolean = false,
  ): { role: string; content: string }[] {
    if (client_manage_state) {
      const single_prompt = convert_messages_to_str(messages);
      const input_proto = Inputs._get_proto("", "", {
        text_pb: new resources_pb2.Text({ raw: single_prompt }),
      });
      const response = this.promptWorkflow.predict([input_proto]);
      messages.push(
        format_assistant_message(response.results[0].outputs[-1].data.text.raw),
      );
      return messages;
    }

    const message = messages[messages.length - 1].content;
    if (message.length === 0) {
      throw new UserError("Empty message supplied.");
    }

    const chat_state_id = RAG.chatStateId !== null ? RAG.chatStateId : "init";
    const input_proto = Inputs._get_proto("", "", {
      text_pb: new resources_pb2.Text({ raw: message }),
    });
    const response = this.promptWorkflow.predict([input_proto], {
      workflow_state_id: chat_state_id,
    });

    RAG.chatStateId = response.workflow_state.id;
    return [
      format_assistant_message(response.results[0].outputs[-1].data.text.raw),
    ];
  }
}
