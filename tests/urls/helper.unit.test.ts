import {
  ClarifaiAppUrl,
  ClarifaiUrlHelper,
  ClarifaiUrl,
  ClarifaiModuleUrl,
} from "../../src/urls/helper";
import { describe, beforeEach, test, expect } from "vitest";

const URL_HELPER_CONFIG = { ui: "https://clarifai.com" };

describe("ClarifaiUrlHelper", () => {
  let urlHelper: ClarifaiUrlHelper;

  beforeEach(() => {
    urlHelper = new ClarifaiUrlHelper(URL_HELPER_CONFIG);
  });

  test("moduleUiUrl constructs correct URL", () => {
    const url = urlHelper.moduleUiUrl("user1", "app1", "module1", "version1");
    expect(url).toBe(
      `${URL_HELPER_CONFIG.ui}/user1/app1/modules/module1/versions/version1`,
    );
  });

  test("moduleInstallUiUrl constructs correct URL", () => {
    const url = urlHelper.moduleInstallUiUrl("user1", "app1", "moduleUrl");
    expect(url).toBe(
      `${URL_HELPER_CONFIG.ui}/user1/app1/installed_module_versions/module_manager_install/install?install=moduleUrl`,
    );
  });

  test("imvUiUrl constructs correct URL", () => {
    const url = urlHelper.imvUiUrl("user1", "app1", "imv1");
    expect(url).toBe(
      `${URL_HELPER_CONFIG.ui}/user1/app1/installed_module_versions/imv1`,
    );
  });

  test("clarifaiUrl constructs correct URL without versionId", () => {
    const url = urlHelper.clarifaiUrl("user1", "app1", "modules", "resource1");
    expect(url).toBe(`${URL_HELPER_CONFIG.ui}/user1/app1/modules/resource1`);
  });

  test("clarifaiUrl constructs correct URL with versionId", () => {
    const url = urlHelper.clarifaiUrl(
      "user1",
      "app1",
      "modules",
      "resource1",
      "version1",
    );
    expect(url).toBe(
      `${URL_HELPER_CONFIG.ui}/user1/app1/modules/resource1/versions/version1`,
    );
  });

  test("splitClarifaiAppUrl splits URL correctly", () => {
    const [userId, appId] = ClarifaiUrlHelper.splitClarifaiAppUrl(
      "https://clarifai.com/user1/app1",
    );
    expect(userId).toBe("user1");
    expect(appId).toBe("app1");
  });

  // testing errors for invalid urls - since javascript projects will not have typescript type checking
  test("splitClarifaiAppUrl with invalid url will throw error", () => {
    expect(() => {
      ClarifaiUrlHelper.splitClarifaiAppUrl(
        "https://clarifai.com/user1" as ClarifaiAppUrl,
      );
    }).toThrow(
      `Provided url must have 2 parts after the domain name. The current parts are: user1`,
    );
  });

  test("splitClarifaiUrl splits URL correctly without versionId", () => {
    const [userId, appId, resourceType, moduleId] =
      ClarifaiUrlHelper.splitClarifaiUrl(
        "https://clarifai.com/user1/app1/modules/module1",
      );
    expect(userId).toBe("user1");
    expect(appId).toBe("app1");
    expect(resourceType).toBe("modules");
    expect(moduleId).toBe("module1");
  });

  test("splitClarifaiUrl splits URL correctly with versionId", () => {
    const [userId, appId, resourceType, moduleId, versionId] =
      ClarifaiUrlHelper.splitClarifaiUrl(
        "https://clarifai.com/user1/app1/modules/module1/versions/version1",
      );
    expect(userId).toBe("user1");
    expect(appId).toBe("app1");
    expect(resourceType).toBe("modules");
    expect(moduleId).toBe("module1");
    expect(versionId).toBe("version1");
  });

  // testing errors for invalid urls - since javascript projects will not have typescript type checking
  test("splitClarifaiUrl with invalid url will throw error", () => {
    expect(() => {
      ClarifaiUrlHelper.splitClarifaiUrl(
        "https://clarifai.com/user1/app1/modules" as ClarifaiUrl,
      );
    }).toThrow(`Provided url must have 4 or 6 parts after the domain name.`);
  });

  test("splitModuleUiUrl splits URL correctly", () => {
    const [userId, appId, moduleId, moduleVersionId] =
      ClarifaiUrlHelper.splitModuleUiUrl(
        "https://clarifai.com/user1/app1/modules/module1/versions/version1",
      );
    expect(userId).toBe("user1");
    expect(appId).toBe("app1");
    expect(moduleId).toBe("module1");
    expect(moduleVersionId).toBe("version1");
  });

  test("splitModuleUiUrl with invalid url will throw error", () => {
    expect(() => {
      ClarifaiUrlHelper.splitModuleUiUrl(
        "https://clarifai.com/user1/app1/modules" as ClarifaiModuleUrl,
      );
    }).toThrow(`Provided url must have 4 or 6 parts after the domain name.`);
  });

  test("splitModuleUiUrl with invalid resourceType will throw error", () => {
    expect(() => {
      ClarifaiUrlHelper.splitModuleUiUrl(
        "https://clarifai.com/user1/app1/workflow/module1" as ClarifaiModuleUrl,
      );
    }).toThrow("Provided install url must be a module.");
  });
});
