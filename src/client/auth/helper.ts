import resources_pb from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import clarifai_nodejs_grpc from "clarifai-nodejs-grpc";
const { grpc } = clarifai_nodejs_grpc;
import { V2Client } from "clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb";
import process from "process";
import fs from "fs";

// TypeScript interface for the cache
export interface Cache {
  [key: string]: boolean;
}

const DEFAULT_BASE = "https://api.clarifai.com";
const DEFAULT_UI = "https://clarifai.com";

const validResourceTypes = [
  "modules",
  "models",
  "concepts",
  "inputs",
  "workflows",
  "tasks",
  "installed_module_versions",
] as const;

// Map from base domain to True / False for whether the base has https or http.
const baseHttpsCache: Cache = {};
const uiHttpsCache: Cache = {};

const MAX_MESSAGE_LENGTH = 1024 * 1024 * 1024; // 1GB
const requestOptions = {
  "grpc.max_receive_message_length": MAX_MESSAGE_LENGTH,
  "grpc.max_send_message_length": MAX_MESSAGE_LENGTH,
};

function getHostnameFromUrl(url: string): string {
  // Remove protocol (http, https) if present
  let hostname = url.indexOf("//") > -1 ? url.split("/")[2] : url.split("/")[0];

  // Remove port number if present
  hostname = hostname.split(":")[0];

  // Remove path if present
  hostname = hostname.split("?")[0];

  return hostname;
}

export function clearCache(): void {
  Object.keys(baseHttpsCache).forEach((key) => delete baseHttpsCache[key]);
  Object.keys(uiHttpsCache).forEach((key) => delete uiHttpsCache[key]);
}

export function httpsCache(cache: Cache, url: string): string {
  const HTTPS = true;
  const HTTP = false;

  if (url.startsWith("https://")) {
    url = url.replace("https://", "");
    cache[url] = HTTPS;
  } else if (url.startsWith("http://")) {
    url = url.replace("http://", "");
    cache[url] = HTTP;
  } else if (!(url in cache)) {
    // Assuming HTTPS for any URLs without a scheme that end with .clarifai.com
    const hostname = getHostnameFromUrl(url);
    if (hostname && hostname.endsWith(".clarifai.com")) {
      cache[url] = HTTPS;
    } else {
      // For URLs without a scheme and not ending with .clarifai.com, prompt user to provide the scheme
      throw new Error(
        `Please provide a valid scheme for the ${url}, either use http:// or https://`,
      );
    }
  }
  return url;
}

export class ClarifaiAuthHelper {
  private userId: string;
  private appId: string;
  private _pat: string;
  private token: string;
  private _base: string;
  private _ui: string;
  private _rootCertificatesPath: string;

  /**
   * A helper to get the authorization information needed to make API calls with the grpc
   * client to a specific app using a personal access token.
   *
   * There are class methods to make this object easily from either query_params provided by streamlit or from env vars.
   *
   * Note: only one of personal access token (pat) or a session token (token) can be provided.
   * Always use PATs in your code and never session tokens, those are only provided internal UI code.
   *
   * @param user_id - A user id who owns the resource you want to make calls to.
   * @param app_id - An app id for the application that owns the resource you want to interact with.
   * @param pat - A personal access token.
   * @param token - A session token (internal use only, always use a PAT).
   * @param base - A url to the API endpoint to hit. Examples include api.clarifai.com,
   *               https://api.clarifai.com (default), https://host:port, http://host:port,
   *               host:port (will be treated as http, not https). It's highly recommended to include
   *               the http:// or https:// otherwise we need to check the endpoint to determine if it has SSL during this __init__.
   * @param ui - A url to the UI. Examples include clarifai.com,
   *             https://clarifai.com (default), https://host:port, http://host:port,
   *             host:port (will be treated as http, not https). It's highly recommended to include
   *             the http:// or https:// otherwise we need to check the endpoint to determine if it has SSL during this __init__.
   * @param rootCertificatesPath - path to the root certificates file. This is only used for grpc secure channels.
   * @param validate - Whether to validate the inputs. This is useful for overriding vars then validating.
   */
  constructor(
    userId: string,
    appId: string,
    pat: string,
    token: string = "",
    base: string = DEFAULT_BASE,
    ui: string = DEFAULT_UI,
    rootCertificatesPath: string = "",
    validate: boolean = true,
  ) {
    this.userId = userId;
    this.appId = appId;
    this._pat = pat;
    this.token = token;
    this._rootCertificatesPath = rootCertificatesPath;
    this._base = base;
    this._ui = ui;

    this.setBase(base);
    this.setUi(ui);

    if (validate) {
      this.validate();
    }
  }

