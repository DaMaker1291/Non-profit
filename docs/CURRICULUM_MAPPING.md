# Curriculum mapping — how a course's concepts are tied to a published syllabus

**Status: two courses mapped, none reviewed by a subject specialist.** That
sentence is the whole point of this document. OpenMind teaches 135 concepts
across five subjects and offers courses for 71 countries; before this file
existed there was no written record anywhere of *which published document* any
course's concepts were placed against. The registry said as much
(`mappingReview: "mapped"` on every pathway, `reviewed: 0` in
[audit/status.json](../audit/status.json)) — an honest label with nothing
underneath it, and therefore nothing a ministry could audit.

The mapping file ([lib/curricula/mappings.ts](../lib/curricula/mappings.ts))
is the evidence under that label. This document explains how it works, what is
currently in it, and what a specialist has to do to raise a course's status.

## What a mapping is

A mapping is one course's concepts, each placed under a **verbatim heading from
the published document**, with one line saying what the source asks for.

```ts
{
  conceptId: "quadratics",
  ref: "Algebra",
  statement: "Solving quadratic equations by factorising, completing the square and the formula.",
}
```

Nothing here is generated, inferred, or derived from the genome. Every entry was
written by placing a concept against a document a reader can open.

A mapping also carries the source itself — title, publisher, publication date and
URL — and two fields that decide whether it counts as reviewed:

| Field | Meaning |
|---|---|
| `source.verification: "document"` | The headings were read from the official file and quoted verbatim. |
| `source.verification: "portal"` | The file's URL and structure are confirmed but its text could not be read here, so a reviewer **must** check each heading against the PDF. |
| `reviewer` / `reviewedAt` | A named specialist and a date. Both or neither — the gate refuses one without the other. |
| `mappingReview` (registry) | Unchanged by writing a mapping. Only a completed review may raise it. |

## What is mapped today

| Course | Pathway | Source | Verification | Concepts mapped | Reviewer |
|---|---|---|---|---|---|
| `uk-gcse` (England) | `gb-national` | DfE, *GCSE mathematics: subject content and assessment objectives*, 1 November 2013 | **document** — six subject-area headings quoted verbatim | 56 of 130 in the course | none |
| `in-cbse` (India, CBSE Class X) | `in-national` | CBSE Academic Unit, *Mathematics (041 & 241), Classes IX–X*, 2025–26 | **portal** — headings recorded, PDF not machine-read | 21 of 131 in the course | none |

Three things worth being explicit about, because each is a claim a reader might
otherwise assume:

1. **The England mapping does not cite `N1`/`A1`/`R1` codes.** Those references
   exist in awarding-body specifications (AQA and others), not in the DfE
   publication. Attributing them to the DfE would be a fabricated citation, so
   the mapping uses the six headings the DfE actually publishes and says so in
   `source.note`.
2. **Both mappings are partial.** 56 of 130 and 21 of 131 concepts is not full
   coverage, and the gate records both numbers in
   [audit/curriculum-coverage.json](../audit/curriculum-coverage.json) so the
   fraction is visible rather than implied. A partial mapping that is checkable
   is worth more than a complete one nobody has read.
3. **Neither mapping is reviewed.** `mappingsWithReviewer: 0`. The status
   sentence a learner sees on `/curriculum` still reads "not yet reviewed by a
   subject specialist", and that is correct.

## What the gate enforces

`npm run curriculum-gate` (CI step "Curriculum integrity") fails on any of:

- a concept id the genome does not hold;
- a concept **not in that course's coverage** — mapping a concept a course does
  not teach is the quiet version of claiming coverage it does not have;
- a concept whose subject differs from the mapping's stated subject;
- the same concept mapped twice;
- an entry with no published heading, or a statement too short to be one;
- a source that is not `https://`, is missing its title/publisher/date, or whose
  verification level is not `document`/`portal`;
- **a mapping whose source is not recorded on the pathway it belongs to** — the
  citation has to be reachable from the course record, not only from a file;
- a signed mapping whose pathway still reads below `reviewed`, or a pathway
  claiming `reviewed`/`verified` when no reviewer signed its mapping.

The gate writes a deterministic report (`audit/curriculum-coverage.json`) with
one row per mapping, so a reviewer can diff the mapping's state between commits.

## How a course gets mapped

1. **Obtain the document** from the publisher's own site. Record its title,
   publisher, publication date and URL — the date on the document, not the year
   its cohort started (the England GCSE content was published in 2013 and taught
   from 2015).
