import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Device } from "../../src/core/device.js";
import type { DeviceEvent, EventType } from "../../src/core/device-event.js";
import type { AppDatabase } from "../../src/storage/database.js";
import { openDatabase } from "../../src/storage/database.js";
import { SqliteDeviceRepository } from "../../src/storage/sqlite-device-repository.js";
import { makeDevice } from "../helpers/devices.js";

let eventCounter = 0;

/** Build an event for a device. */
function makeEvent(
  device: Device,
  type: EventType,
  options: { beforeImage?: Record<string, unknown> | null; now?: Date } = {},
): DeviceEvent {
  eventCounter += 1;
  return {
    id: `event-${String(eventCounter).padStart(4, "0")}`,
    deviceId: device.id,
    type,
    beforeImage: options.beforeImage ?? null,
    createdAt: options.now ?? new Date(),
  };
}

describe("SqliteDeviceRepository", () => {
  let db: AppDatabase;
  let repository: SqliteDeviceRepository;

  // Clean db per test
  beforeEach(() => {
    db = openDatabase(":memory:");
    repository = new SqliteDeviceRepository(db);
  });

  afterEach(() => {
    db.$client.close();
  });

  it("returns null for an unknown id", () => {
    expect(repository.findById("no-such-device")).toBeNull();
  });

  it("rejects a second active device with the same manufacturer and serial", () => {
    const first = makeDevice({ serialNumber: "SERIAL" });
    repository.create(first, makeEvent(first, "registered"));
    const second = makeDevice({ serialNumber: "SERIAL" });
    expect(() => {
      repository.create(second, makeEvent(second, "registered"));
    }).toThrow(
      expect.objectContaining({
        name: "ConflictError",
        existingId: first.id,
      }),
    );
  });

  it("allows the serial again once the device is soft deleted", () => {
    const original = makeDevice({ serialNumber: "SERIAL" });
    repository.create(original, makeEvent(original, "registered"));
    const image = original.auditSnapshot();
    original.softDelete();
    repository.update(
      original,
      makeEvent(original, "deleted", { beforeImage: image }),
    );
    const replacement = makeDevice({ serialNumber: "SERIAL" });
    repository.create(replacement, makeEvent(replacement, "registered"));
    const listed = repository.list();
    expect(listed.map((device) => device.id)).toContain(replacement.id);
  });
});
