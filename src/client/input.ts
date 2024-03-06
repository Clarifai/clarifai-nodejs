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

export class Input extends Lister {
  constructor({ authConfig }: { authConfig?: AuthConfig }) {
    super({ authConfig });
  }

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
