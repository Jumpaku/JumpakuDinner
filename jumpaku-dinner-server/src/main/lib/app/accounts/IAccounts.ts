import * as typing from "io-ts";
import { Result } from "../../common/result";
import { AppError } from "../AppError";
import * as JWT from "../jwt";

export const Account = typing.type({
  id: typing.number,
  loginId: typing.string,
  passwordHash: typing.string,
  displayName: typing.string,
  status: typing.union([typing.literal("OPEN"), typing.literal("CLOSED")]),
});

export type Account = typing.TypeOf<typeof Account>;

export const CreateAccountParams = typing.type({
  loginId: typing.string,
  password: typing.string,
  displayName: typing.string,
});
export type CreateAccountParams = typing.TypeOf<typeof CreateAccountParams>;
export type CreateAccountResult = { loginId: string; displayName: string };

export const CloseAccountParams = JWT.JwtElement;
export type CloseAccountParams = typing.TypeOf<typeof CloseAccountParams>;
export type CloseAccountResult = {};

export const SignTokenParams = typing.type({
  loginId: typing.string,
  password: typing.string,
});
export type SignTokenParams = typing.TypeOf<typeof SignTokenParams>;
export type SignTokenResult = JWT.JwtElement;

export const VerifyTokenParams = JWT.JwtElement;
export type VerifyTokenParams = typing.TypeOf<typeof VerifyTokenParams>;
export type VerifyTokenResult = {};

export interface IAccounts {
  create({
    loginId,
    password,
    displayName,
  }: CreateAccountParams): Promise<Result<CreateAccountResult, AppError>>;
  close({
    jwt,
  }: CloseAccountParams): Promise<Result<CloseAccountResult, AppError>>;
  signToken({
    loginId,
    password,
  }: SignTokenParams): Promise<Result<SignTokenResult, AppError>>;
  verifyToken({
    jwt,
  }: VerifyTokenParams): Promise<Result<VerifyTokenResult, AppError>>;
}
