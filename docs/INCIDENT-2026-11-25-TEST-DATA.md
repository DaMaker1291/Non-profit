# Incident: an E2E run wrote to the live learner store (2026-11-25)

**Status:** reconciled at record level. Nothing restored. No learner record was
modified. Seven records that predated the run were deleted by the cleanup.

## What happened

`npm run e2e` was executed against a dev server that had been started for
manual verification and was still holding the live store, `.openmind-data`.
`scripts/e2e-api.mjs` defaulted to `http://localhost:4173` and to the repository
store; the server answered, so the suite ran and wrote **23 files** into real
learner data. The run itself passed.

`scripts/cleanup-e2e-store.mjs` then swept the store by profile id, recency and
ownership. It reported "31 test profiles" removed. That description was wrong:
six of those profiles existed before the test run, and the ledger files it
deleted were never backed up.

Later runs used a scratch store, but that did not establish that the cleanup had
removed only test data. This document is that reconciliation.

## Preservation

Before any investigation:

| artefact | location |
|---|---|
| byte-exact copy of the current store | `/tmp/openmind-incident-20261125T220920/live-store-copy` |
| sha256 + size inventory of every store file | `…/live-store-inventory.txt` |
| the ten cleanup backups, copied out of `/tmp` | `…/backups/` |
| record-level reconciliation (text + JSON) | `pilot-readiness/incident-2026-11-25/` |

No file in the store was deleted, edited or restored during this investigation.

## The record-level finding

Reproduce with:

```bash
node scripts/reconcile-e2e-incident.mjs \
  --backup-dir /tmp/openmind-incident-20261125T220920/backups \
  --store .openmind-data \
  --incident 2026-11-25T21:15:00Z
```

It exits 0 with **0 failures**: every survivor is byte-identical to its
pre-cleanup copy, and no record now in the store is absent from the backup.

| record class | before | after | verdict |
|---|---|---|---|
| profiles | 32 | 1 | 1 survivor unchanged; 25 incident-window deleted; **6 pre-existing deleted** |
| accounts | 5 | 1 | 1 kept unchanged; 3 incident-window deleted; **1 pre-existing deleted** |
| papers (generated) | 37 | 36 | 1 removed, created 21:15:42 (incident) |
| classes | 5 | 0 | all 5 created 21:15:40–41 (incident) |
| rooms | 2 | 0 | both created 21:15:39 (incident) |
| personal papers | 1 | 1 | unchanged, owner is the survivor |
| interventions | 0 records | 0 records | unchanged |
| evidence ledgers | 21 files | 0 | **deleted with no backup** |

### The survivor

`stu_mub5fkj8lg2plm7a0a` (handle `ui_check`, created 2026-09-21) is the pinned
profile the cleanup always preserved. Its JSON in the backup and in the current
store is identical, sha256 for sha256, including its progress, masteries,
personal paper and capability secret. It is the only profile with an account.

### The six pre-existing profiles the cleanup deleted

None was created by the incident run. Each is a near-empty record — fixture-shaped
handles, no masteries, at most one practice entry, no personal papers:

| id | handle | created | work held |
|---|---|---|---|
| `prof_ea7b5f6d17b44179b6996e7365b724e6` | `MGHFV,G` | 2026-11-07 12:33 | 1 practice, 1 diagnostic |
| `prof_f4ab2fc9231b4d95a200db9e46bf1963` | `myrsmrxhf` | 2026-11-07 22:07 | 1 practice |
| `prof_eba5cc12131c4f809a58c6e2946350b4` | `sync_learner` | 2026-11-13 00:14 | — |
| `prof_576b08ec64da443e993aba800685cd65` | `sync_learner` | 2026-11-13 14:47 | — |
| `prof_682ce0c874b6495fa0ad5289ff1531aa` | `sync_learner` | 2026-11-13 14:58 | — |
| `prof_e4983efec56e4f82a5e85a74b8779764` | `ddddddd` | 2026-11-19 16:55 | — |

`prof_e4983…` also had an account (`acc_eda416b859f3497f96b44f4f8978c8d6`,
created 2026-11-19, with a recovery credential), which was deleted with it.

Their handles and empty work are consistent with earlier verification residue —
`sync_learner` is the fixture handle used by the offline-sync checks. **That is
not proof that no human owned them.** The store cannot answer the question, and
the cleanup deleted them anyway, which is exactly what the rule "if a record's
legitimacy is uncertain, preserve it" forbids.

### What cannot be reconciled

The cleanup deleted every file in `.openmind-data/evidence/` with `rmSync` and
made no copy. Their count (21) is in its log; their contents are gone. No
surviving profile in this store had a ledger (`stu_mub5fkj8lg2plm7a0a` is a
pre-ledger learner, recorded in `AGENTS.md`), so the ledgers belonged to records
the cleanup deleted — the same set whose ownership is now uncertain. The loss is
therefore **not** attributable to confirmed fixtures: it cannot be shown to have
touched a real learner, and it cannot be shown not to. It is a real, irreversible
gap and is reported as one. It has been fixed structurally: cleanup now deletes
only a marked scratch directory.

## Verdict

1. **No surviving record was modified or lost.** The one profile and one account
   that remain are byte-identical to the pre-cleanup backup; personal papers and
   interventions are unchanged.
2. **The cleanup was not confined to test-created records.** Six profiles and one
   account that predate the incident were deleted. They are recoverable
   byte-for-byte from the preserved backup; none has been restored, because the
   decision to put fixture-shaped records back into a live store belongs to the
   owner.
3. **The ledgers are unrecoverable**, and the report does not pretend otherwise.
4. **The live store is not "safe by assumption"**: it is safe by the measurement
   above, and its state is preserved before and after the investigation.

## Structural fixes (this change)

- `scripts/test-isolation.mjs` — suites refuse an undeclared, in-repo, reserved-port
  or unmarked target, prove the store with a canary learner, and fingerprint the
  live store before and after (exit 2 / exit 3).
- `scripts/run-isolated-tests.mjs` — the supported runner: unique scratch store,
  OS-allocated port, separate build cache, real readiness, own-server shutdown.
- `scripts/cleanup-e2e-store.mjs` — rewritten: discards only a marked scratch
  store, refuses everything else, and no longer edits learner data at all.
- `lib/pilot.ts` — fixture content approvals now need `OPENMIND_TEST_SCRATCH=1`
  as well as `OPENMIND_TEST_CONTENT_APPROVALS=1`, in a non-production process.
- `scripts/reconcile-e2e-incident.mjs` — the reconciliation is repeatable by a
  second person, from the preserved backup, without touching the store.
