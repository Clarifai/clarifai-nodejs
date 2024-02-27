import { UserAppIDSet } from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { ClarifaiAuthHelper } from "./auth/helper";
import { getFromDictOrEnv } from "../utils/misc";
import { createStub } from "./auth/stub";
import { V2Stub } from "./auth/register";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { KWArgs } from "../utils/types";
import * as jspb from "google-protobuf";
import * as grpc from "@grpc/grpc-js";
import { Status } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_pb";

/**
 * BaseClient is the base class for all the classes interacting with Clarifai endpoints.
 * It initializes with various configuration options to set up the authentication helper,
 * gRPC stub, and other necessary properties for interacting with the Clarifai API.
 *
 * @property {ClarifaiAuthHelper} authHelper An instance of ClarifaiAuthHelper for authentication.
 * @property {V2Stub} STUB The gRPC Stub object for API interaction.
 * @property {[string, string][]} metadata The gRPC metadata containing the personal access token.
 * @property {string} pat The personal access token.
 * @property {UserAppIDSet} userAppId The protobuf object representing user and app IDs.
 * @property {string} base The base URL for the API endpoint.
 */
export class BaseClient {
  protected authHelper: ClarifaiAuthHelper;
  protected STUB: V2Stub;
  protected metadata: [string, string][];
  protected pat: string;
  protected userAppId: UserAppIDSet;
  protected base: string;

  /**
   * Constructs a new BaseClient instance with specified configuration options.
   *
   * @param {Object} kwargs Configuration options for the client.
   * @param {string} kwargs.userId A user ID for authentication.
   * @param {string} kwargs.appId An app ID for the application to interact with.
   * @param {string} kwargs.pat A personal access token for authentication. If not provided, it attempts to fetch from environment variables.
   * @param {string} [kwargs.token] An optional token for authentication.
   * @param {string} [kwargs.base='https://api.clarifai.com'] The base URL for the API endpoint. Defaults to 'https://api.clarifai.com'.
   * @param {string} [kwargs.ui='https://clarifai.com'] The URL for the UI. Defaults to 'https://clarifai.com'.
   */
  constructor(kwargs: KWArgs = {}) {
    const pat = getFromDictOrEnv("pat", "CLARIFAI_PAT", kwargs);
    kwargs.pat = pat;
    this.authHelper =
      Object.keys(kwargs).length === 0
        ? new ClarifaiAuthHelper(
            kwargs.userId,
            kwargs.appId,
            kwargs.pat,
            kwargs.token,
            kwargs.base,
            kwargs.ui,
            false,
          )
        : ClarifaiAuthHelper.fromEnv(false); // The validate parameter is set to false explicitly
    this.STUB = createStub(this.authHelper);
    this.metadata = this.authHelper.metadata;
    this.pat = this.authHelper.pat;
    this.userAppId = this.authHelper.getUserAppIdProto();
    this.base = this.authHelper.base;
  }

  /**
   * Makes a gRPC request to the API.
   *
   * @param method The gRPC method to call.
   * @param argument The argument to pass to the gRPC method.
   * @returns A Promise resolving to the result of the gRPC method call.
   */
  protected async grpcRequest<
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
  ): Promise<TResponse> {
    return await this.STUB.makeCallPromise(endpoint, requestData);
  }

  /**
   * Converts a string to a Timestamp object.
   *
   * @param dateStr The string to convert.
   * @returns A Timestamp object representing the given date string.
   */
  convertStringToTimestamp(dateStr: string): Timestamp {
    const timestamp = new Timestamp();

    // Attempt to parse the date string into a Date object
    const datetimeObj = new Date(dateStr);

    // Check if the date is valid
    if (isNaN(datetimeObj.getTime())) {
      throw new Error("Invalid date string");
    }

    // Convert the Date object to a Timestamp
    timestamp.fromDate(datetimeObj);

    return timestamp;
  }

  /**
   * Converts keys in a response object to resource proto format.
   *
   * @param oldObj The object to convert.
   * @param listingResource Optionally specifies a resource name to transform 'id' keys.
   * @returns The object with keys processed according to protobuf structures.
   *
   * TODO: Implement the actual conversion logic
   */
  processResponseKeys() {
    throw new Error("Not implemented");
  }
}
