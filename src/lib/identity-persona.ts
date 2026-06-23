import type {
  Identity,
  IdentityProfile,
  V4DocumentType,
  V4IdentityPersona,
} from "@/types/identity";

export const V4_DOCUMENT_TYPES: readonly V4DocumentType[] = ["passport", "mnc"];

export const V4_DOCUMENT_TYPE_LABELS: Record<V4DocumentType, string> = {
  passport: "Passport",
  mnc: "MNC",
};

export const DEFAULT_V4_PERSONA: V4IdentityPersona = {
  documentType: "passport",
  documentNumber: "X1234567",
  issuingCountry: "USA",
  fullName: "Alex Example",
  age: 30,
  nationality: "USA",
};

type PartialProfileIdentity = {
  profile?: Partial<IdentityProfile> | null;
  meta?: { idNumber?: number };
};

function normalizeUpperCode(value: string): string {
  return value.trim().toUpperCase();
}

function coerceDocumentType(value: unknown): V4DocumentType {
  return value === "mnc" ? "mnc" : "passport";
}

function coerceAge(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  return DEFAULT_V4_PERSONA.age;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeV4Persona(
  persona: Partial<V4IdentityPersona> | null | undefined,
): V4IdentityPersona {
  return {
    documentType: coerceDocumentType(persona?.documentType),
    documentNumber:
      typeof persona?.documentNumber === "string"
        ? persona.documentNumber.trim()
        : DEFAULT_V4_PERSONA.documentNumber,
    issuingCountry:
      typeof persona?.issuingCountry === "string"
        ? normalizeUpperCode(persona.issuingCountry)
        : DEFAULT_V4_PERSONA.issuingCountry,
    fullName:
      typeof persona?.fullName === "string"
        ? persona.fullName.trim()
        : DEFAULT_V4_PERSONA.fullName,
    age: coerceAge(persona?.age),
    nationality:
      typeof persona?.nationality === "string"
        ? normalizeUpperCode(persona.nationality)
        : DEFAULT_V4_PERSONA.nationality,
  };
}

export function getIdentityProfile(
  identity: PartialProfileIdentity,
): IdentityProfile {
  const metaIdNumber = identity.meta?.idNumber;
  const profileSidecarPersonaIndex = identity.profile?.sidecarPersonaIndex;
  const sidecarPersonaIndex = isFiniteNumber(metaIdNumber)
    ? metaIdNumber
    : isFiniteNumber(profileSidecarPersonaIndex)
    ? profileSidecarPersonaIndex
    : 0;

  return {
    v4Persona: normalizeV4Persona(identity.profile?.v4Persona),
    sidecarPersonaIndex,
  };
}

export function withIdentityProfile(identity: Identity): Identity {
  return {
    ...identity,
    profile: getIdentityProfile(identity),
  };
}

export function serializeV4PersonaForSidecar(persona: V4IdentityPersona) {
  const normalized = normalizeV4Persona(persona);
  return {
    document_type: normalized.documentType,
    document_number: normalized.documentNumber,
    issuing_country: normalized.issuingCountry,
    full_name: normalized.fullName,
    age: normalized.age,
    nationality: normalized.nationality,
  };
}

export function formatV4PersonaSummary(identity: Identity): string {
  const persona = getIdentityProfile(identity).v4Persona;
  return `${V4_DOCUMENT_TYPE_LABELS[persona.documentType]} - ${
    persona.fullName
  }`;
}
