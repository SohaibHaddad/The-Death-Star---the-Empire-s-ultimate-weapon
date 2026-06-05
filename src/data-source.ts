import { DataSource } from "typeorm";
import type { AppConfig } from "./config/loadAppConfig.js";
import { RouteEntity } from "./database-entities/RouteEntity.js";

export function createAppDataSource(config: AppConfig): DataSource {
  return new DataSource({
    type: "better-sqlite3",
    database: config.routesDbPath,
    entities: [RouteEntity],
    migrations: [],
    synchronize: false,
    logging: false,
  });
}
