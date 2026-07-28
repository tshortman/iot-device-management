import { eq, inArray } from "drizzle-orm";
import type { DeviceType } from "../core/devices/index.js";
import type { Db, Tx } from "./database.js";
import { cameras, lights, thermostats } from "./schema.js";

export type State = Record<string, unknown>;

/**
 * Maps a device type to its state table and handles state CRUD operations.
 */
interface StateMapper {
  read(db: Db, ids: string[]): Map<string, State>;
  insert(tx: Tx, deviceId: string, state: State): void;
  update(tx: Tx, deviceId: string, state: State): void;
}

/** One StateMapper per device type. */
export const stateMapper: Record<DeviceType, StateMapper> = {
  light: {
    read: (db, ids) => {
      const states = new Map<string, State>();
      for (const row of db
        .select()
        .from(lights)
        .where(inArray(lights.deviceId, ids))
        .all()) {
        states.set(row.deviceId, { on: row.isOn, brightness: row.brightness });
      }
      return states;
    },
    insert: (tx, deviceId, state) => {
      tx.insert(lights)
        .values({
          deviceId,
          isOn: state.on as boolean,
          brightness: state.brightness as number,
        })
        .run();
    },
    update: (tx, deviceId, state) => {
      tx.update(lights)
        .set({
          isOn: state.on as boolean,
          brightness: state.brightness as number,
        })
        .where(eq(lights.deviceId, deviceId))
        .run();
    },
  },

  thermostat: {
    read: (db, ids) => {
      const states = new Map<string, State>();
      for (const row of db
        .select()
        .from(thermostats)
        .where(inArray(thermostats.deviceId, ids))
        .all()) {
        states.set(row.deviceId, {
          targetTemp: row.targetTemp,
          currentTemp: row.currentTemp,
          mode: row.mode,
        });
      }
      return states;
    },
    insert: (tx, deviceId, state) => {
      tx.insert(thermostats)
        .values({
          deviceId,
          targetTemp: state.targetTemp as number,
          currentTemp: state.currentTemp as number,
          mode: state.mode as string,
        })
        .run();
    },
    update: (tx, deviceId, state) => {
      tx.update(thermostats)
        .set({
          targetTemp: state.targetTemp as number,
          currentTemp: state.currentTemp as number,
          mode: state.mode as string,
        })
        .where(eq(thermostats.deviceId, deviceId))
        .run();
    },
  },

  camera: {
    read: (db, ids) => {
      const states = new Map<string, State>();
      for (const row of db
        .select()
        .from(cameras)
        .where(inArray(cameras.deviceId, ids))
        .all()) {
        states.set(row.deviceId, {
          recording: row.recording,
          motionDetected: row.motionDetected,
        });
      }
      return states;
    },
    insert: (tx, deviceId, state) => {
      tx.insert(cameras)
        .values({
          deviceId,
          recording: state.recording as boolean,
          motionDetected: state.motionDetected as boolean,
        })
        .run();
    },
    update: (tx, deviceId, state) => {
      tx.update(cameras)
        .set({
          recording: state.recording as boolean,
          motionDetected: state.motionDetected as boolean,
        })
        .where(eq(cameras.deviceId, deviceId))
        .run();
    },
  },
};
