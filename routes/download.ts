import { downloadAddonZip } from "@/curse/download.ts";
import { StatusError } from "@/server/errors.ts";
import { createJsonResponse } from "@/server/response.ts";

/**
 * Handles the "/download" endpoint.
 */
export async function handleDownloadEndpoint(url: URL): Promise<Response> {
  const addonSlug = url.searchParams.get("addon")?.trim().toLowerCase();
  if (!addonSlug) {
    throw new StatusError(400, "Missing 'addon' query parameter in request URL.");
  }
  if (!/^[a-z0-9-]+$/.test(addonSlug)) {
    throw new StatusError(400, "Invalid 'addon' query parameter in request URL (format is not Curse addon-slug format).");
  }
  const result = await downloadAddonZip(addonSlug);
  return createJsonResponse(200, {
    addonSlug,
    downloadUrl: result.downloadUrl,
    cacheUrl: result.cacheUrl,
  });
}
