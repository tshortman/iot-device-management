import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { EventTypeSchema } from "../core/device-event.js";
import { deviceClasses, ThermostatModeSchema } from "../core/devices/index.js";

/** Render device class values as a quoted SQL list so CHECK constraints have one source of truth */
const sqlList = (values: string[]) =>
  values.map((value) => `'${value}'`).join(", ");

const deviceTypeList = sqlList(Object.keys(deviceClasses));
const eventTypeList = sqlList(EventTypeSchema.options);
const thermostatModeList = sqlList(ThermostatModeSchema.options);

/** Device table. */
export const devices = sqliteTable(
  "devices",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    manufacturer: text("manufacturer").notNull(),
    model: text("model").notNull(),
    serialNumber: text("serial_number").notNull(),
    firmwareVersion: text("firmware_version"),
    room: text("room"),
    registeredAt: integer("registered_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    // Partial index so a serial can be registered again once the old device is soft deleted.
    uniqueIndex("devices_manufacturer_serial_unique")
      .on(table.manufacturer, table.serialNumber)
      .where(sql`deleted_at IS NULL`),
    check("devices_type_check", sql.raw(`type IN (${deviceTypeList})`)),
  ],
);

/** Light state. */
export const lights = sqliteTable(
  "lights",
  {
    deviceId: text("device_id")
      .primaryKey()
      .references(() => devices.id),
    isOn: integer("is_on", { mode: "boolean" }).notNull(),
    brightness: integer("brightness").notNull(),
  },
  () => [check("lights_brightness_check", sql`brightness BETWEEN 0 AND 100`)],
);

/** Thermostat state. */
export const thermostats = sqliteTable(
  "thermostats",
  {
    deviceId: text("device_id")
      .primaryKey()
      .references(() => devices.id),
    targetTemp: real("target_temp").notNull(),
    currentTemp: real("current_temp").notNull(),
    mode: text("mode").notNull(),
  },
  () => [
    check("thermostats_target_temp_check", sql`target_temp BETWEEN 5 AND 30`),
    check("thermostats_mode_check", sql.raw(`mode IN (${thermostatModeList})`)),
  ],
);

/** Camera state. */
export const cameras = sqliteTable("cameras", {
  deviceId: text("device_id")
    .primaryKey()
    .references(() => devices.id),
  recording: integer("recording", { mode: "boolean" }).notNull(),
  motionDetected: integer("motion_detected", { mode: "boolean" }).notNull(),
});

/**
 * Audit history. before_image is a JSON document so any columns added to state tables
 * can be recorded here without adding columns.
 */
export const deviceEvents = sqliteTable(
  "device_events",
  {
    id: text("id").primaryKey(),
    deviceId: text("device_id")
      .notNull()
      .references(() => devices.id),
    type: text("type").notNull(),
    beforeImage: text("before_image", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    // The history endpoint reads one device's timeline, which this index serves directly.
    index("device_events_device_created_idx").on(
      table.deviceId,
      table.createdAt,
    ),
    check("device_events_type_check", sql.raw(`type IN (${eventTypeList})`)),
  ],
);
