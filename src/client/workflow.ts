import { AuthConfig } from "../utils/types";
import { Lister } from "./lister";
import { UserError } from "../errors";
import { ClarifaiUrl, ClarifaiUrlHelper } from "../urls/helper";
import resources_pb from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
const {
  Input: GrpcInput,
  OutputConfig: GrpcOutputConfig,
  WorkflowState,
} = resources_pb;
import { MAX_WORKFLOW_PREDICT_INPUTS } from "../constants/workflow";
import service_pb from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";
const {
  GetWorkflowRequest,
  ListWorkflowVersionsRequest,
  PostWorkflowResultsRequest,
} = service_pb;
import { BackoffIterator, promisifyGrpcCall } from "../utils/misc";
import status_code_pb from "clarifai-nodejs-grpc/proto/clarifai/api/status/status_code_pb";
const { StatusCode } = status_code_pb;
import { Input } from "./input";
import { Exporter } from "../workflows/export";
import { fromPartialProtobufObject } from "../utils/fromPartialProtobufObject";

type OutputConfig = { minValue: number };

type WorkflowConfig =
  | {
      url: ClarifaiUrl;
      workflowId?: undefined;
      workflowVersion?: undefined;
      outputConfig?: OutputConfig;
      authConfig?: Omit<AuthConfig, "userId" | "appId"> & {
        appId?: undefined;
        userId?: undefined;
      };
    }
  | {
      url?: undefined;
      workflowId: string;
      workflowVersion?: { id: string };
      outputConfig?: OutputConfig;
      authConfig?: AuthConfig;
    };

/**
 * @noInheritDoc
 */
export class Workflow extends Lister {
  private versionId: string;
  public id: string;
  public appId: string;
  private outputConfig: OutputConfig;

  constructor({
    url,
    workflowId,
    workflowVersion = { id: "" },
    outputConfig = { minValue: 0 },
    authConfig = {},
  }: WorkflowConfig) {
    if (url && workflowId) {
      throw new UserError("You can only specify one of url or workflow_id.");
    }
    if (!url && !workflowId) {
      throw new UserError("You must specify one of url or workflow_id.");
    }
    if (url) {
      const [userId, appId, , _workflowId, workflowVersionId] =
        ClarifaiUrlHelper.splitClarifaiUrl(url);
      if (workflowVersionId) workflowVersion.id = workflowVersionId;
      authConfig.userId = userId;
      authConfig.appId = appId;
      workflowId = _workflowId;
    }

    super({ authConfig: authConfig as AuthConfig });
    this.id = workflowId || "";
    this.versionId = workflowVersion.id;
    this.outputConfig = outputConfig;
    this.appId = authConfig.appId || process.env.CLARIFAI_APP_ID!;
  }

  async predict({
    inputs,
    workflowStateId,
  }: {
    inputs: resources_pb.Input[];
    workflowStateId?: resources_pb.WorkflowState.AsObject["id"];
  }): Promise<service_pb.PostWorkflowResultsResponse.AsObject> {
    if (inputs.length > MAX_WORKFLOW_PREDICT_INPUTS) {
      throw new UserError(
        `Too many inputs. Max is ${MAX_WORKFLOW_PREDICT_INPUTS}.`,
      );
    }

    const request = new PostWorkflowResultsRequest();
    request.setUserAppId(this.userAppId);
    request.setWorkflowId(this.id);
    request.setVersionId(this.versionId);
    request.setInputsList(inputs);
    const outputConfig = fromPartialProtobufObject(
      GrpcOutputConfig,
      this.outputConfig,
    );
    request.setOutputConfig(outputConfig);

    if (workflowStateId) {
      const workflowState = new WorkflowState();
      workflowState.setId(workflowStateId);
      request.setWorkflowState(workflowState);
    }

    const startTime = Date.now();
    const backoffIterator = new BackoffIterator();
    const postWorkflowResults = promisifyGrpcCall(
      this.STUB.client.postWorkflowResults,
      this.STUB.client,
    );

    return new Promise((resolve, reject) => {
      const makeRequest = () => {
        this.grpcRequest(postWorkflowResults, request)
          .then((response) => {
            const responseObject = response.toObject();
            if (
              responseObject.status?.code === StatusCode.MODEL_DEPLOYING &&
              Date.now() - startTime < 600000
            ) {
              console.log(
                `${this.id} Workflow is still deploying, please wait...`,
              );
              setTimeout(makeRequest, backoffIterator.next().value * 1000);
            } else if (responseObject.status?.code !== StatusCode.SUCCESS) {
              reject(
                new Error(
                  `Workflow Predict failed with response ${responseObject.status?.description}`,
                ),
              );
            } else {
              resolve(response.toObject());
            }
          })
          .catch((error) => {
            reject(
              new Error(`Model Predict failed with error: ${error.message}`),
            );
          });
      };

      makeRequest();
    });
  }

