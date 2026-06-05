import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadAppConfig } from "./loadAppConfig.js";

test("loadAppConfig resolves routes_db relative to the config file", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "falcon-config-"));
  const configPath = path.join(tempDir, "millennium-falcon.json");

  await writeFile(
    configPath,
    JSON.stringify({
      autonomy: 6,
      departure: "Tatooine",
      routes_db: "universe.db",
    }),
  );

  const config = await loadAppConfig(configPath);

  assert.deepEqual(config, {
    autonomy: 6,
    departure: "Tatooine",
    routesDbPath: path.join(tempDir, "universe.db"),
  });
});

test("loadAppConfig rejects invalid autonomy", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "falcon-config-"));
  const configPath = path.join(tempDir, "millennium-falcon.json");

  await writeFile(
    configPath,
    JSON.stringify({
      autonomy: 0,
      departure: "Tatooine",
      routes_db: "universe.db",
    }),
  );

  await assert.rejects(
    () => loadAppConfig(configPath),
    /Configuration field 'autonomy' must be a positive integer\./,
  );
});

test("loadAppConfig rejects invalid departure", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "falcon-config-"));
  const configPath = path.join(tempDir, "millennium-falcon.json");

  await writeFile(
    configPath,
    JSON.stringify({
      autonomy: 6,
      departure: "",
      routes_db: "universe.db",
    }),
  );

  await assert.rejects(
    () => loadAppConfig(configPath),
    /Configuration field 'departure' must be a non-empty string\./,
  );
});

test("loadAppConfig rejects invalid routes_db", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "falcon-config-"));
  const configPath = path.join(tempDir, "millennium-falcon.json");

  await writeFile(
    configPath,
    JSON.stringify({
      autonomy: 6,
      departure: "Tatooine",
      routes_db: "",
    }),
  );

  await assert.rejects(
    () => loadAppConfig(configPath),
    /Configuration field 'routes_db' must be a non-empty string\./,
  );
});

test("loadAppConfig rejects non-object JSON", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "falcon-config-"));
  const configPath = path.join(tempDir, "millennium-falcon.json");

  await writeFile(configPath, JSON.stringify([]));

  await assert.rejects(
    () => loadAppConfig(configPath),
    /Configuration file must contain a JSON object\./,
  );
});
