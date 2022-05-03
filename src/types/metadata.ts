import type { VerificationRequestParams } from "@worldcoin/id";

export interface ApprovalRequestMetadata {
  actionId: VerificationRequestParams["actionId"];
  project_name: string;
  description: string;
  logo_image: string;
  validated?: true;
}
