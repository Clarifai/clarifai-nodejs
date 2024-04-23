import path from "path";
import { getSchema } from "../../src/schema/search";
import { z } from "zod";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { App, Dataset, Input, Search, User } from "../../src/index";
import { Hit } from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";

const NOW = Date.now().toString() + "-search";
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
  // Initialize search without topK value for pagination with custom pages & page sizes
  const searchWithPagination = new Search({
    authConfig: {
      userId: CREATE_APP_USER_ID,
      appId: CREATE_APP_ID,
      pat: import.meta.env.VITE_CLARIFAI_PAT,
    },
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

  it("should get expected hits with corresponding pagination info", async () => {
    const searchResponseGenerator = searchWithPagination.query({
      filters: [
        {
          inputTypes: ["image"],
        },
      ],
      page: 1,
      perPage: 3,
    });
    const result = (await searchResponseGenerator.next())?.value ?? null;
    expect(result).not.toBeNull();
    if (result) {
      expect(result.hitsList.length).toBe(3);
    }
  });

  it("should paginate through search results", async () => {
    const searchResponseGenerator = searchWithPagination.query({
      filters: [{ inputTypes: ["image"] }],
    });
    const hitsList: Hit.AsObject[] = [];
    for await (const searchResponse of searchResponseGenerator) {
      hitsList.push(...searchResponse.hitsList);
    }
    expect(hitsList.length).toBe(11);
  });

  it("should throw appropriate error for invalid arguments", async () => {
    const invalidGeoPointFilters = () => {
      return search.query({
        filters: [
          {
            geoPoint: {
              longitude: -29.0,
              latitude: 40.0,
              geoLimit: 10,
              // @ts-expect-error - Invalid key
              extra: 1,
            },
          },
        ],
      });
    };
    expect(invalidGeoPointFilters).toThrowError();
    const invalidConceptKeys = () => {
      return search.query({
        filters: [
          {
            concepts: [
              {
                value: 1,
                // @ts-expect-error - Missing required key
                conceptId: "deer",
              },
              {
                name: "dog",
                value: 1,
              },
            ],
          },
        ],
      });
    };
    expect(invalidConceptKeys).toThrowError();
    const invalidConceptValues = () => {
      return search.query({
        filters: [
          {
            concepts: [
              {
                name: "deer",
                value: 2,
              },
              {
                name: "dog",
                value: 1,
              },
            ],
          },
        ],
      });
    };
    expect(invalidConceptValues).toThrowError();
    const incorrectInputTypes = () => {
      return search.query({
        filters: [
          {
            // @ts-expect-error - Invalid input type
            inputTypes: ["imaage"],
          },
        ],
      });
    };
    expect(incorrectInputTypes).toThrowError();
    const invalidSearchFilterKey = () => {
      return search.query({
        filters: [
          {
            // @ts-expect-error - Invalid key
            inputId: "test",
          },
        ],
      });
    };
    expect(invalidSearchFilterKey).toThrowError();
  });

  afterAll(async () => {
    await client.deleteApp({ appId: CREATE_APP_ID });
  });
});
