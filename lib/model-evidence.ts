// ─────────────────────────────────────────────────────────────────────────────
// MODEL EVIDENCE — what was actually seen in a browser, per model.
//
// A component is not "browser verified" because the build passed. This record is
// the only place that claim lives, and it is hand-written on purpose: a person has
// to say what they did and what they did not check. `verifiedOn: null` means the
// model has never been opened in a browser, and the coverage register reports that
// rather than counting it.
//
// `notChecked` exists because every browser pass has edges — a screen reader was
// not actually used, a slow connection was not simulated — and a record that only
// lists successes reads as a stronger claim than it is.
// ─────────────────────────────────────────────────────────────────────────────

import type { InteractiveModelId } from "./interactive-models";

export interface BrowserCheck {
  readonly id: string;
  /** What was done, in the browser. */
  readonly what: string;
  /** What the page actually showed. */
  readonly result: string;
}

export interface ModelEvidence {
  readonly model: InteractiveModelId;
  /** ISO date the browser pass happened; null when it has never happened. */
  readonly verifiedOn: string | null;
  /** e.g. "1440×900 desktop + 390×844 mobile". */
  readonly viewport: string;
  readonly checks: readonly BrowserCheck[];
  /** Workspace-relative screenshot, when one was captured. */
  readonly screenshot: string | null;
  /** What the pass did NOT cover. Required to be non-empty when verified. */
  readonly notChecked: readonly string[];
}

