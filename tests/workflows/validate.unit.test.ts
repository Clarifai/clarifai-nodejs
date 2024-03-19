import { validateWorkflow } from "../../src/workflows/validate";
import { describe, expect, it } from "vitest";

describe("validate", () => {
  it("should validate correct data", () => {
    const data = {
      workflow: {
        id: "testWorkflow",
        nodes: [
          {
            id: "node1",
            model: {
              modelId: "testModel",
            },
          },
          {
            id: "node2",
            model: {
              modelId: "testModel",
            },
            node_inputs: [
              {
                nodeId: "node1",
              },
            ],
          },
        ],
      },
    };

    expect(() => validateWorkflow(data)).not.toThrow();
  });

  it("should throw error for incorrect id", () => {
    const data = {
      workflow: {
        id: "",
        nodes: [],
      },
    };

    expect(() => validateWorkflow(data)).toThrow();
  });

  it("should throw error for incorrect model_id", () => {
    const data = {
      workflow: {
        id: "testWorkflow",
        nodes: [
          {
            id: "node1",
            model: {
              modelId: "",
            },
          },
        ],
      },
    };

    expect(() => validateWorkflow(data)).toThrow();
  });

  it("should throw error for incorrect model_version_id", () => {
    const data = {
      workflow: {
        id: "testWorkflow",
        nodes: [
          {
            id: "node1",
            model: {
              modelId: "testModel",
              modelVersionId: "incorrect",
            },
          },
        ],
      },
    };

    expect(() => validateWorkflow(data)).toThrow();
  });

  it("should throw error for model with model_version_id and other fields", () => {
    const data = {
      workflow: {
        id: "testWorkflow",
        nodes: [
          {
            id: "node1",
            model: {
              modelId: "testModel",
              modelVersionId: "12345678901234567890123456789012",
              description: "test",
            },
          },
        ],
      },
    };

    expect(() => validateWorkflow(data)).toThrow();
  });

  it("should throw error for node with missing input", () => {
    const data = {
      workflow: {
        id: "testWorkflow",
        nodes: [
          {
            id: "node1",
            model: {
              modelId: "testModel",
            },
            nodeInputs: [
              {
                nodeId: "node2",
              },
            ],
          },
        ],
      },
    };

    expect(() => validateWorkflow(data)).toThrow();
  });
});
