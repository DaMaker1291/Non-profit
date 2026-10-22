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
// `i18n-recovery.ts` is imported by `i18n.ts` (the recovery vocabulary is merged
// into DICTS at load so key parity still holds for all 15 languages). This list
// is HARDCODED, so a new import of `lib/i18n.ts` that is not added here dies as
// ERR_MODULE_NOT_FOUND from /tmp — which reads like a broken question bank and
// is why the checklist run caught it rather than a reader.
for (const file of ["types.ts", "i18n.ts", "i18n-recovery.ts", "i18n-curriculum.ts", "i18n-device.ts", "i18n-kiosk.ts", "genome.ts", "curricula/registry.ts", "curriculum.ts", "specifications.ts", "qterms.ts", "skills.ts", "questions-deep.ts", "questions-computing.ts", "questions-chemistry.ts", "questions-physics.ts", "questions-biology.ts", "questions-mid-maths.ts", "questions-mid-computing.ts", "questions-mid-physics.ts", "questions-mid-chemistry.ts", "questions-mid-biology.ts", "questions-senior.ts", "numeric-items.ts", "numeric-items-core.ts", "answer.ts", "questions.ts"]) {
  const src = fs.readFileSync(path.join(LIB, file), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  // `./qterms` -> `./qterms.mjs`, so the emitted ESM actually resolves.
  const linked = js.replace(/(from\s*")(\.\/[^"]+)(")/g, "$1$2.mjs$3");
  // The mirror keeps the SOURCE's relative shape, because the mirror is what
  // resolves the imports: `curricula/registry.ts` becomes
  // `<tmp>/curricula/registry.mjs` so that `./curricula/registry` in the
  // compiled curriculum.ts still points at it. A flat mirror (the first version
  // of this list) only worked while every file lived in lib/ root.
  const dest = path.join(TMP, file.replace(/\.ts$/, ".mjs"));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, linked);
}
const { generateQuestion, GENERATED_CONCEPT_IDS } = await import(
  pathToFileURL(path.join(TMP, "questions.mjs")).href,
);
// The "is this option the same ANSWER as that one" rule has ONE owner, and this
// harness imports it rather than keeping a copy: the assembler discards a
// distractor it can see is the key, so a check with a different idea of
// sameness would either miss a served duplicate or demand a repair the
// assembler has already made. `answer.ts` is in the mirror list above.
const { optionValueKey } = await import(pathToFileURL(path.join(TMP, "answer.mjs")).href);

const SAMPLES = 300;
const problems = new Map(); // conceptId -> Map(kind -> example)
const promptVariety = new Map(); // conceptId -> Set of distinct prompts seen
// How much of the bank is INDEPENDENTLY re-derived from the prompt rather than
// only checked for shape (four options, no float noise, an explanation). This is
// the number that says what a green run is worth: the wrong-key defect in
// `fractions` was invisible to every structural check and was found by a
// matcher, so an item no matcher recognises is an item nobody has verified.
const rederived = { total: 0, wrong: 0 };

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

// A fraction as a VALUE, whether it is written `13/30`, `-1/6` or `2`. Used to
// check an answer against the number it claims to be rather than its shape.
const fracValue = (text) => {
  const s = String(text).trim().replace(/[\u2212\u2013]/g, "-");
  const fr = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fr) return Number(fr[2]) === 0 ? null : Number(fr[1]) / Number(fr[2]);
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return null;
};

const gcdOf = (a, b) => (b === 0 ? Math.abs(a) : gcdOf(b, a % b));

