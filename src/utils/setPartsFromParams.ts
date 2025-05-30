import resources_pb from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
const { Data, Part } = resources_pb;
import struct_pb from "google-protobuf/google/protobuf/struct_pb.js";
const { Struct } = struct_pb;

export const setPartDataTypes = (
  data: resources_pb.Data,
  value: struct_pb.Value.AsObject,
  fieldType?: number,
) => {
  const stringVal = value.stringValue;
  const numVal = value.numberValue;
  if (numVal) {
    if (fieldType === 4) {
      data.setFloatValue(Number(numVal));
    } else if (fieldType === 3) {
      data.setIntValue(Number(numVal));
    }
  }
  if (stringVal) {
    if (fieldType === 4) {
      data.setFloatValue(Number(stringVal));
    } else if (fieldType === 3) {
      data.setIntValue(Number(stringVal));
    } else {
      data.setStringValue(stringVal);
    }
  }
  data.setBoolValue(value.boolValue);
};

export const constructPartsFromParams = (
  params: Record<string, struct_pb.JavaScriptValue>,
  modelParamSpecs?: resources_pb.ModelTypeField.AsObject[],
) => {
  const paramsStruct = Struct.fromJavaScript(params).toObject();
  const newParts = Object.entries(paramsStruct.fieldsMap).map(
    ([, [fieldName, fieldValue]]) => {
      const part = new Part();
      const data = new Data();
      part.setData(data);
      part.setId(fieldName);

      const fieldType = modelParamSpecs?.find(
        (spec) => spec.name === fieldName,
      )?.type;

      // unknown type conversion needed since the enum gives the index number in API
      setPartDataTypes(data, fieldValue, fieldType as unknown as number);
      return part;
    },
  );
  return newParts;
};
