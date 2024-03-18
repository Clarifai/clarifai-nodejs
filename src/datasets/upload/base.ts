import {
  Annotation,
  Input,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import {
  TextFeatures,
  VisualClassificationFeatures,
  VisualDetectionFeatures,
  VisualSegmentationFeatures,
} from "./features";

type OutputFeaturesType =
  | TextFeatures
  | VisualClassificationFeatures
  | VisualDetectionFeatures
  | VisualSegmentationFeatures;

export abstract class ClarifaiDataLoader {
  abstract get task(): string;
  abstract loadData(): void;
  abstract get length(): number;
  abstract getItem(index: number): OutputFeaturesType;
}

export abstract class ClarifaiDataset {
  protected dataGenerator: ClarifaiDataLoader;
  protected datasetId: string;

  constructor({
    dataGenerator,
    datasetId,
  }: {
    dataGenerator: ClarifaiDataLoader;
    datasetId: string;
  }) {
    this.dataGenerator = dataGenerator;
    this.datasetId = datasetId;
  }

  abstract get length(): number;

  protected abstract toList(inputProtos: Iterable<unknown>): unknown[];

  protected abstract extractProtos(_args: {
    batchInputIds: string[];
  }): [Input[], Annotation[]];

  abstract getProtos(_inputIds: number[]): [Input[], Annotation[]];
}
