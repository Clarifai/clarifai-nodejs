import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {
  ClarifaiAuthHelper,
  httpsCache,
  Cache,
} from "../../../src/client/auth/helper";

// This sets the mock adapter on the default instance
const mock = new MockAdapter(axios);

let cache: Cache;

describe("httpsCache", () => {
  beforeEach(() => {
    cache = {}; // Reset the cache before each test
    mock.reset(); // Reset the mocking adapter before each test
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
    mock.onGet(`${externalUrl}/v2/auth/methods`).reply(200);
    const expectedUrl = "external.com";
    const result = await httpsCache(cache, externalUrl);
    expect(result).toEqual(expectedUrl);
    expect(cache[expectedUrl]).toBe(true);
  });

  it("should throw an error when HTTPS check fails for a non-clarifai.com domain", async () => {
    const externalUrl = "nonexistent.example.com";
    mock.onGet(`https://${externalUrl}/v2/auth/methods`).networkError();
    await expect(httpsCache(cache, externalUrl)).rejects.toThrow(
      `Could not get a valid response from URL: nonexistent.example.com, is the API running there?`,
    );
  });

  it("should throw an error for a non-clarifai.com domain without port when HTTPS is not available", async () => {
    const url = "example.com"; // Omitting the protocol to trigger the intended error
    // The function's catch block for the "SSL" error message requires a failed HTTPS request simulation
    mock.onGet(`https://${url}/v2/auth/methods`).reply(() => {
      throw new Error("SSL");
    });
    await expect(httpsCache(cache, url)).rejects.toThrow(
      "When providing an insecure URL, it must have both host:port format.",
    );
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

  it("throws an error if base URL is not cached", () => {
    const helper = new ClarifaiAuthHelper("userId", "appId", "pat");
    helper.setBase("http://uncachedbase.clarifai.com"); // Without await to simulate uncached

    expect(() => helper.base).toThrow();
  });

  it("throws an error if UI URL is not cached", () => {
    const helper = new ClarifaiAuthHelper("userId", "appId", "pat");
    helper.setUi("http://uncachedui.clarifai.com"); // Without await to simulate uncached

    expect(() => helper.ui).toThrow();
  });

  it("formats toString output correctly", () => {
    const helper = new ClarifaiAuthHelper("userId", "appId", "pat");

    // Mock the base getter to bypass the cache mechanism
    jest
      .spyOn(helper, "base", "get")
      .mockReturnValue("https://api.clarifai.com");

    const expectedString = `ClarifaiAuthHelper:\n- base: https://api.clarifai.com\n- user_id: userId\n- app_id: appId`;

    expect(helper.toString()).toBe(expectedString);
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

  it("getUserAppIdProto returns correct UserAppIDSet proto object", () => {
    const helper = new ClarifaiAuthHelper("userId", "appId", "pat");
    const userAppIdProto = helper.getUserAppIdProto();

    expect(userAppIdProto.getUserId()).toBe("userId");
    expect(userAppIdProto.getAppId()).toBe("appId");
  });
});

afterEach(() => {
  // cleaning up the mock adapter after each test
  mock.reset();
});
