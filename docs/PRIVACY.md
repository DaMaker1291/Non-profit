# Privacy

OpenMind is aimed at school-age learners, so privacy is design work, not
paperwork appended after launch. This document is the operational privacy
position of the current code, written so that a DPIA can start from it. It states
what the product actually does; anything not yet built is labelled **PROPOSED**.

> Because this service is likely to be accessed by children, the Children's Code
> applies from design onward: best interests, a DPIA, age-appropriate
> application, transparency, data minimisation, and high-privacy defaults.

---

## 1. Data inventory (what the code stores)

Everything below lives in `OPENMIND_DATA_DIR` and nowhere else.

| Data | Where | Personal? | Purpose |
|---|---|---|---|
| Account: email, display name, role, scrypt password hash + salt | `accounts.json` | yes (email) | sign-in |
| Profile: handle, country, language, subjects, course, year, goal | `profiles.json` | yes (handle) | adapt teaching |
| Evidence ledger: answers, correctness, hints, timing, misconception tags, self-reported certainty | `evidence/<id>.jsonl` | pseudonymous (learner id) | the learner model |
| Class roster: name, join code, member ids/handles, self-reports | `classes.json` | yes (handles) | teaching |
| Assignments: concepts + deadline on a class | `classes.json` | no direct | set work |
| Papers: staged answer keys | `papers.json` | no direct | sit a paper |
| Personal papers: the learner's own marks + concept tags (no question text) | `personal-papers.json` | pseudonymous | their own record |
| Study packs / rooms | `packs.json`, `rooms.json` | pseudonymous | sharing help |
| AI result cache | `ai-cache.json` | no direct | avoid repeated calls |
| Session signing secret | `session-secret` | infrastructure | sessions |

**Never stored:** plaintext passwords, question text from a learner's own paper
(only marks and concept tags — see `lib/content-rights.ts`), or a full
AI conversation transcript. AI replies are cached as *content*, not as a child's
conversation history.

## 2. Lawful basis and consent

- **Accounts**: performed contract / legitimate interests (providing the
  service). **PROPOSED** — an explicit school/parent consent record for
  under-13s, and a recorded lawful basis per deployment.
- **Anonymous learning** is first-class: a learner can use OpenMind with no
  account at all. A guest profile can later be **claimed** by a new account,
  moving the history over rather than discarding it.
- OpenMind does **not** attempt age assurance beyond what onboarding collects.
  **PROPOSED** — an age-appropriate application decision per deployment.

## 3. Data minimisation

- Anonymous learning is the default entry, not a downgrade.
- The evidence ledger records *learning facts* (which concept, correct or not,
  how many hints, which misconception a question probed) — not content the
  learner did not need to give.
- Personal papers store **marks and concept tags only**; the question text never
  reaches the server, which is what makes storing them defensible at all.
- Logs must minimise personal data the same way the store does
  (**PROPOSED** — there is no structured logger yet, so there is nothing to leak
  and nothing to redact; both arrive together).

## 4. Transparency — what a learner can see

- A learner can read their **own** projection and event stream:
  `GET /api/evidence?id=…&secret=…`, and see their evidence view on their pages.
- Device-reported events are labelled — the record says "recorded offline"
  instead of passing unverified work off as observed.
- The learner is told whether a **model** or the **offline tutor** wrote each
  reply; the disclosure exists in all 15 languages so a fallback can never be
  presented as a model's work.
- **PROPOSED** — a plain-language privacy notice inside the app, and a
  "why does OpenMind think this?" explainer linked from every recommendation
  (the engine can already cite the evidence behind a decision).

## 5. Teacher visibility — exactly what a teacher may see

The line is drawn in code, not policy:

- A teacher sees **per-member progress for classes they own** — completion,
  accuracy, weaknesses, misconception counts derived from each member's ledger.
- A teacher **cannot** read another teacher's private class.
- A student receives **only their own** assignment row; the class monitor is
  returned only to the class owner.
- A teacher does **not** see a learner's raw event stream, their account email,
  or their AI conversations.

These rules are executable: `npm run verify:permissions`.

## 6. Retention

**PROPOSED — a retention schedule.** Today data lives until it is deleted; there
is no automatic expiry. The recommended schedule to adopt:

| Data | Retention |
|---|---|
| Evidence ledger | for the learner's enrolment + one academic year, then delete or anonymise |
| Account | until account deletion |
| Class roster | while the class exists; members are removed on leaving |
| AI result cache | bounded by count (already capped at 4000 entries) |
| Papers / personal papers | capped by count; prune on a schedule |
| Backups | 90 days, then destroyed |

## 7. Deletion and export

- **Erasure is implemented.** A learner-initiated delete removes the profile,
  its ledger and its personal papers, and removes the learner from every class
  roster (`deleteProfile`, `deleteEvidence`, `removeMemberEverywhere`).
- **Export: PROPOSED in full.** The learner can read their own evidence and data
  via the API; a single "download everything" bundle is not yet built.
- A backup containing deleted data must also be purged on its retention schedule
  (§6) — deletion in the live store is not deletion in an old backup.

## 8. Children's Code — the operational checklist

| Item | State |
|---|---|
| Best interests of the child as a primary consideration | product defaults (anonymous-first, no ads, no tracking, offline-first) |
| DPIA | **PROPOSED** — start from this document and `DATA_GOVERNANCE.md` |
| Age-appropriate application | **PROPOSED** — per-deployment decision |
| Transparency | partial (§4) |
| Data minimisation | implemented (§3) |
| Data sharing | none: no third-party analytics or ad SDKs exist in this codebase |
| Profiling | the learner model *is* a profile; it is used only to teach, and it can be inspected and rebuilt from evidence |
| Defaults | high-privacy: anonymous learning, no tracking, offline-capable |
| Connectivity / parental controls | no dark patterns, no engagement loops, no notifications |

## 9. AI and personal data

- What may be sent to a model is decided server-side (`lib/server/tutor.ts`,
  `lib/llm.ts`), and is the same decision, reason and projection the learner is
  shown — never a private cache of personal data.
- A model's output can never write to the record (see `AI_SAFETY.md`).
- **PROPOSED** — a deployment-level switch to disable cloud AI entirely, and a
  documented DPIA for any deployment that enables it.

## 10. Data sharing and third parties

There are none in code: no analytics, no advertising, no social embeds. AI
providers are the only outbound service, and they are optional; when a deployment
enables one, its sub-processor terms and data location must be recorded in that
deployment's DPIA.
