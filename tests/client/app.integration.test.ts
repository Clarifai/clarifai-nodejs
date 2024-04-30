import { describe, expect, it } from "vitest";
import { App, User } from "../../src/index";

const NOW = Date.now().toString() + "-app";
const MAIN_APP_ID = "main";
const MAIN_APP_USER_ID = "clarifai";
const GENERAL_MODEL_ID = "general-image-recognition";
const General_Workflow_ID = "General";

const CREATE_APP_USER_ID = import.meta.env.VITE_CLARIFAI_USER_ID;
const CREATE_APP_ID = `ci_test_app_${NOW}`;
const CREATE_MODEL_ID = `ci_test_model_${NOW}`;
const CREATE_DATASET_ID = `ci_test_dataset_${NOW}`;
const CREATE_MODULE_ID = `ci_test_module_${NOW}`;
const CREATE_RUNNER_ID = `ci_test_runner_${NOW}`;

const CLARIFAI_PAT = import.meta.env.VITE_CLARIFAI_PAT;

describe("App", () => {
  it(
    "should list models",
    {
      timeout: 10000,
    },
    async () => {
      const app = new App({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
      });
      const list = await app.listModels().next();
      expect(list.value?.length).toBe(16);
    },
  );

  it("should list workflows", async () => {
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: MAIN_APP_USER_ID,
        appId: MAIN_APP_ID,
      },
    });
    const list = await app.listWorkflows().next();
    expect(list.value?.length).toBeGreaterThanOrEqual(0);
  });

  it("should list apps", async () => {
    const user = new User({
      pat: CLARIFAI_PAT,
      userId: MAIN_APP_USER_ID,
      appId: MAIN_APP_ID,
    });
    const list = await user.listApps().next();
    expect(list.value?.length).toBeGreaterThan(0);
  });

  it("should get model", async () => {
    const user = new User({
      pat: CLARIFAI_PAT,
      userId: MAIN_APP_USER_ID,
      appId: MAIN_APP_ID,
    });
    const appObject = await user.app({ appId: MAIN_APP_ID });
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: MAIN_APP_USER_ID,
        appId: appObject?.id ?? "",
      },
    });
    const model = await app.model({
      modelId: GENERAL_MODEL_ID,
      modelVersionId: "",
    });
    expect(model?.id).toBe(GENERAL_MODEL_ID);
    expect(model?.appId).toBe(MAIN_APP_ID);
    expect(model?.userId).toBe(MAIN_APP_USER_ID);
  });

  it("should get workflow", async () => {
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: MAIN_APP_USER_ID,
        appId: MAIN_APP_ID,
      },
    });
    const workflow = await app.workflow({ workflowId: General_Workflow_ID });
    expect(workflow?.id).toBe(General_Workflow_ID);
    expect(workflow?.appId).toBe(MAIN_APP_ID);
    expect(workflow?.userId).toBe(MAIN_APP_USER_ID);
  });

  it("should create app", async () => {
    const user = new User({
      pat: CLARIFAI_PAT,
      userId: CREATE_APP_USER_ID,
      appId: MAIN_APP_ID,
    });
    const app = await user.createApp({ appId: CREATE_APP_ID });
    expect(app.id).toBe(CREATE_APP_ID);
    expect(app.userId).toBe(CREATE_APP_USER_ID);
  });

  it("should create dataset", async () => {
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: CREATE_APP_ID,
      },
    });
    const dataset = await app.createDataset({ datasetId: CREATE_DATASET_ID });
    expect(dataset.id).toBe(CREATE_DATASET_ID);
    expect(dataset.appId).toBe(CREATE_APP_ID);
    expect(dataset.userId).toBe(CREATE_APP_USER_ID);
  });

  it("should create model", async () => {
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: CREATE_APP_ID,
      },
    });
    const model = await app.createModel({ modelId: CREATE_MODEL_ID });
    expect(model.id).toBe(CREATE_MODEL_ID);
    expect(model.appId).toBe(CREATE_APP_ID);
    expect(model.userId).toBe(CREATE_APP_USER_ID);
  });

  it("should create module", async () => {
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: CREATE_APP_ID,
      },
    });
    const module = await app.createModule({
      moduleId: CREATE_MODULE_ID,
      description: "CI test module",
    });
    expect(module.id).toBe(CREATE_MODULE_ID);
    expect(module.appId).toBe(CREATE_APP_ID);
    expect(module.userId).toBe(CREATE_APP_USER_ID);
  });

  it("should create runner", async () => {
    const user = new User({
      pat: CLARIFAI_PAT,
      userId: CREATE_APP_USER_ID,
      appId: CREATE_APP_ID,
    });
    const runner = await user.createRunner({
      runnerId: CREATE_RUNNER_ID,
      labels: ["ci runner"],
      description: "CI test runner",
    });
    expect(runner.id).toBe(CREATE_RUNNER_ID);
    expect(runner.userId).toBe(CREATE_APP_USER_ID);
  });

  it("should get dataset", async () => {
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: CREATE_APP_ID,
      },
    });
    const dataset = await app.dataset({ datasetId: CREATE_DATASET_ID });
    expect(dataset?.id).toBe(CREATE_DATASET_ID);
    expect(dataset?.appId).toBe(CREATE_APP_ID);
    expect(dataset?.userId).toBe(CREATE_APP_USER_ID);
  });

  it("should list datasets", async () => {
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: CREATE_APP_ID,
      },
    });
    const list = await app.listDataSets().next();
    expect(list.value?.length).toBeGreaterThan(0);
  });

  it("should delete dataset", async () => {
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: CREATE_APP_ID,
      },
    });
    await expect(
      app.deleteDataset({ datasetId: CREATE_DATASET_ID }),
    ).resolves.not.toThrow();
  });

  it("should delete model", async () => {
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: CREATE_APP_ID,
      },
    });
    await expect(
      app.deleteModel({ modelId: CREATE_MODEL_ID }),
    ).resolves.not.toThrow();
  });

  it("should delete module", async () => {
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: CREATE_APP_ID,
      },
    });
    await expect(
      app.deleteModule({ moduleId: CREATE_MODULE_ID }),
    ).resolves.not.toThrow();
  });

  it("should delete runner", async () => {
    const user = new User({
      pat: CLARIFAI_PAT,
      userId: CREATE_APP_USER_ID,
      appId: CREATE_APP_ID,
    });
    await expect(
      user.deleteRunner({ runnerId: CREATE_RUNNER_ID }),
    ).resolves.not.toThrow();
  });

  it("should delete app", async () => {
    const user = new User({
      pat: CLARIFAI_PAT,
      userId: CREATE_APP_USER_ID,
      appId: MAIN_APP_ID,
    });
    await expect(
      user.deleteApp({ appId: CREATE_APP_ID }),
    ).resolves.not.toThrow();
  });

  it("should throw error for invalid arguments", async () => {
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: CREATE_APP_ID,
      },
    });

    const createWorkflow = async () =>
      await app.createWorkflow({ configFilePath: "invalid_path.yml" });

    await expect(createWorkflow()).rejects.toThrow();

    const createApp = () =>
      new App({
        // @ts-expect-error Testing invalid arguments
        url: "App url",
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: CREATE_APP_USER_ID,
          appId: CREATE_APP_ID,
        },
      });

    expect(createApp).toThrow();
  });
});
