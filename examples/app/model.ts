import { App } from "../../src/index";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const model = await app.model({
  modelId: "custom-crop-model",
  modelVersionId: "0.0.1",
});
console.log(model);
