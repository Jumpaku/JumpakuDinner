import { connect, ConnectionConfig, Database } from "./lib/database/db";

let appDatabase: Database | undefined;

export const AppDatabasePool = {
  isConfigured: (): boolean => appDatabase != null,

  configure: (options: ConnectionConfig): Database => {
    if (appDatabase != null)
      throw new Error("App database initialization is  repeated");
    return connect(options)
      .onSuccess((db) => (appDatabase = db))
      .orThrow();
  },

  get: (): Database => {
    if (appDatabase == null) throw new Error("App database is not initialized");
    return appDatabase;
  },
};
