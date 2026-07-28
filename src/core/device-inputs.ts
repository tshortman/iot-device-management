import { z } from "zod";
import { DeviceTypeSchema } from "./devices/index.js";

/**
 * Represents a trimmed, non-empty string with a given max number of chars.
 */
const label = (max: number) => z.string().trim().min(1).max(max);

/**
 * Registration payload, server-owned fields (state, timestamps) are
 * absent, so clients can't set them.
 */
export const RegisterDeviceInputSchema = z.object({
  name: label(100),
  type: DeviceTypeSchema,
  manufacturer: label(100),
  model: label(100),
  serialNumber: label(100),
  firmwareVersion: label(50).optional(),
  room: label(100).optional(),
});

export type RegisterDeviceInput = z.infer<typeof RegisterDeviceInputSchema>;

/**
 * Updateable device metadata, identity fields are absent since they can't change.
 * null clears a field, absent fields left unchanged.
 */
export const UpdateDeviceMetadataSchema = z
  .object({
    name: label(100),
    firmwareVersion: label(50).nullable(),
    room: label(100).nullable(),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "Patch must change at least one field",
  });

export type UpdateDeviceMetadata = z.infer<typeof UpdateDeviceMetadataSchema>;
