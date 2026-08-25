import { scrapeAddonSite } from "./scrape.ts";
import { extractDownloadUrl } from "./eval.ts";
import { getFinalDownloadUrl } from "./redirects.ts";
import { UpstreamError } from "./error.ts";

const downloadsDir = "/downloads";

export type DownloadResult = {
  downloadUrl: string;
  cacheUrl: string;
};

/**
 * This function downloads an addon ZIP file, by reusing the existing scrape flow
 * (FlareSolverr for the Cloudflare-protected addon page) to resolve the final CDN URL,
 * and then downloading the ZIP file itself via a plain fetch() call. The new file is
 * written atomically (temp file + rename), and any previously saved ZIP file for the
 * same addon slug is only deleted after the new one is fully in place, so a client
 * requesting the file mid-refresh always sees either the old or the new complete file
 */
export async function downloadAddonZip(
  addonSlug: string,
): Promise<DownloadResult> {
  const scrapeResult = await scrapeAddonSite(addonSlug);
  const downloadUrl = extractDownloadUrl(scrapeResult.siteContent);
  const finalUrl = await getFinalDownloadUrl(
    downloadUrl,
    scrapeResult.siteHeaders,
  );
  const zipBytes = await downloadZipFile(finalUrl);
  const fileName = buildFileName(addonSlug, finalUrl);
  await saveZipFile(addonSlug, fileName, zipBytes);
  const cacheUrl = buildCacheUrl(fileName);
  return { downloadUrl: finalUrl, cacheUrl };
}

async function downloadZipFile(url: string): Promise<Uint8Array> {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    throw new UpstreamError(
      `Download: Received error response while downloading ZIP file (HTTP ${response.status})`,
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function buildFileName(addonSlug: string, url: string): string {
  const pathname = new URL(url).pathname;
  const originalFileName = pathname.split("/").pop();
  if (!originalFileName || !originalFileName.toLowerCase().endsWith(".zip")) {
    throw new UpstreamError(
      "Download: Could not determine a valid ZIP file name from the final download URL",
    );
  }
  return `${addonSlug}_${originalFileName}`;
}

async function saveZipFile(
  addonSlug: string,
  fileName: string,
  zipBytes: Uint8Array,
): Promise<void> {
  // Sanity check if this actually looks like a ZIP file ("PK" magic bytes)
  if (zipBytes.length < 4 || zipBytes[0] !== 0x50 || zipBytes[1] !== 0x4b) {
    throw new UpstreamError(
      'Download: The downloaded content does not look like a ZIP file (missing "PK" signature)',
    );
  }
  await Deno.mkdir(downloadsDir, { recursive: true });
  const finalPath = `${downloadsDir}/${fileName}`;
  const tempPath = `${downloadsDir}/.tmp-${crypto.randomUUID()}-${fileName}`;
  // Write to a temp file first and then atomically rename into place
  // This way a concurrent reader never sees a half-written file
  await Deno.writeFile(tempPath, zipBytes);
  await Deno.rename(tempPath, finalPath);
  // Only remove old versions after the new file is safely in place
  // Any client that already has an open read handle on an old file is unaffected by Deno.remove()
  // POSIX keeps the underlying data alive until the last open handle is closed
  await deleteOldVersions(addonSlug, fileName);
}

async function deleteOldVersions(
  addonSlug: string,
  currentFileName: string,
): Promise<void> {
  const prefix = `${addonSlug}_`;
  const removals: Promise<void>[] = [];
  for await (const entry of Deno.readDir(downloadsDir)) {
    if (
      entry.isFile && entry.name.startsWith(prefix) &&
      entry.name !== currentFileName
    ) {
      removals.push(Deno.remove(`${downloadsDir}/${entry.name}`));
    }
  }
  await Promise.all(removals);
}

function buildCacheUrl(fileName: string): string {
  const baseUrl = Deno.env.get("BASE_URL");
  if (!baseUrl) {
    throw new Error('Missing "BASE_URL" environment variable');
  }
  return `${baseUrl.replace(/\/$/, "")}/files/${encodeURIComponent(fileName)}`;
}
