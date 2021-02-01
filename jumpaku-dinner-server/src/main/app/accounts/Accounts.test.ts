import { describe, expect, test, it } from "@jest/globals";
import { sql } from "../../database/sql";
import { connect, Database } from "./../../database/db";
import { IAccountsModel } from "../accounts/IAccounts";
import { Accounts, Account, AccountRow } from "../accounts/Accounts";
import { Jwt } from "./jwt";
import { AppError } from "../AppError";
import { Result } from "../../common/result";

let db: unknown;
beforeAll(() => {
  db = connect({
    host: "test-db",
    user: "postgres_user",
    password: "postgres_password",
    database: "postgres_database",
  }).orThrow();
});

async function dropTable(): Promise<void> {
  await (db as Database).none(sql`DROP TABLE IF EXISTS accounts;`);
}

async function createAndInsert(
  accounts: readonly Omit<Account, "accountId">[]
): Promise<void> {
  await (db as Database).none(
    sql`CREATE TABLE IF NOT EXISTS accounts (
            account_id SERIAL,
            login_id TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status='OPEN' OR status='CLOSED'));`
  );
  await Promise.all(
    accounts.map(
      async ({ loginId, passwordHash, displayName, status }) =>
        await (db as Database).none(
          sql`INSERT INTO accounts (login_id, password_hash, display_name, status) 
                VALUES ($1, $2, $3, $4);`.with(
            loginId,
            passwordHash,
            displayName,
            status
          )
        )
    )
  );
}

async function selectAll(): Promise<Account[]> {
  const rows = await (db as Database).any<AccountRow>(
    sql`SELECT * FROM accounts;`
  );
  return rows.map(
    (row) =>
      ({
        accountId: row["account_id"],
        loginId: row["login_id"],
        displayName: row["display_name"],
        passwordHash: row["password_hash"],
        status: row["status"],
      } as const)
  );
}

beforeEach(() => createAndInsert([]));
afterEach(() => dropTable());

function expectValidationError(error: any) {
  expect(error.name).toEqual("AppError");
  expect(error.type).toEqual("InvalidParams");
  expect(error.message).toEqual("Validation failed");
}
function expectUniquenessError(error: any) {
  expect(error.name).toEqual("AppError");
  expect(error.type).toEqual("InvalidState");
  expect(error.message).toEqual("loginId is not available");
}
function expectAuthenticationError(error: any, message: string) {
  expect(error.name).toEqual("AppError");
  expect(error.type).toEqual("AuthenticationFailed");
  expect(error.message).toEqual(message);
}
function expectValue(
  actual: any,
  expected: {
    loginId: string;
    displayName: string;
    status: "OPEN" | "CLOSED";
  }
) {
  expect(actual.loginId).toEqual(expected.loginId);
  expect(actual.displayName).toEqual(expected.displayName);
  expect(actual.status).toEqual(expected.status);
}

function accounts<T>(f: (m: IAccountsModel) => Promise<Result<T, AppError>>) {
  return new Accounts(
    db as Database,
    new Jwt(
      "secret",
      {
        algorithm: "HS512",
        subject: "test-subject",
        issuer: "test-issuer",
        audience: "test-audience",
        expiresIn: 60 * 60,
        notBefore: -10,
      },
      {
        subject: "test-subject",
        issuer: "test-issuer",
        audience: "test-audience",
      }
    )
  ).exec(f);
}

describe("Accounts.init()", () => {
  it("creates a table 'accounts' if the table dose not exist", async () => {
    await dropTable();
    const a = await Accounts.init(db as Database);
    expect(a.isSuccess()).toEqual(true);
    expect(await selectAll()).toEqual([]);
  });
  it("does nothing if table exists", async () => {
    const a = await Accounts.init(db as Database);
    expect(a.isSuccess()).toEqual(true);
    expect(await selectAll()).toEqual([]);
  });
});

