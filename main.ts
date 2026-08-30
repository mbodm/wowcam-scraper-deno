import { startServer } from "@/api/server.ts";

const server = startServer(8000);

Deno.addSignalListener("SIGTERM", () => exitGracefully("SIGTERM"));
Deno.addSignalListener("SIGINT", () => exitGracefully("SIGINT"));

function exitGracefully(signal: string): void {
  console.log(`Closing server now, because a ${signal} signal was received.`);
  // Force exit if server.shutdown() hangs
  const cb = () => {
    console.error("Forcing exit, because a timeout occurred while closing the server.");
    Deno.exit(1);
  };
  const delay = 10 * 1000;
  const forceExitTimer = setTimeout(cb, delay);
  server.shutdown()
    .then(() => {
      clearTimeout(forceExitTimer);
      console.log("Server successfully closed.");
      Deno.exit(0);
    })
    .catch((err) => {
      clearTimeout(forceExitTimer);
      console.error("Forcing exit, because an error occurred while closing the server:", err);
      Deno.exit(1);
    });
}
