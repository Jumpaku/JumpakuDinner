import { getLogger, Logger } from "log4js";
import { DeepReadonly, DeepRequired } from "ts-essentials";
import { Accounts } from "../app/accounts/Accounts";
import { Jwt } from "../app/accounts/jwt";
import { AppError } from "../app/AppError";
import { failure, Result, success } from "../common/result";
import { connect, Database } from "../database/db";
import { Config, fillConfig } from "./Config";

export type AppState = DeepRequired<{
  database: () => Database;
  logger: () => Logger;
  accounts: () => Accounts;
}>;

export const createAppState = async (
  config: DeepReadonly<Config>
): Promise<
  Result<{ config: Config; state: DeepReadonly<AppState> }, AppError>
> => {
  const filled = fillConfig(config);
  const db = connect(config.database);
  if (db.isFailure()) return failure(AppError.by(db.error));
  const jwt = new Jwt(
    filled.jwt.secretKey,
    { ...filled.jwt, algorithm: "HS512" },
    { ...filled.jwt, algorithms: ["HS512"] }
  );
  const logger = getLogger();
  logger.level = filled.logging.level;
  const accounts = new Accounts(db.value, jwt);
  const inits = await Promise.all([Accounts.init(db.value)]).then((it) =>
    it.reduce((r0, r1) => r0.and(r1))
  );
  if (inits.isFailure()) return failure(AppError.by(inits.error));
  return success({
    config: filled,
    state: {
      database: () => db.value,
      logger: () => logger,
      accounts: () => accounts,
    },
  });
};