export const MODEL_EVIDENCE: readonly ModelEvidence[] = [
  {
    model: "circuit-model",
    verifiedOn: "2026-11-25",
    viewport: "1280×900 desktop and 390×844 mobile",
    checks: [
      { id: "one-cell", what: "One cell, one bulb, switch closed.", result: "0.25 A on both ammeters; the bulb is lit." },
      { id: "add-bulb", what: "Added a second identical bulb in series.", result: "0.13 A, brightness 0.25× — the current halved, so the belief 'a cell gives a fixed current' fails." },
      // CORRECTED 2026-11-25. This check used to read "0.25 A again (3 V ÷ 12 Ω),
      // so 'more cells is always brighter' is not a rule" — which is wrong twice:
      // a second cell in series doubles the p.d. to 3 V across ONE 6 Ω bulb, so the
      // current is 0.50 A (not 0.25 A), and the bulb is 4× as bright, not equally
      // bright. `circuitReading` (lib/interactive-models.ts) has always computed it
      // that way; the hand-written note contradicted the model and the generated
      // educator pack repeated it. Re-derived here from the code, not re-observed
      // in a browser, and the limitation below says so.
      { id: "add-cell", what: "Added a second cell with one bulb (value re-derived from circuitReading, not re-observed after this correction).", result: "0.50 A and 4× brightness (3 V ÷ 6 Ω). More cells in series DO brighten; the belief the model refutes is that a cell supplies a fixed current, not that adding cells never helps." },
      { id: "open-switch", what: "Opened the switch.", result: "0.00 A and 'Nothing is lit' — no closed loop, no current." },
      { id: "keyboard", what: "Reached and operated every control with the keyboard.", result: "Enter on each button changes the reading; focus ring visible." },
      { id: "live-region", what: "Inspected the readout after a change.", result: "aria-live=\"polite\" carries the new sentence." },
      { id: "mobile", what: "390 px viewport on the electricity lesson, measured page and controls.", result: "0 px horizontal overflow; no control under 44 px; the drawing 306 px wide." },
      { id: "convention", what: "Read the drawing and opened 'Which way is the current, exactly?' for one cell and one bulb.", result: "The arrows are labelled on the drawing ('arrows: conventional current', '+ terminal → round the loop → − terminal'), the cell carries ＋ and − under its plates, and the disclosure separates conventional current from electron drift and says they are not two different currents.", },
      { id: "terminal-consistency", what: "Checked the arrow geometry against the plates that are drawn.", result: "Both arrowheads point right along the top wire, which is the direction that follows from the positive plate being on the left of the cell; the suite now derives this from the terminal data rather than from a hard-coded path.", },
      { id: "volts-per-bulb", what: "Read the readout with one bulb, then added an identical bulb.", result: "1.50 V across the single bulb, then 0.75 V each with two (2 × 0.75 V = 1.50 V) and 0.13 A — the p.d.s add back to the cell voltage, which is the same fact as the current halving.", },
      { id: "convention-overlap", what: "Measured the two convention labels' boxes against the cell and bulb shapes at 390 px.", result: "First pass: the second line began 3 px above the cell's top plate and spanned x 87–304 across plates at x 152–164, i.e. text drawn over the symbol. Moved into the empty band; re-measured with 7 px clear above the cell and 7 px below the bulbs. Found by measuring, not by looking.", },
      { id: "disclosure-target", what: "Measured the convention summary's height at 390 px.", result: "22 px — half the 44 px the buttons beside it clear. Given a 44 px box; re-measured 44 px.", },
      { id: "contrast", what: "Measured text contrast in the drawing and the readout at 390 px.", result: "Drawing labels 12.44:1 and the live readout 13.24:1 against the card surface — well above the 4.5:1 the body text needs, and the arrows are labelled in text so the drawing is not the only carrier.", },
    ],
    screenshot: "audit/pilot-electricity-model.png",
    notChecked: [
      "A real screen reader was not driven through the model.",
      "The corrected add-cell reading (0.50 A, 4× brightness) was re-derived from lib/interactive-models.ts#circuitReading; it was not re-measured in a browser in this pass, and the earlier 0.25 A note was wrong.",
      "Reduced-motion preference was not separately exercised; the model has no animation, so there is nothing for it to suppress.",
      "Only Chromium was used. Firefox and Safari were not tested.",
      "No closed circuit was ever built in PhET (its components could not be dragged into contact in this automation), so the model's numbers have NOT been compared with an external measurement. The only independent check is Kirchhoff's loop rule against the model's own per-bulb p.d.s.",
    ],
  },
  {
    model: "number-line-model",
    verifiedOn: "2026-11-24",
    viewport: "1440×900 desktop and 390×844 mobile at place value",
    checks: [
      { id: "negative", what: "Moved the marker to −5 on the negatives line under the negatives concept.", result: "Sentence says LEFT of zero, further left is SMALLER, distance 5 reported separately." },
      { id: "neighbours-negative", what: "Placed the marker at −3 and read both neighbours.", result: "First version printed 'less than −4 and more than −2' — the order was inverted. Fixed; now 'less than −2 and more than −4'. Found by looking, not by a test." },
      { id: "neighbours-positive", what: "Placed the marker at +3.", result: "Greater than 2 and less than 4, so both sides of zero are checked." },
      { id: "decimals", what: "Stepped in tenths on the decimals concept.", result: "0.4, not 0.4000000000000001; the sentence counts tenths." },
      { id: "place-value", what: "Read 340 on the place-value concept.", result: "One move is ten, so the marker is 34 moves from zero." },
      { id: "mobile", what: "390 px viewport on the place-value lesson, measured page and controls.", result: "Page 390 px wide with no sideways scroll; every button and the readout clear 44 px." },
    ],
    screenshot: "audit/pilot-negatives-model.png",
    notChecked: [
      "The decimals concept was measured at desktop only this pass; the line is the same component with a different unit.",
      "A real screen reader was not driven.",
    ],
  },
  {
    model: "atom-model",
    verifiedOn: "2026-11-25",
    viewport: "1280×900 desktop and 390×844 mobile",
    checks: [
      { id: "neutron", what: "Added a neutron to carbon-12.", result: "Still carbon, now carbon-13 — identity from protons, mass from neutrons." },
      { id: "proton", what: "Added a proton instead.", result: "Nitrogen-14: the element name changed with the proton count." },
      { id: "electron", what: "Changed the electron count.", result: "Same element, reported as an ion with a charge." },
      { id: "mobile", what: "390 px viewport on the atoms lesson.", result: "No sideways scroll; no control under 44 px." },
      { id: "describe-gate", what: "Loaded the lesson with the describe prediction, typed three words, then a sentence, then committed.", result: "data-model-predict-kind=describe; the slot stayed locked with zero controls and 'Commit my prediction' disabled until four words were present; committing opened it with six controls and the atom drawing. The verdict reads 'Your description is not marked — the model is what answers it' and then the reveal, with the three ideas to check against listed below it.", },
      { id: "describe-revise", what: "Edited the committed description afterwards.", result: "The model stayed open — a revised prediction is not sent back behind the gate.", },
    ],
    screenshot: null,
    notChecked: [
      "Screen-reader output not driven.",
      "The 390 px pass measured the frame and the controls, not the atom drawing itself.",
      "The describe box was driven by setting its value and dispatching an input event, not by typing — the commit threshold is asserted in the suite, not measured keystroke by keystroke.",
    ],
  },
  {
    model: "cell-model",
    verifiedOn: "2026-11-25",
    viewport: "1280×900 desktop and 390×844 mobile",
    checks: [
      { id: "plant", what: "Opened the plant cell.", result: "Seven parts, each with a job." },
      { id: "chloroplast", what: "Switched the chloroplast off.", result: "'Cannot make its own glucose from light' — the job stops, the cell does not die." },
      { id: "animal", what: "Switched to the animal cell.", result: "Four parts; no wall or chloroplast is present to add." },
      { id: "mobile", what: "390 px viewport on the cells lesson, after committing a prediction.", result: "No sideways scroll; no control under 44 px; the prediction marked correct and the reveal printed above the drawing." },
      { id: "describe-gate", what: "Loaded the lesson with the describe prediction and committed a two-clause sentence.", result: "Locked with zero controls until committed, then open with nine controls and the cell drawing; the reveal prints what the model shows and the three ideas to look for. Nothing is marked.", },
    ],
    screenshot: null,
    notChecked: [
      "The 390 px pass measured the frame and the controls, not the cell drawing itself.",
      "The 'chloroplasts in every plant cell' limitation is stated in words; the model still has no root-cell case to show.",
      "Only Chromium was used; no screen reader was driven through the describe box.",
    ],
  },
  {
    model: "search-model",
    verifiedOn: "2026-11-25",
    viewport: "1280×900 desktop and 390×844 mobile",
    checks: [
      { id: "four-steps", what: "Opened /learn/computing/algorithms-search and read the card's structure.", result: "Four labelled blocks — choose a number, both algorithms on it, step through, start again — instead of fourteen target buttons wrapping above the drawing." },
      { id: "target-select", what: "Changed the target from 55 to 3 with the select, then stepped to the end.", result: "The run reset, and the finished line reads 'one at a time took 1 look, halving took 3. One at a time needed fewer looks here, because the target is near the front.'" },
      { id: "live-not-final", what: "Read the readout before stepping, then after one step.", result: "At zero: 'Nothing has been checked yet. Step once to take the first look.' After one step: 'This run so far — one at a time: 1 of 9 looks; halving: 1 of 3 looks.' No completed comparison in either — the old card printed the totals before a single look was taken." },
      { id: "finished", what: "Stepped to the end for target 55.", result: "Live line reads 9 of 9 and 3 of 3; a separate finished block then says 'Finished: one at a time took 9 looks, halving took 3. Halving needed fewer looks for this target.' Step is disabled, Start again is enabled." },
      { id: "first-item", what: "Searched for 3, the first item of the sorted list.", result: "One at a time found it in 1 look, halving in 3, and the finished line says one at a time needed fewer — the count refutes 'binary is always better' on the screen itself." },
      { id: "prediction", what: "Chose 'One at a time — it is the first item' above the model.", result: "data-model-predicted went to correct and the reveal printed; the prediction sits above the controls, the slot starts locked with zero controls, and choosing an option is what opens it. Found by looking: the first version rendered the three options as solid primary buttons, which read as three actions rather than three choices." },
      { id: "labels", what: "Measured the SVG's label type at 1280.", result: "The label rule was scoped to the circuit model, so the search model's labels rendered at 17 px — larger than the 28 px cells beside them — and the last one ran out of the viewBox and was cut off mid-sentence. Scoped, shortened and re-checked." },
      { id: "unordered", what: "Pressed 'Shuffle the list' and read the halving row before stepping.", result: "'halving: cannot start \u2014 the list is not in order'; no finished comparison; the live line still says nothing has been checked. The precondition is refused with its reason rather than reported as zero looks." },
      { id: "mobile", what: "390 px viewport, measured page, card and digits.", result: "Page width 390 with no sideways scroll. The first measurement had the drawing at 298 px, which puts each digit at about 8 px; it now keeps its own width inside a scrolling wrapper (340 px, digits 11 px) and the page still does not scroll sideways." },
      { id: "instructions", what: "Read both instruction lists before stepping, after one step, and after two.", result: "Five instructions per algorithm with the executing one emphasised by weight and a left rule. Before any step the highlighted instruction is 'Start at the first item'; after two looks it is 'Compare the item at the current position', with the two set-up steps ticked. The note under each list names the item under the cursor ('Comparing item 3 (12) with the number you want').", },
      { id: "cursor", what: "Counted the dashed 'current' boxes after two looks on target 55.", result: "Two — one per row — around item 3 (12) for one-at-a-time and item 9 (55) for halving, which is the item the third look actually takes. The filled middle shows the item last compared, so 'the one I just checked' and 'the one I am about to check' are drawn differently.", },
      { id: "count-is-theirs", what: "Read the running line after two looks and the finished line after nine.", result: "'You have taken 2 looks: one at a time has compared 2 items; halving has compared 2 items. Neither total is printed until the run ends.' No 'of 9' anywhere before the end; the totals appear only in the finished block.", },
      { id: "confidence", what: "Chose 'I'm confident', then the correct prediction, and read the line under the verdict.", result: "'You were confident and the model agrees. That is the state to notice — and it is evidence because the model was used, not because you said so.' data-model-confidence=confident; nothing is sent anywhere.", },
      { id: "mobile-instructions", what: "390 px viewport, measured the two instruction lists and every control in the card.", result: "The lists stack into one 298 px column, 12.5 px type, the current row marked by weight and a 2 px accent rule rather than colour alone; page 390 with no sideways scroll; every button and the select at least 44 px high.", },
      { id: "keys-contrast", what: "Focused 'Take one look' and pressed a real Enter key; measured contrast of the highlighted instruction and the dashed cursor.", result: "Enter advanced the run (data-search-taken=1) and the executing instruction moved to step 3, so the button works from the keyboard and not only from a script. Highlighted instruction text 11.5:1; dashed cursor stroke 6.31:1 against the surface; zero animations in the card, so a reduced-motion preference has nothing to suppress.", },
    ],
    screenshot: "audit/pilot-search-model-finished.png",
    notChecked: [
      "The shuffled list was checked before stepping only; it was not stepped to the end in the browser (the unsorted totals are asserted in the suite).",
      "A real screen reader was not driven through the four steps; aria-current=\"step\" is in the DOM but was not heard.",
      "Only Chromium was used. Firefox and Safari were not tested.",
      "The instruction sequences were checked against the model's own state, not against a teacher's reading of the wording — that is what the educator review is for.",
    ],
  },
  {
    model: "fraction-model",
    verifiedOn: "2026-11-24",
    viewport: "1440×900 desktop",
    checks: [
      { id: "denominator", what: "Changed the denominator from 4 to 8 with the numerator held at 1.", result: "The piece shrinks and the sentence says why 1/8 < 1/4." },
    ],
    screenshot: null,
    notChecked: ["Superseded for `fractions` by fraction-line-model; retained only for the concept bound to it."],
  },
  {
    model: "fraction-line-model",
    verifiedOn: "2026-11-24",
    viewport: "1280×900 desktop and 390×844 mobile",
    checks: [
      { id: "initial", what: "Opened /learn/maths/fractions with the default 3/8.", result: "The bar shows three of eight pieces; the marker sits at 0.375 and the sentence says below 1/2 because twice 3 is less than 8." },
      { id: "more-pieces", what: "Cut the same whole into more pieces with the denominator control.", result: "The sentence prints 1/9 sits LEFT of 1/8 even though 9 is bigger — the denominator error is stated as a position." },
      { id: "compare", what: "Read the fixed 3/4 against 5/8 comparison.", result: "In 8ths, 6/8 against 5/8, and it says comparing the bottoms would get this backwards. Correct." },
      { id: "endpoint", what: "Took every piece so the fraction was 3/3.", result: "First render said 'above 1/2' at one whole; fixed to 'at ONE WHOLE, the right end of the line' and re-checked." },
      { id: "keyboard", what: "Focused 'Cut into fewer pieces' and pressed Enter.", result: "Focus ring visible; Enter changed the cut from 4 to 3 and clamped the pieces taken to 3/3." },
      { id: "mobile", what: "390 px viewport, measured page and card.", result: "0 px horizontal overflow; model 358 px wide; every button 44 px high; the three prediction buttons stack full width." },
      { id: "sliders", what: "Measured the two range inputs at 390 px, which the earlier pass had not done.", result: "Both were 16 px tall — less than half the buttons beside them. Given a 44 px box in CSS and re-measured: 44 px each, track and thumb unchanged." },
      { id: "gate", what: "Loaded the lesson with no prediction chosen and counted the controls inside the model slot.", result: "data-model-slot=\"locked\", zero buttons, selects or inputs inside the slot and no drawing at all — only the gate sentence. After choosing one option the slot read \"open\" and six controls appeared; changing the answer to a different option kept it open (a learner who revises is not sent back to the gate)." },
    ],
    screenshot: "audit/pilot-fractions-framed-mobile.png",
    notChecked: [
      "A real screen reader was not driven; the SVG aria-label and the aria-live sentence duplicate each other for a screen-reader user.",
      "Only Chromium was used. Firefox and Safari were not tested.",
      "Low-bandwidth behaviour was not simulated; the component makes no network request after load.",
      "The slider fix was measured in the browser; it was not re-driven by touch, only by the keyboard.",
    ],
  },
  {
    model: "factor-model",
    verifiedOn: "2026-11-27",
    viewport: "1440×900 desktop and 390×844 mobile",
    checks: [
      { id: "gate", what: "Loaded /learn/maths/factors-primes with no prediction chosen, then chose 72.", result: "Before the choice the model showed only the gate sentence — no tree and no factor-pair buttons. Choosing 72 marked the prediction correct, printed the reveal (72 = 2³ × 3²; 864 is common but not lowest; 12 is the HCF), and opened the tree with 2 × 18, 3 × 12, 4 × 9 and 6 × 6." },
      { id: "build", what: "Split 36 into 4 × 9, then 4 into 2 × 2, then 9 into 3 × 3.", result: "The tree grew 36 → 4, 9 → 2, 2, 3, 3. The status read '36 = 4 × 9. Now split 4', then '4 = 2 × 2. Now split 9', then 'Every leaf is prime: 36 = 2 × 2 × 3 × 3 = 2² × 3²'." },
      { id: "complete", what: "Read the finished tree and its summary.", result: "data-factor-tree-complete was 'yes'; every 2 and 3 leaf carried data-factor-prime='yes' while 4 and 9 stayed composite; the product read 2 × 2 × 3 × 3 and the index form 2² × 3²." },
      { id: "compare", what: "Pressed 'Compare 24 and 36'.", result: "24 = 2³ × 3, 36 = 2² × 3², HCF = 2² × 3 = 12 and LCM = 2³ × 3² = 72; the comparison names 864 as a common multiple that is not the lowest." },
      { id: "desktop", what: "Measured the page and controls at 1440 px.", result: "Page scrollWidth 1440; model 1074 px; 'Start again' 44 px high. The tree's nodes were 36 px high with 15 px type, so the numbers are readable without zooming." },
      { id: "mobile", what: "Rebuilt the same 4 × 9 route at 390 px and measured the tree, page and controls.", result: "Page 390 with no sideways scroll; the tree wrapper's client and scroll widths were both 306 px, so the full tree fitted without an inner scrollbar; the model was 332 px wide; every factor-pair button was 306 × 44 px; the finished readout still showed HCF 12 and LCM 72." },
    ],
    screenshot: "audit/n4-factor-model-2026-11-27.png",
    notChecked: [
      "Only the 4 × 9 first split was built in the browser; the 6 × 6 route was not clicked, so the 'same leaves by a different route' claim is asserted by the suite, not observed in this pass.",
      "A real screen reader was not driven; the status line's aria-live was present in the DOM but was not heard.",
      "Keyboard activation was not exercised for the factor buttons; this pass used pointer clicks, though the controls are native buttons.",
      "Only Chromium was used. Firefox and Safari were not tested.",
      "The comparison is one pair, 24 and 36; three-number HCF/LCM and coprime or equal-number cases were not shown.",
      "The mobile pass measured layout and hit sizes, not the drawing under a long alternate route or at 320 px.",
    ],
  },
  {
    model: "fraction-ops-model",
    verifiedOn: "2026-11-24",
    viewport: "1280×900 desktop and 390×844 mobile",
    checks: [
      { id: "initial", what: "Opened /learn/maths/fraction-ops with 1/2 + 1/3.", result: "Both renamed in sixths, sum 5/6, and 2/5 drawn short with the sentence that a sum cannot be smaller than its parts." },
      { id: "unlike", what: "Changed the pair to 1/4 + 1/3.", result: "Renamed in twelfths: 3/12 + 4/12 = 7/12. Correct." },
      { id: "improper", what: "Made the second fraction 2/2 so the sum exceeded one whole.", result: "8/6 = 4/3, reported with the simplification; the guide line stops at the end of the scale." },
      { id: "wrong-amount", what: "Compared the drawn wrong answer against the addends.", result: "2/5 (0.400) is visibly shorter than 1/2 and the sentence names it as impossible for a sum." },
      { id: "shading", what: "Looked at the rendered card at desktop size.", result: "The second fraction's cells were nearly invisible against the empty fill (a pale rule token). Changed to a mid-opacity accent and re-checked." },
      { id: "targets", what: "Measured the eight controls.", result: "44 px high; page overflow 0 px at 1280." },
      { id: "mobile", what: "390 px viewport on the fraction-ops lesson.", result: "Page 390 px wide with no sideways scroll; every control at least 44 px; the two cards stack." },
    ],
    screenshot: "audit/pilot-fraction-ops-model.png",
    notChecked: [
      "Mobile layout was measured for width and hit sizes; the shading itself was not re-inspected at 390 px.",
      "A real screen reader was not driven through the eight controls.",
      "Equal addends (1/2 + 1/2) were checked in the unit tests, not by hand in the browser.",
    ],
  },
];

export function evidenceFor(model: InteractiveModelId): ModelEvidence | undefined {
  return MODEL_EVIDENCE.find((e) => e.model === model);
}

/** The count a dashboard may print. A model with no browser pass is not counted,
 *  whatever its build status. */
export function browserVerifiedModels(): InteractiveModelId[] {
  return MODEL_EVIDENCE.filter((e) => e.verifiedOn !== null).map((e) => e.model);
}
