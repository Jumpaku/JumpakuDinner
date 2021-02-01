import { BaseError } from "make-error-cause";
import pg from "pg-promise";
import { failure, ResultError } from "../common/result";
import { DatabaseError as PostgresDatabaseError } from "pg-protocol";

export { DatabaseError as PostgresDatabaseError } from "pg-protocol";
export { errors as pgErrors } from "pg-promise";

export type DatabaseErrorType =
  | "ConfigError"
  | "QueryError"
  | "QueryResultError"
  | "UnexpectedError";

export class DatabaseError extends BaseError {
  constructor(
    readonly type: DatabaseErrorType,
    message: string,
    cause?: unknown
  ) {
    super(message, cause instanceof Error ? cause : undefined);
  }
  causedByPostgresError(): this is { cause: PostgresDatabaseError } {
    return this.cause instanceof PostgresDatabaseError;
  }
  causedByError(): this is { cause: Error } {
    return this.cause instanceof Error;
  }
}

export const databaseErrorOnQuery = (e: unknown) => {
  if (e instanceof pg.errors.QueryResultError)
    return failure(
      new DatabaseError("QueryResultError", "Invalid number of rows", e)
    );
  if (e instanceof ResultError)
    return failure(
      new DatabaseError("QueryResultError", "Failed decoding row", e)
    );
  if (e instanceof PostgresDatabaseError)
    return failure(
      new DatabaseError("QueryError", "Failed executing query", e)
    );
  throw e;
};
