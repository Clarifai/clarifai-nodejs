import { App } from "../../src/index";
import path from "path";

const app = new App({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
const workflowFile = path.resolve(__dirname, "workflow/moderation.yml");
const workflow = await app.createWorkflow({ configFilePath: workflowFile });
console.log(workflow);

/**
 * Workflow config file in the path `workflow/moderation.yml`:
 */
/*
workflow:
  id: test-mbmn
  nodes:
    - id: detector
      model:
          modelId: face-detection
          modelVersionId: 45fb9a671625463fa646c3523a3087d5
    - id: cropper
      model:
          modelId: margin-110-image-crop
          modelVersionId: b9987421b40a46649566826ef9325303
      nodeInputs:
        - nodeId: detector
    - id: face-sentiment
      model:
          modelId: face-sentiment-recognition
          modelVersionId: a5d7776f0c064a41b48c3ce039049f65
      nodeInputs:
        - nodeId: cropper
    - id: moderation
      model:
          modelId: moderation-recognition
          modelVersionId: 7cde8e92896340b0998b8260d47f1502
*/
