import { z } from "zod";
import { Device } from "../device.js";

/** Exported so the DB's mode CHECK can be generated from this, not retyped. */
export const ThermostatModeSchema = z.enum(["heat", "cool", "off"]);

export const ThermostatStateSchema = z.strictObject({
  targetTemp: z.number().min(5).max(30),
  currentTemp: z.number(),
  mode: ThermostatModeSchema,
});
const defaultState = { targetTemp: 20, currentTemp: 20, mode: "off" };

export class ThermostatDevice extends Device {
  get type() {
    return "thermostat" as const;
  }
  get stateSchema() {
    return ThermostatStateSchema;
  }
  get defaultState() {
    return defaultState;
  }
}
