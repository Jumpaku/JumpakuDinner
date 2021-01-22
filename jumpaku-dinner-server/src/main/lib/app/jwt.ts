import { failure, Result, resultOf, success } from "../common/result";
import jwt from "jsonwebtoken";
import { BaseError } from "make-error-cause";
import * as typing from "io-ts";

class JwtError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

type SignOptions = jwt.SignOptions;
type VerifyOptions = jwt.VerifyOptions;

const secret = "secret key";
const SignOption = {
  algorithm: "HS512",
  issuer: "https://dinner.jumpaku.net",
  expiresIn: 60 * 60 * 24 * 2,
} as const;

const VerifyOption: VerifyOptions = {
  algorithms: [SignOption.algorithm],
};

const UpdateOption: VerifyOptions = {
  algorithms: [SignOption.algorithm],
  ignoreExpiration: true,
};

export const JwtElement = typing.type({
  jwt: typing.string,
});
export type JwtElement = typing.TypeOf<typeof JwtElement>;

export function sign(
  login_id: string,
  options: SignOptions = SignOption
): string {
  return jwt.sign({ aud: login_id }, secret, options);
}

export function verify(
  token: string,
  options: VerifyOptions = VerifyOption
): Result<string, JwtError> {
  return resultOf(
    () => jwt.verify(token, secret, options),
    (e) => {
      if (e instanceof jwt.JsonWebTokenError) return new JwtError(e.message, e);
      else throw e;
    }
  ).flatMap((value) =>
    typeof value === "string"
      ? success(value)
      : failure(new JwtError("JWT payload type must be a loginId string"))
  );
}

export function update(token: string): Result<string, JwtError> {
  return verify(token, UpdateOption).map((user) => sign(user, SignOption));
}
