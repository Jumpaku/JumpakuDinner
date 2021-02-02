import { Result } from "../../common/Result";
import { AppError } from "../AppError";

export interface IAccountsExecutor {
  exec<T>(
    f: (model: IAccountsModel) => Promise<Result<T, AppError>>
  ): Promise<Result<T, AppError>>;
}

export interface IAccountsModel {
  create(param: {
    loginId: string;
    password: string;
    displayName: string;
  }): Promise<Result<number, AppError>>;
  close(accountId: number): Promise<Result<void, AppError>>;
  authenticate(param: {
    loginId: string;
    password: string;
  }): Promise<Result<number, AppError>>;
  issueToken(accountId: number): Promise<Result<string, AppError>>;
  verifyToken(jwt: string): Promise<Result<number, AppError>>;
}
