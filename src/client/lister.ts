import { grpc } from "clarifai-nodejs-grpc";
import * as jspb from "google-protobuf";
import { AuthConfig } from "../utils/types";
import { BaseClient } from "./base";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
import { Status } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_pb";

export class Lister extends BaseClient {
  defaultPageSize: number;

  constructor({
    authConfig = {},
    pageSize = 16,
  }: {
    authConfig?: AuthConfig;
    pageSize?: number;
  }) {
    super(authConfig);
    this.defaultPageSize = pageSize;
  }

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

      const dataListEntries = Object.entries(responseObject).find(
        ([key, value]) => key !== "status" && Array.isArray(value),
      );

      if (!dataListEntries) {
        break; // If no data list is found, stop pagination
      }

      const [, dataList] = dataListEntries;

      // If the length of the data list is less than perPage, it means we've reached the end
      // @ts-expect-error - TS doesn't know that data format is array
      if (dataList.length === 0) {
        break;
      }

      yield response;

      // If the length of the data list is less than perPage, it means we've reached the end
      // @ts-expect-error - TS doesn't know that data format is array
      if (dataList.length < perPage) {
        break;
      }

      page += 1;
    }
  }

  async listPagesData<
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
  ): Promise<TResponse> {
    // Prepare request data
    // @ts-expect-error - TS doesn't know that the method exists
    requestData.setPage(pageNo);
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

    return response;
  }
}
