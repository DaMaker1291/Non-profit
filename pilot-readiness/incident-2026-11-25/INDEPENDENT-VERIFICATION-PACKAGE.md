# Independent verification package — 2026-11-25 incident

**Status: sealed and awaiting a second person. No record has been restored or
deleted, and no live learner data was read or written to build it.**

The package is a directory, deliberately outside the repository because it
contains live credentials:

```
~/openmind-backups/incident-package-2026-11-25/
```

| | |
|---|---|
| Files | 38 |
| `MANIFEST.sha256` sha256 | `49c3e6701c71e68bb2783cffcf032d0f9729c04691ada34db14e96730f58c716` |
| Preserved store copy | taken 2026-11-25 22:09, before any investigation |
| Cleanup backups | 10 files, unmodified |
| Record index | 6 profiles + 1 account, redacted |
| Live store | **not read** |

## Contents

- `store-after-cleanup/` — byte copy of the store as preserved.
- `cleanup-backups/` — the ten files the old cleanup wrote.
- `reconciliation/` — the report, its JSON, the script, and the preserved-store
  inventory.
- `records/SEVEN-RECORDS.md` — the six profiles and one account that predate the
  incident, with dates, work held and the ownership uncertainty stated.
- `records/record-index.json` — the same seven, machine-readable, no secrets.
- `review/INDEPENDENT-REVIEW.md` — the checklist and sign-off form.
- `verify-package.mjs` — read-only verifier for every claim.
- `README.md` — handling warning and verification steps.

## Verification performed at sealing

- `shasum -a 256 -c MANIFEST.sha256` — **38/38 OK**.
- `node verify-package.mjs` — **PACKAGE VERIFIED**, exit 0: 32→1 profiles, 5→1
  accounts, survivor byte-identical, six pre-existing profiles and one
  pre-existing account deleted, record-index ids agree, no ledger reconstructed.
- The existing 135-file worktree checkpoint re-verified at the same time
  (`node scripts/checkpoint-worktree.mjs --verify …`): 135/135, sha256
  `dcc78afab04e557275e09cba7b48581dc036adf568f9ff5e47c008c030984d86`.

## Handling

The store copy and backups contain profile secrets, password hashes and account
records. The package must not be committed, uploaded or pasted into a chat. The
record explanation and the index carry no secret field, and the verifier asserts
that.

## What the second person decides

The reviewer answers the six questions in `review/INDEPENDENT-REVIEW.md`,
including whether any of the seven is more likely a real learner than a fixture
and which disposition they recommend. The store owner then chooses: leave all
seven deleted, restore all seven, or restore named ids. **This document does not
recommend one**, and no restore command is provided because a restore is a write
to the live store and is outside this phase.

The 21 evidence ledgers remain unrecoverable. No option restores them.

## Redacted package for the second person

The sensitive package above must not be sent to a reviewer. A credential-free
package is sealed separately:

```
~/openmind-backups/incident-redacted-2026-11-25/
```

| | |
|---|---|
| Files | 7, all checksummed |
| `MANIFEST.sha256` sha256 | `9e08210f1b10f1161f52af3c0f71674b118a715d09c46b70ac4104b97ae99779` |
| Contents | tokenised record index, redacted reconciliation, reviewer checklist, verifier, derivation and owner-comparison tools, seal |
| Excludes | password hashes, recovery secrets, session credentials, emails, raw handles, raw ids and record contents |
| Verified | `REDACTED RECONCILIATION VERIFIED`; 32/32 profiles and 5/5 accounts matched the sealed archive |

The reviewer needs no credentials and no access to the live store. The package
states what it cannot prove: it verifies the classification and arithmetic, not
the raw contents; the per-record hashes and the owner comparison in `SEAL.md`
cover that link.
