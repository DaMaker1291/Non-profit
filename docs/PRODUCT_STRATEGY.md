# OpenMind product strategy — 26 November 2026

This is a product position, not a release note. It answers four questions:

1. What do the leading free education platforms actually do well?
2. What does OpenMind actually have, and what does it merely appear to have?
3. Which five barriers matter most?
4. What is the first complete learning experience worth making excellent?

The measure is not the number of concepts, routes, languages, questions or
passing assertions. The measure is whether a learner understands something they
could not understand before, remembers it, and can use it in an unfamiliar
problem — and whether a teacher with a shared phone and an intermittent
connection can make that happen.

---

## 1. Competitive position

### 1.1 What the evidence supports

**UNICEF Learning Passport** is the strongest comparator on reach and system
integration: 51 countries, 12.5 million learners and educators, 7.5 million course
completions to date in its 2025 annual report. Its offline model is a hub device
that serves a local network and syncs at connectivity points; its curriculum is
localised through national systems rather than a single universal curriculum. It
also has causal evidence: the UNICEF Innocenti Mexico RCT found a 9% mathematics
gain (intention-to-treat Cohen's d = 0.26, p = 0.012) across 45 schools and nearly
3,000 students, with stronger results for consistent use and teacher engagement.
That study is context-specific; it does not establish that the platform works
equally well everywhere.

**Kolibri** is the strongest comparator on offline-first classroom operation. Its
own documentation describes a classroom server, learner devices on the local
network, device auto-discovery and automated sync, coach-assigned lessons and
quizzes, and progress reports down to individual answers. Its content library is
available in more than 173 languages. Its public documentation is clear about
offline operation and syncing; it does not make a comparable public causal claim
about learning impact.

**Khan Academy** is the strongest comparator on mastery-oriented practice and
teacher reporting. Its mastery system reports course, unit and skill levels; its
teacher reports include activity, skills and assignment data, and its newer
classroom experience surfaces what to do next. The independent evidence is mixed:
a J-PAL randomised evaluation of Khan Academy in Brazil found improved attitudes
but no average test-score effect, with implementation quality changing the result.
That is a useful warning against treating engagement or mastery progress as proof
of learning.

**Open edX** is the strongest comparator on course authoring, reusable learning
sequences, assessment variety and extensibility. Its analytics stack is an
optional deployment, not a default; offline mobile content is a documented
mobile-app capability rather than a whole-school local-network model. It is
infrastructure an institution operates, not a free turnkey school system.

### 1.2 Capability matrix

Statuses describe the evidence found, not a marketing claim. `Unknown` means no
adequate public evidence was found; it does not mean the capability is absent.

| Capability | Learning Passport | Kolibri | Khan Academy | Open edX | OpenMind |
|---|---|---|---|---|---|
| Curriculum alignment | **Verified strong** — national curricula, localisation through government systems | **Partially supported** — large content library; national curriculum mapping varies by channel | **Partially supported** — strong US course coverage; national alignment varies | **Partially supported** — institutions author and align their own courses | **Partially supported** — 91 course labels, 70 recorded national routes; 0 reviewed mappings; 16/97 AQA references inventoried |
| Full lesson teaching | **Partially supported** — courses and local content; pedagogical depth varies by deployment | **Partially supported** — resource library; not a single authored teaching sequence per objective | **Verified strong** — explanations, videos, worked practice and mastery progression | **Verified strong** — authored course sequences, but quality depends on the author | **Partially supported** — 136 authored lesson contracts, 16 hand-authored pilot sequences; 0 educator-reviewed |
| Diagnostic remediation | **Unknown / partially supported** — assessment and progress tracking; concept-level diagnosis not established from public evidence | **Partially supported** — quizzes, feedback and reports; not a named misconception diagnosis | **Partially supported** — mastery levels and recommendations; not a misconception-level causal diagnosis | **Partially supported** — assessment and analytics; diagnosis is course-author dependent | **Structurally strong, unvalidated** — append-only evidence, concept-level projection, named beliefs, repair cards; one pathway browser-verified |
| Interactive STEM | **Partially supported** — local content and interactive resources | **Partially supported** — interactive exercises and simulations in the library | **Verified strong** — exercises, hints and a very large STEM library | **Partially supported** — XBlocks and external tools | **Partially supported** — 8 declared model types; 5 AQA concepts browser-verified; not measured on low-end devices |
| Teacher lesson preparation | **Partially supported** — teacher training, blended-learning guidance, national support | **Verified strong** — coach dashboard, lessons, quizzes, groups | **Verified strong** — assignments, reports, mastery goals | **Verified strong** — course authoring and staff tools | **Partially supported** — weekly plan, roster, presentation mode, worksheet and key; no classroom trial; differentiation 0/136 |
| Offline learning | **Verified strong** — hub/LAN model and sneakernet sync | **Verified strong** — classroom server, LAN clients, automated device sync | **Partially supported** — downloads and offline access in places; not a full local-school system | **Partially supported** — mobile offline content and result sync | **Partially supported** — printable pack, offline study and local queue; no local hub or conflict-tested multi-device sync |
| Localised content | **Verified strong** — national-language content and local curriculum delivery | **Verified strong** — 173+ languages in the content library | **Partially supported** — substantial translated content, uneven by course | **Partially supported** — platform translation and institution-authored content | **Partially supported** — 15 interface languages; 0 linguist-reviewed; lesson translation is partial |
| Question quality | **Unknown** — not independently inspected | **Partially supported** — library questions and quizzes; item quality varies | **Verified strong** — large, practised item banks; not every item is misconception-attributed | **Partially supported** — many question types; quality is author-dependent | **Partially supported** — 136 generators, 5 concepts independently re-derived; 62/136 above the option-length line; 0 educator-reviewed |
| Learning evidence | **Verified strong for one context** — Mexico RCT, d = 0.26 | **Partially supported / unknown** — usage and assessment data; no comparable causal study found | **Mixed** — Brazil RCT found no average test-score effect; other implementations differ | **Unknown** — analytics are deployment-dependent | **None yet** — 0 learner-tested; 0 impact measured; the platform explicitly refuses a causal claim |
| Accessibility | **Partially supported** — platform accessibility not independently tested here | **Partially supported** — browser/device support documented; audit not found | **Partially supported** — accessibility programme exists; not independently tested here | **Partially supported** — accessibility work exists; deployment-dependent | **Partially supported** — structural checks and responsive CSS; no independent accessibility audit |
| Low-resource performance | **Verified strong for offline hubs** — designed for low/no connectivity | **Verified strong for local-server classrooms** — older devices and LAN documented | **Partially supported** — internet-first | **Partially supported** — self-hosted but operationally heavy | **Unknown** — not measured on older Android, low memory or slow networks |

### 1.3 The differentiation that is actually defensible

OpenMind cannot win on institutional reach, government partnerships, content
volume or brand. Those are not code problems, and pretending otherwise would be
dishonest. The defensible advantage is narrower:

> **A concept-level teaching and evidence loop that connects an explanation, a
> representation, a worked example, a misconception-specific repair, an
> independent assessment and a teacher's next decision — and still works when the
> connection disappears.**

The pieces exist in the code. The advantage is not yet demonstrated, because no
educator has reviewed the loop and no learner has used it. That is the central
gap this strategy addresses.

---

## 2. Brutally honest audit of the actual application

### 2.1 What works

- **Server-side grading and evidence integrity.** Questions are served without
  keys; the server marks them; accepted answers are recorded through an
  append-only ledger; projection can be replayed; the same ledger produces the
  same model and decision. This is stronger than a dashboard that stores a
  percentage.
- **Concept-level diagnosis, where the item can discriminate.** Six foundational
  beliefs have per-option attribution and authored repairs. An untagged wrong
  answer records no cause rather than inventing one.
- **A real lesson sequence.** The fraction pathway has an objective, prior
  knowledge, an intuition, a visual model, worked examples, a faded example,
  traps, guided practice, independent assessment, transfer and retrieval.
- **Assessment marking with method and accuracy marks.** The baker item was
  corrected to `5/12 kg`; the new multiplication item marks conversion and
  product independently; both are regression-tested.
- **Teacher surfaces exist.** Class roster, weekly plan, misconception
  aggregation, assignments, printable worksheet, answer key and presentation
  mode are real routes, not mock-ups.
- **Offline artefacts exist.** A printable weekly pack, printable lessons, an
  offline study route and a local answer queue are present.

### 2.2 What partially works

- **Curriculum coverage.** 91 course labels and 70 recorded national routes look
  broad, but only 2 concept mappings are on file, 0 are reviewed, and the AQA
  audit covers 16 of 97 references. Breadth of labels is not curriculum coverage.
- **Lesson quality.** 136 lessons satisfy the contract and contain about 200,000
  teaching words. Only 15 are hand-authored pilot sequences; the rest are
  supplemental plans generated around the genome prose. Structural completeness
  is not the same as teaching quality.
- **Question quality.** 136 concepts generate questions, but only 5 have been
  independently re-derived from the prompt, 62 of 136 still show an
  option-length tell above the committed line on the latest `gate:options`
  run, and 0 items have educator review.
- **Teacher workflow.** The weekly plan and roster are useful, but differentiation
  is 0 of 136, and no teacher has used the system with a class. A dashboard that
  has never been used in a classroom is a hypothesis.
- **Offline.** The printable pack is real. The local-school server, multi-device
  sync, conflict handling, device-change recovery and measured old-Android
  performance are not demonstrated.
- **Internationalisation.** Fifteen interface dictionaries have key parity. That
  is interface translation, not lesson translation, terminology review,
  assessment translation or cultural adaptation.

### 2.3 What does not work or is missing

- **AQA N4 is now taught and assessed.** `N4-factors` and `N4-prime-factor` are
  one concept (`factors-primes`) with an authored lesson, base and deep
  generators, a typed numeric item, seven assessment items (11 marks), a mark
  scheme and a repair for the factor/multiple direction belief. The lesson and
  assessment are browser-verified; they are not educator-reviewed or
  learner-tested.
- **Five objectives have complete assessment coverage.** `N2-fractions` has
  four items (9 marks), the two N4 objectives share seven items (11 marks),
  `N10-recurring` has five items (14 marks), and `N2-negatives` has three items
  (8 marks). The other 30 objectives have no complete AQA-style assessment. 0 of
  35 objectives are educator-reviewed and 0 are learner-tested.
- **Eight demand gaps.** Addition, subtraction, multiplication, division, place
  value, order of operations, negatives and rounding cap below the Higher target
  of 0.65, so a Higher learner can be served below their tier.
- **No local-school server or conflict-tested sync.** Offline is a printable pack
  plus a queue, not a classroom hub with a defined merge protocol.
- **No post-deploy browser assessment.** CI is strong on typecheck, engines,
  content and build. It does not yet walk the deployed site through a lesson at
  mobile, tablet and desktop and compare the rendered commit.
- **No low-end device measurement.** No real load-time, memory or storage data on
  an older Android device.
- **No learning-impact evidence.** 0 learner trials; 0 controlled comparisons.

### 2.4 What is misleading if read quickly

The README reports 136 concepts and 15 languages. Both are true. Neither means
136 reviewed courses or 15 fully localised educational languages. The quality
register and the pilot audit say this plainly, but the size metrics are easy to
quote without the qualification. Product communication should lead with the one
complete pathway and its review status, not the catalogue count.

### 2.5 What needs external validation

- Subject-teacher review of every authored lesson, item, mark scheme and repair.
- Native-speaker and subject-specialist review of translated terminology,
  assessment language and teacher resources.
- Supervised learner trials with appropriate consent and safeguarding.
- A low-end Android performance study on the actual target hardware.
- A school-based offline/classroom trial with a local hub and more than one
  device.
- A controlled evaluation before any learning-impact claim.

---

## 3. The five most serious barriers

### Barrier 1 — The evidence stops at structural verification

The repository can prove that 136 lessons have the required fields, that servers
grade answers and that ledgers replay. It cannot prove that a child understood
anything. There are 0 educator reviews, 0 learner trials and 0 measured learning
gains. Every additional feature increases the distance between the size of the
claim and the strength of the evidence.

**Why it matters:** a platform for under-resourced learners cannot ask schools to
trust an unvalidated claim. The first duty is to make one pathway genuinely
reviewable and testable.

### Barrier 2 — Curriculum and assessment coverage is thin where it matters

The AQA Number audit inventories 35 objectives: 35 mapped, 18 with a complete
teaching sequence, 17 partial, 0 missing, 5 assessment-complete and 0 reviewed.
N2-fractions, N2-negatives, both N4 objectives and N10-recurring are now taught
and assessed. Eight foundational concepts cannot reach the Higher demand target.
A learner can therefore meet a course label that promises more than the content
delivers.

**Why it matters:** curriculum coverage is the promise a school checks first. One
honest, complete Number pathway is worth more than 91 labels that cannot be
traced to a reviewed objective.

### Barrier 3 — Teaching quality has not been inspected by teachers

The lesson library is large, but 0 lessons are subject-teacher reviewed. The
fraction sequence is strong on paper; that is not the same as a teacher saying it
is clear, accurate, well sequenced and usable with a mixed class. Representations
are uneven: 5 AQA concepts have a browser-verified model; most do not.

**Why it matters:** a lesson that is structurally complete but pedagogically
unclear teaches nothing. The next quality step is human inspection, not more
generated prose.

### Barrier 4 — The teacher system is not yet a classroom system

The weekly plan, roster, presentation mode and worksheets exist. Differentiation
is 0 of 136, and no teacher has used the workflow with a real class. The product
does not yet answer, from evidence, "which eight pupils need prerequisite support
tomorrow, which need extension, and what exactly should I do with each group?"

**Why it matters:** in the schools this is for, the teacher is the multiplier. A
learner-only website leaves most of the available improvement unused.

### Barrier 5 — Offline and low-resource operation is not yet architectural

The printable pack is useful, but a school with one local computer, several
learner devices and no internet cannot yet run the full learning loop. There is
no local hub, no defined conflict-resolution protocol, no device-change recovery
test and no measured performance on the hardware the target learner actually
owns. The live deployment is also behind the local work, and post-deploy checks
do not inspect the rendered lesson in a browser.

**Why it matters:** a beautiful online lesson that cannot load on a shared 2018
Android phone, or cannot survive a power cut and reconnect, is not usable in the
place it is most needed.

---

## 4. Product architecture

The architecture is six layers, joined by one evidence model. A feature that does
not connect to the layer above and below it is a detour.

```
Curriculum truth
  official reference → objective → concept → prerequisite → review status
        │
Teaching
  objective → intuition → representation → explanation → worked → fade
  → misconceptions → guided practice → independent practice → transfer → retrieval
        │
Assessment
  item → requirement → marks → mark scheme → attempt → evidence
        │
Learner model
  append-only evidence → projection → diagnosis → next action → retention
        │
Teacher system
  class → roster → misconception aggregation → differentiation → intervention
  → assignment → pack → next lesson
        │
Offline and delivery
  local content pack → offline assessment → queue → sync → conflict resolution
  → recovery → printable fallback
```

**Canonical objects.** `Objective`, `Concept`, `Lesson`, `Item`, `Attempt`,
`EvidenceEvent`, `Projection`, `Decision`, `Intervention`, `Pack`. Every object
has an owner, a status and a review level. A lesson cannot claim an objective
without a mapping; an item cannot claim a mark without a mark scheme; a decision
cannot cite evidence that is not in the learner's ledger.

**Evidence levels, kept separate:**

1. Technically implemented.
2. Structurally verified.
3. Browser-verified.
4. Educationally inspected.
5. Educator-reviewed.
6. Learner-tested.
7. Learning impact measured.

The current fraction pathway is at 3. It must not be described as 4–7.

**Offline protocol, when built:**

- Every learner action is an immutable event with a device-generated id.
- The local store is the source of truth until sync; the server projection is
  authoritative after sync.
- Ingestion is idempotent by event id; replay is order-independent.
- Profile metadata uses explicit last-writer-wins with a visible conflict record;
  evidence never uses last-writer-wins because two genuine attempts are both real.
- A device that loses power can resume from its last confirmed event.
- A learner changing device carries a signed local export, not a copied secret.
- The teacher's roster reads the server projection, never a client-reported number.

**Teacher system.** The teacher's next action is derived from the same evidence
the learner sees: prerequisite gap, misconception frequency, independent accuracy,
retention. Differentiation is a generated three-group plan with named pupils and
a concrete task for each group, never a generic "support/challenge" label.

---

## 5. Prioritised roadmap

### Phase 0 — Truth and one pathway (current)

- Keep the audit gates that separate mapped, taught, assessed, reviewed and
  tested.
- Complete the fractions pathway: diagnosis → lesson → practice → misconception
  repair → assessment → retention → teacher evidence.
- **Done this cycle:** `N10-recurring` now teaches recurring notation, the
  denominator test, both conversion directions and 0.999... = 1; `N2-negatives`
  now teaches negative fractions, ordering, all four operations and an eight-mark
  assessment; both are browser-verified. `N2-fractions` remains complete with four
  items (9 marks). A composed **Number checkpoint** now puts the five completed
  objectives into one 14-question, 30-mark sitting. Its items are written for
  the checkpoint and appear in no lesson, so a model answer cannot be looked up
  before the sitting; a checkpoint-only server action marks them, records
  `assessment` evidence under a `checkpoint:` id, and leaves the lesson's own
  `lessonCheck` counters untouched. It reports an objective-level breakdown; a
  full-credit sitting on the new bank returned 30/30 across all 14 items, and a
  browser sitting with 13 blanks returned 1/30, with no `lessonCheck` counter
  created on any of the four concepts.
- **Not done:** educator review, learner trial, local hub, a full specification
  paper, grade calibration.

**Exit gate:** one objective with all requirements covered, browser-verified, and
a named reviewer willing to inspect it. Assessment-complete is not exam-ready.

### Phase 1 — Complete AQA Number

- **N4 is complete:** `N4-factors` and `N4-prime-factor` share one concept,
  lesson, generators, seven assessment items, mark schemes and an objective
  mapping. The next work is review and human evidence, not more N4 prose.
- Close the eight demand gaps or remove those concepts from Higher routes.
- Add assessment items for every remaining Number requirement.
- The composed Number checkpoint exists (`/assessment/number`). It uses 14
  checkpoint-only items, not the lesson assessment items, records them as
  assessment evidence rather than lesson-check attempts, and reports by
  objective; it is not yet a full paper and its 40-minute timer is a guide, not
  an enforced examination. Extend it only as further objectives reach
  assessment-complete.
- Put every item in front of a subject teacher; record the reviewer by name and
  date.

**Exit gate:** 16/16 Number references inventoried, every objective taught,
assessed and reviewed; no claim of exam readiness until a learner trial exists.

### Phase 2 — Low-resource classroom

- Build a local hub mode: one computer serves lessons and assessments over a LAN.
- Implement the offline event protocol and conflict tests.
- Test on a real older Android device and a shared device with multiple learners.
- Test power loss, interrupted sync, device change and recovery.
- Measure load time, JavaScript weight, storage and memory.

**Exit gate:** a class can complete a lesson and an assessment with no internet,
the teacher can see the evidence, and the data survives a restart and a sync.

### Phase 3 — Teacher workflow

- Generate differentiation groups from evidence, not labels.
- Add a lesson-preparation pack for every objective: prior knowledge, examples,
  diagrams, misconceptions, questions, timing and support/challenge tasks.
- Add classroom presentation and a low-ink worksheet.
- Run a teacher usability trial and record what they actually used.

**Exit gate:** a teacher can plan, teach, assess and intervene for one objective
without assembling materials by hand.

### Phase 4 — Additional subjects and curricula

- Add subjects only when the objective mapping, teaching, assessment and review
  can be maintained at the same standard.
- Prioritise national curricula with an authoritative source on file.
- Do not add country labels without a traceable mapping.

**Exit gate:** one complete pathway per subject, reviewed; no shallow catalogue
expansion.

### Phase 5 — External validation

- Recruit subject teachers and native speakers.
- Run supervised learner trials with consent and safeguarding.
- Pre-register a controlled evaluation with baseline, delayed post-test and
  retention.
- Publish limitations, not just gains.

**Exit gate:** evidence at levels 4–7, with the sample, context and limitations
stated.

### Phase 6 — Scale

- Improve authoring tools and review workflows only after the reference pathway
  is stable.
- Add content and languages behind quality gates, not in front of them.
- Keep the free, self-hostable core.

---

## 6. The first end-to-end experience to make exceptional

**Pathway:** AQA GCSE Mathematics 8300 Number — fractions, from `fractions` to
`fraction-ops`.

**Learner.** A 15-year-old on a shared Android phone, with intermittent internet
and no private tutor.

1. **Diagnostic.** A short sitting samples ordering, equivalence, addition,
   subtraction, multiplication and division. It reports what was demonstrated
   and what was not; one question never establishes mastery.
2. **Teach.** The lesson opens with a clear objective and prior knowledge, then
   an intuition (two identical chocolate bars cut into quarters and eighths), a
   pie and number-line representation, a written explanation, worked examples, a
   faded example the learner completes, and the traps that produce the common
   wrong answers.
3. **Practise.** Generated practice records the answer server-side. A wrong
   answer that carries a named belief gets that belief's repair; an untagged
   wrong answer gets no invented cause.
4. **Assess.** The learner answers the lesson's own items without the key:
   addition, subtraction, multiplication (conversion and product marked
   independently), division and the contextual remainder. The server returns the
   mark, the method marks and the explanation.
5. **Reassess.** A delayed retrieval item checks the same idea in a new context,
   not the same question again.
6. **Teacher.** The class roster shows the concept, the misconception pattern,
   the independent accuracy and the next intervention. The weekly plan and the
   printable pack are generated from the same evidence.
7. **Offline.** The same lesson, worksheet and answer key can be printed; the
   learner's queued answers sync when a connection returns. The local-hub version
   is Phase 2, not a current claim.

**What is exceptional today:** the teaching sequence and the server-graded
assessment loop. **What is not yet exceptional:** N4 is taught and assessed but
unreviewed, the assessment is not a full paper, no educator has reviewed it, no
learner has used it, and the local-hub/offline classroom mode is not built.

**Evidence status after this cycle:**

- Technically implemented: yes.
- Structurally verified: yes (`assessment:content`, 1,991 checks).
- Browser-verified: yes for `a5` on the isolated scratch store; 2/2, recorded.
- Educationally inspected: no.
- Educator-reviewed: no.
- Learner-tested: no.
- Learning impact measured: no.

The next action is not another page. It is educator review of N4 and the
fraction pathway, then a learner try-out.

---

## Sources

- UNICEF Learning Passport, 2025 Annual Report:
  <https://www.unicef.org/learningpassport/reports/2025-annual-report>
- UNICEF Learning Passport, Offline Learning:
  <https://www.unicef.org/learningpassport/offline-learning>
- UNICEF Learning Passport, FAQs (local curriculum and language):
  <https://www.unicef.org/learningpassport/faqs>
- UNICEF Innocenti, *The Impact of Digital Learning in Mexico* (2026):
  <https://www.unicef.org/innocenti/reports/impact-digital-learning-mexico>
- Kolibri User Guide:
  <https://kolibri.readthedocs.io/en/latest/>
- Kolibri, Accessing the server from client devices:
  <https://kolibri.readthedocs.io/en/latest/access/access_lan.html>
- Learning Equality, About Kolibri:
  <https://learningequality.org/kolibri/about-kolibri>
- Khan Academy, Course and Unit Mastery:
  <https://support.khanacademy.org/hc/en-us/articles/115002552631-What-are-Course-and-Unit-Mastery>
- Khan Academy, teacher reports:
  <https://support.khanacademy.org/hc/en-us/articles/360031052391-How-do-I-use-Reports-to-view-Activity-Skills-and-Assignment-score-reports>
- J-PAL, Khan Academy Brazil evaluation:
  <https://www.povertyactionlab.org/evaluation/impact-online-math-learning-platform-test-scores-and-attitudes-towards-math-brazil>
- Open edX, platform features:
  <https://openedx.org/the-platform/features/>
- Open edX, analytics options:
  <https://docs.openedx.org/en/latest/site_ops/install_configure_run_guide/analytics/index.html>
- Open edX, offline mobile content:
  <https://docs.openedx.org/projects/edx-platform/en/latest/references/docs/openedx/features/offline_content/docs/001-mobile-offline-content-support.html>
