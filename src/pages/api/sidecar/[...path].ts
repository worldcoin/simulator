import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Catch-all proxy route that forwards requests to the World ID v4 proof sidecar.
 * Keeps the SIDECAR_URL server-side only (no NEXT_PUBLIC_ prefix).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const sidecarUrl = process.env.SIDECAR_URL;

  if (!sidecarUrl) {
    return res.status(503).json({ error: "SIDECAR_URL not configured" });
  }

  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path.join("/") : path;
  const targetUrl = `${sidecarUrl}/${targetPath}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Sidecar proxy error:", error);
    return res.status(502).json({ error: "Failed to reach sidecar" });
  }
}
