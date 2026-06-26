export const IDENTITY_ATTRIBUTES_NOT_MATCHED =
  "identity_attributes_not_matched";
export const CREDENTIAL_UNAVAILABLE = "credential_unavailable";

const PASSPORT_ISSUER_SCHEMA_ID = 9303;
const MNC_ISSUER_SCHEMA_ID = 9310;

type PersonaDocumentType = "mnc" | "passport";

type IdentityPersona = {
  document_type: PersonaDocumentType;
  document_number: string;
  issuing_country: string;
  full_name: string;
  age: number;
  nationality: string;
};

type PreflightErrorCode =
  typeof CREDENTIAL_UNAVAILABLE | typeof IDENTITY_ATTRIBUTES_NOT_MATCHED;

export type IdentityCheckPreflightResult =
  { ok: false; status: 400; errorCode: PreflightErrorCode } | { ok: true; body: Record<string, unknown> };

export function preflightSidecarProofRequestBody(
  input: unknown,
): IdentityCheckPreflightResult {
  const body = isRecord(input) ? input : {};
  const attributes = body.identity_attributes;

  if (!Array.isArray(attributes)) {
    return { ok: true, body };
  }

  const persona = parsePersona(body.persona);
  if (!persona) {
    return fail(CREDENTIAL_UNAVAILABLE);
  }

  if (!proofRequestIncludesPersonaDocument(body.proof_request, persona)) {
    return fail(CREDENTIAL_UNAVAILABLE);
  }

  if (!attributes.every((attribute) => attributeMatches(persona, attribute))) {
    return fail(IDENTITY_ATTRIBUTES_NOT_MATCHED);
  }

  const sidecarBody = { ...body };
  delete sidecarBody.identity_attributes;
  delete sidecarBody.persona;

  return { ok: true, body: sidecarBody };
}

function fail(errorCode: PreflightErrorCode): IdentityCheckPreflightResult {
  return { ok: false, status: 400, errorCode };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePersona(value: unknown): IdentityPersona | null {
  if (!isRecord(value)) return null;

  const {
    document_type,
    document_number,
    issuing_country,
    full_name,
    age,
    nationality,
  } = value;

  if (document_type !== "passport" && document_type !== "mnc") return null;
  if (typeof document_number !== "string") return null;
  if (typeof issuing_country !== "string") return null;
  if (typeof full_name !== "string") return null;
  if (typeof nationality !== "string") return null;
  if (typeof age !== "number" || !Number.isFinite(age)) return null;

  return {
    document_type,
    document_number,
    issuing_country,
    full_name,
    age,
    nationality,
  };
}

function proofRequestIncludesPersonaDocument(
  proofRequest: unknown,
  persona: IdentityPersona,
): boolean {
  if (!isRecord(proofRequest) || !Array.isArray(proofRequest.proof_requests)) {
    return false;
  }

  const expectedSchemaId =
    persona.document_type === "passport"
      ? PASSPORT_ISSUER_SCHEMA_ID
      : MNC_ISSUER_SCHEMA_ID;

  return proofRequest.proof_requests.some(
    (item) =>
      isRecord(item) &&
      typeof item.issuer_schema_id === "number" &&
      item.issuer_schema_id === expectedSchemaId,
  );
}

function attributeMatches(
  persona: IdentityPersona,
  attribute: unknown,
): boolean {
  if (!isRecord(attribute) || typeof attribute.type !== "string") {
    return false;
  }

  switch (attribute.type) {
    case "document_type": {
      const value = stringValue(attribute);
      if (value === "eid") return false;
      return value === persona.document_type;
    }
    case "document_number": {
      const value = stringValue(attribute);
      return value != null && trimEq(persona.document_number, value);
    }
    case "issuing_country": {
      const value = stringValue(attribute);
      return value != null && upperTrimEq(persona.issuing_country, value);
    }
    case "full_name": {
      const value = stringValue(attribute);
      return value != null && trimEq(persona.full_name, value);
    }
    case "minimum_age": {
      const value = numberValue(attribute);
      return value != null && persona.age >= value;
    }
    case "nationality": {
      const value = stringValue(attribute);
      return value != null && upperTrimEq(persona.nationality, value);
    }
    default:
      return false;
  }
}

function stringValue(attribute: Record<string, unknown>): string | null {
  return typeof attribute.value === "string" ? attribute.value : null;
}

function numberValue(attribute: Record<string, unknown>): number | null {
  return typeof attribute.value === "number" &&
    Number.isInteger(attribute.value) &&
    attribute.value >= 0
    ? attribute.value
    : null;
}

function trimEq(left: string, right: string): boolean {
  return left.trim() === right.trim();
}

function upperTrimEq(left: string, right: string): boolean {
  return left.trim().toUpperCase() === right.trim().toUpperCase();
}
