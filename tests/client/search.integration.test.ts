import path from "path";
import { getSchema } from "../../src/schema/search";
import { z } from "zod";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { App, Dataset, Input, Search, User } from "../../src/index";

const NOW = "search_integration"; //Date.now().toString();
const CREATE_APP_USER_ID = import.meta.env.VITE_CLARIFAI_USER_ID;
const CREATE_APP_ID = `ci_test_app_${NOW}`;
const CREATE_DATASET_ID = `ci_test_dataset_${NOW}`;
const DOG_IMG_URL = "https://samples.clarifai.com/dog.tiff";
const DATASET_IMAGES_DIR = path.resolve(__dirname, "../assets/voc/images");

function getFiltersForTest(): [
  z.infer<ReturnType<typeof getSchema>>,
  number,
][] {
  return [
    [
      [
        {
          geoPoint: {
            longitude: -29.0,
            latitude: 40.0,
            geoLimit: 100,
          },
        },
      ],
      1,
    ],
    [
      [
        {
          concepts: [
            {
              name: "dog",
              value: 1,
            },
          ],
        },
      ],
      1,
    ],
    [
      [
        {
          concepts: [
            {
              name: "deer",
              value: 1,
            },
            {
              name: "dog",
              value: 1,
            },
          ],
        },
      ],
      1,
    ],
    [
      [
        {
          concepts: [
            {
              name: "dog",
              value: 1,
            },
          ],
        },
        {
          concepts: [
            {
              name: "deer",
              value: 1,
            },
          ],
        },
      ],
      0,
    ],
    [
      [
        {
          metadata: {
            Breed: "Saint Bernard",
          },
        },
      ],
      1,
    ],
    [
      [
        {
          inputTypes: ["image"],
        },
        {
          inputStatusCode: 30000,
        },
      ],
      1,
    ],
    [
      [
        {
          inputTypes: ["text", "audio", "video"],
        },
      ],
      0,
    ],
    [
      [
        {
          inputTypes: ["text", "audio", "video"],
          inputStatusCode: 30000,
        },
      ],
      1,
    ],
    [
      [
        {
          inputDatasetIds: ["random_dataset"],
        },
      ],
      0,
    ],
  ];
}

describe("Search", () => {
  const client = new User({
    userId: CREATE_APP_USER_ID,
    appId: CREATE_APP_ID,
    pat: import.meta.env.VITE_CLARIFAI_PAT,
  });
  const search = new Search({
    authConfig: {
      userId: CREATE_APP_USER_ID,
      appId: CREATE_APP_ID,
      pat: import.meta.env.VITE_CLARIFAI_PAT,
    },
    topK: 1,
    metric: "euclidean",
  });
  let app: App;

  beforeAll(async () => {
    const appObj = await client.createApp({
      appId: CREATE_APP_ID,
      baseWorkflow: "General",
    });
    app = new App({
      authConfig: {
        userId: CREATE_APP_USER_ID,
        appId: appObj.id,
        pat: import.meta.env.VITE_CLARIFAI_PAT,
      },
    });
    const datasetObj = await app.createDataset({
      datasetId: CREATE_DATASET_ID,
    });
    const metadata = {
      Breed: "Saint Bernard",
    };
    const inputProto = Input.getInputFromUrl({
      imageUrl: DOG_IMG_URL,
      metadata,
      datasetId: datasetObj.id,
      inputId: "dog-tiff",
      labels: ["dog"],
      geoInfo: { longitude: -30.0, latitude: 40.0 },
    });
    const input = new Input({
      authConfig: {
        userId: CREATE_APP_USER_ID,
        appId: appObj.id,
        pat: import.meta.env.VITE_CLARIFAI_PAT,
      },
    });
    await input.uploadInputs({ inputs: [inputProto] });
    const dataset = new Dataset({
      authConfig: {
        userId: CREATE_APP_USER_ID,
        appId: appObj.id,
        pat: import.meta.env.VITE_CLARIFAI_PAT,
      },
      datasetId: datasetObj.id,
    });
    await dataset.uploadFromFolder({
      folderPath: DATASET_IMAGES_DIR,
      inputType: "image",
      labels: false,
    });
  }, 50000);

  it("should get expected hits for filters", async () => {
    const filtersWithHits = getFiltersForTest();
    for (const [filters, expectedHits] of filtersWithHits) {
      const searchResponseGenerator = search.query({
        filters,
      });
      const result = (await searchResponseGenerator.next())?.value ?? null;
      expect(result).not.toBeNull();
      if (result) {
        expect(result.hitsList.length).toBe(expectedHits);
      }
    }
  }, 10000);

  it("should get expected hits for ranks", async () => {
    const searchResponseGenerator = search.query({
      ranks: [
        {
          imageUrl: DOG_IMG_URL,
        },
      ],
    });
    const result = (await searchResponseGenerator.next())?.value ?? null;
    expect(result).not.toBeNull();
    if (result) {
      expect(result.hitsList.length).toBe(1);
      expect(result.hitsList[0].input?.id).toBe("dog-tiff");
    }
  });

  it("should get expected hits for filters and ranks", async () => {
    const searchResponseGenerator = search.query({
      ranks: [
        {
          imageUrl: DOG_IMG_URL,
        },
      ],
      filters: [
        {
          inputTypes: ["image"],
        },
      ],
    });
    const result = (await searchResponseGenerator.next())?.value ?? null;
    expect(result).not.toBeNull();
    if (result) {
      expect(result.hitsList.length).toBe(1);
      expect(result.hitsList[0].input?.id).toBe("dog-tiff");
    }
  });

  afterAll(async () => {
    await client.deleteApp({ appId: CREATE_APP_ID });
  });
});
