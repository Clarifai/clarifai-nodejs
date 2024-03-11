import { Lister } from "./lister";
import { AuthConfig, PaginationRequestParams } from "../utils/types";
import {
  GetAppRequest,
  ListAppsRequest,
  ListRunnersRequest,
  MultiAppResponse,
  MultiRunnerResponse,
  PostAppsRequest,
  PostRunnersRequest,
  SingleAppResponse,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { mapParamsToRequest, promisifyGrpcCall } from "../utils/misc";
import {
  App,
  Runner,
  UserAppIDSet,
  Workflow,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";

/**
 * User is a class that provides access to Clarifai API endpoints related to user information.
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
   * @param [authConfig] Additional keyword arguments can be passed to configure the User object.
   */
  constructor(authConfig: AuthConfig = {}) {
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
   * @example
   * ```typescript
   * import { User } from 'clarifai-nodejs';
   * const user = new User(authConfig);
   * const appsGenerator = user.listApps({
   *   pageNo: 1,
   *   perPage: 20,
   *   params: {
   *     sortAscending: true,
   *   },
   * });
   * const apps = (await appsGenerator.next()).value;
   * ```
   *
   * @note Defaults to 16 per page if pageNo is specified and perPage is not specified.
   * If both pageNo and perPage are None, then lists all the resources.
   */
  async *listApps({
    params = {},
    pageNo,
    perPage,
  }: {
    params?: PaginationRequestParams<ListAppsRequest.AsObject>;
    pageNo?: number;
    perPage?: number;
  }): AsyncGenerator<MultiAppResponse.AsObject, void, unknown> {
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
      yield item.toObject();
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
   * @example
   * ```typescript
   * import { User } from 'clarifai-nodejs';
   * const user = new User(authConfig);
   * const runnersGenerator = user.listRunners({
   *   pageNo: 1,
   *   perPage: 20,
   *   params: {
   *     sortAscending: true,
   *   },
   * });
   * const runners = (await runnersGenerator.next()).value;
   * ```
   *
   * @note Defaults to 16 per page if pageNo is specified and perPage is not specified.
   * If both pageNo and perPage are None, then lists all the resources.
   */
  async *listRunners({
    params = {},
    pageNo,
    perPage,
  }: {
    params?: PaginationRequestParams<ListRunnersRequest.AsObject>;
    pageNo?: number;
    perPage?: number;
  }): AsyncGenerator<MultiRunnerResponse.AsObject, void, unknown> {
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
   * @example
   * ```typescript
   * import { User } from 'clarifai-nodejs';
   * const user = new User(authConfig);
   * const app = await user.createApp({
   *   appId: "app_id",
   *   baseWorkflow: "Universal",
   * });
   * ```
   */
  async createApp({
    appId,
    baseWorkflow = "Empty",
  }: {
    appId: string;
    baseWorkflow: string;
  }): Promise<MultiAppResponse.AsObject> {
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

    return responseObject;
  }

  /**
   * Creates a runner for the user.
   *
   * @param runnerId The Id of runner to create.
   * @param labels Labels to match runner.
   * @param description Description of Runner.
   * @returns A runner object for the specified Runner ID.
   *
   * @example
   * ```typescript
   * import { User } from 'clarifai-nodejs';
   * const user = new User(authConfig);
   * const runner = await user.createRunner({
   *   runnerId: "runner_id",
   *   labels: ["label to link runner"],
   *   description: "laptop runner",
   * });
   * ```
   */
  async createRunner({
    runnerId,
    labels,
    description,
  }: {
    runnerId: string;
    labels: string[];
    description: string;
  }): Promise<MultiRunnerResponse.AsObject> {
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

    return responseObject;
  }

  /**
   * Returns an App object for the specified app ID.
   *
   * @param appId The app ID for the app to interact with.
   * @returns An App object for the specified app ID.
   *
   * @example
   * ```typescript
   * import { User } from 'clarifai-nodejs';
   * const user = new User(authConfig);
   * const app = await user.app({ appId: 'app_id' });
   * ```
   */
  async app({ appId }: { appId: string }): Promise<SingleAppResponse.AsObject> {
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
    return responseObject;
  }
}
