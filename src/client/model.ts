import {
  GetModelRequest,
  ListModelTypesRequest,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { UserError } from "../errors";
import { ClarifaiUrlHelper } from "../urls/helper";
import { promisifyGrpcCall } from "../utils/misc";
import { KWArgs } from "../utils/types";
import { Lister } from "./lister";
import {
  Model as GrpcModel,
  ModelVersion,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
import { TRAINABLE_MODEL_TYPES } from "../constants/model";
import {
  findAndReplaceKey,
  responseToModelParams,
  responseToTemplates,
} from "../utils/modelTrain";
import * as fs from "fs";
import * as yaml from "js-yaml";

export class Model extends Lister {
  private userId: string;
  private appId: string;
  private token: string | undefined;
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
}
