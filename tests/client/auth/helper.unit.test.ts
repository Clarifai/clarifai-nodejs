import { beforeEach, describe, expect, it } from "vitest";

import {
  ClarifaiAuthHelper,
  httpsCache,
  Cache,
} from "../../../src/client/auth/helper";

let cache: Cache;

describe("httpsCache", () => {
  beforeEach(() => {
    cache = {}; // Reset the cache before each test
  });

  it("should return url without https:// and update cache for HTTPS URLs", async () => {
    const url = "https://example.com";
    const expectedUrl = "example.com";
    const result = await httpsCache(cache, url);
    expect(result).toEqual(expectedUrl);
    expect(cache[expectedUrl]).toEqual(true);
  });

  it("should return url without http:// and update cache for HTTP URLs", async () => {
    const url = "http://example.com";
    const expectedUrl = "example.com";
    const result = await httpsCache(cache, url);
    expect(result).toEqual(expectedUrl);
    expect(cache[expectedUrl]).toEqual(false);
  });

  it("should mark clarifai.com domain as HTTPS without making a request", async () => {
    const url = "https://api.clarifai.com";
    const expectedUrl = "api.clarifai.com";
    const result = await httpsCache(cache, url);
    expect(result).toEqual(expectedUrl);
    expect(cache[expectedUrl]).toBe(true);
  });

  it("should handle non-clarifai.com domain and verify HTTPS availability", async () => {
    const externalUrl = "https://external.com";
    const expectedUrl = "external.com";
    const result = await httpsCache(cache, externalUrl);
    expect(result).toEqual(expectedUrl);
    expect(cache[expectedUrl]).toBe(true);
  });
});

describe("ClarifaiAuthHelper", () => {
  it("should construct with valid parameters", () => {
    const helper = new ClarifaiAuthHelper("user", "app", "pat");
    expect(helper).toBeInstanceOf(ClarifaiAuthHelper);
  });

  it("should throw error when constructed with empty user id", () => {
    expect(() => new ClarifaiAuthHelper("", "app", "pat")).toThrow();
  });

  it("should throw error when constructed with empty app id", () => {
    expect(() => new ClarifaiAuthHelper("user", "", "pat")).toThrow();
  });

  it("should throw error when constructed with both pat and token", () => {
    expect(
      () => new ClarifaiAuthHelper("user", "app", "pat", "token"),
    ).toThrow();
  });

  it("should throw error when constructed with neither pat nor token", () => {
    expect(() => new ClarifaiAuthHelper("user", "app", "", "")).toThrow();
  });

  it("updates _base property and caches the URL correctly", async () => {
    const helper = new ClarifaiAuthHelper("userId", "appId", "pat");
    await helper.setBase("https://setbase.clarifai.com");

    expect(helper.base).toBe("https://setbase.clarifai.com");
  });

  it("updates _ui property and caches the URL correctly", async () => {
    const helper = new ClarifaiAuthHelper("userId", "appId", "pat");
    await helper.setUi("https://setui.clarifai.com");

    expect(helper.ui).toBe("https://setui.clarifai.com");
  });

  it("returns correct metadata for a PAT", () => {
    const helper = new ClarifaiAuthHelper("userId", "appId", "pat");
    const metadata = helper.metadata;

    expect(metadata).toEqual([["authorization", "Key pat"]]);
  });

  it("returns correct metadata for a session token", () => {
    const helper = new ClarifaiAuthHelper("userId", "appId", "", "token");
    const metadata = helper.metadata;

    expect(metadata).toEqual([["x-clarifai-session-token", "token"]]);
  });

  it("validates secrets dictionary correctly", () => {
    const secrets = {
      CLARIFAI_USER_ID: "userId",
      CLARIFAI_APP_ID: "appId",
      CLARIFAI_PAT: "pat",
    };

    expect(ClarifaiAuthHelper.validateSecretsDict(secrets)).toBe(true);
  });

  it("throws error for empty secrets in secrets dictionary", () => {
    const secrets = {
      CLARIFAI_USER_ID: "",
      CLARIFAI_APP_ID: "appId",
      CLARIFAI_PAT: "pat",
    };

    expect(() => ClarifaiAuthHelper.validateSecretsDict(secrets)).toThrow();
  });

  it("throws error for invalid root certificates path", () => {
    expect(
      () =>
        new ClarifaiAuthHelper(
          "userId",
          "appId",
          "pat",
          "",
          "https://customdomain.com",
          "https://customdomain.com/ui",
          "invalid",
        ),
    ).toThrow(`Root certificates path invalid does not exist`);
  });

  it("getUserAppIdProto returns correct UserAppIDSet proto object", () => {
    const helper = new ClarifaiAuthHelper("userId", "appId", "pat");
    const userAppIdProto = helper.getUserAppIdProto();

    expect(userAppIdProto.getUserId()).toBe("userId");
    expect(userAppIdProto.getAppId()).toBe("appId");
  });
});
