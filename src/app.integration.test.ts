import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import httpMocks from "node-mocks-http";
import { createApp } from "./app.js";
import { RouteNotFoundError } from "./services/PathEvaluationService.js";

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

test("createApp returns 404 for missing routes", async () => {
  const app = createApp({
    pathEvaluationService: {
      evaluate: async () => {
        throw new RouteNotFoundError("No route found from Tatooine to Endor.");
      },
    } as never,
  });
  const appHandler = app as unknown as {
    handle: (request: unknown, response: unknown) => void;
  };

  const request = httpMocks.createRequest({
    method: "POST",
    url: "/compute",
    headers: {
      "content-type": "application/json",
    },
    body: {
      arrival: "Endor",
    },
  });
  const response = httpMocks.createResponse({ eventEmitter: EventEmitter });
  appHandler.handle(request, response);
  await waitForNextTick();

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response._getJSONData(), {
    error: "No route found from Tatooine to Endor.",
  });
});

function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}
