# Cloudflare Workers deployment

The simulator runs on Workers through OpenNext, including the MCP, sequencer,
and sidecar API routes. Infrastructure PR
[53664](https://github.com/worldcoin/infrastructure/pull/53664) provisions the
Workers and Cloudflare for SaaS hostnames in the TFH account.

| Target     | Worker         | Custom hostname             | Wrangler environment |
| ---------- | -------------- | --------------------------- | -------------------- |
| Staging    | simulator-dev  | staging-simulator.world.org | default              |
| Production | simulator-prod | simulator.world.org         | prod                 |

## Build and verify

Use Node 22 and the package manager pinned in `package.json`:

```sh
pnpm install --frozen-lockfile
pnpm build:cloudflare
pnpm exec wrangler deploy --env "" --dry-run
pnpm exec wrangler deploy --env prod --dry-run
pnpm preview:cloudflare
```

The build runs the existing Next.js and Workbox build before packaging the
Worker, so the proof files and generated service worker are included. Local
preview uses the Workers runtime. Put local runtime secrets in `.dev.vars`
(ignored by git), using the names below. No Cloudflare credentials are needed
for the build or dry runs.

All application pages render on demand and there is no ISR or on-demand
revalidation. The read-only static asset cache handles any build-time cache
entries; the R2 buckets and cache Durable Object Workers provisioned by the
infrastructure template are unused. No cache-worker bootstrap is required.
Add those bindings only if the app starts using revalidation.

## Workers Builds setup

After Terraform has applied, connect each existing Worker to `worldcoin/simulator`
in Cloudflare Settings → Builds. Use the repository root, Node 22, and the pinned
pnpm version. Configure `NEXT_PUBLIC_DEV_PORTAL_URL=https://developer.world.org`
as a build variable for both targets; this is also the application's default.

| Target     | Build command                      | Deploy command     |
| ---------- | ---------------------------------- | ------------------ |
| Staging    | `pnpm build:cloudflare`            | `pnpm deploy:dev`  |
| Production | `pnpm build:cloudflare --env prod` | `pnpm deploy:prod` |

Select `main` as the production branch for each Worker. For non-production
branch previews of the production Worker, use `pnpm upload:prod` as the
non-production deploy command; it uploads a version without replacing the live
production deployment. Preview URLs are enabled and infrastructure controls
preview access. The MCP endpoint deliberately accepts only the named staging
and production hosts, not arbitrary version preview hosts.

## Runtime secrets

Set these separately on **both** Workers before the first deployment, through
Cloudflare Settings → Variables and Secrets or `pnpm exec wrangler secret put NAME`
(add `--env prod` for production):

- `SIDECAR_URL`: HTTPS URL of the existing, reachable native proof sidecar.
- `BEARER_TOKEN`: its private bearer token.
- `POLYGON_ORB_SEQUENCER_STAGING_PASSWORD`
- `POLYGON_PHONE_SEQUENCER_STAGING_PASSWORD`
- `POLYGON_SECURE_DOCUMENT_SEQUENCER_STAGING_PASSWORD`
- `POLYGON_DOCUMENT_SEQUENCER_STAGING_PASSWORD`

These are runtime bindings, not build variables. Do not prefix secrets with
`NEXT_PUBLIC_`. Both targets generate staging proofs. The Rust sidecar still
runs in its existing service; it is not bundled into the Worker. GitHub
environment secrets alone do not populate Workers runtime secrets: this repo
has no secret-sync workflow.

## Validate and cut over

Before changing DNS, test the corresponding
`https://simulator-dev.worldcoin.workers.dev` and
`https://simulator-prod.worldcoin.workers.dev` hosts:

1. Load the UI, create an identity, and reload a nested `/id/<id>` route.
2. Confirm `/sw.js`, `/semaphore/semaphore.wasm`, and
   `/semaphore/semaphore.zkey` load and the proof downloads complete.
3. Connect an actual staging verification request and complete a proof.
4. Discover and call `/api/mcp` using the procedure in [mcp.md](./mcp.md).
5. Check that an untrusted MCP Origin receives HTTP 403.

The build currently reports OpenNext's experimental Node.js proxy support and
Next.js's existing automatic-static-optimization warning. Verify the CSP header
on rendered pages during the runtime smoke test; `src/proxy.ts` supplies it.

The Foundation team must publish the CNAME, ownership, and certificate-validation
records from the infrastructure `simulator_dev_dcv` and `simulator_prod_dcv`
outputs. Confirm the SaaS bindings are active before cutting traffic over.
This PR does not change DNS or disable the existing Vercel deployment.
`simulator.worldcoin.org` remains accepted by MCP during that transition.
Rollback a failed application release by selecting the previous deployment in
Cloudflare. Coordinate any DNS rollback with the Foundation team.
