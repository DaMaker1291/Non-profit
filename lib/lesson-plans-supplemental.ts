import { CONCEPTS, CONCEPTS_BY_ID } from "./genome";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import { MATHS_LENSES } from "./lesson-plans-maths";
import { SCIENCE_LENSES } from "./lesson-plans-science";
import { COMPUTING_LENSES } from "./lesson-plans-computing";
import type { LessonPlan, LessonTrap } from "./lesson-plans";
import type { LessonLens } from "./lesson-plans-lens";

/** The concept-specific content for every non-pilot concept. The union is kept
 *  here so a concept added to the genome without a lens is visible as a gap,
 *  rather than silently inheriting another concept's teaching. */
const LENSES: Record<string, LessonLens> = {
  ...MATHS_LENSES,
  ...SCIENCE_LENSES,
  ...COMPUTING_LENSES,
};

/** Two subject-level traps complete the three-trap minimum when a concept has
 *  no named misconception of its own. They are deliberately about the habits
 *  that fail across the subject, not about any one topic. */
const SUBJECT_TRAPS: Record<string, readonly LessonTrap[]> = {
  maths: [
    {
      move: "Does the steps without checking the sign, the units or the size of the answer.",
      why:
        "A correct-looking calculation can still describe the wrong quantity. Check the sign against the context, keep the units consistent, and estimate the answer before trusting the arithmetic.",
    },
    {
      move: "Memorises a rule and applies it to a case the rule was never about.",
      why:
        "A rule has conditions. Say what the rule assumes before using it — a right angle, a common denominator, a positive base — and check those conditions against the question in front of you.",
    },
  ],
  physics: [
    {
      move: "Quotes a numerical answer without its unit or direction.",
      why:
        "A magnitude alone does not identify a physical quantity. State the unit and, for a vector, the direction; an answer of 5 could be 5 m, 5 m/s or 5 N, and those are not interchangeable.",
    },
    {
      move: "Uses a formula without checking the physical situation it assumes.",
      why:
        "Equations such as SUVAT or V = IR hold under stated conditions. Name the assumption — constant acceleration, constant temperature, a closed circuit — before substituting values into the formula.",
    },
  ],
  chemistry: [
    {
      move: "Balances an equation by changing a subscript instead of a coefficient.",
      why:
        "Changing a subscript changes the substance itself: H₂O is water, H₂O₂ is hydrogen peroxide. Balance by placing coefficients in front of the formulas, never by editing the formulas.",
    },
    {
      move: "Confuses the amount of a substance with its concentration or its strength.",
      why:
        "Amount, concentration and strength are different axes. Say which one the question asks about, and convert with moles = mass ÷ Mr or concentration = moles ÷ volume rather than guessing.",
    },
  ],
  biology: [
    {
      move: "Names a structure without saying what its shape lets it do.",
      why:
        "Biology marks the link between structure and function: alveoli are thin and folded for diffusion, villi are long and packed for absorption. A name alone is a label, not an explanation.",
    },
    {
      move: "Treats a model or a diagram as the whole living process.",
      why:
        "A diagram selects features to make a relationship visible; it omits others. State what the model shows and what it leaves out before drawing a conclusion about the organism.",
    },
  ],
  computing: [
    {
      move: "Tests one example and declares the program correct.",
      why:
        "One input cannot exercise every branch. Test a normal case, a boundary case and an invalid case; a program that works for 3 may still fail at 0, at the last item, or on empty input.",
    },
    {
      move: "Chooses a data structure or algorithm by habit rather than by cost.",
      why:
        "The right structure changes how work grows: a list scan is O(n), a dictionary lookup is typically O(1), and a nested loop is O(n²). State the operation the program performs most often, then choose for that operation.",
    },
  ],
};

const ORDINALS = ["first", "second", "third", "fourth", "fifth"];

/** The chemistry figures that belong to supplemental plans. They are attached
 *  here rather than to the lens because a figure is a plan-level teaching claim,
 *  and the plan builder is the one place every supplemental lesson passes
 *  through. Both show a count the prose names: carbon's 2,4 shells and sodium's
 *  2,8,1. */
