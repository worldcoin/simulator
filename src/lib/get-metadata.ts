import type { ApprovalRequestMetadata } from "@/types/metadata";
import type { WalletConnectRequest } from "./init-walletconnect";

interface ActionPayload {
  id: string;
  public_description: string;
  name: string;
  is_staging: boolean;
  team: {
    app_name: string;
    is_verified: boolean;
    verified_app_logo?: string;
  };
}

export async function fetchApprovalRequestMetadata(
  request: WalletConnectRequest,
): Promise<Partial<ApprovalRequestMetadata>> {
  const [{ action_id, app_name, signal_description }] = request.params;
  const meta: Partial<ApprovalRequestMetadata> = {
    action_id,
    project_name: app_name,
    description: signal_description,
  };

  try {
    const req = await fetch(
      `https://developer.worldcoin.org/api/v1/precheck/${action_id}`,
    );
    if (req.status === 404) {
      console.info("Action is not registered in the dev portal.");
      return meta;
    }

    if (!req.ok) {
      throw new Error(`Failed to fetch metadata service: ${req.statusText}`);
    }

    const content = (await req.json()) as ActionPayload;

    meta.description = content.public_description;
    meta.project_name = content.team.app_name;
    meta.logo_image = content.team.verified_app_logo;
    meta.validated = content.team.is_verified || undefined;
  } catch (err) {
    console.error(err);
  }
  return meta;
}
