import { Model } from "../../src/index";

export const getModel = (id: string) =>
  new Model({
    modelId: id,
    authConfig: {
      pat: process.env.CLARIFAI_PAT!,
      userId: process.env.CLARIFAI_USER_ID!,
      appId: process.env.CLARIFAI_APP_ID!,
    },
  });
