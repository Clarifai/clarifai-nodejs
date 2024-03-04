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
import { mapParamsToRequest, promisifyGrpcCall } from "../utils/misc";
import { KWArgs } from "../utils/types";
import { Lister } from "./lister";
import {
  Model as GrpcModel,
  Input,
  ModelVersion,
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
    kwargs = {},
  }:
    | {
        url: string;
        modelId?: undefined;
        modelVersion?: { id: string };
        kwargs?: KWArgs;
      }
    | {
        url?: undefined;
        modelId: string;
        modelVersion?: { id: string };
        kwargs?: KWArgs;
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
      kwargs.userId = userId;
      kwargs.appId = appId;
    }

    super({ kwargs });
    this.userId = kwargs.userId;
    this.appId = kwargs.appId;
    this.token = kwargs.token;
    this.ui = kwargs.ui;
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

  updateParams(kwargs: Record<string, unknown>): void {
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
    if (!Object.keys(kwargs).every((key) => allKeys.includes(key))) {
      throw new UserError("Invalid params");
    }
    for (const [key, value] of Object.entries(kwargs)) {
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

  async *listVersions(
    pageNo?: number,
    perPage?: number,
  ): AsyncGenerator<MultiModelVersionResponse.AsObject, void, void> {
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

  async predict(inputs: Input[]): Promise<MultiOutputResponse.AsObject> {
    if (!Array.isArray(inputs)) {
      throw new Error(
        "Invalid inputs, inputs must be an array of Input objects.",
      );
    }
    if (inputs.length > MAX_MODEL_PREDICT_INPUTS) {
      throw new Error(`Too many inputs. Max is ${MAX_MODEL_PREDICT_INPUTS}.`);
    }

    const requestInputs: Input[] = [];
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
              setTimeout(makeRequest, 5000);
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

  // private async listConcepts(): Promise<string[]> {
  //   const request = new ListConceptsRequest();
  //   request.setUserAppId(this.userAppId);

  //   const listConcepts = promisifyGrpcCall(
  //     this.STUB.client.listConcepts,
  //     this.STUB.client,
  //   );

  //   const allConceptsInfosGenerator = this.listPagesGenerator(
  //     listConcepts,
  //     request,
  //   );

  //   const allConceptsInfos: MultiConceptResponse.AsObject["conceptsList"][] =
  //     [];
  //   for await (const conceptInfo of allConceptsInfosGenerator) {
  //     allConceptsInfos.push(conceptInfo.toObject()?.conceptsList ?? []);
  //   }

  //   return allConceptsInfos.flatMap((conceptInfo) =>
  //     conceptInfo.map((each) => each.id),
  //   );
  // }
}
