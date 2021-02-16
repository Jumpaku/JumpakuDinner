import { BaseError } from "make-error-cause";
import pg from "pg-promise";
import { failure, Result, ResultError, success } from "../../common/Result";
import pgProtocol from "pg-protocol";

export { DatabaseError as PostgresDatabaseError } from "pg-protocol";
export namespace pgErrors {
  export declare type ParameterizedQueryError = pg.errors.ParameterizedQueryError;
  export declare type PreparedStatementError = pg.errors.PreparedStatementError;
  export declare type QueryFileError = pg.errors.QueryFileError;
  export declare type QueryResultError = pg.errors.QueryResultError;
}

export type DatabaseErrorType =
  | "ConfigError"
  | "QueryError"
  | "QueryResultError"
  | "UnexpectedError";

export class DatabaseError extends BaseError {
  /**
   * Catches `e` as `DatabaseError` if e is an error that is related database.
   * @param e Error that may be caused by database
   * @param message overwrites the message in Error
   * @throws `e` when class of `e` is not one of `DatabaseError`, `pgProtocol.DatabaseError`, `pg.errors.ParameterizedQueryError`, `pg.errors.PreparedStatementError`, `pg.errors.QueryFileError`, nor `pg.errors.QueryResultError`.
   */
  static catch(e: unknown, message?: string): DatabaseError {
    if (e instanceof DatabaseError)
      return new DatabaseError(e.type, message ?? e.message, e.cause);
    if (
      e instanceof pgProtocol.DatabaseError ||
      e instanceof pg.errors.ParameterizedQueryError ||
      e instanceof pg.errors.PreparedStatementError ||
      e instanceof pg.errors.QueryFileError
    )
      return new DatabaseError("QueryError", message ?? e.message, e);
    if (e instanceof pg.errors.QueryResultError)
      return new DatabaseError("QueryResultError", message ?? e.message, e);
    throw e;
  }

  constructor(
    readonly type: DatabaseErrorType,
    message: string,
    cause?: unknown
  ) {
    super(message, cause instanceof Error ? cause : undefined);
  }
}
