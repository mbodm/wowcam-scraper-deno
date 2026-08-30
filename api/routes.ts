import { scrapeAddonSite } from "@/curse/scrape.ts";
import { extractDownloadUrl } from "@/curse/eval.ts";
import { getFinalDownloadUrl } from "@/curse/redirects.ts";
import { downloadAddonZip } from "@/curse/download.ts";
import { UpstreamError } from "@/api/errors.ts";

/**
 * Handles the "/" endpoint.
 */
export function handleRootEndpoint(): Response {
  return new Response("hello", { status: 200 });
}

/**
 * Handles the "/scrape" endpoint.
 */
export async function handleScrapeEndpoint(url: URL): Promise<Response> {
  const addonSlug = url.searchParams.get("addon")?.trim().toLowerCase();
  if (!addonSlug) {
    return error(400, "Missing 'addon' query parameter in request URL.");
  }
  if (!/^[a-z0-9-]+$/.test(addonSlug)) {
    return error(400, "Invalid 'addon' query parameter in request URL (format is not Curse addon-slug format).");
  }
  try {
    const scrapeResult = await scrapeAddonSite(addonSlug);
    const downloadUrl = extractDownloadUrl(scrapeResult.siteContent);
    const downloadUrlFinal = await getFinalDownloadUrl(
      downloadUrl,
      scrapeResult.siteHeaders,
    );
    return success(addonSlug, downloadUrlFinal);
  } catch (err) {
    console.error("Error occurred in /scrape route handler:", err);
    if (err instanceof UpstreamError) {
      return error(502, err.message);
    } else if (err instanceof Error) {
      return error(500, err.message);
    } else {
      return error(500, "Unknown error occurred in /scrape route handler (check logs for details).");
    }
  }
}

/**
 * Handles the "/download" endpoint.
 */
export async function handleDownloadEndpoint(url: URL): Promise<Response> {
  const addonSlug = url.searchParams.get("addon")?.trim().toLowerCase();
  if (!addonSlug) {
    return error(400, "Missing 'addon' query parameter in request URL.");
  }
  if (!/^[a-z0-9-]+$/.test(addonSlug)) {
    return error(400, "Invalid 'addon' query parameter in request URL (format is not Curse addon-slug format).");
  }
  try {
    const result = await downloadAddonZip(addonSlug);
    return success(addonSlug, result.downloadUrl, result.cacheUrl);
  } catch (err) {
    console.error("Error occurred in /download route handler:", err);
    if (err instanceof UpstreamError) {
      return error(502, err.message);
    } else if (err instanceof Error) {
      return error(500, err.message);
    } else {
      return error(500, "Unknown error occurred in /download route handler (check logs for details).");
    }
  }
}

/**
 * Handles the "/files/:filename" endpoint (serves ZIP files from the downloads folder).
 */
export async function handleFilesEndpoint(url: URL): Promise<Response> {
  const requestedName = decodeURIComponent(url.pathname.replace("/files/", ""));
  if (
    !requestedName || requestedName.includes("/") ||
    requestedName.includes("..")
  ) {
    return error(400, "Invalid file name in request URL.");
  }
  const filePath = `/downloads/${requestedName}`;
  try {
    const stats = await Deno.stat(filePath);
    const file = await Deno.open(filePath, { read: true });
    return new Response(file.readable, {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-length": String(stats.size),
        "content-disposition": `attachment; filename="${requestedName}"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return error(404, "File not found.");
    }
    console.error("Error occurred in /files route handler:", err);
    return error(500, "Unknown error occurred while serving file (check logs for details).");
  }
}

function error(status: number, errorMessage: string): Response {
  return sendJsonResponse(status, {
    errorMessage,
    statusInfo: createPrettyStatus(status),
  });
}

function success(
  addonSlug: string,
  downloadUrl: string,
  cacheUrl?: string,
): Response {
  return sendJsonResponse(200, {
    addonSlug,
    downloadUrl,
    ...(cacheUrl && { cacheUrl }),
    statusInfo: createPrettyStatus(200),
  });
}

function sendJsonResponse(status: number, content: unknown): Response {
  return new Response(JSON.stringify(content, null, 4), {
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
