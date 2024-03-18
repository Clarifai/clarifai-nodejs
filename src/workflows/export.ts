import { SingleWorkflowResponse } from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import * as fs from "fs";
import * as yaml from "js-yaml";

const VALID_YAML_KEYS = [
  "workflow",
  "id",
  "nodes",
  "node_inputs",
  "node_id",
  "model",
];

export class Exporter {
  private wf?: SingleWorkflowResponse.AsObject;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private wf_dict?: Record<string, any>;

  constructor(workflow: SingleWorkflowResponse.AsObject) {
    this.wf = workflow;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public parse(): Record<string, any> {
    if (Array.isArray(this.wf)) {
      this.wf = this.wf[0];
    }
    const wf = {
      workflow: this.wf,
    };
    const clean_wf = cleanUpUnusedKeys(wf);
    this.wf_dict = clean_wf;
    return clean_wf;
  }

  public export(out_path: string): void {
    const yamlString = yaml.dump(this.wf_dict?.["workflow"], { flowLevel: -1 });
    fs.writeFileSync(out_path, yamlString);
  }

  public close(): void {
    delete this.wf;
    delete this.wf_dict;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanUpUnusedKeys(wf: Record<string, any>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const new_wf: Record<string, any> = {};
  for (const [key, val] of Object.entries(wf)) {
    if (!VALID_YAML_KEYS.includes(key)) {
      continue;
    }
    if (key === "model") {
      new_wf["model"] = {
        model_id: wf["model"]["id"],
        model_version_id: wf["model"]["model_version"]["id"],
      };
      // If the model is not from clarifai main, add the app_id and user_id to the model dict.
      if (
        wf["model"]["user_id"] !== "clarifai" &&
        wf["model"]["app_id"] !== "main"
      ) {
        new_wf["model"] = {
          ...new_wf["model"],
          app_id: wf["model"]["app_id"],
          user_id: wf["model"]["user_id"],
        };
      }
    } else if (typeof val === "object") {
      new_wf[key] = cleanUpUnusedKeys(val);
    } else if (Array.isArray(val)) {
      const new_list = val.map((i) => cleanUpUnusedKeys(i));
      new_wf[key] = new_list;
    } else {
      new_wf[key] = val;
    }
  }
  return new_wf;
}
