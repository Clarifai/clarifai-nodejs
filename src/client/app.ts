import {
  ListConceptsRequest,
  ListDatasetsRequest,
  ListInstalledModuleVersionsRequest,
  ListModelsRequest,
  ListModulesRequest,
  ListWorkflowsRequest,
  MultiDatasetResponse,
  PostDatasetsRequest,
  PostModelsRequest,
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
  Module,
  InstalledModuleVersion,
  Concept,
  Dataset,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { TRAINABLE_MODEL_TYPES } from "../constants/model";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";

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
          eachModel.modelVersion.appId !== this.userAppId.getAppId()
        ) {
          continue;
        }
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

  async *listModules({
    params = {},
    onlyInApp,
    pageNo,
    perPage,
  }: {
    params?: PaginationRequestParams<ListModulesRequest.AsObject>;
    onlyInApp?: boolean;
    pageNo?: number;
    perPage?: number;
  }): AsyncGenerator<Module.AsObject[], void, unknown> {
    const listModules = promisifyGrpcCall(
      this.STUB.client.listModules,
      this.STUB.client,
    );

    const request = new ListModulesRequest();
    request.setUserAppId(this.userAppId);
    mapParamsToRequest(params, request);

    for await (const item of this.listPagesGenerator(
      listModules,
      request,
      pageNo,
      perPage,
    )) {
      const modules = [];
      const modulesListResponse = item.toObject();
      for (const eachModule of modulesListResponse.modulesList) {
        if (onlyInApp && eachModule.appId !== this.userAppId.getAppId()) {
          continue;
        }
        modules.push(eachModule);
      }
      yield modules;
    }
  }

  async *listInstalledModuleVersions({
    params = {},
    pageNo,
    perPage,
  }: {
    params?: PaginationRequestParams<ListModulesRequest.AsObject>;
    pageNo?: number;
    perPage?: number;
  }): AsyncGenerator<InstalledModuleVersion.AsObject[], void, unknown> {
    const listInstalledModuleVersions = promisifyGrpcCall(
      this.STUB.client.listInstalledModuleVersions,
      this.STUB.client,
    );
    const request = new ListInstalledModuleVersionsRequest();
    request.setUserAppId(this.userAppId);
    mapParamsToRequest(params, request);
    for await (const item of this.listPagesGenerator(
      listInstalledModuleVersions,
      request,
      pageNo,
      perPage,
    )) {
      const moduleVersions = [];
      const modulesListResponseObject = item.toObject();
      for (const eachModule of modulesListResponseObject.installedModuleVersionsList) {
        // @ts-expect-error - delete needed here due to debt in the backend
        delete eachModule.deployUrl;
        // @ts-expect-error - delete needed here due to debt in the backend
        delete eachModule.installedModuleVersionId; // TODO: remove this after the backend fix
        moduleVersions.push(eachModule);
      }
      yield moduleVersions;
    }
  }

  async *listConcepts({
    pageNo,
    perPage,
  }: {
    pageNo?: number;
    perPage?: number;
  }): AsyncGenerator<Concept.AsObject[], void, unknown> {
    const listConcepts = promisifyGrpcCall(
      this.STUB.client.listConcepts,
      this.STUB.client,
    );
    const request = new ListConceptsRequest();
    request.setUserAppId(this.userAppId);
    for await (const item of this.listPagesGenerator(
      listConcepts,
      request,
      pageNo,
      perPage,
    )) {
      const conceptsListResponse = item.toObject();
      yield conceptsListResponse.conceptsList;
    }
  }

  listTrainableModelTypes(): string[] {
    return TRAINABLE_MODEL_TYPES;
  }

  async createDataset(
    datasetId: string,
    params: Omit<Partial<Dataset.AsObject>, "id">,
  ): Promise<Dataset.AsObject> {
    const request = new PostDatasetsRequest();
    request.setUserAppId(this.userAppId);

    const newDataSet = new Dataset();
    newDataSet.setId(datasetId);
    mapParamsToRequest(params, newDataSet);

    request.setDatasetsList([newDataSet]);

    const postDatasets = promisifyGrpcCall(
      this.STUB.client.postDatasets,
      this.STUB.client,
    );

    const response = await this.grpcRequest(postDatasets, request);
    const responseObject = response.toObject();

    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }

    console.info("\nDataset created\n%s", responseObject.status.description);

    return responseObject.datasetsList?.[0];
  }

  async createModel(
    modelId: string,
    params: Omit<Partial<Model.AsObject>, "id">,
  ): Promise<Model.AsObject> {
    const request = new PostModelsRequest();
    request.setUserAppId(this.userAppId);
    const newModel = new Model();
    newModel.setId(modelId);
    mapParamsToRequest(params, newModel);
    request.setModelsList([newModel]);
    const postModels = promisifyGrpcCall(
      this.STUB.client.postModels,
      this.STUB.client,
    );
    const response = await this.grpcRequest(postModels, request);
    const responseObject = response.toObject();
    if (
      responseObject.status?.code !== StatusCode.SUCCESS ||
      !responseObject.model
    ) {
      throw new Error(responseObject.status?.description);
    }
    console.info("\nModel created\n%s", responseObject.status.description);
    return responseObject.model;
  }
}
