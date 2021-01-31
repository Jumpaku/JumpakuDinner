import express from "express";
import { AppModel } from "../../AppModel";
import { ApiError } from "../../lib/rest/ApiError";
import { decodeRequestBody } from "../../lib/rest/decodeRequestBody";
import { ApiHandler, ApiRequest, ApiResponse } from "../../lib/rest/ApiHandler";
import { Status } from "../../lib/rest/status";
import T from "io-ts";
import { JwtElement } from "../../lib/app/accounts/jwt";
import { IAccountsExecutor } from "../../lib/app/accounts/IAccounts";
import { failure, Result } from "../../lib/common/result";
import { AppError } from "../../lib/app/AppError";

const IssueParams = T.type({
  loginId: T.string,
  password: T.string,
});
type IssueParams = T.TypeOf<typeof IssueParams>;
type IssueResult = JwtElement;
class IssueHandler extends ApiHandler<IssueParams, IssueResult> {
  constructor(readonly accounts: IAccountsExecutor) {
    super(false);
  }
  parseBody(body: unknown): Result<IssueParams, ApiError> {
    return decodeRequestBody(body, IssueParams.asDecoder());
  }
  async handle({
    params,
  }: ApiRequest<IssueParams>): Promise<ApiResponse<IssueResult>> {
    const result = await this.accounts.exec(async (m) => {
      const accountId = await m.authenticate(params);
      if (accountId.isFailure()) return accountId as Result<never, AppError>;
      return await m.issueToken(accountId.value);
    });
    if (result.isFailure()) return ApiError.by(result.error).response();
    return {
      status: Status.Ok,
      body: { tag: "Success", jwt: result.value },
    };
  }
}

const VerifyParams = JwtElement;
type VerifyParams = JwtElement;
type VerifyResult = { accountId: number };
class VerifyHandler extends ApiHandler<VerifyParams, VerifyResult> {
  constructor(readonly accounts: IAccountsExecutor) {
    super(true);
  }
  parseBody(body: unknown): Result<VerifyParams, ApiError> {
    return decodeRequestBody(body, VerifyParams.asDecoder());
  }
  async handle({
    auth,
  }: ApiRequest<VerifyParams>): Promise<ApiResponse<VerifyResult>> {
    if (auth == null)
      return ApiError.of(
        "AuthenticationFailed",
        "Invalid authorization header"
      ).response();
    const result = await this.accounts.exec((m) => m.verifyToken(auth.jwt));
    return result.isFailure()
      ? ApiError.by(result.error).response()
      : {
          status: Status.Ok,
          body: { tag: "Success", accountId: result.value },
        };
  }
}

export const jwtRouter = () => {
  const router = express.Router();
  router.post("/issue", new IssueHandler(AppModel.accounts).handler());
  router.post("/verify", new VerifyHandler(AppModel.accounts).handler());
  return router;
};
