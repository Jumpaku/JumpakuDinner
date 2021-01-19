import { failure, Result, success } from "./lib/common/result";
import { AppDatabasePool as db } from "./state";
import { Users } from "./lib/app/users/Users";
import { ConnectionConfig } from "./lib/database/db";

export const initialize: (
  config: ConnectionConfig
) => Promise<Result<void, Error>> = (config) => {
  const catchError = (e: unknown) =>
    failure(new Error(`Database initialization failed: ${JSON.stringify(e)}`));
  return new Promise<Result<void, Error>>((resolve, reject) => {
    const initialization = Promise.all([
      new Users(db.configure(config)).createTable(),
    ])
      .then(() => success(undefined))
      .catch((e) => catchError(e));
    resolve(initialization);
  });
};