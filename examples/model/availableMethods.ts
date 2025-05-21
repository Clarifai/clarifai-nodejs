import { Model } from "../../src/index";

const model = new Model({
  url: "https://clarifai.com/openai/chat-completion/models/o4-mini",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
  },
});

const modelMethods = await model.availableMethods();

console.log(modelMethods);
