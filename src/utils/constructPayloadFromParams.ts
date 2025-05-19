import {
  Data,
  ModelTypeField,
  Part,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import {
  JavaScriptValue,
  Struct,
} from "google-protobuf/google/protobuf/struct_pb";
import { setPartDataTypes } from "./setPartsFromParams";

const setNestedFieldValue = (data: Data, value: JavaScriptValue) => {
  const nestedPart = new Part();
  const nestedData = new Data();
  nestedPart.setData(nestedData);
  nestedData.setStringValue(JSON.stringify(value));
  data.addParts(nestedPart);
};

export const constructPayloadFromParams = (
  payload: Record<string, JavaScriptValue>,
  modelPayloadSpecs?: ModelTypeField.AsObject[],
) => {
  const payloadParts = Object.entries(payload).map(
    ([fieldName, fieldValue]) => {
      const fieldType = modelPayloadSpecs?.find(
        (each) => each.name === fieldName,
      )?.type;

      const part = new Part();
      const data = new Data();
      part.setData(data);
      part.setId(fieldName);

      let updatedFieldValue = fieldValue;
      if (typeof fieldValue === "object") {
        if (!Array.isArray(fieldValue)) {
          updatedFieldValue = JSON.stringify(fieldValue);
        } else if (Array.isArray(fieldValue)) {
          updatedFieldValue = null;
          fieldValue.map((each) => {
            setNestedFieldValue(data, each);
          });
        }
      }

      const fieldValueStruct = Struct.fromJavaScript({
        value: updatedFieldValue,
      }).toObject();

      const [, valueObject] = fieldValueStruct.fieldsMap.find((_, index) => {
        return index === 0;
      }) ?? [undefined, undefined];

      console.log(valueObject);

      if (valueObject) {
        setPartDataTypes(data, valueObject, fieldType as unknown as number);
      }
      return part;
    },
  );
  return payloadParts;
};
