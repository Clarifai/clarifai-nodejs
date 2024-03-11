import {
  Audio,
  Data,
  Input as GrpcInput,
  Image,
  Text,
  Video,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { AuthConfig } from "../utils/types";
import { Lister } from "./lister";
import { Buffer } from "buffer";
import fs from "fs";

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
  }: {
    inputId: string;
    datasetId?: string | null;
    imagePb?: { base64: string } | null;
    videoPb?: { base64: string } | null;
    audioPb?: { base64: string } | null;
    textPb?: { raw: string } | null;
  }): GrpcInput {
    if (datasetId) {
      return new GrpcInput()
        .setId(inputId)
        .setDatasetIdsList([datasetId])
        .setData(
          new Data()
            .setImage(
              imagePb ? new Image().setBase64(imagePb.base64) : undefined,
            )
            .setVideo(
              videoPb ? new Video().setBase64(videoPb.base64) : undefined,
            )
            .setAudio(
              audioPb ? new Audio().setBase64(audioPb.base64) : undefined,
            )
            .setText(textPb ? new Text().setRaw(textPb.raw) : undefined),
        );
    } else {
      return new GrpcInput().setId(inputId).setData(
        new Data()
          .setImage(imagePb ? new Image().setBase64(imagePb.base64) : undefined)
          .setVideo(videoPb ? new Video().setBase64(videoPb.base64) : undefined)
          .setAudio(audioPb ? new Audio().setBase64(audioPb.base64) : undefined)
          .setText(textPb ? new Text().setRaw(textPb.raw) : undefined),
      );
    }
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
}
