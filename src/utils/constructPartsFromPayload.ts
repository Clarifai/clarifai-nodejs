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

export const constructPartsFromPayload = (
  payload: Record<string, JavaScriptValue> | JavaScriptValue[],
  modelPayloadSpecs?: ModelTypeField.AsObject[],
) => {
  const partsList: Part[] = [];

  if (Array.isArray(payload)) {
    payload.forEach((nestedPayload) => {
      const part = new Part();
      const data = new Data();
      part.setData(data);

      let updatedPayloadValue = nestedPayload;
      if (typeof nestedPayload === "object") {
        updatedPayloadValue = JSON.stringify(nestedPayload);
      }

      const fieldValueStruct = Struct.fromJavaScript({
        value: updatedPayloadValue,
      }).toObject();

      const [, valueObject] = fieldValueStruct.fieldsMap.find((_, index) => {
        return index === 0;
      }) ?? [undefined, undefined];

      if (valueObject) {
        setPartDataTypes(
          data,
          valueObject,
          modelPayloadSpecs?.[0]?.type as unknown as number,
        );
      }

      partsList.push(part);
    });
    return partsList;
  }

  Object.entries(payload).forEach(([fieldName, fieldValue]) => {
    const specs = modelPayloadSpecs?.find((each) => each.name === fieldName);
    const fieldType = specs?.type;
    const part = new Part();
    const data = new Data();
    part.setData(data);
    part.setId(fieldName);

    let nestedPartsList: Part[] | undefined = undefined;

    if (specs?.typeArgsList) {
      nestedPartsList = constructPartsFromPayload(
        fieldValue as JavaScriptValue[],
        specs.typeArgsList,
      );
    }

    if (nestedPartsList) {
      nestedPartsList.forEach((nestedPart) => data.addParts(nestedPart));
    }

    let updatedFieldValue = fieldValue;

    if (typeof fieldValue === "object" && !Array.isArray(fieldValue)) {
      updatedFieldValue = JSON.stringify(fieldValue);
    }

    const fieldValueStruct = Struct.fromJavaScript({
      value: updatedFieldValue,
    }).toObject();

    const [, valueObject] = fieldValueStruct.fieldsMap.find((_, index) => {
      return index === 0;
    }) ?? [undefined, undefined];

    if (valueObject) {
      setPartDataTypes(data, valueObject, fieldType as unknown as number);
    }
    partsList.push(part);
  });

  return partsList;
};
