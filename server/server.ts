import { RouteError, UpstreamError } from "./errors.ts";
import { createJsonResponse, createPrettyStatus } from "./responses.ts";
import { handleDownloadEndpoint } from "@/routes/download.ts";
import { handleFilesEndpoint } from "@/routes/files.ts";
import { handleRootEndpoint } from "@/routes/root.ts";
import { handleScrapeEndpoint } from "@/routes/scrape.ts";

/**
 * Starts a Deno HTTP server which exposes the API endpoints.
 */
export function startServer(port: number): Deno.HttpServer {
  return Deno.serve({
    port,
    hostname: "0.0.0.0",
    onListen: () => console.log(`Server started: http://localhost:${port}`),
  }, async (req) => {
    // Methods (only allow GET requests)
    if (req.method !== "GET") {
      return new Response("Error: HTTP method not allowed", {
        status: 405,
        headers: { "Allow": "GET" },
      });
    }
    try {
      // URL (for pathname and query params)
      const url = new URL(req.url);
      // Routes (call appropriate handler)
      switch (url.pathname) {
        case "/":
          return handleRootEndpoint();
        case "/scrape":
          return await handleScrapeEndpoint(url);
        case "/download":
          return await handleDownloadEndpoint(url);
        default:
          if (url.pathname.startsWith("/files/")) {
            return await handleFilesEndpoint(url);
          }
          // Matches "/favicon.ico" route too
          return new Response(null, { status: 404 });
      }
    } catch (err) {
      if (err instanceof UpstreamError) {
        return createErrorResponse(502, err.message);
      }
      if (err instanceof RouteError) {
        return createErrorResponse(err.status, err.message);
      }
      console.error(`Unhandled error while processing ${req.method} ${req.url}:`, err);
      return createErrorResponse(500, "Unknown error occurred (check logs for details).");
    }
  });
}

function createErrorResponse(status: number, errorMessage: string): Response {
  return createJsonResponse(status, {
    errorMessage,
    statusInfo: createPrettyStatus(status),
  });
}
