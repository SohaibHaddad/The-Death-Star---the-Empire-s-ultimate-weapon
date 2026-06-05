import { readFile } from "node:fs/promises";
import path from "node:path";

type RawAppConfig = {
  autonomy?: unknown;
  departure?: unknown;
  routes_db?: unknown;
};

export type AppConfig = {
  autonomy: number;
  departure: string;
  routesDbPath: string;
};

export async function loadAppConfig(configFilePath: string): Promise<AppConfig> {
  const resolvedConfigFilePath = path.resolve(configFilePath);
  const rawFile = await readFile(resolvedConfigFilePath, "utf8");
  const parsedConfig = parseConfigJson(rawFile);

  const autonomy = parseAutonomy(parsedConfig.autonomy);
  const departure = parseDeparture(parsedConfig.departure);
  const routesDb = parseRoutesDb(parsedConfig.routes_db);
  const routesDbPath = path.resolve(path.dirname(resolvedConfigFilePath), routesDb);

  return {
    autonomy,
    departure,
    routesDbPath,
  };
}

function parseConfigJson(rawFile: string): RawAppConfig {
  const parsed = JSON.parse(rawFile) as unknown;

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Configuration file must contain a JSON object.");
  }

  return parsed as RawAppConfig;
}

function parseAutonomy(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error("Configuration field 'autonomy' must be a positive integer.");
  }

  return value;
}

function parseDeparture(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Configuration field 'departure' must be a non-empty string.");
  }

  return value;
}

function parseRoutesDb(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Configuration field 'routes_db' must be a non-empty string.");
  }

  return value;
}
