import resources_pb from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import struct_pb from "google-protobuf/google/protobuf/struct_pb.js";
import { setPartDataTypes } from "./setPartsFromParams";
import { fromPartialProtobufObject } from "./fromPartialProtobufObject";
const {
  Audio,
  Concept,
  Data,
  Frame,
  Image,
  ModelTypeField,
  Part,
  Region,
  Video,
} = resources_pb;
const { Struct } = struct_pb;

export const constructPartsFromPayload = (
  payload:
    | Record<string, struct_pb.JavaScriptValue>
    | struct_pb.JavaScriptValue[],
  modelPayloadSpecs?: resources_pb.ModelTypeField.AsObject[],
) => {
  const partsList: resources_pb.Part[] = [];

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

    let nestedPartsList: resources_pb.Part[] | undefined = undefined;

    if (specs?.typeArgsList?.length) {
      nestedPartsList = constructPartsFromPayload(
        fieldValue as struct_pb.JavaScriptValue[],
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
      } else if (
        fieldType === ModelTypeField.DataType.IMAGE &&
        !Array.isArray(fieldValue)
      ) {
        const imageData = fromPartialProtobufObject(Image, fieldValue);
        data.setImage(imageData);
        partsList.push(part);
        return;
      } else if (fieldType === ModelTypeField.DataType.AUDIO) {
        const audioData = fromPartialProtobufObject(Audio, fieldValue);
        data.setAudio(audioData);
        partsList.push(part);
        return;
      } else if (fieldType === ModelTypeField.DataType.VIDEO) {
        const videoData = fromPartialProtobufObject(Video, fieldValue);
        data.setVideo(videoData);
        partsList.push(part);
        return;
      } else if (
        fieldType === ModelTypeField.DataType.CONCEPT &&
        !Array.isArray(fieldValue)
      ) {
        const conceptData = fromPartialProtobufObject(Concept, fieldValue);
        data.setConceptsList([conceptData]);
        partsList.push(part);
        return;
      } else if (
        fieldType === ModelTypeField.DataType.CONCEPT &&
        Array.isArray(fieldValue)
      ) {
        const conceptsList = fieldValue.map((each) => {
          return fromPartialProtobufObject(Concept, each);
        });
        data.setConceptsList(conceptsList);
        partsList.push(part);
        return;
      } else if (
        fieldType === ModelTypeField.DataType.REGION &&
        !Array.isArray(fieldValue)
      ) {
        const regionData = fromPartialProtobufObject(Region, fieldValue);
        data.setRegionsList([regionData]);
        partsList.push(part);
        return;
      } else if (
        fieldType === ModelTypeField.DataType.REGION &&
        Array.isArray(fieldValue)
      ) {
        const regionsList = fieldValue.map((each) => {
          return fromPartialProtobufObject(Region, each);
        });
        data.setRegionsList(regionsList);
        partsList.push(part);
        return;
      } else if (
        fieldType === ModelTypeField.DataType.FRAME &&
        !Array.isArray(fieldValue)
      ) {
        const frameData = fromPartialProtobufObject(Frame, fieldValue);
        data.setFramesList([frameData]);
        partsList.push(part);
        return;
      } else if (
        fieldType === ModelTypeField.DataType.FRAME &&
        Array.isArray(fieldValue)
      ) {
        const framesList = fieldValue.map((each) => {
          return fromPartialProtobufObject(Frame, each);
        });
        data.setFramesList(framesList);
        partsList.push(part);
        return;
      } else if (!Array.isArray(fieldValue)) {
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
