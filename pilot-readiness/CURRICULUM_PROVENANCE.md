# Curriculum provenance

## Mathematics
The 8 mathematics concepts reuse `IN_CBSE_MATHS` in `lib/curricula/mappings.ts`: official CBSE Class X Mathematics syllabus (041/241), 2025–26 session, `verification: "portal"`, reviewer `null`. The existing entries are:
- fractions, decimals, negatives, order-ops — Number Systems
- algebra-expand — Algebra
- linear-equations, quadratics — Algebra
- coordinates — Coordinate Geometry

## Science
`lib/pilot-mappings.ts` adds four entries against the CBSE Class X Science syllabus (086), 2025–26:
- cells — The Fundamental Unit of Life (Class 9 prerequisite)
- photosynthesis — Life Processes: Nutrition
- equations-stoich — Chemical Reactions and Equations
- electricity-circuits — Electricity

Source: https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Science_Sec_2025-26.pdf

### What the mapping does and does not establish

A named unit is a citation, not a claim that the lesson teaches that unit at the depth the syllabus intends. The agent's fit assessment (not an educator's) is recorded in `LESSON_VALIDATION_REPORT.md`:

- fractions, decimals, negatives, order-ops — **prerequisite foundations**, not Class 10 depth.
- algebra-expand, quadratics — aligned in substance, still provisional.
- linear-equations — the mapping names **two-variable** linear equations; the lesson teaches one-variable equations. **Do not approve as Class 10 Algebra without a teacher decision or a lesson revision.**
- coordinates — the mapping names distance, section and area formulas; the lesson teaches plotting and straight-line graphs, with midpoint/distance only in practice. **Partial; not full Class 10 Coordinate Geometry.**
- cells — Class 9 prerequisite, explicitly labelled.
- photosynthesis, equations-stoich, electricity-circuits — aligned in substance, still provisional.

Source registry: `lib/source-registry.ts`; generated review list: `pilot-readiness/SOURCE_AND_RIGHTS_REGISTRY.md`.

**Status: provisional-unreviewed. Reviewer: none. Verification: portal.** The PDF could not be machine-read in this environment; a subject teacher must confirm every heading against the official file before sign-off. No equivalence with ICSE, state boards or other countries is asserted.

## Rights and reuse

The provenance is not a reuse licence. `lib/source-registry.ts` records the source and its rights basis separately:

- The 12 lessons and their generated figures are **OpenMind-authored**. They contain no NCERT, CBSE, DIKSHA or other third-party teaching text or media.
- The CBSE syllabus records are **official-reference**: they may be cited and linked, not copied into a hosted lesson.
- NCERT textbooks are **all-rights-reserved**; DIKSHA, eLearn Punjab, ROC, UNESCO-IBE, OER Commons, Kolibri, CK-12, Siyavula and GeoGebra are **unknown or item-specific** until their own licence is checked. They are link-only or blocked.
- OpenStax, PhET and MIT OCW have a stated Creative Commons basis in the research, but no primary licence proof is on file here. They are **blocked for ingestion**, not merely warned about.

The generated `SOURCE_AND_RIGHTS_REGISTRY.md` is the reviewable list. No external OER, textbook, simulation or platform asset is embedded in the pilot.

**No local educator has confirmed any mapping.** The 2025–26 PDF was not machine-read; `verification: "portal"` means the headings are recorded from the official portal, not that the document was parsed. A reviewer must check each heading against the file.
