import { RouteError } from "@/server/errors.ts";

/**
 * Handles the "/files/:filename" endpoint (serves ZIP files from the downloads folder).
 */
export async function handleFilesEndpoint(url: URL): Promise<Response> {
  const requestedName = decodeURIComponent(url.pathname.replace("/files/", ""));
  if (
    !requestedName || requestedName.includes("/") ||
    requestedName.includes("..")
  ) {
    throw new RouteError(400, "Invalid file name in request URL.");
  }
  const filePath = `/downloads/${requestedName}`;
  let stats: Deno.FileInfo;
  let file: Deno.FsFile;
  try {
    stats = await Deno.stat(filePath);
    file = await Deno.open(filePath, { read: true });
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new RouteError(404, "File not found.");
    }
    throw err;
  }
  return new Response(file.readable, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-length": String(stats.size),
      "content-disposition": `attachment; filename="${requestedName}"`,
      "cache-control": "no-store",
    },
  });
}
