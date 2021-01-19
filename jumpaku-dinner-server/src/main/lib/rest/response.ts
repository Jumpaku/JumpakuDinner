import { AppError, AppErrorType } from "../app/AppError";

export type FailureResponse = {
  tag: "Failure";
} & {
  type: AppErrorType;
  message: string;
  detail?: string;
};

export type ApiResponse<R> = {
  status: number;
  body:
    | ({
        tag: "Success";
      } & R)
    | FailureResponse;
};

export function failureFromAppError(error: AppError<unknown>): FailureResponse {
  error.type, error.message, error.detail;
  const response = {
    tag: "Failure",
    type: error.type,
    message: error.message,
  } as const;
  if (error.detail == null) return response;
  return { ...response, detail: JSON.stringify(error.detail) };
}
