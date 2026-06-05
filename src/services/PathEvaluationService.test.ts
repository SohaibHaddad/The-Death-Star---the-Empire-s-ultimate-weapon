import assert from "node:assert/strict";
import test from "node:test";
import { PathEvaluationService, RouteNotFoundError } from "./PathEvaluationService.js";

test("PathEvaluationService loads routes once and reuses the graph across evaluations", async () => {
  let findAllCallCount = 0;
  const routeRepository = {
    findAll: async () => {
      findAllCallCount += 1;

      return [
        { origin: "Tatooine", destination: "Hoth", travelTime: 6 },
        { origin: "Hoth", destination: "Endor", travelTime: 1 },
      ];
    },
  };
  const service = await PathEvaluationService.create(
    {
      autonomy: 6,
      departure: "Tatooine",
    },
    routeRepository as never,
  );

  const firstResult = await service.evaluate("Endor");
  const secondResult = await service.evaluate("Endor");

  assert.equal(findAllCallCount, 1);
  assert.deepEqual(firstResult, {
    duration: 8,
    route: ["Tatooine", "Hoth", "Endor"],
  });
  assert.deepEqual(secondResult, {
    duration: 8,
    route: ["Tatooine", "Hoth", "Endor"],
  });
});

test("PathEvaluationService maps missing routes to RouteNotFoundError", async () => {
  const service = await PathEvaluationService.create(
    {
      autonomy: 6,
      departure: "Tatooine",
    },
    {
      findAll: async () => [{ origin: "Tatooine", destination: "Hoth", travelTime: 6 }],
    } as never,
  );

  await assert.rejects(() => service.evaluate("Endor"), RouteNotFoundError);
});
