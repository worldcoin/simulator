import type { Identity } from "@/types";
import { Chain, CredentialType } from "@/types";
import {
  OPTIMISM_ORB_SEQUENCER_STAGING,
  OPTIMISM_PHONE_SEQUENCER_STAGING,
  POLYGON_ORB_SEQUENCER_STAGING,
  POLYGON_PHONE_SEQUENCER_STAGING,
} from "./constants";

export function encode(value: bigint): string {
  return "0x" + value.toString(16).padStart(64, "0");
}

export function isPendingInclusion(
  identity: Identity,
  credentialTypes = [CredentialType.Orb, CredentialType.Phone],
): boolean {
  for (const credentialType of credentialTypes) {
    const status = identity.inclusionProof[credentialType]?.status;
    if (status === "new" || status === "pending") {
      return true;
    }
  }
  return false;
}

// Mappings
const POLYGON_SEQUENCER_ENDPOINT: Record<CredentialType, string> = {
  [CredentialType.Orb]: POLYGON_ORB_SEQUENCER_STAGING,
  [CredentialType.Phone]: POLYGON_PHONE_SEQUENCER_STAGING,
};

const OPTIMISM_SEQUENCER_ENDPOINT: Record<CredentialType, string | undefined> =
  {
    [CredentialType.Orb]: OPTIMISM_ORB_SEQUENCER_STAGING,
    [CredentialType.Phone]: OPTIMISM_PHONE_SEQUENCER_STAGING,
  };

export const SEQUENCER_ENDPOINT: Record<
  Chain,
  Record<CredentialType, string | undefined>
> = {
  [Chain.Polygon]: POLYGON_SEQUENCER_ENDPOINT,
  [Chain.Optimism]: OPTIMISM_SEQUENCER_ENDPOINT,
};
