import { StatusError, UpstreamError } from "./errors.ts";
import { handleDownloadEndpoint, handleFilesEndpoint, handleRootEndpoint, handleScrapeEndpoint } from "./routes.ts";

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
        return new Response(err.message, { status: 502 });
      }
      if (err instanceof StatusError) {
        return new Response(err.message, { status: err.status });
      }
      console.error(`Unhandled error while processing ${req.method} ${req.url}:`, err);
      return new Response("Internal Server Error (check logs for details)", { status: 500 });
    }
  });
}
