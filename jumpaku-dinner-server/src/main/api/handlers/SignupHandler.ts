import { Status } from "../status";
import { decodeRequestBody } from "../decodeRequestBody";
import { ApiError } from "../ApiError";
import { ApiHandler, ApiRequest, ApiResponse } from "../ApiHandler";
import T from "io-ts";
import { Result } from "../../common/Result";
import { AppState } from "../../state/AppState";

const SignupParams = T.type({
  loginId: T.string,
  password: T.string,
  displayName: T.string,
});
type SignupParams = T.TypeOf<typeof SignupParams>;
type SignupResult = { accountId: number };
export class SignupHandler extends ApiHandler<SignupParams, SignupResult> {
  constructor(readonly state: AppState) {
    super(state, false);
  }
  parseBody(body: unknown): Result<SignupParams, ApiError> {
    return decodeRequestBody(body, SignupParams.asDecoder());
  }
  async handle({
    params,
  }: ApiRequest<SignupParams>): Promise<ApiResponse<SignupResult>> {
    const result = await this.state.accounts().exec((m) => m.create(params!!));
    return result.isFailure()
      ? ApiError.by(result.error).response()
      : {
          status: Status.Ok,
          body: { tag: "Success", accountId: result.value },
        };
  }
}
