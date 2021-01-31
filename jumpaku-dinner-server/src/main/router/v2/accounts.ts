import express from "express";
import { Status } from "../../lib/rest/status";
import { decodeRequestBody } from "../../lib/rest/decodeRequestBody";
import { ApiError } from "../../lib/rest/ApiError";
import { ApiHandler, ApiRequest, ApiResponse } from "../../lib/rest/ApiHandler";
import { AppModel } from "../../AppModel";
import T from "io-ts";
import { Result, success } from "../../lib/common/result";
import { IAccountsExecutor } from "../../lib/app/accounts/IAccounts";
import { AppError } from "../../lib/app/AppError";

const SignupParams = T.type({
  loginId: T.string,
  password: T.string,
  displayName: T.string,
});
type SignupParams = T.TypeOf<typeof SignupParams>;
type SignupResult = { accountId: number };
class SignupHandler extends ApiHandler<SignupParams, SignupResult> {
  constructor(readonly accounts: IAccountsExecutor) {
    super(false);
  }
  parseBody(body: unknown): Result<SignupParams, ApiError> {
    return decodeRequestBody(body, SignupParams.asDecoder());
  }
  async handle({
    params,
  }: ApiRequest<SignupParams>): Promise<ApiResponse<SignupResult>> {
    const result = await this.accounts.exec((m) => m.create(params!!));
    return result.isFailure()
      ? ApiError.by(result.error).response()
      : {
          status: Status.Ok,
          body: { tag: "Success", accountId: result.value },
        };
  }
}

type CloseParams = undefined;
type CloseResult = {};
class CloseHandler extends ApiHandler<CloseParams, CloseResult> {
  constructor(readonly accounts: IAccountsExecutor) {
    super(true);
  }
  parseBody(body: unknown): Result<CloseParams, ApiError> {
    return success(undefined);
  }
  async handle({
    auth,
  }: ApiRequest<CloseParams>): Promise<ApiResponse<CloseResult>> {
    if (auth == null)
      return ApiError.of(
        "AuthenticationFailed",
        "Invalid authorization header"
      ).response();
    const result = await this.accounts.exec(async (m) => {
      const accountId = await m.verifyToken(auth.jwt);
      if (accountId.isFailure()) return accountId as Result<never, AppError>;
      return await m.close(accountId.value);
    });
    return result.isFailure()
      ? ApiError.by(result.error).response()
      : {
          status: Status.Ok,
          body: { tag: "Success" },
        };
  }
}

export const accountsRouter = () => {
  const router = express.Router();
  router.post("/signup", new SignupHandler(AppModel.accounts).handler());
  router.post("/close", new CloseHandler(AppModel.accounts).handler());
  return router;
};
