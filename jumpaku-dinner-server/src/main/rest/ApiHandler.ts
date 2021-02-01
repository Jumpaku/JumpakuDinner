import { Request, Response, RequestHandler, NextFunction } from "express";
import { Status } from "./status";
import { ApiError, ApiErrorType } from "./ApiError";
import { Result } from "../common/result";
import { JwtElement } from "../app/accounts/jwt";
import { decodeAuthHeader } from "./decodeAuthHeader";
import { AppState } from "../state/AppState";

export type FailureResponse = {
  tag: "Failure";
} & {
  type: ApiErrorType;
  message: string;
  detail?: unknown;
};

export type ApiResponse<R> = {
  status: typeof Status[keyof typeof Status];
  body:
    | ({
        tag: "Success";
      } & R)
    | FailureResponse;
};

export type ApiRequest<P> = {
  auth?: JwtElement;
  params: P;
};

export abstract class ApiHandler<HandlerParams, HandlerResult> {
  constructor(readonly state: AppState, readonly requiresAuth: boolean) {}
  abstract handle({
    params,
  }: ApiRequest<HandlerParams>): Promise<ApiResponse<HandlerResult>>;
  abstract parseBody(body: unknown): Result<HandlerParams, ApiError>;
  parseAuth(auth: string | undefined): Result<JwtElement, ApiError> {
    return decodeAuthHeader(auth);
  }
  handler(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      const auth = this.parseAuth(req.headers.authorization);
      const body = this.parseBody(req.body);
      const result =
        this.requiresAuth && auth.isFailure()
          ? Promise.resolve(ApiError.by(auth.error).response())
          : body.isFailure()
          ? Promise.resolve(ApiError.by(auth.error).response())
          : this.handle({ auth: auth.value, params: body.value });
      result
        .then((r) => res.status(r.status).json(r.body))
        .then(() =>
          this.state.logger().info(req.method, req.originalUrl, res.status)
        )
        .catch((e) => this.state.logger().fatal(e))
        .finally(next);
    };
  }
}
