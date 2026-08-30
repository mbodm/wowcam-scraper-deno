/**
 * Handles the "/" endpoint.
 */
export function handleRootEndpoint(): Response {
  return new Response("hello", { status: 200 });
}
