import service_pb from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
const {
  DeleteModelVersionRequest,
  GetModelRequest,
  ListModelTypesRequest,
  ListModelVersionsRequest,
  PostModelOutputsRequest,
  PostModelVersionsRequest,
} = service_pb;
import { UserError } from "../errors";
import { ClarifaiUrl, ClarifaiUrlHelper } from "../urls/helper";
import { BackoffIterator, promisifyGrpcCall } from "../utils/misc";
import { AuthConfig } from "../utils/types";
import { Lister } from "./lister";
import resources_pb from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
const {
  Model: GrpcModel,
  Input: GrpcInput,
  ModelVersion,
  OutputInfo,
  UserAppIDSet,
  Data,
  RunnerSelector,
} = resources_pb;
import status_code_pb from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
const { StatusCode } = status_code_pb;
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
import struct_pb from "google-protobuf/google/protobuf/struct_pb.js";
const { Struct } = struct_pb;
import clarifai_nodejs_grpc from "clarifai-nodejs-grpc";
const { grpc } = clarifai_nodejs_grpc;
import { constructPartsFromParams } from "../utils/setPartsFromParams";
import { validateMethodSignaturesList } from "../utils/validateMethodSignaturesList";
import { extractPayloadAndParams } from "../utils/extractPayloadAndParams";
import { constructPartsFromPayload } from "../utils/constructPartsFromPayload";
import {
  Subset,
  fromPartialProtobufObject,
} from "../utils/fromPartialProtobufObject";

interface BaseModelConfig {
  modelVersion?: { id: string };
  runner?: Subset<resources_pb.RunnerSelector.AsObject>;
}

interface ModelConfigWithUrl extends BaseModelConfig {
  url: ClarifaiUrl;
  modelId?: undefined;
  authConfig?: Omit<AuthConfig, "userId" | "appId">;
  modelUserAppId?: undefined;
}

interface ModelConfigWithModelId extends BaseModelConfig {
  url?: undefined;
  modelId: string;
  authConfig?: AuthConfig;
  modelUserAppId?: {
    userId: string;
    appId: string;
  };
}

type ModelConfig = ModelConfigWithUrl | ModelConfigWithModelId;

interface GeneralModelPredictConfig {
  inputs: resources_pb.Input[];
  inferenceParams?: Record<string, struct_pb.JavaScriptValue>;
  outputConfig?: resources_pb.OutputConfig;
}

type TextModelPredictConfig = {
  methodName: string;
} & Record<string, unknown>;

type ModelPredictConfig = GeneralModelPredictConfig | TextModelPredictConfig;

const isTextModelPredictConfig = (
  config: ModelPredictConfig,
): config is TextModelPredictConfig => {
  return (
    typeof config === "object" &&
    config !== null &&
    // @ts-expect-error - methodName check needed for the type guard
    typeof config.methodName === "string"
  );
};

const isModelConfigWithUrl = (
  config: ModelConfig,
): config is ModelConfigWithUrl => {
  return (config as ModelConfigWithUrl).url !== undefined;
};

/**
 * Model is a class that provides access to Clarifai API endpoints related to Model information.
 * @noInheritDoc
 */
export class Model extends Lister {
  private appId: string;
  private id: string;
  private modelUserAppId: resources_pb.UserAppIDSet | undefined;
  private modelVersion: { id: string } | undefined;
  public modelInfo: resources_pb.Model;
  private trainingParams: Record<string, unknown>;
  private runner: resources_pb.RunnerSelector | undefined;

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
  constructor(config: ModelConfig) {
    const { modelId, modelVersion, modelUserAppId } = config;
    if (config.url && config.modelId) {
      throw new UserError("You can only specify one of url or model_id.");
    }
    if (config.url && modelUserAppId) {
      throw new UserError("You can only specify one of url or modelUserAppId.");
    }
    if (!config.url && !config.modelId) {
      throw new UserError("You must specify one of url or model_id.");
    }

    let _authConfig: AuthConfig,
      _destructuredModelId: string = "",
      _destructuredModelVersionId: string | undefined = undefined;
    if (isModelConfigWithUrl(config)) {
      const { url } = config;
      const [userId, appId] = ClarifaiUrlHelper.splitClarifaiUrl(url);
      [, , , _destructuredModelId, _destructuredModelVersionId] =
        ClarifaiUrlHelper.splitClarifaiUrl(url);
      _authConfig = config.authConfig
        ? {
            ...config.authConfig,
            userId,
            appId,
          }
        : {
            userId,
            appId,
            pat: process.env.CLARIFAI_PAT!,
          };
    } else {
      // if authconfig is undefined, we pick the values from env
      _authConfig = config.authConfig || {
        pat: process.env.CLARIFAI_PAT!,
        userId: process.env.CLARIFAI_USER_ID!,
        appId: process.env.CLARIFAI_APP_ID!,
      };
    }

    super({ authConfig: _authConfig });
    this.appId = _authConfig.appId;
    this.modelVersion =
      modelVersion ||
      (_destructuredModelVersionId
        ? { id: _destructuredModelVersionId }
        : undefined);
    this.id = modelId || _destructuredModelId;
    this.modelInfo = new GrpcModel();
    const grpcModelVersion = new ModelVersion();
    if (this.modelVersion) {
      grpcModelVersion.setId(this.modelVersion.id);
    }
    this.modelInfo.setAppId(this.appId);
    this.modelInfo.setId(this.id);
    if (this.modelVersion) {
      this.modelInfo.setModelVersion(grpcModelVersion);
    }
    this.trainingParams = {};
    this.modelUserAppId = new UserAppIDSet()
      .setAppId(_authConfig.appId)
      .setUserId(_authConfig.userId);
    if (config.runner) {
      this.setRunner(config.runner);
    }
  }

