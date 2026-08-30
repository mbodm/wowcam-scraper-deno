import { downloadAddonZip } from "@/curse/download.ts";
import { RouteError } from "@/server/errors.ts";
import { createSuccessResponse } from "@/server/responses.ts";

/**
 * Handles the "/download" endpoint.
 */
export async function handleDownloadEndpoint(url: URL): Promise<Response> {
  const addonSlug = url.searchParams.get("addon")?.trim().toLowerCase();
  if (!addonSlug) {
    throw new RouteError(400, "Missing 'addon' query parameter in request URL.");
  }
  if (!/^[a-z0-9-]+$/.test(addonSlug)) {
    throw new RouteError(400, "Invalid 'addon' query parameter in request URL (format is not Curse addon-slug format).");
  }
  const result = await downloadAddonZip(addonSlug);
  return createSuccessResponse(addonSlug, result.downloadUrl, result.cacheUrl);
}
