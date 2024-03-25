import type { VerificationLevel } from "@worldcoin/idkit-core";

export type BridgeInitialData = {
  app_id: `app_${string}`;
  verification_level: VerificationLevel;
  action_description: string;
  action: string;
  signal: string;
};
