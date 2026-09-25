# 🌍 OpenMind

**Free, open-source education infrastructure. Not another AI tutor — the layer that turns AI (or no AI at all) into a working education system.**

> *Give every community the tools to turn freely available knowledge into high-quality education — starting with one teacher, one classroom, one laptop.*

OpenMind is not trying to out-chat Gemini or ChatGPT. It uses them when they're there (optional, bring-your-own-key) and runs **fully offline when they're not**. What it adds is the part no chatbot does: a knowledge genome of atomic concepts, server-side grading, a misconception ledger that remembers *why* a student gets things wrong, adaptive diagnostics, spaced retention, a weekly plan derived from what a class actually did, and an **offline printable pack** for schools where the internet disappears.

```bash
npm install
npm run dev        # → http://localhost:4173
```

No API key required. No database required. **The whole product runs on one laptop.**

---

## Deploy it yourself (the important part)

Someone in Ghana should never need permission — or a credit card — to run this.

### One command

```bash
docker compose up -d        # → http://localhost:4173
```

Learning data persists in `./openmind-data` on the host. Copy that one directory to **back up, move or duplicate an entire deployment**.

Without Docker:

```bash
npm ci && npm run build && npm start
```

### Configuration (all optional)

Copy `.env.example` to `.env`:

- `OPENMIND_DATA_DIR` — where data lives (USB stick, mounted school drive, Docker volume). Defaults to `./.openmind-data`.
- Any **one** of `GEMINI_API_KEY` / `OPENAI_API_KEY` / `GROQ_API_KEY` / `OPENROUTER_API_KEY` — upgrades the Socratic tutor to LLM-backed. **Nothing is gated**: without a key, the offline rule-based tutor works and every feature stays available.
- `OPENMIND_AI_BASE_URL` + `OPENMIND_AI_KEY` (+ optional `OPENMIND_AI_MODEL`, `OPENMIND_AI_TIMEOUT_MS`) — point the AI layer at your own OpenAI-compatible endpoint. These take precedence over the vendor keys above, so a school or region running its own model is never shadowed by a stray key in the environment.

**What the AI layer may and may not do.** A model explains, hints, adapts and generates practice; it can never write. There is no code path from an AI response to the evidence ledger or to a mastery field — the only way into either is append → confirm → replay/adopt, reached from the grading routes after the server has marked the answer against the engine's own key. The tutor is told *why* this learner is seeing this question (the same decision, reason, citations and projection version the app is showing them, read from their own projection — never from the request), the four ways a model can fail to answer (no key, provider error, timeout, unparseable body) are four supported outcomes that fall back to the offline tutor in the learner's language, and the learner is told which of the two wrote each reply. Three disclosure lines exist in all 15 languages so that a fallback can never be labelled as a model's work.

### For a fork or adaptation (OpenMind Kenya, OpenMind Brazil…)

The curriculum is plain data and the store is a directory of JSON files. Fork, translate `lib/i18n.ts`, edit `lib/genome.ts`, deploy on a school server, and improvements flow back upstream by pull request. MIT-licensed — see [`LICENSE`](./LICENSE).

---

## One pipeline from visitor to learner

The app is a **stateful application**, not a set of pages. Where a learner belongs is derived in one pure function (`lib/app-state.ts`), from two facts the client cannot guess: whether a session exists, and whether a profile does. Both start *unknown*, so the lifecycle says so out loud — `booting` is a state, never a silence that gets mistaken for "signed out".

```
visitor ──► onboarding ──► baseline diagnostic ──► Home ──► session ──► result ──► Home (moved)
```

**Every route declares what it requires** — `public`, `authenticated`, `onboarded` or `diagnosed` — and **one guard, mounted once in the app shell, acts on that contract**. No page decides for itself whether it is allowed to exist, which is how a learner ends up bounced into a sign-up form by clicking a nav tab. The wedge (`/solve`, `/try`) is `public` and therefore immune to the whole system, because an anonymous first question is the entire entry point.

**A redirect never throws away intent.** Asking for `/papers` while signed out lands on `/onboarding?mode=signin&return=%2Fpapers`, and after signing in you arrive at `/papers` — not at a dashboard you did not ask for. A learner who has enrolled but never been measured asking for Home is sent to the diagnostic **with a return ticket**, because a mastery dashboard of zeros means nothing.

**A learner is one identity, plus one learner profile, and navigation cannot change either.** `POST /api/auth/logout` does more than clear the cookie: it bumps a session epoch on the account, so every cookie already issued for it stops verifying. On a shared phone — the deployment this project is for — "sign out" has to actually end the session.

