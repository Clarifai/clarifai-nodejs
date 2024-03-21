import { App } from "../../src/index"; // Replace this import with "clarifai-nodejs" package

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const list = await app.listConcepts().next();
const concepts = list.value;
console.log(concepts);
