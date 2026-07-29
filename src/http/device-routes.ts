import { Router } from "express";
import type { z } from "zod";
import { DEVICES_PATH } from "../config.js";
import {
  RegisterDeviceInputSchema,
  UpdateDeviceMetadataSchema,
} from "../core/device-inputs.js";
import { ValidationError } from "../core/errors.js";
import type { DeviceService } from "../service/device-service.js";

/** Validate body against schema. Throw ValidationError if it fails, mapped to 422 by the error handler. */
function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(
      "Request body failed validation",
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }
  return result.data;
}

export function deviceRoutes(service: DeviceService): Router {
  const router = Router();

  router.post("/", (req, res) => {
    const device = service.register(
      parseBody(RegisterDeviceInputSchema, req.body),
    );
    res
      .status(201)
      .location(`${DEVICES_PATH}/${device.id}`)
      .json(device.toJSON());
  });

  router.get("/", (_req, res) => {
    res.json(service.list().map((device) => device.toJSON()));
  });

  router.get<{ id: string }>("/:id", (req, res) => {
    res.json(service.get(req.params.id).toJSON());
  });

  router.patch<{ id: string }>("/:id", (req, res) => {
    const patch = parseBody(UpdateDeviceMetadataSchema, req.body);
    res.json(service.updateConfiguration(req.params.id, patch).toJSON());
  });

  // Body validated by the device's own type schema instead of parseBody
  // because state schema isn't known at http layer.
  router.patch<{ id: string }>("/:id/state", (req, res) => {
    res.json(service.updateState(req.params.id, req.body).toJSON());
  });

  router.get<{ id: string }>("/:id/history", (req, res) => {
    res.json(service.history(req.params.id));
  });

  router.delete<{ id: string }>("/:id", (req, res) => {
    service.remove(req.params.id);
    res.status(204).end();
  });

  return router;
}
