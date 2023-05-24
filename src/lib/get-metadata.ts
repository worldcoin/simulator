import type {
  ApprovalRequestMetadata,
  VerificationRequestParams,
} from "@/types/metadata";

interface ActionPayload {
  id: string;
  name: string;
  logo_url: string;
  is_staging: boolean;
  is_verified: boolean;
  action: {
    external_nullifier: string;
    action_description: string;
    nullifiers: [{ nullifier_hash: string }];
  };
}

interface ActionBody {
  action: string;
  external_nullifier: string;
  nullifier_hash?: string;
}

export async function fetchApprovalRequestMetadata(
  params: VerificationRequestParams,
  nullifierHash?: string,
): Promise<Partial<ApprovalRequestMetadata>> {
  const { app_id, action, action_description, external_nullifier } = params;
  const meta: Partial<ApprovalRequestMetadata> = {
    app_id,
    description: action_description,
  };

  try {
    const url = new URL(
      `https://developer.worldcoin.org/api/v1/precheck/${app_id}`,
    );
    const body: ActionBody = {
      action,
      external_nullifier,
    };

    if (nullifierHash) {
      body.nullifier_hash = nullifierHash;
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      console.info("App is not registered in the dev portal.");
      return meta;
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch metadata service: ${response.statusText}`,
      );
    }

    const content = (await response.json()) as ActionPayload;

    meta.description =
      content.action.action_description !== ""
        ? content.action.action_description
        : meta.description;
    meta.project_name = content.name;
    meta.logo_image = content.logo_url;
    meta.validated = content.is_verified || undefined;
    meta.nullifiers = content.action.nullifiers;
  } catch (err) {
    console.error(err);
  }
  return meta;
}
