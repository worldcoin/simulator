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
