import { ApiError } from "../ApiError";
import { decodeRequestBody } from "../decodeRequestBody";
import { ApiHandler, ApiRequest, ApiResponse } from "../ApiHandler";
import { Status } from "../status";
import { JwtElement } from "../../app/accounts/jwt";
import { Result } from "../../common/result";
import { AppState } from "../../state/AppState";

const VerifyParams = JwtElement;
type VerifyParams = JwtElement;
type VerifyResult = { accountId: number };
export class VerifyHandler extends ApiHandler<VerifyParams, VerifyResult> {
  constructor(readonly state: AppState) {
    super(state, true);
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
    const result = await this.state
      .accounts()
      .exec((m) => m.verifyToken(auth.jwt));
    return result.isFailure()
      ? ApiError.by(result.error).response()
      : {
          status: Status.Ok,
          body: { tag: "Success", accountId: result.value },
        };
  }
}
