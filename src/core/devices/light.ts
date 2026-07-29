import { z } from "zod";
import { Device } from "../device.js";

export const LightStateSchema = z.strictObject({
  on: z.boolean(),
  brightness: z.number().int().min(0).max(100),
});
const defaultState = { on: false, brightness: 100 };

export class LightDevice extends Device {
  get type() {
    return "light" as const;
  }
  get stateSchema() {
    return LightStateSchema;
  }
  get defaultState() {
    return defaultState;
  }
}
