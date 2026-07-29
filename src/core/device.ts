import { z } from "zod";
import { NotFoundError, ValidationError } from "./errors.js";

export interface DeviceDto {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string | null;
  room: string | null;
  state: Record<string, unknown> | null;
  registeredAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Base class for all device types.
 */
export abstract class Device {
  readonly id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string | null;
  room: string | null;
  readonly registeredAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  private _state: Record<string, unknown> | null;

  /** Saved to the type column. Each subclass just returns its own string. */
  abstract get type(): string;
  /** Unknown state fields fail validation here instead of being dropped. */
  abstract get stateSchema(): z.ZodObject<z.ZodRawShape>;
  /** The state a newly registered device starts with. */
  abstract get defaultState(): Record<string, unknown>;

  constructor(deviceDto: DeviceDto) {
    this.id = deviceDto.id;
    this.name = deviceDto.name;
    this.manufacturer = deviceDto.manufacturer;
    this.model = deviceDto.model;
    this.serialNumber = deviceDto.serialNumber;
    this.firmwareVersion = deviceDto.firmwareVersion;
    this.room = deviceDto.room;
    this._state =
      deviceDto.state === null ? null : structuredClone(deviceDto.state);
    this.registeredAt = deviceDto.registeredAt;
    this.updatedAt = deviceDto.updatedAt;
    this.deletedAt = deviceDto.deletedAt;
  }

  /** Resolve type's default state on first read. */
  get state(): Record<string, unknown> {
    this._state ??= structuredClone(this.defaultState);
    return this._state;
  }

  /** Get a copy of the state */
  snapshotState(): Record<string, unknown> {
    return structuredClone(this.state);
  }

  /** Capture a snapshot of the current details before changing for audit history. */
  auditSnapshot(): Record<string, unknown> {
    return {
      name: this.name,
      firmwareVersion: this.firmwareVersion,
      room: this.room,
      state: this.snapshotState(),
    };
  }

  /** Apply a partial patch against this type's state schema. */
  applyStatePatch(patch: unknown, now = new Date()): void {
    this.ensureNotDeleted();
    const validated = this.parseWith(this.stateSchema.partial(), patch);
    if (Object.keys(validated).length === 0) {
      throw new ValidationError("Patch must change at least one field");
    }
    this._state = { ...this.state, ...validated };
    this.updatedAt = now;
  }

  /** Apply a configuration patch against a device. */
  applyConfigPatch(
    patch: {
      name?: string;
      firmwareVersion?: string | null;
      room?: string | null;
    },
    now = new Date(),
  ): void {
    this.ensureNotDeleted();
    if (patch.name !== undefined) {
      this.name = patch.name;
    }
    if (patch.firmwareVersion !== undefined) {
      this.firmwareVersion = patch.firmwareVersion;
    }
    if (patch.room !== undefined) {
      this.room = patch.room;
    }
    this.updatedAt = now;
  }

  /**
   * Soft delete to maintain audit history.
   * Returns false if already deleted
   */
  softDelete(now = new Date()): boolean {
    if (this.deletedAt !== null) return false;
    this.deletedAt = now;
    this.updatedAt = now;
    return true;
  }

  /** Serialise Device to JSON. */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      manufacturer: this.manufacturer,
      model: this.model,
      serialNumber: this.serialNumber,
      firmwareVersion: this.firmwareVersion,
      room: this.room,
      state: this.snapshotState(),
      registeredAt: this.registeredAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  /** Soft-deleted devices behave as absent. The HTTP layer maps this to 404. */
  private ensureNotDeleted(): void {
    if (this.deletedAt !== null) throw new NotFoundError("Device", this.id);
  }

  private parseWith<T>(schema: z.ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(
        `Invalid state for device type "${this.type}"`,
        result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
    }
    return result.data;
  }
}
