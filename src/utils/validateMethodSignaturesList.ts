import { ModelTypeField } from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { z } from "zod";

const typeValidators: Record<ModelTypeField.DataType, z.ZodTypeAny> = {
  [ModelTypeField.DataType.NOT_SET]: z.undefined().or(z.null()),
  [ModelTypeField.DataType.STR]: z.string(),
  [ModelTypeField.DataType.BYTES]: z.any(), // placeholder; customize per your bytes format
  [ModelTypeField.DataType.INT]: z.number().int(),
  [ModelTypeField.DataType.FLOAT]: z.number().refine((n) => {
    // Based on https://github.com/colinhacks/zod/discussions/2237#discussioncomment-5487432
    return (
      !z.number().int().safeParse(n).success &&
      z.number().finite().safeParse(n).success
    );
  }),
  [ModelTypeField.DataType.BOOL]: z.boolean(),
  [ModelTypeField.DataType.NDARRAY]: z.any(), // could add stricter shape if using ndarray lib
  [ModelTypeField.DataType.JSON_DATA]: z.record(z.any()),
  [ModelTypeField.DataType.TEXT]: z.string(),
  [ModelTypeField.DataType.IMAGE]: z.any(), // placeholder; customize per your image format
  [ModelTypeField.DataType.CONCEPT]: z.any(),
  [ModelTypeField.DataType.REGION]: z.any(),
  [ModelTypeField.DataType.FRAME]: z.any(),
  [ModelTypeField.DataType.AUDIO]: z.any(),
  [ModelTypeField.DataType.VIDEO]: z.any(),
  [ModelTypeField.DataType.NAMED_FIELDS]: z.record(z.any()),
  [ModelTypeField.DataType.TUPLE]: z.array(z.any()), // accepts any array
  [ModelTypeField.DataType.LIST]: z.array(z.any()),
};

export const validateMethodSignaturesList = (
  params: Record<string, unknown>,
  inputFieldsList: ModelTypeField.AsObject[],
) => {
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
