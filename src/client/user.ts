// import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
import { Lister } from "./lister";
import { KWArgs } from "../utils/types";
import { ListAppsRequest } from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { mapParamsToRequest, promisifyGrpcCall } from "../utils/misc";

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
  //   private logger: Logger;

  constructor(kwargs: KWArgs = {}) {
    super({ kwargs });
    // this.logger = getLogger("INFO", __filename);
  }

  // Convert generator functions to async functions returning Promises of arrays
  async *listApps({
    params = {},
    pageNo,
    perPage,
  }: {
    params?:
      | Omit<ListAppsRequest.AsObject, "userAppId">
      | Record<string, never>;
    pageNo?: number;
    perPage?: number;
  }) {
    const listApps = promisifyGrpcCall(this.STUB.client.listApps);
    const request = new ListAppsRequest();
    mapParamsToRequest(params, request);

    yield this.listPagesGenerator(listApps, request, pageNo, perPage);
  }

  //   async listRunners(
  //     filterBy: Record<string, any> = {},
  //     pageNo?: number,
  //     perPage?: number,
  //   ) {}

  //   async createApp(
  //     appId: string,
  //     baseWorkflow: string = "Empty",
  //     kwargs: Record<string, any> = {},
  //   ) {}

  // TypeScript does not have a direct equivalent to Python's __getattr__, so this functionality may need to be implemented differently if required.

  toString() {
    // Implementation of a method to return user details as a string
  }
}
