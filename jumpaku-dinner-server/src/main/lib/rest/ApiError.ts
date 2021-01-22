import { BaseError } from "make-error-cause";
import { AppError, AppErrorType } from "../app/AppError";
import { ApiResponse } from "./requestHandler";
import { Status } from "./status";

export type ApiErrorType = AppErrorType | "InvalidAuthHeader";

export class ApiError<D> extends BaseError {
  static by<D>(cause: D): ApiError<D>;
  static by<D>(cause: D, type: ApiErrorType): ApiError<D>;
  static by<D>(cause: D, type: ApiErrorType, message: string): ApiError<D>;
  static by<D>(cause: D, type?: ApiErrorType, message?: string): ApiError<D> {
    return new ApiError<D>(
      type ?? (cause instanceof AppError ? cause.type : "UnexpectedError"),
      message ??
        (cause instanceof Error ? cause.message : "Error cannot be recognized"),
      cause
    );
  }
  static statusOf(type: ApiErrorType): typeof Status[keyof typeof Status] {
    switch (type) {
      case "AuthenticationFailed":
        return Status.Unauthorized;
      case "ForbiddenOperation":
      case "ForbiddenAccess":
        return Status.Forbidden;
      case "TargetNotFound":
        return Status.NotFound;
      case "InvalidParams":
      case "InvalidState":
      case "InvalidAuthHeader":
        return Status.BadRequest;
      case "ServerError":
      case "DatabaseError":
      case "UnexpectedError":
        return Status.InternalServerError;
    }
  }
  constructor(
    readonly type: ApiErrorType,
    message: string,
    readonly detail?: D
  ) {
    super(message, detail instanceof Error ? detail : undefined);
  }

  response(): ApiResponse<unknown> {
    const status = ApiError.statusOf(this.type);
    const body = Object.assign(
      {
        tag: "Failure",
        type: this.type,
        message: this.message,
      } as const,
      this.detail == null ? { details: JSON.stringify(this.detail) } : {}
    );
    return { status, body };
  }
}
