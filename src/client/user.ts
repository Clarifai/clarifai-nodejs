import { Lister } from "./lister";
import { AuthConfig, RequestParams } from "../utils/types";
import {
  ListAppsRequest,
  ListRunnersRequest,
  MultiAppResponse,
  MultiRunnerResponse,
  PostAppsRequest,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { mapParamsToRequest, promisifyGrpcCall } from "../utils/misc";
import {
  App,
  Workflow,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";

export class User extends Lister {
  constructor(authConfig: AuthConfig = {}) {
    super({ authConfig });
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
  }: {
    appId: string;
    baseWorkflow: string;
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

    return responseObject;
  }
}
