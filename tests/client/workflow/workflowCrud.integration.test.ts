import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { App, User } from "../../../src/index";
import path from "path";
import * as fs from "fs";

const NOW = "test-app-200"; // Date.now().toString();
const CREATE_APP_USER_ID = import.meta.env.VITE_CLARIFAI_USER_ID;
const CLARIFAI_PAT = import.meta.env.VITE_CLARIFAI_PAT;
const CREATE_APP_ID = `test_workflow_create_delete_app_${NOW}`;
const MAIN_APP_ID = "main";

// const workflowFile = path.resolve(__dirname, "./export_general.yml");
const workflowFixtures = path.resolve(__dirname, "./fixtures");

// get all files in the workflowFixtures directory in an array
const workflowFixtureFiles = fs
  .readdirSync(workflowFixtures)
  .map((each) => path.resolve(workflowFixtures, each));
console.log(workflowFixtureFiles);

describe("Workflow CRUD", () => {
  let user: User;
  let app: App;

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
      timeout: 20000,
    },
    async () => {
      for (let i = 0; i < workflowFixtureFiles.length; i++) {
        const file = workflowFixtureFiles[i];
        console.log("Testing file: ", file);
        // TODO: remove this condition once the test case failure in custom_cropper models are fixed
        if (file.includes("custom_cropper")) continue;
        const generateNewId = file.endsWith("general.yml") ? false : true;
        const workflow = await app.createWorkflow({
          configFilePath: file,
          generateNewId,
        });
        expect(workflow.id).toBeDefined();
      }
    },
  );

  afterAll(async () => {
    await user.deleteApp({ appId: CREATE_APP_ID });
  });
});
