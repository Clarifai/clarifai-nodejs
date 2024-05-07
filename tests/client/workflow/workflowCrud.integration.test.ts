import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { App, User, Workflow } from "../../../src/index";
import { Workflow as GrpcWorkflow } from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import path from "path";
import * as fs from "fs";

const NOW = Date.now().toString() + "-workflow";
const CREATE_APP_USER_ID = process.env.VITE_CLARIFAI_USER_ID;
const CLARIFAI_PAT = process.env.VITE_CLARIFAI_PAT;
const CREATE_APP_ID = `test_create_delete_app_${NOW}`;
const MAIN_APP_ID = "main";

const workflowFile = path.resolve(__dirname, "./fixtures/general.yml");
const workflowExportPath = path.resolve(__dirname, "./export_general.yml");
const workflowFixtures = path.resolve(__dirname, "./fixtures");

// get all files in the workflowFixtures directory in an array
const workflowFixtureFiles = fs
  .readdirSync(workflowFixtures)
  .map((each) => path.resolve(workflowFixtures, each));

describe("Workflow CRUD", () => {
  let user: User;
  let app: App;
  let generalWorkflow: GrpcWorkflow.AsObject;

  beforeAll(async () => {
    user = new User({
      pat: CLARIFAI_PAT,
      userId: CREATE_APP_USER_ID,
      appId: MAIN_APP_ID,
    });
    try {
      const appObject = await user.createApp({
        appId: CREATE_APP_ID,
        baseWorkflow: "Empty",
      });
      app = new App({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: CREATE_APP_USER_ID,
          appId: appObject.id,
        },
      });
    } catch (e) {
      if ((e as { message: string }).message.includes("already exists")) {
        app = new App({
          authConfig: {
            pat: CLARIFAI_PAT,
            userId: CREATE_APP_USER_ID,
            appId: CREATE_APP_ID,
          },
        });
      }
      throw e;
    }
  });

  it(
    "should create workflow",
    {
      timeout: 50000,
    },
    async () => {
      for (let i = 0; i < workflowFixtureFiles.length; i++) {
        const file = workflowFixtureFiles[i];
        console.log("Testing file: ", file);
        const generateNewId = file.endsWith("general.yml") ? false : true;
        const workflow = await app.createWorkflow({
          configFilePath: file,
          generateNewId,
        });
        if (file.endsWith("general.yml")) {
          generalWorkflow = workflow;
        }
        expect(workflow.id).toBeDefined();
      }
    },
  );

  it("should export workflow", async () => {
    const workflow = new Workflow({
      workflowId: generalWorkflow.id,
      authConfig: {
        userId: CREATE_APP_USER_ID,
        appId: CREATE_APP_ID,
        pat: CLARIFAI_PAT,
      },
      ...(generalWorkflow.version
        ? { workflowVersion: { id: generalWorkflow.version.id } }
        : {}),
    });

    await workflow.exportWorkflow(workflowExportPath);

    const expectedFile = fs.readFileSync(workflowExportPath, "utf-8");

    const actualFile = fs.readFileSync(workflowFile, "utf-8");

    expect(expectedFile).toBe(actualFile);
  });

  afterAll(async () => {
    await user.deleteApp({ appId: CREATE_APP_ID });
  });
});
