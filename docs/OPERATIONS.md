# Operations

How to run OpenMind day to day, and what to do when something breaks.

Every runbook below names the **executable** step first, because an operator
under pressure follows commands, not paragraphs. Anything marked **PROPOSED**
does not exist yet and says so.

---

## 1. The two health questions

```bash
curl -s https://openmind.example.org/api/health   # liveness  → {"status":"ok",...}
curl -s https://openmind.example.org/api/ready    # readiness → {"ready":true,...}
```

- `/api/health` — **is the process alive?** Cheap, no disk, no network. If this
  fails, the process is gone or unreachable: check the container, then the proxy.
- `/api/ready` — **can this instance serve a learner?** It checks three things:
  `data` (the store is writable — write, read-back, unlink), `config`
  (`lib/env.ts` reports no problems), and `content` (the concept and
  specification graphs loaded non-empty). **HTTP 503 means do not send traffic
  here.**

`/api/ready` reports failing checks as `name:code` (for example
`data:not_writable`) and names configuration problems by variable, never by
value. The sentence explaining each is in the server log.

## 2. The gates you can re-run any time

```bash
npm run verify              # engines + content graph
npm run verify:q            # every generated question is answerable
npm run verify:content-release   # served content matches the published version
npm run verify:permissions  # the authorization matrix (needs a server)
npm run verify:sync         # the offline sync protocol (needs a server)
npm run smoke               # external-style uptime smoke (needs a server)
npm run production-check    # ALL of the above, end to end, on a scratch store
npm run backup              # take a verified backup of the store (§4)
npm run backup:verify       # re-check a backup's recorded hashes (§4)
npm run restore-drill       # restore a backup and prove a learner survives it (§4)
```

`npm run production-check` is the one command that answers "is this deployment
shippable?". It builds, serves on a scratch port with a temporary data
directory, runs every gate above, starts a development server for the e2e suite,
and prints `PRODUCTION CHECK: PASS`. It never touches a real store.

## 3. Dashboards

**PROPOSED.** There is no operator dashboard and no metrics backend in this
repository. Until there is, the operational picture is assembled from:

- `/api/health` and `/api/ready` (poll these externally),
- `/api/impact` (aggregate, learner-facing outcomes — **not** operations numbers),
- the server log.

When dashboards are built, keep two families apart, exactly as the brief asks:

```text
SYSTEM (operations)                     LEARNING (product)
  uptime · error rate · p95 latency       diagnostic completion
  AI availability · sync success          task completion
  storage healthy                         recommendation failures
```

Learner analytics must not be crammed into the operations dashboard, and learner
identities must not appear in it.

## 4. Backups — and a restore you have actually performed

**Current state:** the whole deployment is one directory. `OPENMIND_DATA_DIR`
(containing `profiles.json`, `accounts.json`, `classes.json`, `papers.json`,
`rooms.json`, `packs.json`, `session-secret`, and `evidence/*.jsonl`) is the
state.

> A backup you have never restored is only a hope.

### Backup

```bash
npm run backup                      # → ~/openmind-backups/openmind-data-<UTC stamp>
npm run backup -- --data /var/openmind --dest /mnt/backups --keep 14
npm run backup -- --max-age-days 90 # destroy archives older than the window (§6)
npm run backup:verify               # re-check the latest archive's hashes
npm run backup:verify -- ~/openmind-backups/openmind-data-20261011T113000Z
```

`scripts/backup-store.mjs` copies the directory, hashes every file, compares each
copy against its **source** hash, and writes two records: `manifest.json` (the
hashes, which is what `--verify` re-checks months later) and `BACKUP-MANIFEST.txt`
(what an operator needs — the counts, the git HEAD, and whether `session-secret`
is present, **never its value**). It refuses to write inside the repository, or
inside the store it is copying.

Keep daily copies off-site (another machine, object storage, an encrypted USB).
The `session-secret` belongs **in** the backup: restoring without it signs every
learner out. `--keep N` prunes only archives this tool made, oldest first, so a
hand-made `tar` sitting beside them is never touched.

Two things it will not pretend about. It does not stop writes — each JSON file is
written by temp-file rename, so no single file is ever half-written, while a copy
across many files can still catch different moments; **any file that changed
mid-copy is reported**, so a blurred archive is visible rather than discovered
during a restore. And it does not schedule itself: a cron job or systemd timer has
to call `npm run backup` (§7).

### The restore drill — one command, six steps

```bash
npm run restore-drill                 # back up the live store, then drill that archive
npm run restore-drill -- --backup ~/openmind-backups/openmind-data-20261011T113000Z
npm run restore-drill -- --data /var/openmind --learners 5
OPENMIND_SKIP_BUILD=1 npm run restore-drill -- --backup …   # drill an existing artefact
```

`scripts/restore-drill.mjs` runs the procedure below, in order:

