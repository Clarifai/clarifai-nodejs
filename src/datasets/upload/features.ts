import { JavaScriptValue } from "google-protobuf/google/protobuf/struct_pb";

export interface TextFeatures {
  text: string;
  labels: Array<string | number>;
  id?: number;
  metadata?: Record<string, JavaScriptValue>;
}

export interface VisualClassificationFeatures {
  image_path: string;
  labels: Array<string | number>;
  geo_info?: [number, number];
  id?: number;
  metadata?: Record<string, JavaScriptValue>;
  image_bytes?: Buffer;
}

export interface VisualDetectionFeatures {
  image_path: string;
  labels: Array<string | number>;
  bboxes: Array<Array<number>>;
  geo_info?: [number, number];
  id?: number;
  metadata?: Record<string, JavaScriptValue>;
  image_bytes?: Buffer;
}

export interface VisualSegmentationFeatures {
  image_path: string;
  labels: Array<string | number>;
  polygons: Array<Array<Array<number>>>;
  geo_info?: [number, number];
  id?: number;
  metadata?: Record<string, JavaScriptValue>;
  image_bytes?: Buffer;
}
