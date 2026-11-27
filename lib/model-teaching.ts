// ─────────────────────────────────────────────────────────────────────────────
// MODEL TEACHING — what a model is FOR, asked before it is touched.
//
// A model on a lesson page has three jobs that a drawing alone cannot do:
//
//   1. STATE THE OBJECTIVE. "Two searches, same list" names the picture; it does
//      not say what the learner will be able to do. The objective here is
//      action-first and specific to the CONCEPT, because one model can serve
//      several concepts with different units (the number line is negatives for
//      one concept, tenths for another and tens for a third, and a single
//      objective would be wrong for two of them).
//
//   2. ASK FOR A PREDICTION BEFORE THE INTERACTION. A learner who presses buttons
//      without committing to an expectation watches an animation; a learner who
//      has just said "I think halving will win" is testing a belief, and the
//      reveal stays withheld until then — an answer printed beside the question is
//      a caption, not a prediction. Two shapes, because one does not fit every
//      subject: a CHOICE that refutes a named belief, and a DESCRIBE box for a
//      relationship the learner puts into their own words. A description is not
//      marked (prose cannot be scored — `lib/peer-review.ts`), commits on length
//      alone, and says so on the screen. Confidence is optional, used only for the
//      calibration sentence, and never stored.
//
//   3. SAY WHAT IT CANNOT SHOW. The assumptions module (`model-assumptions.ts`)
//      is the considered statement for a subject teacher; this module points at
//      it and adds the one line a learner needs: what to do next.
//
// This file is data, not logic: the suite can assert every modelled concept has
// an objective, a prediction with exactly one right option, a reveal that says
// WHY, an apply step and teacher notes — which is the checklist a reviewer would
// otherwise have to remember. Nothing here is a claim that a teacher approved it:
// the packs generated from it say NOT REVIEWED, and remain so until a person acts.
// ─────────────────────────────────────────────────────────────────────────────

import type { InteractiveModelId } from "./interactive-models";

export interface PredictionOption {
  /** Stable id, so a stored or tested choice cannot depend on the label's text. */
  readonly id: string;
  readonly label: string;
}

// ── TWO WAYS TO COMMIT A PREDICTION ────────────────────────────────────────
//
// A choice is right where the model refutes ONE named belief: "1/8 or 1/4" is
// answerable in a second and the reveal can speak to that exact error. It is wrong
// where the answer is a relationship — three offered sentences teach recognition,
// not prediction. So `choice` keeps the contract it had (three or more options, one
// right, a reveal that says why) and `describe` takes a sentence, marks nothing,
// and commits on LENGTH alone.
export interface ModelPredictionChoice {
  readonly kind: "choice";
  /** One question, answerable from what the lesson has already taught. */
  readonly question: string;
  /** At least three: two is a coin toss, and a coin toss is not a belief. */
  readonly options: readonly PredictionOption[];
  /** The id of the option the model will show to be right. */
  readonly answerId: string;
  /** Printed only AFTER a choice: why the right answer is right, and why the
   *  tempting one is not. */
  readonly reveal: string;
}

export interface ModelPredictionDescribe {
  readonly kind: "describe";
  readonly question: string;
  /** What to put in the box, in one line — the shape of the answer, not its
   *  content. */
  readonly prompt: string;
  /** Printed after committing: what the model shows, and which part of a
   *  description it tests. */
  readonly reveal: string;
  /** What a learner should check their own sentence against. Never a mark: these
   *  are the ideas the model will display, not a scoring key. */
  readonly lookFor: readonly string[];
}

export type ModelPrediction = ModelPredictionChoice | ModelPredictionDescribe;

/** The optional confidence question, asked beside the prediction. Three options,
 *  no default, and nothing is stored: its job is the calibration sentence the
 *  learner reads when the model answers, which is a teaching move rather than a
 *  measurement. Asking it without using it would be a form that collects a
 *  feeling and does nothing with it. */
