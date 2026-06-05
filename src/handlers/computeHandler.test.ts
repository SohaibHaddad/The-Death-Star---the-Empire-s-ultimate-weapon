import assert from "node:assert/strict";
import test from "node:test";
import { createComputeHandler } from "./computeHandler.js";
import { RouteNotFoundError } from "../services/PathEvaluationService.js";

function createResponseRecorder() {
  return {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
  };
}

test("compute handler returns 400 for invalid payloads", async () => {
  const handler = createComputeHandler({
    evaluate: async () => {
      throw new Error("should not be called");
    },
  } as never);
  const response = createResponseRecorder();

  await handler({ body: {} } as never, response as never);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.payload, {
    error: "Request body must include a non-empty 'arrival' string.",
  });
});

test("compute handler returns 200 with evaluated path", async () => {
  const handler = createComputeHandler({
    evaluate: async (arrival: string) => ({
      duration: 8,
      route: ["Tatooine", arrival],
    }),
  } as never);
  const response = createResponseRecorder();

  await handler({ body: { arrival: "Endor" } } as never, response as never);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, {
    duration: 8,
    route: ["Tatooine", "Endor"],
  });
});

test("compute handler returns 404 when evaluation fails", async () => {
  const handler = createComputeHandler({
    evaluate: async () => {
      throw new RouteNotFoundError("No route found from Tatooine to Endor.");
    },
  } as never);
  const response = createResponseRecorder();

  await handler({ body: { arrival: "Endor" } } as never, response as never);

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.payload, {
    error: "No route found from Tatooine to Endor.",
  });
});

test("compute handler returns 500 for unexpected evaluation failures", async () => {
  const handler = createComputeHandler({
    evaluate: async () => {
      throw new Error("database unavailable");
    },
  } as never);
  const response = createResponseRecorder();

  await handler({ body: { arrival: "Endor" } } as never, response as never);

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.payload, {
    error: "Unable to compute route.",
  });
});
