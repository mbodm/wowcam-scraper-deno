import { startServer } from "@/api/server.ts";

const server = startServer(8000);

const onSigterm = () => exitGracefully("SIGTERM");
const onSigint = () => exitGracefully("SIGINT");

Deno.addSignalListener("SIGTERM", onSigterm);
Deno.addSignalListener("SIGINT", onSigint);

async function exitGracefully(signal: string): Promise<void> {
  console.log(`Closing server now, because a ${signal} signal was received.`);
  // Force exit if server.shutdown() hangs
  const id = setTimeout(() => {
    console.error("Forcing exit, because a timeout occurred while closing the server.");
    Deno.exit(1);
  }, 10 * 1000);
  try {
    await server.shutdown();
    clearTimeout(id);
    Deno.removeSignalListener("SIGTERM", onSigterm);
    Deno.removeSignalListener("SIGINT", onSigint);
    console.log("Server successfully closed.");
  } catch (err) {
    console.error("Forcing exit, because an error occurred while closing the server:", err);
    Deno.exit(1);
  }
}
