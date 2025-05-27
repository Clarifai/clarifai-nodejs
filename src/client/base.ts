import { UserAppIDSet } from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { ClarifaiAuthHelper } from "./auth/helper";
import { getFromDictOrEnv } from "../utils/misc";
import { createStub } from "./auth/stub";
import { V2Stub } from "./auth/register";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb.js";
import { AuthConfig } from "../utils/types";
import * as jspb from "google-protobuf";
import { grpc } from "clarifai-nodejs-grpc";
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
  protected rootCertificatesPath: string;

  /**
   * Constructs a new BaseClient instance with specified configuration options.
   *
   * @param {Object} authConfig Configuration options for the client.
   * @param {string} authConfig.userId A user ID for authentication.
   * @param {string} authConfig.appId An app ID for the application to interact with.
   * @param {string} authConfig.pat A personal access token for authentication. If not provided, it attempts to fetch from environment variables.
   * @param {string} [authConfig.token] An optional token for authentication.
   * @param {string} [authConfig.base='https://api.clarifai.com'] The base URL for the API endpoint. Defaults to 'https://api.clarifai.com'.
   * @param {string} [authConfig.ui='https://clarifai.com'] The URL for the UI. Defaults to 'https://clarifai.com'.
   * @param {string} [authConfig.rootCertificatesPath] Path to the SSL root certificates file, used to establish secure gRPC connections.
   */
  constructor(authConfig: AuthConfig = {}) {
    const pat = getFromDictOrEnv("pat", "CLARIFAI_PAT", authConfig);
    authConfig.pat = pat;
    this.authHelper =
      Object.keys(authConfig).length > 0
        ? new ClarifaiAuthHelper(
            authConfig.userId,
            authConfig.appId,
            authConfig.pat,
            authConfig.token,
            authConfig.base,
            authConfig.ui,
            authConfig.rootCertificatesPath,
            false,
          )
        : ClarifaiAuthHelper.fromEnv(false); // The validate parameter is set to false explicitly
    this.STUB = createStub(this.authHelper);
    this.metadata = this.authHelper.metadata;
    this.pat = this.authHelper.pat;
    this.userAppId = this.authHelper.getUserAppIdProto();
    this.base = this.authHelper.base;
    this.rootCertificatesPath = this.authHelper.rootCertificatesPath;
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
}
