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

test("DijkstraPathFinder throws when departure planet is missing from the graph", () => {
  const graph = UniverseGraph.fromRoutes([
    { origin: "Dagobah", destination: "Endor", travelTime: 4 } as never,
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

test("DijkstraPathFinder can take a jump that exactly matches autonomy without refueling", () => {
  const graph = UniverseGraph.fromRoutes([
    { origin: "Tatooine", destination: "Endor", travelTime: 6 } as never,
  ]);
  const pathFinder = new DijkstraPathFinder(graph, {
    autonomy: 6,
    departure: "Tatooine",
  });

  const result = pathFinder.findShortestPath("Endor");

  assert.deepEqual(result, {
    duration: 6,
    route: ["Tatooine", "Endor"],
  });
});

test("DijkstraPathFinder ignores edges longer than total autonomy", () => {
  const graph = UniverseGraph.fromRoutes([
    { origin: "Tatooine", destination: "Dagobah", travelTime: 7 } as never,
    { origin: "Dagobah", destination: "Endor", travelTime: 1 } as never,
    { origin: "Tatooine", destination: "Hoth", travelTime: 3 } as never,
    { origin: "Hoth", destination: "Endor", travelTime: 3 } as never,
  ]);
  const pathFinder = new DijkstraPathFinder(graph, {
    autonomy: 6,
    departure: "Tatooine",
  });

  const result = pathFinder.findShortestPath("Endor");

  assert.deepEqual(result, {
    duration: 6,
    route: ["Tatooine", "Hoth", "Endor"],
  });
});

test("DijkstraPathFinder prefers the lowest duration route over fewer hops", () => {
  const graph = UniverseGraph.fromRoutes([
    { origin: "Tatooine", destination: "Endor", travelTime: 10 } as never,
    { origin: "Tatooine", destination: "Hoth", travelTime: 4 } as never,
    { origin: "Hoth", destination: "Dagobah", travelTime: 1 } as never,
    { origin: "Dagobah", destination: "Endor", travelTime: 1 } as never,
  ]);
  const pathFinder = new DijkstraPathFinder(graph, {
    autonomy: 10,
    departure: "Tatooine",
  });

  const result = pathFinder.findShortestPath("Endor");

  assert.deepEqual(result, {
    duration: 6,
    route: ["Tatooine", "Hoth", "Dagobah", "Endor"],
  });
});

test("DijkstraPathFinder handles cycles without looping forever", () => {
  const graph = UniverseGraph.fromRoutes([
    { origin: "Tatooine", destination: "Hoth", travelTime: 2 } as never,
    { origin: "Hoth", destination: "Dagobah", travelTime: 2 } as never,
    { origin: "Dagobah", destination: "Tatooine", travelTime: 2 } as never,
    { origin: "Dagobah", destination: "Endor", travelTime: 1 } as never,
  ]);
  const pathFinder = new DijkstraPathFinder(graph, {
    autonomy: 6,
    departure: "Tatooine",
  });

  const result = pathFinder.findShortestPath("Endor");

  assert.deepEqual(result, {
    duration: 3,
    route: ["Tatooine", "Dagobah", "Endor"],
  });
});

test("DijkstraPathFinder keeps distinct states for the same planet with different autonomy", () => {
  const graph = UniverseGraph.fromRoutes([
    { origin: "Tatooine", destination: "Alderaan", travelTime: 2 } as never,
    { origin: "Alderaan", destination: "Hoth", travelTime: 1 } as never,
    { origin: "Tatooine", destination: "Bespin", travelTime: 1 } as never,
    { origin: "Bespin", destination: "Hoth", travelTime: 1 } as never,
    { origin: "Hoth", destination: "Endor", travelTime: 2 } as never,
  ]);
  const pathFinder = new DijkstraPathFinder(graph, {
    autonomy: 3,
    departure: "Tatooine",
  });

  const result = pathFinder.findShortestPath("Endor");

  assert.deepEqual(result, {
    duration: 5,
    route: ["Tatooine", "Bespin", "Hoth", "Endor"],
  });
});

test("DijkstraPathFinder chooses the lower total duration route between a direct path and a longer alternate path", () => {
  const graph = UniverseGraph.fromRoutes([
    { origin: "Tatooine", destination: "Hoth", travelTime: 4 } as never,
    { origin: "Hoth", destination: "Endor", travelTime: 4 } as never,
    { origin: "Tatooine", destination: "Dagobah", travelTime: 3 } as never,
    { origin: "Dagobah", destination: "Bespin", travelTime: 3 } as never,
    { origin: "Bespin", destination: "Endor", travelTime: 2 } as never,
  ]);
  const pathFinder = new DijkstraPathFinder(graph, {
    autonomy: 6,
    departure: "Tatooine",
  });

  const result = pathFinder.findShortestPath("Endor");

  assert.deepEqual(result, {
    duration: 9,
    route: ["Tatooine", "Dagobah", "Bespin", "Endor"],
  });
});
