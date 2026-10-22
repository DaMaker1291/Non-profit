# Data Protection Impact Assessment — draft for a school deployment

**Status: DRAFT. Not signed off. No regulator has reviewed it.** This is a working
document for a deployment to complete, amend and sign. Every technical statement
names the file that makes it true, so a reviewer can check it against the code.
Every legal conclusion is [counsel to confirm] until a qualified adviser in the
operating country has agreed it.

| Field | Value |
|---|---|
| Controller | the school, school group or ministry commissioning the deployment — **to be agreed in the deployment contract [counsel to confirm]** |
| Processor | the OpenMind operating entity — **to be appointed**. No legal entity exists at the time of drafting (see `docs/ministry/SAFEGUARDING.md` §1) |
| Data Protection Officer | **to be appointed** |
| System | OpenMind, as built in this repository |
| Version of this assessment | draft 1, derived from the committed code |
| Next review | before the first pilot school is onboarded, then annually |

---

## 1. What the processing is

OpenMind is a practice and assessment service for school-age learners. A learner
answers questions; the server marks them and appends one event per graded answer
to an append-only ledger (`lib/evidence.ts`, `lib/server/evidence-file.ts`). A
projection over that ledger produces the learner's model, and a decision engine
turns the model into the next step (`lib/next-engine.ts`, `lib/server/projection.ts`). A
teacher who owns a class can read a monitor derived from each member's own ledger
(`lib/server/class-view.ts`).

The processing is **pedagogical, not commercial**. There is no advertising, no
analytics SDK, no third-party tracking and no behavioural profiling for any
purpose other than choosing what to teach next. That is a property of the code,
not a promise: no analytics or advertising dependency exists in the repository.

---

## 2. Necessity and proportionality

The system is unusually data-light for its category, and each decision below is
enforced in code rather than stated in a policy:

| Design decision | Where it is enforced |
|---|---|
| The roster holds a **handle and a learner id**, never a child's email address; the OneRoster export writes an empty `email` on every row | `lib/export/oneroster.ts`; `lib/types.ts#ClassRoster` |
| A learner's own paper stores **marks and concept tags only** — never question text | `lib/personal-paper.ts`; `docs/PRIVACY.md` §3 |
| Anonymous learning is a first-class path, not a degraded one; a guest record can later be claimed by an account | `lib/client.tsx#claimGuestProfile`; `app/api/auth/claim/route.ts` |
| A profile id alone is not a credential; every learner-scoped read needs the capability secret or an owning session | `lib/server/capability.ts`; `docs/SECURITY.md` §3 |
| Answer keys are server-side; the browser receives a served view with no answers | `app/api/progress/route.ts` |
| A device's clock is recorded as the device's claim (`deviceAt`) and never used for scheduling or ordering | `lib/evidence.ts#AnswerSubmitted` |
| AI is optional; with no key the deterministic offline tutor answers, and the learner is told which one replied | `lib/llm.ts#aiStatus`; `lib/tutor-context.ts#disclosureKey` |
| The AI prompt carries the concept, course, decision and counts — **not the learner's name, handle or email** | `lib/tutor-context.ts#tutorGroundingPacket` |
| Erasure is one workflow with a journal, so an interrupted erase is resumable rather than partial | `lib/server/erasure.ts` |

Proportionality argument, stated so it can be challenged: the only personal data
held is what is needed to (a) let a learner return to their own record, (b) teach
the next concept at the right depth, and (c) let a teacher see how a class is
doing. Nothing is held to sell, to rank schools publicly, or to predict anything
outside the curriculum.

---

## 3. Data inventory

All data lives in one directory, `OPENMIND_DATA_DIR` (`lib/server/store.ts`), and
nowhere else. "Who can read it" names the code path, not a role description.

