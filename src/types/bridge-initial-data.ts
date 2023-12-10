import type { CredentialType } from "@worldcoin/idkit-core";

export type BridgeInitialData = {
  app_id: string;
  credential_types: CredentialType[];
  action_description: string;
  action: string;
  signal: string;
};
