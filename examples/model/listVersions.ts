import { Model } from "../../src/index";

export const model = new Model({
  modelId: "lvm-dummy-test",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

// (async () => {
//   const versions = await model.listVersions().next();
//   console.log(versions);
// })();

// model
//   .listVersions()
//   .next()
//   .then((versions) => {
//     console.log(JSON.stringify(versions));
//   })
//   .catch((error) => {
//     console.error(error);
//   });

model
  .predict({
    methodName: "chat",
    messages: ["foo"],
    max_tokens: 5,
  })
  .then(() => {
    console.log("promise resolved");
  });
