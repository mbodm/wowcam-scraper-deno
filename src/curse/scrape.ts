import { UpstreamError } from "./error.ts";

export type ScrapeResult = {
  siteContent: string;
  siteHeaders: SiteHeaders;
};

export type SiteHeaders = {
  userAgent: string;
  cookiesString: string;
};

type FlareSolverrCookie = {
  name: string;
  value: string;
};

type FlareSolverrResponse = {
  status?: string;
  message?: string;
  solution?: {
    status?: number;
    response?: string;
    userAgent?: string;
    cookies?: FlareSolverrCookie[];
  };
};

/**
 * This function scrapes a Curse addon site (by using FlareSolverr) and returns the site's HTML content and the scraper's request headers
 */
export async function scrapeAddonSite(
  addonSlug: string,
): Promise<ScrapeResult> {
  const flareSolverrUrl = "http://flaresolverr:8191/v1";
  const addonSiteUrl = `https://www.curseforge.com/wow/addons/${addonSlug}`;
  const response = await fetch(flareSolverrUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cmd: "request.get",
      url: addonSiteUrl,
      maxTimeout: 30000,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    throw new UpstreamError(
      `Scrape: Received error response from internal FlareSolverr API (HTTP ${response.status})`,
    );
  }
  const obj: FlareSolverrResponse = await response.json();
  validateFlareSolverrResponseObject(obj);
  validateCurseResponseStatus(obj);
  const siteContent = getAddonSiteContent(obj);
  const siteHeaders = getAddonSiteHeaders(obj);
  return { siteContent, siteHeaders };
}

//////////////////////////////////////////////////////////////////////
// FlareSolverr response JSON looks like this:                      //
//////////////////////////////////////////////////////////////////////
// {
//     "solution": {
//         "url": "https://www.google.com/?gws_rd=ssl",
//         "status": 200,
//         "headers": { ... },
//         "response": "<!DOCTYPE html>...",
//         "cookies": [
//             { "name": "NID", "value": "204=QE3O...", "domain": ".google.com", ... }
//         ],
//         "userAgent": "Windows NT 10.0; Win64; x64) AppleWebKit/5..."
//     },
//     "status": "ok",
//     "message": "",
//     "startTimestamp": 1594872947467,
//     "endTimestamp": 1594872949617,
//     "version": "1.0.0"
// }
//////////////////////////////////////////////////////////////////////

function validateFlareSolverrResponseObject(obj: FlareSolverrResponse): void {
  if (!obj) {
    throw new UpstreamError(
      "Scrape: The received response object, from internal FlareSolverr API, was null or undefined",
    );
  }
  if (!obj.status) {
    throw new UpstreamError(
      'Scrape: The received "status", from internal FlareSolverr API, was null, undefined, or an empty string',
    );
  }
  // The "message" is allowed to be null or an empty string (but it has to exist)
  if (obj.message === undefined) {
    throw new UpstreamError(
      'Scrape: The received "message", from internal FlareSolverr API, was undefined',
    );
  }
  if (obj.status.toLowerCase() !== "ok") {
    console.error(`FlareSolverr "status" was: "${obj.status}"`);
    console.error(`FlareSolverr "message" was: "${obj.message}"`); // If message is null then it shows "null"
    throw new UpstreamError(
      "Scrape: The received response object, from internal FlareSolverr API, indicates that scraping was not successful",
    );
  }
  if (!obj.solution) {
    throw new UpstreamError(
      'Scrape: The received "solution", from internal FlareSolverr API, was null or undefined',
    );
  }
}

function validateCurseResponseStatus(obj: FlareSolverrResponse): void {
  // FlareSolverr obj was already validated above
  const status = Number(obj.solution!.status); // Number conversion never throws
  if (Number.isNaN(status) || status < 1 || status > 1024) {
    throw new UpstreamError(
      "Scrape: Could not determine Curse addon site response status",
    );
  }
  if (status === 404) {
    // Note:
    // This check is not reliable. We do a second check below, inspecting the site content.
    // Because FlareSolverr may show HTTP 200 OK, but receives a Curse 404 page as content.
    throw new UpstreamError(
      "Scrape: Curse addon site does not exist for given addon name (internal FlareSolverr API showed HTTP 404)",
    );
  }
  if (status !== 200) {
    throw new UpstreamError(
      `Scrape: Curse addon site response status was not OK (internal FlareSolverr API showed HTTP ${status})`,
    );
  }
}

function getAddonSiteContent(obj: FlareSolverrResponse): string {
  // FlareSolverr obj was already validated above
  const siteContent = obj.solution!.response;
  if (!siteContent) {
    throw new UpstreamError(
      "Scrape: Could not determine Curse addon site page content",
    );
  }
  // 404 page detection
  if (siteContent.includes("NEXT_HTTP_ERROR_FALLBACK;404")) {
    throw new UpstreamError(
      "Scrape: Curse addon site does not exist for given addon name (internal FlareSolverr API received Curse 404 page)",
    );
  }
  return siteContent;
}

function getAddonSiteHeaders(obj: FlareSolverrResponse): SiteHeaders {
  // FlareSolverr obj was already validated above
  const userAgent = obj.solution!.userAgent;
  const cookiesArray = obj.solution!.cookies;
  if (!userAgent || !Array.isArray(cookiesArray)) {
    throw new UpstreamError(
      "Scrape: Could not determine Curse addon site header data (user-agent and cookies)",
    );
  }
  const kvpStrings = cookiesArray.map((item) => `${item.name}=${item.value}`);
  const cookiesString = kvpStrings.join("; "); // Empty array results in empty string ("")
  return { userAgent, cookiesString };
}
