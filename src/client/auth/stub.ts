import { ServiceError, status } from "@grpc/grpc-js";
import { V2Client } from "clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb";
import { ClarifaiAuthHelper } from "./helper";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
import { V2Stub } from "./register";
import { grpc } from "clarifai-nodejs-grpc";

const throttleStatusCodes = new Set([
  StatusCode.CONN_THROTTLED,
  StatusCode.CONN_EXCEED_HOURLY_LIMIT,
]);

const retryCodesGrpc = new Set([
  status.UNAVAILABLE, // gRPC status code for retries
]);

// Utility type to extract the first parameter type from a function
export type FirstParameterType<T> = T extends (
  arg1: infer P,
  ...args: unknown[]
) => unknown
  ? P
  : never;

// Utility type to extract the callback parameter type from a function
type CallbackParameterType<T> = T extends (
  arg1: unknown,
  callback: infer P,
  ...args: unknown[]
) => unknown
  ? P
  : never;

// Utility type to infer response type from callback
type CallbackResponseType<T> = T extends (
  error: grpc.ServiceError | null,
  response: infer R,
) => void
  ? R
  : never;

export class AuthorizedStub {
  private authHelper: ClarifaiAuthHelper;
  private stub: V2Client;
  private metadata: [string, string][];

  constructor(authHelper?: ClarifaiAuthHelper) {
    if (!authHelper) {
      this.authHelper = ClarifaiAuthHelper.fromEnv();
    } else {
      this.authHelper = authHelper;
    }

    this.stub = this.authHelper.getStub();
    this.metadata = this.authHelper.metadata;
  }

  async makeCall<MethodName extends keyof V2Client>(
    methodName: MethodName,
    request: FirstParameterType<V2Client[MethodName]>,
  ): Promise<
    CallbackResponseType<CallbackParameterType<V2Client[MethodName]>>
  > {
    const metadata = new grpc.Metadata();
    const authMetadata = this.metadata;
    authMetadata.forEach((meta) => {
      metadata.set(meta?.[0], meta?.[1]);
    });

    return new Promise((resolve, reject) => {
      const methodFunction = this.stub[methodName];

      if (typeof methodFunction !== "function") {
        reject(new Error(`Method ${methodName} does not exist on stub`));
        return;
      }

      // TODO - Fix the type issue with manually invoking the methodFunction
      // @ts-expect-error - TS doesn't know that methodFunction has overloads & only expects 5 arguments
      methodFunction.call(this.stub, request, metadata, {}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          // TODO - Fix the type issue with the response
          // @ts-expect-error - Response type is not fully inferred
          resolve(response);
        }
      });
    });
  }
}

export class RetryStub extends AuthorizedStub {
  private maxAttempts: number;
  private backoffTime: number;

  constructor(
    authHelper?: ClarifaiAuthHelper,
    maxAttempts: number = 10,
    backoffTime: number = 5,
  ) {
    super(authHelper);
    this.maxAttempts = maxAttempts;
    this.backoffTime = backoffTime;
  }

  async makeCall<MethodName extends keyof V2Client>(
    methodName: MethodName,
    request: FirstParameterType<V2Client[MethodName]>,
  ): Promise<
    CallbackResponseType<CallbackParameterType<V2Client[MethodName]>>
  > {
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const response = await super.makeCall(methodName, request);
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

/**
 * Create client stub that handles authorization and basic retries for
 * unavailable or throttled connections.
 * Args:
 *  authHelper: ClarifaiAuthHelper to use for auth metadata (default: from env)
 *  maxRetryAttempts: max attempts to retry RPCs with retryable failures (default: 10)
 */
export function createStub(
  authHelper?: ClarifaiAuthHelper,
  maxRetryAttempts: number = 10,
): V2Stub {
  // Assuming AuthorizedStub's constructor can handle a null authHelper by defaulting internally or through another mechanism
  const stub: AuthorizedStub = new AuthorizedStub(authHelper);

  if (maxRetryAttempts > 0) {
    return new RetryStub(authHelper, maxRetryAttempts);
  }

  return stub;
}