export const CONFIDENCE_OPTIONS = [
  { id: "confident", label: "I'm confident" },
  { id: "unsure", label: "I'm not sure" },
  { id: "guess", label: "I'm making a guess" },
] as const;
export type ConfidenceId = (typeof CONFIDENCE_OPTIONS)[number]["id"];

/** Enough words to be a claim rather than a keystroke. Length only: the project
 *  does not judge the prose, and a describe frame that pretended to would be the
 *  peer-review mistake again in a new place. */
export function describeCommitted(text: string): boolean {
  const words = text.trim().split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));
  return words.length >= 4;
}

// WHAT TO SAY, BY CONFIDENCE AND BY WHETHER THE MODEL AGREED. Tables rather than
// nested ternaries: six sentences, two axes, and a table is the shape that cannot
// silently drop one of the combinations when a line is edited.
const WHEN_AGREES: Record<ConfidenceId, string> = {
  confident:
    "You were confident and the model agrees. That is the state to notice — and it is evidence because the model was used, not because you said so.",
  unsure: "You were unsure and the model agrees. A belief you doubted is one you can now lean on.",
  guess:
    "You were guessing and the model agrees. A guess that holds is worth examining: which part of your reason made it right?",
};

const WHEN_DIFFERS: Record<ConfidenceId, string> = {
  confident:
    "You were confident and the model shows something else. That gap is the most useful thing on this page — read the reveal and name the part of your reason it contradicts.",
  unsure: "You were not sure, and the model shows something else. Nothing was lost by saying so: the model is here to change the answer, not to test you.",
  guess: "You were not sure, and the model shows something else. Nothing was lost by saying so: the model is here to change the answer, not to test you.",
};

/** What the learner reads about their own confidence once the model has answered.
 *  `correct: null` means the prediction was a description, which is not marked —
 *  the sentence then only tells them what to watch for. */
export function calibrationSentence(confidence: ConfidenceId | null, correct: boolean | null): string | null {
  if (!confidence) return null;
  if (correct === null) {
    const label = CONFIDENCE_OPTIONS.find((c) => c.id === confidence)?.label ?? confidence;
    return `You said: "${label.toLowerCase()}". Hold that in mind while the model runs, then ask whether what you described is what it showed.`;
  }
  return (correct ? WHEN_AGREES : WHEN_DIFFERS)[confidence];
}

/** What a teacher needs to run this in a room. Written by the project, not by a
 *  reviewer, and labelled as such wherever it is printed. */
export interface ModelTeacherNotes {
  /** What the teacher does at the board, before the class touches anything. */
  readonly demonstrate: readonly string[];
  /** Questions to ask while it runs — the ones that expose the belief. */
  readonly ask: readonly string[];
  /** One guided activity, whole class or pairs. */
  readonly guided: string;
  /** What a class does when there is no device. Not "the same, on paper":
   *  the interaction's job, done another way. */
  readonly printable: string;
  /** What to look for that shows the idea has landed, and what a wrong answer
   *  here usually means. */
  readonly assessment: string;
  /** Where to go next, in the sequence rather than in the product. */
  readonly followUp: readonly string[];
}

export interface ModelTeaching {
  /** The concept whose lesson renders this model. Keyed by concept, not model:
   *  the number line teaches three different units. */
  readonly conceptId: string;
  readonly model: InteractiveModelId;
  /** Action-first: "Decide…", "Read…", "Say why…". */
  readonly objective: string;
  readonly predict: ModelPrediction;
  /** What the learner does with the idea once the model has been used. */
  readonly apply: string;
  readonly teacher: ModelTeacherNotes;
}

