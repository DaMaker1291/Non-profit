// ─────────────────────────────────────────────────────────────────────────────
// PILOT MODELS — atoms, cells and searching, as arithmetic rather than pictures.
//
// Same discipline as `lib/interactive-models.ts`: every sentence a component
// prints rests on a value computed HERE, so the suite can drive the model and
// check the answer without a browser. No React, no DOM, no dates.
//
// Each model exists to make one misconception refutable BY THE LEARNER:
//
//   atoms   — "a different number of neutrons makes a different element"
//   cells   — "a plant cell is just an animal cell with a wall"
//   search  — "binary search is the better algorithm, always"
//
// The `..._BELIEFS` tables are claims about these models, checked in the suite,
// and each names a source in `lib/learning-research.ts` so a pedagogical claim is
// traceable to something a person read.
// ─────────────────────────────────────────────────────────────────────────────

// ═════════════════════════════════════════════════════════════════════════════
// ATOMS — protons decide the element; neutrons and electrons do not.
// ═════════════════════════════════════════════════════════════════════════════

export interface AtomState {
  readonly protons: number;
  readonly neutrons: number;
  readonly electrons: number;
}

/** The first twenty elements, by proton count. Symbol and name come from the
 *  table rather than from a formula: "which element is this" is a lookup, and a
 *  generated name would be a lie with a correct shape. */
const ELEMENTS: readonly { readonly z: number; readonly symbol: string; readonly name: string }[] = [
  { z: 1, symbol: "H", name: "hydrogen" },
  { z: 2, symbol: "He", name: "helium" },
  { z: 3, symbol: "Li", name: "lithium" },
  { z: 4, symbol: "Be", name: "beryllium" },
  { z: 5, symbol: "B", name: "boron" },
  { z: 6, symbol: "C", name: "carbon" },
  { z: 7, symbol: "N", name: "nitrogen" },
  { z: 8, symbol: "O", name: "oxygen" },
  { z: 9, symbol: "F", name: "fluorine" },
  { z: 10, symbol: "Ne", name: "neon" },
  { z: 11, symbol: "Na", name: "sodium" },
  { z: 12, symbol: "Mg", name: "magnesium" },
  { z: 13, symbol: "Al", name: "aluminium" },
  { z: 14, symbol: "Si", name: "silicon" },
  { z: 15, symbol: "P", name: "phosphorus" },
  { z: 16, symbol: "S", name: "sulfur" },
  { z: 17, symbol: "Cl", name: "chlorine" },
  { z: 18, symbol: "Ar", name: "argon" },
  { z: 19, symbol: "K", name: "potassium" },
  { z: 20, symbol: "Ca", name: "calcium" },
];

export const ATOM_LIMITS = { protons: 20, neutrons: 25, electrons: 22 } as const;

export type AtomNote = "neutral-atom" | "ion" | "not-an-element";

export interface AtomReading {
  readonly protons: number;
  readonly neutrons: number;
  readonly electrons: number;
  /** Protons + neutrons. */
  readonly massNumber: number;
  /** Protons − electrons: the charge in units of +e. */
  readonly charge: number;
  readonly symbol: string | null;
  readonly elementName: string | null;
  /** e.g. "carbon-14", or null when there is no element to name. */
  readonly isotopeLabel: string | null;
  readonly note: AtomNote;
  /** The sentence the component prints. Built here so the test can read it. */
  readonly sentence: string;
}

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.round(value)));
}

