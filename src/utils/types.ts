import { grpc } from "clarifai-nodejs-grpc";

export type AuthConfig =
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

export type PaginationRequestParams<T extends Record<string, unknown>> =
  | Omit<Partial<T>, "userAppId" | "pageNo" | "perPage">
  | Record<string, never>;

export type Point = [number, number];
export type Polygon = Point[];
