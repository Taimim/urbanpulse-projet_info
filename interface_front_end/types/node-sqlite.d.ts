declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    prepare(sql: string): {
      get(...params: unknown[]): Record<string, unknown> | undefined;
      all(...params: unknown[]): Array<Record<string, unknown>>;
      run(...params: unknown[]): unknown;
    };
    close(): void;
  }
}
