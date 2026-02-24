declare module "sql.js" {
  interface Database {
    run(sql: string, params?: unknown[]): void;
    export(): Uint8Array;
    close(): void;
  }

  interface SqlJsStatic {
    Database: new () => Database;
  }

  export default function initSqlJs(): Promise<SqlJsStatic>;
}
