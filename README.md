# wowcam-scraper-deno

Deno/TypeScript port of the Node.js [wowcam-scraper](https://github.com/mbodm/wowcam-scraper) project.

Scrapes CurseForge WoW addon pages (via FlareSolverr, to bypass Cloudflare's
bot protection), resolves the real CDN download URL, downloads and caches the
ZIP file itself, and serves it back out again — all from a single small
service with zero external dependencies, running entirely on Deno's native
runtime APIs (no `node:` compatibility layer, no npm packages, no framework).

## Endpoints

- `GET /scrape?addon=<slug>` — resolves and returns the real CurseForge CDN
  download URL for an addon (no file is downloaded or stored)
- `GET /download?addon=<slug>` — downloads the addon's ZIP file, saves it
  under `/downloads` (atomically, replacing any older version of the same
  addon), and returns both the real CDN URL and a `cacheUrl` pointing at the
  locally cached file
- `GET /files/:filename` — serves a previously downloaded ZIP file

## Development

```sh
deno task dev     # run locally with file-watching
deno task check   # type-check the project
```

## Deployment

```sh
deno task release  # type-check, then rebuild and restart the containers
deno task logs     # follow the scraper container's logs
```

Requires `flaresolverr` running as a sibling container on the same Docker
network (see `docker-compose.yml`) and a writable `/downloads` volume mounted
into the container.
