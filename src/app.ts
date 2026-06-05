import express, { type Request, type Response } from "express";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_request: Request, response: Response) => {
    response.status(200).json({ status: "ok" });
  });

  app.post("/compute", (_request: Request, response: Response) => {
    response.sendStatus(200);
  });

  return app;
}