const SUPPLEMENTAL_FIGURES: Record<string, NonNullable<LessonPlan["figure"]>> = {
  "atoms-elements": {
    spec: { kind: "atom", symbol: "C", protons: 6, neutrons: 6, shells: [2, 4] },
    caption:
      "A carbon atom: six protons and six neutrons in the nucleus, with six electrons in two shells (2, 4). The outer four electrons are the ones that form bonds; the nucleus is what makes the element carbon.",
  },
  "electron-shells": {
    spec: { kind: "atom", symbol: "Na", protons: 11, neutrons: 12, shells: [2, 8, 1] },
    caption:
      "Sodium: 11 protons and 12 neutrons in the nucleus, with 11 electrons in shells of 2, 8 and 1. The single outer electron is why sodium loses one easily and forms Na⁺. A full outer shell would be stable; this one is one electron short of it.",
  },
  "compounds-mixtures": {
    spec: { kind: "chem", variant: "particle-box" },
    caption:
      "Three boxes: an element has identical atoms, a compound has different atoms chemically joined in a fixed ratio, and a mixture has different particles that are not chemically joined. A mixture can be separated physically; a compound cannot.",
  },
  "periodic-table": {
    spec: { kind: "chem", variant: "periodic" },
    caption:
      "A simplified periodic table with group 1 highlighted down the left and period 3 highlighted across. Sodium sits where they meet. The group number tells you the outer electrons; the period tells you the number of shells.",
  },
  "ionic-bonding": {
    spec: { kind: "chem", variant: "ionic" },
    caption:
      "Sodium transfers its one outer electron to chlorine. The resulting Na⁺ and Cl⁻ ions attract each other electrostatically, and each ion has a full outer shell. The transfer is the bond; the lattice is the repeating pattern of those ions.",
  },
  "covalent-bonding": {
    spec: { kind: "chem", variant: "covalent" },
    caption:
      "Two hydrogen atoms share a pair of electrons. The shared pair is the covalent bond, and neither atom loses an electron. Small molecules held by these bonds have low melting and boiling points.",
  },
  "metallic-bonding": {
    spec: { kind: "chem", variant: "metallic" },
    caption:
      "Metal cations sit in a regular lattice with delocalised electrons between them. The electrons are free to move, which explains why metals conduct electricity and heat, and why the layers can slide without the bond breaking.",
  },
  "moles-calcs": {
    spec: { kind: "chem", variant: "mole" },
    caption:
      "One mole of water contains 6.02 × 10²³ molecules and has a mass of 18 g. The mole is a count of particles, not a mass; molar mass is the bridge between the count and the balance.",
  },
  "rates-reaction": {
    spec: {
      kind: "chem",
      variant: "chart",
      xMax: 10,
      yMax: 10,
      series: [{ points: [[0, 9], [1, 7], [2, 5.2], [3, 4], [4, 3.2], [5, 2.7], [6, 2.4], [7, 2.2], [8, 2.1], [9, 2], [10, 1.95]] }],
    },
    caption:
      "The rate is steepest at the start, when reactant concentration is highest, then flattens as the reactants are used up. The gradient of this curve is the rate at that moment, not an average over the whole reaction.",
  },
  "acids-bases": {
    spec: { kind: "chem", variant: "ph" },
    caption:
      "The pH scale runs from 0 to 14: below 7 is acidic, 7 is neutral, and above 7 is alkaline. Each step of one pH unit means a tenfold change in hydrogen-ion concentration, so pH 2 is far more acidic than pH 4.",
  },
  "electrolysis": {
    spec: { kind: "chem", variant: "electrolysis" },
    caption:
      "A direct current passes through an electrolyte between two electrodes. Positive ions move to the cathode and negative ions to the anode, where the products form. The electrolyte must contain mobile ions; a solid ionic compound does not conduct.",
  },
  "organic-intro": {
    spec: { kind: "chem", variant: "organic" },
    caption:
      "Methane, CH₄: one carbon atom forms four single covalent bonds to hydrogen. Carbon's four bonds are why organic molecules can form chains, branches and rings, giving the huge range of organic compounds.",
  },
  "equilibria": {
    spec: {
      kind: "chem",
      variant: "chart",
      xMax: 10,
      yMax: 10,
      series: [
        { points: [[0, 9], [2, 7], [4, 5.5], [6, 4.7], [8, 4.3], [10, 4.2]], tone: "accent" },
        { points: [[0, 1], [2, 3], [4, 4.5], [6, 5.2], [8, 5.5], [10, 5.7]], tone: "muted", dashed: true },
      ],
    },
    caption:
      "At equilibrium the forward and reverse reactions continue at equal rates, so the concentrations stop changing even though both reactions are still happening. The curves flatten at the same time; equilibrium is dynamic, not a stopped reaction.",
  },
  "analysis-tests": {
    spec: { kind: "chem", variant: "flame" },
    caption:
      "Flame tests identify metal ions by colour: lithium red, sodium yellow, potassium lilac, calcium orange-red and copper green-blue. The colour is evidence for the metal ion, not a measurement of how much is present.",
  },
};

// NO CHEMISTRY VIDEO CARD IS EMITTED YET.
// Every previous chemistry card pointed at a BBC or Khan page that opened
// behind a consent choice; several ran four to six minutes, and one was a
// mixtures video on a compounds-and-mixtures lesson. A replacement must be a
// short, exact-concept, consent-free source before this map gets an entry.

function words(text: string): number {
  return text.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;
}

/** Split a paragraph into sentence-sized pieces, then merge until each piece has
 *  enough words to stand as an idea paragraph. The last short piece is folded
 *  into the previous one rather than left as a fragment. */