**Honest limit:** the guard is a *state* layer, not a security boundary. It keeps a learner from being dropped somewhere meaningless; it protects nothing. The boundary is the API, where every call is authorised server-side (a session that owns the profile, or the profile's capability secret — the id alone is a 401).

---

## The student wedge

**"Got a question you can't solve?"** — no account, no onboarding, no pitch. A student pastes their question, a deterministic offline matcher (`lib/matcher.ts` — works on a cheap phone with no connection) finds the concept, and the Socratic ladder takes over: the idea first, then 🟢🟡🟠🔴 hints that never hand over the answer, then a fresh **prove-it question**, then mastery — then *"teach someone else."* A profile is created lazily, only when the student engages, so the learner model starts recording from the very first question.

**Learning links** (`/try/[concept]`) drop a friend straight onto a live challenge question. Usefulness spreads student-to-student, not through advertising.

---

## Accounts, enrolment, exam papers and AI

**Accounts are real.** Email + password (scrypt, per-account salt), a signed HttpOnly session cookie, and one learner profile per account — so signing in on any device restores the whole history. Sign-up keeps the anonymous profile already on that device: `POST /api/auth/signup` with `claim.profileId` moves the recorded work across instead of starting again. Accounts are **optional** — the wedge and practice still run without one, and the UI says plainly which of the two you are using. Honest limit: OpenMind sends no mail, so an address is never *verified*; the account record says so.

**Enrolment is a real flow** (`/onboarding`, 5 steps): account or guest → about you → your course (country → specification → tier → board → exam date) → subjects and daily minutes → languages. Everything lands on the learner profile (`grade`, `spec`, `specLevel`, `board`, `examDate`, `timePerDay`, `onboardedAt`), and the whole flow is translated into all 15 languages.

**Exam papers** (`/papers`, `lib/papers.ts`). Each paper follows a real qualification's published shape — papers, sections, mark values, time allowed, calculator rules and grade-boundary percentages — and is assembled from the **specification layer's actual coverage** at that tier's difficulty. Sit it under its own timer, then get the mark scheme, the raw score and a grade *estimate* (boundaries move every series — the UI says so). Two honest limits: these are OpenMind's own exam-style questions written to the specification, **not reproductions of copyrighted past papers**, and every answer is recorded as *independent* evidence, which is exactly the signal the learner model needs.

**A paper is diagnostic evidence, not a score** (`lib/paper-analysis.ts`). The result screen answers the question a total cannot: which *ideas* cost marks, which of them came up on more than one question (a pattern, not a slip), how much of the loss sat on those ideas, and the one thing to work on next. Skipping is handled honestly — an unanswered question loses its marks and is attributed to its idea as a gap, but it is never counted as a wrong answer and never records a misconception. The mark scheme knows *why* each question was set, so that misconception tag reaches the learner model with the answer. The breakdown is by **concept**, the finest grouping the specification layer actually supports: no board topic names are invented to make the table look more familiar than the data is.

**On-device AI exists on the phone the learner already has** (`lib/local-ai.ts`, `lib/local-model.ts`). A transformer does not fit on a 2016 Android with 1 GB of RAM, so rather than ship a feature that only works on new phones, OpenMind runs a **fitted classifier on the device** — a multinomial Naive Bayes over bag-of-tokens, ~13 KiB, no download, no WebAssembly, no GPU — and reads what a student is actually asking for ("just give me the answer", "I'm stuck", "why does that work", "is my solution correct") to pick the tutor's strategy. On held-out phrasing it is **never confidently wrong** (it abstains instead), which is the only claim worth making about a classifier used on a student.

Above that rung sits a **measured capability ladder**: the app checks whether the device has typed arrays, WebAssembly, **SIMD (by making it validate a real SIMD module)**, WebGPU, cores, memory, storage and a CPU benchmark, and reports `none · lite · wasm · gpu`. The two upper rungs are *capability reports*: **no larger model is bundled**, and the plan says so in its own return values rather than in a footnote. The old-device rules are the feature — nothing is probed until after the first paint, inference is capped and yielded on slow CPUs so it cannot freeze the screen, and a metered connection or a low battery refuses a bigger model even on hardware that could run one. The ♿ panel states which rung this device got, in the learner's language.

**The AI layer** (`lib/llm.ts`) does four jobs when the deployment has a key: Socratic tutoring, concept explanations, exam-style question writing, and marking written reasoning. Everything is validated before it reaches a student — an AI question that does not satisfy the four-choice contract is dropped and the slot is refilled by the deterministic engine — and generated content is cached on disk so a school that pays for one call can serve it offline afterwards. With no key, nothing is gated: the offline engines teach, mark and question on their own, and the UI says which one answered.---

## The closed learning loop

Recording answers is not the same as changing the plan. OpenMind's central claim is that it **learns the learner** — so the product makes that claim visible and provable, in one loop:

```
HOME → open a session → answer → evidence recorded → learner model recomputed
     → next-step engine re-runs → RESULT SCREEN (before → after, and why)
     → HOME, visibly different
```

**A session has a lifecycle** (`lib/session.ts`, `POST /api/session`): it opens with a target, captures a **baseline before the first answer**, and closes with a diff. Every counter in that diff — asked, correct, hint-free, transfer — is incremented where the grading actually happens, so the client cannot inflate it, and the open session's baseline lives on the profile as transient server-only state that is stripped before the profile crosses the wire. If a connection drops mid-session, the same session is *resumed* with its original baseline rather than quietly restarted.

**Every recommendation answers six questions.** The next-step card is not a button: it states *what* to do, *why* the model believes it (attempts, hints, mastery, confidence), **why now** (the learner's own exam date — "Your GCSE Maths paper is in 4 days — this is the highest-value work today", or the honest "No exam date set — the order follows your evidence"), and **how** the session is shaped ("1 explanation → 5 practice"). The plan is fitted to the minutes the learner said they have per day, and the time shown is the plan's own cost, so the card cannot promise eight minutes and hand over fifteen. A slip is also *repairable*: three correct answers in a row retire it, so a learner who fixes a mistake stops being told to fix it — while the lifetime record stays visible to their teacher.

**The baseline diagnostic measures demand level, not just topics** (`lib/question-bank.ts`). A concept percentage cannot be acted on; "you recall and apply, but unfamiliar data is where you lose marks" can. So the diagnostic samples the learner's own qualification through a **blueprint** — coverage spread across the spec's stage bands, deterministic in (spec, subject) so a baseline and its later retest ask the *same* questions of the same concepts — and the result reports the five demand levels separately.

**A number without its confidence is an over-claim**, so every demand row carries both: `4/6 · 67% · 48–83% · moderate confidence`. Two of two and six of six are the same percentage and are not the same evidence, and the estimate's own interval is the judge. `not measured` and `0% measured` remain different claims, and a row that cannot be measured says **why** — beyond a multiple-choice instrument (extended writing), beyond the bank (no question in it reaches data-and-graphs yet), or beyond what this course's questions reach at all. None of those is a gap in the learner, and the report says so instead of leaving an empty row to be misread.

The diagnostic also **stops paying for what it already knows**: once a demand band has been demonstrated across the session, later concepts start above it, and the result states which bands were skipped. Only demonstrated bands skip — a band the learner has *not* shown is still probed on every concept, because "has not shown it" is a reason to teach, never a reason to stop looking.

**OpenMind is the exam-paper workspace, not a paper archive.** Boards do not permit their papers to be republished on third-party sites, so rather than pretending otherwise, `lib/content-rights.ts` makes the permission part of the code: every piece of content carries an origin — OpenMind-authored, licensed, learner-provided, or a link to the publisher — and the origin decides what may be hosted, shown, processed, stored, linked, shared or used for training. Licensed material with no licence on record may do **nothing at all**, and none is on file, so none is shown. The learner-facing answer is **bring your own paper**: sit the paper your board sets, and hand OpenMind the workspace — which question, how many marks, how many you got, which idea it tested — never the paper itself. The route refuses question text outright rather than quietly dropping it, keeps every paper private to its owner, and runs it through the *same* diagnosis as an OpenMind paper, so a learner in Nairobi and a learner in Manchester get identical quality of feedback from completely different content. What it will never do is invent a misconception: a mark total says which idea cost marks, never why.

**Three pools, and they are not interchangeable.** Past papers *measure*, authored questions *teach*, unseen questions *verify*. Diagnostic and assessment items are **spent once served** (recorded on the learner's exposure ledger), so a later "improvement" can never be memory of the probe. One honest limit, stated in the code and on the page: **the bundled bank contains no official board questions** — none are licensed to this project — so every probe is OpenMind-authored and written to the qualification's difficulty bands. The provenance type, the pools and the exposure ledger exist so that adding licensed content is a data change rather than a rewrite.

**The result screen shows the model moving**, not a score: mastery and independence before → now, the misconception that recurred (if one did), the recomputed next action, and one honest sentence saying why it changed — or, when the evidence did not justify a new plan, that it did not. `changeReason` is derived (`transfer`, `misconception`, `independence`, `mastery-up`, `mastery-down`, `same`, `unchanged`) and `nextStepChanged` compares the engine's decision before and after on *kind + concept*, not on wording.

**The whole chain is asserted, not asserted-to**: `npm run verify` ▸ THE PROOF and section 5d of `npm run e2e` walk one learner from a baseline measurement, to a plan that targets what it found weak, to hint-free work on exactly that, to **a plan that has moved forward** — and then to a later, parallel-form sitting that measures the repair on the same band. Both include the controls that make it falsifiable: with no new evidence the plan does not move, and failing the same work moves it the other way. If the loop ever stops closing, the suite says so before a learner finds out.

**Home shows what changed** (`dash.since`): the last session's before → after numbers, the reason, and an unfinished session offered as a resume chip — while the next-step card above it renders the plan the engine just recomputed. If a session ends with nothing new, the screen says so; scaffolding is never dressed up as adaptation.

---

## The evidence ledger — and the impact it can honestly claim

Everything above *mutates* learner state: an answer is folded into counters, and the reason for the resulting model is gone the moment it is written. That is why "why does OpenMind think I'm weak at this?" had no answer beyond a re-derivation. `lib/evidence.ts` + `lib/server/evidence.ts` fix that by inverting the direction:

```
ACTION → EVIDENCE EVENT → LEDGER (append-only) → PROJECTION → model → recommendation
```

**The event is the truth; the learner model is one projection of it.** Events are never rewritten or deleted, each carries a `schemaVersion`, and projection is **order-independent** — so replaying the same ledger rebuilds the same model, and a better algorithm later can be applied to evidence that already exists instead of starting from a learner's memory. Ids are random rather than derived, so two genuine attempts at one question cannot collide and silently drop one.

**Evidence is created server-side, from the same values the grader just used** — the mode the server derived, the hint count from the server's own ledger — and the event is **not returned to the client**, since a client that can read the ledger's shape can author one. Validation is total: every malformed event is refused with its own reason, and the single most important refusal is `learner_mismatch`, because evidence about anybody else never lands, however the body is phrased.

**Provenance is recorded, not assumed.** An event the server graded is `"server"`. Anything arriving over the wire is stamped `"device"` *regardless of what the body says* — offline work is real and is kept, but the ledger never claims to have watched what it did not, and the report counts that share separately.

**The ledger is the source of truth, and the model is a projection of it.** That is not a description of a test: every write path in the product goes **event → ledger → replay → model**. An answer is graded, the event is written and *confirmed*, and only then is the learner model recomputed from the ledger (`lib/server/projection.ts`). If the append fails, the model does not move, and the learner is told so — the one outcome the design forbids is a model that changed without evidence behind it. The rule this protects is stated once, in `AGENTS.md`:

> There is no authoritative learner-state mutation that cannot be reconstructed from an evidence event.

The projection re-runs the model's own mathematics over the ledger (`recordAnswer` for graded answers, the shared `mergeDiagnosticSeed` for diagnostic sittings — one implementation, so the paths cannot drift), and `reconcileDeep()` compares every derivable field per concept: counts, streak, EWMA accuracy, pace, timestamps, and the independence/transfer proof records. It is recomputed on **every** read of `GET /api/evidence` (`deepReconcile`), so divergence is never a special request away. What the fold deliberately does not rebuild (observation stamps, the mastery map, flare annotations, hint tallies) is preserved rather than invented, and both lists — `LEDGER_OWNED_FIELDS` and `LEDGER_ABSENT_FIELDS` — name the boundary in code.

**Which events fold is a rule, not a default.** A diagnostic sitting folds as ONE event, through its carried ladder seeds; its individual `answer_submitted` events are the question-level detail and are deliberately not folded, or every diagnostic answer would count twice. An *abandoned* sitting is the proof that the rule is right: its answer events are on the ledger and its sitting event is not, and the model does not move — exactly as it never did live.

**A projection is versioned separately from the evidence** (`PROJECTION_VERSION` beside `EVIDENCE_SCHEMA_VERSION`). The schema says what an event *means*; the projection says how evidence becomes a model. The same history, projected by a better algorithm, produces a better model — with no past rewritten to get it — and every projection reports the version that produced it.

**The cutover does not eat a learner who predates the ledger.** A learner may have a real model and no ledger at all, and the live store holds exactly that shape. Replaying an empty ledger over them would reset every mastery to the prior on the next answer, so the pre-ledger model is snapshotted once, lazily, and the ledger is folded on top of it: 13 recorded answers become 14 rather than restarting at 1. The snapshot is created on a *measurement*, not a guess — a ledger-only replay is reconciled against the model, and nothing missing means the ledger already **is** that learner's history, so no snapshot is taken and their model stays the ledger alone. What cannot be rebuilt is named on every read (`deepReconcile.unprojectable`) instead of being passed off as evidence.

`npm run verify` proves the whole thing end to end: a learner is walked through diagnose → practise → prove → transfer → retain, and after **every** stage the projected state is deleted, the ledger replayed, and both the learner model and the next action — kind, target, reason, plan, and cited evidence ids — must come back byte-identical. It also removes single events from that history and requires the recommendation to change because the *evidence* changed, and it proves the pre-ledger case keeps its counts.

**Replay parity rests on two producer rules, both enforced at the routes.** One answer, one clock: every write route passes the SAME stamp to the model update and to the event it mints (`recordAnswer`'s optional `at` parameter exists for this), so timestamps are reproducible from the ledger. And every graded answer reaches the ledger: papers (both OpenMind-built and bring-your-own — the latter stamped `provenance: "device"`, since the server never watched the owner's marking) and micro-checks mint events now, closing the last producer gaps. Diagnostic sittings carry their per-concept ladder seeds ON the `diagnostic_completed` event; replay re-derives the mastery numbers with `ladderMastery` rather than trusting anything an event says.

**The store is one append-only JSONL file per learner** (`.openmind-data/evidence/<learnerId>.jsonl`). An append is a single write, so two concurrent answers cannot truncate each other's history the way a read-modify-write of one JSON array can; a corrupt line costs one event instead of the file; and ingestion is **idempotent by event id**, because a device that retries after a dropped response would otherwise double its own work. Learner ids become file paths, so they are *checked and refused*, never silently sanitised — quietly rewriting an id could append one learner's evidence to another's file.

**The impact report is what the evidence supports, and nothing more** (`GET /api/impact`). It is aggregate by construction (`containsIndividualData: false`) and it ships its own `limitations` with every response, so a figure cannot be quoted without them. It refuses percentages where there is no denominator: a learner with no baseline gets `assessed: false` and a learner with no later measurement gets `null` — **never 0** — and such learners are excluded from the change denominator rather than counted as unchanged. The causal claim ("OpenMind improves grades by X") is not computable from this data and is deliberately absent; only a controlled evaluation could produce it.

**From ledger to experience** — the kernel now has learner-facing doors. `GET /api/evidence-summary` projects the ledger into what the experience may show: per-concept dimension rows (recall, independence, transfer — `null` where nothing of that kind was attempted, never 0), recents with disclosed provenance, and no ledger vocabulary (`schemaVersion` and friends never cross this door; the e2e asserts it). `lib/evidence-view.ts` is the citation layer between event ids and human-readable evidence. The Home card's **Why this?** drawer renders the engine's decision — `decideNext` returns `evidenceIds` and `expectedOutcome`, and the reasons come from the engine, not from React (a source-level check in verify keeps the reason literals out of the components). **My evidence** (`/progress`) is the ledger as a readable record: dimension bands per concept, a recent-evidence timeline, and an explicit *not measured yet* section — unknown ≠ zero as a UI section, not only a backend property.

**One door, one decision.** Every surface that asks "what next?" — Home, the plan queue, the lesson page, the offline pack, the session result and `GET /api/next` — assembles the same `DecisionContext` (the learner model **and** the ledger it was projected from) and calls `lib/decision.ts`. A surface that holds the model and not the evidence is not making a smaller decision, it is making a different one, so verify asserts that the live model, a from-scratch replay of the same ledger and the server route door all produce the **same action** — same kind, target, reason, plan and citations — and a source-level check fails the build if any surface calls the engine directly.

**"Why is this next?" is answerable, and the answer is a projection.** `/mind` lists what OpenMind has actually measured about each concept, and `/mind/[conceptId]` answers the question a learner actually asks: *what we know* (each dimension with its own counts, or an explicit **not yet measured** — never 0%), *the evidence itself* (the recorded answers, including the diagnostic that first made the concept look weak), *why this is next* (the engine's own reason, why-now, plan and expected outcome, inline when this concept is the top action), and *what changed* (the last session on it, with the session engine's own reason). The pages read the ledger, not the mutable model, and claim nothing about knowledge until the record is in hand — "we have not read your record" is not the same sentence as "you have demonstrated nothing".

**One learner, one journey, one decision** — proven end to end over HTTP, not described. A single learner is taken through diagnose → practise → prove → transfer through the real routes, and after every stage the suite asserts that the decision the product shows and the second surface (the offline pack, built in its own request) ask for the same work, that every citation resolves in that learner's own ledger, and that the ledger alone still rebuilds the model. It also checks the two joints where a fake loop would show: the session opens with the plan the learner was actually shown, and it closes on the plan the server serves immediately afterwards. Retrieval is not in that list — the rung needs evidence that has aged, so it is pinned in the engines suite where the clock is fixed rather than faked in the API suite.

**Every recommendation carries its own basis**, and the basis has five states rather than two, because "no citations" and "no evidence" are different facts: `cited` (these recorded answers are why), `unattributed` (evidence exists, but this rule hinges on no single event — a rest day), `no_evidence` (nothing has been measured yet), `unrecorded` (the learner's work predates the evidence record — the store holds one such learner), and `unknown` (this surface has not loaded the ledger). That last one is not a technicality: a client surface fetches the ledger after it paints, so treating a pending fetch as an empty ledger told learners with a full history that nothing had been recorded. The checks are pinned in verify with planted lies that must be refused, and over HTTP in the e2e suite.

**Honest state:** every evidence producer goes through the one write path — the practice answer path, the diagnostic (a sitting folds as one event carrying replayable seeds), both paper routes, micro-checks, and offline ingestion. Hint requests mint a `hint_requested` event but deliberately do **not** move the model: the hint count that counts is the one attached to the graded answer, and counting the request as well would double every hint. Two things are still honest gaps: the *starter* and *peer-teaching* counters are learner-model annotations with no event behind them yet, so the projection preserves them rather than deriving them; and a device-synced event older than a learner's pre-ledger snapshot is outside the projection — recorded, disclosed, and never counted twice. The recommendation engine reads the model the projection produced, and with the same ledger in an order it produces the same action, the same reason and the same citations.

---


## What's inside

### 🧬 The Knowledge Genome (`lib/genome.ts`)

**135 atomic concepts** — Mathematics (72), Physics (18), Chemistry (16), Biology (16), Computing (18) — each with:

- a curriculum-aligned **lesson** (a real explanation, not a syllabus checkbox),
- explicit **prerequisites** forming a directed graph (validated cycle-free),
- a **stage** (0 Foundations → 5 Frontier),
- links into the **misconception catalogue** it targets.

Enter the graph anywhere — a 12-year-old in Bangladesh and a 16-year-old in Britain get different routes through the same territory.

### 🛰️ The wedge matcher (`lib/matcher.ts`)

Deterministic keyword/notation matching from a student's own question text to genome concepts. Deliberately **not** an AI call: it runs offline, instantly, on any device — and it says so honestly when it's unsure.

### 🔍 Adaptive diagnostic (`lib/diagnostic.ts`)

A **staircase ladder** per concept: pass 2 questions → climb a difficulty band; miss one → stop. Converts ladder position into a calibrated mastery score, detects misconception patterns from wrong-answer signatures, and emits strengths, gaps and named patterns.

### 🧠 The misconception catalogue (`lib/misconceptions.ts`)

**52 named patterns** of real student thinking — not "you got Q7 wrong" but *"you're repeatedly changing the sign when substituting a negative coefficient"* — each with coaching advice wired into the learning path, the student's dashboard, and the teacher's class view.

### ✏️ Unlimited generated practice (`lib/questions.ts`)

**126 concepts** carry seeded generators — never repeated, always with a worked explanation, every distractor engineered to expose a specific misconception. Deterministic by seed: the same seed rebuilds the same question, server-side.

**Integrity**: the server grades everything. Served questions carry no answers (a `serveView()` sanitizer strips them); graded responses reveal the correct index only after grading. The client never tells the API whether an answer was right.

### 🧗 The hint ladder (`lib/hints.ts`)

Every practice question offers **Tiny → Strong → First step → Walk me through it**. Levels 1–2 are translated strategy nudges, level 3 adds the question's own opening move, level 4 is the full reasoning. Every request is recorded — "this concept needed 2 hints" becomes learner-model data.

### 📊 The learner model (`lib/progress.ts`, `lib/retention.ts`)

EWMA mastery per concept, a confidence score that returns **null below 3 attempts** (no fake precision), misconception counters, and a 1/7/30-day retention ladder scaled by mastery. The dashboard shows what's ready for review and names weak links with their reasons.

**And the review is a measurement, not just a schedule.** When a concept's interval has elapsed, the serve path asks the scheduler (`lib/retention.ts#isRetentionDue`) — never the client — and stages the question as a *retrieval*. The answer is stamped `source: "retrieval"` on the ledger and becomes retention evidence **only if** it needed no hints and the previous evidence on that concept is at least a day old. So `Retention 3/4` means three delayed recalls that held out of four attempts, a review that came back *wrong* is recorded as asked-but-not-correct rather than hidden, and a second pass through the same questions in one sitting cannot buy the dimension at all. Every surface then tells the truth about it: `/mind` and `/progress` show retention where it exists and *not yet measured* where it doesn't, deleting the model and replaying the ledger reproduces it exactly, and a review that held gets its own result reason in all 15 languages ("You recalled this without help after it had faded").

### 🔁 The session engine (`lib/session.ts`)

Turns "evidence was recorded" into "the plan changed, and here is why" — baseline capture, server-attributed activity, the before/after diff, the reason the recommendation moved, and a persisted summary (`lastSession`) that Home reads. Structural only: no translated text is ever written into a profile, so one language can never be frozen into a learner's record.

### 🧑‍🏫 The teacher plan (`lib/teacher-plan.ts`)

The distribution layer. From the class's **measured** data it derives a **deterministic weekly plan**: Monday explain → Tuesday diagnose → Wednesday practice → Thursday mixed-ability group activity (snake-draft grouping) → Friday mastery test. Focus concepts are the class's weakest, foundations-first; scaffolds name the prerequisite to repair. Runs on **no AI at all**. Its input is the live projection view (`cls.live`) that the class doors attach — the same derivation the roster table shows — so the on-screen plan and the printed pack can never disagree about the same students.

### 🖨️ The offline pack (`/api/pack-export`)

One download while connected → a **single printable file**: the week plan, a 5-day question bank (same seeds regenerate on paper and screen), each concept's lesson with misconception coaching notes, and an **answer key on its own printed page**. Rendered in the class's own language, RTL-aware. Plus a machine-readable JSON export. When the internet disappears, the school keeps operating. The pack (carrying its answer key) is member-gated like the roster: no capability secret, no pack.

### 🌐 Internationalisation (`lib/i18n.ts`)

**15 languages at full key parity**: English, Spanish, French, Portuguese, Arabic, Swahili, Hindi, Indonesian, Filipino, Urdu, Farsi, German, Japanese, Chinese, Bengali — with automatic **RTL** for Arabic, Urdu and Farsi, a 60+ country picker, and per-key fallback. *(Non-English dictionaries are machine-drafted and deserve native-speaker review before a real deployment — that review is one of the highest-value contributions possible.)*

### 👥 Study rooms & 🧑‍🏫 classes

- **Rooms**: student-created, forkable like open-source code, with a Socratic tutor in the corner.
- **Classes**: join-code based, per-concept **live mastery roster derived server-side from each member's evidence ledger** — the same `projectLearner` the learner's own pages read, never a number the client reported — plus **class-wide misconception aggregation** ("Left-to-right evaluation — 67% of the class, ×3 hits") so the teacher sees where to teach next. Students join by code from their account page; the teacher's table then updates itself as they answer. What the ledger has never measured reads *not yet measured* — never 0 — and the roster page says plainly that it shows measured work. A self-report channel survives for devices without profiles, stored as the claim it is, incapable of moving the teacher's view.

### 🔒 Privacy & low bandwidth

No emails, no phone numbers, no real names — a handle, an optional country, learning data that stays with the deployment. Self-host it and the data never leaves the school. Mobile-first CSS, plain text over the wire.

---

## Architecture

```
Next.js 15 (App Router, React 18, TypeScript strict, standalone output)
├── lib/
│   ├── app-state.ts       # the learner lifecycle + the route access contract
│   ├── genome.ts          # 135 concepts + prerequisite graph
│   ├── matcher.ts         # offline question→concept matcher (the wedge)
│   ├── misconceptions.ts  # 52-pattern catalogue with coaching
│   ├── questions.ts       # seeded generators + serveView sanitizer
│   ├── diagnostic.ts      # staircase ladder + path builder
│   ├── hints.ts           # 4-level Socratic hint ladder
│   ├── progress.ts        # EWMA mastery + misconception counters
│   ├── retention.ts       # 1/7/30-day review scheduling
│   ├── teacher-plan.ts    # deterministic weekly plan from class data
│   ├── socratic.ts        # offline tutor + worked examples
│   ├── llm.ts             # AI layer: tutor · explain · question · mark (BYO key)
│   ├── papers.ts          # board paper blueprints, assembly, marking
│   ├── server/auth.ts     # accounts, scrypt passwords, signed sessions
│   ├── i18n.ts            # 15 languages, RTL, fallbacks
│   ├── anon-practice.ts   # lazy anonymous practice session
│   └── server/store.ts    # atomic JSON store (per-file write locks)
├── app/api/               # profile · progress · diagnostic · path · question
│                          # tutor · rooms · classes · concepts · match
│                          # pack-export (offline pack)
└── app/                   # solve (wedge) · try/[concept] · landing · onboarding
                           # dashboard · learn/[subject]/[concept] · diagnostic
                           # rooms · teacher · genome · about
```

**Storage**: flat JSON files under `OPENMIND_DATA_DIR` (default `.openmind-data/`) — zero setup, inspectable, trivially backed up. Every mutation runs inside a per-file lock so concurrent requests can never interleave; stale diagnostic answers are rejected server-side by question id. Swap `lib/server/store.ts` for Postgres when you outgrow it.

---

## Verification

```bash
npm run verify         # ~1500 engine assertions: genome integrity, prereq cycles,
                       # generator quality, matcher behaviour, diagnostic ladder
                       # (fixed-anchor benchmarks, two-strike band rules,
                       # depth-honest caps, learner-model evidence fold),
                       # integrated mastery truth table, retention math,
                       # plan determinism & honesty, tutor guarantees,
                       # i18n parity across all 15 languages, and the
                       # curriculum layer (25 specifications across 20
                       # countries resolve to real genome concepts; tier bands,
                       # exclusions like "the SAT does not claim proof", and
                       # terminology that must occur in real content), and the
                       # closed learning loop (a recurring slip moves a plan to
                       # REMEDIATE; independent + transfer evidence moves it on;
                       # an empty session claims no adaptation; and no engine
                       # string carries a doubled percent, a doubled space or
                       # an unfilled placeholder),
                       # and the evidence ledger (replay determinism under
                       # shuffled events, every malformed event refused for its
                       # own reason, provenance that a sender cannot claim,
                       # idempotent re-sends, cross-learner writes refused,
                       # path-unsafe ids rejected, the projection reconciled
                       # against a real recordAnswer stream with zero
                       # divergences, and an impact snapshot that returns null
                       # rather than 0 where nothing was measured),
                       # and the AI layer (the tutor's input IS the decision the
                       # surfaces display — same action, reason, citations,
                       # basis and projection version — with the prompt read
                       # back off a stub provider to prove the model was told
                       # why; the four ways a model fails to answer, each
                       # elicited from a REAL endpoint and each answered by the
                       # offline engine; a disclosure that cannot be escalated
                       # to "AI" without a model; and a whole six-turn exchange,
                       # fallbacks included, leaving the ledger byte-identical
                       # and every mastery field untouched)

npm run verify:q       # question audit: 135 generators × 300 draws — four
                       # distinct options, no floating-point noise, and where the
                       # maths can be checked independently (surds, completing
                       # the square, sectors, linear word problems) the answer is
                       # re-derived from the prompt rather than trusted

npm run build          # production build (standalone output)

npm run e2e            # with dev server running: ~600 API lifecycle assertions,
                       # including the route contract's server half (a session
                       # survives on its cookie alone, and sign-out really
                       # revokes it), answer-leak assertions, server-side mode
                       # attribution (hints never buy independence; transfer
                       # must be a genuinely different surface, staged by the
                       # server), capability-token auth (id alone → 401),
                       # diagnostic→learner-model evidence seeding, and the
                       # session loop through the API (baseline never leaks,
                       # activity counted server-side, the plan changes, the
                       # summary is structural, and finishing twice is refused),
                       # every learner-scoped read door under one capability
                       # rule, and the tutor over HTTP (its grounding compared
                       # field for field with /api/next, and the offline reply
                       # labelled as the offline reply). Point the server at
                       # scripts/ai-stub.mjs and run with OPENMIND_E2E_AI=1 to
                       # exercise the provider-failure matrix too — see AGENTS.md

node scripts/race-probe.mjs   # 11 concurrency assertions: 8 parallel gradings
                              # → exactly one accepted, store intact
```

The engine suite drives the *real* engines: it proves the strong student climbs to ~0.94 mastery, the struggling student lands low with named misconceptions, paths isolate true gaps, the matcher resolves discriminating phrasing correctly, and the weekly plan is deterministic, data-driven, and never calls unreported students "stuck."

### Known limits, stated rather than hidden

- **Question-bank depth.** 119 of the 135 generators declare a *single* difficulty, so a curriculum tier can only move the depth of the 16 that have a real spread. Where a generator cannot reach a tier's depth the closest draw is served and the question's true difficulty rides along — the engine suite asserts that a uniform generator never fakes a harder draw, and the tier's real lever is the concept set its stage window selects.
- **Vocabulary, not translation of content.** The terminology layer rewrites words the genome actually uses (slope/gradient, PEMDAS/BIDMAS, scientific notation/standard form). It is deliberately small: the suite fails a mapping that never occurs in real content, or whose replacement would repeat the following word.
- **Unit conversions.** Question stems are metric. Imperial/US-customary variants (feet, pounds, °F) are not generated yet, so a US student's *units* remain UK-flavoured even when the *words* follow Common Core.
- **Specifications encode shape, not full syllabi.** Each specification declares subjects, a stage window, named-topic additions and exclusions. The complete topic list of a national syllabus is open data (like lessons) and belongs in a community patch.

---

## Contributing

The curriculum is **plain data**. Your first pull request can teach someone to read.

| Contribute | Where |
|---|---|
| A lesson or concept | `lib/genome.ts` — add a row: id, stage, title, blurb, lesson, prereqs |
| Questions | `lib/questions.ts` — add a generator to the maths/science banks |
| A misconception pattern | `lib/misconceptions.ts` — id, name, pattern, coaching, concepts |
| A translation review | `lib/i18n.ts` — every non-English dictionary needs native eyes |
| A science experiment | extend concept lessons with household-material activities |
| A deployment story | docs, Docker variants, low-cost hardware guides |

All pull requests welcome — including from students.

## Chapters

A chapter needs almost nothing: **5 students + 1 mentor + a phone.**

1. Create a class, share the join code.
2. Students pick their language — with an account (so their work follows them to any device) or without one, on the wedge.
3. Meet weekly around whatever device you have; print the offline pack before the internet drops. OpenMind tracks mastery between meetings.

The first target is not a ministry or an NGO. It is **one teacher** who says *"my students struggle with X and I don't have time to help them all."* Give them the system, watch what they actually use, change what they ignore — then ask them to introduce the next teacher. That's the network.

## License

MIT — see [`LICENSE`](./LICENSE). Fork it, translate it, run it on a school server, put your ministry's name on a deployment.