  predictByBytes(
    inputBytes: Buffer,
    inputType: "image" | "text" | "video" | "audio",
  ): Promise<service_pb.PostWorkflowResultsResponse.AsObject> {
    if (!["image", "text", "video", "audio"].includes(inputType)) {
      throw new UserError(
        "Invalid input type. It should be image, text, video, or audio.",
      );
    }
    if (!Buffer.isBuffer(inputBytes)) {
      throw new UserError("Invalid bytes.");
    }

    let inputProto = new GrpcInput();
    if (inputType === "image") {
      inputProto = Input.getInputFromBytes({
        inputId: "",
        imageBytes: inputBytes,
      });
    } else if (inputType === "text") {
      inputProto = Input.getInputFromBytes({
        inputId: "",
        textBytes: inputBytes,
      });
    } else if (inputType === "video") {
      inputProto = Input.getInputFromBytes({
        inputId: "",
        videoBytes: inputBytes,
      });
    } else if (inputType === "audio") {
      inputProto = Input.getInputFromBytes({
        inputId: "",
        audioBytes: inputBytes,
      });
    }

    return this.predict({ inputs: [inputProto] });
  }

  predictByUrl(
    url: string,
    inputType: "image" | "text" | "video" | "audio",
  ): Promise<service_pb.PostWorkflowResultsResponse.AsObject> {
    if (!["image", "text", "video", "audio"].includes(inputType)) {
      throw new UserError(
        "Invalid input type. It should be image, text, video, or audio.",
      );
    }
    let inputProto = new GrpcInput();
    if (inputType === "image") {
      inputProto = Input.getInputFromUrl({ inputId: "", imageUrl: url });
    } else if (inputType === "text") {
      inputProto = Input.getInputFromUrl({ inputId: "", textUrl: url });
    } else if (inputType === "video") {
      inputProto = Input.getInputFromUrl({ inputId: "", videoUrl: url });
    } else if (inputType === "audio") {
      inputProto = Input.getInputFromUrl({ inputId: "", audioUrl: url });
    }
    return this.predict({ inputs: [inputProto] });
  }

  async *listVersions({
    pageNo,
    perPage,
  }: {
    pageNo?: number;
    perPage?: number;
  }): AsyncGenerator<
    service_pb.MultiWorkflowVersionResponse.AsObject,
    void,
    void
  > {
    const request = new ListWorkflowVersionsRequest();
    request.setUserAppId(this.userAppId);
    request.setWorkflowId(this.id);

    const listWorkflowVersions = promisifyGrpcCall(
      this.STUB.client.listWorkflowVersions,
      this.STUB.client,
    );

    const workflowVersionsGenerator = this.listPagesGenerator(
      listWorkflowVersions,
      request,
      perPage,
      pageNo,
    );

    for await (const workflowVersionInfo of workflowVersionsGenerator) {
      const workflowVersion = workflowVersionInfo.toObject();
      yield workflowVersion;
    }
  }

  /**
   * Exports the workflow to a yaml file.
   *
   * @param outPath - The path to save the yaml file to.
   *
   * @example
   * ```typescript
   * import { Workflow } from "./workflow";
   *
   * const workflow = new Workflow("https://clarifai.com/clarifai/main/workflows/Demographics");
   * await workflow.export("out_path.yml");
   * ```
   */
  async exportWorkflow(outPath: string): Promise<void> {
    const request = new GetWorkflowRequest();
    request.setUserAppId(this.userAppId);
    request.setWorkflowId(this.id);

    const getWorkflow = promisifyGrpcCall(
      this.STUB.client.getWorkflow,
      this.STUB.client,
    );

    const response = await this.grpcRequest(getWorkflow, request);
    const responseObject = response.toObject();
    if (responseObject.status?.code !== StatusCode.SUCCESS) {
      throw new Error(
        `Workflow Export failed with response ${response.getStatus()?.toString()}`,
      );
    }

    const exporter = new Exporter(responseObject);
    exporter.parse();
    exporter.export(outPath);
  }
}
