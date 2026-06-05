import assert from "node:assert/strict";
import test from "node:test";
import { UniverseGraph } from "../domaine-entities/UniverseGraph.js";
import { DijkstraPathFinder } from "./DijkstraPathFinder.js";

test("DijkstraPathFinder returns the README example route", () => {
  const graph = UniverseGraph.fromRoutes([
    { origin: "Tatooine", destination: "Dagobah", travelTime: 6 } as never,
    { origin: "Dagobah", destination: "Endor", travelTime: 4 } as never,
    { origin: "Dagobah", destination: "Hoth", travelTime: 1 } as never,
    { origin: "Hoth", destination: "Endor", travelTime: 1 } as never,
    { origin: "Tatooine", destination: "Hoth", travelTime: 6 } as never,
  ]);
  const pathFinder = new DijkstraPathFinder(graph, {
    autonomy: 6,
    departure: "Tatooine",
  });

  const result = pathFinder.findShortestPath("Endor");

  assert.deepEqual(result, {
    duration: 8,
    route: ["Tatooine", "Hoth", "Endor"],
  });
});

test("DijkstraPathFinder throws when no route exists", () => {
  const graph = UniverseGraph.fromRoutes([
    { origin: "Tatooine", destination: "Dagobah", travelTime: 7 } as never,
  ]);
  const pathFinder = new DijkstraPathFinder(graph, {
    autonomy: 6,
    departure: "Tatooine",
  });

  assert.throws(
    () => pathFinder.findShortestPath("Endor"),
    /No route found from Tatooine to Endor\./,
  );
});

test("DijkstraPathFinder returns zero duration when departure equals arrival", () => {
  const graph = UniverseGraph.fromRoutes([
    { origin: "Tatooine", destination: "Hoth", travelTime: 6 } as never,
  ]);
  const pathFinder = new DijkstraPathFinder(graph, {
    autonomy: 6,
    departure: "Tatooine",
  });

  const result = pathFinder.findShortestPath("Tatooine");

  assert.deepEqual(result, {
    duration: 0,
    route: ["Tatooine"],
  });
});
