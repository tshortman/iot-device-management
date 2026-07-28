import type { Device } from "../core/device.js";
import type { DeviceEvent } from "../core/device-event.js";

/**
 * DB Interface for devices and their history.
 */
export interface DeviceRepository {
  /** Save a new device and its registered event. */
  create(device: Device, event: DeviceEvent): void;

  /** Save the device's current values and add the event. */
  update(device: Device, event: DeviceEvent): void;

  /** Find a device by id. */
  findById(id: string): Device | null;

  /** List every device that isn't marked as deleted. */
  list(): Device[];

  /** List the history of a device's events. */
  listEvents(deviceId: string): DeviceEvent[];
}
