import { JavaScriptValue } from "google-protobuf/google/protobuf/struct_pb";
import { Polygon } from "../../utils/types";

export interface TextFeatures {
  imagePath?: undefined;
  geoInfo?: undefined;
  imageBytes?: undefined;
  text: string;
  labels: Array<string | number>;
  id?: number;
  metadata?: Record<string, JavaScriptValue>;
  bboxes?: undefined;
}

export interface VisualClassificationFeatures {
  imagePath: string;
  labels: Array<string | number>;
  geoInfo?: [number, number];
  id?: number;
  metadata?: Record<string, JavaScriptValue>;
  imageBytes?: Buffer;
}

export interface VisualDetectionFeatures {
  imagePath: string;
  labels: Array<string | number>;
  bboxes: Array<Array<number>>;
  geoInfo?: [number, number];
  id?: number;
  metadata?: Record<string, JavaScriptValue>;
  imageBytes?: Buffer;
}

export interface VisualSegmentationFeatures {
  imagePath: string;
  labels: Array<string | number>;
  polygons: Polygon[];
  geoInfo?: [number, number];
  id?: number;
  metadata?: Record<string, JavaScriptValue>;
  imageBytes?: Buffer;
}
