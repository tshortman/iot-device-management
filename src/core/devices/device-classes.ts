import { z } from "zod";
import { LightDevice } from "./light.js";
import { ThermostatDevice } from "./thermostat.js";
import { CameraDevice } from "./camera.js";

/**
 * Source of truth for which device types exist. Rows come from DB as a string,
 * so need to decide which class to create.
 */
export const deviceClasses = {
  light: LightDevice,
  thermostat: ThermostatDevice,
  camera: CameraDevice,
} as const;

export type DeviceType = keyof typeof deviceClasses;

/** Turns an unknown type into a 422 instead of a crash. */
export const DeviceTypeSchema = z.enum(
  Object.keys(deviceClasses) as [DeviceType, ...DeviceType[]],
);
