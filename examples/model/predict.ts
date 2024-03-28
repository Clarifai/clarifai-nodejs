import { Model, Input } from "../../src/index";

export const model = new Model({
  modelId: "multimodal-clip-embed",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const input = Input.getInputFromBytes({
  inputId: "intro-text",
  textBytes: Buffer.from("Hi my name is Jim."),
});

const textPrediction = await model.predict({
  inputs: [input],
});

console.log(textPrediction);

const imageInput = Input.getInputFromUrl({
  inputId: "test-image",
  imageUrl:
    "https://goldenglobes.com/wp-content/uploads/2023/10/17-tomcruiseag.jpg",
});

const imagePrediction = await model.predict({
  inputs: [imageInput],
});

console.log(imagePrediction);
