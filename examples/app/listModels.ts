import { app } from "./index";

app
  .listModels()
  .next()
  .then((list) => {
    const models = list.value;
    console.log(models);
  });
