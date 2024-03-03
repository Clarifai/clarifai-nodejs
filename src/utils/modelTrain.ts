import { MultiModelTypeResponse } from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { writeFileSync } from "fs";
import { MessageToDict } from "google.protobuf.json_format";

/**
 * Converts the response from the API to a list of templates for the given model type id.
 */
export function responseToTemplates(
  response: MultiModelTypeResponse.AsObject,
  modelTypeId: string,
): string[] {
  let templates: string[] = [];
  for (const modelType of response.modelTypesList) {
    if (modelType.id === modelTypeId) {
      for (const modelTypeField of modelType.modelTypeFieldsList) {
        if (modelTypeField.path.split(".").pop() === "template") {
          templates = modelTypeField.modelTypeEnumOptionsList.map(
            (template) => template.id,
          );
        }
      }
    }
  }
  return templates;
}

/**
 * Converts the response from the API to a dictionary of model params for the given model type id.
 */
export function responseToModelParams(
  response: MultiModelTypeResponse.AsObject,
  modelTypeId: string,
  template: string | null = null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: Record<string, any> = {};
  if (modelTypeId !== "clusterer") {
    params["dataset_id"] = "";
    params["dataset_version_id"] = "";
  }
  if (!["clusterer", "text-to-text"].includes(modelTypeId)) {
    params["concepts"] = [];
  }
  params["train_params"] = {};

  for (const modelType of response.modelTypesList) {
    if (modelType.id === modelTypeId) {
      for (const modelTypeField of modelType.modelTypeFieldsList) {
        const pathParts = modelTypeField.path.split(".");
        if (
          pathParts[0] === "'eval_info'" ||
          pathParts[1] === "dataset" ||
          pathParts[1] === "data" ||
          pathParts[pathParts.length - 1] === "dataset_id" ||
          pathParts[pathParts.length - 1] === "dataset_version_id" ||
          modelTypeField.internalOnly
        ) {
          continue;
        }
        if (pathParts[pathParts.length - 1] !== "template") {
          if (pathParts[0] === "train_info" || pathParts[0] === "input_info") {
            params["train_params"][pathParts[pathParts.length - 1]] =
              modelTypeField.defaultValue ?? null;
          }
          if (pathParts[0] === "output_info") {
            params["inference_params"] = {};
            params["inference_params"][pathParts[pathParts.length - 1]] =
              modelTypeField.defaultValue ?? null;
          }
        } else {
          if (modelTypeField.modelTypeEnumOptionsList) {
            const allTemplates = modelTypeField.modelTypeEnumOptionsList.map(
              (template) => template.id,
            );
            if (!allTemplates.includes(template!)) {
              throw new Error(
                `Invalid template ${template} for model type ${modelTypeId}. Valid templates are ${allTemplates}`,
              );
            }
            for (const modelTypeEnum of modelTypeField.modelTypeEnumOptionsList) {
              if (modelTypeEnum.id === template) {
                params["train_params"]["template"] = modelTypeEnum.id;
                for (const modelTypeEnumField of modelTypeEnum.modelTypeFieldsList) {
                  if (modelTypeEnumField.internalOnly) {
                    continue;
                  }
                  params["train_params"][
                    modelTypeEnumField.path.split(".").pop()!
                  ] = modelTypeEnumField.defaultValue ?? null;
                }
              }
            }
          }
        }
      }
    }
  }
  if ("custom_config" in params["train_params"]) {
    const filePath = params["train_params"]["template"] + ".py";
    writeFileSync(filePath, params["train_params"]["custom_config"]);
    params["train_params"]["custom_config"] = filePath;
  }
  return params;
}

/** Finds and replaces the target key with the replacement value in the nested dictionary. */
export function findAndReplaceKey(
  nestedDict: Record<string, unknown>,
  targetKey: string,
  replacementValue: unknown,
): void {
  Object.entries(nestedDict).forEach(([key, value]) => {
    if (key === targetKey) {
      nestedDict[key] = replacementValue;
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      findAndReplaceKey(
        value as Record<string, unknown>,
        targetKey,
        replacementValue,
      );
    }
  });
}

/**
 * Converts the response from the API to a dictionary of model param info for the given model type id.
 */
export function responseToParamInfo(
  response: MultiModelTypeResponse.AsObject,
  modelTypeId: string,
  param: string,
  template: string | null = null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> | void {
  for (const modelType of response.modelTypesList) {
    if (modelType.id === modelTypeId) {
      // iterate through the model type fields
      for (const modelTypeField of modelType.modelTypeFieldsList) {
        if (modelTypeField.path.split(".").pop() === param) {
          if (param === "template") {
            // @ts-expect-error placehoder needs to be deleted
            delete modelTypeField.placeholder;
            // @ts-expect-error modelTypeEnumOptionsList needs to be deleted
            delete modelTypeField.modelTypeEnumOptionsList;
            return modelTypeField;
          }
          // @ts-expect-error params have to be attached to modelTypeField
          modelTypeField.param = modelTypeField.path.split(".").pop();
          // @ts-expect-error placehoder needs to be deleted
          delete modelTypeField.placeholder;
          return modelTypeField;
        }
        // checking the template model type fields
        if (modelTypeField.path.split(".").pop() === "template") {
          for (const modelTypeEnum of modelTypeField.modelTypeEnumOptionsList) {
            if (modelTypeEnum.id === template) {
              // iterate through the template fields
              for (const modelTypeEnumField of modelTypeEnum.modelTypeFieldsList) {
                if (modelTypeEnumField.path.split(".").pop() === param) {
                  // @ts-expect-error params have to be attached to modelTypeEnumField
                  modelTypeEnumField.param = modelTypeEnumField.path
                    .split(".")
                    .pop();
                  // @ts-expect-error placehoder needs to be deleted
                  delete modelTypeEnumField.placeholder;
                  return modelTypeEnumField;
                }
              }
            }
          }
        }
      }
    }
  }
}
