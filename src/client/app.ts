import {
  ListDatasetsRequest,
  ListModelsRequest,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { UserError } from "../errors";
import { ClarifaiUrlHelper } from "../urls/helper";
import { mapParamsToRequest, promisifyGrpcCall } from "../utils/misc";
import { KWArgs, RequestParams } from "../utils/types";
import { Lister } from "./lister";
import { App as ProtoApp } from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";

export class App extends Lister {
  private appInfo;

  constructor({ url, kwargs }: { url?: string; kwargs: KWArgs }) {
    if (url && kwargs.appId) {
      throw new UserError("You can only specify one of url or app_id.");
    }

    if (url) {
      const [userId, appId] = ClarifaiUrlHelper.splitClarifaiAppUrl(url);
      if (userId) kwargs.userId = userId;
      if (appId) kwargs.appId = appId;
    }

    super({ kwargs });

    this.appInfo = new ProtoApp();
    this.appInfo.setUserId(kwargs.userId);
    this.appInfo.setId(kwargs.appId);
  }

  async *listDataSets({
    params = {},
    pageNo,
    perPage,
  }: {
    params?: RequestParams<ListDatasetsRequest.AsObject>;
    pageNo: number;
    perPage: number;
  }) {
    const listDataSets = promisifyGrpcCall(
      this.STUB.client.listDatasets,
      this.STUB.client,
    );

    const request = new ListDatasetsRequest();
    request.setUserAppId(this.userAppId);
    mapParamsToRequest(params, request);

    for await (const item of this.listPagesGenerator(
      listDataSets,
      request,
      pageNo,
      perPage,
    )) {
      yield item.toObject();
    }
  }

  /**
   * TODO: Return model class after the class is defined
   */
  async *listModels({
    params = {},
    onlyInApp = true,
    pageNo,
    perPage,
  }: {
    params?: RequestParams<ListModelsRequest.AsObject>;
    onlyInApp?: boolean;
    pageNo: number;
    perPage: number;
  }) {
    const listModels = promisifyGrpcCall(
      this.STUB.client.listModels,
      this.STUB.client,
    );

    const request = new ListModelsRequest();
    request.setUserAppId(this.userAppId);
    mapParamsToRequest(params, request);

    for await (const item of this.listPagesGenerator(
      listModels,
      request,
      pageNo,
      perPage,
    )) {
      const models = [];
      const modelsListResponse = item.toObject();
      for (const eachModel of modelsListResponse.modelsList) {
        if (!eachModel.modelVersion) {
          continue;
        }
        if (
          onlyInApp &&
          // TODO: verify how App ID is being set
          eachModel.modelVersion.appId !== this.userAppId.getAppId()
        ) {
          continue;
        }
        // TODO: Construct the model class before yielding
        models.push(eachModel);
      }
      yield models;
    }

    yield null;
  }
}
