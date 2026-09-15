import type { IconType } from "@/components/Icon";
import type { ProofArt } from "@/lib/assets";
import type { Identity } from "@/types";
import { VerificationLevel } from "@worldcoin/idkit-core";

/**
 * World App shows each World ID credential as a card. The simulator only has
 * the four legacy verification levels, so they map onto the closest cards:
 * Orb -> Human, Document -> Passport, Secure Document -> ID, Device -> Device.
 */
export type CredentialKind = "device" | "human" | "id" | "passport";

export type SecurityLevel = "highest" | "low" | "medium";

export interface CredentialDefinition {
  kind: CredentialKind;
  level: VerificationLevel;
  /** Card and detail title, e.g. "Human". */
  title: string;
  /** Card footer, rendered uppercase, e.g. "ANONYMOUS". */
  subtitle: string;
  /** Pill label in the verification request sheet. */
  pill: string;
  /** Proof an app receives when this credential is presented. */
  proof: string;
  proofArt: ProofArt;
  icon: IconType;
  security: SecurityLevel;
  method: string;
  issuer: string;
  proofs: { title: string; description: string; art: ProofArt }[];
  privacy: { title: string; description: string }[];
}

export const SECURITY_LABEL: Record<SecurityLevel, string> = {
  low: "Low",
  medium: "Medium",
  highest: "Highest",
};

export const CREDENTIALS: Record<CredentialKind, CredentialDefinition> = {
  human: {
    kind: "human",
    level: VerificationLevel.Orb,
    title: "Human",
    subtitle: "Anonymous",
    pill: "Human",
    proof: "Unique Human",
    proofArt: "human",
    icon: "human-emblem",
    security: "highest",
    method: "Orb",
    issuer: "World Foundation",
    proofs: [
      {
        title: "Proof of Unique Human",
        description:
          "Prove you're a unique person without revealing your identity",
        art: "human",
      },
    ],
    privacy: [
      {
        title: "Orb image",
        description: "Converted to a unique code, then permanently deleted",
      },
    ],
  },
  passport: {
    kind: "passport",
    level: VerificationLevel.Document,
    title: "Passport",
    subtitle: "Verified",
    pill: "Passport",
    proof: "Unique document",
    proofArt: "unique-document",
    icon: "contact-book",
    security: "medium",
    method: "NFC",
    issuer: "Tools for Humanity",
    proofs: [
      {
        title: "Proof of age",
        description: "Prove you're an adult without sharing your date of birth",
        art: "age",
      },
      {
        title: "Proof of nationality",
        description: "Prove which country issued your passport",
        art: "nationality",
      },
      {
        title: "Proof of name",
        description: "Share the name printed on your passport",
        art: "full-name",
      },
    ],
    privacy: [
      {
        title: "ID photo",
        description: "Processed locally, never saved",
      },
    ],
  },
  id: {
    kind: "id",
    level: VerificationLevel.SecureDocument,
    title: "ID",
    subtitle: "Verified",
    pill: "ID",
    proof: "Unique document",
    proofArt: "unique-document",
    icon: "card-credential",
    security: "medium",
    method: "NFC",
    issuer: "Tools for Humanity",
    proofs: [
      {
        title: "Proof of age",
        description: "Prove you're an adult without sharing your date of birth",
        art: "age",
      },
      {
        title: "Proof of name",
        description: "Share the name printed on your ID",
        art: "full-name",
      },
    ],
    privacy: [
      {
        title: "ID photo",
        description: "Processed locally, never saved",
      },
    ],
  },
  device: {
    kind: "device",
    level: VerificationLevel.Device,
    title: "Device",
    subtitle: "Active",
    pill: "Device",
    proof: "Unique device",
    proofArt: "liveness",
    icon: "smartphone",
    security: "low",
    method: "Device",
    issuer: "Tools for Humanity",
    proofs: [
      {
        title: "Proof of unique device",
        description: "Prove this device belongs to a single person",
        art: "liveness",
      },
    ],
    privacy: [
      {
        title: "Device key",
        description: "Generated and kept on this device",
      },
    ],
  },
};

/** Display order of the card stack, strongest credential on top. */
export const CREDENTIAL_ORDER: CredentialKind[] = [
  "human",
  "passport",
  "id",
  "device",
];

export const credentialForLevel = (
  level: VerificationLevel,
): CredentialDefinition =>
  CREDENTIAL_ORDER.map((kind) => CREDENTIALS[kind]).find(
    (credential) => credential.level === level,
  ) ?? CREDENTIALS.human;

/** Credentials the identity is verified for, in stack order. */
export const credentialsForIdentity = (
  identity: Identity | null | undefined,
): CredentialDefinition[] =>
  CREDENTIAL_ORDER.map((kind) => CREDENTIALS[kind]).filter(
    (credential) => identity?.verified[credential.level] ?? false,
  );
