import {
  Annotation,
  Audio,
  BoundingBox,
  Concept,
  Data,
  Geo,
  GeoPoint,
  Input as GrpcInput,
  Image,
  Point,
  Polygon,
  Region,
  RegionInfo,
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
import {
  CancelInputsAddJobRequest,
  DeleteInputsRequest,
  GetInputsAddJobRequest,
  ListInputsRequest,
  PatchInputsRequest,
  PostAnnotationsRequest,
  PostInputsRequest,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import { BackoffIterator, promisifyGrpcCall } from "../utils/misc";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
import os from "os";
import chunk from "lodash/chunk";
import { Status } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_pb";
import cliProgress from "cli-progress";
import async from "async";
import { MAX_RETRIES } from "../constants/dataset";

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
  private numOfWorkers: number = Math.min(os.cpus().length, 10);

  /**
   * Initializes an input object.
   *
   * @param params - The parameters for the Input object.
   * @param params.userId - A user ID for authentication.
   * @param params.appId - An app ID for the application to interact with.
   * @param params.baseUrl - Base API url. Default "https://api.clarifai.com"
   * @param params.pat - A personal access token for authentication. Can be set as env var CLARIFAI_PAT
   * @param params.token - A session token for authentication. Accepts either a session token or a pat. Can be set as env var CLARIFAI_SESSION_TOKEN
   *
   * @includeExample examples/input/index.ts
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
   * @includeExample examples/input/getInputFromBytes.ts
   */
  static getInputFromBytes({
    inputId,
    imageBytes = null,
    videoBytes = null,
    audioBytes = null,
    textBytes = null,
    datasetId = null,
    geoInfo = null,
    labels = null,
    metadata = null,
  }: {
    inputId: string;
    imageBytes?: Uint8Array | null;
    videoBytes?: Uint8Array | null;
    audioBytes?: Uint8Array | null;
    textBytes?: Uint8Array | null;
    datasetId?: string | null;
    geoInfo?: GeoPoint.AsObject | null;
    labels?: string[] | null;
    metadata?: Record<string, JavaScriptValue> | null;
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
      geoInfo,
      labels,
      metadata,
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
   * @includeExample examples/input/getInputFromFile.ts
   */
  static getInputFromFile({
    inputId,
    imageFile = null,
    videoFile = null,
    audioFile = null,
    textFile = null,
    datasetId = null,
    geoInfo = null,
    labels = null,
    metadata = null,
  }: {
    inputId: string;
    imageFile?: string | null;
    videoFile?: string | null;
    audioFile?: string | null;
    textFile?: string | null;
    datasetId?: string | null;
    geoInfo?: GeoPoint.AsObject | null;
    labels?: string[] | null;
    metadata?: Record<string, JavaScriptValue> | null;
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
      geoInfo,
      labels,
      metadata,
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
   * @includeExample examples/input/getInputFromUrl.ts
   */
  static getInputFromUrl({
    inputId,
    imageUrl = null,
    videoUrl = null,
    audioUrl = null,
    textUrl = null,
    datasetId = null,
    geoInfo = null,
    labels = null,
    metadata = null,
  }: {
    inputId: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    audioUrl?: string | null;
    textUrl?: string | null;
    datasetId?: string | null;
    geoInfo?: GeoPoint.AsObject | null;
    labels?: string[] | null;
    metadata?: Record<string, JavaScriptValue> | null;
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
    const concepts =
      labels?.map((_label) => {
        return new Concept()
          .setId(`id-${_label.replace(/\s/g, "")}`)
          .setName(_label)
          .setValue(1);
      }) ?? [];
    const metadataStruct = metadata
      ? Struct.fromJavaScript(metadata)
      : undefined;

    const input = new GrpcInput().setId(inputId).setData(
      new Data()
        .setImage(imagePb ? imagePb : undefined)
        .setVideo(videoPb ? videoPb : undefined)
        .setAudio(audioPb ? audioPb : undefined)
        .setText(textPb ? textPb : undefined)
        .setGeo(
          geoInfo
            ? new Geo().setGeoPoint(
                new GeoPoint()
                  .setLatitude(geoInfo.latitude)
                  .setLongitude(geoInfo.longitude),
              )
            : undefined,
        )
        .setConceptsList(concepts)
        .setMetadata(metadataStruct),
    );
    if (datasetId) {
      input.setDatasetIdsList([datasetId]);
    }
    return input;
  }

  /**
   * Upload image inputs from folder.
   *
   * @param folderPath - The path to the folder containing the images.
   * @param datasetId - The dataset ID for the dataset to add the input to.
   * @param labels - A boolean indicating whether to use the folder name as a label.
   *
   * @includeExample examples/input/getImageInputsFromFolder.ts
   */
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
   * @includeExample examples/input/getTextInput.ts
   */
  static getTextInput({
    inputId,
    rawText,
    datasetId = null,
    geoInfo = null,
    labels = null,
    metadata = null,
  }: {
    inputId: string;
    rawText: string;
    datasetId?: string | null;
    geoInfo?: GeoPoint.AsObject | null;
    labels?: string[] | null;
    metadata?: Record<string, JavaScriptValue> | null;
  }): GrpcInput {
    const textPb = rawText ? { raw: rawText } : null;
    return this.getProto({
      inputId,
      datasetId,
      textPb,
      geoInfo,
      labels,
      metadata,
    });
  }

  /**
   * Create input proto for text and image from bytes or url
   *
   * @param inputId - The input ID for the input to create.
   * @param rawText - The raw text input.
   * @param datasetId - The dataset ID for the dataset to add the input to.
   * @param textBytes - The bytes for the text as `Uint8Array` or `Buffer`.
   * @param imageUrl - The URL for the image.
   * @param imageBytes - The bytes for the image as `Uint8Array` or `Buffer`.
   * @returns - An Input object for the specified input ID.
   */
  static getMultimodalInput({
    inputId,
    rawText = null,
    textBytes = null,
    imageUrl = null,
    imageBytes = null,
    datasetId = null,
    labels = null,
  }: {
    inputId: string;
    rawText?: string | null;
    textBytes?: Uint8Array | null;
    imageUrl?: string | null;
    imageBytes?: Uint8Array | null;
    datasetId?: string | null;
    labels?: string[] | null;
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
      labels,
    });
  }

  /**
   * Create Input proto from CSV File. Supported columns are:
   * 'inputid', 'input', 'concepts', 'metadata', 'geopoints'
   *
   * @param csvPath - The path to the CSV file.
   * @param inputType - The type of input to create. Can be "text", "image", "video", or "audio".
   * @param csvType - The type of CSV file. Can be "raw", "url", or "file".
   * @param datasetId - The dataset ID for the dataset to add the input to.
   * @param labels - A boolean indicating whether to generate labels from concepts list.
   *
   * @returns - An array of Input objects for the specified input ID.
   */
  static async getInputsFromCsv({
    csvPath,
    inputType = "text",
    csvType = "raw",
    datasetId = null,
    labels = true,
  }: {
    csvPath: string;
    inputType: "image" | "text" | "video" | "audio";
    csvType: "raw" | "url" | "file";
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

  static getTextInputsFromFolder({
    folderPath,
    datasetId = null,
    labels = false,
  }: {
    folderPath: string;
    datasetId: string | null;
    labels: boolean;
  }): GrpcInput[] {
    const inputProtos: GrpcInput[] = [];
    const labelList = labels ? [folderPath.split("/").pop()!] : null;
    const files = fs.readdirSync(folderPath);
    for (const filename of files) {
      if (filename.split(".").pop() !== "txt") {
        continue;
      }
      const inputId = filename.split(".")[0];
      const rawText = fs.readFileSync(path.join(folderPath, filename), "utf8");
      const textPb = { raw: rawText };
      inputProtos.push(
        Input.getProto({
          inputId,
          datasetId,
          textPb,
          labels: labelList,
        }),
      );
    }
    return inputProtos;
  }

  static getBboxProto({
    inputId,
    label,
    bbox,
  }: {
    inputId: string;
    label: string;
    bbox: number[];
  }): Annotation {
    const bboxSchema = z.array(z.number()).length(4);
    try {
      bboxSchema.parse(bbox);
    } catch {
      throw new Error("bbox must be an array of coordinates");
    }
    const [xMin, yMin, xMax, yMax] = bbox;
    const inputAnnotProto = new Annotation().setInputId(inputId).setData(
      new Data().setRegionsList([
        new Region()
          .setRegionInfo(
            new RegionInfo().setBoundingBox(
              new BoundingBox()
                .setTopRow(yMin)
                .setLeftCol(xMin)
                .setBottomRow(yMax)
                .setRightCol(xMax),
            ),
          )
          .setData(
            new Data().setConceptsList([
              new Concept()
                .setId(`id-${label.replace(/\s/g, "")}`)
                .setName(label)
                .setValue(1),
            ]),
          ),
      ]),
    );
    return inputAnnotProto;
  }

  static getMaskProto({
    inputId,
    label,
    polygons,
  }: {
    inputId: string;
    label: string;
    polygons: number[][][];
  }): Annotation {
    const polygonsSchema = z.array(z.array(z.array(z.number())));
    try {
      polygonsSchema.parse(polygons);
    } catch {
      throw new Error("polygons must be a list of points");
    }
    const regions = polygons.map((points) => {
      return new Region()
        .setRegionInfo(
          new RegionInfo().setPolygon(
            new Polygon().setPointsList(
              points.map((point) => {
                return new Point()
                  .setRow(point[1])
                  .setCol(point[0])
                  .setVisibility(Point.Visibility["VISIBLE"]);
              }),
            ),
          ),
        )
        .setData(
          new Data().setConceptsList([
            new Concept()
              .setId(`id-${label.replace(/\s/g, "")}`)
              .setName(label)
              .setValue(1),
          ]),
        );
    });
    const inputMaskProto = new Annotation()
      .setInputId(inputId)
      .setData(new Data().setRegionsList(regions));
    return inputMaskProto;
  }

  async uploadInputs({
    inputs,
    showLog = true,
  }: {
    inputs: GrpcInput[];
    showLog?: boolean;
  }): Promise<string> {
    if (!Array.isArray(inputs)) {
      throw new Error("inputs must be an array of Input objects");
    }
    const inputJobId = uuid(); // generate a unique id for this job
    const request = new PostInputsRequest()
      .setUserAppId(this.userAppId)
      .setInputsList(inputs)
      .setInputsAddJobId(inputJobId);

    const postInputs = promisifyGrpcCall(
      this.STUB.client.postInputs,
      this.STUB.client,
    );

    const response = await this.grpcRequest(postInputs, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      if (showLog) {
        console.warn(responseObject.status?.description);
      }
      throw new Error(
        `Inputs upload failed with response ${responseObject.status?.description}`,
      );
    } else {
      if (showLog) {
        console.info(
          "\nInputs Uploaded\n%s",
          responseObject.status?.description,
        );
      }
    }
    return inputJobId;
  }

  uploadFromUrl({
    inputId,
    imageUrl = null,
    videoUrl = null,
    audioUrl = null,
    textUrl = null,
    datasetId = null,
    geoInfo = null,
    labels = null,
    metadata = null,
  }: {
    inputId: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    audioUrl?: string | null;
    textUrl?: string | null;
    datasetId?: string | null;
    geoInfo?: GeoPoint.AsObject | null;
    labels?: string[] | null;
    metadata?: Record<string, JavaScriptValue> | null;
  }): Promise<string> {
    const inputPb = Input.getInputFromUrl({
      inputId,
      imageUrl,
      videoUrl,
      audioUrl,
      textUrl,
      datasetId,
      geoInfo,
      labels,
      metadata,
    });
    return this.uploadInputs({ inputs: [inputPb] });
  }

  uploadFromFile({
    inputId,
    imageFile = null,
    videoFile = null,
    audioFile = null,
    textFile = null,
    datasetId = null,
    geoInfo = null,
    labels = null,
    metadata = null,
  }: {
    inputId: string;
    imageFile?: string | null;
    videoFile?: string | null;
    audioFile?: string | null;
    textFile?: string | null;
    datasetId?: string | null;
    geoInfo?: GeoPoint.AsObject | null;
    labels?: string[] | null;
    metadata?: Record<string, JavaScriptValue> | null;
  }): Promise<string> {
    const inputProto = Input.getInputFromFile({
      inputId,
      imageFile,
      videoFile,
      audioFile,
      textFile,
      datasetId,
      geoInfo,
      labels,
      metadata,
    });
    return this.uploadInputs({ inputs: [inputProto] });
  }

  uploadFromBytes({
    inputId,
    imageBytes = null,
    videoBytes = null,
    audioBytes = null,
    textBytes = null,
    datasetId = null,
    geoInfo = null,
    labels = null,
    metadata = null,
  }: {
    inputId: string;
    imageBytes?: Uint8Array | null;
    videoBytes?: Uint8Array | null;
    audioBytes?: Uint8Array | null;
    textBytes?: Uint8Array | null;
    datasetId?: string | null;
    geoInfo?: GeoPoint.AsObject | null;
    labels?: string[] | null;
    metadata?: Record<string, JavaScriptValue> | null;
  }): Promise<string> {
    const inputProto = Input.getInputFromBytes({
      inputId,
      imageBytes,
      videoBytes,
      audioBytes,
      textBytes,
      datasetId,
      geoInfo,
      labels,
      metadata,
    });
    return this.uploadInputs({ inputs: [inputProto] });
  }

  uploadText({
    inputId,
    rawText,
    datasetId = null,
  }: {
    inputId: string;
    rawText: string;
    datasetId?: string | null;
  }): Promise<string> {
    const inputPb = Input.getProto({
      inputId,
      datasetId,
      textPb: { raw: rawText },
    });
    return this.uploadInputs({ inputs: [inputPb] });
  }

  async patchInputs({
    inputs,
    action = "merge",
  }: {
    inputs: GrpcInput[];
    action?: string;
  }): Promise<string> {
    if (!Array.isArray(inputs)) {
      throw new Error("inputs must be an array of Input objects");
    }
    const requestId = uuid(); // generate a unique id for this job
    const request = new PatchInputsRequest()
      .setUserAppId(this.userAppId)
      .setInputsList(inputs)
      .setAction(action);
    const patchInputs = promisifyGrpcCall(
      this.STUB.client.patchInputs,
      this.STUB.client,
    );
    const response = await this.grpcRequest(patchInputs, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      console.warn(
        `Patch inputs failed, status: ${responseObject.status?.description}`,
      );
      throw Error(
        `Patch inputs failed, status: ${responseObject.status?.description}`,
      );
    }
    console.info(
      "\nPatch Inputs Successful\n%s",
      responseObject.status?.description,
    );
    return requestId;
  }

  async uploadAnnotations({
    batchAnnot,
    showLog = true,
  }: {
    batchAnnot: Annotation[];
    showLog?: boolean;
  }): Promise<Annotation[]> {
    const retryUpload: Annotation[] = []; // those that fail to upload are stored for retries
    const request = new PostAnnotationsRequest()
      .setUserAppId(this.userAppId)
      .setAnnotationsList(batchAnnot);

    const postAnnotations = promisifyGrpcCall(
      this.STUB.client.postAnnotations,
      this.STUB.client,
    );

    const response = await this.grpcRequest(postAnnotations, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      console.warn(
        `Post annotations failed, status: ${responseObject.status?.description}`,
      );
      retryUpload.push(...batchAnnot);
    } else {
      if (showLog) {
        console.info("\nAnnotations Uploaded\n%s", responseObject.status);
      }
    }
    return retryUpload;
  }

  bulkUpload({
    inputs,
    batchSize: providedBatchSize = 128,
  }: {
    inputs: GrpcInput[];
    batchSize: number;
  }) {
    const batchSize = Math.min(128, providedBatchSize);
    const chunkedInputs = chunk(inputs, batchSize);

    const progressBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic,
    );

    progressBar.start(chunkedInputs.length, 0);

    async.mapLimit(
      chunkedInputs,
      this.numOfWorkers,
      (batchInputs, callback) => {
        this.uploadBatch({ inputs: batchInputs })
          .then((failedInputs) => {
            this.retryUploads({
              failedInputs,
            }).finally(() => {
              progressBar.increment();
              callback(null, failedInputs);
            });
          })
          .catch((err) => {
            callback(err);
          });
      },
      (err) => {
        if (err) {
          console.error("Error processing batches", err);
          return;
        }
        progressBar.stop();
        console.log("All inputs processed");
      },
    );
  }

  private async uploadBatch({
    inputs,
  }: {
    inputs: GrpcInput[];
  }): Promise<GrpcInput[]> {
    const inputJobId = await this.uploadInputs({ inputs, showLog: false });
    await this.waitForInputs({ inputJobId });
    const failedInputs = await this.deleteFailedInputs({ inputs });
    return failedInputs;
  }

  private async waitForInputs({
    inputJobId,
  }: {
    inputJobId: string;
  }): Promise<boolean> {
    const backoffIterator = new BackoffIterator({
      count: 10,
    });
    let maxRetries = 10;
    const startTime = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const getInputsAddJobRequest = new GetInputsAddJobRequest()
        .setUserAppId(this.userAppId)
        .setId(inputJobId);

      const getInputsAddJob = promisifyGrpcCall(
        this.STUB.client.getInputsAddJob,
        this.STUB.client,
      );

      const response = await this.grpcRequest(
        getInputsAddJob,
        getInputsAddJobRequest,
      );

      if (Date.now() - startTime > 60 * 30 || maxRetries === 0) {
        const cancelInputsAddJobRequest = new CancelInputsAddJobRequest()
          .setUserAppId(this.userAppId)
          .setId(inputJobId);

        const cancelInputsAddJob = promisifyGrpcCall(
          this.STUB.client.cancelInputsAddJob,
          this.STUB.client,
        );

        // 30 minutes timeout
        await this.grpcRequest(cancelInputsAddJob, cancelInputsAddJobRequest); // Cancel Job
        return false;
      }

      const responseObject = response.toObject();

      if (responseObject.status?.code !== StatusCode.SUCCESS) {
        maxRetries -= 1;
        console.warn(
          `Get input job failed, status: ${responseObject.status?.description}\n`,
        );
        continue;
      }
      if (
        responseObject.inputsAddJob?.progress?.inProgressCount === 0 &&
        responseObject.inputsAddJob.progress.pendingCount === 0
      ) {
        return true;
      } else {
        await new Promise((resolve) =>
          setTimeout(resolve, backoffIterator.next().value),
        );
      }
    }
  }

  private async deleteFailedInputs({
    inputs,
  }: {
    inputs: GrpcInput[];
  }): Promise<GrpcInput[]> {
    const inputIds = inputs.map((input) => input.getId());
    const successStatus = new Status().setCode(
      StatusCode.INPUT_DOWNLOAD_SUCCESS, // Status code for successful download
    );
    const request = new ListInputsRequest();
    request.setIdsList(inputIds);
    request.setPerPage(inputIds.length);
    request.setUserAppId(this.userAppId);
    request.setStatus(successStatus);

    const listInputs = promisifyGrpcCall(
      this.STUB.client.listInputs,
      this.STUB.client,
    );

    const response = await this.grpcRequest(listInputs, request);
    const responseObject = response.toObject();
    const successInputs = responseObject.inputsList || [];

    const successInputIds = successInputs.map((input) => input.id);
    const failedInputs = inputs.filter(
      (input) => !successInputIds.includes(input.getId()),
    );

    const deleteInputs = promisifyGrpcCall(
      this.STUB.client.deleteInputs,
      this.STUB.client,
    );

    const deleteInputsRequest = new DeleteInputsRequest()
      .setUserAppId(this.userAppId)
      .setIdsList(failedInputs.map((input) => input.getId()));

    // Delete failed inputs
    await this.grpcRequest(deleteInputs, deleteInputsRequest);

    return failedInputs;
  }

  private async retryUploads({
    failedInputs,
  }: {
    failedInputs: GrpcInput[];
  }): Promise<void> {
    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      if (failedInputs.length > 0) {
        console.log(
          `Retrying upload for ${failedInputs.length} Failed inputs..\n`,
        );
        failedInputs = await this.uploadBatch({ inputs: failedInputs });
      }
    }
    console.log(`Failed to upload ${failedInputs.length} inputs..\n`);
  }
}
