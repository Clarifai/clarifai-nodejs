import { describe, it, expect } from "vitest";
import { Workflow } from "../../../src/index";
import path from "path";
import * as fs from "fs";

const CLARIFAI_PAT = import.meta.env.VITE_CLARIFAI_PAT;

describe("Workflow export", () => {
  it("should export workflow", async () => {
    const workflow = new Workflow({
      url: "https://clarifai.com/clarifai/main/workflows/General",
      authConfig: {
        pat: CLARIFAI_PAT,
      },
    });

    await workflow.exportWorkflow(
      path.resolve(__dirname, "./fixtures/export_general.yml"),
    );

    const expectedFile = fs.readFileSync(
      path.resolve(__dirname, "./fixtures/export_general.yml"),
      "utf-8",
    );

    const actualFile = fs.readFileSync(
      path.resolve(__dirname, "./fixtures/general.yml"),
      "utf-8",
    );

    expect(expectedFile).toBe(actualFile);
  });
});
