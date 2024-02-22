import { Metadata, ServiceError, CallOptions } from "@grpc/grpc-js";
import { UserAppIDSet } from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { V2Client } from "clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb";
import { ListInputsRequest } from "clarifai-nodejs-grpc/proto/clarifai/api/service_pb";

type GrpcCb<Res> = (err: ServiceError | null, res: Res) => void;

type Method1<Req, Res> = (req: Req, callback: GrpcCb<Res>) => void;
type Method2<Req, Res> = (
  req: Req,
  metadata: Metadata,
  callback: GrpcCb<Res>,
) => void;
type Method3<Req, Res> = (
  req: Req,
  metadata: Metadata,
  options: Partial<CallOptions>,
  callback: GrpcCb<Res>,
) => void;

type Method<Req, Res> =
  | Method1<Req, Res>
  | Method2<Req, Res>
  | Method3<Req, Res>;

/**
 * This is a helper function to create a callback that resolves or rejects a promise.
 * The error type is always `ServiceError` since that's what the grpc package uses, rather
 * than `any` which is the standard node.js callback error type.
 */
function makeCallback<Res>(
  resolve: (value: Res) => void,
  reject: (reason?: ServiceError) => void,
): GrpcCb<Res> {
  return (err, res) => {
    if (err) {
      reject(err);
    } else {
      resolve(res);
    }
  };
}

/**
 * Invoke a method that takes 1 argument: the request object.
 * @param client the client.
 * @param method the method.
 * @param req the request object.
 * @returns a promise that resolves to the response object.
 */
function invokeMethod1<Req, Res>(
  client: V2Client,
  method: Method1<Req, Res>,
  req: Req,
): Promise<Res> {
  return new Promise((resolve, reject) => {
    method.call(client, req, makeCallback(resolve, reject));
  });
}

/**
 * Invoke a method that takes 2 arguments: the request object and request metadata such as authentication token.
 * @param client the client.
 * @param method the method.
 * @param req the request object.
 * @param metadata the metadata object.
 * @returns a promise that resolves to the response object.
 */
function invokeMethod2<Req, Res>(
  client: V2Client,
  method: Method2<Req, Res>,
  req: Req,
  metadata: Metadata,
): Promise<Res> {
  return new Promise((resolve, reject) => {
    method.call(client, req, metadata, makeCallback(resolve, reject));
  });
}

/**
 * Invoke a method that takes 3 arguments: the request object, request metadata, and call options.
 * @param client the client.
 * @param method the method.
 * @param req the request object.
 * @param metadata the metadata object.
 * @param options the call options.
 * @returns a promise that resolves to the response object.
 */
function invokeMethod3<Req, Res>(
  client: V2Client,
  method: Method3<Req, Res>,
  req: Req,
  metadata: Metadata,
  options: Partial<CallOptions>,
): Promise<Res> {
  return new Promise((resolve, reject) => {
    method.call(client, req, metadata, options, makeCallback(resolve, reject));
  });
}

/*
 * This is the main function that we will use to invoke any gRPC method.
 */
export function invokeMethod<Req, Res>(
  client: V2Client,
  method: Method1<Req, Res>,
  req: Req,
): Promise<Res>;
export function invokeMethod<Req, Res>(
  client: V2Client,
  method: Method2<Req, Res>,
  req: Req,
  metadata: Metadata,
): Promise<Res>;
export function invokeMethod<Req, Res>(
  client: V2Client,
  method: Method3<Req, Res>,
  req: Req,
  metadata: Metadata,
  options: Partial<CallOptions>,
): Promise<Res>;
export function invokeMethod<Req, Res>(
  client: V2Client,
  method: Method1<Req, Res> | Method2<Req, Res> | Method3<Req, Res>,
  req: Req,
  metadata?: Metadata,
  options?: Partial<CallOptions>,
): Promise<Res> {
  if (isMethod1(method)) {
    return invokeMethod1(client, method, req);
  }
  if (isMethod2(method)) {
    return invokeMethod2(client, method, req, metadata!);
  }
  return invokeMethod3(client, method, req, metadata!, options!);
}

function isMethod1<A, B>(m: Method<A, B>): m is Method1<A, B> {
  return m.length === 2;
}
function isMethod2<A, B>(m: Method<A, B>): m is Method2<A, B> {
  return m.length === 3;
}

/**************************EXAMPLES*************************/

async function __example__one__(client: V2Client) {
  const userAppId = new UserAppIDSet();
  userAppId.setAppId("main");
  userAppId.setUserId("clarifai");

  const req = new ListInputsRequest();
  req.setUserAppId(userAppId);

  // res1 is correctly inferred as MultiInputsResponse
  const res1 = await invokeMethod(client, client.listInputs, req);
  console.log(res1);
}

async function __example__two__(client: V2Client) {
  const userAppId = new UserAppIDSet();
  userAppId.setAppId("main");
  userAppId.setUserId("clarifai");

  const req = new ListInputsRequest();
  req.setUserAppId(userAppId);

  const metadata = new Metadata();
  metadata.set("authorization", "my-api-key");

  // res2 is still correctly inferred as MultiInputsResponse
  const res2 = await invokeMethod(client, client.listInputs, req, metadata);
  console.log(res2);
}

async function __example__three__(client: V2Client) {
  const userAppId = new UserAppIDSet();
  userAppId.setAppId("main");
  userAppId.setUserId("clarifai");

  const req = new ListInputsRequest();
  req.setUserAppId(userAppId);

  const metadata = new Metadata();
  metadata.set("authorization", "my-api-key");

  const options = {
    deadline: Date.now() + 1000,
  };

  // res3 is still correctly inferred as MultiInputsResponse
  const res3 = await invokeMethod(
    client,
    client.listInputs,
    req,
    metadata,
    options,
  );
  console.log(res3);
}
