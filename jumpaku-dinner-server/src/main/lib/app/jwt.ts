import { failure, Result, resultOf, success } from "../common/result";
import jwt from "jsonwebtoken";
import { BaseError } from "make-error-cause";
import * as typing from "io-ts";

export class JwtError extends BaseError {
  name: string = "JwtError";
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
  toString() {
    return `${this.name}: ${this.message}`;
  }
}

export type IssueOptions = jwt.SignOptions & {
  algorithm: Exclude<jwt.SignOptions["algorithm"], undefined>;
  subject: NonNullable<jwt.SignOptions["subject"]>;
  issuer: NonNullable<jwt.SignOptions["issuer"]>;
  audience: NonNullable<jwt.SignOptions["audience"]>;
  expiresIn: NonNullable<jwt.SignOptions["expiresIn"]>;
  notBefore: NonNullable<jwt.SignOptions["notBefore"]>;
};
export type VerifyOptions = jwt.VerifyOptions & {
  subject: NonNullable<jwt.SignOptions["subject"]>;
  issuer: NonNullable<jwt.SignOptions["issuer"]>;
  audience: NonNullable<jwt.SignOptions["audience"]>;
};
export const JwtPayload = typing.type({
  sub: typing.string,
  iss: typing.string,
  aud: typing.string,
  exp: typing.number,
  iat: typing.number,
  nbf: typing.number,
  data: typing.type({ accountId: typing.number }),
});
export type JwtPayload = typing.TypeOf<typeof JwtPayload>;

export const JwtElement = typing.type({
  jwt: typing.string,
});
export type JwtElement = typing.TypeOf<typeof JwtElement>;

export class Jwt {
  constructor(
    private readonly secret: string,
    readonly issueOption: IssueOptions,
    readonly verifyOption: VerifyOptions
  ) {}
  issue(
    data: JwtPayload["data"],
    options: IssueOptions = this.issueOption
  ): string {
    return jwt.sign({ data }, this.secret, options);
  }

  verify(
    token: string,
    options: VerifyOptions = this.verifyOption
  ): Result<JwtPayload["data"], JwtError> {
    return resultOf(
      () => jwt.verify(token, this.secret, options),
      (e) => {
        if (e instanceof jwt.JsonWebTokenError)
          return new JwtError(e.message, e);
        else throw e;
      }
    ).flatMap((value) => {
      const decoded = JwtPayload.decode(value);
      return decoded._tag === "Right"
        ? success(decoded.right.data)
        : failure(
            new JwtError(`Invalid JWT payload: data must be ${JwtPayload.name}`)
          );
    });
  }

  /*update(token: string): Result<string, JwtError> {
    return this.verify(token, {
      ...this.verifyOption,
      ignoreExpiration: true,
    }).map((user) => this.issue(user, this.issueOption));
  }*/
}
