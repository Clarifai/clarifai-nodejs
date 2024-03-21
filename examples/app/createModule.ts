import { App } from "../../src/index";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const module = await app.createModule({
  moduleId: "new-module",
  description: "New module",
});

console.log(module);