  private validate(): void {
    if (this.userId === "") {
      throw new Error(
        "Need 'user_id' to not be empty in the query params or use CLARIFAI_USER_ID env var",
      );
    }
    if (this.appId === "") {
      throw new Error(
        "Need 'app_id' to not be empty in the query params or use CLARIFAI_APP_ID env var",
      );
    }
    if (this._pat !== "" && this.token !== "") {
      throw new Error(
        "A personal access token OR a session token need to be provided, but you cannot provide both.",
      );
    } else if (this._pat === "" && this.token === "") {
      throw new Error(
        "Need 'pat' or 'token' in the query params or use one of the CLARIFAI_PAT or CLARIFAI_SESSION_TOKEN env vars",
      );
    } else if (
      this._rootCertificatesPath &&
      !fs.existsSync(this._rootCertificatesPath)
    ) {
      throw new Error(
        `Root certificates path ${this._rootCertificatesPath} does not exist`,
      );
    }
  }

  /**
   * Will look for the following env vars:
   * user_id: CLARIFAI_USER_ID env var.
   * app_id: CLARIFAI_APP_ID env var.
   * one of:
   *   token: CLARIFAI_SESSION_TOKEN env var.
   *   pat: CLARIFAI_PAT env var.
   * base: CLARIFAI_API_BASE env var.
   *
   * @param validate - Whether to validate the inputs. This is useful for overriding vars then validating.
   */
  static fromEnv(validate: boolean = true): ClarifaiAuthHelper {
    const userId = process.env.CLARIFAI_USER_ID || "";
    const appId = process.env.CLARIFAI_APP_ID || "";
    const token = process.env.CLARIFAI_SESSION_TOKEN || "";
    const pat = process.env.CLARIFAI_PAT || "";
    const base = process.env.CLARIFAI_API_BASE || DEFAULT_BASE;
    const ui = process.env.CLARIFAI_UI || DEFAULT_UI;
    const rootCertificatesPath =
      process.env.CLARIFAI_ROOT_CERTIFICATES_PATH || "";

    return new ClarifaiAuthHelper(
      userId,
      appId,
      pat,
      token,
      base,
      ui,
      rootCertificatesPath,
      validate,
    );
  }

  /**
   * Get the gRPC metadata that contains either the session token or the PAT to use.
   *
   * @param userId - Optional user ID to override the default.
   * @param appId - Optional app ID to override the default.
   * @returns The metadata needed to send with all gRPC API calls in the API client.
   */
  getUserAppIdProto(
    userId?: string,
    appId?: string,
  ): resources_pb.UserAppIDSet {
    const effectiveUserId = userId ?? this.userId;
    const effectiveAppId = appId ?? this.appId;
    const userAppIdSet = new resources_pb.UserAppIDSet();
    userAppIdSet.setUserId(effectiveUserId);
    userAppIdSet.setAppId(effectiveAppId);
    return userAppIdSet;
  }

  /**
   * Get the gRPC metadata that contains either the session token or the PAT to use.
   *
   * @returns The metadata needed to send with all gRPC API calls in the API client.
   */
  get metadata(): [string, string][] {
    if (this._pat !== "") {
      return [["authorization", `Key ${this._pat}`]];
    } else if (this.token !== "") {
      return [["x-clarifai-session-token", this.token]];
    } else {
      throw new Error(
        "'token' or 'pat' needed to be provided in the query params or env vars.",
      );
    }
  }

