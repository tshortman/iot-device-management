import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DATABASE_PATH } from "../config.js";
import type { RegisterDeviceInput } from "../core/device-inputs.js";
import { ConflictError } from "../core/errors.js";
import { DeviceService } from "../service/device-service.js";
import { openDatabase } from "../storage/database.js";
import { SqliteDeviceRepository } from "../storage/sqlite-device-repository.js";

// AI generated seed script to create demo devices
const demoDevices = [
  {
    name: "Living Room Light",
    type: "light",
    manufacturer: "Philips",
    model: "Hue White",
    serialNumber: "DEMO-LIGHT-001",
    room: "Living Room",
  },
  {
    name: "Kitchen Light",
    type: "light",
    manufacturer: "Ikea",
    model: "Tradfri",
    serialNumber: "DEMO-LIGHT-002",
    room: "Kitchen",
  },
  {
    name: "Hallway Thermostat",
    type: "thermostat",
    manufacturer: "Nest",
    model: "Learning Thermostat",
    serialNumber: "DEMO-THERMOSTAT-001",
    room: "Hallway",
  },
  {
    name: "Bedroom Thermostat",
    type: "thermostat",
    manufacturer: "Ecobee",
    model: "SmartThermostat",
    serialNumber: "DEMO-THERMOSTAT-002",
    room: "Bedroom",
  },
  {
    name: "Front Door Camera",
    type: "camera",
    manufacturer: "Ring",
    model: "Stick Up Cam",
    serialNumber: "DEMO-CAMERA-001",
    room: "Front Door",
  },
  {
    name: "Backyard Camera",
    type: "camera",
    manufacturer: "Arlo",
    model: "Pro 4",
    serialNumber: "DEMO-CAMERA-002",
    room: "Backyard",
  },
] satisfies RegisterDeviceInput[];

mkdirSync(dirname(DATABASE_PATH), { recursive: true });
const db = openDatabase(DATABASE_PATH);
const service = new DeviceService(new SqliteDeviceRepository(db));

for (const device of demoDevices) {
  try {
    service.register(device);
    console.log(`Registered ${device.name}`);
  } catch (error) {
    if (error instanceof ConflictError) {
      console.log(`Skipped ${device.name} (already seeded)`);
      continue;
    }
    throw error;
  }
}

db.$client.close();
