import assert from "node:assert/strict";
import { test } from "node:test";
import { proofEndpoint } from "../src/lib/proof-endpoint";

test("a requested session does not change the uniqueness proof flow", () => {
  for (const proof_type of [undefined, "uniqueness"]) {
    for (const session_id of [undefined, null, "create"]) {
      assert.equal(
        proofEndpoint({ proof_type, session_id }),
        "proof/uniqueness",
      );
    }
  }
});

test("explicit session proofs use the session endpoint for creation and reuse", () => {
  for (const session_id of ["create", "session_existing"]) {
    assert.equal(
      proofEndpoint({ proof_type: "session", session_id }),
      "proof/session",
    );
  }
});
