/**
 * Creates a JSON response with the given HTTP status code and any JSON-serializable content.
 * An additional field is added automatically, so the status is visible directly in a browser.
 */
export function createJsonResponse(status: number, content: Record<string, unknown>): Response {
  const body = {
    ...content,
    statusInfo: createPrettyStatus(status),
  };
  return new Response(JSON.stringify(body, null, 4), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function createPrettyStatus(status: number): string {
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
