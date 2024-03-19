import { SingleWorkflowResponse } from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import * as fs from "fs";
import * as yaml from "js-yaml";

const VALID_YAML_KEYS = [
  "workflow",
  "id",
  "nodes",
  "nodesList",
  "nodeInputs",
  "nodeInputsList",
  "nodeId",
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
    const yamlString = yaml.dump(this.wf_dict?.["workflow"], {
      flowLevel: -1,
      replacer: (_key, val) => {
        if (Array.isArray(val) && val.length === 0) {
          return undefined;
        }
        return val;
      },
    });
    fs.writeFileSync(
      out_path,
      yamlString.replace(new RegExp("sList", "g"), "s"),
    );
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
        modelId: wf["model"]["id"],
        modelVersionId: wf["model"]["modelVersion"]["id"],
      };
      // If the model is not from clarifai main, add the app_id and user_id to the model dict.
      if (
        wf["model"]["userId"] !== "clarifai" &&
        wf["model"]["appId"] !== "main"
      ) {
        new_wf["model"] = {
          ...new_wf["model"],
          appId: wf["model"]["appId"],
          userId: wf["model"]["userId"],
        };
      }
    } else if (Array.isArray(val)) {
      const new_list = val.map((i) => cleanUpUnusedKeys(i));
      new_wf[key] = new_list;
    } else if (typeof val === "object") {
      new_wf[key] = cleanUpUnusedKeys(val);
    } else {
      new_wf[key] = val;
    }
  }
  return new_wf;
}
