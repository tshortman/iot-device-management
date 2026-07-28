import { describe, expect, it } from "vitest";
import {
  DeviceTypeSchema,
  deviceClasses,
} from "../../../src/core/devices/index.js";
import type { DeviceType } from "../../../src/core/devices/index.js";
import { makeDevice } from "../../helpers/devices.js";

const allTypes = Object.keys(deviceClasses) as DeviceType[];

describe("device class map", () => {
  it("rejects unknown device types", () => {
    expect(DeviceTypeSchema.safeParse("table").success).toBe(false);
  });

  it("constructs the correct subclass for each type", () => {
    for (const type of allTypes) {
      expect(makeDevice({ type }).type).toBe(type);
    }
  });
});
