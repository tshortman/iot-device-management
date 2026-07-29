import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../../src/http/app.js";
import { DeviceService } from "../../src/service/device-service.js";
import type { AppDatabase } from "../../src/storage/database.js";
import { openDatabase } from "../../src/storage/database.js";
import { SqliteDeviceRepository } from "../../src/storage/sqlite-device-repository.js";

describe("error handler", () => {
  let db: AppDatabase;
  let app: Express;

  beforeEach(() => {
    db = openDatabase(":memory:");
    const service = new DeviceService(new SqliteDeviceRepository(db));
    app = createApp({ service });
  });

  afterEach(() => {
    db.$client.close();
  });

  it("returns a JSON error for an unknown route", async () => {
    const response = await request(app).get("/no-such-route");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "No route matches /no-such-route" });
  });

  it("returns a 400 for a malformed JSON body", async () => {
    const response = await request(app)
      .post("/api/v1/devices")
      .set("Content-Type", "application/json")
      .send('{"broken":');
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});
