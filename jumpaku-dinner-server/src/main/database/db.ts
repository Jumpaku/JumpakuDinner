import { IDatabase } from "pg-promise";
import pg from "pg-promise";
import {
  IConnectionParameters,
  IClient,
} from "pg-promise/typescript/pg-subset";
import { Result, resultOf } from "../common/result";
import { DatabaseError, PostgresDatabaseError } from "./error";

export type Database = IDatabase<{}, IClient>;
export type ConnectionConfig = IConnectionParameters;

const pgInstance = pg();

export function connect(
  options: ConnectionConfig
): Result<Database, DatabaseError> {
  return resultOf(
    () => pgInstance(options),
    (e) => {
      if (e instanceof PostgresDatabaseError)
        return new DatabaseError(
          "ConfigError",
          "Invalid configuration of database connection",
          e
        );
      throw e;
    }
  );
}