| Data | File | Contents | Who can read it | Retention |
|---|---|---|---|---|
| Account | `accounts.json` | email, display name, role, scrypt hash + salt, recovery-code hash + salt, teacher reset grant hash + expiry, session epoch | the account holder (own record); server modules only — no route returns hashes (`lib/server/auth.ts#publicAccount`) | until account deletion; **no automatic expiry** |
| Learner profile | `profiles.json` | handle, country, language, subjects, course, year, goal, capability secret, progress, diagnostics, seen items, optional `projectionBase` | the owning account, a holder of the capability secret, or a teacher **of the learner's own class** (aggregates only, `lib/server/class-view.ts`) | until erasure; **no automatic expiry** |
| Evidence ledger | `evidence/<learnerId>.jsonl` | one line per graded answer or session event: concept, question id, correct/incorrect, chosen index or typed value, hints, mode, marks, milliseconds, misconception tags, certainty, `deviceAt` claim, server timestamp | the learner (own ledger, `app/api/evidence/route.ts`); a teacher reads aggregates derived from it, not the stream (`docs/PRIVACY.md` §5) | until erasure; **no automatic expiry** |
| Class roster | `classes.json` | class name, join code, member ids and handles, owner id, assignments, teacher-set work | the class owner; a member receives only their own row (`lib/server/class-view.ts`) | while the class exists; membership removed on leaving (`lib/server/class-membership.ts#removeMember`) |
| Personal papers | `personal-papers.json` | a learner's own marks and concept tags, no question text | the owner only — reads are owner-scoped (`lib/server/store.ts`) | until erasure |
| Staged papers | `papers.json` | answer keys and grade boundaries for an exam paper | server only; never returned to a learner | bounded by count, pruned by the operator |
| Study packs | `packs.json` | community-authored explanations, author handle | any learner (by design, public content) | until removed |
| Study rooms | `rooms.json` | room name, member handles, messages, tutor replies and their source label | room members | until removed |
| AI result cache | `ai-cache.json` | model output keyed by prompt, capped at 4000 entries | server only | bounded by count |
| Interventions | `interventions.json` | teacher-proposed actions, their status and the teacher who recorded them | the class owner | until the class is removed |
| Erasure journal | `erasures.json` | learner id + when the erase was asked for, and when it finished | server and operator; a restore re-applies it (`lib/server/erasures.ts`) | kept deliberately: it is what stops a backup resurrecting an erased learner |
| Session secret | `session-secret` | HMAC key for session cookies | server only | until rotated |
| Boot record | `boots.json` | boot count/timestamps, no learner data | server only | bounded |

**On the device** (not on the server): the learner profile id and capability
secret (`lib/api/identity.ts#PROFILE_ID_KEY`, `PROFILE_SECRET_KEY`), up to 200
unsent answers (`lib/sync-queue.ts`), language and display preferences, and any
pages the service worker has cached (`public/sw.js`). See
`docs/ministry/DATA_FLOW.md` §10.

**Never stored:** plaintext passwords, plaintext recovery codes, plaintext
session tokens, question text from a learner's own paper, or a full AI
conversation transcript.

---

## 4. Lawful basis

Candidates, not conclusions. Each depends on the deployment's relationship with
the school and on the operating country's law.

| Processing | Candidate basis | Note |
|---|---|---|
| Creating and serving a learner account | performance of a contract with the school, or the school's public task | [counsel to confirm] |
| Teaching record (ledger, model) | the school's public task / legitimate interests in education | [counsel to confirm] — depends on whether the school is the controller |
| Teacher visibility over a class | the school's public task | the teacher can read aggregates for classes they own only (`lib/server/class-view.ts#resolveMembers`) |
| Optional AI tutoring | consent of the school, or legitimate interests with an opt-out at deployment | a deployment can run with no AI key at all; `lib/llm.ts#aiStatus` reports the state |
| Anonymous practice with no account | not personal data until the learner creates an account or is given one | the guest claim flow moves the record, it does not copy it |

**Age and consent.** The product does not implement age assurance beyond what
enrolment collects, and there is no mail service, so no address can be proved
(`Account.verified` is `false` for every account — `lib/types.ts`). A deployment
serving under-13s must decide, with counsel, whether parental consent is required
and how it is obtained offline. [counsel to confirm]

---

## 5. Children's risks, specifically

Generic DPIA text is useless here; these are the risks this architecture actually
creates, and what has been done about each.

