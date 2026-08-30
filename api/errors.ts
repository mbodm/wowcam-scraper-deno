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
 * Custom error class for routing failures that should map to a specific HTTP response status.
 */
export class StatusError extends Error {
  constructor(message: string, readonly status: number, options?: ErrorOptions) {
    super(message, options);
    this.name = "StatusError";
  }
}
