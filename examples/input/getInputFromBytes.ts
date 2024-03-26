import { Input, Model } from "../../src/index";
import * as fs from "fs";

const imageBuffer = fs.readFileSync("path/to/image.jpg");

// Generate a new GRPC compatible Input object from buffer
const imageInput = Input.getInputFromBytes({
  inputId: "demo",
  imageBytes: imageBuffer,
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
  inputs: [imageInput],
});
console.log(prediction);
