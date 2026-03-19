import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import healthRouter from "./routes/health.js";

export function createApp(): express.Application {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/auth", authRouter);
  app.use("/health", healthRouter);

  return app;
}
