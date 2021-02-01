import { Database } from "../../database/db";
import { sql } from "../../database/sql";
import { failure, Result, success } from "../../common/result";
import * as bcrypt from "bcrypt";
import { IntegrityConstraintViolation } from "../../database/pgErrorCodes";
import { AppError, catchAppErrorOnDatabase } from "../AppError";
import {
  validateDisplayName,
  validateLoginId,
  validatePassword,
} from "./validation";
import pg from "pg-promise";
import * as JWT from "./jwt";
import { IAccountsModel, IAccountsExecutor } from "./IAccounts";
import { PostgresDatabaseError } from "../../database/error";

export type AccountRow = {
  account_id: number;
  login_id: string;
  password_hash: string;
  display_name: string;
  status: "OPEN" | "CLOSED";
};
export type Account = {
  accountId: number;
  loginId: string;
  passwordHash: string;
  displayName: string;
  status: "OPEN" | "CLOSED";
};

export const AccountColumns = {
  accountId: "account_id",
  loginId: "login_id",
  passwordHash: "password_hash",
  displayName: "display_name",
  status: "status",
} as const;

export class Accounts implements IAccountsExecutor {
  static readonly tableName = "accounts";
  static init(database: Database): Promise<Result<void, AppError>> {
    return database
      .none(
        sql`
        CREATE TABLE IF NOT EXISTS ${"accounts"} (
          ${AccountColumns.accountId} SERIAL,
          ${AccountColumns.loginId} TEXT UNIQUE NOT NULL,
          ${AccountColumns.passwordHash} TEXT NOT NULL,
          ${AccountColumns.displayName} TEXT NOT NULL,
          ${AccountColumns.status} TEXT NOT NULL CHECK (
          ${AccountColumns.status}='OPEN' OR ${
          AccountColumns.status
        }='CLOSED'));`
      )
      .then(() => success(undefined))
      .catch((e) =>
        catchAppErrorOnDatabase(
          e,
          `Failed database initialization on create table '${this.name}'`
        )
      );
  }
  constructor(
    private readonly database: Database,
    private readonly jwt: JWT.Jwt
  ) {}
  exec<T>(
    f: (model: IAccountsModel) => Promise<Result<T, AppError>>
  ): Promise<Result<T, AppError>> {
    return this.database
      .tx(async (task) => {
        const result = await f(new AccountsModel(task, this.jwt));
        return result.isSuccess()
          ? Promise.resolve(result)
          : Promise.reject(result);
      })
      .catch<Result<T, AppError>>((e) => e);
  }
}

class AccountsModel implements IAccountsModel {
  static executor(database: Database, jwt: JWT.Jwt): IAccountsExecutor {
    return new (class implements IAccountsExecutor {
      exec<T>(
        f: (tasks: IAccountsModel) => Promise<Result<T, AppError>>
      ): Promise<Result<T, AppError>> {
        return database.tx((task) => f(new AccountsModel(task, jwt)));
      }
    })();
  }
  constructor(readonly task: pg.ITask<{}>, readonly jwt: JWT.Jwt) {}

  private validate(param: {
    loginId: string;
    password: string;
    displayName: string;
  }): Result<
    {
      loginId: string;
      password: string;
      displayName: string;
    },
    AppError
  > {
    const loginId = validateLoginId(param.loginId);
    const password = validatePassword(param.password);
    const displayName = validateDisplayName(param.displayName);
    if (loginId.isFailure() || password.isFailure() || displayName.isFailure())
      return failure(
        new AppError(
          "InvalidParams",
          "Request validation failed",
          [loginId.error, password.error, displayName.error].filter(
            (it) => it != null
          )
        )
      );
    return success({
      loginId: loginId.value,
      password: password.value,
      displayName: displayName.value,
    });
  }

