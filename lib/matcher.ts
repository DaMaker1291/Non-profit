// ─────────────────────────────────────────────────────────────────────────────
// The wedge's brain: match a student's question to a concept in the genome.
//
// Deterministic and offline — no AI calls on this path, because the wedge must
// work on a cheap phone with no connection. It reads the question text, scores
// every concept by keyword signals (title words, stem aliases, maths notation,
// misconception patterns students literally describe), and returns the best
// match with an honest confidence. Below the floor it says "I'm not sure" —
// a wrong guess that teaches the wrong lesson is worse than no guess.
// ─────────────────────────────────────────────────────────────────────────────

import { CONCEPTS } from "./genome";

export interface MatchResult {
  conceptId: string;
  score: number; // normalised 0..1 signal strength
  confident: boolean;
}

/** Stem aliases students actually type — richer than concept titles alone. */
const ALIASES: Record<string, string[]> = {
  "place-value": ["place value", "hundreds digit", "tens digit", "ones digit", "units digit", "digit value"],
  addition: ["add", "sum", "plus", "total", "altogether", "carry"],
  subtraction: ["subtract", "minus", "take away", "difference", "borrow"],
  multiplication: ["multiply", "times", "product", "lots of"],
  division: ["divide", "share equally", "quotient", "remainder", "goes into"],
  negatives: ["negative", "minus number", "below zero", "minus times", "two negatives", "debt"],
  fractions: ["fraction", "numerator", "denominator", "quarter", "half of", "equivalent fractions", "simplest form"],
  "fraction-ops": ["add fractions", "subtract fractions", "multiply fractions", "divide by a fraction", "flip the fraction", "common denominator", "different denominators", "unlike denominators", "same denominator"],
  decimals: ["decimal", "decimal point", "tenths", "hundredths"],
  percentages: ["percent", "percentage", "per cent", "%", "discount", "interest rate", "vat", "increase by", "decrease by"],
  ratio: ["ratio", "share in the ratio", "simplify the ratio", "parts"],
  proportion: ["proportion", "proportional", "direct proportion", "inverse proportion", "constant of"],
  rounding: ["round", "rounding", "nearest ten", "nearest hundred", "decimal places", "significant figures", "estimate"],
  "order-ops": ["order of operations", "bidmas", "bodmas", "pemdas", "brackets first"],
  "indices-intro": ["index", "indices", "power", "squared", "cubed", "to the power", "index law", "power of zero"],
  "standard-form": ["standard form", "standard index form", "scientific notation", "10 to the power"],
  "algebra-expressions": ["expression", "simplify", "like terms", "collect terms", "expand the bracket", "substitute"],
  "algebra-expand": ["expand", "factorise", "factorize", "double brackets", "difference of two squares", "common factor", "quadratic expression"],
  "linear-equations": ["solve for x", "solve the equation", "linear equation", "unknown", "both sides", "3x", "balance"],
  inequalities: ["inequality", "inequalities", "greater than or equal", "less than or equal", "number line", "flip the sign"],
  simultaneous: ["simultaneous", "two equations", "elimination", "substitution method", "x and y"],
  coordinates: ["coordinates", "coordinate", "x axis", "y axis", "origin", "plot the point", "quadrant"],
  "straight-lines": ["gradient", "y = mx", "y intercept", "straight line", "slope", "parallel lines", "perpendicular", "mx + c"],
  quadratics: ["quadratic", "parabola", "x squared equals", "quadratic formula", "discriminant", "roots of"],
  "completing-square": ["complete the square", "completing the square", "turning point", "vertex form", "minimum point"],
  "sim-equations-quad": ["line and curve", "intersection of", "quadratic and linear"],
  sequences: ["sequence", "nth term", "next term", "term to term", "arithmetic sequence", "pattern rule", "geometric"],
  functions: ["function", "f(x)", "domain", "range", "inverse function", "composite"],
  "trig-ratios": ["trigonometry", "sin", "cos", "tan", "sine", "cosine", "tangent", "soh cah toa", "opposite adjacent hypotenuse", "angle of elevation"],
  "trig-identity": ["trig identity", "sin squared", "exact value", "unit circle", "wave graph"],
  "trig-rule": ["sine rule", "cosine rule", "cos rule", "non right angled triangle", "area of triangle 1/2ab"],
  "circle-theorems": ["circle theorem", "cyclic quadrilateral", "angle at the centre", "semicircle angle", "tangent radius", "same segment", "chord"],
  pythagoras: ["pythagoras", "hypotenuse", "right angled triangle", "a squared plus b", "3 4 5"],
  "angles-lines": ["angles", "angle sum", "interior angle", "exterior angle", "polygon", "corresponding angles", "alternate angles", "vertically opposite", "straight line 180"],
  "area-perimeter": ["area", "perimeter", "area of a triangle", "area of a rectangle", "trapezium", "compound shape"],
  volume: ["volume", "surface area", "cuboid", "cylinder", "prism", "cone", "sphere"],
  transformations: ["translation", "rotation", "reflection", "enlargement", "scale factor", "transform"],
  vectors: ["vector", "magnitude", "direction", "column vector", "resultant"],
  "probability-basics": ["probability", "chance", "likelihood", "outcome", "mutually exclusive", "biased dice", "fair coin", "at random"],
  "tree-diagrams": ["tree diagram", "combined events", "independent events", "without replacement", "at least one"],
  "sets-venn": ["venn", "union", "intersection", "set", "mutually exclusive sets"],
  averages: ["mean", "median", "mode", "average", "range of", "outlier"],
  "data-charts": ["bar chart", "pie chart", "line graph", "scatter", "frequency", "chart"],
  "scatter-correlation": ["correlation", "line of best fit", "scatter graph", "causation"],
  surds: ["surd", "rationalise", "root 2", "simplify the surd", "square root of 50"],
  polynomials: ["polynomial", "cubic", "factor theorem", "remainder theorem", "algebraic division"],
  binomial: ["binomial", "pascal", "expand (a + b)", "n choose"],
  "mixture-problems": ["word problem", "in terms of", "form an equation", "model the situation"],
  "growth-decay": ["exponential", "compound interest", "decay", "half life", "doubling", "growth rate", "depreciation"],
  logs: ["logarithm", "log", "log base", "ln"],
  "calculus-diff": ["differentiate", "differentiation", "derivative", "dy/dx", "rate of change", "stationary point", "gradient of the curve", "maximum point", "minimum point"],
  "calculus-int": ["integrate", "integration", "integral", "area under", "+c"],
  kinematics: ["kinematics", "suvat", "displacement", "velocity", "acceleration", "speed time graph"],
  proof: ["prove", "proof", "counterexample", "show that", "hence show"],
  "matrices-intro": ["matrix", "matrices", "determinant", "inverse matrix"],
  "financial-maths": ["simple interest", "compound interest", "loan", "mortgage", "amortisation", "savings"],
  bounds: ["bounds", "upper bound", "lower bound", "limits of accuracy", "error interval"],
  "loci-constructions": ["locus", "loci", "construction", "perpendicular bisector", "angle bisector", "compass"],
  "circle-area-arc": ["arc", "sector", "circumference", "area of a circle", "pi r", "tangent length"],
};

