import type { SubjectId } from "./types";
import type {
  AssessmentKind,
  AuthoredLesson,
  BlockKind,
  LessonPart,
} from "./lesson-contract";

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT-SPECIFIC AUTHORING FRAMEWORKS.
//
// Shared infrastructure, not identical pedagogy. Every subject gets the same
// eleven parts because a learner needs them all; what differs is what counts as
// EVIDENCE in that subject, and therefore what the framework refuses.
//
// Each rule below is a claim about the subject, written so it can fail:
//   - Mathematics: a worked example that jumps to the answer has not modelled
//     reasoning, so every example needs at least two moves and the answer must
//     be stated in the working.
//   - Physics: a number without a unit is not a physical quantity. Any
//     quantitative answer that carries digits must carry a unit.
//   - Chemistry: an equation that is not balanced is false, and an arrow is
//     what makes it a reaction rather than a list.
//   - Biology: a structure named without its function is a label, not an
//     explanation, so a structure-function block must state the link in words.
//   - Computing: a program that has not been traced and tested has not been
//     understood, so the lesson must include code, a trace and a test.
//
// A subject without a framework cannot author a lesson. That is deliberate: it
// is better to report "no framework for this subject" than to run a Mathematics
// checklist over a Computing lesson and call it covered.
// ─────────────────────────────────────────────────────────────────────────────

export interface FrameworkRule {
  readonly id: string;
  readonly describe: string;
  readonly check: (lesson: AuthoredLesson) => readonly string[];
}

export interface SubjectFramework {
  readonly subject: SubjectId;
  readonly name: string;
  /** One sentence: what teaching looks like in this subject. */
  readonly pedagogy: string;
  readonly requiredBlockKinds: readonly BlockKind[];
  readonly requiredParts: readonly LessonPart[];
  readonly assessmentKinds: readonly AssessmentKind[];
  readonly rules: readonly FrameworkRule[];
}

const HAS_DIGIT = /[0-9]/;

/** A unit is anything in an answer that is not a digit, a separator or a sign:
 *  Ω and V are units as surely as m and N are, and an ASCII-only test silently
 *  failed every ohm. */
const HAS_UNIT = /[^\d\s.,+\-()=/]/;

const NUMBER_WORDS: Readonly<Record<string, number>> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20,
};

/** Numbers an answer names, in digits or in words. A maths answer is often
 *  written in prose ("fifteen fortieths"), so a digits-only comparison would
 *  report a correctly worked example as unreached. */
function numbersIn(text: string): Set<number> {
  const out = new Set<number>();
  for (const match of text.matchAll(/-?\d+(?:\.\d+)?/g)) {
    const value = Number(match[0]);
    if (Number.isFinite(value)) out.add(value);
  }
  for (const word of text.toLowerCase().split(/[^a-z]+/)) {
    const value = NUMBER_WORDS[word];
    if (value !== undefined) out.add(value);
  }
  return out;
}

const MATHS: SubjectFramework = {
  subject: "maths",
  name: "Mathematics",
  pedagogy:
    "Meaning first, then representation, then procedure: a learner should be able to say what a symbol stands for before they can operate on it, draw the relationship, and solve a problem they have not seen.",
  requiredBlockKinds: ["maths.expression"],
  requiredParts: [
    "objectives",
    "priorKnowledge",
    "introduction",
    "explanation",
    "representations",
    "workedExamples",
    "misconceptions",
    "guidedPractice",
    "assessment",
    "transfer",
    "retrieval",
  ],
  assessmentKinds: ["short-answer", "constructed-response"],
  rules: [
    {
      id: "maths.steps-show-working",
      describe: "every worked example has at least two moves, so it models reasoning rather than stating an answer",
      check: (l) =>
        l.workedExamples
          .filter((w) => w.steps.length < 2)
          .map((w) => `${w.id}: one move only`),
    },
    {
      id: "maths.answer-in-working",
      describe:
        "the final move names a quantity from the answer, so the learner sees where it came from",
      check: (l) =>
        l.workedExamples
          .filter((w) => {
            const last = w.steps[w.steps.length - 1];
            if (!last) return true;
            const answerNumbers = numbersIn(w.answer);
            if (answerNumbers.size === 0) return false;
            const stepNumbers = numbersIn(last.move);
            for (const value of answerNumbers) if (stepNumbers.has(value)) return false;
            return true;
          })
          .map((w) => `${w.id}: the last move names none of the answer's quantities`),
    },
    {
      id: "maths.reasoning-assessed",
      describe: "at least one assessment asks for reasoning in words, not only a value",
      check: (l) =>
        l.assessment.some((a) => a.kind === "constructed-response")
          ? []
          : ["no constructed-response assessment: the lesson can only check arithmetic"],
    },
  ],
};

