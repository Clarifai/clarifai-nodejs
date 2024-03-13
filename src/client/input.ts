import {
  Audio,
  Concept,
  Data,
  Geo,
  GeoPoint,
  Input as GrpcInput,
  Image,
  Text,
  Video,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { AuthConfig } from "../utils/types";
import { Lister } from "./lister";
import { Buffer } from "buffer";
import fs from "fs";
import path from "path";
import { z } from "zod";
import {
  JavaScriptValue,
  Struct,
} from "google-protobuf/google/protobuf/struct_pb";
import { parse } from "csv-parse";
import { finished } from "stream/promises";
import { uuid } from "uuidv4";

interface CSVRecord {
  inputid: string;
  input: string;
  concepts: string;
  metadata: string;
  geopoints: string;
}

/**
 * Inputs is a class that provides access to Clarifai API endpoints related to Input information.
 * @noInheritDoc
 */
export class Input extends Lister {
  /**
   * Initializes an input object.
   *
   * @param {Object} params - The parameters for the Input object.
   * @param {string} params.userId - A user ID for authentication.
   * @param {string} params.appId - An app ID for the application to interact with.
   * @param {string} params.baseUrl - Base API url. Default "https://api.clarifai.com"
   * @param {string} params.pat - A personal access token for authentication. Can be set as env var CLARIFAI_PAT
   * @param {string} params.token - A session token for authentication. Accepts either a session token or a pat. Can be set as env var CLARIFAI_SESSION_TOKEN
   */
  constructor({ authConfig }: { authConfig?: AuthConfig }) {
    super({ authConfig });
  }

  /**
   * Create input proto for image data type.
   *
   * @param inputId - The input ID for the input to create.
   * @param datasetId - The dataset ID for the dataset to add the input to.
   * @param imagePb - The image proto to be used for the input.
   * @param videoPb - The video proto to be used for the input.
   * @param audioPb - The audio proto to be used for the input.
   * @param textPb - The text proto to be used for the input.
   * @param geoInfo - A list of longitude and latitude for the geo point.
   * @param labels - A list of labels for the input.
   * @param metadata - A Struct of metadata for the input.
   * @returns - An Input object for the specified input ID.
   */
  private static getProto({
    inputId,
    datasetId = null,
    imagePb = null,
    videoPb = null,
    audioPb = null,
    textPb = null,
    geoInfo = null,
    labels = null,
    metadata = null,
  }: {
    inputId: string;
    datasetId?: string | null;
    imagePb?:
      | { base64: string; url?: undefined }
      | { url: string; base64?: undefined }
      | null;
    videoPb?: { base64: string } | null;
    audioPb?: { base64: string } | null;
    textPb?: { raw: string } | null;
    geoInfo?: GeoPoint.AsObject | null;
    labels?: string[] | null;
    metadata?: Record<string, JavaScriptValue> | null;
  }): GrpcInput {
    const geoInfoSchema = z
      .array(
        z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
      )
      .or(z.null());

    const labelsSchema = z.array(z.string()).or(z.null());

    const metaDataSchema = z.record(z.string(), z.unknown()).or(z.null());

    try {
      geoInfoSchema.parse(geoInfo);
    } catch {
      throw new Error("geoInfo must be a list of longitude and latitude");
    }

    try {
      labelsSchema.parse(labels);
    } catch {
      throw new Error("labels must be a list of strings");
    }

    try {
      metaDataSchema.parse(metadata);
    } catch {
      throw new Error("metadata must be a valid object");
    }

    const metadataStruct = metadata
      ? Struct.fromJavaScript(metadata)
      : undefined;

    const geoPb = geoInfo
      ? new Geo().setGeoPoint(
          new GeoPoint()
            .setLatitude(geoInfo.latitude)
            .setLongitude(geoInfo.longitude),
        )
      : undefined;

    const concepts =
      labels?.map((_label) => {
        return new Concept()
          .setId(`id-${_label.replace(/\s/g, "")}`)
          .setName(_label)
          .setValue(1);
      }) ?? [];

    const input = new GrpcInput().setId(inputId).setData(
      new Data()
        .setImage(
          imagePb
            ? imagePb.base64
              ? new Image().setBase64(imagePb.base64)
              : imagePb.url
                ? new Image().setUrl(imagePb.url)
                : undefined
            : undefined,
        )
        .setVideo(videoPb ? new Video().setBase64(videoPb.base64) : undefined)
        .setAudio(audioPb ? new Audio().setBase64(audioPb.base64) : undefined)
        .setText(textPb ? new Text().setRaw(textPb.raw) : undefined)
        .setGeo(geoPb)
        .setConceptsList(concepts)
        .setMetadata(metadataStruct),
    );
    if (datasetId) {
      input.setDatasetIdsList([datasetId]);
    }
    return input;
  }

  /**
   * Creates an input proto from bytes.
   *
   * @param inputId - The input ID for the input to create.
   * @param imageBytes - The bytes for the image as `Uint8Array` or `null`.
   * @param videoBytes - The bytes for the video as `Uint8Array` or `null`.
   * @param audioBytes - The bytes for the audio as `Uint8Array` or `null`.
   * @param textBytes - The bytes for the text as `Uint8Array` or `null`.
   * @param datasetId - The dataset ID for the dataset to add the input to, can be `null`.
   * @returns An `Input` object for the specified input ID.
   *
   * @example
   * ```typescript
   * import { Input } from 'clarifai-nodejs';
   *
   * const image = new Uint8Array(fs.readFileSync('demo.jpg'));
   * const video = new Uint8Array(fs.readFileSync('demo.mp4'));
   * const inputProto = Inputs.getInputFromBytes({
   *   inputId: 'demo',
   *   imageBytes: image,
   *   videoBytes: video,
   * });
   * ```
   */
  static getInputFromBytes({
    inputId,
    imageBytes = null,
    videoBytes = null,
    audioBytes = null,
    textBytes = null,
    datasetId = null,
  }: {
    inputId: string;
    imageBytes?: Uint8Array | null;
    videoBytes?: Uint8Array | null;
    audioBytes?: Uint8Array | null;
    textBytes?: Uint8Array | null;
    datasetId?: string | null;
  }): GrpcInput {
    if (!(imageBytes || videoBytes || audioBytes || textBytes)) {
      throw new Error(
        "At least one of image_bytes, video_bytes, audio_bytes, text_bytes must be provided.",
      );
    }
    const imagePb = imageBytes
      ? { base64: Buffer.from(imageBytes).toString("base64") }
      : null;
    const videoPb = videoBytes
      ? { base64: Buffer.from(videoBytes).toString("base64") }
      : null;
    const audioPb = audioBytes
      ? { base64: Buffer.from(audioBytes).toString("base64") }
      : null;
    const textPb = textBytes
      ? { raw: Buffer.from(textBytes).toString("utf-8") }
      : null;
    return this.getProto({
      inputId,
      datasetId,
      imagePb,
      videoPb,
      audioPb,
      textPb,
    });
  }

  /**
   * Create input proto from files.
   *
   * @param inputId - The input ID for the input to create.
   * @param imageFile - The file path for the image.
   * @param videoFile - The file path for the video.
   * @param audioFile - The file path for the audio.
   * @param textFile - The file path for the text.
   * @param datasetId - The dataset ID for the dataset to add the input to.
   * @returns - An Input object for the specified input ID.
   *
   * @example
   * ```typescript
   * import { Input } from 'clarifai-nodejs';
   *
   * const inputProto = Input.getInputFromFile({
   *   inputId: 'demo',
   *   imageFile: 'file_path',
   * });
   * ```
   */
  static getInputFromFile({
    inputId,
    imageFile = null,
    videoFile = null,
    audioFile = null,
    textFile = null,
    datasetId = null,
  }: {
    inputId: string;
    imageFile?: string | null;
    videoFile?: string | null;
    audioFile?: string | null;
    textFile?: string | null;
    datasetId?: string | null;
  }): GrpcInput {
    if (!(imageFile || videoFile || audioFile || textFile)) {
      throw new Error(
        "At least one of imageFile, videoFile, audioFile, textFile must be provided.",
      );
    }
    const imagePb = imageFile
      ? { base64: Buffer.from(fs.readFileSync(imageFile)).toString("base64") }
      : null;
    const videoPb = videoFile
      ? { base64: Buffer.from(fs.readFileSync(videoFile)).toString("base64") }
      : null;
    const audioPb = audioFile
      ? { base64: Buffer.from(fs.readFileSync(audioFile)).toString("base64") }
      : null;
    const textPb = textFile
      ? { raw: fs.readFileSync(textFile, "utf-8") }
      : null;
    return this.getProto({
      inputId,
      datasetId,
      imagePb,
      videoPb,
      audioPb,
      textPb,
    });
  }

  /**
   * Upload input from URL.
   *
   * @param inputId - The input ID for the input to create.
   * @param imageUrl - The URL for the image.
   * @param videoUrl - The URL for the video.
   * @param audioUrl - The URL for the audio.
   * @param textUrl - The URL for the text.
   * @param datasetId - The dataset ID for the dataset to add the input to.
   * @returns - Job ID for the upload request.
   *
   * @example
   * ```typescript
   * import { Input } from 'clarifai-nodejs';
   *
   * const inputJobId = Input.uploadFromUrl({
   *   inputId: 'demo',
   *   imageUrl: 'https://samples.clarifai.com/metro-north.jpg',
   * });
   * ```
   */
  static getInputFromUrl({
    inputId,
    imageUrl = null,
    videoUrl = null,
    audioUrl = null,
    textUrl = null,
    datasetId = null,
  }: {
    inputId: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    audioUrl?: string | null;
    textUrl?: string | null;
    datasetId?: string | null;
  }): GrpcInput {
    if (!(imageUrl || videoUrl || audioUrl || textUrl)) {
      throw new Error(
        "At least one of imageUrl, videoUrl, audioUrl, textUrl must be provided.",
      );
    }
    const imagePb = imageUrl ? new Image().setUrl(imageUrl) : null;
    const videoPb = videoUrl ? new Video().setUrl(videoUrl) : null;
    const audioPb = audioUrl ? new Audio().setUrl(audioUrl) : null;
    const textPb = textUrl ? new Text().setUrl(textUrl) : null;
    const input = new GrpcInput().setId(inputId).setData(
      new Data()
        .setImage(imagePb ? imagePb : undefined)
        .setVideo(videoPb ? videoPb : undefined)
        .setAudio(audioPb ? audioPb : undefined)
        .setText(textPb ? textPb : undefined),
    );
    if (datasetId) {
      input.setDatasetIdsList([datasetId]);
    }
    return input;
  }

  static getImageInputsFromFolder({
    folderPath,
    datasetId = null,
    labels = false,
  }: {
    folderPath: string;
    datasetId?: string | null;
    labels?: boolean;
  }): GrpcInput[] {
    const inputProtos: GrpcInput[] = [];
    const folderName = folderPath.split("/").pop()!;
    const labelList = labels ? [folderName] : null;
    fs.readdirSync(folderPath).forEach((filename) => {
      const extension = filename.split(".").pop();
      if (
        extension &&
        ["jpg", "jpeg", "png", "tiff", "webp"].includes(extension.toLowerCase())
      ) {
        const inputId = filename.split(".")[0];
        const imageBytes = fs.readFileSync(path.join(folderPath, filename));
        const imagePb = { base64: Buffer.from(imageBytes).toString("base64") };
        const inputProto = Input.getProto({
          inputId,
          datasetId,
          imagePb,
          labels: labelList,
        });
        inputProtos.push(inputProto);
      }
    });
    return inputProtos;
  }

  /**
   * Create input proto for text data type from raw text.
   *
   * @param inputId - The input ID for the input to create.
   * @param rawText - The raw text input.
   * @param datasetId - The dataset ID for the dataset to add the input to.
   * @returns - An Input object for the specified input ID.
   *
   * @example
   * ```typescript
   * import { Input } from 'clarifai-nodejs';
   *
   * const inputProto = Input.getTextInput({
   *   inputId: 'demo',
   *   rawText: 'This is a test',
   * });
   * ```
   */
  static getTextInput({
    inputId,
    rawText,
    datasetId = null,
  }: {
    inputId: string;
    rawText: string;
    datasetId?: string | null;
  }): GrpcInput {
    const textPb = rawText ? { raw: rawText } : null;
    return this.getProto({
      inputId,
      datasetId,
      textPb,
    });
  }

  static getMultimodalInput({
    inputId,
    rawText = null,
    textBytes = null,
    imageUrl = null,
    imageBytes = null,
    datasetId = null,
  }: {
    inputId: string;
    rawText?: string | null;
    textBytes?: Uint8Array | null;
    imageUrl?: string | null;
    imageBytes?: Uint8Array | null;
    datasetId?: string | null;
  }): GrpcInput {
    if ((imageBytes && imageUrl) || (!imageBytes && !imageUrl)) {
      throw new Error(
        "Please supply only one of imageBytes or imageUrl, and not both.",
      );
    }
    if ((textBytes && rawText) || (!textBytes && !rawText)) {
      throw new Error(
        "Please supply only one of textBytes or rawText, and not both.",
      );
    }

    const imagePb = imageBytes
      ? { base64: Buffer.from(imageBytes).toString("base64") }
      : imageUrl
        ? { url: imageUrl }
        : null;
    const textPb = textBytes
      ? { raw: Buffer.from(textBytes).toString("utf-8") }
      : rawText
        ? { raw: rawText }
        : null;

    return Input.getProto({
      inputId,
      datasetId,
      imagePb,
      textPb,
    });
  }

  static async getInputsFromCsv({
    csvPath,
    inputType = "text",
    csvType = "raw",
    datasetId = null,
    labels = true,
  }: {
    csvPath: string;
    inputType: string;
    csvType: string;
    datasetId?: string | null;
    labels: boolean;
  }): Promise<GrpcInput[]> {
    const inputProtos: GrpcInput[] = [];
    const csvData = await fs.promises.readFile(csvPath, "utf8");
    const parser = parse(csvData, { columns: true });
    const records: Array<CSVRecord> = [];
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        // individual record
        records.push(record);
      }
    });
    await finished(parser);

    for (const record of records) {
      const { inputid, input, concepts, metadata, geopoints, ...otherColumns } =
        record;

      if (Object.keys(otherColumns).length > 0) {
        throw new Error(
          `CSV file may have 'inputid', 'input', 'concepts', 'metadata', 'geopoints' columns. Does not support: '${Object.keys(otherColumns).join(", ")}'`,
        );
      }

      const inputLabels = labels ? concepts.split(",") : null;

      let inputMetadata = null;
      if (metadata) {
        try {
          // TODO: Test CSV parsing of json values with actual test cases
          const metadataDict = JSON.parse(metadata.replace(/'/g, '"'));
          inputMetadata = { fields: metadataDict };
        } catch (error) {
          throw new Error("metadata column in CSV file should be a valid JSON");
        }
      }

      let inputGeoInfo = null;
      if (geopoints) {
        const geoPoints = geopoints.split(",");
        if (geoPoints.length === 2) {
          inputGeoInfo = {
            latitude: parseFloat(geoPoints[0]),
            longitude: parseFloat(geoPoints[1]),
          };
        } else {
          throw new Error(
            "geopoints column in CSV file should have longitude,latitude",
          );
        }
      }

      const inputId = inputid || uuid();
      const text = inputType === "text" ? input : null;
      const image = inputType === "image" ? input : null;
      const video = inputType === "video" ? input : null;
      const audio = inputType === "audio" ? input : null;

      if (csvType === "raw") {
        inputProtos.push(
          Input.getTextInput({
            inputId,
            rawText: text as string,
            datasetId,
            labels: inputLabels,
            metadata: inputMetadata,
            geoInfo: inputGeoInfo,
          }),
        );
      } else if (csvType === "url") {
        inputProtos.push(
          Input.getInputFromUrl({
            inputId,
            imageUrl: image,
            textUrl: text,
            audioUrl: audio,
            videoUrl: video,
            datasetId,
            labels: inputLabels,
            metadata: inputMetadata,
            geoInfo: inputGeoInfo,
          }),
        );
      } else {
        inputProtos.push(
          Input.getInputFromFile({
            inputId,
            imageFile: image,
            textFile: text,
            audioFile: audio,
            videoFile: video,
            datasetId,
            labels: inputLabels,
            metadata: inputMetadata,
            geoInfo: inputGeoInfo,
          }),
        );
      }
    }

    return inputProtos;
  }
}
