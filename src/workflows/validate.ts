import { z } from "zod";

const idValidator = z
  .string()
  .min(1)
  .max(48)
  .regex(/^[0-9A-Za-z]+([-_][0-9A-Za-z]+)*$/);

const hexIdValidator = z.preprocess(
  (val) => (typeof val === "string" ? val.toLowerCase() : val),
  z
    .string()
    .length(32)
    .regex(/^[0-9a-f]{32}$/),
);

const modelDoesNotHaveModelVersionIdAndOtherFields = (
  model: Record<string, unknown>,
): boolean => {
  if (model.model_version_id && modelHasOtherFields(model)) {
    throw new Error(
      `model should not set model_version_id and other model fields: ${JSON.stringify(model)}; please remove model_version_id or other model fields.`,
    );
  }
  return true;
};

const modelHasOtherFields = (model: Record<string, unknown>): boolean => {
  return Object.keys(model).some(
    (key) => key !== "model_id" && key !== "model_version_id",
  );
};

const workflowNodesHaveValidDependencies = <
  T extends { id: string; node_inputs?: K[] },
  K extends { node_id: string },
>(
  nodes: Array<T>,
): boolean => {
  const nodeIds = new Set();
  for (const node of nodes) {
    (node.node_inputs || []).forEach((nodeInput) => {
      if (!nodeIds.has(nodeInput.node_id)) {
        throw new Error(
          `missing input '${nodeInput.node_id}' for node '${node.id}'`,
        );
      }
    });
    nodeIds.add(node.id);
  }
  return true;
};

const dataSchema = z.object({
  workflow: z.object({
    id: idValidator,
    nodes: z
      .array(
        z.object({
          id: z.string().min(1),
          model: z
            .object({
              model_id: idValidator,
              app_id: idValidator.optional(),
              user_id: idValidator.optional(),
              model_version_id: hexIdValidator.optional(),
              model_type_id: idValidator.optional(),
              description: z.string().optional(),
              output_info: z
                .object({
                  params: z.record(z.any()).optional(),
                })
                .optional(),
            })
            .refine(modelDoesNotHaveModelVersionIdAndOtherFields),
          node_inputs: z
            .array(
              z.object({
                node_id: z.string().min(1),
              }),
            )
            .optional(),
        }),
      )
      .refine(workflowNodesHaveValidDependencies),
  }),
});

// Function to validate data
export const validate = (data: unknown) => {
  return dataSchema.parse(data);
};