const PHYSICS: SubjectFramework = {
  subject: "physics",
  name: "Physics",
  pedagogy:
    "A phenomenon first, then a model, then the equation that quantifies it: every symbol carries a unit, every formula carries an assumption, and every answer is checked against the physical situation.",
  requiredBlockKinds: ["physics.equation", "physics.units"],
  requiredParts: [
    "objectives",
    "priorKnowledge",
    "introduction",
    "explanation",
    "representations",
    "workedExamples",
    "misconceptions",
    "guidedPractice",
    "assessment",
    "transfer",
    "retrieval",
  ],
  assessmentKinds: ["short-answer", "constructed-response"],
  rules: [
    {
      id: "physics.quantities-have-units",
      describe: "a quantitative answer states its unit — 5 alone could be 5 m, 5 m/s or 5 N",
      check: (l) =>
        l.workedExamples
          .filter((w) => HAS_DIGIT.test(w.answer) && !HAS_UNIT.test(w.answer))
          .map((w) => `${w.id}: numeric answer with no unit`),
    },
    {
      id: "physics.equation-then-substitution",
      describe: "every worked example rearranges or names the equation before substituting",
      check: (l) =>
        l.workedExamples
          .filter((w) => !w.steps.some((s) => /[A-Za-z]\s*=|\brearrang|\bsubstitut/i.test(`${s.move} ${s.why}`)))
          .map((w) => `${w.id}: no equation or substitution step named`),
    },
    {
      id: "physics.assumption-named",
      describe: "at least one explanation paragraph names an assumption the model makes",
      check: (l) =>
        proseOf(l).some((p) => /assum|ideal|negligib|constant\b/i.test(p))
          ? []
          : ["no paragraph names a model assumption"],
    },
  ],
};

const CHEMISTRY: SubjectFramework = {
  subject: "chemistry",
  name: "Chemistry",
  pedagogy:
    "Three representations must agree: what you observe, what the particles are doing, and what the symbols say. A formula that does not balance is not a simplification; it is a false statement about matter.",
  requiredBlockKinds: ["chemistry.equation", "chemistry.particle-model"],
  requiredParts: [
    "objectives",
    "priorKnowledge",
    "introduction",
    "explanation",
    "representations",
    "workedExamples",
    "misconceptions",
    "guidedPractice",
    "assessment",
    "transfer",
    "retrieval",
  ],
  assessmentKinds: ["short-answer", "constructed-response"],
  rules: [
    {
      id: "chemistry.equation-has-arrow",
      describe: "a chemical equation states a reaction direction with an arrow",
      check: (l) =>
        l.representations
          .filter((b) => b.kind === "chemistry.equation")
          .filter((b) => !b.notation?.includes("→"))
          .map((b) => `${b.id}: no arrow`),
    },
    {
      id: "chemistry.atoms-balance",
      describe: "every displayed equation balances its atoms on both sides",
      check: (l) =>
        l.representations
          .filter((b) => b.kind === "chemistry.equation" && b.notation)
          .flatMap((b) => balanceProblems(b.notation as string, b.id)),
    },
    {
      id: "chemistry.mole-ratio-modelled",
      describe: "when an assessment asks for an amount, a mole-ratio worked example exists",
      check: (l) => {
        // A RATE IS NOT AN AMOUNT. “Calculate the rate of mass loss in g/s”
        // names a mass because mass is what was measured, but the answer is a
        // rate, and demanding a mole-ratio worked example for it is a false
        // positive: the item has no amount to convert. Amount questions still
        // trigger the rule, including a mass asked for without a per-time unit.
        const asksAmount = l.assessment.some((item) => {
          const rateQuestion = /\b(rate|per second|per minute|per hour|g\/s|cm³\/s|cm3\/s)\b/i.test(item.prompt);
          return (
            /\b(mol|moles|mole|concentration|yield)\b/i.test(item.prompt) ||
            (/\bmass\b/i.test(item.prompt) && !rateQuestion)
          );
        });
        if (!asksAmount) return [];
        return l.workedExamples.some((w) =>
          /\bmol|mole|ratio\b/i.test(
            [w.prompt, ...w.steps.map((s) => s.move), w.answer].join(" "),
          ),
        )
          ? []
          : ["assessment asks for an amount but no worked example uses a mole ratio"];
      },
    },
  ],
};

