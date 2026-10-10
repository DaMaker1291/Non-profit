# Deployment

How OpenMind is deployed, and — stated plainly — how it is **not** deployed yet.

This document is written against the actual repository, not an aspirational
architecture. Where the deployment brief describes a capability the code does
not have, it is marked **PROPOSED** and the honest current state is given beside
it. A deployment document that claims a database this project does not use is
worse than no document, because it is believed.

---

## 1. What "deployed" means for OpenMind

> A real learner can use OpenMind unsupervised, repeatedly and safely, and the
> system can survive failures without losing or corrupting their educational
> state.

The evidence ledger is what makes the second half of that true: the learner model
is a *projection* of server-authored events, so it can be rebuilt rather than
recovered by hand. Do not trade that away for storage convenience.

## 2. Environments

| | Development | Staging | Production |
|---|---|---|---|
| Purpose | your machine | a real build, disposable | real learners |
| Data | `.openmind-data/` (throwaway) | its own data directory | its own **durable volume** |
| Secrets | none needed | separate values | separate values |
| AI | optional / stubbed | optional | optional (fallback is a supported state) |
| Build | `next dev` | same artefact as production | the built artefact |

The one rule that overrides every other convenience:

> Never test a migration, an authentication change or a data change directly on
> production.

Today this repository runs the **same code** in all three environments; the only
difference is configuration (`lib/env.ts` reports it) and the data directory
(`OPENMIND_DATA_DIR`, `lib/server/store.ts`). Staging is therefore a second
directory and a second build, not a second codebase.

## 3. Topology

```text
                     INTERNET
                        │
                 DNS + HTTPS (CDN/WAF)
                        │
                  Reverse proxy
                        │
             ┌──────────┴──────────┐
             │                     │
        OpenMind (Next.js)     background work
        standalone server      (none today — PROPOSED)
             │
       ┌─────┼─────────────┐
       │     │             │
   data dir  app assets  AI providers
   (JSONL)   (in bundle) (optional)
```

Self-hosted Next.js expects a reverse proxy in front of it; that is also where
request limits and rate limiting belong (see §10 below and `SECURITY.md`).

**PROPOSED** — the brief's PostgreSQL + object storage + AI gateway topology is
the right *destination* and the wrong *starting point*. It is not built here.
Section 5 says why, and what would have to change to get there.

## 4. Build and run

```bash
# Local app (production build, port 3000)
./start-openmind.sh                 # builds if needed, then serves
./start-openmind.sh --stop          # stop it

# Docker
docker compose up -d                # → http://localhost:4173

# Without Docker
npm ci && npm run build && npm start
```

`next.config.mjs` builds a `standalone` server. A standalone server serves HTML
that points at a **separate content-hashed static tree**, which is why
`start-openmind.sh` copies `public` and `.next/static` next to `server.js` and
then *verifies over HTTP* that the page it serves is styled. That verification is
not ceremony — this repository once shipped a completely unstyled page that
returned HTTP 200. `scripts/verify-build-assets.mjs` and
`scripts/verify-render.mjs` are the gates that make it impossible to serve that
silently.

**Why development builds somewhere else.** `next.config.mjs` keys the build
directory on the Next PHASE: `next build`/`next start` write `.next` (what the
Dockerfile, CI, the launcher above and `scripts/production-server.mjs` all name),
and `next dev` writes `.next-dev`. That is not tidiness. While both shared
`.next`, running `npm run dev` next to a served app **deleted the running
server's bundle** — `BUILD_ID`, `standalone/server.js` and the hashed `static/`
tree — and the live process carried on answering HTTP 200 with every asset it
pointed at gone, which is precisely the unstyled page above. A dev server must
never be able to touch a servable artefact, and `NEXT_DIST_DIR` overrides both
phases for a gate that needs to build somewhere harmless.

After **any** rebuild:

