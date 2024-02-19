import { BaseClient } from "./base";

export class Lister extends BaseClient {
  defaultPageSize: number;

  constructor(
    kwargs:
      | {
          userId: string;
          appId: string;
          pat: string;
          token?: string;
          base?: string;
          ui?: string;
        }
      | Record<string, never> = {},
    pageSize: number = 16,
  ) {
    super(kwargs);
    this.defaultPageSize = pageSize;
  }

  /**
   * TODO: Implement the actual pagination logic
   */
  listPagesGenerator() {
    throw new Error("Not implemented");
  }
}
