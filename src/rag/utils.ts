import {
  SimpleDirectoryReader,
  DocxReader,
  PDFReader,
  TextFileReader,
  SentenceSplitter,
} from "llamaindex";
import axios from "axios";
import tmp from "tmp";
import * as fs from "fs";
import { logger } from "../utils/logging";

export interface Message {
  role: string;
  content: string;
}

// Custom type for the function response
type DownloadResponse = {
  filePath: string;
  mimeType?: string;
};

// Function to download a file and store it in a temporary file, and return MIME type
async function downloadFileToTemp(url: string): Promise<DownloadResponse> {
  try {
    // Create a temporary file
    const tempFile = tmp.fileSync({ postfix: ".tmp" });
    logger.info(`Temporary file created at: ${tempFile.name}`);

    // Fetch the file using axios
    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream",
    });

    const mimeType = response?.headers?.["Content-Type"]
      ?.toString()
      ?.toLowerCase();

    // Stream the file content to the temporary file
    response.data.pipe(fs.createWriteStream(tempFile.name));

    return new Promise((resolve, reject) => {
      response.data.on("end", () => {
        resolve({ filePath: tempFile.name, mimeType });
      });

      response.data.on("error", (err: Error) => {
        // Clean up the temporary file in case of an error
        tempFile.removeCallback();
        reject(err);
      });
    });
  } catch (error) {
    throw new Error(`Failed to download the file: ${error}`);
  }
}

export function convertMessagesToStr(messages: Message[]): string {
  let finalStr = "";
  for (const msg of messages) {
    if ("role" in msg && "content" in msg) {
      const role = msg.role || "";
      const content = msg.content || "";
      finalStr += `\n\n${role}: ${content}`;
    }
  }
  return finalStr;
}

export function formatAssistantMessage(rawText: string): Message {
  return { role: "assistant", content: rawText };
}

export async function loadDocuments({
  filePath,
  folderPath,
  url,
}: {
  filePath?: string;
  folderPath?: string;
  url?: string;
}) {
  if (!filePath && !folderPath && !url) {
    throw new Error("No input source provided.");
  }

  // Load document from file
  if (filePath) {
    const fileExtension = filePath.slice(filePath.lastIndexOf("."));
    switch (fileExtension) {
      case ".pdf":
        return await new PDFReader().loadData(filePath);
      case ".docx":
        return await new DocxReader().loadData(filePath);
      case ".txt":
        return await new TextFileReader().loadData(filePath);
      default:
        throw new Error(
          "Unsupported file type. Only .pdf, .docx, and .txt files are supported.",
        );
    }
  }

  // Load all documents from a folder
  if (folderPath) {
    const reader = new SimpleDirectoryReader();
    return await reader.loadData({
      directoryPath: folderPath,
      fileExtToReader: {
        pdf: new PDFReader(),
        docx: new DocxReader(),
        txt: new TextFileReader(),
      },
    });
  }

  // Load document from a URL
  if (url) {
    const downloadResponse = await downloadFileToTemp(url);
    let { mimeType: contentType } = downloadResponse;
    const { filePath } = downloadResponse;

    if (!contentType) {
      contentType = url.split(".").pop()?.toLowerCase() ?? "";
    }

    if (contentType === "txt" || /text\/plain/.test(contentType)) {
      return await new TextFileReader().loadData(filePath);
    } else if (
      contentType === "docx" ||
      /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/.test(
        contentType,
      )
    ) {
      return await new DocxReader().loadData(filePath);
    } else if (contentType === "pdf" || /application\/pdf/.test(contentType)) {
      return await new PDFReader().loadData(filePath);
    }
  }

  throw new Error("No documents loaded.");
}

export function splitDocument({
  text,
  chunkSize,
  chunkOverlap,
  options = {},
}: {
  text: string;
  chunkSize: number;
  chunkOverlap: number;
  options?: Omit<
    NonNullable<ConstructorParameters<typeof SentenceSplitter>[0]>,
    "chunkSize" | "chunkOverlap"
  >;
}): string[] {
  const textParser = new SentenceSplitter({
    ...options,
    chunkSize,
    chunkOverlap,
  });
  const textChunks = textParser.splitText(text);
  return textChunks;
}
