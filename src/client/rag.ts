import { v4 as uuidv4 } from "uuid";
import { App, AuthAppConfig } from "./app";
import { Workflow } from "./workflow";
import * as fs from "fs";
import yaml from "js-yaml";
import {
  JavaScriptValue,
  Struct,
} from "google-protobuf/google/protobuf/struct_pb";
import { Model } from "./model";
import { User } from "./user";
import { MAX_UPLOAD_BATCH_SIZE } from "../constants/rag";
import { UserError } from "../errors";
import { AuthConfig } from "../utils/types";
import { ClarifaiAppUrl, ClarifaiUrl, ClarifaiUrlHelper } from "../urls/helper";
import {
  ModelVersion,
  OutputInfo,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { validateWorkflow } from "../workflows/validate";
import {
  Message,
  convertMessagesToStr,
  formatAssistantMessage,
  loadDocuments,
  splitDocument,
} from "../rag/utils";
import { Input } from "./input";

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
  private authConfig: AuthConfig;

  private chatStateId: string = "";

  // @ts-expect-error - prompt workflow is definitely assigned in the constructor
  private promptWorkflow: Workflow;

  constructor({ workflowUrl, workflow, authConfig = {} }: RAGConfig) {
    if (workflowUrl && workflow) {
      throw new UserError(
        "Only one of workflowUrl or workflow can be specified.",
      );
    }
    if (!workflowUrl && !workflow) {
      throw new UserError("One of workflowUrl or workflow must be specified.");
    }
    if (workflowUrl) {
      if (authConfig.userId || authConfig.appId) {
        throw new UserError(
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
      authConfig.appId = appId;
      authConfig.userId = userId;
      this.promptWorkflow = w;
    } else if (workflow) {
      this.promptWorkflow = workflow;
    }
    this.authConfig = authConfig as AuthConfig;
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

  async upload({
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
  }): Promise<void> {
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

    const documents = await loadDocuments({
      filePath,
      folderPath,
      url,
    });

    const textChunks: string[] = [];
    const metadataList: Array<Record<string, JavaScriptValue>> = [];
    let docI = 0;

    for (const doc of documents) {
      const curTextChunks = splitDocument({
        text: doc.text,
        chunkSize,
        chunkOverlap,
      });
      textChunks.push(...curTextChunks);
      metadataList.push(...Array(curTextChunks.length).fill(doc.metadata));
      if (textChunks.length > batchSize) {
        for (let idx = 0; idx < textChunks.length; idx += batchSize) {
          if (idx + batchSize > textChunks.length) {
            continue;
          }
          const batchTexts = textChunks.slice(idx, idx + batchSize);
          const batchIds = Array(batchSize)
            .fill(null)
            .map(() => uuidv4());
          const batchMetadatas = metadataList.slice(idx, idx + batchSize);
          const metaList = batchMetadatas.map((meta) => {
            const metaStruct = {
              ...(meta ? meta : {}),
              ...(metadata && typeof metadata === "object" ? metadata : {}),
              docChunkNo: docI,
            };
            docI += 1;
            return metaStruct;
          });
          const inputBatch = batchTexts.map((text: string, i: number) => {
            return Input.getTextInput({
              inputId: batchIds[i],
              rawText: text,
              datasetId: datasetId,
              metadata: metaList[i],
            });
          });
          await new Input({ authConfig: this.authConfig }).uploadInputs({
            inputs: inputBatch,
          });
          textChunks.splice(idx, batchSize);
          metadataList.splice(idx, batchSize);
        }
      }
    }

    if (textChunks.length > 0) {
      const batchSize = textChunks.length;
      const batchIds = Array(batchSize)
        .fill(null)
        .map(() => uuidv4());
      const batchMetadatas = metadataList.slice(0, batchSize);
      const metaList = batchMetadatas.map((meta) => {
        const metaStruct = {
          ...meta,
          ...(metadata && typeof metadata === "object" ? metadata : {}),
          docChunkNo: docI,
        };
        docI += 1;
        return metaStruct;
      });
      const input_batch = textChunks.map((text: string, i: number) => {
        return Input.getTextInput({
          inputId: batchIds[i],
          rawText: text,
          datasetId: datasetId,
          metadata: metaList[i],
        });
      });
      await new Input({ authConfig: this.authConfig }).uploadInputs({
        inputs: input_batch,
      });
      textChunks.splice(0, batchSize);
      metadataList.splice(0, batchSize);
    }
  }

  async chat({
    messages,
    clientManageState = false,
  }: {
    messages: Message[];
    clientManageState?: boolean;
  }): Promise<Message[]> {
    if (clientManageState) {
      const singlePrompt = convertMessagesToStr(messages);
      const inputProto = Input.getTextInput({
        inputId: uuidv4(),
        rawText: singlePrompt,
      });
      const response = await this.promptWorkflow.predict({
        inputs: [inputProto],
      });
      const outputsList = response.resultsList?.[0]?.outputsList;
      const output = outputsList[outputsList.length - 1];
      messages.push(formatAssistantMessage(output?.data?.text?.raw ?? ""));
      return messages;
    }

    // Server side chat state management
    const message = messages[messages.length - 1].content;
    if (!message.length) {
      throw new UserError("Empty message supplied.");
    }

    const chatStateId = this.chatStateId !== null ? this.chatStateId : "init";
    const inputProto = Input.getTextInput({
      inputId: uuidv4(),
      rawText: message,
    });
    const response = await this.promptWorkflow.predict({
      inputs: [inputProto],
      workflowStateId: chatStateId,
    });

    this.chatStateId = response.workflowState?.id ?? "";
    const outputsList = response.resultsList?.[0]?.outputsList;
    const output = outputsList[outputsList.length - 1];
    return [formatAssistantMessage(output?.data?.text?.raw ?? "")];
  }
}
