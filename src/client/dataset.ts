import {
  Annotation,
  DatasetVersion,
  Dataset as GrpcDataSet,
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

const cpuCount = os.cpus().length;

type DatasetConfig =
  | {
      url: ClarifaiUrl;
      datasetId?: undefined;
      authConfig?: Omit<AuthConfig, "userId" | "appId">;
    }
  | {
      url?: undefined;
      datasetId: string;
      authConfig: AuthConfig;
    };

export class Datasets extends Lister {
  private info: GrpcDataSet;
  private numWorkers = Math.min(cpuCount, 10);
  private annotNumWorkers = 4;
  private maxRetries = 10;
  private batchSize = 128;
  private task;
  private input: Input;

  constructor({ url, datasetId, authConfig }: DatasetConfig) {
    if (url && datasetId) {
      throw new UserError("You can only specify one of url or dataset_id.");
    }

    if (url) {
      const [userId, appId, , _datasetId] =
        ClarifaiUrlHelper.splitClarifaiUrl(url);
      (authConfig as AuthConfig).userId = userId;
      (authConfig as AuthConfig).appId = appId;
      datasetId = _datasetId;
    }

    super({ authConfig: authConfig as AuthConfig });
    this.info = new GrpcDataSet().setId(datasetId as string);
    this.input = new Input({ authConfig: authConfig as AuthConfig });
  }

  async createVersion({
    description,
    metadata,
  }: {
    description: string;
    metadata?: Record<string, JavaScriptValue>;
  }): Promise<DatasetVersion.AsObject> {
    const request = new PostDatasetVersionsRequest();
    request.setUserAppId(this.userAppId);
    request.setDatasetId(this.info.getId());
    const datasetVersion = new DatasetVersion();
    datasetVersion.setDescription(description);
    if (metadata) {
      const metadataStruct = Struct.fromJavaScript(metadata);
      datasetVersion.setMetadata(metadataStruct);
    }
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
    console.info(
      "\nDataset Version created\n%s",
      responseObject.status?.description,
    );

    return responseObject.datasetVersionsList?.[0];
  }

  async deleteVersion({ versionId }: { versionId: string }): Promise<void> {
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
    console.info(
      "\nDataset Version Deleted\n%s",
      responseObject.status?.description,
    );
  }

  async *listVersions({
    pageNo,
    perPage,
  }: {
    pageNo?: number;
    perPage?: number;
  } = {}): AsyncGenerator<DatasetVersion.AsObject[], void, unknown> {
    const request = new ListDatasetVersionsRequest();
    request.setUserAppId(this.userAppId);
    request.setDatasetId(this.info.getId());
    const listDatasetVersions = promisifyGrpcCall(
      this.STUB.client.listDatasetVersions,
      this.STUB.client,
    );
    const itemGenerator = this.listPagesGenerator(
      listDatasetVersions,
      request,
      pageNo,
      perPage,
    );
    for await (const item of itemGenerator) {
      yield item.toObject().datasetVersionsList;
    }
  }

  private async concurrentAnnotUpload({
    annots,
  }: {
    annots: Annotation[][];
  }): Promise<(Annotation[] | null)[]> {
    const retryAnnotUpload: (Annotation[] | null)[] = [];

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

    const maxWorkers = Math.min(this.annotNumWorkers, cpuCount);

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

    return retryAnnotUpload;
  }
}
