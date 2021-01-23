import { Database } from "../../database/db";
import { TableAccess } from "../../database/TableAccess";
import { sql } from "../../database/sql";
import { failure, Result, success } from "../../common/result";
import * as bcrypt from "bcrypt";
import { PostgresError, DatabaseError } from "../../database/error";
import { IntegrityConstraintViolation } from "../../database/pgErrorCodes";
import { AppError } from "../AppError";
import {
  validateDisplayName,
  validateLoginId,
  validatePassword,
} from "./validation";
import pg from "pg-promise";
import * as JWT from "../jwt";
import {
  Account,
  CreateAccountParams,
  CreateAccountResult,
  CloseAccountParams,
  CloseAccountResult,
  SignTokenParams,
  SignTokenResult,
  VerifyTokenParams,
  VerifyTokenResult,
  IAccounts,
} from "./IAccounts";

const AccountColumns = {
  id: "id",
  loginId: "login_id",
  passwordHash: "password_hash",
  displayName: "display_name",
  status: "status",
} as const;

export class Accounts
  extends TableAccess<Account, typeof AccountColumns>
  implements IAccounts {
  constructor(database: Database) {
    super(
      database,
      "accounts",
      AccountColumns,
      sql`
        CREATE TABLE IF NOT EXISTS ${"accounts"} (
          ${AccountColumns.id} SERIAL,
          ${AccountColumns.loginId} TEXT UNIQUE NOT NULL,
          ${AccountColumns.passwordHash} TEXT NOT NULL,
          ${AccountColumns.displayName} TEXT NOT NULL,
          ${AccountColumns.status} TEXT NOT NULL CHECK (
            ${AccountColumns.status}='OPEN' OR ${
        AccountColumns.status
      }='CLOSED');
      `
    );
  }

  async create({
    loginId,
    password,
    displayName,
  }: CreateAccountParams): Promise<Result<CreateAccountResult, AppError>> {
    const { value: loginIdValue, error: loginIdError } = validateLoginId(
      loginId
    );
    const { value: passwordValue, error: passwordError } = validatePassword(
      password
    );
    const {
      value: displayNameValue,
      error: displayNameError,
    } = validateDisplayName(displayName);
    if (loginIdError ?? passwordError ?? displayNameError) {
      return failure(
        new AppError(
          "InvalidParams",
          "Request validation failed",
          [loginIdError, passwordError, displayNameError].filter(
            (it) => it != null
          )
        )
      );
    }
    const passwordHash = await bcrypt.hash(passwordValue, 10);
    const insertUser = sql`
      INSERT INTO ${this.name} (${this.columns.loginId},${this.columns.passwordHash}, ${this.columns.displayName}, ${this.columns.status}) 
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `.with(loginIdValue, passwordHash, displayNameValue, "OPEN");

    const appErrorLoginIdAlreadyExists = (
      e: unknown
    ): Result<never, AppError> => {
      if (e instanceof PostgresError)
        if (e.code === IntegrityConstraintViolation.unique_violation)
          return failure(
            AppError.by(e, "InvalidState", "loginId is not available")
          );

      throw e;
    };
    return this.database
      .one<{ login_id: string; display_name: string }>(insertUser)
      .then((row) =>
        success({ loginId: row["login_id"], displayName: row["display_name"] })
      )
      .catch(appErrorLoginIdAlreadyExists)
      .catch(appErrorOnDatabase);
  }

  async close({
    jwt,
  }: CloseAccountParams): Promise<Result<CloseAccountResult, AppError>> {
    const verified = JWT.verify(jwt);
    if (verified.isFailure())
      return failure(
        AppError.by(verified.error, "AuthenticationFailed", "invalid JWT token")
      );
    const loginId = verified.value;
    return this.database
      .tx(async (task) => {
        const selectStatus = sql`
          SELECT ${this.columns.status} FROM ${this.name} WHERE ${this.columns.loginId}=$1
        `.with(loginId);
        const row = await task.oneOrNone<{ status: Account["status"] }>(
          selectStatus
        );
        if (row == null)
          return failure(
            new AppError("TargetNotFound", "loginId is not found in database")
          );
        if (row.status === "CLOSED")
          return failure(
            new AppError("ForbiddenOperation", "Account already closed")
          );
        const updateUser = sql`
          UPDATE ${this.name} SET ${this.columns.status}=$1 WHERE ${this.columns.loginId}=$2;
        `.with("CLOSED", loginId);
        return task.none(updateUser).then(() => success({}));
      })
      .catch(appErrorOnDatabase);
  }

  async signToken({
    loginId,
    password,
  }: SignTokenParams): Promise<Result<SignTokenResult, AppError>> {
    const selectAccount = sql`
      SELECT ${this.columns.passwordHash}, ${this.columns.status} FROM ${this.name} 
      WHERE ${this.columns.loginId}=$1;
    `.with(loginId);
    const promiseRow = this.database.oneOrNone<{
      password_hash: string;
      status: Account["status"];
    }>(selectAccount);
    return promiseRow
      .then(async (row) => {
        if (row == null)
          return failure(
            new AppError("TargetNotFound", "Specified loginId is not found")
          );
        if (row.status === "CLOSED")
          return failure(
            new AppError("ForbiddenOperation", "Specified loginId cannot login")
          );
        const matched = await bcrypt.compare(password, row.password_hash);
        if (!matched)
          return failure(
            new AppError(
              "AuthenticationFailed",
              "Wrong password for specified loginId"
            )
          );
        return success({ jwt: JWT.sign(loginId) });
      })
      .catch(appErrorOnDatabase);
  }
  async verifyToken({
    jwt,
  }: VerifyTokenParams): Promise<Result<VerifyTokenResult, AppError>> {
    const verified = JWT.verify(jwt);
    if (verified.isFailure())
      return failure(
        AppError.by(verified.error, "ForbiddenAccess", "invalid JWT token")
      );
    const loginId = verified.value;
    return this.database
      .tx(async (task) => {
        const selectStatus = sql`
          SELECT ${this.columns.status} FROM ${this.name} WHERE ${this.columns.loginId}=$1
        `.with(loginId);
        const row = await task.oneOrNone<{ status: Account["status"] }>(
          selectStatus
        );
        if (row == null)
          return failure(
            new AppError("ForbiddenAccess", "loginId is not found in database")
          );
        if (row.status === "CLOSED")
          return failure(
            new AppError("ForbiddenAccess", "Account already closed")
          );
        return success({});
      })
      .catch(appErrorOnDatabase);
  }
}

function appErrorOnDatabase(e: unknown): Result<never, AppError> {
  if (
    e instanceof DatabaseError ||
    e instanceof PostgresError ||
    e instanceof pg.errors.ParameterizedQueryError ||
    e instanceof pg.errors.PreparedStatementError ||
    e instanceof pg.errors.QueryFileError ||
    e instanceof pg.errors.QueryResultError
  )
    return failure(AppError.by(e, "DatabaseError"));
  console.log("TEST", e, (e as any).constructor);

  throw e;
}
