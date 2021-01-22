import validator from "validator";
import { JwtElement } from "../app/jwt";
import { failure, Result, success } from "../common/result";
import { ApiError } from "./ApiError";

export function decodeAuthHeader(
  authorization: unknown
): Result<JwtElement, ApiError<unknown>> {
  if (authorization == null)
    return failure(
      new ApiError("AuthenticationFailed", "Authorization header is not given")
    );
  if (typeof authorization !== "string")
    return failure(
      new ApiError(
        "AuthenticationFailed",
        "Authorization header must be string"
      )
    );
  const auth = authorization.trim();
  if (!/^bearer\s+/i.test(auth))
    return failure(
      new ApiError("AuthenticationFailed", "Authorization has no bearer")
    );
  const split = auth.split(/\s+/);
  if (split.length !== 2)
    return failure(new ApiError("InvalidAuthHeader", "Bearer has no token"));
  const [, token] = split;
  if (!validator.isBase64(token, { urlSafe: true }))
    return failure(
      new ApiError("InvalidAuthHeader", "Bearer token is not Base64url")
    );
  return success({ jwt: token });
}