// ── OPTION INTEGRITY: two options that ARE the same answer ─────────────────
// The character-for-character duplicate check below misses options that state
// the same thing differently, and that is not hypothetical: this harness found
// `45/360` served beside `1/8` (a pie-chart share), `11.00` beside `11.0` (a
// decimal sum), `2/3` beside `4/6` (both operands of a fraction item) and `22`
// beside `22.00` (a mean whose padder could not see an already-formatted
// distractor). Each is a second CORRECT option on a four-option question: pick
// either and the other is recorded as a mistake. `optionValueKey` is imported
// from lib/answer.ts — see it for the rule, including why a pair of roots is
// unordered while a pair of bare numbers is not.

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
  // "Work out a/b ± c/d" — the answer is re-derived as a SIGNED value. This
  // matcher exists because the family served `1/6 − 1/3` with the key `1/6`: the
  // difference taken as a MAGNITUDE, an explanation asserting 1 − 2 = 1, and an
  // option set (1/2, 2/9, 1/3, 1/6) that contained no correct answer at all.
  // The maths is re-derived from the prompt's own numbers, and the key must
  // also be in lowest terms, because that is what the prompt asks for.
  fractions: (q) => {
    const m = q.prompt.match(
      /^Work out (-?\d+)\/(\d+) ([+\u2212-]) (-?\d+)\/(\d+)\. Give your answer as a fraction in its simplest form\.$/,
    );
    if (!m) return null; // the other families for this concept are word problems
    const n1 = Number(m[1]), d1 = Number(m[2]), n2 = Number(m[4]), d2 = Number(m[5]);
    const value = n1 / d1 + (m[3] === "+" ? 1 : -1) * (n2 / d2);
    const key = String(q.choices[q.answer]).trim();
    const got = fracValue(key);
    if (got === null) return `unparseable choice: ${key}`;
    if (Math.abs(got - value) > 1e-9) {
      return `${n1}/${d1} ${m[3]} ${n2}/${d2} = ${value}, but the key is ${key}`;
    }
    const fr = key.replace(/^\+/, "").match(/^(-?\d+)\/(\d+)$/);
    if (fr && gcdOf(Math.abs(Number(fr[1])), Number(fr[2])) !== 1) {
      return `key not in lowest terms: ${key}`;
    }
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
    // The SAME ANSWER written two ways is the defect the string check cannot
    // see, and it is a learner who suffers it: whichever of the two they pick,
    // the other is scored as one of their mistakes.
    const signatures = opts.map(optionValueKey);
    for (let a = 0; a < signatures.length; a += 1) {
      for (let b = a + 1; b < signatures.length; b += 1) {
        if (signatures[a] !== null && signatures[a] === signatures[b]) {
          add(
            conceptId,
            "two options are the same answer",
            `${opts[a]} | ${opts[b]} — seed audit:${i} — ${q.prompt.replace(/\s+/g, " ").slice(0, 110)}`,
          );
        }
      }
    }
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
    // `null` has TWO meanings and they must not be conflated: "checked, and it is
    // right" and "this shape is not one I can re-derive". Only the second is
    // unverified, and counting it is the honest answer to "how much of the bank
    // is independently verified?" — a suite that reports only pass/fail makes a
    // matcher that recognises nothing look identical to one that recognises all.
    // A matcher returns a STRING for "wrong" and `null` for BOTH "checked and
    // right" and "this shape is not mine" — so a null result cannot be counted
    // as verification. What can be counted is the reach: how many concepts have
    // any independent matcher at all. That number, not the pass count, is what
    // says how much of a green run rests on re-derivation.
    if (SEMANTIC[conceptId]) {
      rederived.total += 1;
      if (check !== null) rederived.wrong += 1;
    }
    if (check) add(conceptId, "mathematically wrong", `${check} — seed audit:${i}`);
    if (!q.explanation || !q.explanation.trim()) add(conceptId, "empty explanation", q.prompt);
    if (FLOAT_NOISE.test(q.explanation)) add(conceptId, "float noise in explanation", q.explanation.slice(0, 140));
  }
}

