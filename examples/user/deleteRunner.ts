import { User } from "../../src/index";

export const user = new User({
  pat: process.env.CLARIFAI_PAT!,
  userId: process.env.CLARIFAI_USER_ID!,
  appId: process.env.CLARIFAI_APP_ID!,
});
await user.deleteRunner({ runnerId: "runner_id" });
