export type SidecarPath =
  | "health"
  | "identities"
  | "proof/session"
  | "proof/uniqueness";

/** Return fixed destinations rather than forwarding an arbitrary proxy path. */
export function getSidecarPath(path: string): SidecarPath | undefined {
  switch (path) {
    case "health":
      return "health";
    case "identities":
      return "identities";
    case "proof/session":
      return "proof/session";
    case "proof/uniqueness":
      return "proof/uniqueness";
    default:
      return undefined;
  }
}

/** Shared by the browser proxy and the MCP operation. Credentials stay server-side. */
export async function fetchSidecar(
  path: SidecarPath,
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
