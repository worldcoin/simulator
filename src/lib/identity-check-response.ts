export type IdentityCheckBridgeResponse = {
  proof_response: Record<string, unknown>;
  identity_attested: true;
};

/**
 * Identity Check uses IDKit's extended BridgeResponseV2_1 envelope. A bare
 * ProofResponse is valid for other v4 requests, but must never be accepted for
 * an Identity Check because it would drop the attestation result.
 */
export function isIdentityCheckBridgeResponse(
  value: unknown,
): value is IdentityCheckBridgeResponse {
  if (typeof value !== "object" || value === null) return false;
  const response = value as Record<string, unknown>;
  return (
    response.identity_attested === true &&
    typeof response.proof_response === "object" &&
    response.proof_response !== null &&
    !Array.isArray(response.proof_response)
  );
}
