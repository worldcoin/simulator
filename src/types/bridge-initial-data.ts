import type { VerificationLevel } from "@worldcoin/idkit-core";

export type BridgeIdentityAttribute =
  | { type: "document_number"; value: string }
  | { type: "document_type"; value: "eid" | "mnc" | "passport" }
  | { type: "full_name"; value: string }
  | { type: "issuing_country"; value: string }
  | { type: "minimum_age"; value: number }
  | { type: "nationality"; value: string };

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
  // IDKit v4 Identity Check attributes, present for identityCheck(...).
  // An empty array still means Identity Check with no attribute filters.
  identity_attributes?: BridgeIdentityAttribute[];
};
