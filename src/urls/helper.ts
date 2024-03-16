import { URL } from "url";

interface ClarifaiAuthHelper {
  ui: string;
}

type USERID = string;
type APPID = string;
type RESOURCE_TYPE = string;
type RESOURCEID = string;
type RESOURCE_VERSION_TYPE = string;
type RESOURCE_VERSION_ID = string;
export type ClarifaiUrl =
  | `${string}://${string}/${USERID}/${APPID}/${RESOURCE_TYPE}/${RESOURCEID}/${RESOURCE_VERSION_TYPE}/${RESOURCE_VERSION_ID}`
  | `${string}://${string}/${USERID}/${APPID}/${RESOURCE_TYPE}/${RESOURCEID}`;
export type ClarifaiAppUrl = `${string}://${string}/${USERID}/${APPID}`;

export class ClarifaiUrlHelper {
  private auth: ClarifaiAuthHelper;
  private moduleManagerImvId: string;

  /**
   * Creates an instance of ClarifaiUrlHelper.
   * @param auth A ClarifaiAuthHelper object.
   * @param moduleManagerImvId ID for the module manager install, default is "module_manager_install".
   */
  constructor(
    auth: ClarifaiAuthHelper,
    moduleManagerImvId: string = "module_manager_install",
  ) {
    this.auth = auth;
    this.moduleManagerImvId = moduleManagerImvId;
  }

  /**
   * Getter for the auth property.
   */
  getAuth(): ClarifaiAuthHelper {
    return this.auth;
  }

  /**
   * Constructs a URL for module UI based on given parameters.
   * @param userId User ID.
   * @param appId Application ID.
   * @param moduleId Module ID.
   * @param moduleVersionId Module Version ID.
   * @returns A string representing the module UI URL.
   */
  moduleUiUrl(
    userId: string,
    appId: string,
    moduleId: string,
    moduleVersionId: string,
  ): string {
    return `${this.auth.ui}/${userId}/${appId}/modules/${moduleId}/versions/${moduleVersionId}`;
  }

  /**
   * Constructs a URL for module installation UI.
   * @param destUserId Destination User ID.
   * @param destAppId Destination Application ID.
   * @param moduleUrl Module URL.
   * @returns A string representing the module install UI URL.
   */
  moduleInstallUiUrl(
    destUserId: string,
    destAppId: string,
    moduleUrl: string,
  ): string {
    return `${this.auth.ui}/${destUserId}/${destAppId}/installed_module_versions/${this.moduleManagerImvId}/install?install=${moduleUrl}`;
  }

  /**
   * Constructs a URL for IMV UI.
   * @param destUserId Destination User ID.
   * @param destAppId Destination Application ID.
   * @param imvId IMV ID.
   * @returns A string representing the IMV UI URL.
   */
  imvUiUrl(destUserId: string, destAppId: string, imvId: string): string {
    return `${this.auth.ui}/${destUserId}/${destAppId}/installed_module_versions/${imvId}`;
  }

  /**
   * Constructs a URL to the resource in the community.
   * @param userId User ID.
   * @param appId Application ID.
   * @param resourceType Type of resource.
   * @param resourceId Resource ID.
   * @param versionId (Optional) Version of the resource.
   * @returns A string representing the URL to the resource.
   */
  clarifaiUrl(
    userId: string,
    appId: string,
    resourceType: string,
    resourceId: string,
    versionId?: string,
  ): string {
    const validTypes = [
      "modules",
      "models",
      "concepts",
      "inputs",
      "workflows",
      "tasks",
      "installed_module_versions",
    ];
    if (!validTypes.includes(resourceType)) {
      throw new Error(
        `resourceType must be one of ${validTypes.join(", ")} but was ${resourceType}`,
      );
    }
    if (versionId === undefined) {
      return `${this.auth.ui}/${userId}/${appId}/${resourceType}/${resourceId}`;
    }
    return `${this.auth.ui}/${userId}/${appId}/${resourceType}/${resourceId}/versions/${versionId}`;
  }

  /**
   * Splits a Clarifai app URL into its component parts.
   * clarifai.com uses fully qualified urls to resources.
   * They are in the format of:
   * https://clarifai.com/{user_id}/{app_id}
   *
   * @param url The Clarifai app URL.
   * @returns A tuple containing userId and appId.
   */
  static splitClarifaiAppUrl(url: ClarifaiAppUrl): [string, string] {
    const o = new URL(url);
    const parts = o.pathname.split("/").filter((part) => part.length > 0);
    if (parts.length !== 3) {
      throw new Error(
        `Provided url must have 2 parts after the domain name. The current parts are: ${parts}`,
      );
    }
    return [parts[0], parts[1]];
  }

  /**
   * Splits a Clarifai URL into its component parts, including optional resource version.
   * clarifai.com uses fully qualified urls to resources.
   * They are in the format of:
   * https://clarifai.com/{user_id}/{app_id}/{resource_type}/{resource_id}/{resource_version_type}/{resource_version_id}
   * Those last two are optional.
   *
   * @param url The Clarifai URL.
   * @returns A tuple containing userId, appId, resourceType, resourceId, and optionally resourceVersionId.
   */
  static splitClarifaiUrl(
    url: ClarifaiUrl,
  ): [string, string, string, string, string?] {
    const o = new URL(url);
    const parts = o.pathname.split("/").filter((part) => part.length > 0);
    if (parts.length !== 5 && parts.length !== 7) {
      throw new Error(
        "Provided url must have 4 or 6 parts after the domain name.",
      );
    }
    const [userId, appId, resourceType, resourceId] = parts.slice(1, 5);
    const resourceVersionId = parts.length === 7 ? parts[6] : undefined;
    return [userId, appId, resourceType, resourceId, resourceVersionId];
  }

  /**
   * Splits a module UI URL into its component IDs.
   * Takes in a path like https://clarifai.com/zeiler/app/modules/module1/versions/2 to split it apart into it's IDs.
   *
   * @param install The module UI URL.
   * @returns A tuple containing userId, appId, moduleId, and moduleVersionId.
   */
  static splitModuleUiUrl(
    install: ClarifaiUrl,
  ): [string, string, string, string] {
    const [userId, appId, resourceType, resourceId, resourceVersionId] =
      this.splitClarifaiUrl(install);
    if (resourceType !== "modules" || resourceVersionId === undefined) {
      throw new Error(
        "Provided install url must have 6 parts after the domain name.",
      );
    }
    return [userId, appId, resourceId, resourceVersionId];
  }
}
