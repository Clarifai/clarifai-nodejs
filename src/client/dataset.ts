import {
  Annotation,
  DatasetVersion,
  Dataset as GrpcDataset,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { UserError } from "../errors";
import { ClarifaiUrl, ClarifaiUrlHelper } from "../urls/helper";
import { AuthConfig } from "../utils/types";
import { Lister } from "./lister";
import os from "os";
import { Input } from "./input";
import {
  DeleteDatasetVersionsRequest,
  ListDatasetVersionsRequest,
  PostDatasetVersionsRequest,
} from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
import {
  JavaScriptValue,
  Struct,
} from "google-protobuf/google/protobuf/struct_pb";
import { promisifyGrpcCall } from "../utils/misc";
import { StatusCode } from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
import { parallelLimit } from "async";
import compact from "lodash/compact";

type DatasetConfig =
  | {
      authConfig?: AuthConfig;
      datasetId: string;
      datasetVersionId?: string;
      url?: undefined;
    }
  | {
      authConfig?: AuthConfig;
      datasetId?: undefined;
      datasetVersionId?: undefined;
      url: ClarifaiUrl;
    };

export class Dataset extends Lister {
  private info: GrpcDataset = new GrpcDataset();
  private numOfWorkers: number = Math.min(os.cpus().length, 10);
  private annotNumOfWorkers: number = 4;
  private maxRetries: number = 10;
  private batchSize: number = 128;
  private task;
  private input: Input;

  constructor({ authConfig, datasetId, url, datasetVersionId }: DatasetConfig) {
    if (url && datasetId) {
      throw new UserError("You can only specify one of url or dataset_id.");
    }
    if (url) {
      const [userId, appId, , _datasetId, _datasetVersionId] =
        ClarifaiUrlHelper.splitClarifaiUrl(url);
      if (authConfig) authConfig.userId = userId;
      if (authConfig) authConfig.appId = appId;
      datasetId = _datasetId;
      datasetVersionId = _datasetVersionId;
    }

    super({ authConfig });
    this.info.setId(datasetId!);
    this.info.setVersion(new DatasetVersion().setId(datasetVersionId!));
    this.input = new Input({ authConfig });
  }

  async createVersion(
    description: string,
    metadata: Record<string, JavaScriptValue>,
  ): Promise<DatasetVersion.AsObject> {
    const request = new PostDatasetVersionsRequest();
    request.setUserAppId(this.userAppId);
    request.setDatasetId(this.info.getId());
    const datasetVersion = new DatasetVersion();
    datasetVersion.setDescription(description);
    datasetVersion.setMetadata(Struct.fromJavaScript(metadata));
    request.setDatasetVersionsList([datasetVersion]);

    const postDatasetVersions = promisifyGrpcCall(
      this.STUB.client.postDatasetVersions,
      this.STUB.client,
    );

    const response = await this.grpcRequest(postDatasetVersions, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    console.info("\nDataset Version created\n%s", response.getStatus());

    return responseObject.datasetVersionsList[0];
  }

  async deleteVersion(versionId: string): Promise<void> {
    const request = new DeleteDatasetVersionsRequest();
    request.setUserAppId(this.userAppId);
    request.setDatasetId(this.info.getId());
    request.setDatasetVersionIdsList([versionId]);

    const deleteDatasetVersions = promisifyGrpcCall(
      this.STUB.client.deleteDatasetVersions,
      this.STUB.client,
    );
    const response = await this.grpcRequest(deleteDatasetVersions, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(responseObject.status?.description);
    }
    console.info("\nDataset Version Deleted\n%s", response.getStatus());
  }

  async *listVersions(
    pageNo?: number,
    perPage?: number,
  ): AsyncGenerator<DatasetVersion.AsObject[], void, unknown> {
    const request = new ListDatasetVersionsRequest();
    request.setUserAppId(this.userAppId);
    request.setDatasetId(this.info.getId());

    const listDatasetVersions = promisifyGrpcCall(
      this.STUB.client.listDatasetVersions,
      this.STUB.client,
    );

    const listDatasetVersionsGenerator = this.listPagesGenerator(
      listDatasetVersions,
      request,
      pageNo,
      perPage,
    );

    for await (const versions of listDatasetVersionsGenerator) {
      yield versions.toObject().datasetVersionsList;
    }
  }

  private async concurrentAnnotUpload(
    annots: Annotation[][],
  ): Promise<Array<Array<Annotation>>> {
    const retryAnnotUpload: Array<Array<Annotation> | null> = [];

    const uploadAnnotations = async (
      inpBatch: Annotation[],
    ): Promise<Annotation[] | null> => {
      try {
        return await this.input.uploadAnnotations({
          batchAnnot: inpBatch,
          showLog: false,
        });
      } catch {
        return null;
      }
    };

    const maxWorkers = Math.min(this.annotNumOfWorkers, this.numOfWorkers);

    const uploadTasks = annots.map((annotBatch) => {
      return async () => {
        const uploadedAnnotation = await uploadAnnotations(annotBatch);
        if (!uploadedAnnotation) {
          retryAnnotUpload.push(annotBatch);
        }
        return uploadedAnnotation;
      };
    });

    await parallelLimit(uploadTasks, maxWorkers);

    return compact(retryAnnotUpload);
  }
}
