import { Model, App } from "../../src/index"; // Replace this import with "clarifai-nodejs" package
import { OutputInfo } from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { Struct } from "google-protobuf/google/protobuf/struct_pb";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

// Creating a new image crop model
const newModelObject = await app.createModel({
  modelId: "margin-100-image-cropper",
  params: {
    modelTypeId: "image-crop",
    description: "Custom crop model with 100px margin",
  },
});

// Initializing the newly created model
const model = new Model({
  modelId: newModelObject.id,
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

// Creating a GRPC compatible outputInfo object with custom margin parameters
const outputInfo = new OutputInfo().setParams(
  Struct.fromJavaScript({ margin: 1.5 }),
);

// Creating a new version of the model with previously created output info config
const modelObjectWithVersion = await model.createVersion({
  description: "Setting output info margin parameters to 1.5",
  outputInfo: outputInfo.toObject(),
});

console.log(modelObjectWithVersion);
