# Curriculum coverage — country → education system → years → qualifications

OpenMind does not map "country → curriculum". It records **which education systems a
country runs**, and lets the learner say which one they follow. That distinction is the
whole of this document, and it exists because the simpler model was wrong in production:

> Of the 70 countries the enrolment picker offered, **18 had a national route**. The other
> 52 were answered with Cambridge IGCSE and the IB — the *international* qualifications —
> silently, as though they were the local ones. A learner in France or Germany who had
> never seen a British syllabus was enrolled in one, and told nothing.

The registry is `lib/curricula/registry.ts`; the routes are derived from it
(`lib/curriculum.ts`), the courses are derived from the pathway (`lib/specifications.ts`),
and `npm run curriculum-gate` is what keeps the two stories equal.

## The rule

**The country decides which pathways are available; the pathway decides which years,
qualifications and specifications the learner is offered.** Cambridge IGCSE and the IB stay
available to every learner — as a *choice*, never as the default answer.

A learner is never handed a curriculum their country is not recorded as running. That is the
one rule the gate enforces above all others, in both directions: a recorded national system
that resolves to no national course **fails**, and an unrecorded country that resolves to
somebody else's national course **fails**.

## The data model

```
Country  ─┬─ national pathway A ── years · qualifications · boards · sources · review
          ├─ national pathway B ── … (Cameroon: Anglophone GCE / Francophone BEPC-Bac)
          ├─ international pathway ── Cambridge IGCSE · IB      (offered everywhere)
          └─ independent pathway  ── skills bands, not classes  (offered everywhere)
```

A pathway carries the years **in the system's own name** ("Form 5", "3e", "Year 8"), the
examinations it leads to, the awarding bodies, the specifications those qualifications map
onto, and the sources the structure was read from.

### The review ladder — a label that cannot overclaim

| Label | Means | Presently |
|---|---|---|
| `unmapped` | no national pathway recorded | 51 countries |
| `mapped` | the record exists and is in production; **citations not on file** | 18 inherited routes + the international and independent pathways |
| `researched` | ≥1 authoritative source for the structure | Cameroon's two systems |
| `reviewed` | a subject specialist has read the mapping onto the genome | **none** |
| `verified` | reviewed, released, with a learner-facing coverage statement | **none** |

Two fields, because they are two different claims: `recordReview` is about the **structure**
(years, qualifications, boards), `mappingReview` is about the **mapping** of a syllabus onto
the 135 concepts. OpenMind mapping a qualification onto its genome is not the same claim as
a specialist having checked it, and the gate refuses to let a record imply otherwise.

**No equivalence between qualifications is asserted anywhere.** A Cameroon GCE grade is not
converted into a GCSE grade, no pathway claims two qualifications share a syllabus, and the
generic `tier` on a specification level is OpenMind's internal *depth band* (it chooses the
difficulty target and whether stage-0 arithmetic is in scope) — not an examination comparison.

## What the learner sees

- **Countries with one recorded system** (UK, US, IN, …): no question is asked. The years and
  qualifications follow from the country, exactly as before, and no field is invented.
- **Countries with two systems** (Cameroon): the course screen (`/curriculum`) asks **which system they follow**, and
  Save waits — the sign-up wizard does not ask, because a course is chosen where it can be
  explained and is never seeded for a learner at the end of an enrolment. Until it is answered, no year list or qualification list means anything: the
  two systems sit different exams, in different years, at different depths.
- **Countries with no mapped national route**: the step says so (`curr.unmapped`) and offers
  the international programmes and the skills pathway as explicit choices. Nothing is chosen
  for the learner; nothing is blocked either.
- **`/curriculum`** is where a course is changed, so it is where the international programmes
  live for everyone — including a UK learner at an international school who wants IGCSE.
- **`/api/profile`** refuses (`unknown_pathway`, `pathway_does_not_offer_<spec>`) rather than
  dropping a choice silently, and changing system **drops the course that belonged to the old
  one** — a GCE O Level is not a Francophone course, and an AQA GCSE is not an IGCSE.

## Adding a country — the pipeline

1. **Audit.** `npm run curriculum-gate` prints one row per offered country with its pathways,
   courses, sources and review state, and writes `audit/curriculum-coverage.json`. A country
   listed as *unmapped* is a queue item; a country in **neither** list is a bug and the gate
   fails on it.
2. **Establish the real structure** from authoritative sources. In order: the country's
   ministry of education (years, cycles, examination years, teaching languages); the
   examination authority (what is actually sat, and when); the UNESCO Institute for
   Statistics' ISCED mappings for how the system's levels sit against international ones —
   useful for *levels*, never a substitute for a syllabus; and Cambridge/IB's own materials
   only for their own programmes, never as evidence that a country's curriculum is theirs.
   If the sources do not settle it, **leave it unmapped**. A fabricated curriculum is worse
   than an honest gap.