  /**
   * Sets the runner for the model.
   */
  setRunner(runner: Subset<resources_pb.RunnerSelector.AsObject>): void {
    if (this.modelUserAppId?.getUserId()) {
      if (runner.deployment) {
        if (!runner.deployment.userId) {
          runner = {
            ...runner,
            deployment: {
              ...runner.deployment,
              userId: this.modelUserAppId.getUserId(),
            },
          };
        }
      } else {
        runner = {
          ...runner,
          deployment: {
            userId: this.modelUserAppId.getUserId(),
          },
        };
      }
    }
    this.runner = fromPartialProtobufObject(RunnerSelector, runner);
  }

  /**
   * Returns the runner for the model.
   * @returns - The runner for the model.
   */
  getRunner(): resources_pb.RunnerSelector.AsObject | undefined {
    return this.runner?.toObject();
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
        `Failed to get model: ${responseObject.status?.code} : ${responseObject.status?.description}`,
        {
          cause: responseObject,
        },
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
    this.modelInfo
      .getModelVersion()
      ?.setMethodSignaturesList(
        response.getModel()?.getModelVersion()?.getMethodSignaturesList() ?? [],
      );
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }
  }

  /**
   * Creates a model version for the Model.
   *
   * @includeExample examples/model/createVersion.ts
   */
  async createVersion(
    modelVersion: resources_pb.ModelVersion,
  ): Promise<resources_pb.Model.AsObject | undefined> {
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
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
    service_pb.MultiModelVersionResponse.AsObject["modelVersionsList"],
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

  async methodSignatures(): Promise<resources_pb.MethodSignature.AsObject[]> {
    if (!this.modelInfo.toObject().modelVersion?.methodSignaturesList)
      await this.loadInfo();

    const methodSignatures =
      this.modelInfo.toObject().modelVersion?.methodSignaturesList;

    if (!methodSignatures) {
      throw new Error(
        `Model ${this.id} is incompatible with the new interface`,
      );
    }

    return methodSignatures;
  }

  static getOutputDataFromModelResponse(
    outputs: resources_pb.Output.AsObject[],
  ): resources_pb.Data.AsObject | undefined {
    return outputs?.[0]?.data?.partsList?.[0]?.data;
  }

  async availableMethods(): Promise<string[]> {
    if (!this.modelInfo.toObject().modelVersion?.methodSignaturesList)
      await this.loadInfo();

    const methodSignatures =
      this.modelInfo.toObject().modelVersion?.methodSignaturesList;

    if (!methodSignatures) {
      throw new Error(
        `Model ${this.id} is incompatible with the new interface`,
      );
    }

    return methodSignatures.map((each) => each.name);
  }

  private async constructRequestWithMethodSignature(
    request: service_pb.PostModelOutputsRequest,
    config: TextModelPredictConfig,
  ): Promise<service_pb.PostModelOutputsRequest> {
    if (!this.modelInfo.toObject().modelVersion?.methodSignaturesList)
      await this.loadInfo();

    const { methodName, ...otherParams } = config;

    const modelInfoObject = this.modelInfo.toObject();

    const methodSignatures =
      modelInfoObject?.modelVersion?.methodSignaturesList;

    if (!methodSignatures) {
      throw new Error(
        `Model ${this.id} is incompatible with the new interface`,
      );
    }

    const targetMethodSignature = methodSignatures.find((each) => {
      return each.name === methodName;
    });

    if (!targetMethodSignature) {
      throw new Error(
        `Invalid Method: ${methodName}, available methods are ${methodSignatures.map((each) => each.name).join(", ")}`,
      );
    }

    validateMethodSignaturesList(
      otherParams,
      targetMethodSignature?.inputFieldsList ?? [],
    );

    const { params, payload } = extractPayloadAndParams(
      otherParams,
      targetMethodSignature.inputFieldsList,
    );

    const payloadPart = constructPartsFromPayload(
      payload as Record<string, struct_pb.JavaScriptValue>,
      targetMethodSignature.inputFieldsList.filter((each) => !each.isParam),
    );

    const paramsPart = constructPartsFromParams(
      params as Record<string, struct_pb.JavaScriptValue>,
      targetMethodSignature.inputFieldsList.filter((each) => each.isParam),
    );

    if (this.modelUserAppId) {
      request.setUserAppId(this.modelUserAppId);
    } else {
      request.setUserAppId(this.userAppId);
    }
    request.setModelId(this.id);
    if (this.modelVersion && this.modelVersion.id)
      request.setVersionId(this.modelVersion.id);
    request.setModel(this.modelInfo);
    const input = new GrpcInput();
    const requestData = new Data();
    requestData.setMetadata(
      Struct.fromJavaScript({
        _method_name: methodName,
      }),
    );
    requestData.setPartsList([...payloadPart, ...paramsPart]);
    input.setData(requestData);
    request.setInputsList([input]);

    return request;
  }

  /**
   * Predicts the model based on the given inputs.
   * Useful for chat / text based llms
   */
  async predict(
    predictArgs: TextModelPredictConfig,
  ): Promise<service_pb.MultiOutputResponse.AsObject["outputsList"]>;
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
  }: GeneralModelPredictConfig): Promise<
    service_pb.MultiOutputResponse.AsObject["outputsList"]
  >;
  async predict(
    config: ModelPredictConfig,
  ): Promise<service_pb.MultiOutputResponse.AsObject["outputsList"]> {
    let request = new PostModelOutputsRequest();
    if (isTextModelPredictConfig(config)) {
      request = await this.constructRequestWithMethodSignature(request, config);
    } else {
      const { inputs, inferenceParams, outputConfig } = config;
      if (!Array.isArray(inputs)) {
        throw new Error(
          "Invalid inputs, inputs must be an array of Input objects.",
        );
      }
      if (inputs.length > MAX_MODEL_PREDICT_INPUTS) {
        throw new Error(`Too many inputs. Max is ${MAX_MODEL_PREDICT_INPUTS}.`);
      }

      this.overrideModelVersion({ inferenceParams, outputConfig });
      const requestInputs: resources_pb.Input[] = [];
      for (const input of inputs) {
        requestInputs.push(input);
      }

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
    }
    if (this.runner) {
      request.setRunnerSelector(this.runner);
    }
    const startTime = Date.now();
    const backoffIterator = new BackoffIterator();
    return new Promise<service_pb.MultiOutputResponse.AsObject["outputsList"]>(
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
                console.log(
                  `${this.id} model is still deploying, please wait...`,
                );
                setTimeout(makeRequest, backoffIterator.next().value * 1000);
              } else if (responseObject.status?.code !== StatusCode.SUCCESS) {
                reject(
                  new Error(
                    `Model Predict failed with response ${JSON.stringify(responseObject.status)}`,
                    {
                      cause: responseObject,
                    },
                  ),
                );
              } else {
                resolve(response.toObject().outputsList);
              }
            })
            .catch((error) => {
              reject(
                new Error(`Model Predict failed with error: ${error.message}`, {
                  cause: error.cause,
                }),
              );
            });
        };
        makeRequest();
      },
    );
  }

  private async *generateGrpc({
    methodName,
    ...otherParams
  }: TextModelPredictConfig): AsyncGenerator<
    | service_pb.MultiOutputResponse.AsObject
    | ["deploying", service_pb.MultiOutputResponse.AsObject]
  > {
    const request = await this.constructRequestWithMethodSignature(
      new PostModelOutputsRequest(),
      {
        methodName,
        ...otherParams,
      },
    );
    if (this.runner) {
      request.setRunnerSelector(this.runner);
    }

    const metadata = new grpc.Metadata();
    const authMetadata = this.STUB.metadata;
    authMetadata.forEach((meta) => {
      metadata.set(meta?.[0], meta?.[1]);
    });

    const response = this.STUB.client.generateModelOutputs(request, metadata);

    const queue: (
      | service_pb.MultiOutputResponse.AsObject
      | ["deploying", service_pb.MultiOutputResponse.AsObject]
    )[] = [];
    let done = false;
    let error: Error | null = null;
    let resolveNext: (() => void) | null = null;

    response.on("data", (data) => {
      const dataObject =
        data.toObject() as service_pb.MultiOutputResponse.AsObject;
      if (
        dataObject.status?.code === StatusCode.MODEL_DEPLOYING ||
        dataObject.status?.code === StatusCode.MODEL_BUSY_PLEASE_RETRY ||
        dataObject.status?.code === StatusCode.MODEL_LOADING
      ) {
        console.log(`${this.id} model is still deploying, please wait...`);
        queue.push(["deploying", dataObject]);
        resolveNext?.();
      } else if (dataObject.status?.code === StatusCode.SUCCESS) {
        queue.push(dataObject);
        resolveNext?.();
      } else {
        error = new Error(
          `Model Predict failed with response ${dataObject.status?.description}`,
          {
            cause: dataObject,
          },
        );
        resolveNext?.();
      }
    });

    response.on("end", () => {
      done = true;
      resolveNext?.();
    });

    response.on("error", (err) => {
      error = err;
      resolveNext?.();
    });

    while (!done || queue.length > 0) {
      if (error) throw error;

      if (queue.length > 0) {
        yield queue.shift()!;
      } else {
        await new Promise<void>((resolve) => {
          resolveNext = resolve;
        });
        resolveNext = null;
      }
    }
  }

  private streamWithControl({
    methodName,
    ...otherParams
  }: TextModelPredictConfig): {
    send: (request: service_pb.PostModelOutputsRequest) => void;
    end: () => void;
    iterator: AsyncGenerator<
      | service_pb.MultiOutputResponse.AsObject
      | ["deploying", service_pb.MultiOutputResponse.AsObject]
    >;
  } {
    const queue: (
      | service_pb.MultiOutputResponse.AsObject
      | ["deploying", service_pb.MultiOutputResponse.AsObject]
    )[] = [];
    let done = false;
    let error: Error | null = null;
    let resolveNext: (() => void) | null = null;

    const metadata = new grpc.Metadata();
    const authMetadata = this.STUB.metadata;
    authMetadata.forEach((meta) => {
      metadata.set(meta?.[0], meta?.[1]);
    });

    const duplexConnection = this.STUB.client.streamModelOutputs(metadata);

    // Handle incoming messages
    duplexConnection.on("data", (data) => {
      const dataObject =
        data.toObject() as service_pb.MultiOutputResponse.AsObject;
      if (
        dataObject.status?.code === StatusCode.MODEL_DEPLOYING ||
        dataObject.status?.code === StatusCode.MODEL_BUSY_PLEASE_RETRY ||
        dataObject.status?.code === StatusCode.MODEL_LOADING
      ) {
        queue.push(["deploying", dataObject]);
      } else if (dataObject.status?.code === StatusCode.SUCCESS) {
        queue.push(dataObject);
      } else {
        error = new Error(
          `Model Predict failed with response ${dataObject.status?.description}`,
          {
            cause: dataObject,
          },
        );
      }
      resolveNext?.();
    });

    duplexConnection.on("end", () => {
      done = true;
      resolveNext?.();
    });

    duplexConnection.on("error", (err) => {
      error = err;
      resolveNext?.();
    });

    // Async generator to yield responses
    const iterator = (async function* () {
      while (!done || queue.length > 0) {
        if (error) throw error;

        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          await new Promise<void>((resolve) => {
            resolveNext = resolve;
          });
          resolveNext = null;
        }
      }
    })();

    // Construct and send first message
    (async () => {
      const request = await this.constructRequestWithMethodSignature(
        new PostModelOutputsRequest(),
        {
          methodName,
          ...otherParams,
        },
      );
      if (this.runner) {
        request.setRunnerSelector(this.runner);
      }
      duplexConnection.write(request);
    })();

    return {
      send: (req: service_pb.PostModelOutputsRequest) => {
        duplexConnection.write(req);
      },
      end: () => {
        duplexConnection.end();
      },
      iterator,
    };
  }

  // @ts-expect-error - this method will be used in the future
  private async stream(config: TextModelPredictConfig): Promise<{
    send: (request: service_pb.PostModelOutputsRequest) => void;
    end: () => void;
    iterator: AsyncGenerator<
      service_pb.MultiOutputResponse.AsObject["outputsList"]
    >;
  }> {
    const startTime = Date.now();
    const timeoutMs = 10 * 60 * 1000;
    const backoff = new BackoffIterator();

    let send!: (req: service_pb.PostModelOutputsRequest) => void;
    let end!: () => void;
    let streamIterator!: AsyncGenerator<
      | service_pb.MultiOutputResponse.AsObject
      | ["deploying", service_pb.MultiOutputResponse.AsObject]
    >;

    while (Date.now() - startTime < timeoutMs) {
      const stream = this.streamWithControl(config);

      send = stream.send;
      end = stream.end;
      streamIterator = stream.iterator;

      // Build and send the request
      const request = await this.constructRequestWithMethodSignature(
        new PostModelOutputsRequest(),
        config,
      );
      if (this.runner) {
        request.setRunnerSelector(this.runner);
      }
      send(request);

      for await (const msg of streamIterator) {
        if (Array.isArray(msg)) {
          // It's a ["deploying", ...] message
          const wait = backoff.next().value;
          console.log(`Model still deploying. Retrying in ${wait} seconds...`);
          end();
          await new Promise((r) => setTimeout(r, wait * 1000));
          break; // retry outer loop
        } else if (msg.status?.code === StatusCode.SUCCESS) {
          // Define clean iterator (from this point forward)
          const finalIterator = (async function* () {
            yield msg.outputsList;
            for await (const next of streamIterator) {
              if (!Array.isArray(next)) {
                if (next.status?.code === StatusCode.SUCCESS) {
                  yield next.outputsList;
                } else {
                  throw new Error(
                    `Model stream failed after start: ${JSON.stringify(
                      next.status,
                    )}`,
                  );
                }
              } else {
                throw new Error(
                  `Model stream failed after start: ${JSON.stringify(
                    next?.[1].status,
                  )}`,
                );
              }
            }
          })();

          return {
            send,
            end,
            iterator: finalIterator,
          };
        } else {
          throw new Error(
            `Model stream failed to start: ${JSON.stringify(msg.status)}`,
          );
        }
      }
    }

    throw new Error(
      `Model was busy/deploying for more than ${timeoutMs / 1000} seconds.`,
    );
  }

  async *generate({
    methodName,
    ...otherParams
  }: TextModelPredictConfig): AsyncGenerator<
    service_pb.MultiOutputResponse.AsObject["outputsList"]
  > {
    const startTime = Date.now();
    const backoffIterator = new BackoffIterator();
    const timeoutMs = 10 * 60 * 1000; // 10 minutes

    let firstOutputReceived = false;

    while (Date.now() - startTime < timeoutMs) {
      const stream = this.generateGrpc({ methodName, ...otherParams });

      for await (const message of stream) {
        if (Array.isArray(message)) {
          if (!firstOutputReceived) {
            const waitSeconds = backoffIterator.next().value;
            await new Promise((res) => setTimeout(res, waitSeconds * 1000));
            continue; // Restart the stream
          } else {
            yield message?.[1].outputsList;
          }
        } else if (message.status?.code === StatusCode.SUCCESS) {
          firstOutputReceived = true;
          yield message.outputsList;
        } else {
          throw new Error(
            `Model stream failed with response: ${JSON.stringify(message.status)}`,
          );
        }
      }

      // If stream ended and we never got valid output, retry
      if (!firstOutputReceived) {
        const waitSeconds = backoffIterator.next().value;
        await new Promise((res) => setTimeout(res, waitSeconds * 1000));
      } else {
        break; // success; stream finished after yielding real output
      }
    }

    if (!firstOutputReceived) {
      throw new Error(
        `Model was busy/deploying for more than ${timeoutMs / 1000} seconds.`,
      );
    }
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
    inferenceParams?: Record<string, struct_pb.JavaScriptValue>;
    outputConfig?: resources_pb.OutputConfig;
  }): Promise<service_pb.MultiOutputResponse.AsObject["outputsList"]> {
    let inputProto: resources_pb.Input;
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
    inferenceParams?: Record<string, struct_pb.JavaScriptValue>;
    outputConfig?: resources_pb.OutputConfig;
  }): Promise<service_pb.MultiOutputResponse.AsObject["outputsList"]> {
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
    inferenceParams?: Record<string, struct_pb.JavaScriptValue>;
    outputConfig?: resources_pb.OutputConfig;
  }): Promise<service_pb.MultiOutputResponse.AsObject["outputsList"]> {
    if (!(inputBytes instanceof Buffer)) {
      throw new Error("Invalid bytes.");
    }

    let inputProto: resources_pb.Input;
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
    inferenceParams?: Record<string, struct_pb.JavaScriptValue>;
    outputConfig?: resources_pb.OutputConfig;
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
