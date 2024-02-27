import * as grpc from "@grpc/grpc-js";
import * as jspb from "google-protobuf";
import { KWArgs } from "../utils/types";
import { BaseClient } from "./base";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
import { Status } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_pb";

export class Lister extends BaseClient {
  defaultPageSize: number;

  constructor({
    kwargs = {},
    pageSize = 16,
  }: {
    kwargs?: KWArgs;
    pageSize?: number;
  }) {
    super(kwargs);
    this.defaultPageSize = pageSize;
  }

  /**
   * TODO: Implement the actual pagination logic
   */
  async *listPagesGenerator<
    TRequest extends jspb.Message,
    TResponseObject extends { status?: Status.AsObject },
    TResponse extends {
      toObject: (arg?: boolean) => TResponseObject;
    },
  >(
    endpoint: (
      request: TRequest,
      metadata: grpc.Metadata,
      options: Partial<grpc.CallOptions>,
    ) => Promise<TResponse>,
    requestData: TRequest,
    pageNo: number = 1,
    perPage: number = this.defaultPageSize,
  ) {
    // Initial setup
    let page = pageNo;

    while (true) {
      // Prepare request data
      // @ts-expect-error - TS doesn't know that the method exists
      requestData["page"] = page;
      if (perPage) {
        // @ts-expect-error - TS doesn't know that the method exists
        requestData["per_page"] = perPage;
      }

      // Perform gRPC request
      const response = await this.grpcRequest(endpoint, requestData);

      // Check response status
      if (response.toObject().status?.code !== StatusCode.SUCCESS) {
        throw new Error(`Listing failed with response ${response}`);
      }

      // Process and yield response items
      if (Object.keys(response).length === 1) {
        break;
      } else {
        yield response;
        // const listingResource = Object.keys(response)[1];
        // for (const item of response[listingResource]) {
        //   if (listingResource === "dataset_inputs") {
        //     yield this.processResponseKeys(
        //       item["input"],
        //       listingResource.slice(0, -1),
        //     );
        //   } else {
        //     yield this.processResponseKeys(item, listingResource.slice(0, -1));
        //   }
        // }
      }

      // Exit loop if pagination is not to be continued
      if (pageNo !== undefined || perPage !== undefined) {
        break;
      }
      page += 1;
    }
  }
}
