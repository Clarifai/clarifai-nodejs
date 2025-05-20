import {
  Audio,
  Concept,
  Data,
  Frame,
  Image,
  ModelTypeField,
  Part,
  Region,
  Video,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import {
  JavaScriptValue,
  Struct,
} from "google-protobuf/google/protobuf/struct_pb";
import { setPartDataTypes } from "./setPartsFromParams";
import { fromPartialProtobufObject } from "./fromPartialProtobufObject";

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

    if (typeof fieldValue === "object" && fieldValue !== null) {
      if (fieldType === ModelTypeField.DataType.JSON_DATA) {
        updatedFieldValue = JSON.stringify(fieldValue);
      }
      if (
        fieldType === ModelTypeField.DataType.IMAGE &&
        !Array.isArray(fieldValue)
      ) {
        const imageData = fromPartialProtobufObject(Image, fieldValue);
        data.setImage(imageData);
        return;
      }
      if (fieldType === ModelTypeField.DataType.AUDIO) {
        const audioData = fromPartialProtobufObject(Audio, fieldValue);
        data.setAudio(audioData);
        return;
      }
      if (fieldType === ModelTypeField.DataType.VIDEO) {
        const videoData = fromPartialProtobufObject(Video, fieldValue);
        data.setVideo(videoData);
        return;
      }
      if (
        fieldType === ModelTypeField.DataType.CONCEPT &&
        !Array.isArray(fieldValue)
      ) {
        const conceptData = fromPartialProtobufObject(Concept, fieldValue);
        data.setConceptsList([conceptData]);
        return;
      }
      if (
        fieldType === ModelTypeField.DataType.CONCEPT &&
        Array.isArray(fieldValue)
      ) {
        const conceptsList = fieldValue.map((each) => {
          return fromPartialProtobufObject(Concept, each);
        });
        data.setConceptsList(conceptsList);
        return;
      }
      if (
        fieldType === ModelTypeField.DataType.REGION &&
        !Array.isArray(fieldValue)
      ) {
        const regionData = fromPartialProtobufObject(Region, fieldValue);
        data.setRegionsList([regionData]);
        return;
      }
      if (
        fieldType === ModelTypeField.DataType.REGION &&
        Array.isArray(fieldValue)
      ) {
        const regionsList = fieldValue.map((each) => {
          return fromPartialProtobufObject(Region, each);
        });
        data.setRegionsList(regionsList);
        return;
      }
      if (
        fieldType === ModelTypeField.DataType.FRAME &&
        !Array.isArray(fieldValue)
      ) {
        const frameData = fromPartialProtobufObject(Frame, fieldValue);
        data.setFramesList([frameData]);
        return;
      }
      if (
        fieldType === ModelTypeField.DataType.FRAME &&
        Array.isArray(fieldValue)
      ) {
        const framesList = fieldValue.map((each) => {
          return fromPartialProtobufObject(Frame, each);
        });
        data.setFramesList(framesList);
        return;
      }
      if (!Array.isArray(fieldValue)) {
        // Unknown object just store it as string
        updatedFieldValue = JSON.stringify(fieldValue);
      }
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
