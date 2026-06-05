import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DataSource } from "typeorm";
import { RouteEntity } from "../database-entities/RouteEntity.js";
import { RouteRepository } from "./RouteRepository.js";

test("RouteRepository returns routes ordered by origin and destination", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "route-repository-"));
  const dataSource = new DataSource({
    type: "better-sqlite3",
    database: path.join(tempDir, "routes.db"),
    entities: [RouteEntity],
    synchronize: true,
  });

  await dataSource.initialize();

  try {
    await dataSource.getRepository(RouteEntity).save([
      { origin: "Tatooine", destination: "Hoth", travelTime: 6 },
      { origin: "Dagobah", destination: "Endor", travelTime: 4 },
      { origin: "Dagobah", destination: "Hoth", travelTime: 1 },
    ]);

    const routeRepository = new RouteRepository(dataSource);
    const routes = await routeRepository.findAll();

    assert.deepEqual(
      routes.map((route) => ({
        origin: route.origin,
        destination: route.destination,
        travelTime: route.travelTime,
      })),
      [
        { origin: "Dagobah", destination: "Endor", travelTime: 4 },
        { origin: "Dagobah", destination: "Hoth", travelTime: 1 },
        { origin: "Tatooine", destination: "Hoth", travelTime: 6 },
      ],
    );
  } finally {
    await dataSource.destroy();
  }
});
