import { V2Client } from "clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb";
import { UserError } from "../errors";
import { GrpcWithCallback, AuthConfig } from "./types";
import clarifai_nodejs_grpc from "clarifai-nodejs-grpc";

/**
 * Get a value from a dictionary or an environment variable.
 */
export function getFromDictOrEnv(
  key: string,
  envKey: string,
  data: { [key: string]: string },
): string {
  if (data?.[key]) {
    return data[key];
  } else {
    return getFromEnv(key, envKey);
  }
}

/**
 * Get a value from an environment variable.
 */
function getFromEnv(key: string, envKey: string): string {
  if (process.env?.[envKey]) {
    return process.env[envKey]!;
  } else {
    throw new UserError(
      `Did not find \`${key}\`, please add an environment variable \`${envKey}\` which contains it, or pass \`${key}\` as a named parameter.`,
    );
  }
}

export function promisifyGrpcCall<TRequest, TResponse>(
  func: GrpcWithCallback<TRequest, TResponse>,
  client: V2Client,
): (
  request: TRequest,
  metadata: clarifai_nodejs_grpc.grpc.Metadata,
  options: Partial<clarifai_nodejs_grpc.grpc.CallOptions>,
) => Promise<TResponse> {
  return (
    request: TRequest,
    metadata: clarifai_nodejs_grpc.grpc.Metadata,
    options: Partial<clarifai_nodejs_grpc.grpc.CallOptions>,
  ): Promise<TResponse> => {
    return new Promise((resolve, reject) => {
      func.bind(client)(request, metadata, options, (error, response) => {
        if (error) {
          return reject(error);
        }
        resolve(response);
      });
    });
  };
}

export function mergeObjects(obj1: AuthConfig, obj2: AuthConfig): AuthConfig {
  const result = { ...obj1 };

  type KnownKey = keyof AuthConfig;
  Object.entries(obj2).forEach(([key, value]) => {
    if (value) {
      result[key as KnownKey] = value;
    }
  });

  return result;
}

export class BackoffIterator {
  private count: number;

  constructor({ count } = { count: 0 }) {
    this.count = count;
  }

  [Symbol.iterator]() {
    return this;
  }

  next(): IteratorResult<number> {
    if (this.count < 1) {
      this.count += 1;
      return { value: 0.1, done: false };
    } else if (this.count < 7) {
      this.count += 1;
      return { value: 0.01 * Math.pow(2, this.count + 4), done: false };
    } else {
      return { value: 0.01 * Math.pow(2, 10), done: false };
    }
  }
}
