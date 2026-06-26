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

test("accepts matching passport attributes and strips simulator-only fields", () => {
  const result = preflightSidecarProofRequestBody({
    identity_index: 0,
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
  });

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("expected preflight success");
  assert.deepEqual(result.body, {
    identity_index: 0,
    proof_request: documentProofRequest,
  });
});

test("accepts matching mnc attributes when the mnc schema is requested", () => {
  const result = preflightSidecarProofRequestBody({
    identity_index: 0,
    proof_request: documentProofRequest,
    identity_attributes: [
      { type: "document_type", value: "mnc" },
      { type: "document_number", value: "5550100" },
    ],
    persona: mncPersona,
  });

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("expected preflight success");
  assert.deepEqual(result.body, {
    identity_index: 0,
    proof_request: documentProofRequest,
  });
});

test("rejects eid requests because the simulator only has passport and mnc personas", () => {
  const result = preflightSidecarProofRequestBody({
    identity_index: 0,
    proof_request: documentProofRequest,
    identity_attributes: [{ type: "document_type", value: "eid" }],
    persona: passportPersona,
  });

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    errorCode: IDENTITY_ATTRIBUTES_NOT_MATCHED,
  });
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
