import type {
  Identity,
  IdentityProfile,
  V4DocumentType,
  V4IdentityPersona,
} from "@/types/identity";

export const V4_DOCUMENT_TYPES: readonly V4DocumentType[] = [
  "passport",
  "eid",
  "mnc",
];

export const V4_DOCUMENT_TYPE_LABELS: Record<V4DocumentType, string> = {
  eid: "eID",
  passport: "Passport",
  mnc: "MNC",
};

export const DEFAULT_V4_PERSONA: V4IdentityPersona = {
  documentType: "passport",
  documentNumber: "X1234567",
  issuingCountry: "USA",
  fullName: "John Doe",
  age: 30,
  nationality: "USA",
};

const LEGACY_DEFAULT_V4_PERSONA: V4IdentityPersona = {
  ...DEFAULT_V4_PERSONA,
  fullName: "Alex Example",
};

type PartialProfileIdentity = {
  profile?: Partial<IdentityProfile> | null;
};

const ISO_ALPHA_3 = /^[A-Z]{3}$/;

function normalizeUpperCode(value: string): string {
  return value.trim().toUpperCase();
}

function coerceDocumentType(value: unknown): V4DocumentType {
  return value === "eid" || value === "mnc" ? value : "passport";
}

function coerceAge(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(255, Math.max(0, Math.floor(value)));
  }
  return DEFAULT_V4_PERSONA.age;
}

function isSamePersona(
  left: V4IdentityPersona,
  right: V4IdentityPersona,
): boolean {
  return (
    left.documentType === right.documentType &&
    left.documentNumber === right.documentNumber &&
    left.issuingCountry === right.issuingCountry &&
    left.fullName === right.fullName &&
    left.age === right.age &&
    left.nationality === right.nationality
  );
}

export function normalizeV4Persona(
  persona: Partial<V4IdentityPersona> | null | undefined,
): V4IdentityPersona {
  const normalized = {
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

  if (isSamePersona(normalized, LEGACY_DEFAULT_V4_PERSONA)) {
    return DEFAULT_V4_PERSONA;
  }

  return normalized;
}

export function getIdentityProfile(
  identity: PartialProfileIdentity,
): IdentityProfile {
  return {
    v4Persona: normalizeV4Persona(identity.profile?.v4Persona),
  };
}

export function validateV4Persona(
  persona: Partial<V4IdentityPersona>,
): string | null {
  if (
    persona.documentType == null ||
    !V4_DOCUMENT_TYPES.includes(persona.documentType)
  ) {
    return "Choose a supported document type";
  }
  if (!persona.documentNumber?.trim()) {
    return "Enter a document number";
  }
  if (!persona.fullName?.trim()) {
    return "Enter the full name shown on the document";
  }

  const issuingCountry = normalizeUpperCode(persona.issuingCountry ?? "");
  if (!ISO_ALPHA_3.test(issuingCountry)) {
    return "Issuing country must be a 3-letter country code";
  }

  const nationality = normalizeUpperCode(persona.nationality ?? "");
  if (!ISO_ALPHA_3.test(nationality)) {
    return "Nationality must be a 3-letter country code";
  }

  if (
    typeof persona.age !== "number" ||
    !Number.isInteger(persona.age) ||
    persona.age < 0 ||
    persona.age > 255
  ) {
    return "Age must be a whole number from 0 to 255";
  }

  return null;
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
  return `${V4_DOCUMENT_TYPE_LABELS[persona.documentType]} · ${
    persona.fullName
  }`;
}
