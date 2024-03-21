import { Input, App } from "../../src/index"; // Replace this import with "clarifai-nodejs" package

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const dataset = await app.createDataset({
  datasetId: "dog-image-collection",
});

// Dataset is created, now let's build an image input that uses the new dataset id
const inputProto = Input.getInputFromUrl({
  datasetId: dataset.id,
  inputId: "dog-tiff",
  imageUrl: "https://samples.clarifai.com/dog.tiff",
  labels: ["dog"],
  geoInfo: {
    latitude: 40,
    longitude: -30,
  },
  metadata: { Breed: "Saint Bernard" },
});

const input = new Input({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

// upload the input by using instance of the Input class
// this input will be stored under the newly created dataset
const inputJobId = await input.uploadInputs({
  inputs: [inputProto],
});

console.log(inputJobId); // job id of the input upload