describe("Accounts.create()", () => {
  const params = {
    loginId: "Login-id-123@example.com",
    displayName: "表 示 名",
    password:
      "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM`-=[];',.\\~!@#$%^&*()_+{}|:\"<>? ",
  };
  it("creates a new account", async () => {
    const { value, error } = await accounts((m) => m.create(params));
    expect(value).toEqual(1);
    const [row] = await selectAll();
    expectValue(row, { ...params, status: "OPEN" });
  });
  it("fails creation if table 'accounts' is removed", async () => {
    await dropTable();
    const { value, error } = await accounts((m) => m.create(params));
    expect(error?.name).toEqual("AppError");
    expect(error?.type).toEqual("DatabaseError");
  });
  describe("loginId validations", () => {
    it("creates a new account with loginId of length 1", async () => {
      const p = { ...params, loginId: "A" };
      const { value, error } = await accounts((m) => m.create(p));
      expect(value).toEqual(1);
      const [row] = await selectAll();
      expectValue(row, { ...p, status: "OPEN" });
    });
    it("creates a new account with loginId of length 50", async () => {
      const p = {
        ...params,
        loginId: "123456789_123456789_123456789_123456789_123456789_",
      };
      const { value, error } = await accounts((m) => m.create(p));
      expect(value).toEqual(1);
      const [row] = await selectAll();
      expectValue(row, { ...p, status: "OPEN" });
    });
    it("fails creation if loginId is empty", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          loginId: "",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
    it("fails creation if loginId contains a space", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          loginId: "1235678 gbnwm",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
    it("fails creation if loginId contains a \n", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          loginId: "1235678\ngbnwm",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
    it("fails creation if loginId length is greater then 50", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          loginId: "123456789_123456789_123456789_123456789_123456789_X",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
    it("fails creation if loginId contains non ASCII characters", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          loginId: "ログインID",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
  });
  describe("password validations", () => {
    it("creates a new account with password of length 8", async () => {
      const p = { ...params, password: "12345678" };
      const { value, error } = await accounts((m) => m.create(p));
      expect(value).toEqual(1);
      const [row] = await selectAll();
      expectValue(row, { ...p, status: "OPEN" });
    });
    it("creates a new account with password of length 128", async () => {
      const p = {
        ...params,
        password:
          "AAAAAAAAA_BBBBBBBBB_CCCCCCCCC_DDDDDDDDD_EEEEEEEEE_FFFFFFFFF_GGGGGGGGG_HHHHHHHHH_IIIIIIIII_JJJJJJJJJ_KKKKKKKKK_LLLLLLLLL_12345678",
      };
      const { value, error } = await accounts((m) => m.create(p));
      expect(value).toEqual(1);
      const [row] = await selectAll();
      expectValue(row, { ...p, status: "OPEN" });
    });
    it("creates a new account with password contains spaces", async () => {
      const p = {
        ...params,
        password: "1 2 3 4 5 6 7 8 9 0",
      };
      const { value, error } = await accounts((m) => m.create(p));
      expect(value).toEqual(1);
      const [row] = await selectAll();
      expectValue(row, { ...p, status: "OPEN" });
    });
    it("fails creation if password contains non ASCII characters", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          password: "12345_あ_67890",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
    it("fails creation if password contains \n", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          password: "12345\n67890",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
    it("fails creation if password length is 7", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          password: "1234567",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
    it("fails creation if password length is 129", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          password:
            "AAAAAAAAA_BBBBBBBBB_CCCCCCCCC_DDDDDDDDD_EEEEEEEEE_FFFFFFFFF_GGGGGGGGG_HHHHHHHHH_IIIIIIIII_JJJJJJJJJ_KKKKKKKKK_LLLLLLLLL_123456789",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
  });
  describe("displayName validations", () => {
    it("creates a new account with displayName of length 1", async () => {
      const p = { ...params, displayName: "あ" };
      const { value, error } = await accounts((m) => m.create(p));
      expect(value).toEqual(1);
      const [row] = await selectAll();
      expectValue(row, { ...p, status: "OPEN" });
    });
    it("creates a new account with displayName of length 50", async () => {
      const p = {
        ...params,
        displayName:
          "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゐゆゑよらりるれろわ＿ー＿を",
      };
      const { value, error } = await accounts((m) => m.create(p));
      expect(value).toEqual(1);
      const [row] = await selectAll();
      expectValue(row, { ...p, status: "OPEN" });
    });
    it("fails creation if displayName is empty", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          displayName: "",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
    it("fails creation if displayName is 50", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          displayName:
            "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゐゆゑよらりるれろわ＿ー＿を！",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
    it("fails creation if displayName contains \n", async () => {
      const { value, error } = await accounts((m) =>
        m.create({
          ...params,
          displayName: "\n",
        })
      );
      expect(await selectAll()).toEqual([]);
      expectValidationError(error);
    });
  });
  describe("Account must be unique", () => {
    it("fails creation if OPEN account already exists", async () => {
      const r = {
        loginId: params.loginId,
        displayName: "A",
        passwordHash: "X",
        status: "OPEN",
      } as const;
      await createAndInsert([r]);
      const { value, error } = await accounts((m) => m.create({ ...params }));
      const rows = await selectAll();
      expect(rows.length).toEqual(1);
      expectValue(rows[0], r);
      expectUniquenessError(error);
    });
    it("fails creation if CLOSED account already exists", async () => {
      const r = {
        loginId: params.loginId,
        displayName: "A",
        passwordHash: "X",
        status: "CLOSED",
      } as const;
      await createAndInsert([r]);
      const { value, error } = await accounts((m) => m.create({ ...params }));
      const rows = await selectAll();
      expect(rows.length).toEqual(1);
      expectValue(rows[0], r);
      expectUniquenessError(error);
    });
  });
});

describe("Accounts.close()", () => {
  const rows = [
    {
      loginId: "open-user",
      displayName: "open-user-display-name",
      passwordHash:
        "$2b$10$iZIw4t1yv.o1cScRFlcEreKCpjV3zzXYMFNMsd0Y2XYG73RAwnIIG" /* bcript.hash("test-password-0",10) */,
      status: "OPEN",
    } as const,
    {
      loginId: "closed-user",
      displayName: "closed-user-display-name",
      passwordHash:
        "$2b$10$TUsOd06DnGUkPlLGtH7mu.QTDBH38dEu.0uno8nrnJilfOTC.Yrcm" /* bcript.hash("test-password-1",10) */,
      status: "CLOSED",
    } as const,
  ];
  beforeEach(() => createAndInsert(rows));
  it("closes account if it exists and is open", async () => {
    const a = await accounts((m) => m.close(1));
    expect(a.isSuccess()).toEqual(true);
  });
  it("fails closing if account is already closed", async () => {
    const { error } = await accounts((m) => m.close(2));
    expect(error?.name).toEqual("AppError");
    expect(error?.type).toEqual("ForbiddenOperation");
    expect(error?.message).toEqual("Account is already closed");
  });
  it("fails closing if account is not found", async () => {
    const { error } = await accounts((m) => m.close(3));
    expect(error?.name).toEqual("AppError");
    expect(error?.type).toEqual("TargetNotFound");
    expect(error?.message).toEqual("accountId is not found in database");
  });
  it("fails closing if account is not found", async () => {
    await dropTable();
    const { error } = await accounts((m) => m.close(1));
    expect(error?.name).toEqual("AppError");
    expect(error?.type).toEqual("DatabaseError");
  });
});

describe("Accounts.authenticate()", () => {
  const rows = [
    {
      loginId: "open-user",
      displayName: "open-user-display-name",
      passwordHash:
        "$2b$10$iZIw4t1yv.o1cScRFlcEreKCpjV3zzXYMFNMsd0Y2XYG73RAwnIIG" /* bcript.hash("test-password-0",10) */,
      status: "OPEN",
    } as const,
    {
      loginId: "closed-user",
      displayName: "closed-user-display-name",
      passwordHash:
        "$2b$10$TUsOd06DnGUkPlLGtH7mu.QTDBH38dEu.0uno8nrnJilfOTC.Yrcm" /* bcript.hash("test-password-1",10) */,
      status: "CLOSED",
    } as const,
  ];
  beforeEach(() => createAndInsert(rows));
  it("authenticates loginId", async () => {
    const a = await accounts((m) =>
      m.authenticate({ loginId: "open-user", password: "test-password-0" })
    );
    expect(a.value).toEqual(1);
  });
  it("fails authentication if account is closed", async () => {
    const { error } = await accounts((m) =>
      m.authenticate({ loginId: "closed-user", password: "test-password-1" })
    );
    expectAuthenticationError(error, "loginId is not available");
  });
  it("fails authentication if account is closed", async () => {
    const { error } = await accounts((m) =>
      m.authenticate({ loginId: "wrong-user", password: "test-password-0" })
    );
    expectAuthenticationError(error, "loginId is not available");
  });
  it("fails authentication if password is wrong", async () => {
    const { error } = await accounts((m) =>
      m.authenticate({ loginId: "open-user", password: "wrong-password" })
    );
    expectAuthenticationError(error, "Password mismatch");
  });
  it("fails authentication if table is dropped", async () => {
    await dropTable();
    const { error } = await accounts((m) =>
      m.authenticate({ loginId: "open-user", password: "test-password-0" })
    );
    expect(error?.name).toEqual("AppError");
    expect(error?.type).toEqual("DatabaseError");
  });
});

describe("Accounts.issueToken()", () => {
  const rows = [
    {
      loginId: "open-user",
      displayName: "open-user-display-name",
      passwordHash:
        "$2b$10$iZIw4t1yv.o1cScRFlcEreKCpjV3zzXYMFNMsd0Y2XYG73RAwnIIG" /* bcript.hash("test-password-0",10) */,
      status: "OPEN",
    } as const,
    {
      loginId: "closed-user",
      displayName: "closed-user-display-name",
      passwordHash:
        "$2b$10$TUsOd06DnGUkPlLGtH7mu.QTDBH38dEu.0uno8nrnJilfOTC.Yrcm" /* bcript.hash("test-password-1",10) */,
      status: "CLOSED",
    } as const,
  ];
  beforeEach(() => createAndInsert(rows));
  it("issues JWT token", async () => {
    const a = await accounts((m) => m.issueToken(1));
    expect(a.isSuccess()).toEqual(true);
  });
  it("fails issuing if accountId is absent", async () => {
    const { error } = await accounts((m) => m.issueToken(3));
    expectAuthenticationError(error, "accountId is not available");
  });
  it("fails issuing if account is closed", async () => {
    const { error } = await accounts((m) => m.issueToken(2));
    expectAuthenticationError(error, "accountId is not available");
  });
  it("fails issuing if table 'accounts' is dropped", async () => {
    dropTable();
    const { error } = await accounts((m) => m.issueToken(1));
    expect(error?.name).toEqual("AppError");
    expect(error?.type).toEqual("DatabaseError");
  });
});

describe("Accounts.verifyToken()", () => {
  const rows = [
    {
      loginId: "open-user",
      displayName: "open-user-display-name",
      passwordHash:
        "$2b$10$iZIw4t1yv.o1cScRFlcEreKCpjV3zzXYMFNMsd0Y2XYG73RAwnIIG" /* bcript.hash("test-password-0",10) */,
      status: "OPEN",
    } as const,
    {
      loginId: "closed-user",
      displayName: "closed-user-display-name",
      passwordHash:
        "$2b$10$TUsOd06DnGUkPlLGtH7mu.QTDBH38dEu.0uno8nrnJilfOTC.Yrcm" /* bcript.hash("test-password-1",10) */,
      status: "CLOSED",
    } as const,
  ];
  beforeEach(() => createAndInsert(rows));
  it("verifies token", async () => {
    const { value: token } = await accounts((m) => m.issueToken(1));
    const { value } = await accounts((m) => m.verifyToken(token!!));
    expect(value).toEqual(1);
  });
  it("fails verification if token is invalid", async () => {
    const { error } = await accounts((m) => m.verifyToken("invalid token"!!));
    expectAuthenticationError(error, "Invalid JWT token");
  });
  it("fails verification if account is closed", async () => {
    const { value: token } = await accounts((m) => m.issueToken(1));
    await accounts((m) => m.close(1));
    const { error } = await accounts((m) => m.verifyToken(token!!));
    expectAuthenticationError(error, "Account is not available");
  });
});
