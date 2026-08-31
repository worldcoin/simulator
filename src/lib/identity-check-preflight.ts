export const IDENTITY_ATTRIBUTES_NOT_MATCHED =
  "identity_attributes_not_matched";
export const CREDENTIAL_UNAVAILABLE = "credential_unavailable";

const PASSPORT_ISSUER_SCHEMA_ID = 9303;
const MNC_ISSUER_SCHEMA_ID = 9310;

type PersonaDocumentType = "eid" | "mnc" | "passport";

type IdentityPersona = {
  document_type: PersonaDocumentType;
  document_number: string;
  issuing_country: string;
  full_name: string;
  age: number;
  nationality: string;
};

type PreflightErrorCode =
  | typeof CREDENTIAL_UNAVAILABLE
  | typeof IDENTITY_ATTRIBUTES_NOT_MATCHED;

export type IdentityCheckPreflightResult =
  | {
      ok: true;
      body: Record<string, unknown>;
    }
  | { ok: false; status: 400; errorCode: PreflightErrorCode };

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

  // Keep both fields in the forwarded body. The Rust sidecar is the authority
  // that evaluates the request's constraint tree and emits the attested
  // BridgeResponseV2_1 wrapper.
  return { ok: true, body };
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

  if (
    document_type !== "passport" &&
    document_type !== "eid" &&
    document_type !== "mnc"
  ) {
    return null;
  }
  if (typeof document_number !== "string" || !document_number.trim()) {
    return null;
  }
  if (!isIsoAlpha3(issuing_country)) return null;
  if (typeof full_name !== "string" || !full_name.trim()) return null;
  if (!isIsoAlpha3(nationality)) return null;
  if (
    typeof age !== "number" ||
    !Number.isInteger(age) ||
    age < 0 ||
    age > 255
  ) {
    return null;
  }

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

  // Passport and eID are both ICAO-9303 NFC credentials. MNC uses its
  // dedicated request item in the current IDKit Identity Check preset.
  const expectedSchemaId =
    persona.document_type === "mnc"
      ? MNC_ISSUER_SCHEMA_ID
      : PASSPORT_ISSUER_SCHEMA_ID;

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
    attribute.value >= 0 &&
    attribute.value <= 255
    ? attribute.value
    : null;
}

function isIsoAlpha3(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z]{3}$/.test(value.trim());
}

function trimEq(left: string, right: string): boolean {
  return left.trim() === right.trim();
}

function upperTrimEq(left: string, right: string): boolean {
  return left.trim().toUpperCase() === right.trim().toUpperCase();
}
