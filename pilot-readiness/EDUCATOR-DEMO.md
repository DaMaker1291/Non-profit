# Educator demo — isolated scratch access

**Status: access only. 0 of 9 lessons reviewed. No reviewer has been contacted.**
This page tells a reviewer (or the owner preparing a session) how to open the nine
interactive lessons without touching the live learner store. It does not approve
anything, and it does not record a review.

## One command

From the repository root, with dependencies already installed:

```bash
npm run educator:demo
```

The runner:

1. creates a marked scratch store in the operating system's temp directory —
   never `.openmind-data`, never a project directory;
2. starts the app on a free `127.0.0.1` port with its own build directory;
3. proves the server writes the scratch store with a canary learner, then erases
   the canary; the live store is only hashed, never read as a record source;
4. creates one scratch learner with a complete UK GCSE mathematics course, so the
   lesson pages are reachable without the reviewer completing onboarding;
5. prints the sign-in details, the nine lesson URLs and the nine public
   review-contract URLs;
6. stops only the server it started, and refuses to finish if the live store
   changed at all.

The normal run waits until `Ctrl-C`. On exit the scratch store is discarded and
the live-store fingerprint is compared again.

## What the reviewer does

1. Open the printed sign-in URL (`/onboarding?mode=signin`).
2. Use the printed scratch email and password.
3. Open the lesson URL for the concept being reviewed.
4. Read the objective, commit the prediction **before** touching the model, then
   use the model. The prediction gate is deliberate: the model controls stay
   locked until a choice is made or a description is committed.
5. Try one wrong answer and read the feedback. The scratch account has its own
   evidence ledger, so this is safe.
6. Return to the signed pack and `EDUCATOR-FEEDBACK-FORM.md`.

If a lesson link is opened before signing in, the route guard sends the reviewer
to sign-in with a return ticket; signing in then lands on the lesson. Signing in
first is simpler.

## The nine routes

The subject is part of the route. `/lesson/<concept>` does not exist.

| Concept | Subject | Lesson route | Pack |
|---|---|---|---|
| `place-value` | maths | `/learn/maths/place-value` | `educator-packs/place-value.md` |
| `negatives` | maths | `/learn/maths/negatives` | `educator-packs/negatives.md` |
| `fractions` | maths | `/learn/maths/fractions` | `educator-packs/fractions.md` |
| `fraction-ops` | maths | `/learn/maths/fraction-ops` | `educator-packs/fraction-ops.md` |
| `decimals` | maths | `/learn/maths/decimals` | `educator-packs/decimals.md` |
| `electricity-circuits` | physics | `/learn/physics/electricity-circuits` | `educator-packs/electricity-circuits.md` |
| `atoms-elements` | chemistry | `/learn/chemistry/atoms-elements` | `educator-packs/atoms-elements.md` |
| `cells` | biology | `/learn/biology/cells` | `educator-packs/cells.md` |
| `algorithms-search` | computing | `/learn/computing/algorithms-search` | `educator-packs/algorithms-search.md` |

The runner reads this table from the generated pack index, so it cannot silently
drift from the packs a reviewer is sent.

## What is isolated, exactly

- **Store:** a fresh `mkdtemp` directory outside the repository, marked
  `openmind-test-scratch.json`.
- **Build:** `.next-demo`, which is git-ignored and separate from `.next-dev`,
  `.next`, `.next-test` and every servable artefact.
- **Port:** a free loopback port, never 3000 or 4173, the documented application
  ports.
- **Backend:** the file store is forced explicitly. A developer's `.env` asking
  for Postgres cannot turn the demo into a database setup.
- **Live store:** fingerprinted (hashed) before the run and compared on exit. Any
  change is a data-integrity failure (exit 3), not a demo warning. No learner
  record from it is loaded into the app.
- **Canary:** a learner created through the API must appear in the scratch store
  before any lesson is opened. The live store is never read as a record source;
  its hash before and after the run is what detects a stray write.

The reviewer may practise, answer questions and make misconceptions. All of that
evidence lives in the scratch store and is discarded. No real learner record is
read or written.

## Verifying the runner itself

```bash
npm run educator:demo -- --check
```

`--check` starts the same isolated instance, provisions the same scratch learner,
then opens every lesson in headless Chrome, installs the scratch session cookie,
and waits for the exact model shell each pack names
(`data-model-shell="…"`). It also requires the prediction gate to be `locked` and
the page to carry the pilot status banner. It exits 0 only if all nine render,
the review ledger still has zero records, and the live store is byte-identical.

This check needs Chrome. Set `CHROME_BIN` if it is not in the default location.
A missing browser is reported as a failed check, not a pass.

To inspect the scratch store and server log after a run:

```bash
npm run educator:demo -- --check --keep
```

The printed paths are disposable. Delete them when finished.

## The in-app review contract — read it, do not fake it

The public page `/lesson-review/<concept>` prints the review criteria, the
current version and content hash, and whether a human review is on record. It is
useful for the reviewer to read the contract.

The form on that page records a review only for a **signed-in teacher account**,
and the reviewer's identity is taken from that account. The demo account is a
learner account on purpose: a placeholder account must never produce something
that looks like a teacher approval. The canonical record for this programme is the
signed pack plus `EDUCATOR-FEEDBACK-FORM.md`, transcribed into
`EDUCATOR-RESPONSES.json` only after a real person returns it.

## What this demo does not establish

- It does not establish that any lesson teaches well, is well pitched, or is
  suitable for a particular class.
- It does not replace a subject review, a learner trial or an accessibility pass.
- The automated check is Chromium only. No screen reader has been driven; the
  known keyboard and screen-reader limits are in `ACCESSIBILITY-VALIDATION.md`
  and in each pack.
- The circuit model's corrected two-cell reading is **re-derived**, not
  re-observed in a browser. The pack says so.
- The science lessons' research is transcript- and quiz-depth. The videos were
  not watched; slides and worksheets were not obtained.
- No learner data is used, so nothing here measures learning.

## If the demo fails

The runner prints the server log path. Re-run with `--keep`, then read the log.
The most common causes are a missing `node_modules` (`npm ci`), a missing Chrome
for `--check` (set `CHROME_BIN`), or a port already in use (the runner chooses a
free one unless `--port` is given).

Do not point the demo at `.openmind-data`, do not copy the sensitive incident
archive into it, and do not send the sensitive archive to a reviewer. The redacted
package is a separate artefact for the incident review.
