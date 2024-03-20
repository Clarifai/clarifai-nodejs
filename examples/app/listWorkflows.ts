import { app } from "./index";

app
  .listWorkflows()
  .next()
  .then((list) => {
    const workflows = list.value;
    console.log(workflows);
  });
