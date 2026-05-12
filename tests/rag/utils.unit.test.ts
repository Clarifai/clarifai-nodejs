import { describe, expect, it, vi } from "vitest";
import path from "path";
import { Readable } from "stream";
import {
  convertMessagesToStr,
  formatAssistantMessage,
  loadDocuments,
  splitDocument,
} from "../../src/rag/utils";
import axios from "axios";

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    ...actual,
    default: vi.fn(actual.default),
  };
});

const mockedAxios = axios as unknown as ReturnType<typeof vi.fn>;
const FIXTURES_DIR = path.resolve(__dirname, "fixtures");
const ASSETS_DIR = path.resolve(__dirname, "../assets");

describe("convertMessagesToStr", () => {
  it("should concatenate messages with role and content", () => {
    const messages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ];
    const result = convertMessagesToStr(messages);
    expect(result).toBe("\n\nuser: Hello\n\nassistant: Hi there");
  });

  it("should handle empty messages array", () => {
    expect(convertMessagesToStr([])).toBe("");
  });

  it("should handle messages with empty role or content", () => {
    const messages = [{ role: "", content: "" }];
    const result = convertMessagesToStr(messages);
    expect(result).toBe("\n\n: ");
  });

  it("should handle a single message", () => {
    const messages = [{ role: "user", content: "test" }];
    const result = convertMessagesToStr(messages);
    expect(result).toBe("\n\nuser: test");
  });
});

describe("formatAssistantMessage", () => {
  it("should wrap text in an assistant message", () => {
    const result = formatAssistantMessage("Hello world");
    expect(result).toEqual({ role: "assistant", content: "Hello world" });
  });

  it("should handle empty string", () => {
    const result = formatAssistantMessage("");
    expect(result).toEqual({ role: "assistant", content: "" });
  });
});

describe("splitDocument", () => {
  it("should split text into chunks", () => {
    const sentences = Array.from(
      { length: 50 },
      (_, i) => `This is sentence number ${i + 1}.`,
    );
    const longText = sentences.join(" ");
    const chunks = splitDocument({
      text: longText,
      chunkSize: 50,
      chunkOverlap: 10,
    });
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(typeof chunk).toBe("string");
      expect(chunk.length).toBeGreaterThan(0);
    }
  });

  it("should return single chunk for short text", () => {
    const chunks = splitDocument({
      text: "Short text.",
      chunkSize: 1024,
      chunkOverlap: 200,
    });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("Short text.");
  });

  it("should handle empty text", () => {
    const chunks = splitDocument({
      text: "",
      chunkSize: 1024,
      chunkOverlap: 200,
    });
    const nonEmpty = chunks.filter((c) => c.length > 0);
    expect(nonEmpty).toHaveLength(0);
  });
});

describe("loadDocuments", () => {
  it("should load a .txt file", async () => {
    const docs = await loadDocuments({
      filePath: path.join(FIXTURES_DIR, "sample.txt"),
    });
    expect(docs).toBeDefined();
    expect(docs!.length).toBeGreaterThan(0);
    expect(docs![0].text).toContain("smartphone");
  });

  it("should throw when no input source is provided", async () => {
    await expect(loadDocuments({})).rejects.toThrow("No input source provided");
  });

  it("should throw for unsupported file types", async () => {
    await expect(
      loadDocuments({ filePath: path.join(ASSETS_DIR, "red-truck.png") }),
    ).rejects.toThrow("Unsupported file type");
  });

  it("should load documents from a folder", async () => {
    const docs = await loadDocuments({ folderPath: FIXTURES_DIR });
    expect(docs).toBeDefined();
    expect(docs!.length).toBeGreaterThan(0);
  });

  it("should load a document from a URL", async () => {
    const content = "Hello from a URL download.";
    const dataStream = new Readable({
      read() {
        this.push(content);
        this.push(null);
      },
    });

    mockedAxios.mockResolvedValueOnce({
      headers: { "Content-Type": "text/plain" },
      data: dataStream,
    });

    const docs = await loadDocuments({
      url: "https://example.com/sample.txt",
    });
    expect(docs).toBeDefined();
    expect(docs!.length).toBeGreaterThan(0);
    expect(docs![0].text).toContain("Hello from a URL download");
  });
});