```text
1.  take a backup of staging (or accept one with --backup)
2.  verify its recorded hashes — restoring a corrupt archive proves nothing
3.  restore into a FRESH temporary directory, compared byte for byte
3b. re-apply every ERASURE recorded since that archive was taken
4.  boot the artefact pointed at the restored store
5.  GET /api/ready → 200 (storage, config and content all green)
6.  per learner with a ledger: GET /api/evidence?id=…&secret=…
    → deepReconcile.differences == []  and  unprojectable == null
```

**Step 3b is the one a file-copy test cannot do.** An archive taken *before* a
learner erased their record still contains them, and a restore would put them
back — so the erase writes an intent (`erasures.json`, `lib/server/erasures.ts`)
and the drill re-applies that log to the restored copy before the artefact boots.
The log comes from `--erasure-source` (the live store by default), which is why
that one small file is worth carrying beside the archives: a recovery on hardware
with no live store has nothing else to read it from. With nothing recorded, the
drill says the step is UNTESTED rather than passing it.

Step 6 is the OpenMind-specific proof. It says the restored ledger is sufficient
to reconstruct that learner's model. If `differences` is non-empty the model is not
a projection of its own evidence; if `unprojectable` is non-null, some of that
learner's history predates the ledger and cannot be rebuilt from events — see
`DATA_GOVERNANCE.md`. Everything it creates is deleted on every exit path,
including a failure, and it restores the working tree's generated files, so
drilling a release cannot be the thing that dirties the tree.

Three limits, stated rather than discovered at 2am:

- it drills **the artefact in this checkout** — a restore onto different hardware
  still has to be rehearsed there once;
- if the archive holds **no ledger**, step 6 reports `UNTESTED`. Storage, the
  restore and readiness were proven; the projection was not, and the drill says
  which;
- it is a **test of an archive**, not a substitute for off-site copies.

### Migrations are part of a restore, not separate from it

Once the store is a database, the backup is not a directory any more and this
drill changes shape. The order is the one in `DEPLOYMENT.md` §4, and the middle
step is the new one:

```text
backup → migration → application rollout → health check

  npm run db:status     # drift + pending — read-only, safe any time
  npm run db:migrate    # AFTER the backup, BEFORE the rollout
  npm run db:verify     # append-only, idempotency and erasure, executed
```

Two properties are worth relying on during an incident, and both are enforced by
the runner rather than documented as good behaviour: it will not apply anything
on top of DRIFTED history (an applied migration that was edited afterwards names
the file and stops), and it will not revert in production without `--force`, so
a panicked `db:down` cannot be the thing that destroys a class's work.

The rehearsal that proves the reverse path works is `npm run db:rehearse` — up,
verify, all the way down, up again. It refuses to run against a database that
holds learner data (it counts rows, it does not guess from the database name), so
it belongs on staging and in CI, never on production.

### **PROPOSED**

What is still missing is *the schedule*, not the tooling: `npm run backup` and
`npm run restore-drill` both work and are verified, but nothing in this repository
calls them on a timer — a cron job or a systemd timer has to, and that is a
property of the deployment (§7). Also PROPOSED: off-site replication,
point-in-time recovery, and — once the store is a database — the equivalent of the
drill above for tables rather than for a directory (`DATA_GOVERNANCE.md` §5).

## 5. Runbooks

### 5.1 Site down

```text
1. curl /api/health          → process alive?
      no  → the process or host is down: restart the container/service
2. curl /api/ready
      503 with data:not_writable  → the volume is full or read-only; do NOT clear it
      503 with config:*           → check the named variable (lib/env.ts)
      503 with content:empty_graph→ the build's content failed to load; redeploy
3. still down → check the reverse proxy, then the CDN
4. bad deploy suspected → redeploy the previous artefact (see DEPLOYMENT.md §11)
```

### 5.2 A learner's data looks wrong or missing

```text
1. DO NOT edit JSON by hand. Preserve the data directory first.
2. For that learner: GET /api/evidence?id=…&secret=…
   • deepReconcile.differences lists exactly which fields the model disagrees with
     the ledger on — that is the whole diagnosis.
   • unprojectable counts answers that predate the ledger (not reconstructible).
3. differences == []  → the model is the ledger; the symptom is a display bug.
   differences != []  → the model diverged; the ledger is authoritative, so the
                        fix is a re-projection, never a hand edit.
4. suspect an offline sync? cross-check the event count and the `duplicates`
   reported by the last POST /api/evidence.
```

### 5.3 AI outage

```text
1. Notice: /api/ai reports the provider and whether a model is configured.
2. The product ALREADY handles this. Four failures — no key, provider error,
   timeout, unparseable body — all fall back to the deterministic offline tutor,
   and every disclosure line says which of the two answered.
3. To force the fallback deliberately: unset the provider keys / endpoint and
   redeploy. No code change, no feature loss.
4. Never leave a learner on "AI Tutor is thinking…" — the timeout
   (OPENMIND_AI_TIMEOUT_MS) bounds it and the fallback is immediate after.
```

