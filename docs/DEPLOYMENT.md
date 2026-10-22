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
npm ci && npm run build
OPENMIND_DATA_DIR="$(pwd)/.openmind-data" npm start
```

**The one variable a non-Docker production start must set.** `next start` runs the
production artefact with `NODE_ENV=production`, so an undeclared data directory is
`data_dir_undeclared` — a BLOCKING code in `lib/env.ts`, not a note: `/api/ready`
answers 503 and every learner-record write is refused with `store_not_durable`,
because a production store inside the application directory is one redeploy away
from losing a classroom. `docker compose up -d` and `./start-openmind.sh` set it
from the artefact itself (the `Dockerfile`'s `ENV`, the script's own `export`); a
hand-typed `npm start` has to say it, and `npm run verify:install` fails if any
documented start path stops doing so.

**A warning `npm start` prints, and why the block above is still correct.** Next
says `"next start" does not work with "output: standalone"` — this app builds a
standalone server. The warning is advisory at this size: `npm start` was measured
(config, 17 Oct 2026) answering `/api/ready` 200, serving `/` **with its
stylesheet**, and accepting a learner record into the declared directory. But the
command that matches the build is `./start-openmind.sh`, which runs `node
server.js` and copies `public` + `.next/static` beside it before checking over
HTTP that the served page is styled; `node .next/standalone/server.js` on its own
is the one combination that can serve HTTP 200 and NO styling, so it is not
documented as a start command anywhere.

After starting:

```bash
OPENMIND_BASE=http://localhost:4173 npm run smoke      # readiness + what the store IS
test "$(curl -s -o /dev/null -w '%{http_code}' -X POST localhost:4173/api/profile -H 'content-type: application/json' -d '{}')" = 200 \
  && echo "a learner record is accepted"               # the write, not just the report
```

That last probe is the one that matters: `/api/ready` describing a store that then
refuses a write is exactly the state a learner meets as "it didn't save". A green
`npm run verify:install` proves readiness and write behaviour **on this host**; it
does **not** prove survival across a container replacement — only the restart drill
(`npm run verify:persistence -- --write`, replace the instance, `--verify`) answers that.

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
| Migrations | **5 paired SQL migrations** (`db/migrations`), checksummed and rehearsed by `db:rehearse` — applied to a schema this build does not read yet | the same files, serving the running application |
| Backend selection | the file store, always (`OPENMIND_STORE` defaults to `file`) | `OPENMIND_STORE=postgres` behind the port in [STORAGE_SPEC.md](STORAGE_SPEC.md) |

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
             0004_port_gaps.(up|down).sql          erasure log, AI cache, interventions
             0005_profile_record.(up|down).sql     the learner's own record (profiles.payload)
             0006_learner_identity.(up|down).sql   a profile that is NOT an account; the account
                                                   columns; the database's own boot record
scripts/migrate.mjs                                 status | up | down | rehearse | verify
lib/server/pg.ts                                    the connection: pool, transactions,
                                                   advisory locks, health, refusal
```

0006 is worth reading before deploying a database, because four of the five things
it changes are facts about this product that the original schema refused — found
by writing the connection layer against it rather than by re-reading it: a learner
record no longer REQUIRES an account row (the `/solve` and `/try` wedge, and the
guest path in onboarding, enrol before anyone types an email); the link to an
account is `ON DELETE SET NULL` rather than `CASCADE`, so deleting an identity row
cannot destroy a learner's record outside the logged erasure path; `users` gains
what an account actually is (email, scrypt hash and salt, role, `session_epoch`,
the owned profile, `verified`); and `store_boots` gives the measurement
`/api/ready` reports as `persistence.boots` somewhere to live on a deployment
whose store is a database. `profiles.payload` (0005) still carries the learner's
own record, and `learner_projections.model` still carries the derived half.

