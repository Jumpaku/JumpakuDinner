import { BaseError } from "make-error-cause";

export type AppErrorType =
  | "AuthenticationFailed"
  | "Unauthorized"
  | "InvalidRequest"
  | "InvalidState"
  | "ServerError"
  | "DatabaseError"
  | "UnexpectedError";

export class AppError<D> extends BaseError {
  static by<D>(cause: D): AppError<D>;
  static by<D>(cause: D, type: AppErrorType): AppError<D>;
  static by<D>(cause: D, type: AppErrorType, message: string): AppError<D>;
  static by<D>(cause: D, type?: AppErrorType, message?: string): AppError<D> {
    return new AppError<D>(
      type ?? "UnexpectedError",
      message ??
        (cause instanceof Error ? cause.message : "Error cannot be recognized"),
      cause
    );
  }
  constructor(
    readonly type: AppErrorType,
    message: string,
    readonly detail?: D
  ) {
    super(message, detail instanceof Error ? detail : undefined);
  }
}
