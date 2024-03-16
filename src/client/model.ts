import {
  DeleteModelVersionRequest,
  GetModelRequest,
  ListModelTypesRequest,
  ListModelVersionsRequest,
  MultiModelVersionResponse,
  MultiOutputResponse,
  PostModelOutputsRequest,
  PostModelVersionsRequest,
  SingleModelResponse,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { UserError } from "../errors";
import { ClarifaiUrlHelper } from "../urls/helper";
import {
  BackoffIterator,
  mapParamsToRequest,
  promisifyGrpcCall,
} from "../utils/misc";
import { AuthConfig } from "../utils/types";
import { Lister } from "./lister";
import {
  Model as GrpcModel,
  Input as GrpcInput,
  ModelVersion,
  OutputConfig,
  OutputInfo,
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

export class Model extends Lister {
  // @ts-expect-error - Variable yet to be used
  private userId: string;
  private appId: string;
  // @ts-expect-error - Variable yet to be used
  private token: string | undefined;
  // @ts-expect-error - Variable yet to be used
  private ui: string | undefined;
  private id: string;
  private modelVersion: { id: string } | undefined;
  private modelInfo: GrpcModel;
  private trainingParams: Record<string, unknown>;

  constructor({
    url,
    modelId,
    modelVersion,
    authConfig = {},
  }:
    | {
        url: string;
        modelId?: undefined;
        modelVersion?: { id: string };
        authConfig?: AuthConfig;
      }
    | {
        url?: undefined;
        modelId: string;
        modelVersion?: { id: string };
        authConfig?: AuthConfig;
      }) {
    if (url && modelId) {
      throw new UserError("You can only specify one of url or model_id.");
    }
    if (!url && !modelId) {
      throw new UserError("You must specify one of url or model_id.");
    }
    let modelIdFromUrl;

    if (url) {
      const [userId, appId, destructuredModelId, modelVersionId] =
        ClarifaiUrlHelper.splitClarifaiUrl(url);
      modelIdFromUrl = destructuredModelId;
      if (modelVersion) {
        modelVersion.id = modelVersionId;
      } else {
        modelVersion = { id: modelVersionId };
      }
      authConfig.userId = userId;
      authConfig.appId = appId;
    }

    super({ authConfig: authConfig });
    this.userId = authConfig.userId;
    this.appId = authConfig.appId;
    this.token = authConfig.token;
    this.ui = authConfig.ui;
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
  }

  async loadInfo() {
    const getModel = promisifyGrpcCall(
      this.STUB.client.getModel,
      this.STUB.client,
    );
    const request = new GetModelRequest();
    request.setUserAppId(this.userAppId);
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
    request.setUserAppId(this.userAppId);

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
    request.setUserAppId(this.userAppId);

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
    request.setUserAppId(this.userAppId);

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
   * @example
   * const model = new Model({ modelId: 'model_id', userId: 'user_id', appId: 'app_id' });
   * model.deleteVersion('version_id');
   */
  async deleteVersion(versionId: string): Promise<void> {
    const request = new DeleteModelVersionRequest();
    request.setUserAppId(this.userAppId);
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

  async createVersion(
    args: ModelVersion.AsObject,
  ): Promise<SingleModelResponse.AsObject> {
    if (this.modelInfo.getModelTypeId() in TRAINABLE_MODEL_TYPES) {
      throw new UserError(
        `${this.modelInfo.getModelTypeId()} is a trainable model type. Use 'model.train()' to train the model`,
      );
    }

    const request = new PostModelVersionsRequest();
    request.setUserAppId(this.userAppId);
    request.setModelId(this.id);
    const modelVersion = new ModelVersion();
    mapParamsToRequest(args, modelVersion);
    request.setModelVersionsList([modelVersion]);

    const postModelVersions = promisifyGrpcCall(
      this.STUB.client.postModelVersions,
      this.STUB.client,
    );

    const response = await this.grpcRequest(postModelVersions, request);

    const responseObject = response.toObject();

    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.toString());
    }

    return responseObject;
  }

  async *listVersions({
    pageNo,
    perPage,
  }: {
    pageNo?: number;
    perPage?: number;
  }): AsyncGenerator<MultiModelVersionResponse.AsObject, void, void> {
    const request = new ListModelVersionsRequest();
    request.setUserAppId(this.userAppId);
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
      yield modelVersionInfo.toObject();
    }
  }

  async predict({
    inputs,
    inferenceParams,
    outputConfig,
  }: {
    inputs: GrpcInput[];
    inferenceParams?: Record<string, JavaScriptValue>;
    outputConfig?: OutputConfig;
  }): Promise<MultiOutputResponse.AsObject> {
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
    request.setUserAppId(this.userAppId);
    request.setModelId(this.id);
    if (this.modelVersion && this.modelVersion.id)
      request.setVersionId(this.modelVersion.id);
    request.setInputsList(requestInputs);
    request.setModel(this.modelInfo);

    const startTime = Date.now();
    const backoffIterator = new BackoffIterator();
    return new Promise<MultiOutputResponse.AsObject>((resolve, reject) => {
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
                  `Model Predict failed with response ${responseObject.status?.toString()}`,
                ),
              );
            } else {
              resolve(response.toObject());
            }
          })
          .catch((error) => {
            reject(
              new Error(`Model Predict failed with error: ${error.message}`),
            );
          });
      };
      makeRequest();
    });
  }

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
  }): Promise<MultiOutputResponse.AsObject> {
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
  }): Promise<MultiOutputResponse.AsObject> {
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
  }): Promise<MultiOutputResponse.AsObject> {
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
