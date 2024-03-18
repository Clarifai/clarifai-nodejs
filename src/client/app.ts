import {
  GetDatasetRequest,
  GetModelRequest,
  GetWorkflowRequest,
  ListConceptsRequest,
  ListDatasetsRequest,
  ListInstalledModuleVersionsRequest,
  ListModelsRequest,
  ListModulesRequest,
  ListWorkflowsRequest,
  MultiDatasetResponse,
  PostDatasetsRequest,
  PostModelsRequest,
  SingleModelResponse,
  SingleWorkflowResponse,
  SingleDatasetResponse,
  PostModulesRequest,
  DeleteDatasetsRequest,
  DeleteModelsRequest,
  DeleteWorkflowsRequest,
  DeleteModulesRequest,
  PostWorkflowsRequest,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { UserError } from "../errors";
import { ClarifaiAppUrl, ClarifaiUrlHelper } from "../urls/helper";
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
  WorkflowNode,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { TRAINABLE_MODEL_TYPES } from "../constants/model";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { validateWorkflow } from "../workflows/validate";
import { getYamlOutputInfoProto, isSameYamlModel } from "../workflows/utils";
import { Model as ModelConstructor } from "./model";
import { uuid } from "uuidv4";
import { fromProtobufObject } from "from-protobuf-object";

type AppConfig =
  | {
      url: ClarifaiAppUrl;
      authConfig: Omit<AuthConfig, "appId" | "userId"> & {
        appId?: undefined;
        userId?: undefined;
      };
    }
  | {
      url?: undefined;
      authConfig: AuthConfig;
    };

export class App extends Lister {
  private appInfo: GrpcApp;

  constructor({ url, authConfig }: AppConfig) {
    if (url && authConfig.appId) {
      throw new UserError("You can only specify one of url or app_id.");
    }

    if (url) {
      const [userId, appId] = ClarifaiUrlHelper.splitClarifaiAppUrl(url);
      // @ts-expect-error - since url is parsed, we need to set appId here
      if (userId) authConfig.userId = userId;
      // @ts-expect-error - since url is parsed, we need to set appId here
      if (appId) authConfig.appId = appId;
    }

    super({ authConfig: authConfig as AuthConfig });

    this.appInfo = new GrpcApp();
    this.appInfo.setUserId(authConfig.userId!);
    this.appInfo.setId(authConfig.appId!);
  }

  async *listDataSets({
    params = {},
    pageNo,
    perPage,
  }: {
    params?: PaginationRequestParams<ListDatasetsRequest.AsObject>;
    pageNo?: number;
    perPage?: number;
  } = {}): AsyncGenerator<
    MultiDatasetResponse.AsObject["datasetsList"],
    void,
    unknown
  > {
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
      yield item.toObject()?.datasetsList;
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
  } = {}): AsyncGenerator<Model.AsObject[], void, unknown> {
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
  } = {}): AsyncGenerator<Workflow.AsObject[], void, unknown> {
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
  } = {}): AsyncGenerator<Module.AsObject[], void, unknown> {
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

  async createDataset({
    datasetId,
    params = {},
  }: {
    datasetId: string;
    params?: Omit<Partial<Dataset.AsObject>, "id">;
  }): Promise<Dataset.AsObject> {
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

  async createModel({
    modelId,
    params = {},
  }: {
    modelId: string;
    params?: Omit<Partial<Model.AsObject>, "id">;
  }): Promise<Model.AsObject> {
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

  async createModule({
    moduleId,
    description,
  }: {
    moduleId: string;
    description: string;
  }): Promise<Module.AsObject> {
    const request = new PostModulesRequest();
    request.setUserAppId(this.userAppId);
    const newModule = new Module();
    newModule.setId(moduleId);
    newModule.setDescription(description);
    request.setModulesList([newModule]);
    const postModules = promisifyGrpcCall(
      this.STUB.client.postModules,
      this.STUB.client,
    );
    const response = await this.grpcRequest(postModules, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    console.info("\nModule created\n%s", responseObject.status.description);
    return responseObject.modulesList?.[0];
  }

  async createWorkflow({
    configFilePath,
    generateNewId = false,
    display = true,
  }: {
    configFilePath: string;
    generateNewId?: boolean;
    display?: boolean;
  }): Promise<Workflow.AsObject> {
    if (!fs.existsSync(configFilePath)) {
      throw new UserError(
        `Workflow config file not found at ${configFilePath}`,
      );
    }

    const data = yaml.load(fs.readFileSync(configFilePath, "utf8"));

    const validatedData = validateWorkflow(data);
    const workflow = validatedData["workflow"];

    // Get all model objects from the workflow nodes.
    const allModels: Model.AsObject[] = [];
    let modelObject: Model.AsObject | undefined;
    for (const node of workflow["nodes"]) {
      const outputInfo = getYamlOutputInfoProto(node?.model?.outputInfo ?? {});
      try {
        const model = await this.model({
          modelId: node.model.modelId,
          modelVersionId: node.model.modelVersionId ?? "",
        });
        modelObject = model;
        if (model) allModels.push(model);
      } catch (e) {
        // model doesn't exist, create a new model from yaml config
        if (
          (e as { message?: string })?.message?.includes(
            "Model does not exist",
          ) &&
          outputInfo
        ) {
          const { modelId, ...otherParams } = node.model;
          modelObject = await this.createModel({
            modelId,
            params: otherParams as Omit<Partial<Model.AsObject>, "id">,
          });
          const model = new ModelConstructor({
            modelId: modelObject.id,
            authConfig: {
              pat: this.pat,
              appId: this.userAppId.getAppId(),
              userId: this.userAppId.getUserId(),
            },
          });
          const modelVersion = await model.createVersion({
            outputInfo: outputInfo.toObject(),
          });
          if (modelVersion.model) {
            allModels.push(modelVersion.model);
            continue;
          }
        }
      }

      // If the model version ID is specified, or if the yaml model is the same as the one in the api
      if (
        (node.model.modelVersionId ?? "") ||
        (modelObject && isSameYamlModel(modelObject, node.model))
      ) {
        allModels.push(modelObject!);
      } else if (modelObject && outputInfo) {
        const model = new ModelConstructor({
          modelId: modelObject.id,
          authConfig: {
            pat: this.pat,
            appId: this.userAppId.getAppId(),
            userId: this.userAppId.getUserId(),
          },
        });
        const modelVersion = await model.createVersion({
          outputInfo: outputInfo.toObject(),
        });
        if (modelVersion.model) {
          allModels.push(modelVersion.model);
        }
      }
    }

    // Convert nodes to resources_pb2.WorkflowNodes.
    const nodes: WorkflowNode.AsObject[] = [];
    for (let i = 0; i < workflow["nodes"].length; i++) {
      const ymlNode = workflow["nodes"][i];
      const node: WorkflowNode.AsObject = {
        id: ymlNode["id"],
        model: allModels[i],
        // TODO: setting default values, need to check for right values to set here
        nodeInputsList: [],
        // TODO: setting default values, need to check for right values to set here
        suppressOutput: false,
      };
      // Add node inputs if they exist, i.e. if these nodes do not connect directly to the input.
      if (ymlNode.nodeInputs) {
        for (const ni of ymlNode.nodeInputs) {
          node?.nodeInputsList.push({ nodeId: ni.nodeId });
        }
      }
      nodes.push(node);
    }

    let workflowId = workflow["id"];
    if (generateNewId) {
      workflowId = uuid();
    }

    // Create the workflow.
    const request = new PostWorkflowsRequest();
    request.setUserAppId(this.userAppId);
    const workflowNodesList = nodes.map((eachNode) =>
      fromProtobufObject(WorkflowNode, eachNode),
    );
    request.setWorkflowsList([
      new Workflow().setId(workflowId).setNodesList(workflowNodesList),
    ]);

    const postWorkflows = promisifyGrpcCall(
      this.STUB.client.postWorkflows,
      this.STUB.client,
    );

    const response = await this.grpcRequest(postWorkflows, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    console.info("\nWorkflow created\n%s", responseObject.status?.description);

    // Display the workflow nodes tree.
    if (display) {
      console.table(responseObject.workflowsList?.[0]?.nodesList);
    }
    return responseObject.workflowsList?.[0];
  }

  async model({
    modelId,
    modelVersionId,
  }: {
    modelId: string;
    modelVersionId: string;
  }): Promise<SingleModelResponse.AsObject["model"]> {
    const request = new GetModelRequest();
    request.setUserAppId(this.userAppId);
    request.setModelId(modelId);
    request.setVersionId(modelVersionId);

    const getModel = promisifyGrpcCall(
      this.STUB.client.getModel,
      this.STUB.client,
    );

    const response = await this.grpcRequest(getModel, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    return responseObject.model;
  }

  async workflow({
    workflowId,
  }: {
    workflowId: string;
  }): Promise<SingleWorkflowResponse.AsObject["workflow"]> {
    const request = new GetWorkflowRequest();
    request.setUserAppId(this.userAppId);
    request.setWorkflowId(workflowId);
    const getWorkflow = promisifyGrpcCall(
      this.STUB.client.getWorkflow,
      this.STUB.client,
    );
    const response = await this.grpcRequest(getWorkflow, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    return responseObject.workflow;
  }

  async dataset({
    datasetId,
  }: {
    datasetId: string;
  }): Promise<SingleDatasetResponse.AsObject["dataset"]> {
    const request = new GetDatasetRequest();
    request.setUserAppId(this.userAppId);
    request.setDatasetId(datasetId);
    const getDataset = promisifyGrpcCall(
      this.STUB.client.getDataset,
      this.STUB.client,
    );
    const response = await this.grpcRequest(getDataset, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    return responseObject.dataset;
  }

  async deleteDataset({ datasetId }: { datasetId: string }): Promise<void> {
    const request = new DeleteDatasetsRequest();
    request.setUserAppId(this.userAppId);
    request.setDatasetIdsList([datasetId]);
    const deleteDatasets = promisifyGrpcCall(
      this.STUB.client.deleteDatasets,
      this.STUB.client,
    );
    const response = await this.grpcRequest(deleteDatasets, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    console.info("\nDataset Deleted\n%s", responseObject.status?.description);
  }

  async deleteModel({ modelId }: { modelId: string }): Promise<void> {
    const request = new DeleteModelsRequest();
    request.setUserAppId(this.userAppId);
    request.setIdsList([modelId]);
    const deleteModels = promisifyGrpcCall(
      this.STUB.client.deleteModels,
      this.STUB.client,
    );
    const response = await this.grpcRequest(deleteModels, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    console.info("\nModel Deleted\n%s", responseObject.status?.description);
  }

  async deleteWorkflow({ workflowId }: { workflowId: string }): Promise<void> {
    const request = new DeleteWorkflowsRequest();
    request.setUserAppId(this.userAppId);
    request.setIdsList([workflowId]);
    const deleteWorkflows = promisifyGrpcCall(
      this.STUB.client.deleteWorkflows,
      this.STUB.client,
    );
    const response = await this.grpcRequest(deleteWorkflows, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    console.info("\nWorkflow Deleted\n%s", responseObject.status?.description);
  }

  async deleteModule({ moduleId }: { moduleId: string }): Promise<void> {
    const request = new DeleteModulesRequest();
    request.setUserAppId(this.userAppId);
    request.setIdsList([moduleId]);
    const deleteModules = promisifyGrpcCall(
      this.STUB.client.deleteModules,
      this.STUB.client,
    );
    const response = await this.grpcRequest(deleteModules, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    console.info("\nModule Deleted\n%s", responseObject.status?.description);
  }
}
