# Restoration assessment — the seven pre-existing records

**Status: preservation only. Nothing has been restored or deleted.**
This is a technical assessment for a decision that has not been made. Tokens
match the redacted package; the token-to-record mapping is only in
`~/openmind-backups/incident-package-2026-11-25/records/record-index.json`.

The seven are **six profiles (`P02`–`P07`) and one account (`A02`)**. All predate
`2026-11-25T21:15:00Z` and are absent from the preserved post-cleanup store.
Ownership is unproven: the shapes look synthetic, but no stored field records who
created them, and `P02` holds real activity.

## 1. What each record contains

| Token | State held | Activity | Account |
|---|---|---|---|
| `P02` | full profile state: onboarding fields, a bearer `secret`, session fields, practice/diagnostic/mastery maps | 1 practice entry, 1 diagnostic entry, 0 masteries | none |
| `P03` | full profile state, same shape | 1 practice entry | none |
| `P04` | full profile state, same shape | none | none |
| `P05` | full profile state, same shape | none | none |
| `P06` | full profile state, same shape | none | none |
| `P07` | full profile state, same shape | none | `A02` |
| `A02` | account: salted password hash, recovery verifier, profile link, unverified address, last-seen time | — | owns `P07` |

No secret, password hash, recovery value or address is reproduced here. The
profile `secret` is a **bearer credential** for the progress API; `learnSession`
is a session field. Restoring either revives access that has been dormant since
25 November.

## 2. Relationships and cross-references

Checked against every JSON file in the preserved store:

- **No paper, personal paper, class, room or erasure tombstone references any of
  the seven.** They are isolated records.
- The only relationship among them is `P07` ↔ `A02`.
- The survivor (`P01`/`A01`) is unrelated.
- **No erasure tombstone exists for any of the seven**, so a restore would not
  contradict a recorded erasure. That is a necessary check, not proof of consent.

## 3. What is missing

- **The evidence ledger for every one of them.** The old cleanup deleted 21
  ledger files without a backup. `/api/impact` walks ledgers, not profiles, so a
  restored learner would be invisible to impact reporting and would have no
  evidence trail.
- No papers, classes or rooms belonged to them, so nothing else needs relinking.
- `A02`'s address is unverified and its domain is placeholder-looking. Ownership
  of that address cannot be established from the store.

## 4. Could restoration create inconsistent mastery?

`P02` is the only one with mastery-adjacent state, and it has **0 masteries** — so
no restored record would claim a mastery that the ledger cannot support. But
`P02`'s diagnostic and practice entries would appear in the record with no
evidence behind them, and `P03`'s practice entry likewise. The honest description
is **history incomplete**, not **mastery inconsistent**.

If a future record with masteries were restored, the risk would be real: mastery
displayed from `profiles.json` with no ledger entry is a claim without evidence.
That is why the assessment treats "restore the state" and "restore the history"
as different operations. **The history cannot be restored.**

## 5. What would need to be marked as incomplete

A restored record should carry, somewhere visible to the owner and any reviewer:

- that 21 ledgers were lost on 2026-11-25 and this record's history is incomplete;
- that diagnostic/practice counts are **record state**, not verified evidence;
- the restoration date and the decision reference.

Three ways to do that, in increasing invasiveness:

1. **A sidecar incident register** (recommended for one or seven records): no
   schema change, no learner-facing claim, no fabricated evidence. The record
   stays byte-identical to the backup.
2. **A stored field** such as `restoredAt` / `evidenceGap` on the profile. This
   needs a schema and type change, and a surface that reads it; otherwise it is a
   field nobody sees.
3. **A ledger entry describing the gap.** This is the one thing that must **not**
   be done by inventing learning events. A ledger may record an administrative
   note only if the ledger format supports it; it must never be padded with
   fabricated evidence.

## 6. How each could be restored individually

These are **procedures, not actions taken**. Each requires an explicit decision,
a fresh backup, and a scratch-store rehearsal before the live store is touched.

Common preconditions: server stopped; a fresh byte copy plus checksum inventory;
JSON validated after the edit; one record at a time; a recorded rollback.

| Token | Procedure | Specific risk |
|---|---|---|
| `P02` | insert its state object into `profiles.json` under its original id; regenerate `secret` or preserve it deliberately | old secret is a bearer credential; regenerating breaks any existing link, preserving revives it. No account, so delivery of a new link is manual. |
| `P03` | same as `P02` | same secret trade-off; one practice entry with no ledger |
| `P04`–`P06` | same as `P02` | empty records; restoring creates three fixture-shaped profiles with no history |
| `P07` | restore the profile **only with** `A02`, or not at all | restoring the profile alone orphans it; restoring the account requires proving control of an unverified placeholder address |
| `A02` | insert the account with its `profileId` pointing at `P07`; preserve the password hash and recovery verifier, or force a reset | account takeover if the address is not proven; duplicate-email and duplicate-id checks needed; recovery must not be left pointing at an unverified address |

**Recommended order if any restoration is approved:** start with `P02` alone in a
scratch copy, verify the record renders, the progress door works with a
regenerated secret, and no impact/evidence claim appears; then decide the others.
Do not restore `A02` until address ownership is established.

## 7. What would make restoration unsafe

- Any evidence that a record belonged to a real learner who did not consent
  (none found, but absence of evidence is not consent).
- An erasure tombstone (none found).
- An unverified account address presented as the learner's (this is `A02`).
- Reusing a dormant bearer `secret` without deciding who may hold it.
- Restoring a mastery claim without its ledger (none of the seven has masteries,
  but the rule stands).

## 8. Decision required

The owner chooses: leave all seven deleted; restore all seven; or restore named
tokens. The independent reviewer's sign-off is the input, not the decision. **No
restoration will be performed without an explicit instruction**, and none has
been performed.
