import { z } from "zod";
import { Device } from "../device.js";

const stateSchema = z.strictObject({
  on: z.boolean(),
  brightness: z.number().int().min(0).max(100),
});
const defaultState = { on: false, brightness: 100 };

export class LightDevice extends Device {
  get type() {
    return "light" as const;
  }
  get stateSchema() {
    return stateSchema;
  }
  get defaultState() {
    return defaultState;
  }
}
