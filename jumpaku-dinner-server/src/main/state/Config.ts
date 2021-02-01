import T from "io-ts";
import { DeepPartial, DeepRequired } from "ts-essentials";

const ConfigOption = T.type({
  url: T.string,
  database: T.type({
    name: T.string,
    user: T.string,
    password: T.string,
    host: T.string,
    port: T.number,
  }),
  jwt: T.type({
    secretKey: T.string,
    subject: T.string,
    issuer: T.string,
    audience: T.string,
    expiresIn: T.number,
    notBefore: T.number,
  }),
  logging: T.type({
    level: T.union([
      T.literal("trace"),
      T.literal("debag"),
      T.literal("info"),
      T.literal("warn"),
      T.literal("error"),
      T.literal("fatal"),
    ]),
  }),
});

export type Config = DeepPartial<T.TypeOf<typeof ConfigOption>> & {
  url: string;
  database: { name: string; user: string; password: string };
  jwt: { secretKey: string };
};

export function fillConfig(config: Config): DeepRequired<Config> {
  return {
    url: config.url,
    database: {
      name: config.database.name,
      user: config.database.user,
      password: config.database.password,
      host: config.database.host ?? "localhost",
      port: config.database.port ?? 5432,
    },
    jwt: {
      secretKey: config.jwt.secretKey,
      subject: config.jwt.subject ?? `${config.url}/v2`,
      issuer: config.jwt.subject ?? `${config.url}/v2/token`,
      audience: config.jwt.subject ?? `${config.url}/v2`,
      expiresIn: config.jwt.expiresIn ?? 60 * 60,
      notBefore: config.jwt.notBefore ?? 60,
    },
    logging: {
      level: config.logging?.level ?? "info",
    },
  };
}
