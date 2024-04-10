import {
  Input as GrpcInput,
  Annotation,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { ClarifaiDataLoader, ClarifaiDataset } from "./base";
import path from "path";
import { uuid } from "uuidv4";
import { Input } from "../../client/input";
import {
  VisualClassificationFeatures,
  VisualDetectionFeatures,
  VisualSegmentationFeatures,
} from "./features";
import { JavaScriptValue } from "google-protobuf/google/protobuf/struct_pb";

export class VisualClassificationDataset extends ClarifaiDataset<ClarifaiDataLoader> {
  constructor(args: { dataGenerator: ClarifaiDataLoader; datasetId: string }) {
    super(args);
  }

  protected extractProtos({
    batchInputIds,
  }: {
    batchInputIds: string[];
  }): [GrpcInput[], Annotation[]] {
    const inputProtos: GrpcInput[] = [];
    const annotationProtos: Annotation[] = [];

    const processDataItem = (id: string) => {
      const dataItem = this.dataGenerator.getItem(
        Number(id),
      ) as VisualClassificationFeatures;
      let metadata: Record<string, JavaScriptValue> = {};
      const imagePath = dataItem.imagePath;
      const labels = Array.isArray(dataItem.labels)
        ? dataItem.labels.map((label) => label.toString())
        : [(dataItem.labels as string).toString()]; // clarifai concept expects labels to be an array
      const inputId = `${this.datasetId}-${String(dataItem.id)}`;
      const geoInfo = dataItem.geoInfo;

      if (dataItem.metadata) {
        metadata = dataItem.metadata;
      } else if (imagePath) {
        metadata = {
          filename: path.basename(imagePath),
        };
      }

      this.allInputIds[id] = inputId;

      if (dataItem.imageBytes) {
        inputProtos.push(
          Input.getInputFromBytes({
            inputId,
            imageBytes: dataItem.imageBytes,
            datasetId: this.datasetId,
            labels,
            geoInfo: {
              latitude: geoInfo?.[0] as number,
              longitude: geoInfo?.[1] as number,
            },
            metadata,
          }),
        );
      } else {
        inputProtos.push(
          Input.getInputFromFile({
            inputId,
            imageFile: imagePath as string,
            datasetId: this.datasetId,
            labels,
            geoInfo: {
              latitude: geoInfo?.[0] as number,
              longitude: geoInfo?.[1] as number,
            },
            metadata,
          }),
        );
      }
    };

    batchInputIds.forEach((id) => processDataItem(id));

    return [inputProtos, annotationProtos];
  }
}

export class VisualDetectionDataset extends ClarifaiDataset<ClarifaiDataLoader> {
  constructor(args: { dataGenerator: ClarifaiDataLoader; datasetId: string }) {
    super(args);
  }

  protected extractProtos({
    batchInputIds,
  }: {
    batchInputIds: string[];
  }): [GrpcInput[], Annotation[]] {
    const inputProtos: GrpcInput[] = [];
    const annotationProtos: Annotation[] = [];

    const processDataItem = (id: string) => {
      const dataItem = this.dataGenerator.getItem(
        Number(id),
      ) as VisualDetectionFeatures;
      let metadata: Record<string, JavaScriptValue> = {};
      const image = dataItem.imagePath;
      const labels = dataItem.labels.map((label) => label.toString());
      const bboxes = dataItem.bboxes;
      const inputId = `${this.datasetId}-${dataItem.id ? dataItem.id.toString() : uuid().replace(/-/g, "").slice(0, 8)}`;
      if (dataItem.metadata) {
        metadata = dataItem.metadata;
      } else if (image) {
        metadata = {
          filename: path.basename(image),
        };
      }
      const geoInfo = dataItem.geoInfo;

      this.allInputIds[id] = inputId;

      if (dataItem.imageBytes) {
        inputProtos.push(
          Input.getInputFromBytes({
            inputId,
            imageBytes: dataItem.imageBytes,
            datasetId: this.datasetId,
            labels,
            geoInfo: {
              latitude: geoInfo?.[0] as number,
              longitude: geoInfo?.[1] as number,
            },
            metadata,
          }),
        );
      } else {
        inputProtos.push(
          Input.getInputFromFile({
            inputId,
            imageFile: image,
            datasetId: this.datasetId,
            labels,
            geoInfo: {
              latitude: geoInfo?.[0] as number,
              longitude: geoInfo?.[1] as number,
            },
            metadata,
          }),
        );
      }

      for (let i = 0; i < bboxes.length; i++) {
        annotationProtos.push(
          Input.getBboxProto({
            inputId,
            label: labels[i],
            bbox: bboxes[i],
          }),
        );
      }
    };

    batchInputIds.forEach((id) => processDataItem(id));

    return [inputProtos, annotationProtos];
  }
}

export class VisualSegmentationDataset extends ClarifaiDataset<ClarifaiDataLoader> {
  constructor(args: { dataGenerator: ClarifaiDataLoader; datasetId: string }) {
    super(args);
  }

  protected extractProtos({
    batchInputIds,
  }: {
    batchInputIds: string[];
  }): [GrpcInput[], Annotation[]] {
    const inputProtos: GrpcInput[] = [];
    const annotationProtos: Annotation[] = [];

    const processDataItem = (id: string) => {
      const dataItem = this.dataGenerator.getItem(
        Number(id),
      ) as VisualSegmentationFeatures;
      let metadata: Record<string, JavaScriptValue> = {};
      const image = dataItem.imagePath;
      const labels = dataItem.labels.map((label) => label.toString());
      const polygons = dataItem.polygons;
      const inputId = `${this.datasetId}-${dataItem.id ? dataItem.id.toString() : uuid().replace(/-/g, "").slice(0, 8)}`;
      if (dataItem.metadata) {
        metadata = dataItem.metadata;
      } else if (image) {
        metadata = {
          filename: path.basename(image),
        };
      }
      const geoInfo = dataItem.geoInfo;
      this.allInputIds[id] = inputId;
      if (dataItem.imageBytes) {
        inputProtos.push(
          Input.getInputFromBytes({
            inputId,
            imageBytes: dataItem.imageBytes,
            datasetId: this.datasetId,
            geoInfo: {
              latitude: geoInfo?.[0] as number,
              longitude: geoInfo?.[1] as number,
            },
            metadata,
          }),
        );
      } else {
        inputProtos.push(
          Input.getInputFromFile({
            inputId,
            imageFile: image,
            datasetId: this.datasetId,
            geoInfo: {
              latitude: geoInfo?.[0] as number,
              longitude: geoInfo?.[1] as number,
            },
            metadata,
          }),
        );
      }
      for (let i = 0; i < polygons.length; i++) {
        annotationProtos.push(
          Input.getMaskProto({
            inputId,
            label: labels[i],
            polygons: [polygons[i]],
          }),
        );
      }
    };

    batchInputIds.forEach((id) => processDataItem(id));

    return [inputProtos, annotationProtos];
  }
}