| Risk | Why it arises in this product | Mitigation in the code | Residual |
|---|---|---|---|
| Shared device: the next learner sees the previous learner's record | the deployment target is one phone for several children | 60-day session with **server-side revocation** on sign-out (`sessionEpoch`, `lib/server/auth.ts`); `probeProfile` clears a stale identity on 404 (`lib/client.tsx`) | a learner who does not sign out leaves their session; deployment guidance must make sign-out part of the lesson routine |
| A leaked id exposes a child | ids appear in URLs | every learner read needs the capability secret or an owning session (`lib/server/capability.ts`); pinned by `npm run verify:permissions` | a leaked secret is a leaked record — the secret is in localStorage, so a shared profile on a shared browser is the exposure |
| Forgotten password loses the record | no mailbox, borrowed addresses | printed recovery code (scrypt-hashed, rotated on use) and a 15-minute single-use teacher grant (`lib/server/auth.ts#recoverAccount`, `app/api/auth/recover/route.ts`) | a lost paper plus a teacher who has left the school is still a support case |
| Teacher over-reach | rosters contain named children | one authority rule (`isTeacherOf`, `lib/server/class-membership.ts`); a teacher sees aggregates, never the event stream, never the email; asserted in `npm run verify:permissions` | a class owner can see a member's measured weaknesses — that is the point of the product and must be covered in the school's own policy |
| Handle collision reveals one child's work under another's name | handles are learner-chosen | membership is bound by id, not handle (`membersById`); a second join gets its own row (`app/api/classes/route.ts`) | a teacher may still misread two similar handles; the roster shows both |
| AI provider receives a child's words | the tutor sends the learner's message | the packet excludes name, handle and email (`lib/tutor-context.ts#tutorGroundingPacket`); AI is optional; the learner is told who answered (`disclosureKey`) | the message itself is free text and may contain identifying detail — the deployment must decide whether AI is enabled, and the school must tell learners not to type names |
| Offline work sits unsent on a device | connectivity is intermittent by design | queue capped at 200 answers, refusal is visible rather than silent (`lib/sync-queue.ts`); replay is idempotent by submission token (`lib/evidence.ts#submissionEventId`) | an unencrypted device holding a queue; the deployment's device policy must cover it |
| Erasure is undone by a restore | backups predate the erase | the erase records its instruction first and a restore re-applies it (`lib/server/erasure.ts`, `lib/server/erasures.ts`) | an operator who restores without the erasure log — the log is the file to carry beside the archive |
| Telemetry about children | none exists | no analytics, no ad SDK, no structured logger in the repository | a deployment adding any of these creates processing this DPIA does not cover |

---

## 6. Risk register

Likelihood and severity are 1–3; residual is after the mitigations above. This is
a working register, not a certification.

| # | Risk | L | S | Mitigation | Residual |
|---|---|---|---|---|---|
| R1 | Unauthorised read of a learner record via a leaked id | 3 | 3 | capability secret + owning session; tested negatively over HTTP | 1 |
| R2 | Shared-device session reuse | 3 | 2 | server-side revocation; stale-identity clearing | 1 |
| R3 | Lost credential, record unrecoverable | 2 | 3 | recovery code; teacher grant | 1 |
| R4 | Teacher reads beyond their class | 1 | 3 | one authority rule, asserted | 1 |
| R5 | AI vendor receives identifying free text | 2 | 2 | packet excludes identity; AI optional; disclosure | 1 |
| R6 | Offline queue on a lost device | 2 | 2 | bounded queue; deployment device policy | 2 |
| R7 | Erased learner restored from backup | 2 | 3 | erasure journal re-applied at restore | 1 |
| R8 | No retention limit configurable today | 3 | 1 | operator schedule; `npm run backup -- --max-age-days` for copies | 2 |
| R9 | Store unreadable or disk full mistaken for a working site | 2 | 2 | `/api/ready` reports store state; readiness and disk guards fail loudly | 1 |
| R10 | No age assurance | 3 | 2 | anonymous-first entry; deployment-level consent decision | 3 |

R8 and R10 are the two the deployment must close itself, in writing, before a
pilot starts.

---

## 7. Cross-border transfers

- **Self-hosted deployments** keep everything in `OPENMIND_DATA_DIR`, including
  the ledger and the session secret (`lib/server/store.ts`). Where that directory
  sits is the deployment's decision and should be recorded here.
- **AI providers are the only outbound service.** With a key configured, a prompt
  is sent to the chosen provider's endpoint (`lib/llm.ts#endpointFor`): Gemini,
  OpenAI, Groq, OpenRouter, or an operator-supplied OpenAI-compatible base URL.
  Those endpoints are outside the operating country by default. Any deployment
  enabling AI needs a transfer mechanism and the provider's terms recorded here
  [counsel to confirm].
- **Export** produces files the deployment chooses to hand to a third party (QTI,
  OneRoster, CASE — `lib/export/`). The roster export contains no addresses by
  construction; the others contain authored content only.

---

## 8. Consultation and sign-off

- **DPO:** to be appointed. No consultation has taken place.
- **Learners and parents:** no consultation has been run. A deployment should
  run at least one, and record what changed as a result.
- **Regulator:** no approach has been made, and none is claimed.

---

## 9. What this document does not establish

It does not establish that the deployment is lawful: that depends on the
controller, the country, the school's own policies and the contract. It does not
establish that consent has been obtained, that a DPO has reviewed it, that the
regulator has been consulted, or that any certification exists. It does not cover
processing added by a deployment — analytics, a mail provider, an SMS gateway, a
different AI vendor, or a second service sharing the same store. Each of those is
a change that requires this document to be reopened.

---

## 10. Review

Review before the first school is onboarded, after any change to the store, the
export formats, the AI layer or the authentication model, and annually. The
repository's own gates are the cheapest way to check that the claims in §2 still
hold: `npm run verify`, `npm run verify:permissions`, `npm run storage-check`.
