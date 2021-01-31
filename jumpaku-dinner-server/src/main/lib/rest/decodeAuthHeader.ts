import validator from "validator";
import { JwtElement } from "../app/accounts/jwt";
import { failure, Result, success } from "../common/result";
import { ApiError } from "./ApiError";

export function decodeAuthHeader(
  authorization: unknown
): Result<JwtElement, ApiError> {
  if (authorization == null)
    return failure(
      ApiError.of("AuthenticationFailed", "Authorization header is not given")
    );
  if (typeof authorization !== "string")
    return failure(
      ApiError.of("AuthenticationFailed", "Authorization header must be string")
    );
  const auth = authorization.trim();
  if (!/^bearer\s+/i.test(auth))
    return failure(
      ApiError.of("AuthenticationFailed", "Authorization has no bearer")
    );
  const split = auth.split(/\s+/);
  if (split.length !== 2)
    return failure(ApiError.of("InvalidAuthHeader", "Bearer has no token"));
  const [, token] = split;
  if (!validator.isBase64(token, { urlSafe: true }))
    return failure(
      ApiError.of("InvalidAuthHeader", "Bearer token is not Base64url")
    );
  return success({ jwt: token });
}
