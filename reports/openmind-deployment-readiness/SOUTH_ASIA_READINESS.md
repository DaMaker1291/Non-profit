# South Asia Readiness

## 1. What is structurally present

`lib/specifications.ts` and `lib/curricula/registry.ts` contain eight South Asian specifications across five countries. This is real structural work: the right qualifications exist, with levels and stage windows.

| Country | Specification | Levels | Concepts covered (first level) | Authored plans | Fallback | Syllabus mapping on file | Local-language UI | Teaching language |
|---|---|---|---:|---:|---:|---|---|---|
| **Bangladesh** | `bd-ssc` SSC/HSC | Class 6–8 (JSC), Class 9–10 (SSC), Class 11–12 (HSC) | 94 | 12 | 82 | **None** | Bengali (`bn`) | English |
| **India** | `in-cbse` CBSE | Class 8–9, Class 10, Class 11–12 | 94 | 12 | 82 | **CBSE Class X maths only; reviewer null** | Hindi, Urdu | English |
| **India** | `in-icse` ICSE/ISC | Class 8–9, Class 10, ISC 11–12 | 94 | 12 | 82 | **None** (the CBSE mapping explicitly excludes ICSE) | Hindi, Urdu | English |
| **Pakistan** | `pk-matric` Matric/Inter | Class 6–8, Class 9–10 (Matric), Class 11–12 (Inter) | 48 | 10 | 38 | **None** | Urdu | English |
| **Nepal** | `np-see` SEE | Grade 10 | 94 | 12 | 82 | **None** | **None local** (Nepali not shipped) | English |
| **Nepal** | `np-neb` NEB Grade 12 | Grade 12 | 115 | 13 | 102 | **None** | **None local** | English |
| **Sri Lanka** | `lk-o-level` GCE O Level | Grade 11 | 94 | 12 | 82 | **None** | **None local** (Sinhala/Tamil not shipped) | English |
| **Sri Lanka** | `lk-a-level` GCE A Level | Grade 13 | 122 | 13 | 109 | **None** | **None local** | English |

"Concepts covered" is a stage-window count, not a syllabus map: a specification says "maths stages 0–4" and the count is every concept in that band. That is a **coverage window**, not evidence that the concept belongs in that board's syllabus at that grade.

## 2. The three gaps that decide deployment

### Gap 1 — Language of instruction

All 15 dictionaries carry **all 135 concept titles and blurbs** in their own words (`namesNatively` returns true for every language). That is a real achievement. But `lib/content-i18n.ts` states the asymmetry plainly: **none of the dictionaries carries a sentence of the teaching** — no plan paragraph, worked explanation, question prompt, repair or hint.

Measured:

- **Teaching translations:** 1 plan (`fractions` → French). **Zero** in Bengali, Hindi, Urdu, Nepali, Sinhala or Tamil.
- **Coaching paragraphs (`mcp.*`):** present in Spanish, French, Portuguese and German only. **Absent in Bengali, Hindi, Urdu, Nepali (not shipped), Sinhala (not shipped), Tamil (not shipped).**
- **Misconception names (`mc.*`):** present in all 15 languages (55 keys each), so a Bengali learner sees the name of the belief but no coaching paragraph under it.
- **Interface:** Bengali, Hindi and Urdu are shipped; Nepali, Sinhala and Tamil are not.

A learner in Dhaka who chooses Bengali gets a Bengali navigation and a Bengali concept title, then reads the actual teaching in English. The lesson page does disclose this (`lq.teachNote`), and `lib/lesson-plans-intl.ts` refuses a half-translated plan rather than mixing languages mid-paragraph. The disclosure is honest; it is not instruction.

### Gap 2 — Curriculum mapping and assessment alignment

There are **two** concept-by-concept mappings in the repository:

1. UK GCSE Mathematics — 56 entries, DfE headings, document-verified, `reviewer: null`.
2. India CBSE Class X Mathematics — 21 entries, headings quoted, `reviewer: null`, notes that Class IX and ICSE are **not** covered.

`mappingsWithReviewer: 0`. `reviewedMappings: 0`. `conceptsMapped: 77`. `pathsWithNoSource: 18`.

For Bangladesh, Pakistan, Nepal and Sri Lanka there is **no concept mapping at all**. The `curriculum-gate` passes because it checks that every mapping is well formed and every pathway reachable; it does not, and cannot, invent a mapping. A ministry reviewer would be shown a stage-window list, not a syllabus correlation.

