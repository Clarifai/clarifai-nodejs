import { Model } from "../../src/index";

const model = new Model({
  url: "https://clarifai.com/openai/chat-completion/models/o4-mini",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
  },
});

const responseStream = model.generate({
  // see available methodNames using model.availableMethods()
  methodName: "predict",
  prompt: "what is photosynthesis?",
});

for await (const response of responseStream) {
  console.log(JSON.stringify(response));

  // get response data from the response object
  Model.getOutputDataFromModelResponse(response);
}
