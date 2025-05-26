import { Model } from "../../src/index";

export const model = new Model({
  modelId: "lvm-dummy-test",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const versions = await model.listVersions().next();

console.log(versions);
