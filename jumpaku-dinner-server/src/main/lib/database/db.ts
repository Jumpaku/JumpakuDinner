import { IDatabase } from "pg-promise";
import pg from "pg-promise";
import {
  IConnectionParameters,
  IClient,
} from "pg-promise/typescript/pg-subset";
import { Result, resultOf, success } from "../common/result";
import { QueryStatement as QueryStatement } from "./sql";
import { DatabaseError, PostgresError, databaseErrorOnQuery } from "./error";

export type Database = IDatabase<{}, IClient>;
export type ConnectionConfig = IConnectionParameters;

const pgInstance = pg();

export function connect(
  options: ConnectionConfig
): Result<Database, DatabaseError> {
  return resultOf(
    () => pgInstance(options),
    (e) => {
      if (e instanceof PostgresError)
        return new DatabaseError(
          "ConfigError",
          "Invalid configuration of database connection",
          e
        );
      throw e;
    }
  );
}
