/**
 * Creates a JSON response with the given HTTP status and JSON-serializable content.
 */
export function createJsonResponse(status: number, content: unknown): Response {
  return new Response(JSON.stringify(content, null, 4), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

/**
 * Builds a human-readable "HTTP <code> (<reason>)" string for the given HTTP status code.
 */
export function createPrettyStatus(status: number): string {
  const statusCodes: Record<number, string> = {
    200: "OK",
    400: "Bad Request",
    404: "Not Found",
    405: "Method Not Allowed",
    500: "Internal Server Error",
    502: "Bad Gateway",
  };
  return `HTTP ${status} (${statusCodes[status] ?? "Unknown"})`;
}

/**
 * Creates a JSON success response for an addon lookup/download result.
 */
export function createSuccessResponse(
  addonSlug: string,
  downloadUrl: string,
  cacheUrl?: string,
): Response {
  return createJsonResponse(200, {
    addonSlug,
    downloadUrl,
    ...(cacheUrl && { cacheUrl }),
    statusInfo: createPrettyStatus(200),
  });
}
