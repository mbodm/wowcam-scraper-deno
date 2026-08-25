import {
  handleDownloadEndpoint,
  handleFilesEndpoint,
  handleRootEndpoint,
  handleScrapeEndpoint,
} from "./routes.ts";

/**
 * This function starts a Deno HTTP server which exposes some API endpoints
 */
export function startServer(port: number): Deno.HttpServer {
  return Deno.serve(
    {
      port,
      hostname: "0.0.0.0",
      onListen: () => console.log(`Server started: http://localhost:${port}`),
    },
    async (req) => {
      // Methods (only allow GET requests)
      if (req.method !== "GET") {
        return new Response("Error: HTTP method not allowed", {
          status: 405,
          headers: { "Allow": "GET" },
        });
      }
      // Deno's Request.url is already an absolute URL (unlike node:http, where req.url
      // is only the path and needs a manually configured base URL to parse safely)
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
    },
  );
}
