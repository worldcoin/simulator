import assert from "node:assert/strict";
import test from "node:test";

import { isIdentityCheckBridgeResponse } from "../src/lib/identity-check-response";

test("accepts IDKit's attested BridgeResponseV2_1 envelope", () => {
  assert.equal(
    isIdentityCheckBridgeResponse({
      proof_response: {
        id: "request-id",
        version: 1,
        responses: [],
      },
      identity_attested: true,
    }),
    true,
  );
});

test("rejects a bare proof response and false attestations", () => {
  assert.equal(
    isIdentityCheckBridgeResponse({
      id: "request-id",
      version: 1,
      responses: [],
    }),
    false,
  );
  assert.equal(
    isIdentityCheckBridgeResponse({
      proof_response: { id: "request-id" },
      identity_attested: false,
    }),
    false,
  );
});