const BIOLOGY: SubjectFramework = {
  subject: "biology",
  name: "Biology",
  pedagogy:
    "Structure exists for a function and a process has a cause: a learner should be able to trace the mechanism, not recite the parts, and should read a diagram as a claim about an organism.",
  requiredBlockKinds: ["biology.structure-function", "biology.process"],
  requiredParts: [
    "objectives",
    "priorKnowledge",
    "introduction",
    "explanation",
    "representations",
    "workedExamples",
    "misconceptions",
    "guidedPractice",
    "assessment",
    "transfer",
    "retrieval",
  ],
  assessmentKinds: ["short-answer", "constructed-response"],
  rules: [
    {
      id: "biology.structure-meets-function",
      describe: "a structure-function block states the link in words, not just the name",
      check: (l) =>
        l.representations
          .filter((b) => b.kind === "biology.structure-function")
          .filter((b) => !/because|so that|which lets|allows/i.test(b.body))
          .map((b) => `${b.id}: names a structure without its function`),
    },
    {
      id: "biology.process-has-cause",
      describe: "a process block explains what drives each step",
      check: (l) =>
        l.representations
          .filter((b) => b.kind === "biology.process")
          .filter((b) => !/because|so that|drives|causes|gradient/i.test(b.body))
          .map((b) => `${b.id}: a sequence with no cause named`),
    },
    {
      id: "biology.experiment-interpreted",
      describe: "an assessment asks the learner to interpret evidence, not only to recall a fact",
      check: (l) =>
        l.assessment.some((a) => /explain|suggest|why|interpret|conclude/i.test(a.prompt))
          ? []
          : ["no assessment asks for an interpretation"],
    },
  ],
};

const COMPUTING: SubjectFramework = {
  subject: "computing",
  name: "Computing",
  pedagogy:
    "Code is read, run, traced and broken on purpose: a learner should predict what a program does, then run it, then find the line that makes it wrong. A Computing lesson with no executable step is a vocabulary list.",
  requiredBlockKinds: ["computing.code", "computing.trace", "computing.test"],
  requiredParts: [
    "objectives",
    "priorKnowledge",
    "introduction",
    "explanation",
    "representations",
    "workedExamples",
    "misconceptions",
    "guidedPractice",
    "assessment",
    "transfer",
    "retrieval",
  ],
  assessmentKinds: ["short-answer", "code"],
  rules: [
    {
      id: "computing.code-executable",
      describe: "the code block is a complete, runnable statement list rather than a fragment",
      check: (l) =>
        l.representations
          .filter((b) => b.kind === "computing.code")
          .filter((b) => !b.notation || b.notation.trim().length < 40)
          .map((b) => `${b.id}: code too short to run`),
    },
    {
      id: "computing.trace-states-values",
      describe: "the trace block records a value at each step, so the learner can check their prediction",
      check: (l) =>
        l.representations
          .filter((b) => b.kind === "computing.trace")
          .filter((b) => !/=/.test(`${b.body} ${b.notation ?? ""}`))
          .map((b) => `${b.id}: trace records no values`),
    },
    {
      id: "computing.assessment-writes-code",
      describe: "at least one assessment requires the learner to write or repair code",
      check: (l) =>
        l.assessment.some((a) => a.kind === "code")
          ? []
          : ["no code assessment: the learner never writes a program"],
    },
  ],
};

