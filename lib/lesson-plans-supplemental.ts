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

  return {
    conceptId,
    objective: `Use ${c.title.toLowerCase()} in a problem, and explain the idea: ${c.blurb}`,
    intuition: lens.intuition,
    idea,
    traps,
    usedFor: usedFor(conceptId),
    review: "unreviewed",
    provenance: "supplemental",
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
