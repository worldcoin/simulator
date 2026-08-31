import assert from "node:assert/strict";
import test from "node:test";

import {
  CREDENTIAL_UNAVAILABLE,
  IDENTITY_ATTRIBUTES_NOT_MATCHED,
  preflightSidecarProofRequestBody,
} from "../src/lib/identity-check-preflight";

const documentProofRequest = {
  proof_requests: [
    { identifier: "passport", issuer_schema_id: 9303 },
    { identifier: "mnc", issuer_schema_id: 9310 },
  ],
};

const passportPersona = {
  document_type: "passport",
  document_number: "X1234567",
  issuing_country: "USA",
  full_name: "John Doe",
  age: 30,
  nationality: "USA",
};

const mncPersona = {
  document_type: "mnc",
  document_number: "5550100",
  issuing_country: "USA",
  full_name: "Jane Doe",
  age: 28,
  nationality: "USA",
};

const eidPersona = {
  document_type: "eid",
  document_number: "D01234567",
  issuing_country: "DEU",
  full_name: "Erika Example",
  age: 42,
  nationality: "DEU",
};

test("passes through non Identity Check requests unchanged", () => {
  const body = {
    identity_index: 0,
    proof_request: {
      proof_requests: [{ identifier: "orb", issuer_schema_id: 128 }],
    },
  };

  const result = preflightSidecarProofRequestBody(body);

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("expected preflight success");
  assert.deepEqual(result.body, body);
});

test("rejects a mismatched document number before the sidecar sees the request", () => {
  const result = preflightSidecarProofRequestBody({
    identity_index: 0,
    proof_request: documentProofRequest,
    identity_attributes: [
      { type: "document_type", value: "passport" },
      { type: "document_number", value: "WRONG" },
    ],
    persona: passportPersona,
  });

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    errorCode: IDENTITY_ATTRIBUTES_NOT_MATCHED,
  });
});

test("accepts matching passport attributes and preserves sidecar fields", () => {
  const body = {
    proof_request: documentProofRequest,
    identity_attributes: [
      { type: "document_type", value: "passport" },
      { type: "document_number", value: " X1234567 " },
      { type: "issuing_country", value: "usa" },
      { type: "full_name", value: "John Doe" },
      { type: "minimum_age", value: 18 },
      { type: "nationality", value: "usa" },
    ],
    persona: passportPersona,
  };
  const result = preflightSidecarProofRequestBody(body);

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("expected preflight success");
  assert.deepEqual(result.body, body);
});

test("accepts matching mnc attributes when the mnc schema is requested", () => {
  const body = {
    proof_request: documentProofRequest,
    identity_attributes: [
      { type: "document_type", value: "mnc" },
      { type: "document_number", value: "5550100" },
    ],
    persona: mncPersona,
  };
  const result = preflightSidecarProofRequestBody(body);

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("expected preflight success");
  assert.deepEqual(result.body, body);
});

test("accepts an eID persona backed by the ICAO-9303 credential", () => {
  const body = {
    proof_request: documentProofRequest,
    identity_attributes: [
      { type: "document_type", value: "eid" },
      { type: "issuing_country", value: "deu" },
      { type: "nationality", value: "DEU" },
    ],
    persona: eidPersona,
  };
  const result = preflightSidecarProofRequestBody(body);

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("expected preflight success");
  assert.deepEqual(result.body, body);
});

test("rejects Identity Check requests without a persona", () => {
  const result = preflightSidecarProofRequestBody({
    identity_index: 0,
    proof_request: documentProofRequest,
    identity_attributes: [{ type: "document_number", value: "X1234567" }],
  });

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    errorCode: CREDENTIAL_UNAVAILABLE,
  });
});

test("rejects Identity Check requests that do not request the selected document schema", () => {
  const result = preflightSidecarProofRequestBody({
    identity_index: 0,
    proof_request: {
      proof_requests: [{ identifier: "orb", issuer_schema_id: 128 }],
    },
    identity_attributes: [{ type: "document_number", value: "X1234567" }],
    persona: passportPersona,
  });

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    errorCode: CREDENTIAL_UNAVAILABLE,
  });
});

test("rejects mnc personas when the mnc schema is not requested", () => {
  const result = preflightSidecarProofRequestBody({
    identity_index: 0,
    proof_request: {
      proof_requests: [{ identifier: "passport", issuer_schema_id: 9303 }],
    },
    identity_attributes: [{ type: "document_number", value: "5550100" }],
    persona: mncPersona,
  });

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    errorCode: CREDENTIAL_UNAVAILABLE,
  });
});

test("fails closed on malformed identity attributes", () => {
  const result = preflightSidecarProofRequestBody({
    identity_index: 0,
    proof_request: documentProofRequest,
    identity_attributes: [{ type: "minimum_age", value: "18" }],
    persona: passportPersona,
  });

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    errorCode: IDENTITY_ATTRIBUTES_NOT_MATCHED,
  });
});

test("an empty attribute list is still an Identity Check request", () => {
  const body = {
    proof_request: documentProofRequest,
    identity_attributes: [],
    persona: passportPersona,
  };
  const result = preflightSidecarProofRequestBody(body);

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("expected preflight success");
  assert.deepEqual(result.body, body);
});

test("minimum age matches at the boundary and rejects one year above", () => {
  const atBoundary = preflightSidecarProofRequestBody({
    proof_request: documentProofRequest,
    identity_attributes: [{ type: "minimum_age", value: 30 }],
    persona: passportPersona,
  });
  assert.equal(atBoundary.ok, true);

  const aboveBoundary = preflightSidecarProofRequestBody({
    proof_request: documentProofRequest,
    identity_attributes: [{ type: "minimum_age", value: 31 }],
    persona: passportPersona,
  });
  assert.deepEqual(aboveBoundary, {
    ok: false,
    status: 400,
    errorCode: IDENTITY_ATTRIBUTES_NOT_MATCHED,
  });
});

test("fails closed on unknown attributes and out-of-range ages", () => {
  for (const attribute of [
    { type: "date_of_birth", value: "1990-01-01" },
    { type: "minimum_age", value: -1 },
    { type: "minimum_age", value: 256 },
  ]) {
    const result = preflightSidecarProofRequestBody({
      proof_request: documentProofRequest,
      identity_attributes: [attribute],
      persona: passportPersona,
    });

    assert.deepEqual(result, {
      ok: false,
      status: 400,
      errorCode: IDENTITY_ATTRIBUTES_NOT_MATCHED,
    });
  }
});

test("rejects malformed persona country codes", () => {
  const result = preflightSidecarProofRequestBody({
    proof_request: documentProofRequest,
    identity_attributes: [{ type: "nationality", value: "USA" }],
    persona: { ...passportPersona, nationality: "US" },
  });

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    errorCode: CREDENTIAL_UNAVAILABLE,
  });
});
