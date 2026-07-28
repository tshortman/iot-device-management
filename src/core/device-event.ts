import { z } from "zod";

/** Define event types for Device */
export const EventTypeSchema = z.enum([
  "registered",
  "state_changed",
  "details_changed",
  "deleted",
]);
export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * Audit record showing a snapshot of a device before a change. Current values are
 * derived from the Device table. beforeImage carries all fields that are changeable,
 * modelled as a JSON object to account for device schema changing.
 */
export interface DeviceEvent {
  readonly id: string;
  readonly deviceId: string;
  readonly type: EventType;
  readonly beforeImage: Record<string, unknown> | null;
  readonly createdAt: Date;
}
