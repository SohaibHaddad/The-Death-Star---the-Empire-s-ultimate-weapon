import { DataSource } from "typeorm";

const databasePath = process.env.DATABASE_PATH ?? "example/universe.db";

export const appDataSource = new DataSource({
  type: "better-sqlite3",
  database: databasePath,
  entities: [],
  migrations: [],
  synchronize: false,
  logging: false,
});
