// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE MODELS — the arithmetic the picture claims, in one pure module.
//
// A model is not a picture with a slider on it. If the drawing says "each bulb is
// dimmer now" the NUMBER that sentence rests on must be computed somewhere a test
// can check, exactly like `lib/figures.ts` for a static diagram. Otherwise the
// component can draw a believable circuit that contradicts the paragraph beside it
// and every check that looks for the presence of a canvas will pass.
//
// THE FOUR BELIEFS THIS MODEL EXISTS FOR come from the circuit-misconception
// research recorded in `lib/learning-research.ts` (cited there, not here):
//
//   1. current is USED UP by a bulb          → in a series loop the current is the
//                                              same everywhere; the model returns
//                                              that fact as data, not as a caption
//   2. the battery is a CONSTANT CURRENT     → adding an identical bulb in series
//                                              halves the current
//   3. CLASHING CURRENTS (one wire lights it) → no closed loop, no light
//   4. SEQUENTIAL reasoning (position matters) → a series loop behaves the same
//                                              wherever the switch sits
//
// The picture is served by `components/circuit-model.tsx`; this module has no
// React and no DOM so the physics can be asserted without a browser.
// ─────────────────────────────────────────────────────────────────────────────

/** The models a lesson may declare. A union rather than a string: a plan that
 *  names a model nobody implemented fails the type check, and the renderer's
 *  switch is exhaustive. */
export const INTERACTIVE_MODEL_IDS = [
  "fraction-model",
  "circuit-model",
  "atom-model",
  "cell-model",
  "search-model",
  "number-line-model",
  "fraction-line-model",
  "fraction-ops-model",
  "factor-model",
] as const;
export type InteractiveModelId = (typeof INTERACTIVE_MODEL_IDS)[number];

/** One cell's potential difference, in volts. A nominal alkaline cell, which is
 *  what a classroom tray contains. */
export const CELL_VOLTS = 1.5;
/** One identical bulb's resistance, in ohms. Round numbers on purpose: the model
 *  is teaching a relationship, and 1.5/6 keeps the arithmetic checkable in a
 *  child's head (two cells and two bulbs → 0.25 A). */
export const BULB_OHMS = 6;
/** How far a learner can push each control. Bounded because an unbounded slider
 *  is a way to make the model claim things no classroom could show (20 cells). */
export const CIRCUIT_LIMIT = 4;

export interface CircuitState {
  readonly cells: number;
  readonly bulbs: number;
  readonly closed: boolean;
}

export type CircuitNote =
  /** The switch is open: no closed loop, so no current — whatever the cell. */
  | "open"
  /** A closed loop with nothing in it: no current to speak of, and nothing to
   *  light. */
  | "no-bulb"
  /** No cell: a loop with no source is a piece of wire. */
  | "no-cell"
  | "lit";

// ── WHICH WAY THE ARROWS POINT, AND WHY THAT IS NOT A CONTRADICTION ─────────
//
// The model used to draw a direction and say nothing about which convention it
// stood for. PhET's Circuit Construction Kit: DC makes the choice explicit in its
// own display panel (Electrons or Conventional), which is what prompted this: a
// learner who has been told that electrons move in a wire has a real question
// about the picture, and an unlabelled arrow answers it silently and wrongly.
//
// Nothing here is copied from PhET (CC BY-NC, reference-only); the wording and the
// drawing are OpenMind's, and the physics is standard. What the sim supplied was
// the observation that the convention needs naming.
export const CURRENT_CONVENTION = {
  /** What the drawing shows. A literal, so nothing can make the picture claim
   *  electron flow while the labels say otherwise. */
  drawn: "conventional" as const,
  label: "arrows: conventional current, from + round the outside to −",
  conventional:
    "Conventional current is drawn leaving the cell's positive terminal, going round the outside of the loop, and returning to its negative terminal. It is the direction a POSITIVE charge would be pushed.",
  electrons:
    "In a metal wire the charges that actually move are electrons. They are negative, so they drift the opposite way: out of the negative terminal, round the outside, and back to the positive one. The same number of them passes every point each second.",
  notContradictory:
    "They are not two different currents: current is a flow of charge with a direction, and the two names count the charge with opposite signs: reverse a negative flow and you get a positive one the other way. Circuit diagrams, and the V = IR this model uses, are written in the conventional direction, so that is the arrow drawn here — with the electrons moving the other way inside the wire.",
} as const;

/** Where the cell's terminals sit in the drawing, and therefore which way current
 *  travels along the top wire. Kept as data rather than as two hard-coded arrow
 *  paths: `topWireCurrentDirection()` follows the loop from the positive terminal,
 *  the component draws its arrows from the answer, and the suite asserts that the
 *  two agree. A drawing that pointed its arrows into the positive terminal would
 *  be a scientifically wrong picture that every presence check would pass. */
