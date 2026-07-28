import { createDevice } from "../../src/core/devices/index.js";
import type { DeviceType } from "../../src/core/devices/index.js";
import type { Device } from "../../src/core/device.js";

let serialCounter = 0;

/**
 * Builds a registered device with sensible defaults for testing.
 */
export function makeDevice(
  overrides: {
    type?: DeviceType;
    id?: string;
    name?: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    now?: Date;
  } = {},
): Device {
  serialCounter += 1;
  return createDevice({
    id: overrides.id ?? `device-${String(serialCounter)}`,
    type: overrides.type ?? "light",
    name: overrides.name ?? "Test device",
    manufacturer: overrides.manufacturer ?? "Acme",
    model: overrides.model ?? "X1",
    serialNumber:
      overrides.serialNumber ?? `SN-${String(serialCounter).padStart(4, "0")}`,
    now: overrides.now,
  });
}
