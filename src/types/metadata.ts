import type { VerificationRequestParams } from "@worldcoin/id";

export interface ApprovalRequestMetadata {
  action_id: VerificationRequestParams["action_id"];
  project_name: string;
  description: string;
  logo_image: string;
  validated?: true;
}
