# Diagram and Interaction Report

## 1. What exists

| Layer | Count | Where |
|---|---:|---|
| Figure kinds declared | 7 | `lib/figures.ts#FIGURE_KINDS`: axes, pie, right-triangle, number-line, balance, rectangle, surd-square |
| Figure kinds actually used in lessons | 6 | right-triangle is declared but unused |
| Concepts with an authored lesson figure | **11 / 135** (8.1%) | All mathematics |
| Concepts that generated a question figure in 40 draws | **4 / 135** | `coordinates` (30/40 draws), `pythagoras` (25/40), `data-charts` (5/40), `scatter-correlation` (4/40) |
| Question draws carrying a figure | 64 / 5,400 sampled (1.2%) | 40 draws per concept |
| Interactive lesson models | **1** | `components/fraction-model.tsx`, wired only for `fractions` |
| Graph-plotting assessment | 3 structured items (uncommitted) | `lib/structured-items.ts`, `components/graph-plot.tsx`, `app/papers/page.tsx` |

The 11 lesson figures:

| Concept | Kind | What it is for |
|---|---|---|
| `fractions` | pie | 3/4 of one whole; four slices fill the circle |
| `fraction-ops` | pie | 2/3 cut into sixths = 4/6, so 5/6 can be added |
| `negatives` | number-line | `5 − (−3)` travels **right** to 8: removing a leftward move |
| `algebra-expressions` | rectangle | `3(x + 4)` as three rows of `x` and `4`; the `12` is the term an incomplete expansion leaves out |
| `algebra-expand` | rectangle | expansion as an area model, cell by cell |
| `linear-equations` | balance | `3x + 5 = 20` as three bags and five weights against twenty |
| `coordinates` | axes | points and the line `y = 2x + 1` |
| `straight-lines` | axes | gradient triangle (run 2, rise 4) on `y = 2x − 1` |
| `quadratics` | axes | `y = x² − 5x + 6`, roots at 2 and 3, symmetry at 2.5 |
| `surds` | surd-square | area 50 tiled into 25 squares of area 2, so `√50 = 5√2` |
| `completing-square` | rectangle | the completed square, with the `9` corner emphasised |

## 2. Are they educationally useful?

**Yes, where they exist.** Each is tied to a claim the prose makes, not to decoration:

- The `fractions` pie shows the same circle with the denominator as the number of cuts; the caption says *"four of them would fill the circle exactly."*
- The `negatives` number line is the rare diagram that corrects a sign error: the arrow travels right for `5 − (−3)`, and the caption explains that removing a leftward move is why.
- The `linear-equations` balance is drawn from the equation's own counts (3 bags + 5 units vs 20 units); a test asserts the pans hold exactly those counts and hang symmetrically.
- The `surds` tiling makes the simplification exact: 25 small squares of area 2 along a 5×5 grid.

The Chrome walk measured every authored figure at 1280×900 and 320×640:

- drawing inside its box and the viewport;
- labels at least 12–13 px;
- no two labels overlapping;
- no sideways scroll at 320 px (320 vs 320);
- SVG `aria-hidden`, so the caption is what a screen reader hears.

Evidence images: `evidence/lesson-negatives-1280.png`, `evidence/lesson-linear-equations-320.png`, `evidence/lesson-worked-1280.png`.

`npm run verify` also asserts the arithmetic behind the drawings (points satisfy the curve, roots are the marked crossings, the balance's counts equal the equation, area-model cells are the terms they label). That is why the figures can be trusted more than a screenshot alone would justify: the numbers are checked, and the walk checks the pixels.

## 3. What is missing

1. **No science diagrams at all.** Zero figures for physics (circuits, forces, waves, motion graphs), chemistry (atomic structure, bonding, equations, energy profiles) or biology (cells, organs, ecosystems, food webs). These are the subjects where a diagram is often the explanation.
2. **In the 40-draw sample, only four concepts generated question figures.** A learner can practise 131 concepts without seeing a diagram attached to a question in those draws.
3. **One interactive model.** The fraction slider is the only lesson interaction. There is no interactive number line, balance, area model, graph plotter in practice, circuit builder, or cell explorer.
4. **`right-triangle` is declared but unused.** A renderer branch with no content is not coverage.
5. **Graph plotting is uncommitted and narrow.** `components/graph-plot.tsx` and the structured items exist in the working tree but not in HEAD. They serve three authored items (`sf-lawn-feed`, `sf-plot-line`, and a line-graph item), of which two are wired into paper templates — not a general graph-drawing assessment. A coordinate-entry prototype is not a graph-construction capability.

## 4. The one interactive model, examined

`components/fraction-model.tsx`:

- denominator slider 2–12, numerator slider 0–denominator (the numerator is clamped, so `5/4` of one whole cannot be drawn);
- each piece is a rectangle whose width shrinks as the denominator grows;
- live text `3/4 — 3 of 4 equal pieces`, in an `aria-live="polite"` region;
- the SVG has an `aria-label` with the same count;
- the explanatory sentence *"Cut the bar into more pieces and each piece gets smaller"* is on screen.

**What it teaches:** the inverse relationship between denominator and piece size — the exact misconception the `fractions` plan names. **What it does not do:** compare two fractions side by side, place a fraction on a number line, or check the learner's prediction. It is a model, not an exercise.

**Test coverage:** the lesson walk measures the static figure and the page layout, but **does not move either slider**. No automated test asserts that changing the denominator updates the bar, the text and the aria-label consistently. That is a gap: the one interactive model is the one thing the browser gate does not exercise.

## 5. Accessibility

- Lesson figures: caption is the accessible text; SVG is `aria-hidden`. This is the right pattern for a diagram whose caption states the point.
- Fraction model: `aria-label` plus live text; keyboard-operable range inputs; no drag-only interaction.
- No screen-reader run was performed. Contrast ratios were not measured. Text resizing beyond the 320-px viewport check was not tested.
- At 320 px the authored lessons do not scroll sideways; that is measured, not assumed.

## 6. Verdict

**PARTIAL.** The diagrams that exist are accurate, concept-specific and measured at phone width — a genuine strength. But **92% of concepts have no lesson visual**, **all science has none**, and there is exactly one interactive model with no interaction test. For a low-resource learner who may be reading below grade level, a paragraph-only science lesson is the worst case: the diagram is often the scaffold, and it is absent.