export const MODEL_TEACHING: readonly ModelTeaching[] = [
  // ── MATHS · PLACE VALUE ────────────────────────────────────────────────────
  {
    conceptId: "place-value",
    model: "number-line-model",
    objective: "Say what each digit in a number is worth, and show what moving one place does to its value.",
    predict: {
      kind: "choice",
      question: "The line's ticks are tens and the marker is at 340. How many moves from zero is that?",
      options: [
        { id: "34", label: "34 moves" },
        { id: "340", label: "340 moves" },
        { id: "3.4", label: "3.4 moves" },
      ],
      answerId: "34",
      reveal:
        "34 moves: one move is ten, so 340 is thirty-four tens. The digit 3 is worth 300 — thirty moves — and the 4 adds four more. Counting the ticks rather than the digits is the whole point: '340 moves' counts ones on a line that has none.",
    },
    apply: "Pick any number on the line and say its value in tens before you read the sentence under it.",
    teacher: {
      demonstrate: [
        "Draw a line on the board marked 0, 100, 200 … 1000 and put a marker at 340. Ask how many jumps of ten that is before anyone touches a device.",
        "Then move the marker one tick and ask what has changed about the number: the tens digit, not the hundreds.",
      ],
      ask: [
        "Which digit changed when we moved one tick, and by how much is the number now different?",
        "If one move is ten, what would one move have to be to show the 4 changing?",
      ],
      guided:
        "Pairs: one learner names a number on the line, the other says how many tens it is from zero and which digit the move changed. Swap after five numbers.",
      printable: "A blank 0–1000 number line in tens, with six markers to place and a column for 'value of the 3' and 'value of the 4'.",
      assessment:
        "A learner who has the idea counts ticks in tens and says which digit moved. A learner who says '340 moves' is still counting ones on a line whose unit is ten — the misconception this model exists for, and it needs the unit named again, not more practice.",
      followUp: ["Multiplying and dividing by ten and a hundred.", "Reading and writing large numbers from their digits."],
    },
  },

  // ── MATHS · NEGATIVES ─────────────────────────────────────────────────────
  {
    conceptId: "negatives",
    model: "number-line-model",
    objective: "Compare two numbers below zero, and say which way the answer goes when you move along the line.",
    predict: {
      kind: "choice",
      question: "The marker is at −5. Is −5 greater than −2, less than −2, or the same?",
      options: [
        { id: "greater", label: "Greater — 5 is bigger than 2" },
        { id: "less", label: "Less — it is further left" },
        { id: "same", label: "The same — the sign does not change the size" },
      ],
      answerId: "less",
      reveal:
        "Less. On the left of zero the order runs the other way: −5 is further from zero than −2 but further LEFT, and further left is smaller. The digits say 5 is bigger than 2; the line says the number is lower. That is exactly why the model prints both neighbours of the marker.",
    },
    apply: "Move the marker twice more and say which way the number went before you read the sentence.",
    teacher: {
      demonstrate: [
        "Draw a vertical number line as a lift shaft in an underground car park: ground is 0, each floor below is negative. Ask which floor is lower, −2 or −5.",
        "Mark −3 and ask for the number one step right and one step left, so the direction is read off the diagram rather than the digits.",
      ],
      ask: [
        "Which is colder, −2 °C or −5 °C, and what does that tell you about which number is smaller?",
        "How far is −5 from zero, and is that distance the same as its value?",
      ],
      guided:
        "Give pairs a shuffled set of cards from −10 to +10 and one number line. They order the cards, then check each neighbouring pair against the line.",
      printable: "A −10 to +10 line to draw on, ten integers to place, and three comparison statements to complete with < or >.",
      assessment:
        "Look for learners comparing by distance from zero rather than by position. A correct answer with the reason 'because 5 is bigger' is not yet the idea — ask which is further left.",
      followUp: ["Adding and subtracting negatives.", "Coordinates in four quadrants."],
    },
  },

  // ── MATHS · FRACTIONS ─────────────────────────────────────────────────────
  {
    conceptId: "fractions",
    model: "fraction-line-model",
    objective: "Read a fraction as a position on a number line, and say why 1/8 is smaller than 1/4 although 8 is bigger.",
    predict: {
      kind: "choice",
      question: "Which is the larger number: 1/8 or 1/4?",
      options: [
        { id: "eighth", label: "1/8 — 8 is bigger than 4" },
        { id: "quarter", label: "1/4 — the pieces are bigger" },
        { id: "same", label: "They are the same" },
      ],
      answerId: "quarter",
      reveal:
        "1/4 is larger. Cutting the same whole into more pieces makes each piece smaller, so one of eight is nearer zero than one of four. On the line, 1/8 sits to the LEFT of 1/4 — the position is the fact, and the digits alone say the opposite.",
    },
    apply: "Change the cut and predict which way the marker will move before you press.",
    teacher: {
      demonstrate: [
        "Fold one strip of paper into quarters and an identical strip into eighths. Put them one above the other on the desk so the shorter piece is visible, not asserted.",
        "Mark both fractions on a single number line from 0 to 1 and ask which is nearer 1/2.",
      ],
      ask: [
        "The bottom number got bigger — what happened to the piece, and why?",
        "Which is nearer one half: 3/8 or 3/4? How can you tell from the line without a calculation?",
      ],
      guided:
        "Pairs cut a strip into equal pieces, label each cut as a fraction of the whole, then place a counter at 3/4 and 5/8 and decide which is further right.",
      printable: "Two strips to fold (quarters and eighths), a 0–1 line to mark, and four comparisons to decide with the line only.",
      assessment:
        "The idea is present when the learner points at the line rather than reasoning from the digits. 'The bigger bottom means a bigger fraction' is the misconception; re-teach with the fold, not with more shading.",
      followUp: ["Equivalent fractions.", "Adding fractions with the same denominator."],
    },
  },

  // ── MATHS · ADDING FRACTIONS ──────────────────────────────────────────────
  {
    conceptId: "fraction-ops",
    model: "fraction-ops-model",
    objective: "Add two fractions with different bottoms by making the pieces the same size first, and say why the bottoms are never added.",
    predict: {
      kind: "choice",
      question: "A learner works out 1/2 + 1/3 by adding tops and bottoms and writes 2/5. Is 2/5 bigger than 1/2, smaller, or the same?",
      options: [
        { id: "bigger", label: "Bigger — you added something to it" },
        { id: "smaller", label: "Smaller — 2/5 is less than a half" },
        { id: "same", label: "The same — the method is valid" },
      ],
      answerId: "smaller",
      reveal:
        "Smaller: 2/5 is 0.4 and 1/2 is 0.5. Adding a positive amount cannot make a number smaller, so 2/5 cannot be the sum — the method has produced an answer that is impossible, not merely inaccurate. Renaming both fractions in sixths gives 3/6 + 2/6 = 5/6.",
    },
    apply: "Change one fraction and say which common denominator you expect before you check.",
    teacher: {
      demonstrate: [
        "Write 1/2 + 1/3 on the board and ask for an estimate first: 'is the answer more than one half?'. Every learner should say yes before any method appears.",
        "Draw both fractions as bars cut in sixths so the pieces can be counted in the same unit.",
      ],
      ask: [
        "Why can we not add the bottoms? What would the bottom number be measuring?",
        "Is there a sum of two positive fractions that is smaller than one of them? Why not?",
      ],
      guided:
        "Pairs sort six cards — three true sums, three made by adding tops and bottoms — into 'possible' and 'impossible', and must give a reason that does not involve calculating.",
      printable: "Two bar diagrams per question cut into twelfths, with space to rename each fraction and write the sum.",
      assessment:
        "Listen for 'a sum is bigger than its parts' as the check. A learner who gets the right answer by a remembered procedure but cannot reject 2/5 for 1/2 + 1/3 has not yet got the reason.",
      followUp: ["Subtracting fractions with different denominators.", "Mixed numbers and improper fractions."],
    },
  },

  // ── MATHS · DECIMALS ──────────────────────────────────────────────────────
  {
    conceptId: "decimals",
    model: "number-line-model",
    objective: "Read a decimal by its place value, and place two decimals in order without being misled by the number of digits.",
    predict: {
      kind: "choice",
      question: "Which is larger: 0.45 or 0.5?",
      options: [
        { id: "45", label: "0.45 — 45 is bigger than 5" },
        { id: "5", label: "0.5 — five tenths is more than four tenths" },
        { id: "same", label: "They are the same" },
      ],
      answerId: "5",
      reveal:
        "0.5 is larger: it is five tenths, while 0.45 is four tenths and five hundredths. More digits does not mean a bigger number — the place each digit sits in decides its value, which is what the line shows when you step in tenths.",
    },
    apply: "Place three decimals on the line in your head and put them in order before you check with the marker.",
    teacher: {
      demonstrate: [
        "Write 0.45 and 0.5 side by side and read both aloud as fractions of a hundred: 45 hundredths against 50 hundredths.",
        "Then show them on one line to tenths and ask why 0.45 is not at a tick.",
      ],
      ask: [
        "Which digit tells you the most about the size: the first one after the point or the last?",
        "0.45 has more digits than 0.5. Why is that not evidence that it is bigger?",
      ],
      guided:
        "Pairs order a set of decimal cards by placing them on a 0–2 line first, then checking the order by reading each aloud as hundredths.",
      printable: "A 0–2 line marked in tenths, six decimals to place, and a table to write each as 'tenths and hundredths'.",
      assessment:
        "A learner who orders correctly but cannot read 0.45 as 45 hundredths has a rule, not a concept. Ask them to say the number aloud in words.",
      followUp: ["Multiplying and dividing decimals by ten.", "Rounding to one and two decimal places."],
    },
  },

  // ── SCIENCE · CIRCUITS ────────────────────────────────────────────────────
  {
    conceptId: "electricity-circuits",
    model: "circuit-model",
    objective: "Predict what adding a cell or a bulb does to the current, and explain it with V = IR rather than with 'more power'.",
    predict: {
      kind: "choice",
      question: "One cell and one bulb. You add a second identical bulb in series. What happens to the current?",
      options: [
        { id: "same", label: "It stays the same — the cell is unchanged" },
        { id: "half", label: "It halves — the circuit's resistance doubles" },
        { id: "double", label: "It doubles — there are more bulbs to carry it" },
      ],
      answerId: "half",
      reveal:
        "It halves. A cell holds a nearly fixed potential difference, not a fixed current; adding an identical bulb doubles the resistance and I = V/R falls to half. That is why the second bulb is dimmer than the first was — energy is taken from the charge, not charge itself.",
    },
    apply: "Before adding anything, say what you expect the ammeter to read and why; then check.",
    teacher: {
      demonstrate: [
        "Build one cell and one bulb with an ammeter, then add a second identical bulb in series with the meter still in place. Ask for a prediction before closing the switch.",
        "Move the switch to the other side of the loop and ask whether the brightness changes.",
      ],
      ask: [
        "Is the current the same before and after the first bulb? What is used up — charge or energy?",
        "Two cells and two bulbs is as bright as one cell and one bulb. What does that tell you about what brightness depends on?",
      ],
      guided:
        "Groups are given the model and a table to complete: cells, bulbs, current, brightness. They must predict each row before pressing the button and mark whether the prediction held.",
      printable: "A circuit diagram to annotate with ammeter readings, and a six-row prediction table for cells and bulbs.",
      assessment:
        "The belief is visible in the reasoning: 'the cell gives a fixed current' predicts 'same'. Learners who fix the model but still explain with 'more power' need the V = IR substitution made explicit.",
      followUp: ["Parallel circuits and the resistance rule.", "Electrical power and the heating effect."],
    },
  },

  // ── SCIENCE · ATOMS ───────────────────────────────────────────────────────
  {
    conceptId: "atoms-elements",
    model: "atom-model",
    objective: "Decide which element an atom is from its particle counts, and say what a neutron or an electron changes instead.",
    // A DESCRIBE PREDICTION, not a choice. The belief is a distinction between
    // three particle counts, and a learner who has to write what each atom becomes
    // has to commit to the distinction itself; three offered sentences would let
    // them pick the one that sounds most scientific.
    predict: {
      kind: "describe",
      question: "One carbon-12 atom gains a neutron; another carbon-12 atom gains a proton. Describe what each atom becomes.",
      prompt: "A sentence for each: the element it is now, and whether its mass, its charge or its identity changed.",
      reveal:
        "The model shows the first still named carbon, with its mass number one higher — carbon-13, an isotope of carbon. The second is nitrogen: the proton count changed, so the element changed with it. A neutron changes the mass, a proton changes the identity, and an electron changes only the charge.",
      lookFor: [
        "that the atom which gained a neutron is still carbon",
        "that the atom which gained a proton is a different element",
        "which count decides the name and which one only changes the mass",
      ],
    },
    apply: "Change one particle count and name the element, the isotope and the charge before you check.",
    teacher: {
      demonstrate: [
        "Write the proton count for hydrogen, carbon and calcium and ask what changes when the neutron count changes. Then add a proton in the model and let the class watch the name change.",
        "Contrast this with an electron change: same element, now charged.",
      ],
      ask: [
        "Which count decides the element, and which two counts do not?",
        "An ion of sodium and an atom of sodium: same element? Same charge? Same mass number?",
      ],
      guided:
        "Pairs are given six sets of particle counts and must name the element, the isotope and the charge, then check each against the model.",
      printable: "A table of particle counts to complete with element name, isotope label and charge, plus a blank shell diagram to label.",
      assessment:
        "A learner who says 'a neutron makes a new element' holds the target misconception. Ask them to name the element after adding a neutron and then after adding a proton: the two answers must differ.",
      followUp: ["Electron shells and the periodic table.", "Relative atomic mass and isotopic abundance."],
    },
  },

  // ── SCIENCE · CELLS ───────────────────────────────────────────────────────
  {
    conceptId: "cells",
    model: "cell-model",
    objective: "Explain what each cell part does by what stops working without it, and say why a plant cell can lack chloroplasts.",
    // ALSO A DESCRIBE PREDICTION. The three options used to be three verdicts
    // (yes / no / only in daylight), which is a coin toss dressed as a belief. The
    // relationship is what matters: a part stops a job, it does not stop the cell.
    predict: {
      kind: "describe",
      question: "A root hair cell is a plant cell with no chloroplasts. Describe what it can no longer do, and what it can still do.",
      prompt: "Two sentences: what the missing part stops, and where the energy it still needs comes from.",
      reveal:
        "The model shows the jobs that stop when a part is switched off: without chloroplasts the cell cannot make glucose from light, while every other part keeps working. Mitochondria are still there, so it can release energy from glucose that the leaves made and sent down to the root. Losing one part is not the same as the cell dying.",
      lookFor: [
        "that it can still release energy from glucose",
        "that the glucose now has to arrive from somewhere else",
        "that a part stopping its job is not the cell dying",
      ],
    },
    apply: "Switch a part off and say what will stop working before you read the sentence.",
    teacher: {
      demonstrate: [
        "Show the plant cell and switch the chloroplast off. Ask what the cell can no longer do, and then what it can still do.",
        "Switch the wall off and ask why the shape changes while the cell does not die.",
      ],
      ask: [
        "Which parts do both cell types have, and why would both need them?",
        "What is the difference between a part stopping its job and the cell dying?",
      ],
      guided:
        "Pairs are given four cell types (root hair, leaf palisade, animal muscle, bacterial) and must tick the parts each has, then explain one absence.",
      printable: "Two blank cell outlines to label, and a table of parts against cell types with one 'why it is absent' column.",
      assessment:
        "Listen for 'the plant cell is an animal cell plus a wall and chloroplasts'. The correction is the vacuole and the absence of chloroplasts in root cells, not a longer list.",
      followUp: ["Specialised cells and their shapes.", "Photosynthesis and respiration compared."],
    },
  },

  // ── COMPUTING · SEARCHING ─────────────────────────────────────────────────
  {
    conceptId: "algorithms-search",
    model: "search-model",
    objective: "Choose between checking one at a time and halving the list for a particular list and target, and justify the choice with the number of looks.",
    predict: {
      kind: "choice",
      question: "The list is sorted and has 14 items. The item you want is the FIRST one. Which finds it with fewer looks?",
      options: [
        { id: "binary", label: "Halving — it is always faster" },
        { id: "linear", label: "One at a time — it is the first item" },
        { id: "tie", label: "They take the same number of looks" },
      ],
      answerId: "linear",
      reveal:
        "One at a time: the first item is found in one look, while halving starts in the middle and needs three. Halving wins on the long search and loses on this one, so 'binary is better' is not a rule — it depends on the list and on what you are looking for.",
    },
    apply: "Pick two targets, predict which algorithm wins each, then step both and compare with your prediction.",
    teacher: {
      demonstrate: [
        "Write the fourteen numbers on the board and find the first one by both methods in front of the class, counting the looks out loud.",
        "Then shuffle the cards and try halving: the point is that it cannot start, not that it gives a wrong answer.",
      ],
      ask: [
        "What does halving need to be true about the list before it can start?",
        "When is checking one at a time the better choice?",
        "What work is missing from our count when we say halving took three looks?",
      ],
      guided:
        "Pairs play the algorithm on paper with a row of cards, one learner turning cards and the other recording the number of looks; they then swap roles for a target near the end.",
      printable: "A strip of 14 sorted numbers to cut into cards, a tally sheet for looks, and three targets to find by both methods.",
      assessment:
        "A learner who answers 'halving, because it is faster' for the first item has the belief the model exists to refute. Ask for the count on this list, then on a target near the end.",
      followUp: ["Sorting algorithms and why order costs work.", "Big-O growth, once the counting is secure."],
    },
  },
];

