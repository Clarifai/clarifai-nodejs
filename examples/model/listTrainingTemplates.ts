import { Model } from "../../src/index";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const trainingTemplates = await model.listTrainingTemplates();
console.log(trainingTemplates);
