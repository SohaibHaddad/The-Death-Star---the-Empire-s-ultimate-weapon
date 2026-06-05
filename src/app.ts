import express, { type Request, type Response } from "express";
import { createComputeHandler } from "./handlers/computeHandler.js";
import { PathEvaluationService } from "./services/PathEvaluationService.js";

type AppDependencies = {
  pathEvaluationService: PathEvaluationService;
};

export function createApp({ pathEvaluationService }: AppDependencies) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_request: Request, response: Response) => {
    response.status(200).json({ status: "ok" });
  });

  app.post("/compute", createComputeHandler(pathEvaluationService));

  return app;
}