  /**
   * Get the API gRPC stub using the right channel based on the API endpoint base.
   * TODO: This method is currently not implemented due to the lack of a gRPC V2Stub in clarifai-node.js.
   *
   * @returns V2Client - The gRPC client to use to make API calls.
   */
  getStub(): V2Client {
    if (!(this._base in baseHttpsCache)) {
      throw new Error(`Cannot determine if base ${this._base} is https`);
    }

    const https = baseHttpsCache[this._base];

    let client: V2Client;

    if (https) {
      if (this._rootCertificatesPath) {
        client = new V2Client(
          this._base,
          grpc.ChannelCredentials.createSsl(
            fs.readFileSync(this._rootCertificatesPath),
          ),
          requestOptions,
        );
      } else {
        client = new V2Client(
          this._base,
          grpc.ChannelCredentials.createSsl(),
          requestOptions,
        );
      }
    } else {
      let host: string;
      let port: number = 80;
      if (this._base.includes(":")) {
        [host, port] = this._base
          .split(":")
          .map((item, index) => (index === 1 ? parseInt(item) : item)) as [
          string,
          number,
        ];
      } else {
        host = this._base;
      }
      client = new V2Client(
        `${host}:${port}`,
        grpc.ChannelCredentials.createInsecure(),
        requestOptions,
      );
    }

    return client;
  }

  /**
   * Return the domain for the UI.
   */
  get ui(): string {
    if (!(this._ui in uiHttpsCache)) {
      throw new Error(`Cannot determine if ui ${this._ui} is https`);
    }

    const https = uiHttpsCache[this._ui];
    if (https) {
      return this._ui.startsWith("https://") ? this._ui : `https://${this._ui}`;
    } else {
      return this._ui.startsWith("http://") ? this._ui : `http://${this._ui}`;
    }
  }

  /**
   * set the base domain for the API.
   * @param base - The base domain to set.
   */
  setBase(base: string): void {
    this._base = httpsCache(baseHttpsCache, base);
  }

  /**
   * set the domain for the UI.
   * @param ui - The UI domain to set.
   */
  setUi(ui: string): void {
    this._ui = httpsCache(uiHttpsCache, ui);
  }

  /**
   * Return the root certificates path.
   */
  get rootCertificatesPath(): string {
    return this._rootCertificatesPath;
  }

  /**
   * Return the base domain for the API.
   */
  get base(): string {
    if (!(this._base in baseHttpsCache)) {
      throw new Error(`Cannot determine if base ${this._base} is https`);
    }

    const https = baseHttpsCache[this._base];
    if (https) {
      return this._base.startsWith("https://")
        ? this._base
        : `https://${this._base}`;
    } else {
      return this._base.startsWith("http://")
        ? this._base
        : `http://${this._base}`;
    }
  }

  /**
   * Return the personal access token.
   */
  get pat(): string {
    return this._pat;
  }

  /**
   * Returns a string representation of the class.
   */
  toString(): string {
    return `ClarifaiAuthHelper:\n- base: ${this._base}\n- user_id: ${this.userId}\n- app_id: ${this.appId}`;
  }

  /**
   * Return the list of the required environment variables.
   */
  static requiredEnvVars(): string[] {
    return ["CLARIFAI_USER_ID", "CLARIFAI_APP_ID", "CLARIFAI_PAT"];
  }

  /**
   * Validate the secrets.toml file has been filled with non-empty values for all the auth parameters that are present.
   *
   * @param tomlDict - The dictionary obtained from the secrets.toml file.
   */
  static validateSecretsDict(tomlDict: Record<string, unknown>): boolean {
    const authKeys = ClarifaiAuthHelper.requiredEnvVars();

    for (const [key, value] of Object.entries(tomlDict)) {
      if (authKeys.includes(key) && value === "") {
        throw new Error(`'${key}' in secrets.toml cannot be empty`);
      }
    }
    // Assuming all non-present keys have non-empty values.
    return true;
  }

  clarifaiUrl({
    resourceType,
    resourceId,
    versionId,
  }: {
    resourceType: (typeof validResourceTypes)[number];
    resourceId: string;
    versionId?: string;
  }): string {
    if (!validResourceTypes.includes(resourceType)) {
      throw new Error(
        `resourceType must be one of ${validResourceTypes.join(", ")} but was ${resourceType}`,
      );
    }
    if (!versionId) {
      return `${this.base}/${this.userId}/${this.appId}/${resourceType}/${resourceId}`;
    }
    return `${this.base}/${this.userId}/${this.appId}/${resourceType}/${resourceId}/versions/${versionId}`;
  }
}
