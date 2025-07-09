import { describe, expect, it } from "vitest";
import { Input, Workflow } from "../../src/index";
import { ClarifaiUrl } from "../../src/urls/helper";

const GENERAL_WORKFLOW =
  "https://clarifai.com/dani-cfg/test-ocr-workflow/workflows/General";
const pat = import.meta.env.VITE_CLARIFAI_PAT;
const CELEBRITY_IMAGE = "https://samples.clarifai.com/celebrity.jpeg";
const OCR_WORKFLOW =
  "https://clarifai.com/dani-cfg/test-ocr-workflow/workflows/OCR-Workflow";
const FEATURED_LLMS =
  "https://clarifai.com/dani-cfg/test-ocr-workflow/workflows/featured-llms";

describe("Workflow", () => {
  it("should predict with general workflow", async () => {
    const workflow = new Workflow({
      url: GENERAL_WORKFLOW,
      authConfig: {
        pat,
      },
    });
    const input = Input.getInputFromUrl({
      inputId: "test-image",
      imageUrl: CELEBRITY_IMAGE,
    });
    const response = await workflow.predict({ inputs: [input] });
    const conceptsList =
      response.resultsList?.[0].outputsList?.[0].data?.conceptsList;
    const embeddingsList =
      response.resultsList?.[0].outputsList?.[1].data?.embeddingsList;
    const clustersList =
      response.resultsList?.[0].outputsList?.[2].data?.clustersList;
    expect(conceptsList?.length).toBeGreaterThan(0);
    expect(embeddingsList?.length).toBeGreaterThan(0);
    expect(clustersList?.length).toBeGreaterThan(0);
  });

  it("should predict with OCR workflow with pinned CO model version", async () => {
    const workflow = new Workflow({
      url: OCR_WORKFLOW,
      authConfig: {
        pat,
      },
    });
    const input = Input.getInputFromUrl({
      inputId: "test-image",
      imageUrl: CELEBRITY_IMAGE,
    });
    const response = await workflow.predict({ inputs: [input] });
    const text = response.resultsList?.[0].outputsList?.[0].data?.text?.raw;
    const text2 = response.resultsList?.[0].outputsList?.[1].data?.text?.raw;
    expect(text).toBeTypeOf("string");
    expect(text?.length).toBeGreaterThan(0);
    expect(text2).toBeTypeOf("string");
    expect(text2?.length).toBeGreaterThan(0);
  });

  it(
    "should predict with featured CO LLM models",
    {
      timeout: 120000, // Increase timeout for LLM prediction
    },
    async () => {
      const workflow = new Workflow({
        url: FEATURED_LLMS,
        authConfig: {
          pat,
        },
      });
      const input = Input.getTextInput({
        inputId: "test-text",
        rawText: "What is Photosynthesis?",
      });
      const response = await workflow.predict({ inputs: [input] });
      const text = response.resultsList?.[0].outputsList?.[0].data?.text?.raw;
      expect(text).toBeTypeOf("string");
      expect(text?.length).toBeGreaterThan(0);
      const text2 = response.resultsList?.[0].outputsList?.[1].data?.text?.raw;
      expect(text2).toBeTypeOf("string");
      expect(text2?.length).toBeGreaterThan(0);
      const text3 = response.resultsList?.[0].outputsList?.[2].data?.text?.raw;
      expect(text3).toBeTypeOf("string");
      expect(text3?.length).toBeGreaterThan(0);
      const text4 = response.resultsList?.[0].outputsList?.[3].data?.text?.raw;
      expect(text4).toBeTypeOf("string");
      expect(text4?.length).toBeGreaterThan(0);
    },
  );

  it("should display error with cause on invalid workflow", async () => {
    const workflow = new Workflow({
      url: (FEATURED_LLMS + "invalid-workflow") as ClarifaiUrl,
      authConfig: {
        pat,
      },
    });
    const input = Input.getTextInput({
      inputId: "test-text",
      rawText: "What is Photosynthesis?",
    });
    try {
      await workflow.predict({ inputs: [input] });
      throw new Error("Expected an error to be thrown");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log(error.message, error.cause);
      expect(error.message).toMatch(
        /Workflow Predict failed with response Resource does not exist/,
      );
      expect(error.cause.status.code).toBe(11101);
    }
  });

  it("should display error with cause on invalid input", async () => {
    const workflow = new Workflow({
      url: FEATURED_LLMS,
      authConfig: {
        pat,
      },
    });
    const input = Input.getInputFromUrl({
      inputId: "test-image",
      imageUrl: CELEBRITY_IMAGE,
    });
    try {
      await workflow.predict({ inputs: [input] });
      throw new Error("Expected an error to be thrown");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log(error.message, error.cause);
      expect(error.message).toMatch(
        /Workflow Predict failed with response Input format unsupported/,
      );
      expect(error.cause.status.code).toBe(30101);
    }
  });
});
