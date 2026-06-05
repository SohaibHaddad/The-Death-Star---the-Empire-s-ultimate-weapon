import assert from "node:assert/strict";
import test from "node:test";
import { UniverseGraph } from "./UniverseGraph.js";

test("UniverseGraph creates bidirectional nodes from route entities", () => {
  const graph = UniverseGraph.fromRoutes([
    {
      origin: "Tatooine",
      destination: "Hoth",
      travelTime: 6,
    } as never,
  ]);

  const tatooine = graph.getNode("Tatooine");
  const hoth = graph.getNode("Hoth");

  assert.ok(tatooine);
  assert.ok(hoth);
  assert.deepEqual(
    tatooine.getConnections().map((connection) => ({
      destination: connection.destination.name,
      travelTime: connection.travelTime,
    })),
    [{ destination: "Hoth", travelTime: 6 }],
  );
  assert.deepEqual(
    hoth.getConnections().map((connection) => ({
      destination: connection.destination.name,
      travelTime: connection.travelTime,
    })),
    [{ destination: "Tatooine", travelTime: 6 }],
  );
});