2. **Decide the heading granularity you can defend.** The coarsest unit the
   document itself uses is always defensible; a finer unit the document does not
   use is a citation you cannot support. If the finer references live in an
   awarding body's specification, cite that document separately rather than
   attributing it to the publisher.
3. **Write one entry per concept**, with the heading verbatim and one sentence
   describing what the source asks for. Keep the sentence short enough that a
   reviewer can disagree with a single line.
4. **Run `npm run curriculum-gate`.** It will tell you about a concept the course
   does not cover, a duplicate, a missing field, or a source not recorded on the
   pathway.
5. **Do not touch `reviewer`.** Writing a mapping is OpenMind's work; reviewing it
   is not.

## How a course gets reviewed

A subject specialist works through the entries against the document and either
accepts each line or corrects it. When they are done:

1. Set `reviewer` (their name, as they wish to be credited) and `reviewedAt`
   (ISO date) on the mapping.
2. Set the pathway's `mappingReview` to `"reviewed"` in
   [lib/curricula/registry.ts](../lib/curricula/registry.ts).
3. Run `npm run curriculum-gate` and `npm run verify`. The gate will fail if the
   two disagree; the registry's own rule will fail if any pathway claims a review
   that no mapping records.
4. The learner-facing sentence on `/curriculum` changes from "not yet reviewed"
   to "reviewed by a subject specialist" — that string already exists in all 15
   languages, so the change is data, not copy.

`"verified"` (the strongest status) additionally requires the pathway to have
been released with a learner-facing statement of what is covered; nothing in this
repository is there yet.

## What this does not establish

- **It is not an endorsement by any ministry, board or awarding body**, and no
  such body has seen these files.
- **It does not establish depth or tiering.** The England mapping is Foundation
  and Higher together; the DfE document marks Higher-only content in its text and
  a concept-level mapping cannot represent that without splitting every entry. A
  reviewer should add per-entry tier notes before this is used for tier placement.
- **It does not cover 28 of the 30 specifications.** Those courses still render
  with "not yet reviewed", and 52 of the 71 offered countries still have no
  national route at all ([audit/curriculum-coverage.json](../audit/curriculum-coverage.json)).
- **It is not a claim that the questions match the syllabus.** A concept mapped
  to "Algebra" says the course teaches that concept; whether the items served for
  it are appropriate to that course's tier is the content-review question tracked
  in [audit/pilot-pack.json](../audit/pilot-pack.json), and 110 pilot items are
  still awaiting a human reviewer.

## Next

Kenya is the obvious third mapping — it is a lead deployment market, and its KCSE
route currently has no source on file. Research for it found a **grade mismatch
that has to be fixed in the registry before any mapping can be honest**, and this
is recorded here rather than worked around:

- The KICD **Grade 9 (Junior Secondary) Mathematics** design is published (first
  published 2024; ISBN 978-9914-43-431-6) and its five strands are
  **Numbers**, **Algebra**, **Measurements**, **Geometry**, and **Data Handling
  and Probability** — with sub-strands such as *Cubes and Cube Roots*, *Indices
  and Logarithms*, *Matrices*, *Similarity and Enlargement*, and *Approximations
  and Errors*.
- The registry's Kenyan pathway is **`ke-kcse`, Form 1–4** — upper secondary.
  Mapping a Grade 9 junior-secondary document onto a KCSE course would be exactly
  the fabrication this layer exists to prevent: the gate would check that each
  concept is inside the KCSE course's coverage, which says nothing about whether
  the *document* is the right document.
- The Grade 9 headings above were read from a secondary-hosted copy of the KICD
  design, not a KICD-hosted file; the KICD catalogue pages for Grade 7, 8 and 9
  exist and are the citation to use once a reviewer opens them. Grade 7 and
  Grade 8 strand names were **not** verified and are not recorded anywhere.

So the next step is a **junior-secondary Kenyan pathway** (JSS Grade 7–9) with
its own specification, a KICD citation on every pathway it touches, and a
reviewer — and *then* the mapping. Until that exists, the honest state is what the
registry already prints, and the honest answer to "is Kenya supported?" is
today's: no national route with a source on file, and no mapping.

The conditions a pilot in that country would face — connectivity, devices,
power, data cost — are collected with their verification status in
[`EVIDENCE_BASE.md`](EVIDENCE_BASE.md).
