import { ApiError } from "../ApiError";
import { decodeRequestBody } from "../decodeRequestBody";
import { ApiHandler, ApiRequest, ApiResponse } from "../ApiHandler";
import { Status } from "../status";
import T from "io-ts";
import { JwtElement } from "../../app/accounts/jwt";
import { Result } from "../../common/Result";
import { AppError } from "../../app/AppError";
import { AppState } from "../../state/AppState";

const IssueParams = T.type({
  loginId: T.string,
  password: T.string,
});
type IssueParams = T.TypeOf<typeof IssueParams>;
type IssueResult = JwtElement;
export class IssueHandler extends ApiHandler<IssueParams, IssueResult> {
  constructor(readonly state: AppState) {
    super(state, false);
  }
  parseBody(body: unknown): Result<IssueParams, ApiError> {
    return decodeRequestBody(body, IssueParams.asDecoder());
  }
  async handle({
    params,
  }: ApiRequest<IssueParams>): Promise<ApiResponse<IssueResult>> {
    const result = await this.state.accounts().exec(async (m) => {
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
