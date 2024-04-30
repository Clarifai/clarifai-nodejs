import {
  DeleteModelVersionRequest,
  GetModelRequest,
  ListModelTypesRequest,
  ListModelVersionsRequest,
  MultiModelVersionResponse,
  MultiOutputResponse,
  PostModelOutputsRequest,
  PostModelVersionsRequest,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { UserError } from "../errors";
import { ClarifaiUrl, ClarifaiUrlHelper } from "../urls/helper";
import { BackoffIterator, promisifyGrpcCall } from "../utils/misc";
import { AuthConfig } from "../utils/types";
import { Lister } from "./lister";
import {
  Model as GrpcModel,
  Input as GrpcInput,
  ModelVersion,
  OutputConfig,
  OutputInfo,
  UserAppIDSet,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
import {
  MAX_MODEL_PREDICT_INPUTS,
  TRAINABLE_MODEL_TYPES,
} from "../constants/model";
import {
  findAndReplaceKey,
  responseToModelParams,
  responseToParamInfo,
  responseToTemplates,
} from "../utils/modelTrain";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { Input } from "./input";
import {
  JavaScriptValue,
  Struct,
} from "google-protobuf/google/protobuf/struct_pb";
import { logger } from "../utils/logging";

interface BaseModelConfig {
  modelVersion?: { id: string };
  modelUserAppId?: {
    userId: string;
    appId: string;
  };
}

interface ModelConfigWithUrl extends BaseModelConfig {
  url: ClarifaiUrl;
  modelId?: undefined;
  authConfig?: Omit<AuthConfig, "userId" | "appId">;
}

interface ModelConfigWithModelId extends BaseModelConfig {
  url?: undefined;
  modelId: string;
  authConfig?: AuthConfig;
}

type ModelConfig = ModelConfigWithUrl | ModelConfigWithModelId;

/**
 * Model is a class that provides access to Clarifai API endpoints related to Model information.
 * @noInheritDoc
 */
export class Model extends Lister {
  private appId: string;
  private id: string;
  private modelUserAppId: UserAppIDSet | undefined;
  private modelVersion: { id: string } | undefined;
  public modelInfo: GrpcModel;
  private trainingParams: Record<string, unknown>;

  /**
   * Initializes a Model object.
   *
   * @param url - The URL to initialize the model object.
   * @param modelId - The Model ID to interact with.
   * @param modelVersion - The Model Version to interact with.
   * @param authConfig - Authentication configuration options.
   * @param authConfig.baseURL - Base API URL. Default is "https://api.clarifai.com".
   * @param authConfig.pat - A personal access token for authentication. Can be set as env var CLARIFAI_PAT.
   * @param authConfig.token - A session token for authentication. Accepts either a session token or a pat. Can be set as env var CLARIFAI_SESSION_TOKEN.
   *
   * @includeExample examples/model/index.ts
   */
  constructor({
    url,
    modelId,
    modelVersion,
    authConfig = {},
    modelUserAppId,
  }: ModelConfig) {
    if (url && modelId) {
      throw new UserError("You can only specify one of url or model_id.");
    }
    if (!url && !modelId) {
      throw new UserError("You must specify one of url or model_id.");
    }
    let modelIdFromUrl;

    let authConfigFromUrl: AuthConfig | undefined;
    if (url) {
      const [userId, appId, destructuredModelId, modelVersionId] =
        ClarifaiUrlHelper.splitClarifaiUrl(url);
      modelIdFromUrl = destructuredModelId;
      if (modelVersion) {
        modelVersion.id = modelVersionId;
      } else {
        modelVersion = { id: modelVersionId };
      }
      authConfigFromUrl = {
        ...(authConfig as Omit<AuthConfig, "userId" | "appId">),
        userId,
        appId,
      };
    }

    super({ authConfig: authConfigFromUrl || (authConfig as AuthConfig) });
    this.appId = authConfigFromUrl?.appId ?? (authConfig as AuthConfig)?.appId;
    this.modelVersion = modelVersion;
    this.id = (modelIdFromUrl || modelId) as string;
    this.modelInfo = new GrpcModel();
    const grpcModelVersion = new ModelVersion();
    if (this.modelVersion) {
      grpcModelVersion.setId(this.modelVersion.id);
    }
    if (this.appId) this.modelInfo.setAppId(this.appId);
    if (this.id) this.modelInfo.setId(this.id);
    if (this.modelVersion) this.modelInfo.setModelVersion(grpcModelVersion);
    this.trainingParams = {};
    if (modelUserAppId) {
      this.modelUserAppId = new UserAppIDSet()
        .setAppId(modelUserAppId.appId)
        .setUserId(modelUserAppId.userId);
    }
  }

  /**
   * Loads the current model info.
   * Usually called internally by other methods, to ensure the model info is loaded with latest data.
   */
  async loadInfo() {
    const getModel = promisifyGrpcCall(
      this.STUB.client.getModel,
      this.STUB.client,
    );
    const request = new GetModelRequest();
    if (this.modelUserAppId) {
      request.setUserAppId(this.modelUserAppId);
    } else {
      request.setUserAppId(this.userAppId);
    }
    request.setModelId(this.id);
    if (this.modelVersion?.id) request.setVersionId(this.modelVersion.id);

    const response = await this.grpcRequest(getModel, request);
    const responseObject = response.toObject();

    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(
        `Failed to get model: ${responseObject.status} : ${responseObject.status?.description}`,
      );
    }

    this.modelInfo = new GrpcModel();
    if (responseObject.model?.id) {
      this.modelInfo.setId(responseObject.model?.id);
    }
    if (responseObject.model?.appId) {
      this.modelInfo.setAppId(responseObject.model?.id);
    }
    const grpcModelVersion = new ModelVersion();
    if (responseObject.model?.modelVersion?.id) {
      grpcModelVersion.setId(responseObject.model?.modelVersion?.id);
    }
    this.modelInfo.setModelVersion(grpcModelVersion);
  }

  /**
   * Lists all the training templates for the model type.
   * @returns - A promise that resolves to a list of training templates for the model type.
   *
   * @includeExample examples/model/listTrainingTemplates.ts
   */
  async listTrainingTemplates(): Promise<string[]> {
    if (!this.modelInfo.getModelTypeId()) {
      await this.loadInfo();
    }
    if (!TRAINABLE_MODEL_TYPES.includes(this.modelInfo.getModelTypeId())) {
      throw new Error(
        `Model type ${this.modelInfo.getModelTypeId()} is not trainable`,
      );
    }

    const request = new ListModelTypesRequest();
    if (this.modelUserAppId) {
      request.setUserAppId(this.modelUserAppId);
    } else {
      request.setUserAppId(this.userAppId);
    }

    const listModelTypes = promisifyGrpcCall(
      this.STUB.client.listModelTypes,
      this.STUB.client,
    );

    const response = await this.grpcRequest(listModelTypes, request);
    const responseObject = response.toObject();

    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.toString());
    }

    const templates = responseToTemplates(
      responseObject,
      this.modelInfo.getModelTypeId(),
    );

    return templates;
  }

  /**
   * Returns the model params for the model type as object & also writes to a yaml file
   * @param template - The training template to use for the model type.
   * @param saveTo - The file path to save the yaml file.
   * @returns - A promise that resolves to the model params for the model type.
   *
   * @includeExample examples/model/getParams.ts
   */
  async getParams(
    template: string | null = null,
    saveTo: string = "params.yaml",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<Record<string, any>> {
    if (!this.modelInfo.getModelTypeId()) {
      await this.loadInfo();
    }
    if (!TRAINABLE_MODEL_TYPES.includes(this.modelInfo.getModelTypeId())) {
      throw new Error(
        `Model type ${this.modelInfo.getModelTypeId()} is not trainable`,
      );
    }
    if (
      template === null &&
      !["clusterer", "embedding-classifier"].includes(
        this.modelInfo.getModelTypeId(),
      )
    ) {
      throw new Error(
        `Template should be provided for ${this.modelInfo.getModelTypeId()} model type`,
      );
    }
    if (
      template !== null &&
      ["clusterer", "embedding-classifier"].includes(
        this.modelInfo.getModelTypeId(),
      )
    ) {
      throw new Error(
        `Template should not be provided for ${this.modelInfo.getModelTypeId()} model type`,
      );
    }

    const request = new ListModelTypesRequest();
    if (this.modelUserAppId) {
      request.setUserAppId(this.modelUserAppId);
    } else {
      request.setUserAppId(this.userAppId);
    }

    const listModelTypes = promisifyGrpcCall(
      this.STUB.client.listModelTypes,
      this.STUB.client,
    );

    const response = await this.grpcRequest(listModelTypes, request);
    const responseObject = response.toObject();

    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.toString());
    }

    const params = responseToModelParams(
      responseObject,
      this.modelInfo.getModelTypeId(),
      template,
    );

    // yaml file
    if (!saveTo.endsWith(".yaml")) {
      throw new Error("File extension should be .yaml");
    }

    fs.writeFileSync(saveTo, yaml.dump(params, { noRefs: true }));

    this.trainingParams = { ...this.trainingParams, ...params };

    return params;
  }

  /**
   * Updates the model params for the model.
   * @param modelParams - The model params to update.
   *
   * @includeExample examples/model/updateParams.ts
   */
  updateParams(modelParams: Record<string, unknown>): void {
    if (!TRAINABLE_MODEL_TYPES.includes(this.modelInfo.getModelTypeId())) {
      throw new UserError(
        `Model type ${this.modelInfo.getModelTypeId()} is not trainable`,
      );
    }
    if (Object.keys(this.trainingParams).length === 0) {
      throw new UserError(
        `Run 'model.getParams' to get the params for the ${this.modelInfo.getModelTypeId()} model type`,
      );
    }
    const allKeys = [
      ...Object.keys(this.trainingParams),
      ...Object.values(this.trainingParams)
        .filter((value) => typeof value === "object")
        .flatMap((value) => Object.keys(value as Record<string, unknown>)),
    ];
    if (!Object.keys(modelParams).every((key) => allKeys.includes(key))) {
      throw new UserError("Invalid params");
    }
    for (const [key, value] of Object.entries(modelParams)) {
      findAndReplaceKey(this.trainingParams, key, value);
    }
  }

  /**
   * Returns the param info for the model.
   *
   * @includeExample examples/model/getParamInfo.ts
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getParamInfo(param: string): Promise<Record<string, any>> {
    if (!TRAINABLE_MODEL_TYPES.includes(this.modelInfo.getModelTypeId())) {
      throw new UserError(
        `Model type ${this.modelInfo.getModelTypeId()} is not trainable`,
      );
    }
    if (Object.keys(this.trainingParams).length === 0) {
      throw new UserError(
        `Run 'model.getParams' to get the params for the ${this.modelInfo.getModelTypeId()} model type`,
      );
    }

    const allKeys = [
      ...Object.keys(this.trainingParams),
      ...Object.values(this.trainingParams)
        .filter((value) => typeof value === "object")
        .flatMap((value) => Object.keys(value as Record<string, unknown>)),
    ];
    if (!allKeys.includes(param)) {
      throw new UserError(
        `Invalid param: '${param}' for model type '${this.modelInfo.getModelTypeId()}'`,
      );
    }
    const template =
      // @ts-expect-error - train_params isn't typed yet
      this.trainingParams?.["train_params"]?.["template"] ?? null;

    const request = new ListModelTypesRequest();
    if (this.modelUserAppId) {
      request.setUserAppId(this.modelUserAppId);
    } else {
      request.setUserAppId(this.userAppId);
    }

    const listModelTypes = promisifyGrpcCall(
      this.STUB.client.listModelTypes,
      this.STUB.client,
    );

    const response = await this.grpcRequest(listModelTypes, request);
    const responseObject = response.toObject();

    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.toString());
    }
    const paramInfo = responseToParamInfo(
      responseObject,
      this.modelInfo.getModelTypeId(),
      param,
      template,
    );

    if (!paramInfo) {
      throw new Error("Failed to fetch params info");
    }

    return paramInfo;
  }

  /**
   * Deletes a model version for the Model.
   *
   * @param versionId - The version ID to delete.
   *
   * @includeExample examples/model/deleteVersion.ts
   */
  async deleteVersion(versionId: string): Promise<void> {
    const request = new DeleteModelVersionRequest();
    if (this.modelUserAppId) {
      request.setUserAppId(this.modelUserAppId);
    } else {
      request.setUserAppId(this.userAppId);
    }
    request.setModelId(this.id);
    request.setVersionId(versionId);

    const deleteModelVersion = promisifyGrpcCall(
      this.STUB.client.deleteModelVersion,
      this.STUB.client,
    );

    const response = await this.grpcRequest(deleteModelVersion, request);

    const responseObject = response.toObject();

    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.toString());
    }
  }

  /**
   * Creates a model version for the Model.
   *
   * @includeExample examples/model/createVersion.ts
   */
  async createVersion(
    modelVersion: ModelVersion,
  ): Promise<GrpcModel.AsObject | undefined> {
    if (this.modelInfo.getModelTypeId() in TRAINABLE_MODEL_TYPES) {
      throw new UserError(
        `${this.modelInfo.getModelTypeId()} is a trainable model type. Use 'model.train()' to train the model`,
      );
    }

    const request = new PostModelVersionsRequest();
    if (this.modelUserAppId) {
      request.setUserAppId(this.modelUserAppId);
    } else {
      request.setUserAppId(this.userAppId);
    }
    request.setModelId(this.id);
    request.setModelVersionsList([modelVersion]);

    const postModelVersions = promisifyGrpcCall(
      this.STUB.client.postModelVersions,
      this.STUB.client,
    );

    const response = await this.grpcRequest(postModelVersions, request);

    const responseObject = response.toObject();

    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }

    return responseObject.model;
  }

  /**
   * Lists all the versions for the model.
   *
   * @includeExample examples/model/listVersions.ts
   *
   * @remarks
   * Defaults to 16 per page if pageNo is not specified
   */
  async *listVersions({
    pageNo,
    perPage,
  }: {
    pageNo?: number;
    perPage?: number;
  } = {}): AsyncGenerator<
    MultiModelVersionResponse.AsObject["modelVersionsList"],
    void,
    void
  > {
    const request = new ListModelVersionsRequest();
    if (this.modelUserAppId) {
      request.setUserAppId(this.modelUserAppId);
    } else {
      request.setUserAppId(this.userAppId);
    }
    request.setModelId(this.id);

    const listModelVersions = promisifyGrpcCall(
      this.STUB.client.listModelVersions,
      this.STUB.client,
    );

    const allModelVersionsInfo = this.listPagesGenerator(
      listModelVersions,
      request,
      perPage,
      pageNo,
    );

    for await (const modelVersionInfo of allModelVersionsInfo) {
      yield modelVersionInfo.toObject().modelVersionsList;
    }
  }

  /**
   * Predicts the model based on the given inputs.
   * Use the `Input` module to create the input objects.
   *
   * @param inputs - The inputs to predict, must be less than 128.
   * @param inferenceParams - The inference params to override.
   * @param outputConfig - The output config to override.
   *  min_value (number) - The minimum value of the prediction confidence to filter.
   *  max_concepts (number) - The maximum number of concepts to return.
   *  select_concepts (Concept[]) - The concepts to select.
   *  sample_ms (number) - The number of milliseconds to sample.
   * @returns - A promise that resolves to the model prediction.
   *
   * @includeExample examples/model/predict.ts
   */
  async predict({
    inputs,
    inferenceParams,
    outputConfig,
  }: {
    inputs: GrpcInput[];
    inferenceParams?: Record<string, JavaScriptValue>;
    outputConfig?: OutputConfig;
  }): Promise<MultiOutputResponse.AsObject["outputsList"]> {
    if (!Array.isArray(inputs)) {
      throw new Error(
        "Invalid inputs, inputs must be an array of Input objects.",
      );
    }
    if (inputs.length > MAX_MODEL_PREDICT_INPUTS) {
      throw new Error(`Too many inputs. Max is ${MAX_MODEL_PREDICT_INPUTS}.`);
    }

    this.overrideModelVersion({ inferenceParams, outputConfig });
    const requestInputs: GrpcInput[] = [];
    for (const input of inputs) {
      requestInputs.push(input);
    }

    const request = new PostModelOutputsRequest();
    if (this.modelUserAppId) {
      request.setUserAppId(this.modelUserAppId);
    } else {
      request.setUserAppId(this.userAppId);
    }
    request.setModelId(this.id);
    if (this.modelVersion && this.modelVersion.id)
      request.setVersionId(this.modelVersion.id);
    request.setInputsList(requestInputs);
    request.setModel(this.modelInfo);

    const startTime = Date.now();
    const backoffIterator = new BackoffIterator();
    return new Promise<MultiOutputResponse.AsObject["outputsList"]>(
      (resolve, reject) => {
        const makeRequest = () => {
          const postModelOutputs = promisifyGrpcCall(
            this.STUB.client.postModelOutputs,
            this.STUB.client,
          );
          this.grpcRequest(postModelOutputs, request)
            .then((response) => {
              const responseObject = response.toObject();
              if (
                responseObject.status?.code === StatusCode.MODEL_DEPLOYING &&
                Date.now() - startTime < 600000
              ) {
                logger.info(
                  `${this.id} model is still deploying, please wait...`,
                );
                setTimeout(makeRequest, backoffIterator.next().value * 1000);
              } else if (responseObject.status?.code !== StatusCode.SUCCESS) {
                reject(
                  new Error(
                    `Model Predict failed with response ${responseObject.status?.toString()}`,
                  ),
                );
              } else {
                resolve(response.toObject().outputsList);
              }
            })
            .catch((error) => {
              reject(
                new Error(`Model Predict failed with error: ${error.message}`),
              );
            });
        };
        makeRequest();
      },
    );
  }

  /**
   * Predicts the model based on the given inputs.
   * Inputs can be provided as a URL.
   * @param url - The URL of the input.
   * @param inputType - The type of the input. Can be "image", "text", "video", or "audio".
   * @param inferenceParams - The inference params to override.
   * @param outputConfig - The output config to override.
   * @returns - A promise that resolves to the model prediction.
   */
  predictByUrl({
    url,
    inputType,
    inferenceParams,
    outputConfig,
  }: {
    url: string;
    inputType: "image" | "text" | "video" | "audio";
    inferenceParams?: Record<string, JavaScriptValue>;
    outputConfig?: OutputConfig;
  }): Promise<MultiOutputResponse.AsObject["outputsList"]> {
    let inputProto: GrpcInput;
    if (inputType === "image") {
      inputProto = Input.getInputFromUrl({ inputId: "", imageUrl: url });
    } else if (inputType === "text") {
      inputProto = Input.getInputFromUrl({ inputId: "", textUrl: url });
    } else if (inputType === "video") {
      inputProto = Input.getInputFromUrl({ inputId: "", videoUrl: url });
    } else if (inputType === "audio") {
      inputProto = Input.getInputFromUrl({ inputId: "", audioUrl: url });
    } else {
      throw new Error(
        `Got input type ${inputType} but expected one of image, text, video, audio.`,
      );
    }

    return this.predict({
      inputs: [inputProto],
      inferenceParams,
      outputConfig,
    });
  }

  /**
   * Predicts the model based on the given inputs.
   * Inputs can be provided as a filepath which can be read.
   * @param filepath - The filepath of the input.
   * @param inputType - The type of the input. Can be "image", "text", "video", or "audio".
   * @param inferenceParams - The inference params to override.
   * @param outputConfig - The output config to override.
   * @returns - A promise that resolves to the model prediction.
   */
  predictByFilepath({
    filepath,
    inputType,
    inferenceParams,
    outputConfig,
  }: {
    filepath: string;
    inputType: "image" | "text" | "video" | "audio";
    inferenceParams?: Record<string, JavaScriptValue>;
    outputConfig?: OutputConfig;
  }): Promise<MultiOutputResponse.AsObject["outputsList"]> {
    if (!fs.existsSync(filepath)) {
      throw new Error("Invalid filepath.");
    }

    const fileBuffer = fs.readFileSync(filepath);

    return this.predictByBytes({
      inputBytes: fileBuffer,
      inputType,
      inferenceParams,
      outputConfig,
    });
  }

  /**
   * Predicts the model based on the given inputs.
   * Inputs can be provided as a Buffer.
   * @param inputBytes - Input as a buffer.
   * @param inputType - The type of the input. Can be "image", "text", "video", or "audio".
   * @param inferenceParams - The inference params to override.
   * @param outputConfig - The output config to override.
   * @returns - A promise that resolves to the model prediction.
   */
  predictByBytes({
    inputBytes,
    inputType,
    inferenceParams,
    outputConfig,
  }: {
    inputBytes: Buffer;
    inputType: "image" | "text" | "video" | "audio";
    inferenceParams?: Record<string, JavaScriptValue>;
    outputConfig?: OutputConfig;
  }): Promise<MultiOutputResponse.AsObject["outputsList"]> {
    if (!(inputBytes instanceof Buffer)) {
      throw new Error("Invalid bytes.");
    }

    let inputProto: GrpcInput;
    if (inputType === "image") {
      inputProto = Input.getInputFromBytes({
        inputId: "",
        imageBytes: inputBytes,
      });
    } else if (inputType === "text") {
      inputProto = Input.getInputFromBytes({
        inputId: "",
        textBytes: inputBytes,
      });
    } else if (inputType === "video") {
      inputProto = Input.getInputFromBytes({
        inputId: "",
        videoBytes: inputBytes,
      });
    } else if (inputType === "audio") {
      inputProto = Input.getInputFromBytes({
        inputId: "",
        audioBytes: inputBytes,
      });
    } else {
      throw new Error(
        `Got input type ${inputType} but expected one of image, text, video, audio.`,
      );
    }

    return this.predict({
      inputs: [inputProto],
      inferenceParams,
      outputConfig,
    });
  }

  /**
   * Overrides the model version.
   *
   * @param inferenceParams - The inference params to override.
   * @param outputConfig - The output config to override.
   *   min_value (number) - The minimum value of the prediction confidence to filter.
   *   max_concepts (number) - The maximum number of concepts to return.
   *   select_concepts (Concept[]) - The concepts to select.
   *   sample_ms (number) - The number of milliseconds to sample.
   */
  private overrideModelVersion({
    inferenceParams,
    outputConfig,
  }: {
    inferenceParams?: Record<string, JavaScriptValue>;
    outputConfig?: OutputConfig;
  }): void {
    let currentModelVersion = this.modelInfo.getModelVersion();
    if (!currentModelVersion) {
      currentModelVersion = new ModelVersion();
    }
    let currentOutputInfo = currentModelVersion?.getOutputInfo();
    if (!currentOutputInfo) {
      currentOutputInfo = new OutputInfo();
    }
    if (outputConfig) {
      const newOutputInfo = currentOutputInfo.setOutputConfig(outputConfig);
      currentModelVersion?.setOutputInfo(newOutputInfo);
      this.modelInfo.setModelVersion(currentModelVersion);
    }
    const updatedModelVersion = this.modelInfo.getModelVersion();
    const updatedOutputInfo = updatedModelVersion?.getOutputInfo();
    if (updatedOutputInfo && inferenceParams) {
      const params = Struct.fromJavaScript(inferenceParams);
      updatedOutputInfo.setParams(params);
      updatedModelVersion?.setOutputInfo(updatedOutputInfo);
      this.modelInfo.setModelVersion(updatedModelVersion);
    }
  }
}
