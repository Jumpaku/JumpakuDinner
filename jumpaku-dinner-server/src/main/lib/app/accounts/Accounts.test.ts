import { describe, expect, test, it } from "@jest/globals";
import { sql } from "../../database/sql";
import { connect, Database } from "./../../database/db";
import {
  Account,
  CreateAccountParams,
  CreateAccountResult,
} from "../accounts/IAccounts";
import { Accounts } from "../accounts/Accounts";
import { AppError } from "../AppError";
import { Jwt } from "../jwt";

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
  accounts: readonly Omit<Account, "id">[]
): Promise<void> {
  await (db as Database).none(
    sql`CREATE TABLE IF NOT EXISTS accounts (
            id SERIAL,
            login_id TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status='OPEN' OR status='CLOSED'));`
  );
  await Promise.all(
    accounts.map(
      async ({ loginId, passwordHash, displayName, status }) =>
        await (db as Database).none(
          sql`INSERT INTO accounts (login_id, password_hash, display_name,  status) 
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
  const rows = await (db as Database).any<{
    id: number;
    login_id: string;
    password_hash: string;
    display_name: string;
    status: "OPEN" | "CLOSED";
  }>(sql`SELECT * FROM accounts;`);
  return rows.map((row) => {
    const account = Account.decode({
      id: row["id"],
      loginId: row["login_id"],
      displayName: row["display_name"],
      passwordHash: row["password_hash"],
      status: row["status"],
    });
    if (account._tag === "Left") throw new Error("Failed selectAll");
    return account.right;
  });
}

beforeEach(() => {
  return createAndInsert([]);
});

afterEach(() => {
  return dropTable();
});

describe("Accounts", () => {
  function accounts() {
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
    );
  }
  describe("initialize()", () => {
    it("creates a table 'accounts' if the table dose not exist", async () => {
      await dropTable();
      const a = await Accounts.initialize(db as Database);
      expect(a.isSuccess()).toEqual(true);
      expect(await selectAll()).toEqual([]);
    });
    it("does nothing if table exists", async () => {
      const a = await Accounts.initialize(db as Database);
      expect(a.isSuccess()).toEqual(true);
      expect(await selectAll()).toEqual([]);
    });
  });
  describe("create()", () => {
    const params = {
      loginId: "Login-id-123@example.com",
      displayName: "表 示 名",
      password:
        " 1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM`-=[];',.\\~!@#$%^&*()_+{}|:\"<>?",
    };
    function assertValidationError(error: any) {
      expect(error.name).toEqual("AppError");
      expect(error.type).toEqual("InvalidParams");
      expect(error.message).toEqual("Request validation failed");
    }
    function assertUniquenessError(error: any) {
      expect(error.name).toEqual("AppError");
      expect(error.type).toEqual("InvalidState");
      expect(error.message).toEqual("loginId is not available");
    }
    function assertValue<
      R extends {
        loginId: string;
        displayName: string;
        status: "OPEN" | "CLOSED";
      }
    >(actual: any, expected: R) {
      expect(actual.loginId).toEqual(expected.loginId);
      expect(actual.displayName).toEqual(expected.displayName);
      expect(actual.status).toEqual(expected.status);
    }
    it("creates a new account", async () => {
      const { value, error } = await accounts().create(params);
      expect(value).toEqual({
        loginId: params.loginId,
        displayName: params.displayName,
      });
      const [row] = await selectAll();
      assertValue(row, { ...params, status: "OPEN" });
    });
    it("fails creation if table 'accounts' is removed", async () => {
      await dropTable();
      const { value, error } = await accounts().create(params);
      expect(error?.name).toEqual("AppError");
      expect(error?.type).toEqual("DatabaseError");
    });
    describe("loginId validations", () => {
      it("creates a new account with loginId of length 1", async () => {
        const p = { ...params, loginId: "A" };
        const { value, error } = await accounts().create(p);
        expect(value).toEqual({
          loginId: p.loginId,
          displayName: p.displayName,
        });
        const [row] = await selectAll();
        assertValue(row, { ...p, status: "OPEN" });
      });
      it("creates a new account with loginId of length 50", async () => {
        const p = {
          ...params,
          loginId: "123456789_123456789_123456789_123456789_123456789_",
        };
        const { value, error } = await accounts().create(p);
        expect(value).toEqual({
          loginId: p.loginId,
          displayName: p.displayName,
        });
        const [row] = await selectAll();
        assertValue(row, { ...p, status: "OPEN" });
      });
      it("fails creation if loginId is empty", async () => {
        const { value, error } = await accounts().create({
          ...params,
          loginId: "",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
      });
      it("fails creation if loginId contains a space", async () => {
        const { value, error } = await accounts().create({
          ...params,
          loginId: "1235678 gbnwm",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
      });
      it("fails creation if loginId contains a \n", async () => {
        const { value, error } = await accounts().create({
          ...params,
          loginId: "1235678\ngbnwm",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
      });
      it("fails creation if loginId length is greater then 50", async () => {
        const { value, error } = await accounts().create({
          ...params,
          loginId: "123456789_123456789_123456789_123456789_123456789_X",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
      });
      it("fails creation if loginId contains non ASCII characters", async () => {
        const { value, error } = await accounts().create({
          ...params,
          loginId: "ログインID",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
      });
    });
    describe("password validations", () => {
      it("creates a new account with password of length 8", async () => {
        const p = { ...params, password: "12345678" };
        const { value, error } = await accounts().create(p);
        expect(value).toEqual({
          loginId: p.loginId,
          displayName: p.displayName,
        });
        const [row] = await selectAll();
        assertValue(row, { ...p, status: "OPEN" });
      });
      it("creates a new account with password of length 128", async () => {
        const p = {
          ...params,
          password:
            "AAAAAAAAA_BBBBBBBBB_CCCCCCCCC_DDDDDDDDD_EEEEEEEEE_FFFFFFFFF_GGGGGGGGG_HHHHHHHHH_IIIIIIIII_JJJJJJJJJ_KKKKKKKKK_LLLLLLLLL_12345678",
        };
        const { value, error } = await accounts().create(p);
        expect(value).toEqual({
          loginId: p.loginId,
          displayName: p.displayName,
        });
        const [row] = await selectAll();
        assertValue(row, { ...p, status: "OPEN" });
      });
      it("creates a new account with password contains spaces", async () => {
        const p = {
          ...params,
          password: "1 2 3 4 5 6 7 8 9 0",
        };
        const { value, error } = await accounts().create(p);
        expect(value).toEqual({
          loginId: p.loginId,
          displayName: p.displayName,
        });
        const [row] = await selectAll();
        assertValue(row, { ...p, status: "OPEN" });
      });
      it("fails creation if password contains non ASCII characters", async () => {
        const { value, error } = await accounts().create({
          ...params,
          password: "12345_あ_67890",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
      });
      it("fails creation if password contains \n", async () => {
        const { value, error } = await accounts().create({
          ...params,
          password: "12345\n67890",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
      });
      it("fails creation if password length is 7", async () => {
        const { value, error } = await accounts().create({
          ...params,
          password: "1234567",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
      });
      it("fails creation if password length is 129", async () => {
        const { value, error } = await accounts().create({
          ...params,
          password:
            "AAAAAAAAA_BBBBBBBBB_CCCCCCCCC_DDDDDDDDD_EEEEEEEEE_FFFFFFFFF_GGGGGGGGG_HHHHHHHHH_IIIIIIIII_JJJJJJJJJ_KKKKKKKKK_LLLLLLLLL_123456789",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
      });
    });
    describe("displayName validations", () => {
      it("creates a new account with displayName of length 1", async () => {
        const p = { ...params, displayName: "あ" };
        const { value, error } = await accounts().create(p);
        expect(value).toEqual({
          loginId: p.loginId,
          displayName: p.displayName,
        });
        const [row] = await selectAll();
        assertValue(row, { ...p, status: "OPEN" });
      });
      it("creates a new account with displayName of length 50", async () => {
        const p = {
          ...params,
          displayName:
            "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゐゆゑよらりるれろわ＿ー＿を",
        };
        const { value, error } = await accounts().create(p);
        expect(value).toEqual({
          loginId: p.loginId,
          displayName: p.displayName,
        });
        const [row] = await selectAll();
        assertValue(row, { ...p, status: "OPEN" });
      });
      it("fails creation if displayName is empty", async () => {
        const { value, error } = await accounts().create({
          ...params,
          displayName: "",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
      });
      it("fails creation if displayName is 50", async () => {
        const { value, error } = await accounts().create({
          ...params,
          displayName:
            "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゐゆゑよらりるれろわ＿ー＿を！",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
      });
      it("fails creation if displayName contains \n", async () => {
        const { value, error } = await accounts().create({
          ...params,
          displayName: "\n",
        });
        expect(await selectAll()).toEqual([]);
        assertValidationError(error);
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
        const { value, error } = await accounts().create({ ...params });
        const rows = await selectAll();
        expect(rows.length).toEqual(1);
        assertValue(rows[0], r);
        assertUniquenessError(error);
      });
      it("fails creation if CLOSED account already exists", async () => {
        const r = {
          loginId: params.loginId,
          displayName: "A",
          passwordHash: "X",
          status: "CLOSED",
        } as const;
        await createAndInsert([r]);
        const { value, error } = await accounts().create({ ...params });
        const rows = await selectAll();
        expect(rows.length).toEqual(1);
        assertValue(rows[0], r);
        assertUniquenessError(error);
      });
    });
  });
  describe("issueToken()", () => {
    const rows = [
      {
        loginId: "O",
        displayName: "open",
        /* bcript.hash("test-password-0",10) */
        passwordHash:
          "$2b$10$iZIw4t1yv.o1cScRFlcEreKCpjV3zzXYMFNMsd0Y2XYG73RAwnIIG",
        status: "OPEN",
      } as const,
      {
        loginId: "C",
        displayName: "closed",
        /* bcript.hash("test-password-1",10) */
        passwordHash:
          "$2b$10$TUsOd06DnGUkPlLGtH7mu.QTDBH38dEu.0uno8nrnJilfOTC.Yrcm",
        status: "CLOSED",
      } as const,
    ];
    beforeEach(() => {
      return createAndInsert(rows);
    });
    it("issues JWT token", async () => {
      const { value, error } = await accounts().issueToken({
        loginId: "O",
        password: "test-password-0",
      });
      accounts().jwt.verify(value.jwt);
    });
  });
  describe("verifyToken()", () => {});
  describe("close()", () => {
    it("closes an account", async () => {});
  });
});
