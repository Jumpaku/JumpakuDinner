import { Status } from "../status";
import { ApiError } from "../ApiError";
import { ApiHandler, ApiRequest, ApiResponse } from "../ApiHandler";
import { Result, success } from "../../common/Result";
import { AppError } from "../../app/AppError";
import { AppState } from "../../state/AppState";

type CloseParams = undefined;
type CloseResult = {};
export class CloseHandler extends ApiHandler<CloseParams, CloseResult> {
  constructor(readonly state: AppState) {
    super(state, true);
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
    const result = await this.state.accounts().exec(async (m) => {
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
