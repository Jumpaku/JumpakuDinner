import { BaseError } from "make-error-cause";
import { AppError, AppErrorType } from "../app/AppError";
import { ApiResponse } from "./requestHandler";
import { Status } from "./status";

export type ApiErrorType = AppErrorType | "InvalidAuthHeader";

export class ApiError extends BaseError {
  static by(
    cause: unknown,
    type?: ApiErrorType,
    message?: string,
    detail?: unknown
  ): ApiError {
    if (cause instanceof AppError)
      return new ApiError(
        type ?? cause.type,
        message ?? cause.message,
        detail ?? cause.detail,
        cause
      );
    if (cause instanceof Error)
      return new ApiError(
        type ?? "UnexpectedError",
        message ?? cause.message,
        detail ?? cause,
        cause
      );
    return new ApiError(
      type ?? "UnexpectedError",
      message ?? "Error cannot be recognized",
      detail ?? cause
    );
  }
  static wrap(cause: AppError): ApiError {
    return new ApiError(cause.type, cause.message, cause.detail, cause);
  }
  static of(type: ApiErrorType, message: string, detail?: unknown): ApiError {
    return new ApiError(type, message, detail);
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
  private constructor(
    readonly type: ApiErrorType,
    message: string,
    readonly detail?: unknown,
    cause?: Error
  ) {
    super(message, cause);
  }

  response(): ApiResponse<unknown> {
    const status = ApiError.statusOf(this.type);
    const body = Object.assign(
      {
        tag: "Failure",
        type: this.type,
        message: this.message,
      } as const,
      this.cause instanceof AppError
        ? { detail: this.cause.detail }
        : this.cause != null
        ? { detail: this.cause }
        : this.detail != null
        ? { detail: this.detail }
        : {}
    );
    return { status, body };
  }
}
