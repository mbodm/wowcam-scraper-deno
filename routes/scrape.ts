import { StatusError } from "@/server/errors.ts";
import { scrapeAddonSite } from "@/curse/scrape.ts";
import { extractDownloadUrl } from "@/curse/eval.ts";
import { getFinalDownloadUrl } from "@/curse/redirects.ts";
import { createJsonResponse } from "@/server/response.ts";

/**
 * Handles the "/scrape" endpoint.
 */
export async function handleScrapeEndpoint(url: URL): Promise<Response> {
  const addonSlug = url.searchParams.get("addon")?.trim().toLowerCase();
  if (!addonSlug) {
    throw new StatusError(400, "Missing 'addon' query parameter in request URL.");
  }
  if (!/^[a-z0-9-]+$/.test(addonSlug)) {
    throw new StatusError(400, "Invalid 'addon' query parameter in request URL (format is not Curse addon-slug format).");
  }
  const scrapeResult = await scrapeAddonSite(addonSlug);
  const downloadUrl = extractDownloadUrl(scrapeResult.siteContent);
  const downloadUrlFinal = await getFinalDownloadUrl(downloadUrl, scrapeResult.siteHeaders);
  return createJsonResponse(200, {
    addonSlug,
    downloadUrl: downloadUrlFinal,
  });
}
