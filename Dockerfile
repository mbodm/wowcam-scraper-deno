FROM denoland/deno:latest

WORKDIR /app

COPY deno.json .
COPY main.ts .
COPY server ./server
COPY routes ./routes
COPY curse ./curse

USER deno
EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-read=/downloads", "--allow-write=/downloads", "--allow-env=BASE_URL", "main.ts"]
