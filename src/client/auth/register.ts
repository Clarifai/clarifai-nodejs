import { AuthorizedStub, RetryStub } from "./stub";

// Interface equivalent to V2Stub abstract class
export type V2Stub = AuthorizedStub | RetryStub;

// Interface equivalent to RpcCallable abstract class
export interface RpcCallable {
  // This interface will be extended by other interfaces
}
