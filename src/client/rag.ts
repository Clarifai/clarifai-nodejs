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
import compact from "lodash/compact";

const DEFAULT_RAG_PROMPT_TEMPLATE =
  "Context information is below:\n{data.hits}\nGiven the context information and not prior knowledge, answer the query.\nQuery: {data.text.raw}\nAnswer: ";

type UrlAuthConfig = Omit<AuthConfig, "userId" | "appId"> & {
  appId?: undefined;
  userId?: undefined;
};

type RAGConfigWithURL = {
  workflowUrl: ClarifaiUrl;
  workflow?: undefined;
  authConfig?: UrlAuthConfig;
};

type RAGConfigWithWorkflow = {
  workflowUrl?: undefined;
  workflow: Workflow;
  authConfig?: AuthConfig;
};

type RAGConfig = RAGConfigWithURL | RAGConfigWithWorkflow;

type workflowSchema = ReturnType<typeof validateWorkflow>;

const authConfigGuard = (
  authConfig: AuthConfig | UrlAuthConfig | undefined,
): authConfig is AuthConfig => {
  if (authConfig?.appId && authConfig?.userId) {
    return true;
  }
  return false;
};

export class RAG {
  private authConfig: AuthConfig;

  public promptWorkflow: Workflow;

  public app: App;

  constructor({ workflowUrl, workflow, authConfig }: RAGConfig) {
    this.validateInputs(workflowUrl, workflow, authConfig);
    if (!authConfig || authConfigGuard(authConfig)) {
      const targetAuthConfig: AuthConfig = authConfig ?? {};
      this.authConfig = targetAuthConfig;
      this.promptWorkflow = workflow as Workflow;
    } else {
      console.info("workflow_url:%s", workflowUrl);
      const [userId, appId, , ,] = ClarifaiUrlHelper.splitClarifaiUrl(
        workflowUrl as ClarifaiUrl,
      );
      const w = new Workflow({
        url: workflowUrl as ClarifaiUrl,
        authConfig: authConfig,
      });
      const targetAuthConfig: AuthConfig = { ...authConfig, appId, userId };
      this.authConfig = targetAuthConfig;
      this.promptWorkflow = w;
    }
    this.app = new App({ authConfig: this.authConfig });
  }

  private validateInputs(
    workflowUrl?: string,
    workflow?: Workflow,
    authConfig?: AuthConfig | UrlAuthConfig,
  ) {
    if (workflowUrl && workflow) {
      throw new UserError(
        "Only one of workflowUrl or workflow can be specified.",
      );
    }
    if (!workflowUrl && !workflow) {
      throw new UserError("One of workflowUrl or workflow must be specified.");
    }
    if (workflowUrl && (authConfig?.userId || authConfig?.appId)) {
      throw new UserError(
        "userId and appId should not be specified in authConfig when using workflowUrl.",
      );
    }
  }

  static async setup({
    authConfig,
    appUrl,
    llmUrl = "https://clarifai.com/mistralai/completion/models/mistral-7B-Instruct",
    baseWorkflow = "Universal",
    workflowYamlFilename = "prompter_wf.yaml",
    promptTemplate = DEFAULT_RAG_PROMPT_TEMPLATE,
    workflowId,
    minScore = 0.95,
    maxResults = 5,
  }: {
    authConfig?:
      | (Omit<AuthConfig, "appId"> & { appId?: undefined })
      | AuthAppConfig;
    appUrl?: ClarifaiAppUrl;
    llmUrl?: ClarifaiUrl;
    baseWorkflow?: string;
    workflowYamlFilename?: string;
    promptTemplate?: string;
    workflowId?: string;
    minScore?: number;
    maxResults?: number;
  }): Promise<RAG> {
    const { userId, appId: appIdFromConfig } = authConfig ?? {};

    // Since user ID & App ID can be generated in different ways, we need to keep track of the generated ones
    let targetAppId: string = "",
      targetUserId: string = "";

    if (userId && appUrl) {
      throw new UserError("Must provide one of userId or appUrl, not both.");
    }

    if (appIdFromConfig && appUrl) {
      throw new UserError("Must provide one of appId or appUrl, not both.");
    }

    if (!userId && !appUrl) {
      throw new UserError(
        "userId or appUrl must be provided. The userId can be found at https://clarifai.com/settings.",
      );
    }

    const [llmUserId, llmAppId, resourceType, llmId] =
      ClarifaiUrlHelper.splitClarifaiUrl(llmUrl);

    if (resourceType !== "models") {
      throw new UserError("llmUrl must be a model URL.");
    }

    const nowTs = Date.now().toString();

    let app: App;

    if (userId && !appUrl) {
      const generatedAppId = `rag_app_${nowTs}`;

      // User ID is present, construct the authconfig using the generated APP ID
      const userAuthConfig: AuthConfig = {
        ...(authConfig as Omit<AuthConfig, "appId"> & { appId?: undefined }),
        appId: generatedAppId,
      };

      const user = new User(userAuthConfig);
      await user.createApp({
        appId: generatedAppId,
        baseWorkflow: baseWorkflow,
      });
      app = new App({
        authConfig: userAuthConfig,
      });

      targetAppId = generatedAppId;
      targetUserId = userId;
    }

    if (!userId && appUrl) {
      app = new App({
        url: appUrl,
        authConfig: authConfig as AuthAppConfig,
      });
      const [userIdFromAppUrl, appIdFromAppUrl] =
        ClarifaiUrlHelper.splitClarifaiAppUrl(appUrl);
      targetAppId = appIdFromAppUrl;
      targetUserId = userIdFromAppUrl;
    }

    let targetAuthConfig: AuthConfig;

    if (authConfig) {
      targetAuthConfig = {
        ...authConfig,
        appId: targetAppId,
        userId: targetUserId,
      };
    } else {
      targetAuthConfig = {
        appId: targetAppId,
        userId: targetUserId,
        pat: process.env.CLARIFAI_PAT!,
      };
    }

    const params = Struct.fromJavaScript({
      min_score: minScore,
      max_results: maxResults,
      prompt_template: promptTemplate,
    });

    const outputInfo = new OutputInfo().setParams(params);

    const modelId = workflowId
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
      authConfig: targetAuthConfig,
      modelId: prompterModelObj.id,
    });
    const prompterModelWithVersion = await prompterModel.createVersion(
      new ModelVersion().setOutputInfo(outputInfo),
    );
    if (!prompterModelWithVersion?.id) {
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
              modelId: prompterModelWithVersion.id,
              modelVersionId: prompterModelWithVersion?.modelVersion?.id,
            },
          },
          {
            id: "llm",
            model: {
              modelId: llmId,
              userId: llmUserId,
              appId: llmAppId,
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
      authConfig: targetAuthConfig,
    });
    return new RAG({ workflow, authConfig: targetAuthConfig });
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
      const curTextChunks = compact(
        splitDocument({
          text: doc.text,
          chunkSize,
          chunkOverlap,
        }),
      );
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
      const inputBatch = textChunks.map((text: string, i: number) => {
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
      textChunks.splice(0, batchSize);
      metadataList.splice(0, batchSize);
    }
  }

  async chat({
    messages,
    clientManageState = true, // TODO: change to false once Server Side state management is implemented
  }: {
    messages: Message[];
    clientManageState?: boolean;
  }): Promise<Message[]> {
    if (!clientManageState) {
      throw new Error(
        "Server side state management is not supported yet - work in progress",
      );
    }

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
}
