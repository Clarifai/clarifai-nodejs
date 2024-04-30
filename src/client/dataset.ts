import {
  DatasetVersion,
  Dataset as GrpcDataset,
  Input as GrpcInput,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { UserError } from "../errors";
import { ClarifaiUrl, ClarifaiUrlHelper } from "../urls/helper";
import { AuthConfig } from "../utils/types";
import { Lister } from "./lister";
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
import { logger } from "../utils/logging";

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
  private batchSize: number = 128;
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

  async createVersion({
    id,
    description,
    metadata = {},
  }: {
    id: string;
    description: string;
    metadata?: Record<string, JavaScriptValue>;
  }): Promise<DatasetVersion.AsObject> {
    const request = new PostDatasetVersionsRequest();
    request.setUserAppId(this.userAppId);
    request.setDatasetId(this.info.getId());
    const datasetVersion = new DatasetVersion();
    datasetVersion.setId(id);
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
    logger.info(
      `\nDataset Version created\n${responseObject.status.description}`,
    );

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
    logger.info(
      `\nDataset Version Deleted\n${responseObject.status.description}`,
    );
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

  async uploadFromFolder({
    folderPath,
    inputType,
    labels = false,
    batchSize = this.batchSize,
  }: {
    folderPath: string;
    inputType: "image" | "text";
    labels: boolean;
    batchSize?: number;
  }): Promise<void> {
    if (["image", "text"].indexOf(inputType) === -1) {
      throw new UserError("Invalid input type");
    }
    let inputProtos: GrpcInput[] = [];
    if (inputType === "image") {
      inputProtos = Input.getImageInputsFromFolder({
        folderPath: folderPath,
        datasetId: this.info.getId(),
        labels: labels,
      });
    }
    if (inputType === "text") {
      inputProtos = Input.getTextInputsFromFolder({
        folderPath: folderPath,
        datasetId: this.info.getId(),
        labels: labels,
      });
    }
    await this.input.bulkUpload({
      inputs: inputProtos,
      batchSize: batchSize,
    });
  }

  async uploadFromCSV({
    csvPath,
    inputType = "text",
    csvType,
    labels = true,
    batchSize = 128,
  }: {
    csvPath: string;
    inputType?: "image" | "text" | "video" | "audio";
    csvType: "raw" | "url" | "file";
    labels?: boolean;
    batchSize?: number;
  }): Promise<void> {
    if (!["image", "text", "video", "audio"].includes(inputType)) {
      throw new UserError(
        "Invalid input type, it should be image, text, audio, or video",
      );
    }
    if (!["raw", "url", "file"].includes(csvType)) {
      throw new UserError(
        "Invalid csv type, it should be raw, url, or file_path",
      );
    }
    if (!csvPath.endsWith(".csv")) {
      throw new UserError("csvPath should be a csv file");
    }
    if (csvType === "raw" && inputType !== "text") {
      throw new UserError("Only text input type is supported for raw csv type");
    }
    batchSize = Math.min(128, batchSize);
    const inputProtos = await Input.getInputsFromCsv({
      csvPath: csvPath,
      inputType: inputType,
      csvType: csvType,
      datasetId: this.info.getId(),
      labels: labels,
    });
    await this.input.bulkUpload({
      inputs: inputProtos,
      batchSize: batchSize,
    });
  }
}
