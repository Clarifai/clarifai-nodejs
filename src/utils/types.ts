import * as grpc from "@grpc/grpc-js";

export type KWArgs =
  | {
      userId: string;
      appId: string;
      pat: string;
      token?: string;
      base?: string;
      ui?: string;
    }
  | Record<string, never>;

export type GrpcWithCallback<TRequest, TResponse> = (
  request: TRequest,
  metadata: grpc.Metadata,
  options: Partial<grpc.CallOptions>,
  callback: (error: grpc.ServiceError | null, response: TResponse) => void,
) => grpc.ClientUnaryCall;
