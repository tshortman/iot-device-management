import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createApp } from "./http/app.js";
import { DeviceService } from "./service/device-service.js";
import { openDatabase } from "./storage/database.js";
import { SqliteDeviceRepository } from "./storage/sqlite-device-repository.js";

// In a real system these would be defined in an env file!
const PORT = 3000;
const DATABASE_PATH = "./data/app.db";

// Create db file.
mkdirSync(dirname(DATABASE_PATH), { recursive: true });

const db = openDatabase(DATABASE_PATH);
const service = new DeviceService(new SqliteDeviceRepository(db));
const app = createApp({ service });

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