  async create(param: {
    loginId: string;
    password: string;
    displayName: string;
  }): Promise<Result<number, AppError>> {
    const validation = this.validate(param);
    if (validation.isFailure())
      return failure(
        AppError.by(validation.error, "InvalidParams", "Validation failed")
      );
    const { loginId, password, displayName } = validation.value;
    const passwordHash = await bcrypt.hash(password, 10);
    const insertUser = sql`
      INSERT INTO ${Accounts.tableName} (${AccountColumns.loginId},${AccountColumns.passwordHash}, ${AccountColumns.displayName}, ${AccountColumns.status}) 
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `.with(loginId, passwordHash, displayName, "OPEN");
    const inserton = this.task
      .one<AccountRow>(insertUser)
      .then((row) => success(row["account_id"]));
    return inserton
      .catch((e) => {
        if (e instanceof PostgresDatabaseError)
          if (e.code === IntegrityConstraintViolation.unique_violation)
            return failure(
              AppError.by(e, "InvalidState", "loginId is not available")
            );
        throw e;
      })
      .catch(catchAppErrorOnDatabase);
  }

  async close(accountId: number): Promise<Result<void, AppError>> {
    return this.task
      .oneOrNone<AccountRow>(
        sql`SELECT * FROM ${Accounts.tableName} WHERE ${AccountColumns.accountId}=$1`.with(
          accountId
        )
      )
      .then(async (row) => {
        if (row == null)
          return failure(
            new AppError("TargetNotFound", "accountId is not found in database")
          );
        if (row.status === "CLOSED")
          return failure(
            new AppError("ForbiddenOperation", "Account is already closed")
          );
        const updateUser = sql`
          UPDATE ${Accounts.tableName} SET ${AccountColumns.status}=$1 WHERE ${AccountColumns.accountId}=$2;
        `.with("CLOSED", accountId);
        return await this.task.none(updateUser).then(() => success(undefined));
      })
      .catch(catchAppErrorOnDatabase);
  }

  async authenticate({
    loginId,
    password,
  }: {
    loginId: string;
    password: string;
  }): Promise<Result<number, AppError>> {
    return this.task
      .oneOrNone<AccountRow>(
        sql`SELECT * FROM ${Accounts.tableName} WHERE ${AccountColumns.loginId}=$1`.with(
          loginId
        )
      )
      .then((row) => {
        if (row == null || row.status === "CLOSED")
          return failure(
            new AppError("AuthenticationFailed", "loginId is not available")
          );
        if (!bcrypt.compareSync(password, row.password_hash))
          return failure(
            new AppError("AuthenticationFailed", "Password mismatch")
          );
        return success(row.account_id);
      })
      .catch(catchAppErrorOnDatabase);
  }

  async issueToken(accountId: number): Promise<Result<string, AppError>> {
    return this.task
      .oneOrNone<AccountRow>(
        sql`SELECT * FROM ${Accounts.tableName} WHERE ${AccountColumns.accountId}=$1;`.with(
          accountId
        )
      )
      .then(async (row) => {
        if (row == null || row.status === "CLOSED")
          return failure(
            new AppError("AuthenticationFailed", "accountId is not available")
          );
        return success(this.jwt.issue({ accountId: row.account_id }));
      })
      .catch(catchAppErrorOnDatabase);
  }

  async verifyToken(jwt: string): Promise<Result<number, AppError>> {
    const verified = this.jwt.verify(jwt);
    if (verified.isFailure())
      return failure(
        AppError.by(verified.error, "AuthenticationFailed", "Invalid JWT token")
      );
    const accountId = verified.value.accountId;
    const selectStatus = sql`SELECT * FROM ${Accounts.tableName} WHERE ${AccountColumns.accountId}=$1`.with(
      accountId
    );
    return this.task
      .oneOrNone<AccountRow>(selectStatus)
      .then((row) => {
        if (row == null || row.status === "CLOSED")
          return failure(
            new AppError("AuthenticationFailed", "Account is not available")
          );
        return success(row.account_id);
      })
      .catch(catchAppErrorOnDatabase);
  }
}
