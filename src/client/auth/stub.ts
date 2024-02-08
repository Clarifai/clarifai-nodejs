import { credentials, Metadata, ServiceError, status } from "@grpc/grpc-js";
import { V2Client } from "clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb";
import { ClarifaiAuthHelper } from "./helper";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";

const throttleStatusCodes = new Set([
  StatusCode.CONN_THROTTLED,
  StatusCode.CONN_EXCEED_HOURLY_LIMIT,
]);

const retryCodesGrpc = new Set([
  status.UNAVAILABLE, // gRPC status code for retries
]);

export class AuthorizedStub {
  private authHelper: ClarifaiAuthHelper;
  private stub: V2Client;

  constructor(authHelper: ClarifaiAuthHelper) {
    this.authHelper = authHelper;
    this.stub = new V2Client(authHelper.base, credentials.createSsl());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async makeCall<T>(methodName: string, request: any): Promise<T> {
    const metadata = new Metadata();
    const authMetadata = this.authHelper.metadata;
    Object.keys(authMetadata).forEach((key) => {
      // @ts-expect-error TODO: type not clearly defined yet
      metadata.set(key, authMetadata[key]);
    });

    return new Promise<T>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (this.stub as any)[methodName] !== "function") {
        reject(new Error(`Method ${methodName} does not exist on stub`));
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
      const method: Function = (this.stub as any)[methodName];
      method.call(
        this.stub,
        request,
        metadata,
        (err: ServiceError | null, response: T) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        },
      );
    });
  }
}

export class RetryStub extends AuthorizedStub {
  private maxAttempts: number;
  private backoffTime: number;

  constructor(
    authHelper: ClarifaiAuthHelper,
    maxAttempts: number = 10,
    backoffTime: number = 5,
  ) {
    super(authHelper);
    this.maxAttempts = maxAttempts;
    this.backoffTime = backoffTime;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async makeCall<T>(methodName: string, request: any): Promise<T> {
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const response = await super.makeCall<T>(methodName, request);
        return response;
      } catch (err) {
        const errorCode = (err as ServiceError).code;
        if (
          retryCodesGrpc.has(errorCode) ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (err as any).status?.code in throttleStatusCodes
        ) {
          console.log(`Attempt ${attempt} failed, retrying...`);
          if (attempt < this.maxAttempts) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.backoffTime * 1000),
            );
            continue;
          }
        }
        throw err;
      }
    }
    throw new Error("Max retry attempts reached");
  }
}

export function createStub(
  authHelper: ClarifaiAuthHelper,
  maxRetryAttempts: number = 10,
): AuthorizedStub | RetryStub {
  /*
   Create client stub that handles authorization and basic retries for
   unavailable or throttled connections.

   Args:
    authHelper: ClarifaiAuthHelper to use for auth metadata (default: from env)
    maxRetryAttempts: max attempts to retry RPCs with retryable failures
  */

  // Assuming AuthorizedStub's constructor can handle a null authHelper by defaulting internally or through another mechanism
  const stub: AuthorizedStub = new AuthorizedStub(authHelper);

  if (maxRetryAttempts > 0) {
    return new RetryStub(authHelper, maxRetryAttempts);
  }

  return stub;
}
