import type { CredentialType, VerificationLevel } from "@worldcoin/idkit-core";

export type BridgeInitialData = {
  app_id: `app_${string}`;
  /**
   * @deprecated This field is deprecated and may be removed in future versions.
   */
  credential_types?: CredentialType[];
  verification_level?: VerificationLevel; // FIXME: Remove optional when all apps will be updated
  action_description: string;
  action: string;
  signal: string;
};
