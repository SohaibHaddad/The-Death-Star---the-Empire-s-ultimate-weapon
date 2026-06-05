import assert from "node:assert/strict";
import test from "node:test";
import { PathEvaluationService } from "./PathEvaluationService.js";

test("PathEvaluationService delegates route loading and path evaluation", async () => {
  const routeRepository = {
    findAll: async () => [
      { origin: "Tatooine", destination: "Hoth", travelTime: 6 },
      { origin: "Hoth", destination: "Endor", travelTime: 1 },
    ],
  };
  const service = new PathEvaluationService(
    {
      autonomy: 6,
      departure: "Tatooine",
    },
    routeRepository as never,
  );

  const result = await service.evaluate("Endor");

  assert.deepEqual(result, {
    duration: 8,
    route: ["Tatooine", "Hoth", "Endor"],
  });
});
