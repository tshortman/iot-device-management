import { and, desc, eq, isNull } from "drizzle-orm";
import type { Device, DeviceDto } from "../core/device.js";
import type { DeviceEvent, EventType } from "../core/device-event.js";
import { ConflictError } from "../core/errors.js";
import { deviceFrom } from "../core/devices/index.js";
import type { DeviceType } from "../core/devices/index.js";
import type { Db, Tx } from "./database.js";
import type { DeviceRepository } from "./device-repository.js";
import { deviceEvents, devices } from "./schema.js";
import { stateMapper } from "./state-mapper.js";
import type { State } from "./state-mapper.js";

type DeviceRow = typeof devices.$inferSelect;

/**
 * Drizzle implementation. State lives in a table per device type,
 * reads/writes go through the state mapper for that type.
 */
export class SqliteDeviceRepository implements DeviceRepository {
  constructor(private readonly db: Db) {}

  create(device: Device, event: DeviceEvent): void {
    const existing = this.db
      .select({ id: devices.id })
      .from(devices)
      .where(
        and(
          eq(devices.manufacturer, device.manufacturer),
          eq(devices.serialNumber, device.serialNumber),
          isNull(devices.deletedAt),
        ),
      )
      .get();
    if (existing) {
      throw new ConflictError(
        `Device already registered for manufacturer "${device.manufacturer}" and serial number "${device.serialNumber}"`,
        existing.id,
      );
    }
    this.db.transaction((tx) => {
      tx.insert(devices)
        .values({
          id: device.id,
          name: device.name,
          type: device.type,
          manufacturer: device.manufacturer,
          model: device.model,
          serialNumber: device.serialNumber,
          firmwareVersion: device.firmwareVersion,
          room: device.room,
          registeredAt: device.registeredAt,
          updatedAt: device.updatedAt,
          deletedAt: device.deletedAt,
        })
        .run();
      this.stateMapperFor(device.type as DeviceType).insert(
        tx,
        device.id,
        device.snapshotState(),
      );
      this.insertEvent(tx, event);
    });
  }

  update(device: Device, event: DeviceEvent): void {
    this.db.transaction((tx) => {
      tx.update(devices)
        .set({
          name: device.name,
          firmwareVersion: device.firmwareVersion,
          room: device.room,
          updatedAt: device.updatedAt,
          deletedAt: device.deletedAt,
        })
        .where(eq(devices.id, device.id))
        .run();
      this.stateMapperFor(device.type as DeviceType).update(
        tx,
        device.id,
        device.snapshotState(),
      );
      this.insertEvent(tx, event);
    });
  }

  findById(id: string): Device | null {
    const row = this.db.select().from(devices).where(eq(devices.id, id)).get();
    if (!row) return null;
    const type = row.type as DeviceType;
    const state = stateMapper[type].read(this.db, [row.id]).get(row.id);
    if (!state) throw new Error(`State row missing for device ${row.id}`);
    return this.toEntity(row, state);
  }

  list(): Device[] {
    const rows = this.db
      .select()
      .from(devices)
      .where(isNull(devices.deletedAt))
      .all();
    const idsByType = new Map<DeviceType, string[]>();
    for (const row of rows) {
      const type = row.type as DeviceType;
      idsByType.set(type, [...(idsByType.get(type) ?? []), row.id]);
    }
    // One query per type present, rather than one per device.
    const states = new Map<string, State>();
    for (const [type, ids] of idsByType) {
      for (const [id, state] of stateMapper[type].read(this.db, ids)) {
        states.set(id, state);
      }
    }
    return rows.map((row) => {
      const state = states.get(row.id);
      if (!state) throw new Error(`State row missing for device ${row.id}`);
      return this.toEntity(row, state);
    });
  }

  listEvents(deviceId: string): DeviceEvent[] {
    const rows = this.db
      .select()
      .from(deviceEvents)
      .where(eq(deviceEvents.deviceId, deviceId))
      .orderBy(desc(deviceEvents.createdAt), desc(deviceEvents.id))
      .all();
    return rows.map((row) => ({
      id: row.id,
      deviceId: row.deviceId,
      type: row.type as EventType,
      beforeImage: row.beforeImage,
      createdAt: row.createdAt,
    }));
  }

  private stateMapperFor(type: DeviceType) {
    return stateMapper[type];
  }

  private insertEvent(tx: Tx, event: DeviceEvent): void {
    tx.insert(deviceEvents)
      .values({
        id: event.id,
        deviceId: event.deviceId,
        type: event.type,
        beforeImage: event.beforeImage,
        createdAt: event.createdAt,
      })
      .run();
  }

  private toEntity(row: DeviceRow, state: State): Device {
    const dto: DeviceDto = {
      id: row.id,
      name: row.name,
      manufacturer: row.manufacturer,
      model: row.model,
      serialNumber: row.serialNumber,
      firmwareVersion: row.firmwareVersion,
      room: row.room,
      state,
      registeredAt: row.registeredAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
    return deviceFrom(row.type as DeviceType, dto);
  }
}
