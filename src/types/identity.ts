import type { VerificationLevel } from "@worldcoin/idkit-core";
import type { InclusionProofResponse } from "./sequencer";

interface InterfaceMeta {
  readonly name: string;
  readonly idNumber: number;
}

export type V4DocumentType = "mnc" | "passport";

export interface V4IdentityPersona {
  readonly documentType: V4DocumentType;
  readonly documentNumber: string;
  readonly issuingCountry: string;
  readonly fullName: string;
  readonly age: number;
  readonly nationality: string;
}

export interface IdentityProfile {
  readonly v4Persona: V4IdentityPersona;
  readonly sidecarPersonaIndex?: number;
}

export interface Identity {
  readonly id: string;
  readonly meta: InterfaceMeta;
  readonly zkIdentity: string;
  readonly profile: IdentityProfile;
  verified: Record<VerificationLevel, boolean>;
  inclusionProof: Record<
    VerificationLevel,
    InclusionProofResponse | null
  > | null;
  proofGenerationTime: number | null;
}
