# Digestion and microscopy — independent lesson verification

Date: 2026-11-08

Scope: `lib/lessons/authored/biology-digestion.ts` and
`lib/lessons/authored/biology-microscopy.ts`, their compiled records, and their
learner-facing pages at 1280, 768, 375 and 320 px.

This is a verification record, not a claim that either lesson teaches well. Both
remain `draft` / `machine_checked`; neither has a subject-teacher review or
learner-testing record.

## 1. Independent Learning Completeness

The checklist is structural. It establishes that the material an independent
learner needs is present and connected; it does not establish that a learner
understood it.

| Criterion | Digestion | Microscopy |
|---|---|---|
| Measurable objectives | 3, each with evidence | 3, each with evidence |
| Prerequisite knowledge and diagnostic | 2 checks targeting `enzymes` | 2 checks targeting `cells` and `standard-form` |
| Conceptual introduction | Hook plus a full rationale | Hook plus a full rationale |
| Accurate explanations / representations | 5 sections, 4 subject-specific blocks | 4 sections, 4 subject-specific blocks |
| Fully reasoned worked examples | 2, each with 4 moves and a reason per move | 2, each with 4 moves and a reason per move |
| Misconceptions with failure explanations | 4 | 3 |
| Guided practice with usable hints | 3 | 3 |
| Independently markable assessment | 4 items; constructed response plus 3 deterministic short answers; 5/2/2/2 criteria | 4 items; constructed response plus 3 deterministic short answers; 5/2/2/2 criteria |
| Transfer challenge with explanation | 1, with 5 criteria; coeliac malabsorption | 1, with 5 criteria; living biopsy vs ribosome defect |
| Meaningful retrieval | 3 prompts at next-day, week-later and month-later | 3 prompts at next-day, week-later and month-later |
| Appropriate feedback | Correct and incorrect paths for every guided item; assessment marking notes | Correct and incorrect paths for every guided item; assessment marking notes |
| Mathematical / scientific validation | Surface-area calculation checked; claims checked against sources below | Four calculations checked; resolution claims checked against sources below |
| Learner-facing rendering | 19 prose paragraphs, 4 representation blocks, transfer 297 words, retrieval 65 words | 17 prose paragraphs, 4 representation blocks, transfer 287 words, retrieval 52 words |

### The seven Independent Learning Completeness questions

| Test | Digestion | Microscopy |
|---|---|---|
| Recovery: can someone rebuild the idea? | Prerequisite enzyme diagnostic, concrete bread-to-villus opening, then the full mechanism | Prerequisite cell/standard-form diagnostic, two-image opening, then the magnification/resolution model |
| Explanation: can they understand why it works? | Surface area, hydrolysis, pH, emulsification and transport are each given a causal explanation | Resolution versus magnification, wavelength, lenses/electromagnets and specimen preparation are given causal explanations |
| Modelling: can they follow a reasoned example? | 2 examples, 4 moves each, every move justified | 2 examples, 4 moves each, every move justified |
| Practice: can support be reduced? | 3 guided items with hints before independent assessment | 3 guided items with hints before independent assessment |
| Correction: can they identify and repair a mistake? | 4 misconceptions with why each fails, contrast pairs and feedback | 3 misconceptions with why each fails, contrast pairs and feedback |
| Independence: can they solve an unfamiliar problem? | Coeliac malabsorption transfer, with marking criteria | Living biopsy versus ribosome-defect transfer, with marking criteria |
| Retention: can they retrieve it later? | 3 delayed prompts | 3 delayed prompts |

These are structural answers. The last two rows describe the **opportunity** for
independent application and retrieval, not evidence that a pupil used it.

Both lessons meet the repository's authored contract. This says nothing about
teacher approval or learning outcomes.

## 2. Scientific validation

Sources inspected:

- Cambridge IGCSE Biology 0610 syllabus, 2026–2028:
  https://www.cambridgeinternational.org/Images/697203-2026-2028-syllabus.pdf
- OpenStax Biology 2e, digestive system processes:
  https://openstax.org/books/biology-2e/pages/34-3-digestive-system-processes
- NCBI Bookshelf, Physiology, Peristalsis:
  https://www.ncbi.nlm.nih.gov/books/NBK556137
- Merck Manual Professional, Celiac Disease:
  https://www.merckmanuals.com/professional/gastrointestinal-disorders/malabsorption-syndromes/celiac-disease
- NCBI Bookshelf, Celiac Disease:
  https://www.ncbi.nlm.nih.gov/books/NBK441900/
- NCBI Bookshelf, Steatorrhea:
  https://www.ncbi.nlm.nih.gov/books/NBK541055/
- Oregon State University, Visualizing Cells through Microscopy:
  https://open.oregonstate.education/cellbiology/chapter/microscopy
- BioNumbers, TEM resolution:
  https://bionumbers.hms.harvard.edu/bionumber.aspx?s=n&v=7&id=101469
- University of Zurich, Introduction to Electron Microscopy:
  https://www.zmb.uzh.ch/static/bio407/assets/Script_AK_2014.pdf
