import { app } from "./index";

app
  .listDataSets()
  .next()
  .then((list) => {
    const datasets = list.value;
    console.log(datasets);
  });
