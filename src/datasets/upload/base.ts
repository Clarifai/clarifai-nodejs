import resources_pb from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
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

export abstract class ClarifaiDataset<T extends ClarifaiDataLoader> {
  protected dataGenerator: T;
  protected datasetId: string;
  protected allInputIds: Record<string, unknown> = {};

  constructor({
    dataGenerator,
    datasetId,
  }: {
    dataGenerator: T;
    datasetId: string;
  }) {
    this.dataGenerator = dataGenerator;
    this.datasetId = datasetId;
  }

  get length(): number {
    return this.dataGenerator.length;
  }

  // TODO: Plan for implementation
  // protected abstract toList(inputProtos: Iterable<unknown>): unknown[];

  protected abstract extractProtos(_args: {
    batchInputIds: string[];
  }): [resources_pb.Input[], resources_pb.Annotation[]];

  // TODO: Plan for implementation
  // abstract getProtos(_inputIds: number[]): [Input[], Annotation[]];
}