export function teachingForConcept(conceptId: string): ModelTeaching | undefined {
  return MODEL_TEACHING.find((m) => m.conceptId === conceptId);
}

/** The first record for a model — used where only the model is known (a pack, a
 *  dashboard). A concept-specific caller must use `teachingForConcept`: the
 *  number line has three objectives and this function can only return one. */
export function teachingForModel(model: InteractiveModelId): ModelTeaching | undefined {
  return MODEL_TEACHING.find((m) => m.model === model);
}

export interface PredictionVerdict {
  readonly correct: boolean;
  /** What the learner reads after committing. Never "wrong" on its own: the
   *  sentence that follows is the teaching. */
  readonly sentence: string;
}

/** The verdict for a committed prediction. Pure, so the suite can check that the
 *  reveal is only reached by choosing, and that the right option is the one the
 *  model actually shows. */
export function predictionVerdict(teaching: ModelTeaching, choiceId: string): PredictionVerdict | null {
  // A DESCRIBE PREDICTION HAS NO RIGHT OPTION, so it has no verdict. Returning
  // null rather than inventing a pass keeps "nothing is marked" true in the type
  // as well as in the copy.
  if (teaching.predict.kind !== "choice") return null;
  const correct = choiceId === teaching.predict.answerId;
  return {
    correct,
    sentence: correct
      ? `That is the answer the model is built to show. ${teaching.predict.reveal}`
      : `That is the tempting answer, and the model is built to test it. ${teaching.predict.reveal}`,
  };
}
