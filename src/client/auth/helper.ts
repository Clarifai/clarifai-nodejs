import axios from "axios";
import resources_pb2 from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import process from "process";

// TypeScript interface for the cache
export interface Cache {
  [key: string]: boolean;
}

const DEFAULT_BASE = "https://api.clarifai.com";
const DEFAULT_UI = "https://clarifai.com";

// Map from base domain to True / False for whether the base has https or http.
const baseHttpsCache: Cache = {};
const uiHttpsCache: Cache = {};

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

export async function httpsCache(cache: Cache, url: string): Promise<string> {
  const HTTPS = true;
  const HTTP = false;

  if (url.startsWith("https://")) {
    url = url.replace("https://", "");
    cache[url] = HTTPS;
  } else if (url.startsWith("http://")) {
    url = url.replace("http://", "");
    cache[url] = HTTP;
  } else if (!(url in cache)) {
    const hostname = getHostnameFromUrl(url);
    if (hostname && hostname.endsWith(".clarifai.com")) {
      cache[url] = HTTPS;
    } else {
      try {
        await axios.get(`https://${url}/v2/auth/methods`, { timeout: 1000 });
        cache[url] = HTTPS;
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("SSL")) {
          cache[url] = HTTP;
          if (!url.includes(":")) {
            throw new Error(
              "When providing an insecure URL, it must have both host:port format.",
            );
          }
        } else {
          throw new Error(
            `Could not get a valid response from URL: ${url}, is the API running there?`,
          );
        }
      }
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

  constructor(
    userId: string,
    appId: string,
    pat: string,
    token: string = "",
    base: string = DEFAULT_BASE,
    ui: string = DEFAULT_UI,
    validate: boolean = true,
  ) {
    this.userId = userId;
    this.appId = appId;
    this._pat = pat;
    this.token = token;
    this._base = base;
    this._ui = ui;

    if (validate) {
      this.validate();
    }

    this.setBase(base);
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
    }
  }

  /**
   * TODO: This method cannot be directly implemented in Node.js TypeScript as there is no equivalent of Streamlit.
   * A similar functionality might be achieved by using environment variables and additional parameters from a web framework like Express.js.
   */
  static fromStreamlit(/* parameters, if any */): ClarifaiAuthHelper {
    // Method logic goes here
    throw new Error("Method not implemented.");
  }

  /**
   * TODO: This method cannot be directly implemented in Node.js TypeScript as it's specific to Streamlit.
   * In a Node.js environment, similar functionality could be achieved using query parameters from HTTP requests.
   */
  static fromStreamlitQueryParams(/* parameters, if any */): ClarifaiAuthHelper {
    // Method logic goes here
    throw new Error("Method not implemented.");
  }

  /**
   * TODO: This method is specific to Streamlit and cannot be directly implemented in Node.js TypeScript.
   * Similar functionality might be possible by handling query parameters in a Node.js web framework.
   */
  // @ts-expect-error this method is not yet implemented
  private addStreamlitQueryParams(/* parameters, if any */): void {
    // Method logic goes here
    throw new Error("Method not implemented.");
  }

  /**
   * Will look for the following environment variables:
   *  - user_id: CLARIFAI_USER_ID environment variable.
   *  - app_id: CLARIFAI_APP_ID environment variable.
   *  - One of:
   *    - token: CLARIFAI_SESSION_TOKEN environment variable.
   *    - pat: CLARIFAI_PAT environment variable.
   *  - base: CLARIFAI_API_BASE environment variable.
   */
  static fromEnv(validate: boolean = true): ClarifaiAuthHelper {
    const userId = process.env.CLARIFAI_USER_ID || "";
    const appId = process.env.CLARIFAI_APP_ID || "";
    const token = process.env.CLARIFAI_SESSION_TOKEN || "";
    const pat = process.env.CLARIFAI_PAT || "";
    const base = process.env.CLARIFAI_API_BASE || DEFAULT_BASE;
    const ui = process.env.CLARIFAI_UI || DEFAULT_UI;

    return new ClarifaiAuthHelper(
      userId,
      appId,
      pat,
      token,
      base,
      ui,
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
  ): resources_pb2.UserAppIDSet {
    const effectiveUserId = userId ?? this.userId;
    const effectiveAppId = appId ?? this.appId;
    const userAppIdSet = new resources_pb2.UserAppIDSet();
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
   * @returns The service_pb2_grpc.V2Stub stub for the API.
   */
  getStub(): unknown {
    throw new Error("Method not implemented.");
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
   * Asynchronously set the base domain for the API.
   * @param base - The base domain to set.
   */
  async setBase(base: string): Promise<void> {
    this._base = await httpsCache(baseHttpsCache, base);
  }

  /**
   * Asynchronously set the domain for the UI.
   * @param ui - The UI domain to set.
   */
  async setUi(ui: string): Promise<void> {
    this._ui = await httpsCache(uiHttpsCache, ui);
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
}
