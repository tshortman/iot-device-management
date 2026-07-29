import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../../src/http/app.js";
import { DeviceService } from "../../src/service/device-service.js";
import type { AppDatabase } from "../../src/storage/database.js";
import { openDatabase } from "../../src/storage/database.js";
import { SqliteDeviceRepository } from "../../src/storage/sqlite-device-repository.js";

// supertest response body is of type 'any' so needs to be cast to a type.
const asObject = (response: { body: unknown }) =>
  response.body as Record<string, unknown>;
const asArray = (response: { body: unknown }) =>
  response.body as Record<string, unknown>[];
const idOf = (response: { body: unknown }) => String(asObject(response).id);

const light = {
  name: "Hall light",
  type: "light",
  manufacturer: "Acme",
  model: "X1",
  serialNumber: "SN-0001",
};

describe("device routes", () => {
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

  const register = (body: Record<string, unknown> = light) =>
    request(app).post("/api/v1/devices").send(body);

  it("rejects an unknown device type with a field path", async () => {
    const response = await register({ ...light, type: "toaster" });
    expect(response.status).toBe(422);
    expect(asObject(response).issues).toContainEqual(
      expect.objectContaining({ path: "type" }),
    );
  });

  it("rejects a missing required field", async () => {
    const response = await register({
      type: "light",
      manufacturer: "Acme",
      model: "X1",
      serialNumber: "SN-0001",
    });
    expect(response.status).toBe(422);
  });

  it("rejects a duplicate manufacturer and serial, returning the id of the existing device", async () => {
    const first = await register();
    const response = await register();
    expect(response.status).toBe(409);
    expect(asObject(response).existingId).toBe(idOf(first));
  });

  it("lists registered devices", async () => {
    await register();
    await register({
      ...light,
      name: "Kitchen light",
      serialNumber: "SN-0002",
    });
    const response = await request(app).get("/api/v1/devices");
    expect(response.status).toBe(200);
    expect(asArray(response)).toHaveLength(2);
    expect(asArray(response)[0]).toHaveProperty("serialNumber");
  });

  it("returns full details for a known id", async () => {
    const created = await register();
    const response = await request(app).get(`/api/v1/devices/${idOf(created)}`);
    expect(response.status).toBe(200);
    expect(asObject(response)).toMatchObject({ serialNumber: "SN-0001" });
  });

  it("returns 404 for an unknown id", async () => {
    const response = await request(app).get("/api/v1/devices/nope");
    expect(response.status).toBe(404);
  });

  it("updates metadata and leaves absent fields alone", async () => {
    const created = await register();
    const response = await request(app)
      .patch(`/api/v1/devices/${idOf(created)}`)
      .send({ room: "Hallway" });
    expect(response.status).toBe(200);
    expect(asObject(response)).toMatchObject({
      room: "Hallway",
      name: "Hall light",
    });
  });

  it("deletes a device, hides it afterwards, and stays 204 on a repeat", async () => {
    const created = await register();
    const id = idOf(created);

    expect((await request(app).delete(`/api/v1/devices/${id}`)).status).toBe(
      204,
    );
    expect((await request(app).get(`/api/v1/devices/${id}`)).status).toBe(404);
    expect(asArray(await request(app).get("/api/v1/devices"))).toHaveLength(0);
    expect((await request(app).delete(`/api/v1/devices/${id}`)).status).toBe(
      204,
    );
  });

  it("returns 404 when deleting an unknown id", async () => {
    const response = await request(app).delete("/api/v1/devices/nope");
    expect(response.status).toBe(404);
  });

  it("registers a device, returning 201 and the created device", async () => {
    const response = await register();
    expect(response.status).toBe(201);
    expect(asObject(response)).toMatchObject(light);
  });

  it("rejects an empty patch", async () => {
    const created = await register();
    const id = idOf(created);

    const response = await request(app)
      .patch(`/api/v1/devices/${id}`)
      .send({});

    expect(response.status).toBe(422);
  });

  it("returns 404 when patching an unknown id", async () => {
    const response = await request(app)
      .patch("/api/v1/devices/nope")
      .send({ name: "Landing light" });
    expect(response.status).toBe(404);
  });
});
