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
  if (model.modelVersionId && modelHasOtherFields(model)) {
    throw new Error(
      `model should not set modelVersionId and other model fields: ${JSON.stringify(model)}; please remove modelVersionId or other model fields.`,
    );
  }
  return true;
};

const modelHasOtherFields = (model: Record<string, unknown>): boolean => {
  return Object.keys(model).some(
    (key) => key !== "modelId" && key !== "modelVersionId",
  );
};

const workflowNodesHaveValidDependencies = <
  T extends { id: string; nodeInputs?: K[] },
  K extends { nodeId: string },
>(
  nodes: Array<T>,
): boolean => {
  const nodeIds = new Set();
  for (const node of nodes) {
    (node.nodeInputs || []).forEach((nodeInput) => {
      if (!nodeIds.has(nodeInput.nodeId)) {
        throw new Error(
          `missing input '${nodeInput.nodeId}' for node '${node.id}'`,
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
              modelId: idValidator,
              appId: idValidator.optional(),
              userId: idValidator.optional(),
              modelVersionId: hexIdValidator.optional(),
              modelTypeId: idValidator.optional(),
              description: z.string().optional(),
              outputInfo: z
                .object({
                  params: z.record(z.any()).optional(),
                })
                .optional(),
            })
            .refine(modelDoesNotHaveModelVersionIdAndOtherFields),
          nodeInputs: z
            .array(
              z.object({
                nodeId: z.string().min(1),
              }),
            )
            .optional(),
        }),
      )
      .refine(workflowNodesHaveValidDependencies),
  }),
});

// Function to validate data
export const validateWorkflow = (data: unknown) => {
  return dataSchema.parse(data);
};
