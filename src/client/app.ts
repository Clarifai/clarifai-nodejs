import service_pb from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
const {
  GetDatasetRequest,
  GetModelRequest,
  GetWorkflowRequest,
  ListConceptsRequest,
  ListDatasetsRequest,
  ListInstalledModuleVersionsRequest,
  ListModelsRequest,
  ListModulesRequest,
  ListWorkflowsRequest,
  PostDatasetsRequest,
  PostModelsRequest,
  PostModulesRequest,
  DeleteDatasetsRequest,
  DeleteModelsRequest,
  DeleteWorkflowsRequest,
  DeleteModulesRequest,
  PostWorkflowsRequest,
} = service_pb;
import { UserError } from "../errors";
import { ClarifaiAppUrl, ClarifaiUrlHelper } from "../urls/helper";
import { promisifyGrpcCall } from "../utils/misc";
import { AuthConfig, PaginationRequestParams } from "../utils/types";
import { Lister } from "./lister";
import resources_pb from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
const {
  Model,
  App: GrpcApp,
  Workflow,
  Module,
  Dataset,
  WorkflowNode,
  ModelVersion,
  UserAppIDSet,
} = resources_pb;
import { TRAINABLE_MODEL_TYPES } from "../constants/model";
import status_code_pb from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
const { StatusCode } = status_code_pb;
import * as fs from "fs";
import * as yaml from "js-yaml";
import { validateWorkflow } from "../workflows/validate";
import { getYamlOutputInfoProto } from "../workflows/utils";
import { Model as ModelConstructor } from "./model";
import { v4 as uuid } from "uuid";
import { fromProtobufObject } from "from-protobuf-object";
import { fromPartialProtobufObject } from "../utils/fromPartialProtobufObject";
import { flatten } from "safe-flat";

export type AuthAppConfig = Omit<AuthConfig, "appId" | "userId"> & {
  appId?: undefined;
  userId?: undefined;
};

export type AppConfig =
  | {
      url: ClarifaiAppUrl;
      authConfig: AuthAppConfig;
    }
  | {
      url?: undefined;
      authConfig: AuthConfig;
    };

export type ListDatasetsParam =
  PaginationRequestParams<service_pb.ListDatasetsRequest.AsObject>;
export type ListModelsParam =
  PaginationRequestParams<service_pb.ListModelsRequest.AsObject>;
export type ListWorkflowsParam =
  PaginationRequestParams<service_pb.ListWorkflowsRequest.AsObject>;
export type ListModulesParam =
  PaginationRequestParams<service_pb.ListModulesRequest.AsObject>;
export type ListInstalledModuleVersionsParam =
  PaginationRequestParams<service_pb.ListInstalledModuleVersionsRequest.AsObject>;
export type CreateDatasetParam = Omit<
  Partial<resources_pb.Dataset.AsObject>,
  "id"
>;
export type CreateModelParam = Omit<Partial<resources_pb.Model.AsObject>, "id">;

/**
 * App is a class that provides access to Clarifai API endpoints related to App information.
 * @noInheritDoc
 */
export class App extends Lister {
  private appInfo: resources_pb.App;
  public info: resources_pb.App.AsObject;