export function readAtom(state: AtomState): AtomReading {
  const protons = clamp(state.protons, ATOM_LIMITS.protons);
  const neutrons = clamp(state.neutrons, ATOM_LIMITS.neutrons);
  const electrons = clamp(state.electrons, ATOM_LIMITS.electrons);
  const element = ELEMENTS.find((e) => e.z === protons) ?? null;
  const massNumber = protons + neutrons;
  const charge = protons - electrons;

  // NO PROTONS, NO ELEMENT. An atom with no protons is not hydrogen-with-a-problem;
  // it is not a chemical element at all, and the model says so instead of printing
  // a symbol for zero.
  if (!element) {
    return {
      protons,
      neutrons,
      electrons,
      massNumber,
      charge,
      symbol: null,
      elementName: null,
      isotopeLabel: null,
      note: "not-an-element",
      sentence: `With ${protons} proton${protons === 1 ? "" : "s"} there is no element to name: the number of protons is what decides which element an atom is.`,
    };
  }

  const isotopeLabel = `${element.name}-${massNumber}`;
  const note: AtomNote = charge === 0 ? "neutral-atom" : "ion";
  const chargeWords =
    charge === 0
      ? "It is neutral: as many electrons as protons."
      : charge > 0
        ? `It is an ion with charge +${charge}: it has ${Math.abs(charge)} fewer electron${Math.abs(charge) === 1 ? "" : "s"} than protons.`
        : `It is an ion with charge ${charge}: it has ${Math.abs(charge)} more electron${Math.abs(charge) === 1 ? "" : "s"} than protons.`;

  return {
    protons,
    neutrons,
    electrons,
    massNumber,
    charge,
    symbol: element.symbol,
    elementName: element.name,
    isotopeLabel,
    note,
    // THE ORDER OF THE SENTENCE IS THE LESSON: protons name the element, neutrons
    // only make a heavier version of it, electrons only make it charged.
    sentence: `${protons} proton${protons === 1 ? "" : "s"} ${protons === 1 ? "makes" : "make"} ${element.name} (${element.symbol}), whatever the neutrons do. ${neutrons} neutron${neutrons === 1 ? "" : "s"} and ${electrons} electron${electrons === 1 ? "" : "s"} give ${isotopeLabel}, mass number ${massNumber}. ${chargeWords}`,
  };
}

export interface AtomBelief {
  readonly id: "neutrons-change-element" | "electrons-change-element" | "protons-decide" | "ion-is-charged";
  readonly belief: string;
  readonly holds: boolean;
  readonly why: string;
  readonly sourceId: string;
}

