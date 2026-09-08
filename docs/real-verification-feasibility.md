# Native World ID 4.0 feasibility result

Date: 2026-09-08 UTC

## Result

The existing deployed simulator successfully generated and delivered three fresh
native World ID 4.0 Proof of Human proofs. The application backend submitted them
to the normal Portal verification endpoint, received HTTP 200 with protocol 4.0
and staging environment, and persisted one SQLite receipt for each proof.

No synthetic payload endpoint, Redis verdict record, or mocked prover/verifier
was used. All three responses lacked synthetic-test provenance.

| Scenario                          | Portal HTTP status | New application receipt     | Total receipts |
| --------------------------------- | ------------------ | --------------------------- | -------------- |
| Fresh native v4 request 1         | 200                | Yes                         | 1              |
| One altered proof element         | 400                | No                          | 1              |
| Replay of request 1's valid proof | 200                | No; application returns 409 | 1              |
| Fresh native v4 request 2         | 200                | Yes                         | 2              |
| Fresh native v4 request 3         | 200                | Yes                         | 3              |

The altered proof returned `all_verifications_failed` with a per-result
`verification_failed` code. The backend's successful verification calls took
995 ms, 811 ms, and 854 ms. Whole-request times included agent-driven UI interaction
and must not be interpreted as prover latency.

## Reproduction context

- Simulator baseline: `881d7a51177ff528b6e6e5fa522ea09506979e02`.
- Browser: the deployed `https://simulator.worldcoin.org` site, entered through its
  existing `connect_url` deep link, with the v4 option explicitly selected.
- IDKit Core: 4.2.1, `allow_legacy_proofs: false`, Proof of Human preset.
- Test app: `app_cf5cd5a5e60bdb13538b566f75200899`.
- RP: `rp_8b126cd91b9967c4`; both production and staging registration were confirmed
  on-chain through the Portal registration-status tool before testing.
- Verifier: `https://developer.world.org/api/v4/verify/rp_8b126cd91b9967c4`.
- Fixture: [local application](../examples/real-verification/README.md), requiring
  the server-generated nonce/action and native v4 staging response.
- Application storage: Node 22 SQLite, with a unique nullifier constraint.

This result establishes the existing real proof path before adding an MCP
adapter. It does not establish production-device behavior, session proofs, every
credential family, deployment capacity, or an availability guarantee.

Signing keys, identity seeds, bridge encryption keys, full connection URLs and
proof payloads are deliberately absent from this report.

## MCP adapter validation

The local MCP endpoint was also exercised with the official TypeScript SDK client
against the deployed simulator proof gateway. Discovery returned
`complete_test_request`; its call generated and delivered a real native proof in
10,283 ms. The application's existing browser callback independently forwarded
that proof to its backend, received Portal HTTP 200 with native 4.0 staging
acceptance, and created receipt 4. Backend verification took 891 ms.

The MCP result contained only delivery status and the original request ID. No
simulator UI approval was performed for this request, and the Portal's synthetic
verification infrastructure was not used.

A second live MCP run exercised IDKit's standard Base64 key encoding and the
current SDK negotiation path. Proof delivery took 10,396 ms; the separate backend
result matched the original request ID, reported native v4 staging acceptance,
and created receipt 5. Backend verification took 827 ms. The connection parser has
a regression test for both standard Base64 and URL-safe Base64 keys.

The final adapter validation used MCP protocol `2026-07-28` and checked the
prover's compressed-hex wire response against the original request before
delivery. It completed in 10,403 ms; the application independently accepted native
v4 staging verification in 872 ms and created receipt 6. The deterministic tests
also exercise legacy MCP negotiation.
