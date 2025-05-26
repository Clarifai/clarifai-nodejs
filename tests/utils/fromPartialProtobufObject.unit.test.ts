import {
  LicenseType,
  Workflow,
  Model,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { describe, expect, it } from "vitest";
import {
  Subset,
  fromPartialProtobufObject,
} from "../../src/utils/fromPartialProtobufObject";

describe("fromPartialProtobufObject", () => {
  it("should return a valid GRPC compatible protobuf object", () => {
    const workflow: Workflow.AsObject = {
      id: "General",
      appId: "test_workflow_create_delete_app_test-app-200",
      createdAt: {
        seconds: 1711433258,
        nanos: 106503714,
      },
      nodesList: [
        {
          id: "general-v1.5-concept",
          model: {
            id: "general-image-recognition",
            name: "Image Recognition",
            appId: "main",
            modelVersion: {
              id: "aa7f35c01e0642fda5cf400f543e7c40",
              activeConceptCount: 0,
              totalInputCount: 0,
              description: "",
              appId: "",
              userId: "",
              license: "",
              trainLog: "",
              methodSignaturesList: [],
            },
            displayName: "",
            userId: "clarifai",
            modelTypeId: "visual-classifier",
            task: "",
            description: "",
            notes: "",
            toolkitsList: [],
            useCasesList: [],
            languagesList: [],
            languagesFullList: [],
            checkConsentsList: [],
            isStarred: false,
            starCount: 0,
            licenseType: LicenseType.UNKNOWN_LICENSE_TYPE,
            source: Model.Source.UNKNOWN_SOURCE,
            creator: "",
            versionCount: 0,
            billingType: Model.BillingType.UNKNOWN,
          },
          nodeInputsList: [],
          suppressOutput: false,
          outputInfoOverride: {
            message: "",
            paramsSpecsList: [],
          },
        },
        {
          id: "general-v1.5-embed",
          model: {
            id: "general-image-embedding",
            name: "general",
            appId: "main",
            modelVersion: {
              id: "bb186755eda04f9cbb6fe32e816be104",
              activeConceptCount: 0,
              totalInputCount: 0,
              description: "",
              appId: "",
              userId: "",
              license: "",
              trainLog: "",
              methodSignaturesList: [],
            },
            displayName: "",
            userId: "clarifai",
            modelTypeId: "visual-embedder",
            task: "",
            description: "",
            notes: "",
            toolkitsList: [],
            useCasesList: [],
            languagesList: [],
            languagesFullList: [],
            checkConsentsList: [],
            isStarred: false,
            starCount: 0,
            licenseType: LicenseType.UNKNOWN_LICENSE_TYPE,
            source: Model.Source.UNKNOWN_SOURCE,
            creator: "",
            versionCount: 0,
            billingType: Model.BillingType.UNKNOWN,
          },
          nodeInputsList: [],
          suppressOutput: false,
          outputInfoOverride: {
            message: "",
            paramsSpecsList: [],
          },
        },
        {
          id: "general-v1.5-cluster",
          model: {
            id: "general-clusterering",
            name: "general",
            appId: "main",
            modelVersion: {
              id: "cc2074cff6dc4c02b6f4e1b8606dcb54",
              activeConceptCount: 0,
              totalInputCount: 0,
              description: "",
              appId: "",
              userId: "",
              license: "",
              trainLog: "",
              methodSignaturesList: [],
            },
            displayName: "",
            userId: "clarifai",
            modelTypeId: "clusterer",
            task: "",
            description: "",
            notes: "",
            toolkitsList: [],
            useCasesList: [],
            languagesList: [],
            languagesFullList: [],
            checkConsentsList: [],
            isStarred: false,
            starCount: 0,
            licenseType: LicenseType.UNKNOWN_LICENSE_TYPE,
            source: Model.Source.UNKNOWN_SOURCE,
            creator: "",
            versionCount: 0,
            billingType: Model.BillingType.UNKNOWN,
          },
          nodeInputsList: [
            {
              nodeId: "general-v1.5-embed",
            },
          ],
          suppressOutput: false,
          outputInfoOverride: {
            message: "",
            paramsSpecsList: [],
          },
        },
      ],
      metadata: {
        fieldsMap: [],
      },
      visibility: {
        gettable: 10,
      },
      userId: "frontend-user",
      modifiedAt: {
        seconds: 1711433258,
        nanos: 106503714,
      },
      version: {
        id: "0745648917c842be9c1daa210f38b8e4",
        workflowId: "",
        nodesList: [],
        appId: "",
        userId: "",
        description: "",
        license: "",
        isDeprecated: false,
      },
      isStarred: false,
      starCount: 0,
      description: "",
      notes: "",
      useCasesList: [],
      checkConsentsList: [],
    };
    const workflowProto = fromPartialProtobufObject(Workflow, workflow);
    expect(workflowProto.getId()).toBe("General");
    expect(workflowProto.getCreatedAt()?.getSeconds()).toBe(1711433258);
    expect(workflowProto.getNodesList().length).toBe(3);
    expect(workflowProto.getNodesList()[0].getId()).toBe(
      "general-v1.5-concept",
    );
    expect(workflowProto.getNodesList()[0].getModel()?.getId()).toBe(
      "general-image-recognition",
    );
    expect(
      workflowProto.getNodesList()[0].getModel()?.getModelVersion()?.getId(),
    ).toBe("aa7f35c01e0642fda5cf400f543e7c40");
    expect(
      workflowProto.getNodesList()[2].getModel()?.getModelVersion()?.getId(),
    ).toBe("cc2074cff6dc4c02b6f4e1b8606dcb54");
    expect(workflowProto.getNodesList()[0].getNodeInputsList()?.length).toBe(0);
    expect(workflowProto.getNodesList()[2].getNodeInputsList()?.length).toBe(1);
    expect(
      workflowProto.getNodesList()[2].getNodeInputsList()?.[0]?.getNodeId(),
    ).toBe("general-v1.5-embed");
    expect(
      workflowProto.getNodesList()[2].getOutputInfoOverride()?.getMessage(),
    ).toBe("");
    expect(
      workflowProto.getMetadata()?.getFieldsMap().getEntryList().length,
    ).toBe(0);
    expect(workflowProto.getVisibility()?.getGettable()).toBe(10);
    expect(workflowProto.getModifiedAt()?.getSeconds()).toBe(1711433258);
    expect(workflowProto.getVersion()?.getId()).toBe(
      "0745648917c842be9c1daa210f38b8e4",
    );
    expect(workflowProto.getVersion()?.getNodesList().length).toBe(0);
    expect(workflowProto.getUseCasesList().length).toBe(0);
  });

  it("should return a valid GRPC compatible protobuf object with empty fields", () => {
    const workflow: Subset<Workflow.AsObject> = {
      id: "General",
      createdAt: {
        seconds: 1711433258,
      },
      nodesList: [
        {
          model: {
            id: "general-image-recognition",
            name: "Image Recognition",
            appId: "main",
            modelVersion: {
              id: "aa7f35c01e0642fda5cf400f543e7c40",
              activeConceptCount: 0,
              totalInputCount: 0,
              description: "",
              license: "",
              trainLog: "",
            },
            displayName: "",
            userId: "clarifai",
            modelTypeId: "visual-classifier",
            task: "",
            description: "",
            notes: "",
            toolkitsList: [],
            useCasesList: [],
            languagesList: [],
            languagesFullList: [],
            checkConsentsList: [],
            isStarred: false,
            starCount: 0,
          },
          nodeInputsList: [],
          suppressOutput: false,
          outputInfoOverride: {
            message: "",
            paramsSpecsList: [],
          },
        },
        {
          id: "general-v1.5-embed",
          model: {
            id: "general-image-embedding",
            name: "general",
            appId: "main",
            modelVersion: {
              id: "bb186755eda04f9cbb6fe32e816be104",
              activeConceptCount: 0,
              totalInputCount: 0,
              description: "",
              appId: "",
              userId: "",
              license: "",
              trainLog: "",
            },
            displayName: "",
            userId: "clarifai",
            modelTypeId: "visual-embedder",
            task: "",
            description: "",
            notes: "",
            toolkitsList: [],
            useCasesList: [],
            languagesList: [],
            languagesFullList: [],
            checkConsentsList: [],
            isStarred: false,
            starCount: 0,
          },
          nodeInputsList: [],
          outputInfoOverride: {
            message: "",
            paramsSpecsList: [],
          },
        },
        {
          id: "general-v1.5-cluster",
          model: {
            id: "general-clusterering",
            name: "general",
            appId: "main",
            modelVersion: {
              id: "cc2074cff6dc4c02b6f4e1b8606dcb54",
              activeConceptCount: 0,
              totalInputCount: 0,
              description: "",
              appId: "",
              userId: "",
              license: "",
              trainLog: "",
            },
            displayName: "",
            userId: "clarifai",
            modelTypeId: "clusterer",
            task: "",
            description: "",
            notes: "",
            toolkitsList: [],
            useCasesList: [],
            languagesList: [],
            languagesFullList: [],
            checkConsentsList: [],
            isStarred: false,
            starCount: 0,
          },
          suppressOutput: false,
          outputInfoOverride: {
            message: "",
            paramsSpecsList: [],
          },
        },
      ],
      metadata: {
        fieldsMap: [],
      },
      visibility: {
        gettable: 10,
      },
      userId: "frontend-user",
      modifiedAt: {
        seconds: 1711433258,
        nanos: 106503714,
      },
      version: {
        id: "0745648917c842be9c1daa210f38b8e4",
        workflowId: "",
        nodesList: [],
        appId: "",
        userId: "",
        description: "",
        license: "",
      },
      isStarred: false,
      starCount: 0,
      description: "",
      notes: "",
      useCasesList: [],
      checkConsentsList: [],
    };
    const workflowProto = fromPartialProtobufObject(Workflow, workflow);
    expect(workflowProto.getId()).toBe("General");
    expect(workflowProto.getCreatedAt()?.getSeconds()).toBe(1711433258);
    expect(workflowProto.getNodesList().length).toBe(3);
    expect(workflowProto.getNodesList()[1].getId()).toBe("general-v1.5-embed");
    expect(workflowProto.getNodesList()[0].getModel()?.getId()).toBe(
      "general-image-recognition",
    );
    expect(
      workflowProto.getNodesList()[0].getModel()?.getModelVersion()?.getId(),
    ).toBe("aa7f35c01e0642fda5cf400f543e7c40");
    expect(
      workflowProto.getNodesList()[2].getModel()?.getModelVersion()?.getId(),
    ).toBe("cc2074cff6dc4c02b6f4e1b8606dcb54");
    expect(workflowProto.getNodesList()[0].getNodeInputsList()?.length).toBe(0);
    expect(workflowProto.getNodesList()[2].getNodeInputsList()?.length).toBe(0);
    expect(
      workflowProto.getNodesList()[2].getNodeInputsList()?.[0]?.getNodeId(),
    ).toBeUndefined();
    expect(
      workflowProto.getNodesList()[2].getOutputInfoOverride()?.getMessage(),
    ).toBe("");
    expect(
      workflowProto.getMetadata()?.getFieldsMap().getEntryList().length,
    ).toBe(0);
    expect(workflowProto.getVisibility()?.getGettable()).toBe(10);
    expect(workflowProto.getModifiedAt()?.getSeconds()).toBe(1711433258);
    expect(workflowProto.getVersion()?.getId()).toBe(
      "0745648917c842be9c1daa210f38b8e4",
    );
    expect(workflowProto.getVersion()?.getNodesList().length).toBe(0);
    expect(workflowProto.getUseCasesList().length).toBe(0);
  });
});
