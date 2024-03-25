import { Lister } from "./lister";
import { AuthConfig, PaginationRequestParams } from "../utils/types";
import {
  DeleteAppRequest,
  DeleteRunnersRequest,
  GetAppRequest,
  GetRunnerRequest,
  ListAppsRequest,
  ListRunnersRequest,
  MultiAppResponse,
  MultiRunnerResponse,
  PostAppsRequest,
  PostRunnersRequest,
  SingleAppResponse,
  SingleRunnerResponse,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { mapParamsToRequest, promisifyGrpcCall } from "../utils/misc";
import {
  App,
  Runner,
  UserAppIDSet,
  Workflow,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";

export type UserConfig = AuthConfig;
export type ListAppsRequestParams =
  PaginationRequestParams<ListAppsRequest.AsObject>;
export type ListRunnersRequestParams =
  PaginationRequestParams<ListRunnersRequest.AsObject>;

/**
 * User is a class that provides access to Clarifai API endpoints related to user information.
 * @noInheritDoc
 */
export class User extends Lister {
  /**
   * Initializes an User object with the specified authentication configuration.
   *
   * @param authConfig An object containing the authentication configuration. Defaults to an empty object.
   * @param authConfig.userId The user ID for the user to interact with.
   * @param authConfig.appId The application ID associated with the user.
   * @param authConfig.pat A personal access token for authentication. Can also be set as an environment variable CLARIFAI_PAT.
   * @param authConfig.token A session token for authentication. Accepts either a session token or a personal access token (pat). Can also be set as an environment variable CLARIFAI_SESSION_TOKEN.
   * @param authConfig.base Optional. The base API URL. Defaults to "https://api.clarifai.com".
   * @param authConfig.ui Optional. Additional UI configurations.
   *
   * @includeExample examples/user/index.ts
   */
  constructor(authConfig: UserConfig = {}) {
    super({ authConfig });
  }

  /**
   * Lists all the apps for the user.
   *
   * @param params A dictionary of filters to be applied to the list of apps.
   * @param pageNo The page number to list.
   * @param perPage The number of items per page.
   * @yields App objects for the user.
   *
   * @includeExample examples/user/listApps.ts
   *
   * @note Defaults to 16 per page if pageNo is specified and perPage is not specified.
   * If both pageNo and perPage are None, then lists all the resources.
   */
  async *listApps({
    params = {},
    pageNo,
    perPage,
  }: {
    params?: ListAppsRequestParams;
    pageNo?: number;
    perPage?: number;
  } = {}): AsyncGenerator<
    MultiAppResponse.AsObject["appsList"],
    void,
    unknown
  > {
    const listApps = promisifyGrpcCall(
      this.STUB.client.listApps,
      this.STUB.client,
    );
    const request = new ListAppsRequest();
    mapParamsToRequest(params, request);

    for await (const item of this.listPagesGenerator(
      listApps,
      request,
      pageNo,
      perPage,
    )) {
      yield item.toObject()?.appsList;
    }
  }

  /**
   * Lists all the runners for the user.
   *
   * @param params A dictionary of filters to be applied to the list of runners.
   * @param pageNo The page number to list.
   * @param perPage The number of items per page.
   * @yields Runner objects for the user.
   *
   * @includeExample examples/user/listRunners.ts
   *
   * @note Defaults to 16 per page if perPage is not specified.
   */
  async *listRunners({
    params = {},
    pageNo,
    perPage,
  }: {
    params?: ListRunnersRequestParams;
    pageNo?: number;
    perPage?: number;
  } = {}): AsyncGenerator<MultiRunnerResponse.AsObject, void, unknown> {
    const listRunners = promisifyGrpcCall(
      this.STUB.client.listRunners,
      this.STUB.client,
    );
    const request = new ListRunnersRequest();
    mapParamsToRequest(params, request);

    for await (const item of this.listPagesGenerator(
      listRunners,
      request,
      pageNo,
      perPage,
    )) {
      yield item.toObject();
    }
  }

  /**
   * Creates an app for the user.
   *
   * @param appId The app ID for the app to create.
   * @param baseWorkflow The base workflow to use for the app. Examples: 'Universal', 'Language-Understanding', 'General'
   * @returns An App object for the specified app ID.
   *
   * @includeExample examples/user/createApp.ts
   */
  async createApp({
    appId,
    baseWorkflow = "Empty",
  }: {
    appId: string;
    baseWorkflow?: string;
  }): Promise<App.AsObject> {
    const workflow = new Workflow();
    workflow.setId(baseWorkflow);
    workflow.setAppId("main");
    workflow.setUserId("clarifai");

    const app = new App();
    app.setId(appId);
    app.setDefaultWorkflow(workflow);

    const request = new PostAppsRequest();
    request.setUserAppId(this.userAppId);
    request.setAppsList([app]);

    const postApps = promisifyGrpcCall(
      this.STUB.client.postApps,
      this.STUB.client,
    );

    const response = await this.grpcRequest(postApps, request);

    const responseObject = response.toObject();

    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(
        `Failed to create app: ${responseObject.status?.description}`,
      );
    }

    return responseObject.appsList?.[0];
  }

  /**
   * Creates a runner for the user.
   *
   * @param runnerId The Id of runner to create.
   * @param labels Labels to match runner.
   * @param description Description of Runner.
   * @returns A runner object for the specified Runner ID.
   *
   * @includeExample examples/user/createRunner.ts
   */
  async createRunner({
    runnerId,
    labels,
    description,
  }: {
    runnerId: string;
    labels: string[];
    description: string;
  }): Promise<MultiRunnerResponse.AsObject["runnersList"][0]> {
    if (!Array.isArray(labels)) {
      throw new Error("Labels must be an array of strings");
    }

    const request = new PostRunnersRequest();
    request.setUserAppId(this.userAppId);
    const runner = new Runner();
    runner.setId(runnerId);
    runner.setLabelsList(labels);
    runner.setDescription(description);
    request.setRunnersList([runner]);

    const postRunners = promisifyGrpcCall(
      this.STUB.client.postRunners,
      this.STUB.client,
    );
    const response = await this.grpcRequest(postRunners, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(
        `Failed to create runner: ${responseObject.status?.description}`,
      );
    }
    console.info("\nRunner created\n%s", responseObject.status.description);

    return responseObject.runnersList?.[0];
  }

  /**
   * Returns an App object for the specified app ID.
   *
   * @param appId The app ID for the app to interact with.
   * @returns An App object for the specified app ID.
   *
   * @includeExample examples/user/app.ts
   */
  async app({
    appId,
  }: {
    appId: string;
  }): Promise<SingleAppResponse.AsObject["app"]> {
    const request = new GetAppRequest();
    const appIdSet = new UserAppIDSet();
    appIdSet.setUserId(this.userAppId.getUserId());
    appIdSet.setAppId(appId);
    request.setUserAppId(appIdSet);
    const getApp = promisifyGrpcCall(this.STUB.client.getApp, this.STUB.client);
    const response = await this.grpcRequest(getApp, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(
        `Failed to retrieve app: ${responseObject.status?.description}`,
      );
    }
    return responseObject["app"];
  }

  /**
   * Returns a Runner object if exists.
   *
   * @param runnerId The runner ID to interact with.
   * @returns A Runner object for the existing runner ID.
   *
   * @includeExample examples/user/runner.ts
   */
  async runner({
    runnerId,
  }: {
    runnerId: string;
  }): Promise<SingleRunnerResponse.AsObject["runner"]> {
    const request = new GetRunnerRequest();
    request.setUserAppId(this.userAppId);
    request.setRunnerId(runnerId);
    const getRunner = promisifyGrpcCall(
      this.STUB.client.getRunner,
      this.STUB.client,
    );
    const response = await this.grpcRequest(getRunner, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(
        `Failed to retrieve runner: ${responseObject.status?.description}`,
      );
    }
    return responseObject.runner;
  }

  /**
   * Deletes an app for the user.
   *
   * @param appId The app ID for the app to delete.
   *
   * @example examples/user/deleteApp.ts
   */
  async deleteApp({ appId }: { appId: string }): Promise<void> {
    const request = new DeleteAppRequest();
    const appIdSet = new UserAppIDSet();
    appIdSet.setUserId(this.userAppId.getUserId());
    appIdSet.setAppId(appId);
    request.setUserAppId(appIdSet);
    const deleteApp = promisifyGrpcCall(
      this.STUB.client.deleteApp,
      this.STUB.client,
    );
    const response = await this.grpcRequest(deleteApp, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    console.info("\nApp Deleted\n%s", responseObject.status.description);
  }

  /**
   * Deletes a runner for the user.
   *
   * @param runnerId The runner ID to delete.
   *
   * @includeExample examples/user/deleteRunner.ts
   */
  async deleteRunner({ runnerId }: { runnerId: string }): Promise<void> {
    const request = new DeleteRunnersRequest();
    request.setUserAppId(this.userAppId);
    request.setIdsList([runnerId]);
    const deleteRunners = promisifyGrpcCall(
      this.STUB.client.deleteRunners,
      this.STUB.client,
    );
    const response = await this.grpcRequest(deleteRunners, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    console.info("\nRunner Deleted\n%s", responseObject.status.description);
  }
}
