/**
 * Custom error class for upstream service failures (like FlareSolverr API, Curse site, and so on).
 * This custom error was added to distinguish external dependency failures from the internal ones.
 */
export class UpstreamError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "UpstreamError";
  }
}

/**
 * Custom error class for route handler failures that should map to a specific response status.
 */
export class StatusError extends Error {
  constructor(readonly status: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "StatusError";
  }
}
