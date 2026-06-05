import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import httpMocks from "node-mocks-http";
import { createApp } from "./app.js";

test("createApp serves health and compute endpoints", async () => {
  const app = createApp({
    pathEvaluationService: {
      evaluate: async (arrival: string) => ({
        duration: 8,
        route: ["Tatooine", arrival],
      }),
    } as never,
  });
  const appHandler = app as unknown as {
    handle: (request: unknown, response: unknown) => void;
  };

  const healthRequest = httpMocks.createRequest({
    method: "GET",
    url: "/health",
  });
  const healthResponse = httpMocks.createResponse({ eventEmitter: EventEmitter });
  appHandler.handle(healthRequest, healthResponse);
  await waitForNextTick();

  assert.equal(healthResponse.statusCode, 200);
  assert.deepEqual(healthResponse._getJSONData(), { status: "ok" });

  const computeRequest = httpMocks.createRequest({
    method: "POST",
    url: "/compute",
    headers: {
      "content-type": "application/json",
    },
    body: {
      arrival: "Endor",
    },
  });
  const computeResponse = httpMocks.createResponse({ eventEmitter: EventEmitter });
  appHandler.handle(computeRequest, computeResponse);
  await waitForNextTick();

  assert.equal(computeResponse.statusCode, 200);
  assert.deepEqual(computeResponse._getJSONData(), {
    duration: 8,
    route: ["Tatooine", "Endor"],
  });
});

function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}
