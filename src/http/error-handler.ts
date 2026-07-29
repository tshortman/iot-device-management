import type { ErrorRequestHandler, RequestHandler } from "express";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../core/errors.js";

/** Anything not matched by a route, return 404. */
export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: `No route matches ${req.originalUrl}` });
};

/**
 * Get status code from request parsing error.
 * Need to cast error to a type since its type is 'any'
 */
function hasHttpStatus(
  error: unknown,
): error is { status: number; message?: string } {
  return (
    error !== null && typeof (error as { status?: unknown }).status === "number"
  );
}

/** Express routes thrown errors here, so try/catch is not needed. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }
  if (error instanceof ConflictError) {
    res
      .status(409)
      .json({ error: error.message, existingId: error.existingId });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(422).json({ error: error.message, issues: error.issues });
    return;
  }
  if (hasHttpStatus(error) && error.status < 500) {
    res.status(error.status).json({ error: error.message ?? "Bad request" });
    return;
  }
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
};
