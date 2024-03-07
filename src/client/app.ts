import {
  ListDatasetsRequest,
  ListModelsRequest,
  ListWorkflowsRequest,
  MultiDatasetResponse,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { UserError } from "../errors";
import { ClarifaiUrlHelper } from "../urls/helper";
import { mapParamsToRequest, promisifyGrpcCall } from "../utils/misc";
import { AuthConfig, PaginationRequestParams } from "../utils/types";
import { Lister } from "./lister";
import {
  Model,
  App as GrpcApp,
  Workflow,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";

export class App extends Lister {
  private appInfo: GrpcApp;

  constructor({ url, authConfig }: { url?: string; authConfig: AuthConfig }) {
    if (url && authConfig.appId) {
      throw new UserError("You can only specify one of url or app_id.");
    }

    if (url) {
      const [userId, appId] = ClarifaiUrlHelper.splitClarifaiAppUrl(url);
      if (userId) authConfig.userId = userId;
      if (appId) authConfig.appId = appId;
    }

    super({ authConfig: authConfig });

    this.appInfo = new GrpcApp();
    this.appInfo.setUserId(authConfig.userId);
    this.appInfo.setId(authConfig.appId);
  }

  async *listDataSets({
    params = {},
    pageNo,
    perPage,
  }: {
    params?: PaginationRequestParams<ListDatasetsRequest.AsObject>;
    pageNo?: number;
    perPage?: number;
  }): AsyncGenerator<MultiDatasetResponse.AsObject, void, unknown> {
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

  async *listModels({
    params = {},
    onlyInApp = true,
    pageNo,
    perPage,
  }: {
    params?: PaginationRequestParams<ListModelsRequest.AsObject>;
    onlyInApp?: boolean;
    pageNo?: number;
    perPage?: number;
  }): AsyncGenerator<Model.AsObject[], void, unknown> {
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
  }

  async *listWorkflows({
    params = {},
    onlyInApp = true,
    pageNo,
    perPage,
  }: {
    params?: PaginationRequestParams<ListWorkflowsRequest.AsObject>;
    onlyInApp?: boolean;
    pageNo?: number;
    perPage?: number;
  }): AsyncGenerator<Workflow.AsObject[], void, unknown> {
    const request = new ListWorkflowsRequest();
    mapParamsToRequest(params, request);

    const listWorkflows = promisifyGrpcCall(
      this.STUB.client.listWorkflows,
      this.STUB.client,
    );

    const listWorkflowsGenerator = this.listPagesGenerator(
      listWorkflows,
      request,
      pageNo,
      perPage,
    );

    for await (const workflow of listWorkflowsGenerator) {
      const workflows = [];
      const workflowObject = workflow.toObject();
      for (const eachWorkflow of workflowObject.workflowsList) {
        if (onlyInApp && eachWorkflow.appId !== this.userAppId.getAppId()) {
          continue;
        }
        workflows.push(eachWorkflow);
      }
      yield workflows;
    }
  }
}
