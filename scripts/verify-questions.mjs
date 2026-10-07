// Question-quality harness: the engine suite proves the *systems* work, but it
// never checked whether a generated question is actually answerable. This does.
//
// For every concept with a generator, draw many questions and assert the things
// a student would notice immediately:
//   1. four distinct options (no duplicates, correct not among the wrongs)
//   2. no floating-point noise in option text (3.4641016151377544, 5.999999999999999)
//   3. no NaN / undefined / empty text
//   4. prompt actually contains the thing it asks about
//
// Run: node scripts/verify-questions.mjs  (also wired as `npm run verify:q`)
//
// The engine is TypeScript and imports its neighbours by the extensionless TS
// convention, which bare node cannot resolve. Rather than add a runtime loader
// (tsx/ts-node) to the project's dependencies, transpile just the handful of
// files this harness needs — with the repo's own TypeScript — into a temp
// mirror, and import that. Nothing is written inside the project.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const LIB = fileURLToPath(new URL("../lib/", import.meta.url));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "om-questions-"));
// Transitive closure of questions.ts. Kept in step with the imports themselves —
// a missing link here is an ERR_MODULE_NOT_FOUND that reads like a broken
// question bank rather than a stale list:
//   questions -> {types, qterms, specifications, skills, questions-deep,
//                questions-senior, numeric-items, answer}
//   qterms -> i18n
//   specifications -> {genome, curriculum, types}, genome -> types
//   numeric-items -> {types, numeric-items-core}, numeric-items-core -> numeric-items
//   answer -> types
for (const file of ["types.ts", "i18n.ts", "genome.ts", "curriculum.ts", "specifications.ts", "qterms.ts", "skills.ts", "questions-deep.ts", "questions-computing.ts", "questions-chemistry.ts", "questions-physics.ts", "questions-biology.ts", "questions-mid-maths.ts", "questions-mid-computing.ts", "questions-mid-physics.ts", "questions-mid-chemistry.ts", "questions-mid-biology.ts", "questions-senior.ts", "numeric-items.ts", "numeric-items-core.ts", "answer.ts", "questions.ts"]) {
  const src = fs.readFileSync(path.join(LIB, file), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  // `./qterms` -> `./qterms.mjs`, so the emitted ESM actually resolves.
  const linked = js.replace(/(from\s*")(\.\/[^"]+)(")/g, "$1$2.mjs$3");
  fs.writeFileSync(path.join(TMP, file.replace(/\.ts$/, ".mjs")), linked);
}
const { generateQuestion, GENERATED_CONCEPT_IDS } = await import(
  pathToFileURL(path.join(TMP, "questions.mjs")).href,
);

const SAMPLES = 300;
const problems = new Map(); // conceptId -> Map(kind -> example)
const promptVariety = new Map(); // conceptId -> Set of distinct prompts seen

function add(conceptId, kind, example) {
  if (!problems.has(conceptId)) problems.set(conceptId, new Map());
  const m = problems.get(conceptId);
  if (!m.has(kind)) m.set(kind, example);
}

// "undefined" as a QUOTED literal ('undefined') is legitimate CS vocabulary being
// taught; a BARE `undefined` in prose is the leaked-interpolation artifact this
// rule exists to catch. The quote guard keeps the detector aimed at the artifact.
// The decimal threshold is 9, not 5: IEEE-754 artifacts carry 10–17 decimal
// digits (`13.333333333333334`), whereas an AUTHORED decimal can legitimately
// have fewer (`0.00042`, a standard-form operand) and was a false positive at
// 5. The `9{4,}` branch still catches the trailing-nines artifact.
// `NaN` IS MATCHED AS A TOKEN, NOT AS THREE LETTERS. The chemistry depth layer
// renders real formulae, and NaNO₃ contains N-a-N — so the unanchored form
// reported "float noise: NaNO₃2 | NaNO₃" on a perfectly correct item, which is
// the checker's gap wearing the costume of a content bug (the same failure mode
// as the SEMANTIC map read on a shape it does not know). A leaked NaN is always
// a standalone token: it is printed by `String(NaN)` into a slot where nothing
// else shares its word.
const FLOAT_NOISE = /\d\.\d{9,}|\d\.\d*9{4,}|e[+-]\d+|(?<![A-Za-z])NaN(?![A-Za-z])|(?<!['"])\bundefined\b(?!['"])|Infinity/;

// generateQuestion() pads colliding distractors with these. Seeing one means the
// generator's own three distractors collided — a weak question, not a bug.
const FILLER = [
  "None of these",
  "Cannot be determined from the information given",
  "Not enough information",
];

// ── Independent mathematical checks ────────────────────────────────────────
// These re-derive the answer from the prompt instead of trusting the generator.
const isPerfectSquare = (n) => n > 0 && Number.isInteger(Math.sqrt(n));

const SEMANTIC = {
  // "Simplify √N" — the answer must square back to N, be fully simplified, and
  // never be a decimal approximation of an irrational.
  surds: (q) => {
    const c = q.choices[q.answer];
    // COMPOUND FORMS FIRST. The depth layer combines and expands surds, and a
    // compound prompt cannot be checked against "the first √N in it": its
    // answer is a whole number that no single radicand explains. Reading it
    // that way reported two correct families as mathematically wrong, which is
    // the instrument's limitation and not the content's — so each recognised
    // shape is re-derived from the prompt's own numbers and the answer is
    // checked against THAT. A wrong answer in either family still fails.
    const combined = q.prompt.match(/\(√(\d+) \+ √(\d+)\) \÷ √(\d+)/);
    if (combined) {
      const A = Number(combined[1]), B = Number(combined[2]), C = Number(combined[3]);
      const value = (Math.sqrt(A) + Math.sqrt(B)) / Math.sqrt(C);
      const n = Number(c);
      if (!Number.isFinite(n) || Math.abs(n - value) > 1e-9) {
        return `(√${A} + √${B}) ÷ √${C} = ${value.toFixed(6)}, not ${c}`;
      }
      return null;
    }
    const expanded = q.prompt.match(/\((\d+)√(\d+) \+ (\d+)\)\((\d+)√(\d+) − (\d+)\)/);
    if (expanded) {
      const p = Number(expanded[1]), s1 = Number(expanded[2]), q1 = Number(expanded[3]);
      const p2 = Number(expanded[4]), s2 = Number(expanded[5]), q2 = Number(expanded[6]);
      const value = (p * Math.sqrt(s1) + q1) * (p2 * Math.sqrt(s2) - q2);
      const n = Number(c);
      if (!Number.isFinite(n) || Math.abs(n - value) > 1e-6) {
        return `(${p}√${s1} + ${q1})(${p2}√${s2} − ${q2}) = ${value.toFixed(6)}, not ${c}`;
      }
      return null;
    }
    // RATIONALISING A BINOMIAL DENOMINATOR — "k ÷ (m + √s)". The answer is a
    // compound a − b√s, so k/(m + √s) is re-derived from the prompt's numbers
    // and compared numerically; the value is irrational, and that comparison
    // is what proves the simplification, not the shape of the string.
    const rational = q.prompt.match(/(\d+) ÷ \((\d+) \+ √(\d+)\)/);
    if (rational) {
      const k = Number(rational[1]), m2 = Number(rational[2]), s2 = Number(rational[3]);
      const want = k / (m2 + Math.sqrt(s2));
      const got = c.match(/^(-?\d+) − (\d*)√(\d+)$/);
      if (!got) return `compound surd expected, got: ${c}`;
      const a2 = Number(got[1]);
      const b2 = got[2] === "" ? 1 : Number(got[2]);
      const r2 = Number(got[3]);
      if (r2 !== s2) return `denominator was √${s2} but the answer carries √${r2}: ${c}`;
      if (Math.abs(a2 - b2 * Math.sqrt(r2) - want) > 1e-6) {
        return `${k} ÷ (${m2} + √${s2}) = ${want.toFixed(6)}, not ${c}`;
      }
      return null;
    }
    // The numeric layer asks for the COEFFICIENT, not the value: "Simplify √N
    // as a√b where a is as large as possible. What is a?" — so the answer is
    // the largest integer whose square divides N, and N/a² must be squarefree.
    const simplify = q.prompt.match(/Simplify √(\d+) as a√b where a is as large as possible\. What is a\?/);
    if (simplify) {
      const N = Number(simplify[1]);
      let a = 1;
      let rem = N;
      for (let i = 2; i * i <= rem; i++) {
        while (rem % (i * i) === 0) { a *= i; rem /= i * i; }
      }
      const got = Number(q.choices[q.answer]);
      if (got !== a) return `largest square factor of ${N} is ${a}, said ${got}`;
      if (isPerfectSquare(rem)) return `left-over radicand ${rem} is a perfect square`;
      return null;
    }
    const m = q.prompt.match(/√(\d+)/);
    if (!m) return `unparseable prompt: ${q.prompt}`;
    const inside = Number(m[1]);
    const surd = c.match(/^(\d*)√(\d+)$/);
    let value;
    if (surd) {
      const a = surd[1] === "" ? 1 : Number(surd[1]);
      const b = Number(surd[2]);
      if (b < 2) return `radicand below 2: ${c}`;
      if (isPerfectSquare(b)) return `radicand ${b} is a perfect square — left unsimplified: ${c}`;
      if (isPerfectSquare(inside)) return `√${inside} is exact but answered as a surd: ${c}`;
      value = a * Math.sqrt(b);
    } else {
      const n = Number(c.match(/-?\d+(\.\d+)?/)?.[0]);
      if (Number.isNaN(n)) return `unparseable choice: ${c}`;
      if (!isPerfectSquare(inside)) return `√${inside} is irrational but answer is decimal ${c}`;
      value = n;
    }
    if (Math.abs(value * value - inside) > 1e-9) {
      return `√${inside} ≠ ${c} — it squares to ${(value * value).toFixed(6)}`;
    }
    return null;
  },
  // "x² + bx + c = (x + h)² + ?" — the constant must be c − h².
  // …and, from the depth layer, "Solve x² + bx + c = 0 … in surd form", whose
  // answer is checked by SUBSTITUTION: both printed roots must actually solve
  // the printed quadratic. That is a stronger test than the constant one, and
  // it is the reason the surd family is verified rather than waved through.
  "completing-square": (q) => {
    const m = q.prompt.match(/x² \+ (-?\d+)x \+ (-?\d+) = \(x \+ (-?\d+)\)² \+ \?/);
    if (!m) {
      // "Express x² + bx ± c in the form (x + p)² + q, and hence state the
      // minimum" — the turning point must be (q, −h) with h = b/2 and
      // q = c − h². Re-derived here, not read off the answer.
      // "Express ax² − bx ± c in the form a(x − h)² + k" — the leading
      // coefficient is not 1, so h = b/(2a) and k = c − a h²; the stated
      // minimum and its location are re-derived from the prompt's numbers.
      const lead = q.prompt.match(/Express (\d+)x² − (\d+)x ([+\u2212]) (\d+) in the form a\(x − h\)² \+ k/);
      if (lead) {
        const a = Number(lead[1]);
        const b = Number(lead[2]);
        const constant = (lead[3] === "+" ? 1 : -1) * Number(lead[4]);
        const h = b / (2 * a);
        const k = constant - a * h * h;
        const said = q.choices[q.answer].match(/^(\d+)\(x − (\d+)\)² ([+\u2212]) (\d+) — minimum (-?\d+) when x = (\d+)$/);
        if (!said) return `unparseable choice: ${q.choices[q.answer]}`;
        if (Number(said[1]) !== a) return `leading coefficient should stay ${a}, said ${said[1]}`;
        if (Number(said[2]) !== h) return `square should be (x − ${h}), said (x − ${said[2]})`;
        const saidK = (said[3] === "+" ? 1 : -1) * Number(said[4]);
        if (saidK !== k) return `constant should be ${k}, said ${saidK}`;
        if (Number(said[5]) !== k) return `minimum should be ${k}, said ${said[5]}`;
        if (Number(said[6]) !== h) return `minimum sits at x = ${h}, said ${said[6]}`;
        return null;
      }
      const turn = q.prompt.match(/Express x² \+ (-?\d+)x ([+\u2212]) (\d+) in the form/);
      if (turn) {
        const b = Number(turn[1]);
        const constant = (turn[2] === "+" ? 1 : -1) * Number(turn[3]);
        const h = b / 2;
        const qq = constant - h * h;
        const said = q.choices[q.answer].match(/^Minimum (-?\d+) when x = (-?\d+)$/);
        if (!said) return `unparseable choice: ${q.choices[q.answer]}`;
        if (Number(said[1]) !== qq) return `minimum should be ${qq}, said ${said[1]}`;
        if (Number(said[2]) !== -h) return `minimum sits at x = ${-h}, said ${said[2]}`;
        return null;
      }
      // The numeric layer's phrasing: "Write x² + bx + c in the form
      // (x + p)² + q. What is q?" — q = c − (b/2)². Re-derived, not read off.
      const write = q.prompt.match(/Write x² \+ (\d+)x \+ (\d+) in the form \(x \+ p\)² \+ q\. What is q\?/);
      if (write) {
        const wb = Number(write[1]);
        const wc = Number(write[2]);
        const wh = wb / 2;
        const want = wc - wh * wh;
        const got = Number(q.choices[q.answer]);
        if (got !== want) return `expected q = ${want}, got ${got}`;
        return null;
      }
      const solve = q.prompt.match(/x² \+ (\d+)x ([+\u2212]) (\d+) = 0/);
      const c = q.choices[q.answer];
      const roots = solve ? c.match(/^x = (-?\d+) ± √(\d+)$/) : null;
      if (!solve || !roots) return `unparseable prompt: ${q.prompt}`;
      const b = Number(solve[1]);
      const constant = (solve[2] === "+" ? 1 : -1) * Number(solve[3]);
      const h = Number(roots[1]);
      const rad = Number(roots[2]);
      if (isPerfectSquare(rad)) return `radicand ${rad} is a perfect square — the answer is not in surd form: ${c}`;
      const f = (x) => x * x + b * x + constant;
      for (const x of [h + Math.sqrt(rad), h - Math.sqrt(rad)]) {
        if (Math.abs(f(x)) > 1e-9) return `${c} does not solve ${q.prompt.trim()} (x=${x.toFixed(4)} gives ${f(x).toFixed(4)})`;
      }
      return null;
    }
    const b = Number(m[1]), c = Number(m[2]), h = Number(m[3]);
    if (h !== b / 2) return `h=${h} but b/2=${b / 2}`;
    const want = c - h * h;
    const got = Number(q.choices[q.answer]);
    if (got !== want) return `expected ${want}, got ${got}`;
    return null;
  },
  // "multiply by a and add b, get total" — undo it and check.
  "mixture-problems": (q) => {
    const m = q.prompt.match(/multiply it by (\d+) and add (\d+)\. I get (\d+)\./);
    if (!m) return null; // only the linear-worded variant is checkable
    const a = Number(m[1]), b = Number(m[2]), total = Number(m[3]);
    const got = Number(q.choices[q.answer]);
    if (a * got + b !== total) return `${a}×${got}+${b} ≠ ${total}`;
    return null;
  },
  // "sector radius r, angle d° — area in terms of π" — must be d·r²/360 π.
  "circle-area-arc": (q) => {
    const m = q.prompt.match(/radius (\d+) and angle (\d+)/);
    if (!m) return null;
    const r = Number(m[1]), d = Number(m[2]);
    const want = (d * r * r) / 360;
    const got = Number(q.choices[q.answer].replace(/π.*$/, ""));
    if (!(Math.abs(got - want) < 1e-9)) return `expected ${want}π, got ${q.choices[q.answer]}`;
    return null;
  },
};

for (const conceptId of GENERATED_CONCEPT_IDS) {
  for (let i = 0; i < SAMPLES; i++) {
    let q;
    try {
      q = generateQuestion(conceptId, `audit:${i}`);
    } catch (err) {
      add(conceptId, "threw", String(err).slice(0, 120));
      continue;
    }
    if (!q) { add(conceptId, "null", `seed audit:${i}`); continue; }
    if (!promptVariety.has(conceptId)) promptVariety.set(conceptId, new Set());
    promptVariety.get(conceptId).add(q.prompt);

    const opts = q.choices;
    if (!Array.isArray(opts) || opts.length !== 4) {
      add(conceptId, "wrong option count", JSON.stringify(opts));
      continue;
    }
    if (new Set(opts).size !== opts.length) add(conceptId, "duplicate option", opts.join(" | "));
    if (opts.some((o) => FILLER.includes(o))) add(conceptId, "filler distractor", opts.join(" | "));
    if (opts.some((o) => typeof o !== "string" || !o.trim())) add(conceptId, "empty option", JSON.stringify(opts));
    if (opts.some((o) => FLOAT_NOISE.test(String(o)))) {
      add(conceptId, "float noise", opts.filter((o) => FLOAT_NOISE.test(String(o))).join(" | "));
    }
    if (FLOAT_NOISE.test(q.prompt)) add(conceptId, "float noise in prompt", q.prompt);
    if (typeof q.answer !== "number" || q.answer < 0 || q.answer > 3) {
      add(conceptId, "bad answer index", `${conceptId} answer=${q.answer}`);
    }
    // Semantic check where the maths is independently verifiable.
    const check = SEMANTIC[conceptId]?.(q);
    if (check) add(conceptId, "mathematically wrong", check);
    if (!q.explanation || !q.explanation.trim()) add(conceptId, "empty explanation", q.prompt);
    if (FLOAT_NOISE.test(q.explanation)) add(conceptId, "float noise in explanation", q.explanation.slice(0, 140));
  }
}

let bad = 0;
for (const [conceptId, kinds] of [...problems].sort()) {
  bad++;
  console.log(`✗ ${conceptId}`);
  for (const [kind, example] of kinds) console.log(`    ${kind}: ${example}`);
}
// Practice is only "unlimited" if the generator actually varies. These counts are
// reported separately from failures: a single fixed question is a design choice
// (CONSTANT_GENS), but it means that concept repeats forever in practice.
const repeated = [...promptVariety]
  .filter(([, set]) => set.size === 1)
  .map(([id]) => id)
  .sort();
const nearFixed = [...promptVariety]
  .filter(([, set]) => set.size > 1 && set.size <= 3)
  .map(([id, set]) => `${id}(${set.size})`)
  .sort();

console.log(
  `\nQuestion audit: ${GENERATED_CONCEPT_IDS.length} generators × ${SAMPLES} draws — ` +
  `${bad} generator${bad === 1 ? "" : "s"} with problems, ${GENERATED_CONCEPT_IDS.length - bad} clean`,
);
console.log(
  `\nVariety: ${repeated.length} concepts always show the SAME question, ` +
  `${nearFixed.length} show ≤3 variants`,
);
if (repeated.length) console.log(`  fixed: ${repeated.join(", ")}`);
if (nearFixed.length) console.log(`  near-fixed: ${nearFixed.join(", ")}`);
if (bad) process.exit(1);
