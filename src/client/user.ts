// import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
import { Lister } from "./lister";
import { KWArgs, RequestParams } from "../utils/types";
import {
  ListAppsRequest,
  ListRunnersRequest,
  MultiAppResponse,
  MultiRunnerResponse,
  PostAppsRequest,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import {
  mapParamsToRequest,
  mergeObjects,
  promisifyGrpcCall,
} from "../utils/misc";
// import { logger } from "../utils/logging";
import {
  App,
  Workflow,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { App as ClarifaiApp } from "./app";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";

// interface UserAppID {
//   userId?: string;
//   appId?: string;
// }

// interface AppInfo {
//   // Define properties based on the Python code's usage
// }

// interface RunnerInfo {
//   // Define properties based on the Python code's usage
// }

export class User extends Lister {
  // private logger;

  constructor(kwargs: KWArgs = {}) {
    super({ kwargs });
    // this.logger = logger;
  }

  async *listApps({
    params = {},
    pageNo,
    perPage,
  }: {
    params?:
      | Omit<
          Partial<ListAppsRequest.AsObject>,
          "userAppId" | "pageNo" | "perPage"
        >
      | Record<string, never>;
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

  async *listRunners({
    params = {},
    pageNo,
    perPage,
  }: {
    params?: RequestParams<ListRunnersRequest.AsObject>;
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

  async createApp({
    appId,
    baseWorkflow = "Empty",
    kwargs = {},
  }: {
    appId: string;
    baseWorkflow: string;
    kwargs: KWArgs;
  }) {
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

    // this.logger.info(
    //   `App created. Status Code: ${responseObject.status?.code}`,
    // );

    kwargs = mergeObjects(kwargs, {
      userId: this.userAppId.getUserId(),
      base: this.base,
      pat: this.pat,
      appId: responseObject.appsList?.[0]?.id,
    });

    return new ClarifaiApp({ kwargs });
  }

  // TypeScript does not have a direct equivalent to Python's __getattr__, so this functionality may need to be implemented differently if required.

  toString() {
    // Implementation of a method to return user details as a string
  }
}
