import { v7 as uuidv7 } from "uuid";
import type { Device } from "../core/device.js";
import type { DeviceEvent, EventType } from "../core/device-event.js";
import type {
  RegisterDeviceInput,
  UpdateDeviceMetadata,
} from "../core/device-inputs.js";
import { createDevice } from "../core/devices/index.js";
import { NotFoundError } from "../core/errors.js";
import type { DeviceRepository } from "../storage/device-repository.js";

/**
 * Service layer between API and repository.
 * Every mutation also creates an audit event.
 */
export class DeviceService {
  constructor(private readonly repository: DeviceRepository) {}

  register(input: RegisterDeviceInput): Device {
    const device = createDevice({ id: uuidv7(), ...input });
    this.repository.create(device, this.event(device, "registered", null));
    return device;
  }

  list(): Device[] {
    return this.repository.list();
  }

  // Deleted devices return a 404 if they are requested.
  get(id: string): Device {
    const device = this.repository.findById(id);
    if (!device || device.deletedAt !== null) {
      throw new NotFoundError("Device", id);
    }
    return device;
  }

  updateConfiguration(id: string, patch: UpdateDeviceMetadata): Device {
    const device = this.get(id);
    const beforeImage = device.auditSnapshot();
    device.applyConfigPatch(patch);
    this.repository.update(
      device,
      this.event(device, "details_changed", beforeImage),
    );
    return device;
  }

  updateState(id: string, patch: unknown): Device {
    const device = this.get(id);
    const beforeImage = device.auditSnapshot();
    device.applyStatePatch(patch);
    this.repository.update(
      device,
      this.event(device, "state_changed", beforeImage),
    );
    return device;
  }

  // History is returned even if device is marked as deleted.
  history(id: string): DeviceEvent[] {
    if (!this.repository.findById(id)) {
      throw new NotFoundError("Device", id);
    }
    return this.repository.listEvents(id);
  }

  remove(id: string): void {
    const device = this.repository.findById(id);
    if (!device) {
      throw new NotFoundError("Device", id);
    }
    const beforeImage = device.auditSnapshot();
    if (!device.softDelete()) {
      return;
    }
    this.repository.update(device, this.event(device, "deleted", beforeImage));
  }

  private event(
    device: Device,
    type: EventType,
    beforeImage: Record<string, unknown> | null,
  ): DeviceEvent {
    return {
      id: uuidv7(),
      deviceId: device.id,
      type,
      beforeImage,
      createdAt: new Date(),
    };
  }
}
