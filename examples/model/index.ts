import { Model } from "../../src/index"; // Replace this import with "clarifai-nodejs" package

export const getModel = (id: string) =>
  new Model({
    modelId: id,
    authConfig: {
      pat: process.env.CLARIFAI_PAT!,
      userId: process.env.CLARIFAI_USER_ID!,
      appId: process.env.CLARIFAI_APP_ID!,
    },
  });
