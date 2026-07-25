import { preflightSidecarProofRequestBody } from "@/lib/identity-check-preflight";
import { isIdentityCheckBridgeResponse } from "@/lib/identity-check-response";
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
  const isIdentityCheck =
    req.method !== "GET" &&
    typeof req.body === "object" &&
    req.body !== null &&
    Array.isArray((req.body as Record<string, unknown>).identity_attributes);
  const preflight =
    req.method !== "GET" ? preflightSidecarProofRequestBody(req.body) : null;

  if (preflight && !preflight.ok) {
    return res.status(preflight.status).json({
      error_code: preflight.errorCode,
    });
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(process.env.BEARER_TOKEN && {
          Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
        }),
      },
      body:
        req.method !== "GET"
          ? JSON.stringify(preflight?.body ?? req.body)
          : undefined,
    });

    const data: unknown = await response.json();
    if (
      response.ok &&
      isIdentityCheck &&
      !isIdentityCheckBridgeResponse(data)
    ) {
      return res.status(502).json({
        error: "Sidecar did not return an Identity Check attestation",
      });
    }
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Sidecar proxy error:", error);
    return res.status(502).json({ error: "Failed to reach sidecar" });
  }
}