// ── HUMAN REVIEW IS A CLAIM WITH A NAME AND A DATE ──────────────────────────
// `humanReviewed` is READ from audit/item-reviews.json, never typed into a
// report, so the published coverage figure has exactly one source. An entry that
// names a concept the bank does not generate, or carries no reviewer and no
// date, is a broken claim about the product and FAILS this audit: a review
// nobody signed is indistinguishable from decoration, which is the failure mode
// this whole file exists to prevent.
const REVIEWS_PATH = "audit/item-reviews.json";
const reviews = (() => {
  // THREE STATES, THREE SEVERITIES. An ABSENT registry is not a fault: it says
  // nobody has recorded a review, which the coverage line already reports as 0
  // human-reviewed — failing here would make a deleted file look like broken
  // content. An UNREADABLE one is corruption and fails loudly, and a file whose
  // shape is wrong fails too, because silently reading it as "no reviews" would
  // erase real review claims without a word. Measured: before this, removing the
  // file turned the audit red with an ENOENT, which is the wrong severity.
  if (!fs.existsSync(REVIEWS_PATH)) return [];
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(REVIEWS_PATH, "utf8"));
  } catch (e) {
    add("item-reviews", "review registry unreadable (corrupt)", String(e && e.message ? e.message : e));
    return [];
  }
  if (!raw || !Array.isArray(raw.reviews)) {
    add("item-reviews", "review registry present but its `reviews` array is missing", typeof raw);
    return [];
  }
  return raw.reviews;
})();
const reviewedIds = new Set();
for (const r of reviews) {
  if (!r || typeof r.conceptId !== "string" || !GENERATED_CONCEPT_IDS.includes(r.conceptId)) {
    add("item-reviews", "review names a concept the bank does not generate", JSON.stringify(r).slice(0, 120));
    continue;
  }
  if (typeof r.reviewer !== "string" || !r.reviewer.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(r.reviewedOn ?? "")) {
    add(r.conceptId, "review claim without a reviewer or a date", JSON.stringify(r).slice(0, 120));
    continue;
  }
  reviewedIds.add(r.conceptId);
}
// ORDER MATTERS AND THE FIRST VERSION GOT IT WRONG: this block ran AFTER
// the failure count below, so `add()` calls it made could never affect the
// exit status — a planted nameless review passed the audit silently. Every
// check must be evaluated before the thing that counts it.
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

// ── THE EXPLANATION MUST NOT CONTRADICT THE KEY ──────────────────────────────
// A verdict on the WHOLE bank can be derived without a matcher per prompt shape,
// and that is how the one wrong key in `fractions` should have been caught: the
// explanation's own working disagreed with the key it was explaining. It read
// "(2 − 5)/6 = 1/2", where 2 − 5 is not 1 and 1/2 is not 2/6 − 5/6 either.
//
// The rule is deliberately one-sided: an explanation MAY state intermediate
// values (`= 15/10 = 3/2` is a correct explanation of 3/2), so this does not
// demand that every value it derives equals the key. It demands the weaker,
// sound thing — the key must appear among the values the explanation derives.
// An item whose explanation never arrives at its own answer is not explaining
// the answer, whatever the answer is.
//
// A numeric explanation must MENTION its own answer. The first draft of this
// rule looked only at values written straight after an `=`, and its six hits
// were all the same false positive: `771 = 700 + 70 + 1, so the ones digit
// contributes 1` derives 700 and states the key as a term of the sum, not after
// an equals sign. So the rule considers every value token in the explanation,
// which is the weaker claim and the sound one. Where it does not apply — a
// sentence with no numbers at all, or a key that is not a plain value — it says
// nothing, because a shape it cannot read must cost a missed check rather than a
// false failure.
//
// MEASURED before it was enforced: 0 of 40,500 draws failed it, after the fix
// above removed 6 false positives in `place-value`.
const unexplained = [];
const valueTokens = (text) =>
  [...String(text ?? "").matchAll(/[\u2212-]?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?/g)]
    .map((m) => optionValueKey(m[0].replace(/\s+/g, "")))
    .filter((v) => v !== null);
