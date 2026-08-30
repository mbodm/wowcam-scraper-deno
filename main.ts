import { startServer } from "@/api/server.ts";

const server = startServer(8000);

Deno.addSignalListener("SIGTERM", () => exitGracefully("SIGTERM"));
Deno.addSignalListener("SIGINT", () => exitGracefully("SIGINT"));

function exitGracefully(signal: string): void {
  console.log(`Closing server now, because received ${signal} signal.`);
  // Force exit if server.shutdown() hangs
  const forceExitTimer = setTimeout(() => {
    console.error(
      "Forcing exit, because a timeout occurred while closing server.",
    );
    Deno.exit(1);
  }, 10 * 1000);
  server.shutdown()
    .then(() => {
      clearTimeout(forceExitTimer);
      console.log("Server successfully closed.");
      Deno.exit(0);
    })
    .catch((err) => {
      clearTimeout(forceExitTimer);
      console.error(
        "Forcing exit, because an error occurred while closing server:",
        err,
      );
      Deno.exit(1);
    });
}