- BBC Bitesize, electron microscopes:
  https://www.bbc.co.uk/bitesize/guides/zxm3jty/revision/7

| Claim checked | Finding | Action |
|---|---|---|
| Amylase breaks starch to maltose; maltase breaks maltose to glucose | Cambridge 0610 separates these two steps. The lesson's introduction and summary had collapsed them and credited amylase with glucose. | Corrected in the introduction, explanation, guided answer and summary. The new gate rejects the old wording. |
| Mechanical digestion increases surface area without changing molecules | Consistent with Cambridge 0610 and the lesson's particle-level explanation. | Retained. |
| Bile emulsifies fat and neutralises acidic chyme; it is not an enzyme | Consistent with Cambridge 0610 and OpenStax. | Retained. |
| Villi and microvilli increase surface area; capillaries and lacteals transport absorbed products | Consistent with Cambridge 0610. The lesson distinguishes blood and lacteal routes. | Retained. |
| Peristalsis is a wave of circular and longitudinal muscle activity | The old paragraph said the longitudinal muscle relaxes ahead of the bolus. NCBI describes coordinated contraction and relaxation, with the longitudinal layer shortening the segment and opening the lumen. | Corrected the explanation and representation: circular muscle contracts behind, circular muscle ahead relaxes, longitudinal muscle ahead contracts and shortens the segment. |
| Coeliac disease damages villi and causes malabsorption, weight loss and anaemia | Merck, StatPearls and the clinical guideline describe immune-mediated villous atrophy, fat malabsorption, weight loss, iron deficiency and fat-soluble vitamin deficiencies. | Added the immune reaction to gluten and the duodenal/jejunal site of iron absorption to the transfer task. Coeliac disease is not a core 0610 recall outcome; the transfer supplies the cause, so it tests application rather than assumed prior knowledge. |
| Light microscope resolution is about 0.2 µm | Consistent with BBC Bitesize and the lesson's explanation. | Retained. |
| TEM resolution is on the order of 0.1 nm; SEM resolves a few nanometres | Consistent with BioNumbers, Oregon State's microscopy chapter and the University of Zurich electron-microscopy guide. | Retained. |
| Magnification calculations and unit conversions | Independently recomputed: 60 mm / 30 µm = ×2,000; 24 mm / ×1,200 = 20 µm; 80 mm / 40 µm = ×2,000; 0.05 mm = 50 µm; 250 nm = 0.25 µm. | Retained; pinned in the biology gate. |

The surface-area example is correct: a 1 mm cube has 6 mm²; 1,000 cubes of
0.1 mm edge have 0.06 mm² each and 60 mm² total, a tenfold increase. The
JavaScript assertion uses a tolerance because `6 × 0.1²` is not exactly `0.06`
in binary floating point; the lesson's decimal arithmetic is exact.

## 3. Technical verification

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run verify` | 4,630 passed, 0 failed |
| `npm run verify:biology` | 89 assertions passed |
| `npm run verify:lessons` | exit 0, including the new biology gate |
| `npm run build` | exit 0 |
| `npm run verify:lesson` | 382 passed, 0 failed |
| Browser widths | 1280 × 900, 768 × 1024, 375 × 667 and 320 × 640 |
| `npm run verify:a11y` | 73 passed, 0 failed |

The browser walk measured both lessons at all four widths. No page scrolled
sideways. `digestion` rendered 3 objectives, 4 misconceptions, 3 guided items,
19 prose paragraphs and 4 representation blocks; `microscopy` rendered 3
objectives, 3 misconceptions, 3 guided items, 17 prose paragraphs and 4
representation blocks.

The accessibility audit covers document language, landmarks, headings, control
names, image alternatives, skip-link focus and 320-px overflow. It explicitly
does **not** measure screen-reader announcements, switch or eye-gaze input,
200% text reflow or colour-contrast ratios.

## 4. Limitations

- **No educator review.** The scientific sources support the checked claims, but
  no qualified biology teacher has approved the wording, difficulty or
  assessment for a particular age group.
- **No learner evidence.** No pupil has been tested for independent transfer or
  delayed retention. Completion and correct answers are not being treated as
  mastery.
- **Screen-reader and switch access remain unmeasured.** The automated audit
  checks structure and focus, not the experience of listening to the page or
  operating it without a pointer. A later run of the same audit reported one
  `/access` control failure, which passed on a clean rerun and left one gated
  surface unaudited; the 73/0 result above is therefore a smoke test, not a
  stable accessibility measurement.
- **Automated checks cannot detect a new factual error.** The biology gate pins
  only the claims named above; a new sentence can still be wrong.
- **The production build was compiled, not served.** No production server was
  restarted and nothing was deployed.

## 5. Verdict

Digestion and microscopy now satisfy all 13 structural completeness criteria,
and their checked scientific claims and arithmetic are pinned by a dedicated
gate. Both remain unproven as teaching: `educator_reviewed` and
`learner_tested` are still empty, and no learning-outcome claim is made.