1. restart the server (`./start-openmind.sh --stop; ./start-openmind.sh`),
2. run `npm run verify:render` (it fetches the *running* server's stylesheet),
3. confirm the new code is in the shipped bundle, e.g.
   `grep -rl "diag.certaintyAsk" .next/static`.

A render gate run against a stale server reports good CSS as broken. That mistake
has already cost time once; the restart is part of the procedure, not optional.

## 5. Persistence — the honest current state

| Layer | Now | Proposed for public scale |
|---|---|---|
| Profiles, classes, papers, packs | `profiles.json`, `classes.json`, … in `OPENMIND_DATA_DIR` | PostgreSQL tables |
| Evidence ledger | one append-only JSONL file per learner, `evidence/<id>.jsonl` | an append-only `evidence_events` table |
| Large files | served from the app bundle | object storage (packs, exports, PDFs) |
| Migrations | **none** — the shape is code | versioned SQL migrations |

Why the ledger stays append-only conceptually even if the store changes: the
event log *is* the record. Moving it into a table changes where the bytes live,
not what they mean.

**THE SCHEMA AND THE MIGRATION MACHINERY EXIST. THE APPLICATION IS STILL
FILE-BACKED.** Both halves of that sentence matter, and stating only one of them
is how a repository lies to the person deploying it.

What exists, and is exercised on every run of the database gate:

```text
db/migrations/0001_initial.(up|down).sql            identity, cohorts, ledger, artefacts
             0002_evidence_indexes.(up|down).sql   indexes + the append-only guard
             0003_course_versions.(up|down).sql    content releases, evidence binding
scripts/migrate.mjs                                 status | up | down | rehearse | verify
```

Every migration is PAIRED and CHECKED: the runner refuses a migration with no
`.down.sql`, refuses to apply anything on top of an applied migration whose file
has since changed (checksum drift — how staging and production silently diverge),
and refuses `down` in production without `--force`. `npm run db:verify` executes
the schema's own claims against a real database inside a rolled-back transaction
— a re-sent event id is refused, an event cannot be `UPDATE`d, an unsafe learner
id is rejected by the schema itself, and erasure still `DELETE`s — and
`npm run db:rehearse` runs up → verify → **all the way down** → up, so
"reversible" is a demonstrated fact rather than an intention.

What does NOT exist: the application's reads and writes still go to
`OPENMIND_DATA_DIR` (`lib/server/store.ts`). No route, projection or replay reads
these tables yet. Moving the store is the remaining work, and it is the largest
single piece between today and public multi-instance deployment. Until it is
done, the deployment is single-instance and `db:migrate` is a step that keeps a
schema ready rather than a step this build depends on.

The deployment sequence this is built for is unchanged, and the migration step
now exists to put in it:

```text
backup → migration → application rollout → health check

  npm run db:status     # drift + pending, read-only; production-check runs this
  npm run db:migrate    # after the backup, before the rollout
  npm run db:verify     # the schema's invariants, executed and rolled back
```

`production-check` NEVER migrates. It reads `status` and fails if the schema is
pending or drifted, because a checklist that silently changed a production schema
while reporting PASS would be the worst possible behaviour for the one command
people run to decide whether to ship.

**Duplicate keys / foreign keys must be modelled deliberately**: `evidence_events`
is append-only with a unique key on `event.id` (that is the same idempotency
rule `lib/server/evidence.ts#appendEvidence` enforces today), and learner ids are
validated before becoming any storage key.

## 6. Durable data vs deployable code

The deployment image contains the application, the curriculum engine, the
question engine and the UI. It must **not** contain learner data. Today the
image is clean only if `OPENMIND_DATA_DIR` points at a volume: the default
(`./.openmind-data`) lives *inside* the application directory, which is fine on a
school laptop and wrong in a container. `lib/env.ts` reports this as a note, and
`/api/ready` confirms the store is writable.

**PROPOSED** — a shared cache/queue for multi-instance deployments. Next.js's
self-hosting guidance calls this out; this repo is single-instance today.

### 6.1 Proving the store is durable, not just writable

`/api/ready` answers "is the store writable", and a writable store inside a
container's ephemeral layer answers **yes** — right up to the redeploy that
discards it. So the durability claim is tested by the one fact that separates
the two products: **does the record outlive the process?**

```text
npm run verify:persistence                 # complete test, locally, automatically

# against a deployment (a restart cannot be triggered from here, so it is two phases)
OPENMIND_BASE=https://… npm run verify:persistence -- --write
#   … now restart or redeploy the instance …
OPENMIND_BASE=https://… npm run verify:persistence -- --verify
```

Local mode builds the artefact, boots it on a temp store, creates a learner with
a real diagnostic sitting, a practice answer and a class, then **stops the
process, boots a second one over the same store** and requires every fact back:
the profile, the evidence ledger (byte-identical), the answers, the concept's
whole dimension row, the projection version, the class and its join code. It
also asserts the write landed in the directory it was *pointed at* and nowhere
else, because a deployment that ignored `OPENMIND_DATA_DIR` would pass every
other assertion while writing a classroom into its own image.

The remote half refuses to pass unless a restart genuinely happened. The witness
is `/api/health`'s own `uptimeSeconds`: if the process start time is unchanged
from the write phase, the same process answered, nothing restarted, and a green
result would be a lie.

Set `OPENMIND_DATA_DIR` to a mounted volume (Fly's `/data`, a Render disk, a
Docker volume) and keep `OPENMIND_SESSION_SECRET` beside that mount's backup —
the secret signs every session cookie, so losing it signs every learner out.

## 7. Configuration and secrets

Everything OpenMind reads is listed in `.env.example` and validated by
`lib/env.ts`. The design is unusual and deliberate: **no variable is required**.
A laptop with an empty `.env` runs the whole product.

Variables that matter:

| Variable | Meaning |
|---|---|
| `OPENMIND_DATA_DIR` | where learning data lives |
| `OPENMIND_SESSION_SECRET` | session-cookie signing secret (else generated in the data dir) |
| `OPENMIND_AI_BASE_URL` / `OPENMIND_AI_KEY` / `OPENMIND_AI_MODEL` / `OPENMIND_AI_TIMEOUT_MS` | your own model endpoint |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `GROQ_API_KEY` / `OPENROUTER_API_KEY` | vendor AI (any one) |
| `OPENMIND_IMPACT_KEY` | gate for the aggregate impact report |
| `NEXT_PUBLIC_APP_URL` | public origin for canonical URLs / sitemap |
| `OPENMIND_DEPLOYMENT_ID` | the release identity shown by `/api/health` |

Rules:

- `.env` and `.env.*.local` are gitignored. Only `NEXT_PUBLIC_*` values reach the
  browser, and only intentionally.
- `lib/env.ts` treats a **present-but-wrong** value as a *problem* (a key with no
  endpoint, a 4-character signing secret, a refused deployment profile) and an
  **undeclared** value as a *note*. `/api/ready` fails on problems only.
- **PROPOSED** — a real secret manager. Today secrets come from the process
  environment or from files in the data directory; there is no vault, and there
  is no rotation tooling beyond changing the value and redeploying.

## 8. Deployment sequence

```text
1. git commit (production is immutable — never edit a file on the server)
2. CI gates green (§9)
3. build the artefact
4. deploy the artefact
5. GET /api/health   → 200 (liveness)
6. GET /api/ready    → 200 (storage writable, config well-formed, content loaded)
7. npm run smoke     → public pages, assets, health, 404 handling
8. npm run verify:permissions + verify:sync against the deployed base URL
9. npm run verify:persistence -- --write → restart the instance → --verify
   (the record must survive it; a redeploy may never wipe a learner)
```

## 9. CI (what runs, and where)

`.github/workflows/gates.yml` runs the engine suite, content checks, the content
ceiling, a production build, asset-integrity and render gates, and the HTTP e2e
suite. `.github/workflows/ci.yml` adds the deployment-readiness gates
(content-release version, permissions, offline sync, smoke) on the same push.
`.github/workflows/deploy-staging.yml` and `deploy-production.yml` are templates:
they show the *shape* of a gated rollout and deliberately fail until a real
environment is configured (see the comments in each file). They do not pretend a
host exists.

## 10. HTTPS, headers and rate limiting

**HTTPS + reverse proxy**: required in production, terminated before Next.js.
The session cookie sets `Secure` automatically when the request arrives over
HTTPS or carries `x-forwarded-proto: https` (`lib/server/auth.ts#cookieAttributes`)
— so a real HTTPS deployment gets the flag, and a plain-HTTP school install still
works.

**Rate limiting: PROPOSED.** There is no rate limiter in this repository. The
right place is the reverse proxy (signup, signin, AI, answer submission, sync,
upload, teacher invitations) because it also protects the process before a
request costs anything. This is listed as a launch blocker in `SECURITY.md`.

**Security headers: PROPOSED.** No `Content-Security-Policy`,
`Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` or
`Permissions-Policy` is currently set by the app; they belong at the proxy.

## 11. Rollback

Production is a build artefact, not an edited filesystem. Rollback = deploy the
previous artefact and, after a check, the previous `/api/ready`.

```text
v17 serving → deploy v18 → problem found → redeploy v17 artefact
```

`OPENMIND_DEPLOYMENT_ID` is how you know which artefact a learner was on. Where a
release changed *content*, the previous content version stays published in
`audit/content-release.json`'s git history and can be restored by reverting that
file (see `verify-content-release.mjs`). Where a release changed the **evidence
schema**, a rollback is not enough — see `DATA_GOVERNANCE.md`.

## 12. Known gaps before public launch

Ordered by risk, and each is honest:

1. **No database in use.** The schema, reversible migrations and the rehearsal
   exist and are gated (§5), but the application still reads and writes the
   file-backed store: single-instance, fine for one school, wrong for a growing
   public service. `DATA_GOVERNANCE.md` §5.
2. **No rate limiting.** `SECURITY.md`.
3. **No security headers.** §10 above.
4. **No external error/uptime monitoring.** `/api/health` and `/api/ready` exist
   to be polled; nothing polls them and nothing aggregates errors. `OPERATIONS.md`.
5. **No backup automation.** There is a documented copy-the-directory procedure
   and a restore drill (`OPERATIONS.md` §4); nothing runs on a schedule.
6. **SEO for public pages only** — no `robots.txt`, `sitemap.xml`, canonical URLs
   or Open Graph metadata yet. **PROPOSED.**
7. **Accessibility is gated, not audited** — `npm run verify:ui` drives a real
   browser, but there has been no formal WCAG 2.2 audit.
8. **PWA install polish** — a service worker and an offline page exist
   (`public/sw.js`, `/offline`); an install prompt / add-to-home-screen flow has
   not been designed.
