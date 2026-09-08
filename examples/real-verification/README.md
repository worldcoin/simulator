# Real verification fixture

This local application signs a World ID request, collects a native v4 proof through
IDKit, verifies it with the normal deployed Portal endpoint, and inserts a receipt
into SQLite only after acceptance. It does not use synthetic test payloads or a
mocked prover/verifier.

Requires Node 22, an external app with an RP registered in staging, and its existing
server-side signing key. The fixture uses IDKit Core 4.2.1 through a dev-only alias;
the simulator's legacy browser SDK is unchanged.

```sh
WORLD_ID_APP_ID=app_your_app WORLD_ID_RP_ID=rp_your_rp \
  node --env-file=/absolute/path/to/private-signing.env \
  examples/real-verification/server.mjs
```

The private file contains `WORLD_ID_SIGNING_KEY`. Keep it outside tracked files.
Open `http://127.0.0.1:3087`, start a fresh verification, open the simulator, select
v4, and verify. The application's callback displays a sanitized backend result.

- Each fresh request has its own signed action and nonce.
- The backend requires staging and native `protocol_version: "4.0"`, and adds
  `min_protocol_version: "4.0"` to the Portal request.
- **Reject altered proof** changes one proof element and posts it through the same
  backend. It must not create a receipt.
- **Replay last proof** submits the original proof again. Portal may accept reuse;
  the SQLite uniqueness constraint prevents a second receipt and the app returns
  HTTP 409.
- `GET /api/state` returns sanitized observations. Full proofs and connector URLs
  are not included. Local receipts are stored in the ignored `.state` directory.

The fixture binds to loopback and is intended for local integration testing only.
