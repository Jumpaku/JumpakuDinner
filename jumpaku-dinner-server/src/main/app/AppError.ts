import { BaseError } from "make-error-cause";
import { failure, Result } from "../common/Result";
import { DatabaseError } from "./database/error";

export type AppErrorType =
  | "AuthenticationFailed"
  | "ForbiddenAccess"
  | "ForbiddenOperation"
  | "InvalidParams"
  | "InvalidState"
  | "ServerError"
  | "DatabaseError"
  | "TargetNotFound"
  | "UnexpectedError";

export class AppError extends BaseError {
  static by(cause: unknown): AppError;
  static by(cause: unknown, type?: AppErrorType, message?: string): AppError;
  static by(cause: unknown, type?: AppErrorType, message?: string): AppError {
    return new AppError(
      type ?? "UnexpectedError",
      message ??
        (cause instanceof Error ? cause.message : "Error cannot be recognized"),
      cause,
      cause instanceof Error ? cause : undefined
    );
  }
  constructor(
    readonly type: AppErrorType,
    message: string,
    readonly detail?: unknown,
    cause?: unknown
  ) {
    super(message, cause instanceof Error ? cause : undefined);
  }

  toString() {
    return `${this.name} (${this.type}): ${this.message}${
      this.detail ? ` -- ${this.detail}` : ""
    }`;
  }
}

export function catchDatabaseError(
  e: unknown,
  message?: string
): Result<never, AppError> {
  const caught = DatabaseError.catch(e); // throws e if e is not recognized as DatabaseError
  return failure(AppError.by(caught, "DatabaseError", message));
}