/** Free-floating signal words → subject-level hints used only to break ties. */
const STOP = new Set(["what", "how", "why", "the", "a", "an", "is", "are", "of", "to", "in", "for", "and", "do", "i", "you", "it", "this", "that", "solve", "question", "help", "work", "out", "find", "calculate", "answer"]);

/** Normalise text: lowercase, unify maths glyphs (unicode minus → ASCII —
 *  students type either), strip punctuation except maths-relevant symbols. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/[^\w%\s+x\-=^√²³×÷/()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-phrase, word-bounded alias hit, plural-tolerant on the last word —
 *  "tree diagram" must still hit "tree diagrams", but "fraction" must not
 *  land inside "fractional" mid-word. */
function hasPhrase(needle: string, haystack: string): boolean {
  if (!needle) return false;
  return new RegExp(`\\b${escapeRe(needle)}s?\\b`).test(haystack);
}

function tokens(s: string): string[] {
  return norm(s)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => (w.length > 3 ? w.replace(/s$/, "") : w)); // cheap plural fold
}

/** Precompute the searchable corpus once. */
interface Doc { conceptId: string; titleLower: string; aliasText: string; lessonLower: string; tokens: Set<string> }
let docs: Doc[] | null = null;

function corpus(): Doc[] {
  if (docs) return docs;
  docs = CONCEPTS.map((c) => {
    const aliases = (ALIASES[c.id] ?? []).map(norm).join(" | ");
    const text = `${norm(c.title)} ${aliases.replace(/\|/g, " ")} ${norm(c.blurb)}`;
    return {
      conceptId: c.id,
      titleLower: norm(c.title),
      aliasText: aliases,
      lessonLower: norm(c.lesson).slice(0, 4000),
      tokens: new Set(tokens(text)),
    };
  });
  return docs;
}

/**
 * Match free question text to the concept most likely being asked about.
 * Returns { confident: false } when no signal clears the honesty floor —
 * callers must offer the fallback path (browse / ask the tutor) instead of a guess.
 */
