import { version as nodeVersion } from "process";
import * as os from "os";
import packageJson from "../package.json";

const CLIENT_VERSION = packageJson.version;
const OS_VER = os.platform() + " " + os.release();
const NODE_VERSION = nodeVersion;

interface Response {
  status: {
    code: string;
    description: string;
    details: string;
  };
}

export class TokenError extends Error {}

export class ApiError extends Error {
  resource: string;
  params: object;
  method: string;
  response: Response | null;
  error_code: string | null;
  error_desc: string | null;
  error_details: string | null;

  constructor(
    resource: string,
    params: object,
    method: string,
    response: Response | null = null,
  ) {
    super();
    this.resource = resource;
    this.params = params;
    this.method = method;
    this.response = response;
    this.error_code = "N/A";
    this.error_desc = "N/A";
    this.error_details = "N/A";

    let response_json: string = "N/A";
    if (response) {
      // TODO: Might need a function to convert response to JSON object
      const response_json_dict = response; // Adapt based on actual protobuf usage

      this.error_code = response_json_dict?.status?.code ?? "N/A";
      this.error_desc = response_json_dict?.status?.description ?? "N/A";
      this.error_details = response_json_dict?.status?.details ?? "N/A";
      response_json = JSON.stringify(response_json_dict.status, null, 2);
    }

    const current_ts_str = Date.now().toString();

    const msg = `${method} ${resource} FAILED(${current_ts_str}).  error_code: ${this.error_code}, error_description: ${this.error_desc}, error_details: ${this.error_details}
 >> Node client ${CLIENT_VERSION} with Node ${NODE_VERSION} on ${OS_VER}
 >> ${method} ${resource}
 >> REQUEST(${current_ts_str}) ${JSON.stringify(params, null, 2)}
 >> RESPONSE(${current_ts_str}) ${response_json}`;

    this.message = msg;
  }
}

export class ApiClientError extends Error {}
export class UserError extends Error {}
export class AuthError extends Error {}

export function baseUrl(url: string): string {
  try {
    return url.slice(0, nthOccurrence(url, "/", 4) + 1);
  } catch (e) {
    return "";
  }
}

export function nthOccurrence(str: string, char: string, n: number): number {
  let firstIndex = str.indexOf(char);
  let count = 1;
  while (firstIndex >= 0 && count < n) {
    firstIndex = str.indexOf(char, firstIndex + 1);
    count++;
  }
  return firstIndex;
}
