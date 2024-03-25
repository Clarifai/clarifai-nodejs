import { User } from "../../src/index";

export const user = new User({
  pat: process.env.CLARIFAI_PAT!,
  userId: process.env.CLARIFAI_USER_ID!,
  appId: process.env.CLARIFAI_APP_ID!,
});
const runner = await user.runner({ runnerId: "runner_id" });
console.log(runner);
