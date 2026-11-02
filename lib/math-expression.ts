// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICAL EQUIVALENCE, NOT STRING EQUALITY.
//
// `2(x + 3)` and `2x + 6` are the same answer. `x² + 4` and `(x + 2)²` are
// not. A marker that compares the characters a learner typed gets both of those
// wrong, which is the defect that made a formula box impossible to trust.
//
// This module parses both the learner's response and each authored accepted
// form, moves an equation's two sides to one expression, and asks mathjs to
// simplify the difference. It deliberately refuses anything it cannot parse
// (reason `unreadable`) rather than calling it wrong: an unrecognised keystroke
// is not evidence about a learner's mathematics.
//
// WHAT THIS IS NOT: a computer-algebra system that will prove every identity.
// `simplify` can fail to reduce a genuinely equivalent but deeply rearranged
// form. When it cannot reduce the difference to zero, the result is
// `not-equivalent`; authors should accept the forms their lesson teaches, and
// the check suite exercises those. That limitation is preferable to a textual
// comparison that accepts the wrong answer as readily as the right one.
// ─────────────────────────────────────────────────────────────────────────────
import { parse, rationalize, simplify } from "mathjs";

const MAX_INPUT_LENGTH = 320;
const MAX_NODES = 220;

export type MathMarkReason =
  | "equivalent"
  | "not-equivalent"
  | "unreadable"
  | "unsupported";

export interface MathMark {
  correct: boolean;
  reason: MathMarkReason;
  /** The simplified difference, useful in authoring tools and never sent as a
   *  learner-facing hint. */
  detail?: string;
}

/** Convert the small amount of LaTeX a MathLive field can emit into the ASCII
 *  expression mathjs parses. This is not a general LaTeX importer. */
export function normaliseMathInput(raw: string): string {
  return String(raw ?? "")
    .replace(/\\left|\\right/g, "")
    .replace(/\\dfrac|\\tfrac/g, "\\frac")
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "(($1)/($2))")
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\\times|\\cdot/g, "*")
    .replace(/\\div/g, "/")
    .replace(/\\pi/g, "pi")
    .replace(/\^\{([^{}]+)\}/g, "^($1)")
    .replace(/[−–—]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[{}]/g, (c) => (c === "{" ? "(" : ")"))
    .replace(/\s+/g, "")
    // IMPLICIT MULTIPLICATION IS MATHEMATICS, NOT A DIFFERENT ANSWER.
    // `2(x + 3)` and `5x` are how a learner writes them; mathjs parses a
    // number followed by a bracket as a call, so the rewrite happens before
    // parsing. It is deliberately narrow: number→letter, number/bracket→
    // bracket, and bracket→bracket. A function name such as sqrt survives.
    .replace(/(\d)(?=[a-zA-Z])/g, "$1*")
    .replace(/(\d|\))(?=\()/g, "$1*")
    .trim();
}

function sides(raw: string): string[] | null {
  const text = normaliseMathInput(raw);
  if (!text || text.length > MAX_INPUT_LENGTH) return null;
  const parts = text.split("=");
  if (parts.length > 2 || parts.some((p) => p.trim() === "")) return null;
  return parts;
}

const CONSTANTS = new Set(["pi", "e"]);
const FUNCTIONS = new Set(["sqrt", "sin", "cos", "tan", "log", "ln", "exp", "abs"]);

function nodeCount(expression: string): number {
  try {
    const node = parse(expression);
    let count = 0;
    let unsupported = false;
    node.traverse((n: any) => {
      count += 1;
      // A word such as "hello" is a symbol to a CAS, but it is not a variable
      // this school marker can interpret. Refusing it is the honest answer.
      if (n?.isSymbolNode && !/^[a-zA-Z]$/.test(n.name) && !CONSTANTS.has(n.name) && !FUNCTIONS.has(n.name)) {
        unsupported = true;
      }
    });
    return unsupported ? Infinity : count;
  } catch {
    return Infinity;
  }
}

function parseSides(raw: string): string[] | null {
  const parts = sides(raw);
  if (!parts) return null;
  if (parts.some((p) => nodeCount(p) === Infinity || nodeCount(p) > MAX_NODES)) return null;
  return parts;
}

function difference(given: string[], target: string[]): string | null {
  if (given.length !== target.length) return null;
  if (given.length === 1) return `(${given[0]})-(${target[0]})`;
  return `((${given[0]})-(${given[1]}))-(((${target[0]})-(${target[1]})))`;
}

/**
 * Mark one expression or equation against the authored accepted forms.
 *
 * An equation must be compared as an equation. Treating `V = IR` and `V - IR`
 * as the same string-shaped object would mark a rearrangement wrong; treating
 * `x = 2` and `2` as the same would mark a statement of a solution correct when
 * the question asked for an expression.
 */
export function markMathExpression(
  given: string,
  accepted: readonly string[],
): MathMark {
  const parsedGiven = parseSides(given);
  if (!parsedGiven) return { correct: false, reason: "unreadable" };
  if (accepted.length === 0) return { correct: false, reason: "unsupported" };

  let lastDetail = "";
  for (const form of accepted) {
    const parsedTarget = parseSides(form);
    if (!parsedTarget) continue;
    const expression = difference(parsedGiven, parsedTarget);
    if (!expression) continue;
    try {
      // `simplify` does not always distribute a product, while `rationalize`
      // expands it to a rational form. Both are asked before an equivalent
      // answer is called different; `2(x+3)` against `2x+6` needs the second.
      for (const reduced of [simplify(expression), rationalize(expression)]) {
        const simplified = reduced.toString().replace(/\s+/g, "");
        lastDetail = simplified;
        if (simplified === "0" || simplified === "0.0" || simplified === "-0") {
          return { correct: true, reason: "equivalent", detail: simplified };
        }
      }
    } catch {
      // An accepted form that the engine cannot simplify is not a licence to
      // compare text. Try the next authored form.
    }
  }
  return { correct: false, reason: "not-equivalent", detail: lastDetail };
}

/** Can an authoring tool use this accepted form at all? Used by the content
 *  check so a typo in an answer key fails before a learner meets it. */
export function parseableMathExpression(raw: string): boolean {
  return parseSides(raw) !== null;
}
