/** A referenced resource does not exist (or is marked as deleted). */
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

/** The request contradicts existing data, e.g. duplicate (manufacturer, serialNumber). */
export class ConflictError extends Error {
  constructor(
    message: string,
    readonly existingId?: string,
  ) {
    super(message);
    this.name = "ConflictError";
  }
}

/** Input failed validation. issues carries a path and message for each failed field. */
export class ValidationError extends Error {
  constructor(
    message: string,
    readonly issues?: ReadonlyArray<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