3. **Record the pathway(s)** in `lib/curricula/registry.ts` with `sourceUrls` and
   `recordReview: "researched"`. Two systems in one country is the normal case this model
   expects, not an exception.
4. **Map the qualifications** in `lib/specifications.ts`: coverage windows per subject, tiers
   with their depth bands, and `include`/`exclude` where a syllabus genuinely names or omits a
   concept. Mark `mappingReview: "mapped"` — this is OpenMind's mapping until a specialist
   reviews it. Concepts the national curriculum contains and the genome does not are a
   **stated gap**, not a silent one.
5. **Add the journey test** to `scripts/e2e-api.mjs`: choose the pathway, declare a year of it,
   choose its qualification, and assert the *resulting course* — not merely that a POST
   answered 200. An assertion that a year of the other system is still reported as missing is
   the cheapest way to prove the scoping is real.
6. **Let the gate argue with you.** It fails on a year list with a hole, a specification no
   pathway leads to, a pathway claiming research without a source, two systems that overlap,
   a country in the registry the picker does not offer, and a country handed another's
   curriculum.

## Coverage, as measured (`npm run curriculum-gate`)

| | Count |
|---|---|
| Country codes offered in enrolment | **71** (70 countries + "prefer not to say") |
| With a recorded national route | **19** — US GB IE IN NG KE ZA GH TZ UG PK BD ID PH BR MX AU CA **CM** |
| Without one (offered the international programmes and the skills pathway) | **52** (51 countries + "prefer not to say") |
| National pathways | **20** (Cameroon runs two) |
| Specifications | **30** — 27 national, 2 international, 1 independent |
| Pathways with no structural source on file | **20** |
| Mappings reviewed by a subject specialist | **0** |

**Cameroon**, the reference case: 2 pathways · 7 years each (Form 1 → Upper Sixth; 6e →
Terminale) · 5 specifications (GCE O Level, GCE A Level; BEPC, Probatoire, Baccalauréat) ·
2 MINESEC sources · `researched` structure, `mapped` syllabus. Its **technical and
vocational** routes are *not* modelled, and the registry says so rather than implying them.

## The gate's checks (`npm run curriculum-gate`)

Every pathway well formed (unique id, non-empty years with a contiguous sequence and no hole
in any phase); every year of every pathway is a *declarable* year with a course that fits it;
every qualification leads to a specification that exists and belongs to that country; every
specification is reachable from some pathway; every `include`/`exclude` names a real genome
concept; sources required for `researched` and above; provenance required to be `https`;
`verified` requires a reviewed mapping; two systems in one country must not overlap and must
require the choice; no country is handed another's curriculum; **and no recorded country is
missing from the picker** (Ireland had a national route for months that no learner could
select — the count said 19 while the offer was 18).

It is wired into `npm run production-check` and CI (`gates.yml`), and it writes
`audit/curriculum-coverage.json` deterministically — no timestamps, so the committed report
only changes when the data does.

## The syllabus mapping layer (`lib/curricula/mappings.ts`)

"Mapped" used to be a label on the pathway with nothing under it. It now names a document:
`lib/curricula/mappings.ts` holds one entry per concept under a **heading quoted from the
published syllabus**, plus a sentence saying what the source asks for. Two courses are on file
— England's GCSE Mathematics (56 of its 130 concepts) and India's CBSE Class X (21 of 131) —
and the gate checks that every entry is a concept the genome holds, in that course's real
coverage, in the mapping's own subject, mapped once, under a heading and a statement, with an
`https` source whose URL is also recorded on the pathway; and it refuses a pathway that claims
`reviewed`/`verified` while no reviewer has signed its mapping, or a signed mapping left
declared below `reviewed`. See [`CURRICULUM_MAPPING.md`](CURRICULUM_MAPPING.md).

The honest position, stated in the same place a ministry will look: **zero mappings have been
reviewed by a qualified person**, so no mapping is `verified` and the app does not claim it is.

## Known limits

- The syllabus mappings are OpenMind's own reading of a published document. Two of thirty
  specifications have one, and neither has been reviewed by a subject specialist — the code
  keeps that distinction rather than blurring it (`mappingsWithReviewer: 0`).
- Twenty pathways have no structural citation on file. They are the routes that predate the
  registry; the report names them every run rather than hiding the gap.
- A qualification's learner-facing **name** is owned by the specification
  (`lib/specifications.ts`), not by the pathway, so an inherited pathway lists specification
  ids. A `researched` pathway must name its own examinations; the gate enforces exactly that.
- `boardName` resolves a board id to its **first** binding, and board ids are not globally
  unique: Ireland's `state` board therefore displays India's label in a corner of the UI. A
  per-pathway board lookup fixes it; it is a display defect, not a curriculum one.
- Coverage counts are *offered* coverage. They do not say a course is good, and they do not
  say anyone has learned anything — that is a pilot, not a data model.
