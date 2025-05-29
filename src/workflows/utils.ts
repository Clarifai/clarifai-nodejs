import resources_pb from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
const { OutputInfo } = resources_pb;
import struct_pb from "google-protobuf/google/protobuf/struct_pb.js";
const { Struct } = struct_pb;

interface YamlModelOutputInfo {
  params?: Record<string, struct_pb.JavaScriptValue>;
}

type YamlModel = Record<string, unknown>;

export function getYamlOutputInfoProto(
  yamlModelOutputInfo: YamlModelOutputInfo,
): resources_pb.OutputInfo | undefined {
  if (!yamlModelOutputInfo?.params) {
    return undefined;
  }

  return new OutputInfo().setParams(
    convertYamlParamsToApiParams(yamlModelOutputInfo.params),
  );
}

function convertYamlParamsToApiParams(
  yamlParams: YamlModelOutputInfo["params"],
): struct_pb.Struct | undefined {
  if (!yamlParams) {
    return undefined;
  }

  return Struct.fromJavaScript(yamlParams);
}

export function isSameYamlModel(
  apiModel: resources_pb.Model.AsObject,
  yamlModel: YamlModel,
): boolean {
  const yamlModelFromApi: YamlModel = {};
  for (const [key] of Object.entries(yamlModel)) {
    if (key === "outputInfo" && apiModel.modelVersion?.outputInfo?.params) {
      yamlModelFromApi[key] = {
        params: apiModel.modelVersion.outputInfo.params,
      };
    } else {
      // @ts-expect-error - key will be available in apiModelObject
      yamlModelFromApi[key] = apiModel?.[key];
    }
  }
  yamlModelFromApi.modelId = apiModel.id;

  const ignoreKeys: Set<string> = new Set();

  return isDictInDict(yamlModel, yamlModelFromApi, ignoreKeys);
}

function isDictInDict(
  dictionary1: Record<string, unknown>,
  dictionary2: Record<string, unknown>,
  ignoreKeys?: Set<string>,
): boolean {
  for (const [key, value] of Object.entries(dictionary1)) {
    if (ignoreKeys && ignoreKeys.has(key)) {
      continue;
    }
    if (!(key in dictionary2)) {
      return false;
    }
    if (typeof value === "object" && value !== null) {
      if (typeof dictionary2[key] !== "object" || dictionary2[key] === null) {
        return false;
      }
      return isDictInDict(
        value as Record<string, unknown>,
        dictionary2[key] as Record<string, unknown>,
      );
    } else if (value !== dictionary2[key]) {
      return false;
    }
  }

  return true;
}
