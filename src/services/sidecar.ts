/** Shared by the browser proxy and the MCP operation. Credentials stay server-side. */
export async function fetchSidecar(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const origin = process.env.SIDECAR_URL;
  if (!origin) throw new Error("Proof service is not configured");
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (process.env.BEARER_TOKEN) {
    headers.set("Authorization", `Bearer ${process.env.BEARER_TOKEN}`);
  }
  return fetch(`${origin.replace(/\/$/, "")}/${path}`, {
    ...init,
    headers,
    redirect: "error",
  });
}
