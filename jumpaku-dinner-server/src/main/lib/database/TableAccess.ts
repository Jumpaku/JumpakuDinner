import { Result } from "../common/result";
import { QueryBuilder, sql } from "./sql";
import { DatabaseAccess, Database } from "./db";

export class TableAccess<
  Row,
  Columns extends {
    [K in keyof Row]: Columns[K] extends string ? Columns[K] : never;
  }
> extends DatabaseAccess {
  constructor(
    database: Database,
    readonly name: string,
    readonly columns: Columns,
    readonly queryCreateTable: QueryBuilder,
    readonly queryDropTable: QueryBuilder = sql`DROP TABLE IF  EXISTS ${name}`
  ) {
    super(database);
  }

  dropTable(): Promise<Result<void, Error>> {
    return this.queryNone(this.queryDropTable);
  }

  createTable(): Promise<Result<void, Error>> {
    return this.queryNone(this.queryCreateTable);
  }
}
