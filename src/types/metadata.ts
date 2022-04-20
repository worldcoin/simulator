import type { VerificationRequestParams } from "@worldcoin/id";

export interface ApprovalRequestMetadata {
  external_nullifer: VerificationRequestParams["externalNullifier"];
  project_name: string;
  description: string;
  logo_image: string;
  validated?: true;
}