export function matchQuestion(text: string): MatchResult | null {
  const q = norm(text);
  if (q.length < 3) return null;
  const qTokens = tokens(text);
  if (qTokens.length === 0 && !/[\d]/.test(q)) return null;

  let best: MatchResult | null = null;
  for (const d of corpus()) {
    let score = 0;

    // Strongest signal: an alias phrase appears verbatim (word-bounded).
    // Weight per word: "add fractions" (an operation) outranks the bare
    // noun "fraction" — the verb is the discriminator between a concept and
    // its arithmetic.
    for (const alias of d.aliasText.split(" | ")) {
      if (alias.length >= 2 && hasPhrase(alias, q)) score += 6 * alias.split(" ").length;
    }

    // Title match (whole phrase beats word hits).
    if (hasPhrase(d.titleLower, q)) score += 5;

    // Word overlap with title/aliases/blurbs.
    let overlap = 0;
    for (const w of qTokens) if (d.tokens.has(w)) overlap++;
    score += overlap * 1.2;

    // Maths-notation hints inside the question itself.
    if (/\^|\bx²|\bx³|√|²|³/.test(q) && /expand|factorise|factorize|simplify|solve/.test(q)) score += d.conceptId.includes("algebra") ? 2 : 0;
    // Two brackets side by side is expanding/factorising notation.
    if (/\([a-z0-9][^)]*\)\s*\(/.test(q) && d.conceptId === "algebra-expand") score += 4;
    if (/dy\/dx|differentiat|integrat/.test(q) && d.conceptId.startsWith("calculus")) score += 4;
    if (/%/.test(q) && d.conceptId === "percentages") score += 4;
    // Negative-number notation: a − (−b) and (−a) × b are unmistakable.
    if (/\d\s*-\s*\(\s*-|\(\s*-\s*\d+\)\s*[×x*]/.test(q) && d.conceptId === "negatives") score += 4;
    // An equation in one unknown (5x − 1 = 9) is linear-equations territory —
    // alias-grade weight: coefficient·variable + operation + equals is unmistakable.
    if (/=/.test(q) && /\d\s*[a-z]/.test(q) && /[+\-*/]/.test(q) && d.conceptId === "linear-equations") score += 4;

    // Faint signal from the lesson body (kept weak on purpose).
    const lessonHits = qTokens.filter((w) => d.lessonLower.includes(w)).length;
    score += Math.min(1.5, lessonHits * 0.15);

    // Normalise against question length so short questions aren't penalised.
    const normScore = score / Math.max(4, qTokens.length * 0.8);
    if (normScore > 0 && (!best || normScore > best.score)) {
      best = { conceptId: d.conceptId, score: normScore, confident: false };
    }
  }

  if (!best) return null;
  // Honesty floor: below this the matcher is guessing, and says so.
  best.confident = best.score >= 0.9;
  return best;
}

// ── Why there is no local model in here ────────────────────────────────────
// An on-device classifier WAS tried on this path (Naive Bayes over exactly the
// corpus below, promoting a below-the-floor candidate when the two methods
// agreed) and it was measured out: on twenty realistic student questions it
// promoted ZERO, because a bag-of-words model fitted on the same corpus cannot
// beat the scorer that already embodies that corpus. Its leader disagreed with
// the scorer on the questions the scorer could not read, and on signal-free
// text every posterior is noise that still carries a respectable internal ratio.
// The honest conclusion is to keep the model's judgement off this path —
// lib/local-model.ts is used for tutor INTENT, a task with its own training data
// where it measurably helps, not for concept matching.

/** Top N matches for "did you mean…" UI. */
export function matchTop(text: string, n = 3): MatchResult[] {
  const q = norm(text);
  if (q.length < 3) return [];
  const qTokens = tokens(text);
  const scored: MatchResult[] = [];
  for (const d of corpus()) {
    let score = 0;
    for (const alias of d.aliasText.split(" | ")) if (alias.length >= 2 && hasPhrase(alias, q)) score += 6 * alias.split(" ").length;
    if (hasPhrase(d.titleLower, q)) score += 5;
    let overlap = 0;
    for (const w of qTokens) if (d.tokens.has(w)) overlap++;
    score += overlap * 1.2;
    if (/\([a-z0-9][^)]*\)\s*\(/.test(q) && d.conceptId === "algebra-expand") score += 4;
    const normScore = score / Math.max(4, qTokens.length * 0.8);
    if (normScore > 0.2) scored.push({ conceptId: d.conceptId, score: normScore, confident: normScore >= 0.9 });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}
