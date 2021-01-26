import { failure, Result, success } from "./lib/common/result";
import { AppDatabasePool as db } from "./AppDatabasePool";
import { Accounts } from "./lib/app/accounts/Accounts";
import { ConnectionConfig } from "./lib/database/db";

export async function initialize(
  config: ConnectionConfig
): Promise<Result<void, Error>> {
  const database = db.configure(config);
  return Promise.all([Accounts.initialize(database)]).then((results) =>
    results.reduce((r0, r1) => r0.and(r1))
  );
}