export const CELL_TERMINALS = { positive: "left", negative: "right" } as const;

export function topWireCurrentDirection(): "left" | "right" {
  // The cell sits on the BOTTOM wire with its positive plate on the left, so the
  // external path from + runs left along the bottom, up the left-hand wire and
  // across the top wire to the right, back down into −.
  return CELL_TERMINALS.positive === "left" ? "right" : "left";
}

export interface CircuitReading {
  /** Amperes through the loop. Zero when the loop is open or empty. */
  readonly currentAmps: number;
  /** The potential difference across ONE bulb, in volts. Reported because it makes
   *  the arithmetic checkable by the learner: with identical bulbs the p.d.s must
   *  add up to the cell voltage, which is a different route to the same current
   *  and the basis of the suite's conservation check. */
  readonly voltsPerBulb: number;
  /** One bulb's brightness, where 1 means "one cell and one bulb". Power per
   *  bulb relative to that reference, so a learner sees a ratio rather than an
   *  arbitrary scale. */
  readonly brightness: number;
  /** The series-loop fact the model is built to show. Typed as the literal `true`
   *  rather than a boolean so nothing can quietly set it false and leave the
   *  claim in the copy standing. */
  readonly sameCurrentEverywhere: true;
  readonly note: CircuitNote;
}

function bound(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(CIRCUIT_LIMIT, Math.max(0, Math.round(n)));
}

/**
 * What the circuit does, from what the learner set.
 *
 * Series, ideal cells, identical bulbs: I = (cells × 1.5) / (bulbs × 6), and a
 * bulb's brightness relative to the one-cell-one-bulb reference is (cells/bulbs)²,
 * because P = I²R and I is the thing that changed.
 *
 * THE INTERESTING CONSEQUENCE, and the reason the model doubles both controls:
 * two cells with two bulbs is EXACTLY as bright as one cell with one bulb (3 V ÷
 * 12 Ω = 0.25 A, and 0.25/0.25 squared is 1). Current and brightness depend on the
 * RATIO, so "more batteries is always brighter" is false the moment bulbs are
 * added, and "two cells, four bulbs" is dimmer than the single-bulb circuit the
 * learner started from.
 */
export function readCircuit(state: CircuitState): CircuitReading {
  const cells = bound(state.cells);
  const bulbs = bound(state.bulbs);
  const sameCurrentEverywhere = true as const;
  if (!state.closed) return { currentAmps: 0, voltsPerBulb: 0, brightness: 0, sameCurrentEverywhere, note: "open" };
  if (cells === 0) return { currentAmps: 0, voltsPerBulb: 0, brightness: 0, sameCurrentEverywhere, note: "no-cell" };
  if (bulbs === 0) return { currentAmps: 0, voltsPerBulb: 0, brightness: 0, sameCurrentEverywhere, note: "no-bulb" };
  const currentAmps = (cells * CELL_VOLTS) / (bulbs * BULB_OHMS);
  const reference = CELL_VOLTS / BULB_OHMS;
  const brightness = (currentAmps / reference) ** 2;
  const voltsPerBulb = (cells * CELL_VOLTS) / bulbs;
  return { currentAmps, voltsPerBulb, brightness, sameCurrentEverywhere, note: "lit" };
}

/**
 * A belief a learner can hold about the circuit, and whether the model supports
 * it. `holds` is a CLAIM ABOUT THIS MODEL, so the suite can drive the model and
 * check the answer rather than trusting the sentence.
 *
 * `sourceId` names an entry in the research register, so a pedagogical claim in
 * the product is traceable to something a person read.
 */
export interface CircuitBelief {
  readonly id:
    | "current-used-up"
    | "battery-constant-current"
    | "clashing-currents"
    | "sequential-reasoning";
  readonly belief: string;
  readonly holds: boolean;
  /** Why it fails — the sentence the feedback prints, not "that's wrong". */
  readonly why: string;
  readonly sourceId: string;
}

export const CIRCUIT_BELIEFS: readonly CircuitBelief[] = [
  {
    id: "current-used-up",
    belief: "The current is smaller after the first bulb than before it.",
    holds: false,
    why: "In one loop the same charge passes every point each second, so the current is the same on both sides of every bulb. The bulb takes ENERGY from the charge, not charge itself — which is why the bulb after it is equally bright.",
    sourceId: "tused-2007-simple-circuits",
  },
  {
    id: "battery-constant-current",
    belief: "Adding a second identical bulb leaves the current unchanged.",
    holds: false,
    why: "A cell holds a nearly fixed potential difference, not a fixed current. Add a bulb and the loop's total resistance rises, so the current falls and every bulb dims.",
    sourceId: "iop-2021-analogical-simulation",
  },
  {
    id: "clashing-currents",
    belief: "One wire from the cell is enough to light the bulb.",
    holds: false,
    why: "The charges need a complete path back to the cell. One wire is a dead end: the model shows no current at all until the loop is closed.",
    sourceId: "pacificu-2006-electricity-misconceptions",
  },
  {
    id: "sequential-reasoning",
    belief: "Where the switch sits in the loop changes how bright the bulb is.",
    holds: false,
    why: "In a series loop the switch is part of the same path, so its position changes nothing about the current — only whether there is one.",
    sourceId: "tused-2007-simple-circuits",
  },
];

