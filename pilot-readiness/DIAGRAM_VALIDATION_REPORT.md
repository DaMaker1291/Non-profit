# Diagram validation

## Science diagrams
- `photosynthesis`: an axes plot of rate against light intensity, with a rising section and a plateau. The caption states that the plateau means a different limiting factor. Checked against the lesson’s limiting-factor claim.
- `electricity-circuits`: a current–voltage axes plot with a straight line through the origin. The caption computes the gradient as 8 V ÷ 4 A = 2 Ω, matching V = IR.

Both are generated from the plan’s `FigureSpec` by the existing `FigureGraphic` renderer; no hand-written SVG was added.

## Mathematics diagrams
Six of the eight mathematics pilot lessons carry a figure: fractions (pie), negatives (number line), algebra-expand (rectangle), coordinates (axes), quadratics (axes) and linear-equations (balance). Decimals and order of operations deliberately carry none. Their arithmetic is covered by the engine suite’s “A diagram says what the numbers say” assertions (69 assertions).

## Browser evidence
- Teacher preview of `photosynthesis` inspected at 1280×900: review state, curriculum provenance, title and lesson header render correctly; `scrollWidth 1280`, overflow 0.
- `photosynthesis`, `electricity-circuits` and `equations-stoich` teacher previews measured at 320×640: `scrollWidth 320`, overflow 0 on each.
- The learner route `/learn/biology/cells` measured at 320: `scrollWidth 320`, overflow 0, with the pilot-status banner before the teaching.
- `/learn/maths/addition` measured at 320: `scrollWidth 320`, overflow 0, with the explicit “not available as a lesson” card and the background note behind a disclosure.
- Screenshots are saved under `pilot-readiness/evidence/`. The 320 captures show an empty area to the right of the page; that is the capture surface, not document overflow. The DOM measurements are the width assertions.

## Not done
- No automated `npm run verify:lesson` walk completed in this pass.
- No screen-reader or colour-contrast audit was run.
- No interactive science model exists; the two figures are static explanations.