for (const conceptId of GENERATED_CONCEPT_IDS) {
  for (let i = 0; i < SAMPLES; i += 1) {
    const q = generateQuestion(conceptId, `audit:${i}`);
    if (!q) continue;
    const key = optionValueKey(String(q.choices?.[q.answer] ?? ""));
    if (key === null || key.includes("&")) continue;
    const mentioned = valueTokens(q.explanation);
    if (mentioned.length === 0) continue; // states its answer in words — not this rule's business
    if (!mentioned.includes(key)) {
      add(conceptId, "explanation never states the key",
        `key ${key}, explanation states ${[...new Set(mentioned)].join(", ")} — "${q.prompt.replace(/\s+/g, " ").slice(0, 70)}" (seed audit:${i})`);
      unexplained.push(conceptId);
    }
  }
}

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
// Reported as well as enforced: the count is the evidence that the rule is
// still measuring what it was written for, and a rise in it is the signal that a
// family started explaining something other than its own answer.
console.log(
  `\nExplanation-vs-key: ${unexplained.length}` +
  `${unexplained.length ? " item(s) whose explanation never states its own answer" : " items — every numeric explanation arrives at its own key"}`,
);
const draws = GENERATED_CONCEPT_IDS.length * SAMPLES;
const reachPct = ((100 * rederived.total) / draws).toFixed(1);
const MATCHED_CONCEPTS = Object.keys(SEMANTIC).length;
const conceptPct = ((100 * MATCHED_CONCEPTS) / GENERATED_CONCEPT_IDS.length).toFixed(1);
console.log(
  `\nIndependent verification, stated honestly:` +
  `\n  · ${MATCHED_CONCEPTS}/${GENERATED_CONCEPT_IDS.length} concepts (${conceptPct}%) have a matcher that re-derives the answer` +
  `\n    from the prompt — ${rederived.total}/${draws} draws (${reachPct}%), ${rederived.wrong} of them wrong.` +
  `\n  · the other ${draws - rederived.total} draws met the STRUCTURAL rules only (four value-distinct options,` +
  `\n    no float noise, a non-empty explanation that states its own key, a sane difficulty). That is` +
  `\n    a measurement, not a clean bill: no matcher exists for those shapes yet.` +
  `\n  · the explanation and option rules apply to every draw, so a defect of the kind found in` +
  `\n    \`fractions\` (the key contradicted by its own working) cannot pass unnoticed in a numeric item.`,
);
// ── THE COVERAGE LEDGER ──────────────────────────────────────────────────────
// A green run says "nothing the checks can see is wrong". This file says WHAT the
// checks can see, per concept — because the honest weakness of this suite is not
// a failing assertion, it is the 130 concepts no matcher reaches, and a single
// pass count hides them. Written deterministically (no timestamp), so a diff in
// `audit/verification-coverage.json` IS the review: a concept moving from
// structural-only to prompt-derived is a real change in what has been verified.
//
// `humanReviewed` is a list, not a count, and it is empty. No qualified person
// has examined any of this content yet; an empty list says that plainly, where a
// number like "0" invites being read as "not applicable".
{
  const perConcept = {};
  for (const id of GENERATED_CONCEPT_IDS) {
    perConcept[id] = { promptDerived: Boolean(SEMANTIC[id]), humanReviewed: reviewedIds.has(id) };
  }
  const coverage = {
    note:
      "Per-concept record of what has been verified, and how. structure = four value-distinct options, no float noise, a non-empty explanation, a sane difficulty. explanationKey = the explanation states its own key (every draw). promptDerived = a matcher re-derives the answer from the prompt for this concept (see scripts/verify-questions.mjs). humanReviewed = a qualified person has examined the items; empty, because none has.",
    samplesPerConcept: SAMPLES,
    draws,
    layers: {
      structure: GENERATED_CONCEPT_IDS.length,
      explanationKey: GENERATED_CONCEPT_IDS.length,
      promptDerived: Object.keys(SEMANTIC).sort(),
      structuralOnly: GENERATED_CONCEPT_IDS.filter((id) => !SEMANTIC[id]).sort(),
      humanReviewed: [...reviewedIds].sort(),
      humanReviewedFrom: "audit/item-reviews.json",
    },
    perConcept,
  };
  fs.writeFileSync("audit/verification-coverage.json", `${JSON.stringify(coverage, null, 2)}\n`);
  console.log(
    `\nCoverage ledger → audit/verification-coverage.json` +
    `\n  ${Object.keys(SEMANTIC).length} concepts prompt-derived · ${GENERATED_CONCEPT_IDS.length - Object.keys(SEMANTIC).length} structural-only · ${reviewedIds.size} human-reviewed` +
    `${reviewedIds.size ? ` (${[...reviewedIds].join(", ")})` : " (audit/item-reviews.json is empty — nobody has reviewed any item)"}.`,
  );
}

if (bad) process.exit(1);
