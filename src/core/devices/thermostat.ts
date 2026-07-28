import { z } from "zod";
import { Device } from "../device.js";

const stateSchema = z.strictObject({
  targetTemp: z.number().min(5).max(30),
  currentTemp: z.number().min(-20).max(60),
  mode: z.enum(["heat", "cool", "off"]),
});
const defaultState = { targetTemp: 20, currentTemp: 20, mode: "off" };

export class ThermostatDevice extends Device {
  get type() {
    return "thermostat" as const;
  }
  get stateSchema() {
    return stateSchema;
  }
  get defaultState() {
    return defaultState;
  }
}
