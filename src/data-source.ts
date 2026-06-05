import { DataSource } from "typeorm";
import { Route } from "./database-entities/RouteEntity.js";

const databasePath = process.env.DATABASE_PATH ?? "example/universe.db";

export const appDataSource = new DataSource({
  type: "better-sqlite3",
  database: databasePath,
  entities: [Route],
  migrations: [],
  synchronize: false,
  logging: false,
});
