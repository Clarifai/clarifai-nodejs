import { describe, expect, it } from "vitest";
import { Input, Model } from "../../src/index";
import path from "path";
import * as fs from "fs";
import { MultiOutputResponse } from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import {
  Concept,
  Frame,
  OutputConfig,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";

const DOG_IMAGE_URL = "https://samples.clarifai.com/dog2.jpeg";
const NON_EXISTING_IMAGE_URL = "http://example.com/non-existing.jpg";
const RED_TRUCK_IMAGE_FILE_PATH = path.resolve(
  __dirname,
  "../assets/red-truck.png",
);
const BEER_VIDEO_URL = "https://samples.clarifai.com/beer.mp4";

const MAIN_APP_ID = "main";
const MAIN_APP_USER_ID = "clarifai";
const GENERAL_MODEL_ID = "aaa03c23b3724a16a56b629203edc62c";
const CLIP_EMBED_MODEL_ID = "multimodal-clip-embed";

const CLARIFAI_PAT = import.meta.env.VITE_CLARIFAI_PAT;

function validateConceptsLength(
  response: MultiOutputResponse.AsObject["outputsList"],
): void {
  if ((response?.[0]?.data?.conceptsList?.length ?? 0) > 0) {
    return;
  }
  throw Error("Concepts length is 0");
}

describe(
  "Model",
  {
    timeout: 10000,
  },
  () => {
    it("should predict with image url", async () => {
      const model = new Model({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
        modelId: GENERAL_MODEL_ID,
      });
      const prediction = await model.predictByUrl({
        url: DOG_IMAGE_URL,
        inputType: "image",
      });
      expect(() => validateConceptsLength(prediction)).not.toThrow();
    });

    it("should predict with image filepath", async () => {
      const model = new Model({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
        modelId: GENERAL_MODEL_ID,
      });
      const prediction = await model.predictByFilepath({
        filepath: RED_TRUCK_IMAGE_FILE_PATH,
        inputType: "image",
      });
      expect(() => validateConceptsLength(prediction)).not.toThrow();
    });

    it("should predict with image fileBytes", async () => {
      const model = new Model({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
        modelId: GENERAL_MODEL_ID,
      });
      const fileBuffer = fs.readFileSync(RED_TRUCK_IMAGE_FILE_PATH);
      const prediction = await model.predictByBytes({
        inputBytes: fileBuffer,
        inputType: "image",
      });
      expect(() => validateConceptsLength(prediction)).not.toThrow();
    });

    it("should predict with image url with selected concepts", async () => {
      const model = new Model({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
        modelId: GENERAL_MODEL_ID,
      });
      const selectedConcepts = [
        new Concept().setName("dog"),
        new Concept().setName("cat"),
      ];
      const outputConfig = new OutputConfig().setSelectConceptsList(
        selectedConcepts,
      );
      const prediction = await model.predictByUrl({
        url: DOG_IMAGE_URL,
        inputType: "image",
        outputConfig: outputConfig,
      });
      expect(() => validateConceptsLength(prediction)).not.toThrow();
      const concepts = prediction?.[0]?.data?.conceptsList;
      expect(concepts?.length).toBe(selectedConcepts.length);
      const dogConcept = concepts?.find((c) => c.name === "dog");
      const catConcept = concepts?.find((c) => c.name === "cat");
      expect(dogConcept?.value).toBeGreaterThan(catConcept?.value ?? 0);
    });

    it("should predict with image url with min value", async () => {
      const model = new Model({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
        modelId: GENERAL_MODEL_ID,
      });
      const outputConfig = new OutputConfig().setMinValue(0.95);
      const prediction = await model.predictByUrl({
        url: DOG_IMAGE_URL,
        inputType: "image",
        outputConfig: outputConfig,
      });
      expect(() => validateConceptsLength(prediction)).not.toThrow();
      const concepts = prediction?.[0]?.data?.conceptsList;
      expect(concepts?.length).toBeGreaterThan(0);
      const concept = concepts?.[0];
      expect(concept?.value).toBeGreaterThan(0.95);
    });

    it("should predict with image url with max concepts", async () => {
      const model = new Model({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
        modelId: GENERAL_MODEL_ID,
      });
      const outputConfig = new OutputConfig().setMaxConcepts(1);
      const prediction = await model.predictByUrl({
        url: DOG_IMAGE_URL,
        inputType: "image",
        outputConfig: outputConfig,
      });
      expect(() => validateConceptsLength(prediction)).not.toThrow();
      const concepts = prediction?.[0]?.data?.conceptsList;
      expect(concepts?.length).toBe(1);
    });

    it("should fail with invalid file path", async () => {
      const model = new Model({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
        modelId: GENERAL_MODEL_ID,
      });
      expect(() =>
        model.predictByFilepath({
          filepath: "invalid-file-path",
          inputType: "image",
        }),
      ).toThrow();
    });

    it("should fail with invalid file url", async () => {
      const model = new Model({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
        modelId: GENERAL_MODEL_ID,
      });
      await expect(
        model.predictByUrl({
          url: NON_EXISTING_IMAGE_URL,
          inputType: "image",
        }),
      ).rejects.toThrow();
    });

    // typescript can catch this error. But testing it for javascript codebases
    it("should fail with invalid file type", async () => {
      const model = new Model({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
        modelId: GENERAL_MODEL_ID,
      });
      expect(() =>
        model.predictByUrl({
          url: DOG_IMAGE_URL,
          inputType: "invalid-file" as "video",
        }),
      ).toThrow();
    });

    it("should predict with video url with custom sample ms", async () => {
      const model = new Model({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
        modelId: GENERAL_MODEL_ID,
      });
      const outputConfig = new OutputConfig().setSampleMs(2000);
      const prediction = await model.predictByUrl({
        url: BEER_VIDEO_URL,
        inputType: "video",
        outputConfig: outputConfig,
      });
      let expectedTime = 1000;
      for (const frame of (prediction?.[0].data?.framesList ??
        []) as Frame.AsObject[]) {
        expect(frame.frameInfo?.time).toBe(expectedTime);
        expectedTime += 2000;
      }
    });

    it("should predict text embedding with raw text", async () => {
      const clipDim = 512;
      const model = new Model({
        authConfig: {
          pat: CLARIFAI_PAT,
          userId: MAIN_APP_USER_ID,
          appId: MAIN_APP_ID,
        },
        modelId: CLIP_EMBED_MODEL_ID,
      });
      const input = Input.getInputFromBytes({
        inputId: "",
        textBytes: Buffer.from("Hi my name is Jim."),
      });
      const prediction = await model.predict({
        inputs: [input],
      });
      expect(prediction?.[0].data?.embeddingsList?.[0]?.numDimensions).toBe(
        clipDim,
      );
    });

    it("should predict from a model outside the app", async () => {
      const model = new Model({
        url: "https://clarifai.com/clarifai/main/models/general-image-recognition",
        authConfig: {
          pat: CLARIFAI_PAT,
        },
      });
      const imageUrl = "https://samples.clarifai.com/metro-north.jpg";
      const modelPrediction = await model.predictByUrl({
        url: imageUrl,
        inputType: "image",
      });
      expect(modelPrediction.length).toBeGreaterThan(0);
    });

    it("should convert image to text", async () => {
      const modelUrl =
        "https://clarifai.com/salesforce/blip/models/general-english-image-caption-blip";
      const imageUrl =
        "https://s3.amazonaws.com/samples.clarifai.com/featured-models/image-captioning-statue-of-liberty.jpeg";

      const model = new Model({
        url: modelUrl,
        authConfig: {
          pat: CLARIFAI_PAT,
        },
      });
      const modelPrediction = await model.predictByUrl({
        url: imageUrl,
        inputType: "image",
      });
      expect(modelPrediction?.[0]?.data?.text?.raw).toBeTruthy();
    });

    it.skip("should predict multimodal with image and text", async () => {
      const prompt = "What time of day is it?";
      const imageUrl = "https://samples.clarifai.com/metro-north.jpg";
      const modelUrl =
        "https://clarifai.com/openai/chat-completion/models/openai-gpt-4-vision";
      const inferenceParams = { temperature: 0.2, maxTokens: 100 };
      const multiInputs = Input.getMultimodalInput({
        inputId: "",
        imageUrl,
        rawText: prompt,
      });
      const model = new Model({
        url: modelUrl,
        authConfig: { pat: CLARIFAI_PAT },
      });

      const modelPrediction = await model.predict({
        inputs: [multiInputs],
        inferenceParams,
      });

      expect(modelPrediction?.[0]?.data?.text?.raw).toBeTruthy();
    });
  },
);
