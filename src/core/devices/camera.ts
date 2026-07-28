import { z } from "zod";
import { Device } from "../device.js";

const stateSchema = z.strictObject({
  recording: z.boolean(),
  motionDetected: z.boolean(),
});
const defaultState = { recording: false, motionDetected: false };

export class CameraDevice extends Device {
  get type() {
    return "camera" as const;
  }
  get stateSchema() {
    return stateSchema;
  }
  get defaultState() {
    return defaultState;
  }
}
