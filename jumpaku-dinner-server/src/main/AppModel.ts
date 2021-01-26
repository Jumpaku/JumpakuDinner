import { AppDatabasePool } from "./AppDatabasePool";
import { Accounts } from "./lib/app/accounts/Accounts";
import { Jwt } from "./lib/app/jwt";

const jwt = new Jwt(
  "secret key",
  {
    algorithm: "HS512",
    subject: "https://dinner.jumpaku.net/v2",
    issuer: "https://dinner.jumpaku.net/v2/token",
    audience: "https://dinner.jumpaku.net/v2",
    expiresIn: 60 * 60 * 24 * 2,
    notBefore: 60,
  },
  {
    algorithms: ["HS512"],
    subject: "https://dinner.jumpaku.net/v2",
    issuer: "https://dinner.jumpaku.net/v2/token",
    audience: "https://dinner.jumpaku.net/v2",
  }
);
export const AppModel = {
  accounts: new Accounts(AppDatabasePool.get(), jwt),
};
