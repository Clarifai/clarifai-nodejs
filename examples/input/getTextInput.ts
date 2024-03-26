import { Input, Model } from "../../src/index";

// Generate a new GRPC compatible Input object from buffer
const textInput = Input.getTextInput({
  inputId: "demo",
  rawText: "Sample text for input generation",
});

// The input can now be used as an input for a model prediction methods
const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
  modelId: "multimodal-clip-embed",
});
const prediction = await model.predict({
  inputs: [textInput],
});
console.log(prediction);
