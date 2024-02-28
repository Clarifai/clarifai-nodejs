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
  ): AsyncGenerator<TResponse, void, unknown> {
    let page = pageNo;

    while (true) {
      // Prepare request data
      // @ts-expect-error - TS doesn't know that the method exists
      requestData.setPage(page);
      if (perPage) {
        // @ts-expect-error - TS doesn't know that the method exists
        requestData.setPerPage(perPage);
      }

      // Perform gRPC request
      const response = await this.grpcRequest(endpoint, requestData);
      const responseObject = response.toObject();

      // Check response status
      if (responseObject.status?.code !== StatusCode.SUCCESS) {
        throw new Error(`Listing failed with response ${response}`);
      }

      // Process and yield response items
      if (Object.keys(responseObject).length === 1) {
        break;
      } else {
        yield response;
      }

      // Exit loop if pagination is not to be continued
      if (pageNo !== undefined || perPage !== undefined) {
        break;
      }
      page += 1;
    }
  }
}