The connection layer is likewise real and tested, not scaffolding: `npm run
verify` asserts that a deployment asking for Postgres with no connection string is
REFUSED (never handed the file store), that an unreachable database is reported as
unreachable rather than as empty — the difference between "run the migrations" and
"your DNS is wrong" — and that two writers on ONE learner serialise across a
connection pool while two writers on different learners do not queue behind each
other. Those assertions need a database, so they run when
`OPENMIND_TEST_DATABASE_URL` names a scratch one (CI's `database` job does) and are
printed as SKIPPED otherwise — a skip, never a pass it did not earn.

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

### 5.1 The free external database: what an operator can do TODAY, and the one step that is blocked

This is the section to read if the host is Render's free web-service tier, where no
disk can be attached and the application directory is replaced on every deploy. The
architecture is right and the code is not finished; saying so precisely matters
more than sounding finished.

**You can do all of this now**, and it is safe to do against a real Neon project:

1. Create the free Neon project (free tier: 1 GB per project, 100 compute-hours a
   month, a six-hour instant-restore window). Neon hands you a connection string
   with `sslmode=require` — keep the whole string, including `sslmode`, and put it
   in the platform's secret store. Never in the repository, never in a `NEXT_PUBLIC_`
   variable.
2. From a checkout with that string in `DATABASE_URL`, put the schema on it:

   ```text
   DATABASE_URL='postgres://…' npm run db:migrate
   DATABASE_URL='postgres://…' npm run db:verify    # the schema's claims, executed
   DATABASE_URL='postgres://…' npm run db:status    # drift + pending, read-only
   ```

   The runner refuses to apply on top of drifted history, refuses a migration with
   no reverse, and never runs from `production-check` — so this is a step that can
   be repeated safely, and the rehearsal (`npm run db:rehearse`) needs a THROWAWAY
   database because it drops everything it created.
3. Read `/api/ready` on the running deployment. It reports the database as
   PROVISIONED AND NOT USED (`database_provisioned_not_used`) — a note, not a
   problem, and exactly the truth: the schema is ready and the store has not moved.
   Nothing about a learner's data is in the database yet.

**The blocked step is the last one**: `OPENMIND_STORE=postgres` is REFUSED at
startup until the whole record moves through the storage port ([STORAGE_SPEC.md](STORAGE_SPEC.md)
slice 3b) and the remaining domains and accounts move behind it (slice 4). The
LEDGER has already moved (slice 3a): `lib/server/evidence.ts` is a facade over the
port and `lib/server/evidence-file.ts` is the file backend's ledger, with both
halves asserted at the source in `npm run verify`. The PROFILE has not, and that
is what keeps the refusal: with profiles in `profiles.json` and a learner's
history in a database, one learner's record would live in two places — the split
this refusal exists to make unconfigurable. It is
refused rather than attempted because serving the file store to a deployment that
asked for a database puts a classroom's records on an ephemeral filesystem while
the operator believes they are in Postgres, and that failure is silent.

So, **on a host that discards its filesystem and offers no disk, this build cannot
yet keep a learner's data, and no configuration makes it**:

- `OPENMIND_DATA_DIR=/data` with `OPENMIND_DATA_DIR_DURABLE=1` is a DECLARATION
  about a path, and on a host with no disk there is nothing under it to declare —
  §6.2 is the measurement that produced the rule, and writes are refused there
  without a declaration and cannot be made durable with one.
- `OPENMIND_ALLOW_EPHEMERAL_STORE=1` makes the instance usable (a demo, a preview,
  a lesson) while `/api/ready` keeps reporting `durability:"ephemeral"` and every
  learner is lost on the next deploy. That is the honest free option today, and it
  is not a pilot.

**The free path that DOES keep data today** is a host with a real disk: a
free-tier virtual machine (the always-free tiers give a small one with a disk), a
school laptop, a Raspberry Pi, or any container host with a volume. There the
existing contract applies unchanged — `OPENMIND_DATA_DIR` pointing at the disk,
`OPENMIND_DATA_DIR_DURABLE=1`, and the restart drill in §6.1 to prove it — which
is exactly what `docker compose` and `./start-openmind.sh` already do, with no code
change at all. Once slice 3+4 land, the same repository runs on Render free + Neon
free, and this section becomes the steps to move to it.

That work is specified rather than pending: [STORAGE_SPEC.md](STORAGE_SPEC.md)
fixes the port, the crash-consistency rule, the parity mechanism and the
import/cutover/rollback plan. Four slices are done — the store's lock table and
data-directory resolver are single-owner; `lib/server/storage.ts` defines the port
with the file store behind it (`lib/server/storage-file.ts`), asserted at runtime
against the method list so nothing can implement the interface only in a type;
`npm run storage-check` drives the port's own semantics against every configured
backend, so a second backend cannot be introduced with a second test suite (it is
wired into `npm run production-check` and into the CI gate); and the LEDGER is on
the port (slice 3a) — the read/write side asynchronous, the file implementation
split into `lib/server/evidence-file.ts` behind the facade, every route and both
`.mjs` harnesses awaiting it, and the split enforced by source assertions (the
facade opens no files of its own; the file ledger has exactly one importer).
What remains of the write path (`withLearner`, the learner transaction, plus
profiles and accounts) is slice 3b, and the
Postgres backend is slice 4: **`OPENMIND_STORE=postgres` is refused at startup
until it exists**, deliberately, because a deployment that believes it is on a
database while writing single-process files is worse than one that will not
start. `lib/env.ts` reports the refusal as a configuration problem, so
`/api/ready` explains it rather than leaving a stack trace.

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

**AND THE PRODUCTION ARTEFACT NO LONGER REPORTS READY WITHOUT A DECLARED
STORE.** Writability on its own is the claim that survives the redeploy which
discards everything, so the readiness report gained the missing half: when the
process is the production build (`NODE_ENV=production`) and
`OPENMIND_DATA_DIR` is not declared, that is a **problem**, not a note —
`ready: false`, HTTP 503, problem code `data_dir_undeclared` — because the store
it just proved writable lives inside the directory the next deploy replaces.
Two ways out, and both are deliberate acts: declare `OPENMIND_DATA_DIR` on a
durable volume, or state in the environment that this deployment accepts an
ephemeral store (`OPENMIND_ALLOW_EPHEMERAL_STORE=1`, which turns it back into a
note for a throwaway instance). A laptop is unaffected —
`./start-openmind.sh` declares its data directory and the Dockerfile sets
`/data` — because the case this catches is the host that starts the image with
an empty environment and no operator watching it.

### 6.2 A declared directory was not enough either — measured on a live host

The rule above fires when `OPENMIND_DATA_DIR` is **undeclared**. A real
deployment got past it by declaring one, and the failure looked like a healthy
site:

```text
GET https://<host>/api/ready
{"ready":true, … "checks":{"data":{"ok":true,"code":"writable"}, …}, "problems":[]}

# 20 minutes and one instance sleep later, the learner created in between:
GET https://<host>/api/profile?id=stu_…&secret=…   →   HTTP 404
GET https://<host>/api/health                       →   uptimeSeconds: 20   (a NEW process)
```

A path is not a filesystem. `OPENMIND_DATA_DIR=/data` is silent on a host with
no volume attached, because `/data` is then just a directory in the layer the
host discards when the instance sleeps or a deploy lands. So `lib/env.ts` also
asks the FILESYSTEM, on hosts that are documented to discard theirs (`RENDER` on
Render, `DYNO` on Heroku, `FLY_APP_NAME`, `K_SERVICE`, `WEBSITE_SITE_NAME`).

**A device of its own is not a volume, and the first version of this check
therefore certified a deployment that was losing learners.** Measured on a live
Render service (free instance type, no disk): with the data directory inside the
app directory, `/api/ready` answered `store:{kind:"file",singleInstance:true,
durability:"durable",accepted:false,codes:[]}` — and 146 seconds after a deploy
had replaced the process, `verify:persistence -- --verify` reported **4 passed,
30 failed**, every learner-scoped read an HTTP 404: the learner, their record,
their ledger, their class's join code, the intervention review and its frozen
baseline. Inside a container the app directory IS a mount with a device of its
own, and the host throws it away with the image.

**So the judgement moved to the mount table — and the SAME host passed again.**
The fixed build was deployed and answered, verbatim:

```text
"store":{"kind":"file","singleInstance":true,"durability":"durable",
         "accepted":false,"codes":[]}
```

while the canary learner from the previous deploy was still gone. Render's
application directory is a mount of its own, on a filesystem of its own, and the
host rebuilds it anyway: reading `/proc/self/mountinfo` and taking the deepest
mount point above the store separated an overlay from a disk, and did not
separate a disk from a directory the host discards with the container.

**TWO MEASUREMENTS, TWO FALSE PASSES — AND THE CONCLUSION IS THE RULE.** No
statistic a process can take tells a disk the host keeps from a directory it
rebuilds, because the difference is only visible across the restart the question
is about. So the check was narrowed to what it can PROVE, and everything else is
enforced by DECLARATION plus the restart drill:

| data directory | readiness | writes | code |
|---|---|---|---|
| this is not a host that discards filesystems (a laptop, a school server, a self-hosted box) | ready | permitted | — |
| a host that discards filesystems, and the store is neither declared nor measured | **503** | **refused** | `durability_unknown` |
| the host's root filesystem, or an overlay/bind/tmpfs mount it rebuilds with the image | **503** | **refused** | `data_dir_not_durable` |
| no data directory declared at all on the production artefact | **503** | **refused** | `data_dir_undeclared` |
| `OPENMIND_DATA_DIR_DURABLE=1` over a mount that is NOT measured to be the host's own | ready | permitted, as a CLAIM | `durability_declared` (note) |
| `OPENMIND_ALLOW_EPHEMERAL_STORE=1` | ready | permitted, as a labelled demo | `ephemeral_store_accepted` (note) |
| both of those at once | **503** | **refused** | `durability_contradiction` |

Three properties of that table are deliberate:

- **A measurement outranks a declaration.** `OPENMIND_DATA_DIR_DURABLE=1` over a
  filesystem visibly the host's own (its root, an overlay, a tmpfs) is refused
  anyway: nobody may declare a tmpfs durable. A declaration may only ever RELAX
  an absence of knowledge, never contradict a measurement.
- **The refusal is enforced, not merely reported.** `lib/server/store.ts` throws
  `StoreWriteBlockedError` from the primitives every learner-record write goes
  through (`writeJson`, and the ledger's `appendEvidence`), so a route added
  tomorrow cannot forget it. Routes translate it
  (`lib/server/write-refusal.ts`) into **503 `store_not_durable`** carrying the
  report's own code and the variable an operator has to set. ERASURE and session
  identity writes are never refused: a store that cannot keep data is the worst
  place to keep it after a deletion request, and signing out must work
  everywhere.
- **The judgement is scoped to hosts the platforms themselves name** (`RENDER`,
  `DYNO`, `FLY_APP_NAME`, `K_SERVICE`, `WEBSITE_SITE_NAME`). On a laptop `/data`
  is that laptop's disk and flagging it would be a false alarm in the one place a
  developer reads the report. A store on an unrecognised host is reported as
  `mode:"host-durable"` — the question does not arise *as far as this process can
tell*, and the report says which of the two it is telling you.

**Render's free instance type cannot attach a disk at all**, so on that host the
choice is: a paid instance type with a disk (a path inside the source directory
such as `/opt/render/project/src/.openmind-data` is a valid mount path), a host
with volumes, or `OPENMIND_ALLOW_EPHEMERAL_STORE=1` and calling it a demo. The
last of those is a legitimate answer — it is the one that keeps the public
instance usable without anybody being told their history is safe.

**Publish readiness on the right endpoint.** Because a store the host discards
is a `data_dir_not_durable` PROBLEM, `/api/ready` answers **503** on such a
deployment while serving every request perfectly — which is the honest answer
("do not send learners here") and the wrong answer to give a liveness probe. A
host's health check must watch `/api/health` (is the process up?); `/api/ready`
is the release gate and the monitor's alarm, and a host that restarts on it would
be restarting the one instance that is telling the truth. Render's own free
instance type cannot attach a disk at all, so on that host the choice is a paid
instance type with a disk (a subdirectory of the source directory such as
`/opt/render/project/src/.openmind-data` is a valid mount path), a host with
volumes, or `OPENMIND_ALLOW_EPHEMERAL_STORE=1` and calling it a demo.

**`/api/ready` publishes that judgement as one field, and it is not only for
humans.** The response carries a `store` block — `kind` (the backend in force),
`configured` (what the environment ASKED for, so a typo sits beside its
refusal), `singleInstance` (true for exactly the backend that has the
constraint), `durability` (`"durable" | "ephemeral" | "unknown"`, derived from
the codes above by `lib/env.ts`, which stays the one owner of the judgement) and
`codes` (those codes verbatim, for a log). `/api/health` carries a four-field
version of the same block (`kind`, `durability`, `mode`, `writesPermitted`) so an
uptime monitor can see both answers from the endpoint it is allowed to poll.

`/api/ready` then separates CONFIGURATION from MEASUREMENT, which is the
distinction the two live incidents were about:

```jsonc
"store": {
  "kind": "file", "configured": "", "singleInstance": true,
  "durability": "unknown",
  "persistence": {                    // CONFIGURATION — what was declared
    "mode": "unproven",               // host-durable | declared-durable |
                                      // accepted-ephemeral | unproven |
                                      // undeclared | contradictory | unservable
    "declaredBy": null,               // the variable that made the claim
    "writesPermitted": false,         // may this deployment take a learner record?
    "blockedBy": "durability_unknown",
    "evidence": "restart drill — OPENMIND_BASE=<url> npm run verify:persistence -- --write, replace the instance, then --verify"
  },
  "measured": {                       // MEASUREMENT — what the store has SEEN
    "boots": 3, "firstSeenAt": 1792000000000,
    "survivedDeployments": 0,         // releases this store was still there for
    "deployment": "local-1.0.0"
  },
  "codes": ["durability_unknown"]
}
```

`measured` is `lib/server/boot-log.ts`: every process that answers readiness
writes its identity into the store, so a later process can say whether it found
BEFORE it — and `survivedDeployments` counts the process starts that found a
record written by a *different* deployment. It is deliberately weak and it is
never read instead of the declaration: a container restarted in place keeps its
writable layer, so `boots > 1` is not durability. What it does give is the one
honest statement about a declared store — "declared durable, and this store has
not yet been observed to survive a release" (`survivedDeployments: 0`) — which
is exactly what a monitor should alarm on. Two consequences that matter more
than the fields themselves:

- a **monitor can alarm on it** — `store.durability != "durable"` is a
  deployment that will lose its learners, stated as data rather than discovered
  as an incident. The same response is what an external uptime pinger should
  watch, because nothing in this repository can notice that a host is gone;
- the **deploy drill reads it** and fails BEFORE creating anything
  (`scripts/verify-persistence.mjs`), so a release cannot be certified against a
  store the host discards. An artefact too old to report its store fails there
  too — which is the correct answer for a build that predates the check. The same
  drill then proves its OWN worth: after a green restart it re-points the same
  assertions at a second, EMPTY store (the loss an ephemeral deploy produces) and
  requires them to FAIL — with a baseline asserted non-null before the loss, so
  "was null, now null" cannot pass as a survival.

**The host itself is the other half of the fix, and it is a platform setting,
not code.** For this deployment (a Render web service):

1. a **paid instance type** — Free instances sleep after ~15 minutes idle, and
the measured wake was **~4 minutes of no response at all** (4 attempts over
100 seconds failed outright; the first success took a further 6 s). A learner
who clicks a link in that window sees the edge's 503, which is what "the site
is down" looked like before any of this was measured;
2. a **persistent disk** mounted at `/data` (disks are not available on Free),
with `OPENMIND_DATA_DIR=/data` — the mount is what makes step 3 true;
3. `OPENMIND_SESSION_SECRET` (32+ random characters) **and a copy of it beside
the disk's backup**: the secret signs every session cookie, so losing it signs
every learner out on restore;
4. `OPENMIND_IMPACT_KEY` before the site is public — without it
`/api/impact` is open;
5. `HEALTH_CHECK_PATH=/api/health` in the service settings, not `/api/ready`
(see the note below): a host that restarts on a failed readiness check would
restart in a loop instead of letting anyone read the reason.

> **Before pointing a host's health check at `/api/ready`:** it answers 503 for
a misconfigured deployment by design, which is what a *load balancer's*
readiness probe is for. A host that **restarts** the service on a failed check
will restart it in a loop rather than let anyone read the reason. Point
liveness at `/api/health`, and readiness (if it is used at all) at
`/api/ready`.

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
| `OPENMIND_STORE` | storage backend; `file` (default) is the only one built. `postgres` is specified and **refused** until it exists |
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

**Step 9 is the only check here that can see the difference between a durable
deployment and one that loses every learner, and it is now ENFORCED rather than
listed.** `deploy-staging.yml` and `deploy-production.yml` run it on every
deploy: write a learner with real evidence and a class → replace the process (a
second deploy of the same artefact is a restart, so no extra credential is
needed) → require every fact to be byte-identical. It fails unless the restart
GENUINELY happened — the witness is `/api/health`'s own process start time,
which the server reports about itself — and its `--write` phase fails at the
first step if `/api/ready` reports a store the host does not keep. Its learner is
erased again on success; on failure the record is left behind on purpose, because
it is the evidence of the failure.

The lesson that put it there is in the section above: every other gate in this
repository passed while a host was losing records, because they all tested the
code and none of them tested the DEPLOYMENT.

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

**Rate limiting: PARTLY IMPLEMENTED, still a launch blocker at the proxy.**

Two things are true at once, and conflating them is how this becomes a false
claim of readiness:

* **The sign-in door is bounded in the app** (`lib/server/rate-limit.ts`), in
  two modes that are not interchangeable. A **source address** is refused hard
  after 40 failures in fifteen minutes (and sign-up after ten accounts an hour)
  — before the scrypt derivation, so an attacker cannot make the process do the
  work. An **account** is slowed instead: eight failures in fifteen minutes,
  then each further attempt waits 250 ms → 2 s and the password is STILL
  checked, so the learner whose password is right signs in behind the pause.
  That asymmetry is deliberate: a hard account ceiling would let anyone who
  knows an email address keep its owner out, which is the opposite of what a
  bound is for. A **process-wide** soft bound (120 derivations a minute) is the
  backstop a distributed attack cannot route around. `npm run verify:permissions`
  §7 drives the burst over HTTP and asserts the owner signs in afterwards;
  `npm run verify` drives both modes against an injected clock.
* **It is an in-process counter, so it is not the outer bound.** It bounds one
  server process, which is the shape the file store already has; a restart
  clears it. The address keys exist only when `OPENMIND_TRUSTED_PROXY=1`, because
  Next's route handlers expose no socket address — the only address available is
  a request header, and a header a client can set is not a limit. **The proxy is
  still required** for sign-up, the AI routes, answer submission, sync, uploads
  and teacher invitations, and for any deployment running more than one process.

`SECURITY.md` §9 states what remains, by door, rather than as one sentence.

**Security headers: PROPOSED.** No `Content-Security-Policy`,
`Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` or
`Permissions-Policy` is currently set by the app; they belong at the proxy.

## 11. Rollback

Production is a build artefact, not an edited filesystem. Rollback = deploy the
previous artefact and, after a check, the previous `/api/ready`.

```text
v17 serving → deploy v18 → problem found → redeploy v17 artefact
```

`OPENMIND_DEPLOYMENT_ID` is how you know which artefact a learner was on, and it
is no longer the ONLY way: when it is unset, `/api/health` and `/api/ready` fall
back to the host's own commit stamp (`RENDER_GIT_COMMIT`, `GITHUB_SHA`), so
"which release is this?" is answerable without a variable to set. That fallback
exists because it was measured missing — a live deployment reported
`deployment: "local-1.0.0"` while the host held its commit in its own
environment, which made the release question unanswerable from outside the host.
Where a
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
2. **Rate limiting is partial.** The sign-in and sign-up doors are bounded
   in-process (`lib/server/rate-limit.ts`); the AI, answer, sync and upload doors
   are not, and an in-process counter does not survive a restart or a second
   process. The proxy is still the outer bound. `SECURITY.md` §9.
3. **No security headers.** §10 above.
4. **No external error/uptime monitoring.** `/api/health` and `/api/ready` exist
   to be polled; nothing polls them and nothing aggregates errors. `OPERATIONS.md`.
5. **No backup *schedule*.** The tooling exists and is verified — `npm run backup`
   copies the store and hashes every file against its source, `npm run backup:verify`
   re-checks an archive later, and `npm run restore-drill` restores one into a fresh
   directory, boots the artefact against it and re-derives each learner from the
   restored ledger (`OPERATIONS.md` §4) — but **nothing calls them on a timer**:
   a cron job or systemd timer is a property of the host, not of this repository.
   The same section also lacks off-site replication and point-in-time recovery.
6. **SEO for public pages only** — no `robots.txt`, `sitemap.xml`, canonical URLs
   or Open Graph metadata yet. **PROPOSED.**
7. **Accessibility is gated, not audited** — `npm run verify:ui` drives a real
   browser, but there has been no formal WCAG 2.2 audit.
8. **PWA install polish** — a service worker and an offline page exist
   (`public/sw.js`, `/offline`); an install prompt / add-to-home-screen flow has
   not been designed.
