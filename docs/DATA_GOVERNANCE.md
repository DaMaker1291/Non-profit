# Data governance

How learning data is owned, versioned, reconstructed, retained and destroyed.
Every OpenMind-specific claim here rests on one architectural fact:

> The learner model is a **projection** of an append-only evidence ledger.

That is what makes disaster recovery a rebuild rather than a restoration, and it
is why the ledger must never be traded for a mutable "current state" table.

---

## 1. The system of record

| Layer | Role |
|---|---|
| `evidence/<learnerId>.jsonl` | the **system of record** — append-only, never edited |
| `profiles.json` | profile + the model's *materialised* view, rebuildable from the ledger |
| everything else | derived or administrative |

Two versions travel with the record:

- `EVIDENCE_SCHEMA_VERSION` — what an event **means**
- `PROJECTION_VERSION` — how evidence is **turned into** a learner model

Keeping them apart is the whole point: the same events, projected by a better
algorithm, produce a better model, and nobody's history is rewritten to get it.

## 2. Ownership

- A learner's ledger is theirs. It is read with their capability secret and
  rebuilt for them on request.
- Anonymous learners still own their record; claiming it with an account moves
  the history rather than copying or discarding it.
- A teacher sees only the derived, per-class view of members of classes they own
  — never raw events (`PRIVACY.md` §5).
- Operators own the deployment, not the learners.

## 3. Reconstructing a learner (the recovery property)

`replayModel(events, learnerId, base, profile)` folds the ledger back into a
`ProfileState`. On every `/api/evidence` read the server also runs
`reconcileDeep` and reports:

- `differences: []` — the materialised model **is** the projection of the ledger;
- `unprojectable: null` — the ledger is the whole history.

A non-null `unprojectable` is honest debt: answers that predate the ledger are
held in a pre-ledger snapshot and **cannot** be rebuilt from events. A deployment
should treat a growing `unprojectable` count as a migration backlog.

### Disaster recovery

```text
evidence events
      ↓
database / directory backup
      ↓
restore
      ↓
replayModel()  →  learner state reconstructed
      ↓
GET /api/evidence → deepReconcile.differences == []
```

This is the advantage the ledger buys. Do not lose it by treating the UI's
current view as the source of truth.

## 4. The two halves of the ledger, disclosed

| Provenance | Meaning | Standing |
|---|---|---|
| `server` | the server graded it; the answer key never left the server | observed fact |
| `device` | it arrived from an offline queue | real, **unverified**, disclosed |

The impact report reports the unverifiable share rather than quietly promoting
it. A device cannot launder unverified work into observed work.

### Known limitation (documented, not hidden)

On the **sync door**, `at` (the event's time) is taken from the incoming body and
validated only as a positive number; `deviceAt` holds the device's own claim.
This means a device's `at` is trusted for ordering and retention of *device*
events. The server-observed path mints `at` itself. This is a real limitation of
the current protocol; addressing it (server-stamped `at` plus an explicit
`device_id`/`sequence` in the wire format) is **PROPOSED** and is a schema-level
change that would require a migration and a `PROJECTION_VERSION` review.

## 5. Migration to a real database (**PROPOSED**)

Not implemented. When it happens, the mapping must preserve the invariants:

| Concept | Table | Invariant to preserve |
|---|---|---|
| events | `evidence_events` | append-only; unique on `event.id`; `learner_id` validated before it becomes a key |
| model | `learner_projections` | rebuildable; carries `projection_version` |
| accounts / profiles | `users`, `profiles` | one account owns one profile |
| classes / assignments | `classes`, `class_members`, `assignments` | membership by id, never by display name |
| content | `question_versions`, `curricula` | evidence stays interpretable against the version it was created under |

Rules for the migration:

1. every migration is reversible or has a documented recovery path;
2. the evidence schema version and projection version are recorded with the
   release (`audit/content-release.json`);
3. a restore drill (`OPERATIONS.md` §4) runs against the new store before cutover;
4. never edit an event row to "fix" a model — re-project instead.

## 6. Content versioning

`audit/content-release.json` publishes the served content: concept ids,
specification ids, the servable-question sample, the reasoner's constants, and the
evidence schema/projection versions, under one fingerprint.
`npm run verify:content-release` fails when the served content no longer matches
the published version, and names which section moved. Publishing a new version is
`--write`, and it is a *review* step — never run merely to make the gate pass.

## 7. Retention, deletion, export

- Retention schedule: `PRIVACY.md` §6.
- Deletion: implemented (`deleteProfile`, `deleteEvidence`,
  `removeMemberEverywhere`) — profile, ledger, personal papers and every class
  membership go together.
- Export: the learner can read their own evidence and data over the API;
  a one-click bundle is **PROPOSED**.
- Backups age out on their own schedule; a backup is not exempt from deletion
  forever, but it cannot be edited, so deletion is satisfied by expiry.

## 8. Auditing the record

- Every read of `/api/evidence` returns the reconciliation proof, so divergence
  is never a special request away.
- `npm run verify` exercises the ledger's pure rules; `npm run verify:sync`
  exercises the wire protocol; `npm run verify:content-release` pins the content
  version.
- **PROPOSED** — an operator audit log (who deleted what, when) distinct from the
  learner evidence ledger.