function packSentences(text: string, minimum = 20): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text.trim()];
  const out: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    current = current ? `${current} ${sentence}` : sentence;
    if (words(current) >= minimum) {
      out.push(current);
      current = "";
    }
  }
  if (current) {
    if (out.length) out[out.length - 1] = `${out[out.length - 1]} ${current}`;
    else out.push(current);
  }
  return out;
}

function ensureIdea(text: string): string {
  if (words(text) >= 20) return text;
  return `${text} Say what each quantity in this sentence means before you move on.`;
}

function nextConcepts(conceptId: string): string[] {
  return CONCEPTS.filter((c) => c.prereqs.includes(conceptId)).map((c) => c.title);
}

function pathParagraph(conceptId: string): string {
  const next = nextConcepts(conceptId);
  if (!next.length) {
    return "This is a foundation for later ideas in the subject. Keep the definition and the check beside you whenever a problem uses it.";
  }
  const named = next.slice(0, 3).join(", ");
  return `This idea is the step before ${named}. Keep its definition and its check beside you when those topics use it.`;
}

function usedFor(conceptId: string): string {
  const next = nextConcepts(conceptId);
  if (!next.length) {
    return `This is a foundation for later ${CONCEPTS_BY_ID[conceptId]?.subject ?? "subject"} ideas; explain it whenever a problem uses it.`;
  }
  return `This is used next in ${next.slice(0, 3).join(", ")}${next.length > 3 ? ` and ${next.length - 3} more` : ""}. Keep its definition and its check beside you when those topics use it.`;
}

function buildPlan(conceptId: string): LessonPlan | null {
  const c = CONCEPTS_BY_ID[conceptId];
  const lens = LENSES[conceptId];
  if (!c || !lens) return null;

  const core = packSentences(c.lesson);
  const first = ensureIdea(core[0] ?? c.lesson);
  const second = ensureIdea(core.slice(1).join(" ") || pathParagraph(conceptId));
  const idea = [first, second, ensureIdea(lens.move), ensureIdea(lens.check)];

  const named: LessonTrap[] = (c.misconceptions ?? [])
    .map((id) => MISCONCEPTIONS_BY_ID[id])
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map((m) => ({ move: m.pattern, why: m.coaching }));

  const subjectTraps = SUBJECT_TRAPS[c.subject] ?? SUBJECT_TRAPS.maths;
  const traps = [
    { move: lens.trap[0], why: lens.trap[1] },
    ...named,
    ...subjectTraps,
  ].slice(0, 3);

  const figure = SUPPLEMENTAL_FIGURES[conceptId];
  return {
    conceptId,
    objective: `${c.title.toLowerCase()} in a problem, and explain why it works: ${c.blurb}`,
    intuition: lens.intuition,
    idea,
    traps,
    usedFor: usedFor(conceptId),
    review: "unreviewed",
    provenance: "supplemental",
    ...(figure ? { figure } : {}),
  };
}

/** Every concept that has a supplemental lens. Exported for the coverage gate:
 *  a concept added to the genome without one must be a visible gap. */
export function supplementalConceptIds(): string[] {
  return Object.keys(LENSES);
}

export const SUPPLEMENTAL_LESSON_PLANS: Readonly<Record<string, LessonPlan>> = Object.fromEntries(
  supplementalConceptIds()
    .map((id) => [id, buildPlan(id)] as const)
    .filter((entry): entry is readonly [string, LessonPlan] => entry[1] !== null),
);

/** The builder is also exported for a coverage test that asks for one concept. */
export function supplementalPlanFor(conceptId: string): LessonPlan | null {
  return SUPPLEMENTAL_LESSON_PLANS[conceptId] ?? null;
}

/** Names that have a lens but no genome row, or the reverse. A typo in a lens
 *  key is silent otherwise: it would simply never render. */
export function supplementalProblems(): string[] {
  const problems: string[] = [];
  for (const id of Object.keys(LENSES)) {
    if (!CONCEPTS_BY_ID[id]) problems.push(`lens without concept: ${id}`);
  }
  for (const c of CONCEPTS) {
    if (!LENSES[c.id] && !["decimals", "fractions", "fraction-ops", "percentages", "negatives", "order-ops", "algebra-expressions", "coordinates", "algebra-expand", "straight-lines", "completing-square", "quadratics", "surds", "indices-intro", "linear-equations", "cells", "photosynthesis", "equations-stoich", "electricity-circuits"].includes(c.id)) {
      problems.push(`concept without lens: ${c.id}`);
    }
  }
  return problems;
}

/** A compact path used by the lesson coverage test: the direct prerequisites and
 *  the direct dependants, both of which must themselves have lessons. */
export function conceptPath(conceptId: string): { before: string[]; after: string[] } {
  const c = CONCEPTS_BY_ID[conceptId];
  if (!c) return { before: [], after: [] };
  return {
    before: [...c.prereqs],
    after: CONCEPTS.filter((x) => x.prereqs.includes(conceptId)).map((x) => x.id),
  };
}

export const PATH_ORDINALS = ORDINALS;
