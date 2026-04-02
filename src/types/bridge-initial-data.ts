import type { VerificationLevel } from "@worldcoin/idkit-core";

export type BridgeInitialData = {
  app_id: `app_${string}`;
  verification_level: VerificationLevel;
  action_description: string;
  action: string;
  signal: string;
  // IDKit v4: indicates the app environment, absent in older payloads
  environment?: "production" | "staging";
  // IDKit v4: protocol-level proof request, absent in v3 payloads.
  // Opaque JSON passed through to the sidecar for proof generation.
  proof_request?: Record<string, unknown>;
};
