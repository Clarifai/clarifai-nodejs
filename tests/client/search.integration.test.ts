import { describe } from "node:test";
import path from "path";
import { beforeAll } from "vitest";
import { App, Input, Search, User } from "../../src/index";

const CREATE_APP_USER_ID = import.meta.env.VITE_CLARIFAI_USER_ID;
const MAIN_APP_ID = "main";
const General_Workflow_ID = "General";
const now = "test-app-200"; //Math.floor(Date.now() / 1000);
const CREATE_APP_ID = `ci_search_app_${now}`;
const CREATE_DATASET_ID = "ci_search_dataset";
const DOG_IMG_URL = "https://samples.clarifai.com/dog.tiff";
const DATASET_IMAGES_DIR = path.resolve(__dirname, "../assets/voc/images");
const CLARIFAI_PAT = import.meta.env.VITE_CLARIFAI_PAT;

let search: Search;
describe("Search", () => {
  beforeAll(async () => {
    const user = new User({
      pat: CLARIFAI_PAT,
      userId: CREATE_APP_USER_ID,
      appId: MAIN_APP_ID,
    });
    const appObject = await user.createApp({
      appId: CREATE_APP_ID,
      baseWorkflow: General_Workflow_ID,
    });
    const app = new App({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: appObject.id,
      },
    });
    const datasetObject = await app.createDataset({
      datasetId: CREATE_DATASET_ID,
    });
    const metadata = { Breed: "Saint Bernard" };
    const inputProto = Input.getInputFromUrl({
      datasetId: datasetObject.id,
      inputId: "dog-tiff",
      imageUrl: DOG_IMG_URL,
      labels: ["dog"],
      geoInfo: {
        latitude: 40,
        longitude: -30,
      },
      metadata,
    });
    const input = new Input({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: appObject.id,
      },
    });
    await input.uploadInputs({ inputs: [inputProto] });

    const search = new Search({
      authConfig: {
        pat: CLARIFAI_PAT,
        userId: CREATE_APP_USER_ID,
        appId: appObject.id,
      },
    });
  });
});
