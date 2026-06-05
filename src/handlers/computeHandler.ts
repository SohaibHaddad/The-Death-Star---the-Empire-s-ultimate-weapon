import type { Request, Response } from "express";
import {
  PathEvaluationService,
  RouteNotFoundError,
} from "../services/PathEvaluationService.js";
import type {
  ComputeRequestBody,
  ComputeSuccessResponse,
  ErrorResponse,
} from "./computeTypes.js";

export function createComputeHandler(pathEvaluationService: PathEvaluationService) {
  return async function computeHandler(
    request: Request<unknown, ComputeSuccessResponse | ErrorResponse, ComputeRequestBody>,
    response: Response<ComputeSuccessResponse | ErrorResponse>,
  ): Promise<void> {
    if (!isValidComputeRequestBody(request.body)) {
      response.status(400).json({
        error: "Request body must include a non-empty 'arrival' string.",
      });
      return;
    }

    try {
      const pathEvaluation = await pathEvaluationService.evaluate(request.body.arrival);
      response.status(200).json(pathEvaluation);
    } catch (error: unknown) {
      if (error instanceof RouteNotFoundError) {
        response.status(404).json({ error: error.message });
        return;
      }

      response.status(500).json({ error: "Unable to compute route." });
    }
  };
}

function isValidComputeRequestBody(value: unknown): value is ComputeRequestBody {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const arrival = (value as { arrival?: unknown }).arrival;

  return typeof arrival === "string" && arrival.trim() !== "";
}
