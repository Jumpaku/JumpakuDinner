import { Request, Response, RequestHandler } from "express";
import { getLogger } from "../../logger";
import { Status } from "./status";
import { ApiErrorType } from "./ApiError";

export type FailureResponse = {
  tag: "Failure";
} & {
  type: ApiErrorType;
  message: string;
  detail?: string;
};

export type ApiResponse<R> = {
  status: typeof Status[keyof typeof Status];
  body:
    | ({
        tag: "Success";
      } & R)
    | FailureResponse;
};

export type ApiRequest = Partial<{
  body: unknown;
  auth: unknown;
}>;
export type ApiRequestHandler<R> = (
  request: ApiRequest
) => Promise<ApiResponse<R>>;

function logRequestInfo(req: Request, res: Response): void {
  getLogger().info({
    req: {
      method: req.method,
      url: req.url,
    },
    res: {
      status: res.statusCode,
    },
  });
}

export function requestHandler<R>(
  handler: ApiRequestHandler<R>
): RequestHandler {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    const body = req.body;
    return handler({ body, auth })
      .then(({ status, body }) => res.status(status).json(body))
      .then(() => logRequestInfo(req, res))
      .catch((e) => getLogger().fatal(e))
      .finally(next);
  };
}