### 5.4 Bad content release

```text
1. `npm run verify:content-release` names which section moved
   (curriculum / question bank / evidence schema).
2. For curriculum or question-bank drift: restore the published record —
   `git revert` the commit that changed audit/content-release.json, or republish
   only after review with `node scripts/verify-content-release.mjs --write`.
3. For an EVIDENCE SCHEMA change: this is not a content rollback. Read
   DATA_GOVERNANCE.md before touching anything.
4. Existing evidence remains interpretable against the version it was created
   under — that is why versions are pinned, not inferred.
```

### 5.5 Security incident

See `INCIDENT_RESPONSE.md`. Short form:

```text
contain → rotate credentials → assess impact → document → notify where required
```

Rotating `OPENMIND_SESSION_SECRET` invalidates every session (all learners must
sign in again). Rotating an AI or impact key is a config change and a redeploy.

## 6. Logging and monitoring

**Current state:** the app has no structured logger. `/api/ready` and
`/api/health` are the machine-readable signals, and the standalone server writes
to its stdout/its log file.

**PROPOSED** — structured request logs (request id, timestamp, route, status,
latency, error code, service, deployment id), an error tracker catching browser
and server exceptions, and uptime monitoring of `/`, `/onboarding`,
`/api/health`, `/api/ready`. Personal data in logs must be minimised the same way
it is in the store.

**Watch the right one for the right question.** `/api/health` is LIVENESS — the
process is up — and is the only one a host's own health check should call.
`/api/ready` is READINESS, and it is deliberately **503** when the store is one
the host discards (a `data_dir_not_durable` problem): such a deployment serves
every request perfectly and must not be sent learners, so an uptime monitor
alarms on its status while the host's restart policy must not.
`store.durability` on the same response is the one word to graph:
`"durable"` is the only green, `"ephemeral"` (with `accepted:true`) is a demo
somebody declared, and `"unknown"` is a store nobody has proved — treat all
three of the non-green values as "no real learners here" rather than as
variations of fine.

### The disk-headroom alarm

The store, the compiled mirror and every build write to the same volume, and a
full disk does not fail the thing that filled it — it fails whatever happens to be
writing, **wearing a costume**. Measured on this checkout: at 4.1 GB free the dev
server's webpack cache write failed with `ENOSPC`, the compile never answered, and
the end-to-end suite died five minutes later on `HeadersTimeoutError` with **0
assertions reported** — which reads like a hung route, not a full disk. The same
source then ran green at 5.1 GB with that cache deleted.

```bash
npm run disk-headroom              # the alarm: exits 3 when the volume is too full
npm run disk-headroom -- --json    # the same measurement, machine-readable
npm run disk-headroom -- --strict  # also fail in the warning band
npm run disk-headroom -- --self-test  # is the bar still above the failure it was measured from?
```

Schedule the alarm rather than waiting for it (daily, beside the backup):

```cron
17 4 * * *  cd /srv/openmind && npm run disk-headroom >> /var/log/openmind-headroom.log 2>&1
```

`scripts/disk-headroom.mjs` is the ONE owner of the rule — the two bars, the
classification and the sentence — and `npm run production-check` and
`npm run e2e` both read it, so a release checklist and a test suite cannot
disagree about what "too full" means. The bars are **bracketed by measurement**,
not chosen: they sit above every observed failure (4.1 GB) and at or below every
observed success (5.1 GB). `OPENMIND_MIN_FREE_MB` moves the lower bar for a
deliberately small volume, and a value that is set but not a number falls back to
the default rather than disabling the check. A request that reports `state: "unknown"`
means `statfs` was unavailable: nothing was measured, which is **not** the same
as headroom.

## 7. Routine checks

| Cadence | Check |
|---|---|
| every deploy | `npm run production-check` (or the CI job) — its disk-headroom step fails a release below 5 GB free; and the **restart-survival drill** (`verify:persistence -- --write` → replace the process → `--verify`), which both deploy workflows now run — it fails a release whose store the host does not keep |
| daily | `/api/health` and `/api/ready` answered; **`store.durability` is `"durable"` on `/api/ready`** — `"ephemeral"` means the host is discarding the learners, and it is the one condition that must page someone rather than wait for a weekly review; `npm run backup` completed and its copy kept off-site; `npm run disk-headroom` (alarm) |
| weekly | `npm run restore-drill` against the latest archive (step 3b included); review `/api/impact` limitations |
| per retention window | `npm run backup -- --max-age-days 90` so copies expire (`PRIVACY.md` §6) |
| monthly | dependencies reviewed; `audit/content-release.json` reviewed; access to secrets reviewed |