  /**
   * Initializes an App object.
   * @param config - The configuration object for the App.
   * @param config.url - The URL of the app.
   * @param config.authConfig.userId The user ID for the user to interact with.
   * @param config.authConfig.appId The application ID associated with the user. Not required if the URL is provided.
   * @param config.authConfig.pat A personal access token for authentication. Can also be set as an environment variable CLARIFAI_PAT.
   * @param config.authConfig.token A session token for authentication. Accepts either a session token or a personal access token (pat). Can also be set as an environment variable CLARIFAI_SESSION_TOKEN.
   * @param config.authConfig.base Optional. The base API URL. Defaults to "https://api.clarifai.com".
   * @param config.authConfig.ui Optional. Additional UI configurations.
   *
   * @includeExample examples/app/index.ts
   */
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
    this.info = this.appInfo.toObject();
  }

  /**
   * Lists all the datasets for the app.
   *
   * @param pageNo - The page number to list.
   * @param perPage - The number of items per page.
   *
   * @yields Dataset - Dataset objects for the datasets in the app.
   *
   * @includeExample examples/app/listDatasets.ts
   *
   * @remarks
   * Defaults to 16 per page
   */
  async *listDataSets({
    params = {},
    pageNo,
    perPage,
  }: {
    params?: ListDatasetsParam;
    pageNo?: number;
    perPage?: number;
  } = {}): AsyncGenerator<
    service_pb.MultiDatasetResponse.AsObject["datasetsList"],
    void,
    unknown
  > {
    const listDataSets = promisifyGrpcCall(
      this.STUB.client.listDatasets,
      this.STUB.client,
    );

    const request = fromPartialProtobufObject(ListDatasetsRequest, params);
    request.setUserAppId(this.userAppId);

    for await (const item of this.listPagesGenerator(
      listDataSets,
      request,
      pageNo,
      perPage,
    )) {
      yield item.toObject()?.datasetsList;
    }
  }

  /**
   * Lists all the available models for the user.
   *
   * @param params - A object of filters to apply to the list of models.
   * @param onlyInApp - If True, only return models that are in the app.
   * @param pageNo - The page number to list.
   * @param perPage - The number of items per page.
   *
   * @includeExample examples/app/listModels.ts
   *
   * @remarks
   * Defaults to 16 per page
   */
  async *listModels({
    params = {},
    onlyInApp = true,
    pageNo,
    perPage,
  }: {
    params?: ListModelsParam;
    onlyInApp?: boolean;
    pageNo?: number;
    perPage?: number;
  } = {}): AsyncGenerator<resources_pb.Model.AsObject[], void, unknown> {
    const listModels = promisifyGrpcCall(
      this.STUB.client.listModels,
      this.STUB.client,
    );

    const request = fromPartialProtobufObject(ListModelsRequest, params);
    request.setUserAppId(this.userAppId);

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

  /**
   * Lists all the available workflows for the user.
   *
   * @param params - A object of filters to apply to the list of workflows.
   * @param onlyInApp - If True, only return workflows that are in the app.
   * @param pageNo - The page number to list.
   * @param perPage - The number of items per page.
   *
   * @yields Workflow - Workflow objects for the workflows in the app.
   *
   * @includeExample examples/app/listWorkflows.ts
   *
   * @remarks
   * Defaults to 16 per page
   */
  async *listWorkflows({
    params = {},
    onlyInApp = true,
    pageNo,
    perPage,
  }: {
    params?: ListWorkflowsParam;
    onlyInApp?: boolean;
    pageNo?: number;
    perPage?: number;
  } = {}): AsyncGenerator<resources_pb.Workflow.AsObject[], void, unknown> {
    const request = fromPartialProtobufObject(ListWorkflowsRequest, params);

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

  /**
   * Lists all the available modules for the user.
   *
   * @param params - An object of filters to apply to the list of modules.
   * @param onlyInApp - If true, only return modules that are in the app.
   * @param pageNo - The page number to list.
   * @param perPage - The number of items per page.
   *
   * @yields Module - Module objects for the modules in the app.
   *
   * @includeExample examples/app/listModules.ts
   *
   * @remarks
   * Defaults to 16 per page
   */
  async *listModules({
    params = {},
    onlyInApp,
    pageNo,
    perPage,
  }: {
    params?: ListModulesParam;
    onlyInApp?: boolean;
    pageNo?: number;
    perPage?: number;
  } = {}): AsyncGenerator<resources_pb.Module.AsObject[], void, unknown> {
    const listModules = promisifyGrpcCall(
      this.STUB.client.listModules,
      this.STUB.client,
    );

    const request = fromPartialProtobufObject(ListModulesRequest, params);
    request.setUserAppId(this.userAppId);

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

  /**
   * Lists all installed module versions in the app.
   *
   * @param params - A dictionary of filters to apply to the list of installed module versions.
   * @param pageNo - The page number to list.
   * @param perPage - The number of items per page.
   *
   * @yields Module - Module objects for the installed module versions in the app.
   *
   * @includeExample examples/app/listInstalledModuleVersions.ts
   *
   * @remarks
   * Defaults to 16 per page
   */
  async *listInstalledModuleVersions({
    params = {},
    pageNo,
    perPage,
  }: {
    params?: ListInstalledModuleVersionsParam;
    pageNo?: number;
    perPage?: number;
  } = {}): AsyncGenerator<
    resources_pb.InstalledModuleVersion.AsObject[],
    void,
    unknown
  > {
    const listInstalledModuleVersions = promisifyGrpcCall(
      this.STUB.client.listInstalledModuleVersions,
      this.STUB.client,
    );
    const request = fromPartialProtobufObject(
      ListInstalledModuleVersionsRequest,
      params,
    );
    request.setUserAppId(this.userAppId);
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

  /**
   * Lists all the concepts for the app.
   * @param page_no - The page number to list.
   * @param per_page - The number of items per page.
   * @yields Concepts in the app.
   *
   * @includeExample examples/app/listConcepts.ts
   */
  async *listConcepts({
    pageNo,
    perPage,
  }: {
    pageNo?: number;
    perPage?: number;
  } = {}): AsyncGenerator<resources_pb.Concept.AsObject[], void, unknown> {
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

  /**
   * Creates a dataset for the app.
   *
   * @param datasetId - The dataset ID for the dataset to create.
   * @param params - Additional parameters to be passed to the Dataset.
   *
   * @returns A Dataset object for the specified dataset ID.
   *
   * @includeExample examples/app/createDataset.ts
   */
  async createDataset({
    datasetId,
    params = {},
  }: {
    datasetId: string;
    params?: CreateDatasetParam;
  }): Promise<resources_pb.Dataset.AsObject> {
    const request = new PostDatasetsRequest();
    request.setUserAppId(this.userAppId);

    const newDataSet = fromPartialProtobufObject(Dataset, params);
    newDataSet.setId(datasetId);

    request.setDatasetsList([newDataSet]);

    const postDatasets = promisifyGrpcCall(
      this.STUB.client.postDatasets,
      this.STUB.client,
    );

    const response = await this.grpcRequest(postDatasets, request);
    const responseObject = response.toObject();

    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }

    console.info("\nDataset created\n%s", responseObject.status.description);

    return responseObject.datasetsList?.[0];
  }

  /**
   * Creates a model for the app.
   *
   * @param modelId - The model ID for the model to create.
   * @param params - Additional parameters to be passed to the Model.
   *
   * @returns A Model object for the specified model ID.
   *
   * @includeExample examples/app/createModel.ts
   */
  async createModel({
    modelId,
    params = {},
  }: {
    modelId: string;
    params?: CreateModelParam;
  }): Promise<resources_pb.Model.AsObject> {
    const request = new PostModelsRequest();
    request.setUserAppId(this.userAppId);
    const newModel = fromPartialProtobufObject(Model, {
      id: modelId,
      ...params,
    });
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }
    console.info("\nModel created\n%s", responseObject.status.description);
    return responseObject.model;
  }

  /**
   * Creates a module for the app.
   *
   * @param moduleId - The module ID for the module to create.
   * @param description - The description of the module to create.
   * @returns A Module object for the specified module ID.
   *
   * @includeExample examples/app/createModule.ts
   */
  async createModule({
    moduleId,
    description,
  }: {
    moduleId: string;
    description: string;
  }): Promise<resources_pb.Module.AsObject> {
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }
    console.info("\nModule created\n%s", responseObject.status.description);
    return responseObject.modulesList?.[0];
  }

  /**
   * Creates a workflow for the app.
   *
   * @param configFilePath - The path to the yaml workflow config file.
   * @param generateNewId - If true, generate a new workflow ID.
   * @param display - If true, display the workflow nodes tree.
   * @returns A Workflow object for the specified workflow config.
   *
   * @includeExample examples/app/createWorkflow.ts
   */
  async createWorkflow({
    configFilePath,
    generateNewId = false,
    display = true,
  }: {
    configFilePath: string;
    generateNewId?: boolean;
    display?: boolean;
  }): Promise<resources_pb.Workflow.AsObject> {
    if (!fs.existsSync(configFilePath)) {
      throw new UserError(
        `Workflow config file not found at ${configFilePath}`,
      );
    }

    const data = yaml.load(fs.readFileSync(configFilePath, "utf8"));

    const validatedData = validateWorkflow(data);
    const workflow = validatedData["workflow"];

    // Get all model objects from the workflow nodes.
    const allModels: resources_pb.Model.AsObject[] = [];
    for (const node of workflow.nodes) {
      let modelObject: resources_pb.Model.AsObject | undefined;
      const outputInfo = getYamlOutputInfoProto(node?.model?.outputInfo ?? {});
      try {
        const model = await this.model({
          modelId: node.model.modelId,
          modelVersionId: node.model.modelVersionId ?? "",
          modelUserAppId:
            node.model.userId && node.model.appId
              ? {
                  userId: node.model.userId,
                  appId: node.model.appId,
                }
              : undefined,
        });
        modelObject = model;
        if (model) {
          allModels.push(model);
        }
      } catch (e) {
        // model doesn't exist, create a new model from yaml config
        if (
          (e as { message?: string })?.message?.includes("Model does not exist")
        ) {
          const { modelId, ...otherParams } = node.model;
          modelObject = await this.createModel({
            modelId,
            params: otherParams as CreateModelParam,
          });
          const model = new ModelConstructor({
            modelId: modelObject.id,
            authConfig: {
              pat: this.pat,
              appId: modelObject.appId,
              userId: modelObject.userId,
            },
          });
          let modelVersion: resources_pb.ModelVersion;
          if (outputInfo) {
            modelVersion = new ModelVersion().setOutputInfo(outputInfo);
          } else {
            modelVersion = new ModelVersion();
          }
          const modelWithVersion = await model.createVersion(modelVersion);
          if (modelWithVersion) {
            allModels.push(modelWithVersion);
            continue;
          }
        }
      }
    }

    // Convert nodes to resources_pb2.WorkflowNodes.
    const nodes: resources_pb.WorkflowNode.AsObject[] = [];
    for (let i = 0; i < workflow["nodes"].length; i++) {
      const ymlNode = workflow["nodes"][i];
      const node: resources_pb.WorkflowNode.AsObject = {
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }
    console.info("\nWorkflow created\n%s", responseObject.status?.description);

    // Display the workflow nodes tree.
    if (display) {
      console.table(flatten(responseObject.workflowsList?.[0]?.nodesList));
    }
    return responseObject.workflowsList?.[0];
  }

  /**
   * Returns a Model object for the existing model ID.
   *
   * @param modelId - The model ID for the existing model.
   * @param modelVersionId - Specific version id of the model.
   * @param modelUserAppId - The user app ID for the model.
   * @returns A model object for the specified model ID.
   *
   * @includeExample examples/app/model.ts
   */
  async model({
    modelId,
    modelVersionId,
    modelUserAppId,
  }: {
    modelId: string;
    modelVersionId?: string;
    modelUserAppId?: {
      userId: string;
      appId: string;
    };
  }): Promise<service_pb.SingleModelResponse.AsObject["model"]> {
    const request = new GetModelRequest();
    if (modelUserAppId) {
      request.setUserAppId(
        new UserAppIDSet()
          .setAppId(modelUserAppId.appId)
          .setUserId(modelUserAppId.userId),
      );
    } else {
      request.setUserAppId(this.userAppId);
    }
    request.setModelId(modelId);
    if (modelVersionId) request.setVersionId(modelVersionId);

    const getModel = promisifyGrpcCall(
      this.STUB.client.getModel,
      this.STUB.client,
    );

    const response = await this.grpcRequest(getModel, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }
    return responseObject.model;
  }

  /**
   * Returns a Workflow object for the existing workflow ID.
   *
   * @param workflowId - The workflow ID for a existing workflow.
   * @returns A workflow object for the specified workflow ID.
   *
   * @includeExample examples/app/workflow.ts
   */
  async workflow({
    workflowId,
  }: {
    workflowId: string;
  }): Promise<service_pb.SingleWorkflowResponse.AsObject["workflow"]> {
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }
    return responseObject.workflow;
  }

  /**
   * Returns a Dataset object for the existing dataset ID.
   *
   * @param dataset_id - The dataset ID for the dataset to interact with.
   * @returns A Dataset object for the existing dataset ID.
   *
   * @includeExample examples/app/dataset.ts
   */
  async dataset({
    datasetId,
  }: {
    datasetId: string;
  }): Promise<service_pb.SingleDatasetResponse.AsObject["dataset"]> {
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }
    return responseObject.dataset;
  }

  /**
   * Deletes a dataset for the user.
   *
   * @param datasetId - The dataset ID for the app to delete.
   *
   * @includeExample examples/app/deleteDataset.ts
   */
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }
    console.info("\nDataset Deleted\n%s", responseObject.status?.description);
  }

  /**
   * Deletes a model for the user.
   *
   * @param modelId - The model ID for the model to delete.
   *
   * @includeExample examples/app/deleteModel.ts
   */
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }
    console.info("\nModel Deleted\n%s", responseObject.status?.description);
  }

  /**
   * Deletes a workflow for the user.
   *
   * @param workflowId - The workflow ID for the workflow to delete.
   *
   * @includeExample examples/app/deleteWorkflow.ts
   */
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }
    console.info("\nWorkflow Deleted\n%s", responseObject.status?.description);
  }

  /**
   * Deletes a module for the user.
   *
   * @param moduleId - The module ID for the module to delete.
   *
   * @includeExample examples/app/deleteModule.ts
   */
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
      throw new Error(responseObject.status?.description, {
        cause: responseObject,
      });
    }
    console.info("\nModule Deleted\n%s", responseObject.status?.description);
  }
}
