import { BaseError } from "make-error-cause";

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
  static by(cause: unknown, type: AppErrorType): AppError;
  static by(cause: unknown, type: AppErrorType, message: string): AppError;
  static by(cause: unknown, type?: AppErrorType, message?: string): AppError {
    return new AppError(
      type ?? "UnexpectedError",
      message ??
        (cause instanceof Error ? cause.message : "Error cannot be recognized"),
      cause
    );
  }
  constructor(
    readonly type: AppErrorType,
    message: string,
    readonly detail?: unknown
  ) {
    super(message, detail instanceof Error ? detail : undefined);
  }
}