export const FRAMEWORKS: Readonly<Record<SubjectId, SubjectFramework>> = {
  maths: MATHS,
  physics: PHYSICS,
  chemistry: CHEMISTRY,
  biology: BIOLOGY,
  computing: COMPUTING,
};

export function frameworkFor(subject: SubjectId): SubjectFramework | null {
  return FRAMEWORKS[subject] ?? null;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function proseOf(lesson: AuthoredLesson): string[] {
  return [
    lesson.introduction.hook,
    lesson.introduction.why,
    ...lesson.explanation.flatMap((e) => [e.heading, ...e.paragraphs]),
    ...lesson.representations.map((b) => b.body),
  ];
}

/** Count atoms on each side of a displayed equation. Handles the subset of
 *  formula syntax the bank authors use: element symbols, numeric subscripts,
 *  parenthesised groups and a leading coefficient. Returns a problem when the
 *  sides disagree, because an unbalanced equation is a false statement. */
function balanceProblems(notation: string, blockId: string): string[] {
  const [leftRaw, rightRaw] = notation.split("→");
  if (rightRaw === undefined) return [];
  const left = countAtoms(leftRaw);
  const right = countAtoms(rightRaw);
  if (!left || !right) return [];
  const elements = new Set([...Object.keys(left), ...Object.keys(right)]);
  const bad = [...elements].filter((el) => (left[el] ?? 0) !== (right[el] ?? 0));
  return bad.length
    ? [`${blockId}: ${bad.map((el) => `${el} ${left[el] ?? 0}/${right[el] ?? 0}`).join(", ")}`]
    : [];
}

function countAtoms(side: string): Record<string, number> | null {
  const totals: Record<string, number> = {};
  // Species are separated by +. A leading coefficient multiplies the species.
  for (const raw of side.split("+")) {
    const species = raw.trim().replace(/\s+/g, "");
    if (!species || /[^A-Za-z0-9()₀-₉]/.test(species)) return null;
    const m = species.match(/^(\d*)(.*)$/);
    if (!m) return null;
    const coefficient = m[1] ? Number(m[1]) : 1;
    const body = normaliseSubscripts(m[2] ?? "");
    const atoms = parseFormula(body);
    if (!atoms) return null;
    for (const [el, n] of Object.entries(atoms)) {
      totals[el] = (totals[el] ?? 0) + n * coefficient;
    }
  }
  return totals;
}

function normaliseSubscripts(s: string): string {
  const digits = "₀₁₂₃₄₅₆₇₈₉";
  return [...s].map((ch) => {
    const i = digits.indexOf(ch);
    return i >= 0 ? String(i) : ch;
  }).join("");
}

function parseFormula(s: string): Record<string, number> | null {
  const out: Record<string, number> = {};
  let i = 0;
  while (i < s.length) {
    const ch = s[i] as string;
    if (ch === "(") {
      let depth = 1;
      let j = i + 1;
      while (j < s.length && depth > 0) {
        if (s[j] === "(") depth++;
        if (s[j] === ")") depth--;
        j++;
      }
      if (depth !== 0) return null;
      const inner = parseFormula(s.slice(i + 1, j - 1));
      if (!inner) return null;
      const numMatch = s.slice(j).match(/^(\d+)/);
      const mult = numMatch ? Number(numMatch[1]) : 1;
      for (const [el, n] of Object.entries(inner)) out[el] = (out[el] ?? 0) + n * mult;
      i = j + (numMatch ? numMatch[1]!.length : 0);
      continue;
    }
    const elMatch = s.slice(i).match(/^([A-Z][a-z]?)/);
    if (!elMatch) return null;
    const el = elMatch[1] as string;
    i += el.length;
    const numMatch = s.slice(i).match(/^(\d+)/);
    const n = numMatch ? Number(numMatch[1]) : 1;
    out[el] = (out[el] ?? 0) + n;
    i += numMatch ? numMatch[1]!.length : 0;
  }
  return out;
}
