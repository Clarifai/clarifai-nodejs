import { V2Client } from "clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb";
import { UserError } from "../errors";
import { GrpcWithCallback, AuthConfig } from "./types";
import { grpc } from "clarifai-nodejs-grpc";

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

export function mapParamsToRequest<T>(
  params: Record<string, unknown>,
  request: T,
) {
  Object.entries(params).forEach(([key, value]) => {
    // Assuming direct mapping for simplicity
    const methodName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    // @ts-expect-error - TS doesn't know that the method exists
    if (typeof request[methodName] === "function") {
      // @ts-expect-error - TS doesn't know that the method exists
      request[methodName](value);
    } else {
      // Log or handle the absence of a setter method
      console.warn(`Method ${methodName} does not exist on ListAppsRequest`);
    }
  });
}

export function promisifyGrpcCall<TRequest, TResponse>(
  func: GrpcWithCallback<TRequest, TResponse>,
  client: V2Client,
): (
  request: TRequest,
  metadata: grpc.Metadata,
  options: Partial<grpc.CallOptions>,
) => Promise<TResponse> {
  return (
    request: TRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
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
