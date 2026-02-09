import {
  DEV_PORTAL_PRECHECK_URL,
  DEV_PORTAL_PROOF_CONTEXT_URL,
} from "@/lib/constants";
import type { MetadataParams, MetadataResponse } from "@/types";

async function precheckAction(
  request: MetadataParams,
): Promise<MetadataResponse | null> {
  const url = new URL(request.app_id, DEV_PORTAL_PRECHECK_URL);
  const body = {
    action: request.action,
    nullifier_hash: request.nullifier_hash,
  };

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok && response.status === 404) {
      console.warn("Action is not registered in the Developer Portal");
      return null;
    } else if (!response.ok) {
      throw new Error(
        `Unable to fetch metadata, ${response.status}: ${response.statusText}`,
      );
    }

    return (await response.json()) as MetadataResponse;
  } catch (error) {
    console.error(`Error fetching metadata, ${error}`);
  }
  return null;
}

// IDKit v4: fetch app metadata via /proof-context endpoint
async function proofContextAction(
  request: MetadataParams,
): Promise<Partial<MetadataResponse> | null> {
  const url = new URL(request.app_id, DEV_PORTAL_PROOF_CONTEXT_URL);
  const body: Record<string, string> = {};
  if (request.action) body.action = request.action;
  if (request.environment) body.environment = request.environment;

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.warn(
        `proof-context failed (${response.status}), will fall back to precheck`,
      );
      return null;
    }

    const data = (await response.json()) as {
      app_id: string;
      is_verified: boolean;
      name: string;
      verified_app_logo: string;
      action?: { description?: string; action?: string };
    };
    // Map proof-context response to MetadataResponse shape
    return {
      id: data.app_id,
      is_staging: true, // Allow simulator to proceed for any valid v4 app
      is_verified: data.is_verified,
      name: data.name,
      verified_app_logo: data.verified_app_logo,
      action: data.action
        ? { description: data.action.description, action: data.action.action }
        : undefined,
    };
  } catch (error) {
    console.error(`Error fetching proof-context: ${error}`);
    return null;
  }
}

export async function fetchMetadata(
  request: MetadataParams,
): Promise<Partial<MetadataResponse>> {
  let metadata: Partial<MetadataResponse> = {
    id: request.app_id,
    action: {
      description: request.action_description,
    },
  };

  // IDKit v4: use /proof-context when environment is provided
  // Legacy: fall back to /precheck
  const response = request.environment
    ? await proofContextAction(request)
    : await precheckAction(request);

  if (response) {
    metadata = {
      ...metadata,
      ...response,
    };
  }
  return metadata;
}