// ── FACTORS, PRIME FACTORISATION, HCF AND LCM ─────────────────────────────
//
// The N4 lesson is prose-strong but it described its factor tree in notation.
// This model makes the tree a thing the learner builds, and then uses the same
// primes for the comparison the lesson is really about: the shared primes at
// the lower powers give the HCF, every prime at its highest power gives the
// LCM. The arithmetic is here, not in the component, so the suite can prove
// that the tree's leaves multiply back to 36 and that 24/36 read 12 and 72.

export interface FactorPair {
  readonly a: number;
  readonly b: number;
}

/** Proper factor pairs below the square root, with 1 excluded: 1 is a factor
 *  but not a prime, and a factor tree needs to make progress. 36 gives
 *  [2×18, 3×12, 4×9, 6×6] — the four choices a learner should see. */
export function factorPairs(n: number): FactorPair[] {
  if (!Number.isInteger(n) || n < 4) return [];
  const pairs: FactorPair[] = [];
  for (let a = 2; a * a <= n; a += 1) {
    if (n % a === 0) pairs.push({ a, b: n / a });
  }
  return pairs;
}

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

export interface FactorNode {
  readonly id: string;
  readonly value: number;
  readonly pair?: FactorPair;
  readonly left?: FactorNode;
  readonly right?: FactorNode;
}

export function makeFactorTree(n: number): FactorNode {
  return { id: "root", value: n };
}

/** Replace one unsplit composite leaf with its two children. Returns null for a
 *  pair that does not multiply to that leaf, so the component cannot grow a tree
 *  that contradicts the arithmetic. */
export function splitFactorTree(
  tree: FactorNode,
  nodeId: string,
  a: number,
  b: number,
): FactorNode | null {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 2 || b < 2) return null;
  if (tree.id === nodeId) {
    if (tree.left || tree.right || a * b !== tree.value) return null;
    const low = Math.min(a, b);
    const high = Math.max(a, b);
    // 6 × 6 gives two equal children. Without distinct ids both nodes look like
    // the active leaf, so the learner is shown two places to split when only one
    // is next. The suffix is only added for an equal pair, so the 4 × 9 route
    // keeps the ids the suite and the browser evidence already name.
    return {
      ...tree,
      pair: { a: low, b: high },
      left: { id: `${tree.id}-${low}${low === high ? "-a" : ""}`, value: low },
      right: { id: `${tree.id}-${high}${low === high ? "-b" : ""}`, value: high },
    };
  }
  if (tree.left) {
    const left = splitFactorTree(tree.left, nodeId, a, b);
    if (left) return { ...tree, left };
  }
  if (tree.right) {
    const right = splitFactorTree(tree.right, nodeId, a, b);
    if (right) return { ...tree, right };
  }
  return null;
}

/** The next leaf a learner must split: the leftmost composite leaf. A prime
 *  leaf is finished, and a node that already has children is not a leaf. */
export function firstUnsplitComposite(node: FactorNode): FactorNode | null {
  if (!node.left || !node.right) return !isPrime(node.value) ? node : null;
  return firstUnsplitComposite(node.left) ?? firstUnsplitComposite(node.right);
}

export function factorLeaves(node: FactorNode): number[] {
  if (!node.left || !node.right) return [node.value];
  return [...factorLeaves(node.left), ...factorLeaves(node.right)];
}

const SUPERSCRIPT: Readonly<Record<number, string>> = {
  0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴",
  5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹",
};

function primePowerText(powers: readonly { prime: number; power: number }[]): string {
  return powers
    .map(({ prime, power }) =>
      power === 1 ? String(prime) : `${prime}${SUPERSCRIPT[power] ?? `^${power}`}`)
    .join(" × ");
}

export interface FactorTreeSummary {
  readonly leaves: number[];
  readonly complete: boolean;
  readonly productText: string;
  readonly indexText: string;
}

export function readFactorTree(node: FactorNode): FactorTreeSummary {
  const leaves = factorLeaves(node).sort((a, b) => a - b);
  const counts = new Map<number, number>();
  for (const leaf of leaves) counts.set(leaf, (counts.get(leaf) ?? 0) + 1);
  const powers = [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([prime, power]) => ({ prime, power }));
  return {
    leaves,
    complete: leaves.every(isPrime),
    productText: leaves.join(" × "),
    indexText: primePowerText(powers),
  };
}

