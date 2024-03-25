import { User } from "../../src/index";

export const user = new User({
  pat: process.env.CLARIFAI_PAT!,
  userId: process.env.CLARIFAI_USER_ID!,
  appId: process.env.CLARIFAI_APP_ID!,
});
const runner = await user.createRunner({
  runnerId: "runner_id",
  labels: ["label to link runner"],
  description: "laptop runner",
});
console.log(runner);
