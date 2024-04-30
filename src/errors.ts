import { version as nodeVersion } from "process";
import * as os from "os";
import packageJson from "../package.json";
import { logger } from "./utils/logging";
import { Status } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_pb";

const CLIENT_VERSION = packageJson.version;
const OS_VER = os.platform() + " " + os.release();
const NODE_VERSION = nodeVersion;

logger.info(
  `\nClarifai Node.js Client version: ${CLIENT_VERSION}\nSystem Node version: ${NODE_VERSION}\nOS version: ${OS_VER}`,
);

interface GRPCResponse {
  status?: Status.AsObject;
}

export class GRPCError<T extends GRPCResponse> extends Error {
  constructor(description: string, grpcResponse: T) {
    super(
      `${description}${description ? " - " : ""}${
        grpcResponse.status?.details ??
        grpcResponse.status?.description ??
        "Unknown Server error"
      }`,
    );
    this.name = "GRPCError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GRPCError);
    }
    logger.error(`GRPC Response:\n${JSON.stringify(grpcResponse, null, 2)}`);
  }
}

export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserError);
    }
    logger.error(`UserError: ${message}`);
  }
}
