import { afterAll, beforeAll, describe, it, expect } from "vitest";
import path from "path";
import { App, RAG, User } from "../../src/index";
import { Workflow } from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { ClarifaiAuthHelper } from "../../src/client/auth/helper";
import { ClarifaiUrl } from "../../src/urls/helper";

const CREATE_APP_USER_ID = process.env.VITE_CLARIFAI_USER_ID;

const TEXT_FILE_PATH = path.resolve(__dirname, "../assets/sample.txt");

const pat = process.env.VITE_CLARIFAI_PAT;

const PDF_URL = "https://samples.clarifai.com/test_doc.pdf";

describe("Rag", async () => {
  let rag: RAG;
  let app: App;
  let workflow: Workflow.AsObject;
  let workflowUrl: string;
  beforeAll(async () => {
    rag = await RAG.setup({
      authConfig: {
        userId: CREATE_APP_USER_ID,
        pat,
      },
    });
    const promptWorkflowId = rag.promptWorkflow.id;
    const promptAppId = rag.promptWorkflow.appId;
    app = new App({
      authConfig: {
        appId: promptAppId,
        userId: CREATE_APP_USER_ID,
        pat,
      },
    });
    workflow = (await app.workflow({ workflowId: promptWorkflowId }))!;
    workflowUrl = new ClarifaiAuthHelper(
      workflow.userId,
      workflow.appId,
      pat,
    ).clarifaiUrl({
      resourceId: workflow.id,
      resourceType: "workflows",
      versionId: workflow.version?.id,
    });
  });

  it("is Setup as expected", () => {
    expect(workflow.nodesList.length).toBe(2);
  });

  it("should setup RAG from existing workflow", () => {
    const agent = new RAG({
      workflowUrl: workflowUrl as ClarifaiUrl,
      authConfig: {
        pat,
      },
    });
    expect(agent.app.info.id).toBe(app.info.id);
  });

  it("should predict & manage client state", async () => {
    const messages = [{ role: "human", content: "What is 1 + 1?" }];
    const newMessages = await rag.chat({ messages, clientManageState: true });
    expect(newMessages.length).toBe(2);
  }, 10000);

  // TODO: Server side state management is not supported yet - work in progress
  it.skip("should predict & manage state on the server", async () => {
    const messages = [{ role: "human", content: "What is 1 + 1?" }];
    const newMessages = await rag.chat({ messages });
    expect(newMessages.length).toBe(1);
  });

  it("should upload documents by file path", async () => {
    const upload = async () => await rag.upload({ filePath: TEXT_FILE_PATH });
    await expect(upload()).resolves.not.toThrow();
  });

  it("should upload documents by URL", async () => {
    const upload = async () => await rag.upload({ url: PDF_URL });
    await expect(upload()).resolves.not.toThrow();
  });

  afterAll(async () => {
    await new User({
      userId: CREATE_APP_USER_ID,
      appId: app.info.id,
      pat,
    }).deleteApp({ appId: app.info.id });
  });
});
