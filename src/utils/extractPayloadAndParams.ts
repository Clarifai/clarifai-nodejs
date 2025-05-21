import { ModelTypeField } from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";

export const extractPayloadAndParams = (
  requestObject: Record<string, unknown>,
  paramSpecs: ModelTypeField.AsObject[],
) => {
  const payload: Record<string, unknown> = {};
  const params: Record<string, unknown> = {};

  Object.entries(requestObject).forEach(([key, value]) => {
    const paramSpec = paramSpecs.find((spec) => spec.name === key);
    if (paramSpec?.isParam) {
      // If the key is found in paramSpecs, add it to params
      params[key] = value;
    } else {
      // Otherwise, add it to payload
      payload[key] = value;
    }
  });

  return { payload, params };
};
