import * as typing from "io-ts";
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

export const User = typing.type({
  id: typing.number,
  loginId: typing.string,
  passwordHash: typing.string,
  displayName: typing.string,
});

export type User = typing.TypeOf<typeof User>;

const UserColumns = {
  id: "id",
  loginId: "login_id",
  passwordHash: "password_hash",
  displayName: "display_name",
} as const;

export const CreateUserParams = typing.type({
  loginId: typing.string,
  password: typing.string,
  displayName: typing.string,
});
export type CreateUserParams = typing.TypeOf<typeof CreateUserParams>;
export type CreateUserResult = { loginId: string; displayName: string };

export class Users extends TableAccess<User, typeof UserColumns> {
  constructor(database: Database) {
    super(
      database,
      "users",
      UserColumns,
      sql`CREATE TABLE IF NOT EXISTS ${"users"} (
      ${UserColumns.id} SERIAL,
      ${UserColumns.loginId} TEXT UNIQUE,
      ${UserColumns.passwordHash} TEXT,
      ${UserColumns.displayName} TEXT);`
    );
  }

  async createUser({
    loginId,
    password,
    displayName,
  }: CreateUserParams): Promise<Result<CreateUserResult, AppError<unknown>>> {
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
          "InvalidRequest",
          "Request validation failed",
          [loginIdError, passwordError, displayNameError].filter(
            (it) => it != null
          )
        )
      );
    }
    const passwordHash = await bcrypt.hash(passwordValue, 10);
    const insertUser = sql`
      INSERT INTO ${this.name} (${this.columns.loginId},${this.columns.passwordHash}, ${this.columns.displayName}) 
      VALUES ($1, $2, $3)
      RETURNING *;
    `.with(loginIdValue, passwordHash, displayNameValue);

    const appErrorLoginIdAlreadyExists = (
      e: unknown
    ): Result<never, AppError<unknown>> => {
      if (e instanceof PostgresError)
        if (e.code === IntegrityConstraintViolation.unique_violation)
          return failure(
            AppError.by(e, "InvalidState", "loginId already exists")
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
}

function appErrorOnDatabase(e: unknown): Result<never, AppError<Error>> {
  if (
    e instanceof DatabaseError ||
    e instanceof pg.errors.ParameterizedQueryError ||
    e instanceof pg.errors.PreparedStatementError ||
    e instanceof pg.errors.QueryFileError ||
    e instanceof pg.errors.QueryResultError
  ) {
    return failure(AppError.by(e, "DatabaseError"));
  }
  throw e;
}