export const ATOM_BELIEFS: readonly AtomBelief[] = [
  {
    id: "neutrons-change-element",
    belief: "Adding a neutron turns the atom into a different element.",
    holds: false,
    why: "Neutrons change the mass, not the identity. Carbon with six neutrons and carbon with eight are both carbon — they are isotopes of it. The model keeps the name and changes only the mass number.",
    sourceId: "arc-vic-atomic-structure",
  },
  {
    id: "electrons-change-element",
    belief: "Adding an electron turns the atom into a different element.",
    holds: false,
    why: "Electrons change the charge, not the identity. An atom that gains an electron is an ion of the same element — the model shows the same symbol with a charge.",
    sourceId: "rsc-atoms-isotopes-14-16",
  },
  {
    id: "protons-decide",
    belief: "The number of protons decides which element it is.",
    holds: true,
    why: "The proton count is the element's identity: one proton is hydrogen, six is carbon, twenty is calcium. Everything else about the atom is a variation on that.",
    sourceId: "canterbury-2015-atomic-structure",
  },
  {
    id: "ion-is-charged",
    belief: "An ion is an atom whose electrons no longer match its protons.",
    holds: true,
    why: "Ions are charged because the electron count differs from the proton count — the model reports the difference as the charge.",
    sourceId: "rsc-atoms-isotopes-14-16",
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// CELLS — structure exists because of the job it does.
// ═════════════════════════════════════════════════════════════════════════════

export type CellType = "plant" | "animal";

export interface Organelle {
  readonly id: string;
  readonly name: string;
  readonly job: string;
  readonly inPlant: boolean;
  readonly inAnimal: boolean;
  /** What stops working when it cannot do its job. Never "the cell dies". */
  readonly without: string;
}

export const ORGANELLES: readonly Organelle[] = [
  {
    id: "membrane",
    name: "cell membrane",
    job: "decides what enters and leaves the cell",
    inPlant: true,
    inAnimal: true,
    without: "nothing controls what crosses the boundary, so the contents of the cell are no longer kept separate from the outside",
  },
  {
    id: "nucleus",
    name: "nucleus",
    job: "holds the DNA that says which proteins the cell can make",
    inPlant: true,
    inAnimal: true,
    without: "the cell cannot make new proteins to its instructions, so it cannot repair itself or carry out the reactions those proteins run",
  },
  {
    id: "mitochondria",
    name: "mitochondria",
    job: "release energy from glucose by respiration",
    inPlant: true,
    inAnimal: true,
    without: "the cell has far less usable energy released from glucose, so work that needs energy — moving substances, building molecules — slows or stops",
  },
  {
    id: "ribosomes",
    name: "ribosomes",
    job: "build proteins from the instructions the nucleus sends out",
    inPlant: true,
    inAnimal: true,
    without: "proteins are not assembled, so enzymes, membrane proteins and structural proteins are not replaced",
  },
  {
    id: "cell-wall",
    name: "cell wall",
    job: "gives the cell a fixed shape and keeps it from bursting when water enters",
    inPlant: true,
    inAnimal: false,
    without: "the cell can no longer hold a fixed shape, and takes in water until the membrane is under strain",
  },
  {
    id: "chloroplast",
    name: "chloroplast",
    job: "absorbs light and makes glucose by photosynthesis",
    inPlant: true,
    inAnimal: false,
    without: "the cell cannot make its own glucose from light, so it depends entirely on glucose made elsewhere",
  },
  {
    id: "vacuole",
    name: "large vacuole",
    job: "stores sap and keeps the cell firm by pushing outwards",
    inPlant: true,
    inAnimal: false,
    without: "the cell loses the internal pressure that keeps it firm, so it can sag",
  },
];

export interface CellReading {
  readonly type: CellType;
  readonly present: readonly string[];
  readonly missing: readonly string[];
  /** Organelles this cell type has but the learner has switched off. */
  readonly broken: readonly Organelle[];
  readonly sentence: string;
}

/** Which organelles this cell type actually has. A plant cell is not an animal
 *  cell with extras: animal cells have no wall, no chloroplast and no large
 *  vacuole, and the model will not let a learner add them, because a model that
 *  can be made wrong on purpose teaches the wrong thing. */
export function organellesFor(type: CellType): readonly Organelle[] {
  return ORGANELLES.filter((o) => (type === "plant" ? o.inPlant : o.inAnimal));
}

export function readCell(type: CellType, presentIds: readonly string[]): CellReading {
  const available = organellesFor(type);
  const present = available.filter((o) => presentIds.includes(o.id)).map((o) => o.id);
  const missing = available.filter((o) => !present.includes(o.id)).map((o) => o.id);
  const broken = available.filter((o) => !present.includes(o.id));
  const label = type === "plant" ? "plant cell" : "animal cell";
  const article = type === "plant" ? "A" : "An";
  const sentence =
    broken.length === 0
      ? `${article} ${label} with all ${available.length} of its parts working: each part is doing the job it exists for.`
      : `${article} ${label} with ${broken.length} part${broken.length === 1 ? "" : "s"} not working — ${broken
          .map((o) => `${o.name}: ${o.without}`)
          .join("; ")}.`;
  return { type, present, missing, broken, sentence };
}

export interface CellBelief {
  readonly id: "plant-is-animal-plus-extras" | "only-animals-have-mitochondria" | "wall-gives-shape" | "chloroplast-feeds";
  readonly belief: string;
  readonly holds: boolean;
  readonly why: string;
  readonly sourceId: string;
}

export const CELL_BELIEFS: readonly CellBelief[] = [
  {
    id: "plant-is-animal-plus-extras",
    belief: "A plant cell is an animal cell with a wall and chloroplasts added.",
    holds: false,
    why: "They differ in both directions: plant cells also have a large permanent vacuole and no animal cell has a wall or chloroplasts at all. The model switches the whole set when you change the cell type.",
    sourceId: "eric-2015-draw-write-cells",
  },
  {
    id: "only-animals-have-mitochondria",
    belief: "Only animal cells respire, so only they have mitochondria.",
    holds: false,
    why: "Plant cells respire too, day and night, and have mitochondria for it. Photosynthesis makes glucose; respiration releases energy from it — a plant needs both.",
    sourceId: "atlantis-2021-organelle-misconceptions",
  },
  {
    id: "wall-gives-shape",
    belief: "The cell wall is what gives a plant cell its fixed shape.",
    holds: true,
    why: "The wall is rigid and the membrane is not, so removing the wall is what costs the cell its shape — the model says exactly that when you switch it off.",
    sourceId: "eric-2015-draw-write-cells",
  },
  {
    id: "chloroplast-feeds",
    belief: "A cell without chloroplasts cannot make its own glucose.",
    holds: true,
    why: "Photosynthesis happens in the chloroplast, so without one the cell depends on glucose made elsewhere — which is the situation of every animal cell.",
    sourceId: "eric-2025-photosynthesis-misconceptions",
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// NUMBER LINES — direction and order, in the unit each concept is about.
// ═════════════════════════════════════════════════════════════════════════════

export interface NumberLineSpec {
  readonly min: number;
  readonly max: number;
  /** The size of one move, in the concept's own unit. */
  readonly step: number;
  readonly start: number;
  /** What one move is called: "ones", "tenths", "tens". */
  readonly unit: string;
}

/** The three concepts that genuinely need a line rather than a picture of one.
 *  Kept as data beside the model so a fourth cannot be added by hoping. */
export const NUMBER_LINE_BY_CONCEPT: Readonly<Record<string, NumberLineSpec>> = {
  negatives: { min: -10, max: 10, step: 1, start: -3, unit: "one" },
  decimals: { min: 0, max: 2, step: 0.1, start: 1.4, unit: "tenth" },
  "place-value": { min: 0, max: 1000, step: 10, start: 340, unit: "ten" },
};

export interface NumberLineReading {
  readonly value: number;
  /** The number as the learner should read it, e.g. "−3" or "1.4". */
  readonly label: string;
  readonly distanceFromZero: number;
  readonly side: "left" | "right" | "at zero";
  readonly sentence: string;
}

/** One decimal place when the step is finer than a whole, none otherwise — a line
 *  that prints 1.4000000000000001 is a line nobody trusts. */
function lineLabel(value: number, spec: NumberLineSpec): string {
  const places = spec.step < 1 ? 1 : 0;
  const rounded = Number(value.toFixed(places));
  return rounded < 0 ? `−${Math.abs(rounded).toFixed(places)}` : rounded.toFixed(places);
}

export function readNumberLine(value: number, spec: NumberLineSpec): NumberLineReading {
  const clamped = Math.min(spec.max, Math.max(spec.min, value));
  const distance = Math.abs(Number(clamped.toFixed(4)));
  const side: NumberLineReading["side"] = clamped === 0 ? "at zero" : clamped < 0 ? "left" : "right";
  const oneBack = Number((clamped - spec.step).toFixed(4));
  const oneOn = Number((clamped + spec.step).toFixed(4));
  const parts: string[] = [];

  if (side === "at zero") {
    parts.push("The marker is at zero, the point that separates the two directions.");
  } else if (side === "right") {
    parts.push(
      `${lineLabel(clamped, spec)} sits ${lineLabel(distance, spec)} to the RIGHT of zero, and further right means bigger: it is greater than ${lineLabel(oneBack, spec)} and less than ${lineLabel(oneOn, spec)}${clamped === spec.max ? ", which is the end of this line" : ""}.`,
    );
  } else {
    // THE ORDER REVERSES ON THE LEFT, so the neighbours swap: −3 is MORE than −4
    // and LESS than −2. Getting this backwards prints a sentence that is the exact
    // misconception the model exists to refute (found in a browser, not by a test).
    parts.push(
      `${lineLabel(clamped, spec)} sits ${lineLabel(distance, spec)} to the LEFT of zero, and further left means SMALLER: it is less than ${lineLabel(oneOn, spec)} and more than ${lineLabel(oneBack, spec)}. The distance from zero is ${lineLabel(distance, spec)}, but distance is not value — the marker is on the left, so the value is below zero.`,
    );
  }
  if (spec.step < 1) {
    parts.push(
      `One move is a ${spec.unit}, so ten of them make a whole one — which is why ${lineLabel(clamped, spec)} is not the same point as ${lineLabel(Number((clamped + 0.1).toFixed(4)), spec)}.`,
    );
  }
  if (spec.step >= 10) {
    parts.push(
      `One move is a ${spec.unit}, so the tick marks are counted in ${spec.unit}s, not ones — ${lineLabel(clamped, spec)} is ${Math.round(distance / spec.step)} move${Math.round(distance / spec.step) === 1 ? "" : "s"} from zero.`,
    );
  }

  return {
    value: clamped,
    label: lineLabel(clamped, spec),
    distanceFromZero: distance,
    side,
    sentence: parts.join(" "),
  };
}

export interface NumberLineBelief {
  readonly id: "further-is-bigger" | "more-digits-is-bigger";
  readonly belief: string;
  readonly holds: boolean;
  readonly why: string;
  readonly sourceId: string;
}

export const NUMBER_LINE_BELIEFS: readonly NumberLineBelief[] = [
  {
    id: "further-is-bigger",
    belief: "−5 is greater than −2, because 5 is greater than 2.",
    holds: false,
    why: "On the left of zero the order reverses: −5 is further from zero than −2, and further left is smaller. The model's sentence prints the two neighbours either side of the marker so the order is read off the line rather than from the digits.",
    sourceId: "mrbarton-negative-numbers-probes",
  },
  {
    id: "more-digits-is-bigger",
    belief: "0.45 is greater than 0.5, because 45 is greater than 5.",
    holds: false,
    why: "The decimal's place matters more than its digit count: 0.45 is four tenths and a half, while 0.5 is five tenths. Moving in tenths on the line shows which side of 0.5 a value falls on.",
    sourceId: "steinle-stacey-1998-decimals",
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// SEARCHING — linear and binary, counted rather than described.
// ═════════════════════════════════════════════════════════════════════════════

/** The list both searches run on. Sorted, because binary search requires it —
 *  and the component lets the learner see what happens when it is not. */
export const SEARCH_LIST: readonly number[] = [3, 8, 12, 19, 24, 31, 40, 47, 55, 68, 72, 80, 91, 99];

export interface SearchRun {
  readonly found: boolean;
  readonly index: number;
  /** How many items were LOOKED AT. This is the number the lesson compares. */
  readonly comparisons: number;
  /** For binary search: the [low, high] window after each comparison. */
  readonly windows: readonly { readonly low: number; readonly high: number; readonly mid: number }[];
}

export function runLinearSearch(list: readonly number[], target: number): SearchRun {
  for (let i = 0; i < list.length; i += 1) {
    if (list[i] === target) return { found: true, index: i, comparisons: i + 1, windows: [] };
  }
  return { found: false, index: -1, comparisons: list.length, windows: [] };
}

export function isSorted(list: readonly number[]): boolean {
  return list.every((value, i) => i === 0 || list[i - 1] <= value);
}

/** Binary search, written so the window is visible: each comparison halves the
 *  candidates, and the run reports every window it passed through. */
export function runBinarySearch(
  list: readonly number[],
  target: number,
): SearchRun & { readonly preconditionMet: boolean } {
  const preconditionMet = isSorted(list);
  if (!preconditionMet) return { found: false, index: -1, comparisons: 0, windows: [], preconditionMet };
  let low = 0;
  let high = list.length - 1;
  const windows: { low: number; high: number; mid: number }[] = [];
  let comparisons = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    comparisons += 1;
    windows.push({ low, high, mid });
    if (list[mid] === target) return { found: true, index: mid, comparisons, windows, preconditionMet };
    if (list[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return { found: false, index: -1, comparisons, windows, preconditionMet };
}

/** Both algorithms on the same target, so the component never has to compute a
 *  comparison itself. */
export function compareSearches(list: readonly number[], target: number) {
  const linear = runLinearSearch(list, target);
  const binary = runBinarySearch(list, target);
  return {
    linear,
    binary,
    /** How many fewer looks binary needed. Zero when they tie. */
    savedByBinary: linear.comparisons - binary.comparisons,
    sentence: binary.preconditionMet
      ? `Looking for ${target}: checking one at a time took ${linear.comparisons} look${linear.comparisons === 1 ? "" : "s"}, halving the list took ${binary.comparisons}. The list has ${list.length} items.`
      : `Looking for ${target}: checking one at a time took ${linear.comparisons} look${linear.comparisons === 1 ? "" : "s"}. Binary search cannot start: it needs the list to be in order, and this one is not.`,
  };
}

// ── LIVE PROGRESS VS THE FINISHED COMPARISON ─────────────────────────────────
//
// The first version printed the full comparison the instant the card rendered —
// "checking one at a time took 9 looks, halving took 3" — beside a picture in
// which NOTHING had been looked at yet, and "found: yes, at position 1" before a
// single step. Two different facts (what this run has shown so far, and what the
// two algorithms cost in total) were printed in one place, so a learner could not
// tell which was the result of their own stepping. This type separates them:
// `liveSentence` is what has been SEEN, and `finalSentence` does not exist until
// every look of the longer algorithm has been taken.
export interface SearchProgress {
  /** Looks taken so far, clamped to the longer algorithm's total. */
  readonly taken: number;
  /** How many looks of each algorithm have been shown. */
  readonly linearShown: number;
  readonly binaryShown: number;
  /** Every look of the longer algorithm has been taken. */
  readonly finished: boolean;
  /** What this run has shown so far. Never quotes either total before the run
   *  ends: the cost is the finding, and a learner who is told the total has
   *  nothing left to count. This is the change the Oak linear-search segment
   *  argued for — its demonstration never displays a comparison count, and the
   *  count is performed by the learner. */
  readonly liveSentence: string;
  /** The completed comparison — null until `finished`. */
  readonly finalSentence: string | null;
}

export function searchProgress(list: readonly number[], target: number, takenRaw: number): SearchProgress {
  const linear = runLinearSearch(list, target);
  const binary = runBinarySearch(list, target);
  const total = Math.max(linear.comparisons, binary.comparisons, 1);
  const asked = Number.isFinite(takenRaw) ? Math.round(takenRaw) : 0;
  const taken = Math.min(Math.max(0, asked), total);
  const linearShown = Math.min(taken, linear.comparisons);
  const binaryShown = binary.preconditionMet ? Math.min(taken, binary.comparisons) : 0;
  const finished = taken >= total;

  const linearStopped = linearShown >= linear.comparisons;
  const binaryStopped = binary.preconditionMet && binaryShown >= binary.comparisons;
  const linearPart = `one at a time has compared ${linearShown} item${linearShown === 1 ? "" : "s"}${linearStopped ? " and stopped" : ""}`;
  const binaryPart = !binary.preconditionMet
    ? "halving cannot start while the list is out of order"
    : `halving has compared ${binaryShown} item${binaryShown === 1 ? "" : "s"}${binaryStopped ? " and stopped" : ""}`;
  const liveSentence =
    taken === 0
      ? "Nothing has been checked yet. Step once to take the first look."
      : `You have taken ${taken} look${taken === 1 ? "" : "s"}: ${linearPart}; ${binaryPart}. Neither total is printed until the run ends — counting the looks is the point.`;

  const finalSentence = !finished
    ? null
    : binary.preconditionMet
      ? `Finished: one at a time took ${linear.comparisons} look${linear.comparisons === 1 ? "" : "s"}, halving took ${binary.comparisons}. ${
          binary.comparisons < linear.comparisons
            ? "Halving needed fewer looks for this target."
            : binary.comparisons > linear.comparisons
              ? "One at a time needed fewer looks here, because the target is near the front."
              : "Both needed the same number of looks here."
        }`
      : `Finished: one at a time took ${linear.comparisons} look${linear.comparisons === 1 ? "" : "s"}. Halving could not start at all: it needs the list in order.`;

  return { taken, linearShown, binaryShown, finished, liveSentence, finalSentence };
}

// ── THE INSTRUCTION SEQUENCE, AS A STATE ────────────────────────────────────
//
// The Oak linear-search lesson keeps its five instruction lines on screen for the
// whole demonstration and emphasises the one being executed, so the algorithm is
// read as a STATE rather than remembered as a list of sentences. Its wording and
// its artwork are not reproduced here (OGL v3.0, reference-only): these are
// OpenMind's own instructions for OpenMind's own model, and the only thing taken
// from the segment is the technique.
//
// `searchGuidance` answers which instruction is executing right now, which ones
// have been passed, and which item is under the cursor — all from the same
// progress the picture already uses, so the highlighted step and the drawing can
// never disagree.
export interface SearchStep {
  readonly n: number;
  readonly text: string;
}

export const LINEAR_STEPS: readonly SearchStep[] = [
  { n: 1, text: "Fix on the number you are looking for." },
  { n: 2, text: "Start at the first item of the list." },
  { n: 3, text: "Compare the item at the current position with the number." },
  { n: 4, text: "If they match, stop — you have found it." },
  { n: 5, text: "Otherwise move to the next item and go back to step 3." },
];

export const BINARY_STEPS: readonly SearchStep[] = [
  { n: 1, text: "Fix on the number you are looking for." },
  { n: 2, text: "Start with the whole list as the possible window." },
  { n: 3, text: "Compare the middle item of the window with the number." },
  { n: 4, text: "If they match, stop — you have found it." },
  { n: 5, text: "Otherwise keep the half it must be in and go back to step 3." },
];

export interface SearchStepState {
  /** The instruction number executing now; null when the algorithm cannot start. */
  readonly current: number | null;
  /** Instructions already passed. */
  readonly done: readonly number[];
  /** One sentence naming what the highlighted step is doing on this item. */
  readonly note: string;
}

export interface SearchFocus {
  /** 1-based position in the list, so the learner reads it the way the row does. */
  readonly position: number;
  readonly value: number;
}

export interface SearchGuidance {
  /** The progress the drawing is made from — returned here so the highlighted step,
   *  the cursors and the counts cannot be computed from two different calls. */
  readonly progress: SearchProgress;
  readonly linear: SearchStepState;
  readonly binary: SearchStepState;
  /** The item the next look will compare; null once that search has stopped. */
  readonly linearFocus: SearchFocus | null;
  readonly binaryFocus: SearchFocus | null;
}

function linearStepState(progress: SearchProgress, focus: SearchFocus | null, total: number, found: boolean): SearchStepState {
  if (progress.taken === 0) {
    return { current: 2, done: [], note: "Set up: the first comparison will be with the first item." };
  }
  if (progress.linearShown < total) {
    return {
      current: 3,
      done: [1, 2],
      note: focus ? `Comparing item ${focus.position} (${focus.value}) with the number you want.` : "Comparing the current item with the number you want.",
    };
  }
  return found
    ? { current: 4, done: [1, 2, 3], note: `The item matched at position ${focus?.position ?? ""}. The search stops here.` }
    : { current: 5, done: [1, 2, 3], note: "Every item has been compared and none matched, so the search ends." };
}

function binaryStepState(progress: SearchProgress, focus: SearchFocus | null, total: number, found: boolean, canStart: boolean): SearchStepState {
  if (!canStart) {
    return { current: null, done: [], note: "Cannot start: the window is only safe if the list is in order." };
  }
  if (progress.taken === 0) {
    return { current: 2, done: [], note: "Set up: the window is all of the list." };
  }
  if (progress.binaryShown < total) {
    return {
      current: 3,
      done: [1, 2],
      note: focus ? `Comparing the middle of the window, item ${focus.position} (${focus.value}).` : "Comparing the middle of the window.",
    };
  }
  return found
    ? { current: 4, done: [1, 2, 3], note: `The middle item matched at position ${focus?.position ?? ""}. The search stops here.` }
    : { current: 5, done: [1, 2, 3], note: "The window closed without a match, so the item is not in the list." };
}

/** Which instruction each algorithm is executing, and which item is under its
 *  cursor. Pure, and derived from `searchProgress`, so the highlighted step, the
 *  dashed 'current' box and the running count are three views of one state. */
export function searchGuidance(list: readonly number[], target: number, takenRaw: number): SearchGuidance {
  const progress = searchProgress(list, target, takenRaw);
  const linear = runLinearSearch(list, target);
  const binary = runBinarySearch(list, target);
  const linearFocus =
    progress.linearShown < linear.comparisons
      ? { position: progress.linearShown + 1, value: list[progress.linearShown] }
      : null;
  const window = progress.binaryShown < binary.comparisons ? binary.windows[progress.binaryShown] : null;
  const binaryFocus = window ? { position: window.mid + 1, value: list[window.mid] } : null;
  return {
    progress,
    linear: linearStepState(progress, linearFocus, linear.comparisons, linear.found),
    binary: binaryStepState(progress, binaryFocus, binary.comparisons, binary.found, binary.preconditionMet),
    linearFocus,
    binaryFocus,
  };
}

export interface SearchBelief {
  readonly id: "binary-always-better" | "binary-needs-order" | "linear-needs-order" | "halving";
  readonly belief: string;
  readonly holds: boolean;
  readonly why: string;
  readonly sourceId: string;
}

export const SEARCH_BELIEFS: readonly SearchBelief[] = [
  {
    id: "binary-always-better",
    belief: "Binary search is always the better choice.",
    holds: false,
    why: "It needs a sorted list, and sorting costs work. For a target near the front of a short list, one-at-a-time finds it in one look while halving still takes several. Which is better depends on the list and the question.",
    sourceId: "oak-comparing-searching",
  },
  {
    id: "binary-needs-order",
    belief: "Binary search only works on a list that is in order.",
    holds: true,
    why: "Halving is only safe if you know which half the target cannot be in — and that is exactly what being in order tells you. The model refuses to run on an unsorted list rather than giving a wrong answer.",
    sourceId: "oak-binary-search-ks4",
  },
  {
    id: "linear-needs-order",
    belief: "Linear search only works on a sorted list.",
    holds: false,
    why: "Checking each item in turn needs no order at all: it works on any list, which is why it is the fallback when the data cannot be sorted.",
    sourceId: "oak-comparing-searching",
  },
  {
    id: "halving",
    belief: "Each step of binary search halves the number of items still to check.",
    holds: true,
    why: "Every comparison discards one half of the remaining window. That is why the number of looks grows with the logarithm of the list, not with the list — 14 items take at most 4 looks.",
    sourceId: "cmu-15122-binsearch",
  },
];
