import { connect, Database } from "./db";

import { Users } from "../app/users/Users";
let db: Database;

beforeAll(() => {
  connect({
    host: "test-db",
    user: "postgres_user",
    password: "postgres_password",
    database: "postgres_database",
  }).onSuccess((it) => (db = it));
});

describe("Users", () => {
  describe("dropTable", () => {
    it("successfully ends even if no such table exists", async () => {
      const users = new Users(db);
      await users.dropTable();
      const dropping = await users.dropTable();
      expect(dropping.isSuccess()).toEqual(true);
    });
    it("drops existing table ", async () => {
      const users = new Users(db);
      await users.createTable();
      const dropping = await users.dropTable();
      expect(dropping.isSuccess()).toEqual(true);
    });
  });
  describe("createTable", () => {
    it("creates table if no such table exists", async () => {
      const users = new Users(db);
      await users.dropTable();
      const creation = await users.createTable();
      expect(creation.isSuccess()).toEqual(true);
    });
    it("successfully ends even if the table exists", async () => {
      const users = new Users(db);
      await users.createTable();
      const creation = await users.createTable();
      expect(creation.isSuccess()).toEqual(true);
    });
  });
});
