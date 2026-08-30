import { handleRootEndpoint } from "@/routes/root.ts";
import { handleScrapeEndpoint } from "@/routes/scrape.ts";
import { handleDownloadEndpoint } from "@/routes/download.ts";
import { handleFilesEndpoint } from "@/routes/files.ts";
import { StatusError, UpstreamError } from "@/server/errors.ts";
import { createJsonResponse } from "@/server/response.ts";

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
          // Route not found (matches "/favicon.ico" route too)
          return new Response(null, { status: 404 });
      }
    } catch (err) {
      if (err instanceof StatusError) {
        return createJsonResponse(err.status, { errorMessage: err.message });
      }
      if (err instanceof UpstreamError) {
        return createJsonResponse(502, { errorMessage: err.message });
      }
      console.error(`Unhandled error while processing ${req.method} ${req.url}:`, err);
      return createJsonResponse(500, { errorMessage: "Unknown error occurred (check logs for details)." });
    }
  });
}
