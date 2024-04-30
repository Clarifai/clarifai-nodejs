import { version as nodeVersion } from "process";
import * as os from "os";
import packageJson from "../package.json";
import { logger } from "./utils/logging";

const CLIENT_VERSION = packageJson.version;
const OS_VER = os.platform() + " " + os.release();
const NODE_VERSION = nodeVersion;

export class GRPCError extends Error {}

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
