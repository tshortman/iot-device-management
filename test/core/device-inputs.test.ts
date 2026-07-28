import { describe, expect, it } from "vitest";
import {
  RegisterDeviceInputSchema,
  UpdateDeviceMetadataSchema,
} from "../../src/core/device-inputs.js";

const validRegistration = {
  name: "Kitchen ceiling light",
  type: "light",
  manufacturer: "Philips",
  model: "Hue White A60",
  serialNumber: "PH-A60-0042",
};

describe("RegisterDeviceInputSchema", () => {
  it("accepts a minimal valid registration", () => {
    const result = RegisterDeviceInputSchema.safeParse(validRegistration);
    expect(result.success).toBe(true);
  });

  it("rejects an unknown device type", () => {
    const result = RegisterDeviceInputSchema.safeParse({
      ...validRegistration,
      type: "table",
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateDeviceMetadataSchema", () => {
  it("rejects an empty patch", () => {
    const result = UpdateDeviceMetadataSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("clears a field on null but leaves unchanged when absent", () => {
    const cleared = UpdateDeviceMetadataSchema.parse({ room: null });
    expect(cleared.room).toBeNull();

    const ignored = UpdateDeviceMetadataSchema.parse({
      name: "Hallway lamp",
    });
    expect(ignored).not.toHaveProperty("room");
  });
});
