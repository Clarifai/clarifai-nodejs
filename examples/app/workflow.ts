import { App } from "../../src/index";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const workflow = await app.workflow({ workflowId: "workflowId" });
console.log(workflow);
