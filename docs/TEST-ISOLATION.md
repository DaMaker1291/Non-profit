# Test isolation

A verification run must never write to the learner store. That was policy before
25 November 2026; it is a set of refusals now, because policy did not stop an E2E
run from attaching to a dev server that was still holding the live store.

## The supported command

```bash
npm run test:isolated                    # API e2e + UI walk + lesson walk
npm run test:isolated -- --only e2e
npm run test:isolated -- --only ui --only lesson
npm run test:isolated -- --keep          # keep the scratch store and server log
npm run test:isolated -- --fresh         # delete the .next-test cache first
```

The runner:

1. creates a unique scratch directory with `mkdtemp` and writes
   `openmind-test-scratch.json` into it;
2. allocates a free port from the OS — never 3000 or 4173;
3. starts `next dev` with `OPENMIND_DATA_DIR` pointing at the scratch store,
   `NEXT_DIST_DIR=.next-test`, and both test flags;
4. waits for a real `GET /api/ready` 200 (240 s bound), not a live PID;
5. creates a canary learner and requires it in the scratch `profiles.json` and in
   no live record, then erases it;
6. runs the suites, stops only the server it started, and compares a sha256
   fingerprint of `.openmind-data` taken before the run.

Any difference exits 3 and names the file. A failed canary exits 2 before the
first suite runs.

## What each suite refuses on its own

The suites do not trust the runner; they call `requireIsolation()` themselves
(`scripts/test-isolation.mjs`). A suite exits 2 — before any request — when:

| code | refusal |
|---|---|
| `no-scratch-store` | `OPENMIND_DATA_DIR` is unset |
| `relative-scratch-store` | the store path is relative |
| `scratch-store-missing` | the directory does not exist |
| `live-store` | the path is, contains, or is contained by `.openmind-data` |
| `scratch-inside-repo` | the store is inside the repository |
| `scratch-outside-tmp` | the store is outside the OS temp roots |
| `scratch-marker` | there is no valid `openmind-test-scratch.json` |
| `scratch-flag` | `OPENMIND_TEST_SCRATCH` is not `1` |
| `no-test-port` | `OPENMIND_TEST_PORT` is unset or unusable |
| `reserved-port` | the port is 3000 or 4173 |
| `base-not-dedicated` | the base URL does not use `OPENMIND_TEST_PORT` |
| `base-not-loopback` | the base URL is not loopback |
| `server-not-isolated` | health/ready fails, the service is not OpenMind, or the canary lands in the live store |

`node scripts/test-isolation.mjs --self-test` plants one case for every code plus
an acceptance and a fingerprint-drift case. It is the first step of
`npm run verify`, so the guard cannot rot silently.

## Cleanup is scratch-only

`scripts/cleanup-e2e-store.mjs` no longer edits the live store. It accepts only a
marked scratch directory, lists what is in it, and deletes it only with
`--confirm`. The old version swept real learner data by profile id, recency and
ownership; it is what deleted six profiles that predated the incident and 21
evidence ledgers. Changing the live store is an incident decision: preserve the
store, run `node scripts/reconcile-e2e-incident.mjs --backup-dir <backups>`,
and act on the record-level report.

## Test content approvals need two keys

`OPENMIND_TEST_CONTENT_APPROVALS=1` alone no longer unlocks the fixture approval
registry. `lib/pilot.ts` also requires `OPENMIND_TEST_SCRATCH=1`, which only the
runner sets. `PILOT_APPROVALS` remains empty; no test flag creates a review.

## Why a canary, and not a health flag

A server can report its own configuration and lie — or be a different build, or
be pointed at a path that was correct when it started. A canary learner is an
observation: it is created through the public API and then looked for in both
stores. If it is in the live store, the run stops before it writes anything else.
That is the check that would have prevented the 25 November incident, whatever
port the stale server answered on.
