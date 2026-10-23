/** Session creation can accompany a uniqueness proof; only the proof type routes it. */
export function proofEndpoint(request: Record<string, unknown>) {
  return request.proof_type === "session"
    ? "proof/session"
    : "proof/uniqueness";
}
