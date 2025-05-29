import resources_pb from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { z } from "zod";

const typeValidators: Record<
  resources_pb.ModelTypeField.DataType,
  z.ZodTypeAny
> = {
  [resources_pb.ModelTypeField.DataType.NOT_SET]: z.undefined().or(z.null()),
  [resources_pb.ModelTypeField.DataType.STR]: z.string(),
  [resources_pb.ModelTypeField.DataType.BYTES]: z.any(), // placeholder; customize per your bytes format
  [resources_pb.ModelTypeField.DataType.INT]: z.number().int(),
  [resources_pb.ModelTypeField.DataType.FLOAT]: z.number().refine((n) => {
    // Based on https://github.com/colinhacks/zod/discussions/2237#discussioncomment-5487432
    return (
      !z.number().int().safeParse(n).success &&
      z.number().finite().safeParse(n).success
    );
  }),
  [resources_pb.ModelTypeField.DataType.BOOL]: z.boolean(),
  [resources_pb.ModelTypeField.DataType.NDARRAY]: z.any(), // could add stricter shape if using ndarray lib
  [resources_pb.ModelTypeField.DataType.JSON_DATA]: z.record(z.any()),
  [resources_pb.ModelTypeField.DataType.TEXT]: z.string(),
  [resources_pb.ModelTypeField.DataType.IMAGE]: z.any(), // placeholder; customize per your image format
  [resources_pb.ModelTypeField.DataType.CONCEPT]: z.any(),
  [resources_pb.ModelTypeField.DataType.REGION]: z.any(),
  [resources_pb.ModelTypeField.DataType.FRAME]: z.any(),
  [resources_pb.ModelTypeField.DataType.AUDIO]: z.any(),
  [resources_pb.ModelTypeField.DataType.VIDEO]: z.any(),
  [resources_pb.ModelTypeField.DataType.NAMED_FIELDS]: z.record(z.any()),
  [resources_pb.ModelTypeField.DataType.TUPLE]: z.array(z.any()), // accepts any array
  [resources_pb.ModelTypeField.DataType.LIST]: z.array(z.any()),
};

export const validateMethodSignaturesList = (
  params: Record<string, unknown>,
  inputFieldsList: resources_pb.ModelTypeField.AsObject[],
) => {
  const requiredFieldsList = inputFieldsList
    .filter((each) => each.required)
    .map((each) => each.name);
  const missingKeys = requiredFieldsList.filter((key) => !(key in params));
  if (missingKeys.length > 0) {
    throw new Error(`Missing required fields: ${missingKeys.join(", ")}`);
  }
  Object.entries(params).forEach(([key, value]) => {
    const field = inputFieldsList.find((field) => field.name === key);
    if (field) {
      const validator = typeValidators[field.type];
      if (validator) {
        const result = validator.safeParse(value);
        if (!result.success) {
          throw new Error(
            `Validation failed for field ${key}: ${result.error}`,
          );
        }
      } else {
        throw new Error(`No validator found for data type ${field.type}`);
      }
    } else {
      throw new Error(`Field ${key} not found in input fields list`);
    }
  });
};
