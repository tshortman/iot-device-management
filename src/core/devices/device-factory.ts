import type { Device, DeviceDto } from "../device.js";
import { deviceClasses } from "./device-classes.js";
import type { DeviceType } from "./device-classes.js";

/**
 * Create Device from given type and deviceDto
 */
export function deviceFrom(type: DeviceType, deviceDto: DeviceDto): Device {
  return new deviceClasses[type](deviceDto);
}

/**
 * Create new Device, subclassed on DeviceType.
 */
export function createDevice(args: {
  id: string;
  type: DeviceType;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmwareVersion?: string;
  room?: string;
  now?: Date;
}): Device {
  const now = args.now ?? new Date();
  return deviceFrom(args.type, {
    id: args.id,
    name: args.name,
    manufacturer: args.manufacturer,
    model: args.model,
    serialNumber: args.serialNumber,
    firmwareVersion: args.firmwareVersion ?? null,
    room: args.room ?? null,
    state: null,
    registeredAt: now,
    updatedAt: now,
    deletedAt: null,
  });
}