Assessment alignment is weaker still: `OFFICIAL_ITEMS = 0` (no licensed past papers), and the bank contains no board-specific question styles. The paper templates include CBSE Class 10/12 and Cambridge IGCSE, but their items are OpenMind-authored, not board items. That is honest provenance, not local assessment alignment.

### Gap 3 — Local examples and terminology

`lib/specifications.ts` declares a `TermProfile` union of `uk | us | india | africa | common`. There is an **India** terminology profile; there is no Bangladesh, Pakistan, Nepal or Sri Lanka profile. The authored lesson contexts are chocolate bars, pizza, bags and weights — understandable in most settings, but not locally situated.

No evidence was found of:

- local currency, measurement or everyday-context examples for any South Asian country;
- region-specific terminology beyond the India profile;
- a local teacher, ministry or NGO involved in authoring or review;
- a local-language glossary for mathematics terms;
- alignment to a provincial board in Pakistan (the registry offers one "Matric" row plus a "Federal Board / Cambridge" label, not Punjab/Sindh/Balochistan/KP distinctions);
- state-board differentiation in India beyond a "State board" label with no specification.

## 3. Country-by-country verdict

### Bangladesh — **NOT READY**

- Structural: `bd-ssc` exists; 94 concepts at SSC; 12 authored maths lessons; 82 fallback.
- Language: Bengali UI and titles, English teaching, no Bengali coaching paragraphs.
- Curriculum: no mapping, no source URL (`recordReview` is the weaker "mapped", not "researched").
- Assessment: no SSC-style items; no local review.
- **What could be piloted:** the 15 maths lessons in an English-medium classroom, with a Bengali-speaking teacher mediating. Not a Bengali-medium deployment.

### India — **PARTIALLY READY, CBSE MATHS ONLY, UNREVIEWED**

- Structural: CBSE and ICSE both exist; 94 concepts each at Class 10; 12 plans each.
- Mapping: CBSE Class X maths has 21 quoted entries — the strongest South Asian evidence in the repository — but **reviewer: null**, and it explicitly excludes ICSE and Class IX.
- Language: Hindi/Urdu UI and titles; English teaching; no Hindi/Urdu coaching paragraphs.
- State boards: **not modelled**; "State board" is a label, not a specification.
- **What could be piloted:** CBSE Class 10 mathematics, English medium, with a subject teacher reviewing the 21 mapped concepts and the 15 lessons before use. ICSE and state boards should not be claimed.

### Pakistan — **NOT READY**

- Structural: `pk-matric` covers only 48 concepts at its first level (Class 6–8), 10 plans.
- Provincial differentiation is absent: one Matric row and a Federal/Cambridge label.
- No mapping, no source URL, no Urdu teaching, no local assessment.
- **What could be piloted:** nothing country-specific yet; the 15 maths lessons could be used as supplementary English-medium material with teacher review.

### Nepal — **NOT READY**

- Structural: SEE (94 concepts) and NEB Grade 12 (115) exist.
- Language: **Nepali is not shipped at all.** The interface cannot be read in the national language.
- No mapping, no local examples, no teacher involvement.
- **What could be piloted:** nothing language-appropriate. An English-medium private-school pilot is possible but would not represent the underserved population the product targets.

### Sri Lanka — **NOT READY**

- Structural: O Level (94 concepts) and A Level (122) exist.
- Language: **Sinhala and Tamil are not shipped.** The interface cannot be read in either national language.
- No mapping, no local examples, no teacher involvement.
- **What could be piloted:** nothing language-appropriate.

## 4. What "supported" should mean

A country should be marked supported only when all six are true:

1. A specification with a **source URL and a concept-by-concept mapping** on file.
2. A **subject specialist's name** on that mapping (`reviewer` non-null).
3. **Teaching content** — not just menus — in the language of instruction.
4. **Local assessment style** represented in the bank (or an explicit statement that it is not).
5. **Local examples/terminology** reviewed by a teacher.
6. An **offline path** that works on the devices and connectivity actually present.

On that definition, **no South Asian country is supported today**. India is closest: it has one mapped course and the right structural row, but no reviewer and no Hindi/Urdu teaching.

## 5. Recommendation

Do not launch a multi-country South Asian deployment. Choose **one** partner and **one** course — most credibly CBSE Class 10 Mathematics, English medium, in India — and complete the mapping review, the 15-lesson teacher review, and a Hindi teaching translation for that pathway before adding a second country. Bangladesh is the next candidate because `bd-ssc` already exists and Bengali is shipped, but it needs the same mapping and translation work.

A country matrix that lists eight specifications is a map of intent. It is not evidence that a child in Dhaka, Lahore, Kathmandu or Colombo can learn from the product tomorrow.
