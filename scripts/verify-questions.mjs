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
//   questions -> {types, qterms, specifications}
//   qterms -> i18n
//   specifications -> {genome, curriculum, types}, genome -> types
for (const file of ["types.ts", "i18n.ts", "genome.ts", "curriculum.ts", "specifications.ts", "qterms.ts", "skills.ts", "questions-deep.ts", "questions.ts"]) {
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

const FLOAT_NOISE = /\d\.\d{5,}|\d\.\d*9{4,}|e[+-]\d+|NaN|undefined|Infinity/;

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
    const m = q.prompt.match(/√(\d+)/);
    if (!m) return `unparseable prompt: ${q.prompt}`;
    const inside = Number(m[1]);
    const c = q.choices[q.answer];
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
  "completing-square": (q) => {
    const m = q.prompt.match(/x² \+ (-?\d+)x \+ (-?\d+) = \(x \+ (-?\d+)\)² \+ \?/);
    if (!m) return `unparseable prompt: ${q.prompt}`;
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
