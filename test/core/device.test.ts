import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../../src/core/errors.js";
import { makeDevice } from "../helpers/devices.js";

describe("device state mutation", () => {
  it("rejects values out of range", () => {
    const device = makeDevice({ type: "light" });
    expect(() => device.applyStatePatch({ brightness: 250 })).toThrow(
      ValidationError,
    );
  });

  it("rejects state fields belonging to a different type (brightness on a thermostat)", () => {
    const device = makeDevice({ type: "thermostat" });
    expect(() => device.applyStatePatch({ brightness: 80 })).toThrow(
      ValidationError,
    );
  });

  it("rejects an empty patch", () => {
    const device = makeDevice({ type: "light" });
    expect(() => device.applyStatePatch({})).toThrow(ValidationError);
  });
});

describe("device lifecycle", () => {
  it("refuses mutations after soft delete", () => {
    const device = makeDevice({ type: "light" });
    device.softDelete();
    expect(() => device.applyStatePatch({ on: true })).toThrow(NotFoundError);
  });

  it("is idempotent on repeat deletion, keeping the original timestamp", () => {
    const device = makeDevice({ type: "light" });
    const firstDeletedAt = new Date("2026-07-27T12:00:00Z");
    expect(device.softDelete(firstDeletedAt)).toBe(true);
    expect(device.softDelete(new Date("2026-07-28T12:00:00Z"))).toBe(false);
    expect(device.deletedAt).toEqual(firstDeletedAt);
  });
});
