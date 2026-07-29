import { z } from "zod";
import { createDocument } from "zod-openapi";
import { DEVICES_PATH } from "../config.js";
import { EventTypeSchema } from "../core/device-event.js";
import {
  RegisterDeviceInputSchema,
  UpdateDeviceMetadataSchema,
} from "../core/device-inputs.js";
import {
  CameraStateSchema,
  LightStateSchema,
  ThermostatStateSchema,
} from "../core/devices/index.js";

// Describe format of uuid and date-time so swagger ui doesn't show long regex for uuid and date-time
const uuid = z
  .string()
  .meta({ format: "uuid", example: "019fab83-e5e8-743f-80d6-02232f5c4f6e" });
const timestamp = z
  .string()
  .meta({ format: "date-time", example: "2026-07-29T01:15:00.000Z" });

// The schemas below describe the API surface for the docs.
// Only the imported schemas have validation, reused here to keep the API docs in line with the code
const DeviceSchema = RegisterDeviceInputSchema.extend({
  id: uuid,
  firmwareVersion: z.string().nullable(),
  room: z.string().nullable(),
  state: z.record(z.string(), z.unknown()),
  registeredAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.nullable(),
}).meta({ id: "Device" });

const DeviceEventSchema = z
  .object({
    id: uuid,
    deviceId: uuid,
    type: EventTypeSchema,
    beforeImage: z.record(z.string(), z.unknown()).nullable(),
    createdAt: timestamp,
  })
  .meta({ id: "DeviceEvent" });

// applyStatePatch checks a patch against the device's own type
const StatePatchSchema = z
  .union([
    LightStateSchema.partial(),
    ThermostatStateSchema.partial(),
    CameraStateSchema.partial(),
  ])
  .meta({ id: "StatePatch" });

const ErrorSchema = z
  .object({
    error: z.string(),
    issues: z
      .array(z.object({ path: z.string(), message: z.string() }))
      .optional(),
    existingId: uuid.optional(),
  })
  .meta({ id: "Error" });

// Any string is accepted in id field, no match returns 404 rather than 400.
const idParam = z.object({
  id: z.string().meta({ example: "019fab83-e5e8-743f-80d6-02232f5c4f6e" }),
});

const json = (schema: z.ZodType) => ({
  content: { "application/json": { schema } },
});

const error = (description: string) => ({ description, ...json(ErrorSchema) });

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "IoT Device Management API",
    version: "1.0.0",
    description: "Register, manage and audit smart home devices.",
  },
  paths: {
    [DEVICES_PATH]: {
      post: {
        summary: "Register a device",
        requestBody: json(RegisterDeviceInputSchema),
        responses: {
          "201": { description: "Registered", ...json(DeviceSchema) },
          "409": error("A device with this manufacturer and serial exists"),
          "422": error("Body failed validation"),
        },
      },
      get: {
        summary: "List all devices",
        responses: {
          "200": { description: "OK", ...json(z.array(DeviceSchema)) },
        },
      },
    },
    [`${DEVICES_PATH}/{id}`]: {
      get: {
        summary: "Get a device by id",
        requestParams: { path: idParam },
        responses: {
          "200": { description: "OK", ...json(DeviceSchema) },
          "404": error("Device does not exist, or it was deleted"),
        },
      },
      patch: {
        summary: "Update device details",
        requestParams: { path: idParam },
        requestBody: json(UpdateDeviceMetadataSchema),
        responses: {
          "200": { description: "Updated", ...json(DeviceSchema) },
          "404": error("No such device, or it was deleted"),
          "422": error("Empty patch, or a field failed validation"),
        },
      },
      delete: {
        summary: "Delete a device",
        requestParams: { path: idParam },
        responses: {
          "204": { description: "Deleted" },
          "404": error("Device does not exist"),
        },
      },
    },
    [`${DEVICES_PATH}/{id}/state`]: {
      patch: {
        summary: "Change device state",
        requestParams: { path: idParam },
        requestBody: json(StatePatchSchema),
        responses: {
          "200": { description: "Updated", ...json(DeviceSchema) },
          "404": error("Device does not exist, or it was deleted"),
          "422": error("State invalid for this device's type"),
        },
      },
    },
    [`${DEVICES_PATH}/{id}/history`]: {
      get: {
        summary: "List a device's event history",
        requestParams: { path: idParam },
        responses: {
          "200": { description: "OK", ...json(z.array(DeviceEventSchema)) },
          "404": error("Device not found"),
        },
      },
    },
  },
});