export interface PrimePower {
  readonly prime: number;
  readonly power: number;
}

export function primePowers(n: number): PrimePower[] {
  if (!Number.isInteger(n) || n < 2) return [];
  const powers: PrimePower[] = [];
  let rest = n;
  for (let prime = 2; prime * prime <= rest; prime += 1) {
    let power = 0;
    while (rest % prime === 0) {
      rest /= prime;
      power += 1;
    }
    if (power > 0) powers.push({ prime, power });
  }
  if (rest > 1) powers.push({ prime: rest, power: 1 });
  return powers;
}

export interface HcfLcmReading {
  readonly a: number;
  readonly b: number;
  readonly hcf: number;
  readonly lcm: number;
  readonly aText: string;
  readonly bText: string;
  readonly hcfText: string;
  readonly lcmText: string;
  readonly shared: readonly PrimePower[];
}

/** The HCF and LCM read from the prime factorisations, with the products in
 *  the same notation the lesson uses. The HCF takes the shared primes at the
 *  LOWER power; the LCM takes EVERY prime at its HIGHEST power. */
export function readHcfLcm(a: number, b: number): HcfLcmReading {
  const aPowers = primePowers(a);
  const bPowers = primePowers(b);
  const aMap = new Map(aPowers.map((p) => [p.prime, p.power] as const));
  const bMap = new Map(bPowers.map((p) => [p.prime, p.power] as const));
  const primes = [...new Set([...aMap.keys(), ...bMap.keys()])].sort((x, y) => x - y);
  const hcfPowers: PrimePower[] = [];
  const lcmPowers: PrimePower[] = [];
  const shared: PrimePower[] = [];
  let hcf = 1;
  let lcm = 1;
  for (const prime of primes) {
    const ca = aMap.get(prime) ?? 0;
    const cb = bMap.get(prime) ?? 0;
    const lower = Math.min(ca, cb);
    const higher = Math.max(ca, cb);
    if (lower > 0) {
      hcfPowers.push({ prime, power: lower });
      shared.push({ prime, power: lower });
      hcf *= prime ** lower;
    }
    lcmPowers.push({ prime, power: higher });
    lcm *= prime ** higher;
  }
  return {
    a,
    b,
    hcf,
    lcm,
    aText: primePowerText(aPowers),
    bText: primePowerText(bPowers),
    hcfText: primePowerText(hcfPowers),
    lcmText: primePowerText(lcmPowers),
    shared,
  };
}

/** The model a concept renders without an authored plan saying so. Kept small and
 *  explicit: a concept gets a model because somebody decided the picture answers a
 *  question the prose cannot, not because its subject has one. */
export const MODEL_BY_CONCEPT: Readonly<Record<string, InteractiveModelId>> = {
  "electricity-circuits": "circuit-model",
  // THE FRACTION BAR WAS NOT ENOUGH. Part-whole shading did not predict fewer
  // whole-number ordering errors once number-line estimation was controlled
  // (lib/learning-research.ts, `pmc-2016-fraction-ordering`), so `fractions` now
  // shows a POSITION on a line; the bar remains inside that model as the picture
  // of why the pieces shrink.
  fractions: "fraction-line-model",
  "fraction-ops": "fraction-ops-model",
  "factors-primes": "factor-model",
  "atoms-elements": "atom-model",
  cells: "cell-model",
  "algorithms-search": "search-model",
  negatives: "number-line-model",
  decimals: "number-line-model",
  "place-value": "number-line-model",
};

/** Which model (if any) this concept's lesson shows. The plan's own declaration
 *  wins, so an author can opt a concept out without editing this map. */
export function modelForConcept(
  conceptId: string,
  declared: InteractiveModelId | undefined,
): InteractiveModelId | null {
  if (declared) return declared;
  return MODEL_BY_CONCEPT[conceptId] ?? null;
}

/** What a learner can do to the model, in words the component prints. Kept here
 *  so the controls and the tests describe the same set. */
export const CIRCUIT_CONTROLS = ["cell-more", "cell-fewer", "bulb-more", "bulb-fewer", "toggle"] as const;
export type CircuitControl = (typeof CIRCUIT_CONTROLS)[number];

/** Apply one control to a state. Pure, so the component holds no rule of its own
 *  and the bounds are testable. */
export function applyCircuitControl(state: CircuitState, control: CircuitControl): CircuitState {
  switch (control) {
    case "cell-more":
      return { ...state, cells: bound(state.cells + 1) };
    case "cell-fewer":
      return { ...state, cells: bound(state.cells - 1) };
    case "bulb-more":
      return { ...state, bulbs: bound(state.bulbs + 1) };
    case "bulb-fewer":
      return { ...state, bulbs: bound(state.bulbs - 1) };
    case "toggle":
      return { ...state, closed: !state.closed };
  }
}
