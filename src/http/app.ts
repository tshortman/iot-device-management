import cors from "cors";
import express from "express";
import type { Express } from "express";
import { DEVICES_PATH } from "../config.js";
import type { DeviceService } from "../service/device-service.js";
import { deviceRoutes } from "./device-routes.js";
import { errorHandler, notFound } from "./error-handler.js";

export interface AppOptions {
  service: DeviceService;
}

/** Builds the app. */
export function createApp({ service }: AppOptions): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(DEVICES_PATH, deviceRoutes(service));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
