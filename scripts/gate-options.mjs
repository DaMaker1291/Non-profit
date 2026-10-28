// ─────────────────────────────────────────────────────────────────────────────
// THE OPTION-LENGTH GATE.
//
// WHY THIS EXISTS. `npm run audit:options` measured a content fault that no other
// gate can see: the correct option of a multiple-choice item is systematically the
// LONGEST string on screen, so a learner who never reads the question and simply
// picks the longest option scores well above the 25% chance line. The first
// measurement put it at 37.3% on the surface a learner actually meets
// (served@0.75) and at 100% on individual concepts. The audit REPORTS that and
// nothing more, so the repair could regress the moment the next content change
// touched a generator — which is exactly how the fault arrived in the first place.
//
// WHAT IT MEASURES. Two things, because they are different claims:
//
//   · per concept, the BEST of the four length-only strategies (pick a longest,
//     pick a shortest, pick only among the length extremes, pick only among the
//     middle-length options), measured on the served@0.75 surface — the
//     production serve, `generateQuestionNear(id, seed, 0.75, 40)`, which is the
//     call app/api/progress/route.ts makes. A learner does not have to know
//     WHICH length is the tell; only that length carries information. The best of
//     the four is therefore the honest exposure figure, and `strict`/`longest`
//     alone understate it.
//   · bank-wide, the same four strategies and the key-length RANK distribution,
//     so the shape of the fault is visible rather than only its worst corner.
//
// THE BASELINE IS A COMMITTED FILE, updated only deliberately:
//
//   npm run gate:options -- --write-baseline
//
// Regenerating it shows up as a git diff, so loosening a floor is always a
// reviewable act rather than an accident. Default runs only READ it.
//
// REPAIRED CONCEPTS ARE ASSERTED ABSOLUTELY. `REPAIRED` names the concepts whose
// families were rewritten to spread the key's length rank, each with the ceiling
// it now holds — a family that loses its rank spread drops back toward 100% and
// fails here by a mile, while a legitimate wording tweak does not.
//
// THE REMAINDER IS NAMED, NOT HIDDEN. Concepts still above the reporting line are
// listed every run. They are a genuine, measured content backlog (a per-family
// authoring job in lib/questions-deep.ts), and a gate that held them at a floor
// without saying so would be the same silence that let this fault ship.
//
// Run:  npm run gate:options
// ─────────────────────────────────────────────────────────────────────────────
import { compileEngines } from "./compile-engines.mjs";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

compileEngines();
const require = createRequire(import.meta.url);
const Q = require("../.verify/questions.js");

const SEEDS = 60; // per concept, on the served surface
const TARGET = 0.75; // the advanced-tier target the audit judges with
const ATTEMPTS = 40; // what app/api/progress/route.ts serves with — pinned on purpose
const CHANCE = 0.25; // four options, one key
const REPORT_LINE = 0.35; // above this a concept is named as an offender
const TOL = 0.02; // noise tolerance on a recorded floor
const BASELINE = "audit/option-bias-baseline.json";

// ── Concepts whose repair HELD at the level a learner meets ──────────────────
// A family-level measurement is not a concept-level one. `generateQuestionNear`
// picks among every generator a concept owns, and at a 0.75 target it can land
// on one row of one family almost every time — so spreading the key's length
// rank across a family's rows does not spread it on the item actually served.
// Only concepts verified at the SERVED level are asserted here.
//
// ai-basics: was 100% (every variant's key was the longest option), now 36.7%
// with the best of the eight strategies, held across held-out seeds.
//
// ── THE 2026-10 PASS: THE LONGEST-KEY TIER ──────────────────────────────────
// A learner reported the symptom in the plainest possible words — "sometimes
// the longest answer is always right" — and the audit agreed: 28 of 135 concepts
// put the key in the longest option at ≥90% of served draws, 6 of them at
// exactly 100%. The measurement is what the report could not say, and the
// repair is what the measurement could not do.
//
// TWO MECHANISMS, both seen at the SERVED level (family-level edits are not
// enough — see the note in the audit about `gravity-fields`):
//
//  1. PARALLEL CLAUSES. Every distractor is now stated as fully as the key, so
//     length stops carrying the answer. This is not padding: a fuller statement
//     of a misconception is a better distractor, because it names the reasoning
//     the learner has to reject rather than just the label.
//  2. MORE CANDIDATES THAN OPTIONS. A fixed option set carries a FIXED length
//     rank, so a single `pickDistinct(key, [w1, w2, w3])` cannot vary — the key
//     is the longest string on every draw or on none. `r.shuffle([...5 or 6]))`
//     before `pickDistinct` makes which three are served vary per draw, which is
//     what lets one row hold several ranks. Families with several scenes
//     (`proof`, `evolution`, `circle-geometry-adv`) instead give each scene its
//     own rank — the `ai-basics` pattern — which costs no new content.
//
// ⚠ THE FLOOR IS 50%, AND IT IS ARITHMETIC, NOT EFFORT. With four options, one
// strategy always wins: if the key is neither longest nor shortest, `middles`
// scores 1/2 = 50% on that item; if it IS an extreme, `longest`/`shortest`
// scores 100% and `extremes` 50%. So NO single fixed option set can score below
// 50%, and the only way under it is variation across the items a concept serves.
// `cells` sits at 63% for exactly this reason and is recorded honestly rather
// than papered over. The concepts that reached 25–45% did so because their
// served set now varies; the ones at 40–50% are at or near the floor.
//
// Ceilings are measured + 0.04, and were checked on HELD-OUT seeds (prefix
// `held-out:opt-bias`) before being written here: every one reproduced inside
// 0.05 points, so this is a property of the option sets, not of the 60 draws the
// edit was chosen against.
const REPAIRED = {
  "ai-basics": 0.45,
  // Was 100% — the four concepts where "pick the longest" never failed.
  bounds: 0.29, // 100% → 25%: every area now printed to a stated 2 dp
  enzymes: 0.41, // 100% → 38%
  evolution: 0.46, // 100% → 42%
  proof: 0.42, // 100% → 38%, one rank per scene
  // Was 93–99%.
  photosynthesis: 0.46, // 98% → 43%
  respiration: 0.46, // 93% → 42%
  digestion: 0.51, // 93% → 47%
  diffusion: 0.45, // 98% → 41%
  biodiversity: 0.47, // 97% → 43%
  "breathing-gas": 0.45, // 97% → 41%
  "covalent-bonding": 0.46, // 95% → 42%
  "metallic-bonding": 0.41, // 95% → 38%
  "rates-reaction": 0.49, // 97% → 45%
  "light-optics": 0.43, // 98% → 39%
  "circle-geometry-adv": 0.46, // 99% → 42%
  cybersecurity: 0.50, // 94% → 46%
  "nervous-system": 0.49, // 92% → 45%
  "immune-health": 0.48, // 91% → 44%
  "em-induction": 0.50, // 89% → 46%
  // 95% → 63%: at the four-option floor (see above), so it is held here rather
  // than claimed as repaired.
  cells: 0.67,
};

// ── Repairs that did NOT hold, with the measured reason ─────────────────────
// Both were rewritten, both were measured at family level as repaired, and both
// fail at the served level — so they are recorded as backlog rather than
// claimed as fixed. The instrument is what changed the verdict, and writing this
// down is the point of the exercise: a text-length cue was replaced by a DIGIT
// cue, because the multi-clause distractor each fix wrote contains no numeral
// while the key quotes one.
const ATTEMPTED = {
  "gravity-fields": "served row is the field-strength item; its key is the only option containing a number (digit strategy 88.3%)",
  hormones: "served row is the feedback-sequence item; its key is the only option quoting the set point (digit strategy 82.5%)",
};

// Every cue a learner can read off an option set without knowing the subject.
// They are scored SEPARATELY and each is held at its own floor, because a repair
// that trades one cue for another (longest key → middle-length key) would pass a
// combined figure while making the bank no harder to game.
const STRATEGIES = ["longest", "shortest", "extremes", "middles", "digits", "magnitude", "first", "last"];
const SUPS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function digitCount(s) {
  return (String(s).match(/\d/g) ?? []).length;
}
function magnitude(s) {
  const m = String(s).trim().match(/^([+-]?\d+(?:\.\d+)?)(?:\s*×\s*10([⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+))?/);
  if (!m) return null;
  const mant = Number(m[1]);
  if (!Number.isFinite(mant)) return null;
  if (!m[2]) return mant;
  const exp = (m[2].startsWith("⁻") ? -1 : 1) * Number(m[2].replace("⁻", "").split("").map((c) => SUPS.indexOf(c)).join(""));
  return mant * Math.pow(10, exp);
}
function argmaxOf(vals) {
  const nums = vals.filter((v) => v !== null);
  if (!nums.length) return [];
  const top = Math.max(...nums);
  return vals.map((v, i) => (v === top ? i : -1)).filter((i) => i >= 0);
}

function scoreItem(choices, answer) {
  const lens = choices.map((c) => String(c).length);
  const max = Math.max(...lens);
  const min = Math.min(...lens);
  const longest = lens.map((n, i) => (n === max ? i : -1)).filter((i) => i >= 0);
  const shortestIdx = lens.map((n, i) => (n === min ? i : -1)).filter((i) => i >= 0);
  const isLongest = lens[answer] === max;
  const isShortest = lens[answer] === min && longest.length !== lens.length;
  const extremes = new Set([...longest, ...shortestIdx]).size;
  const middles = lens.length - extremes;
  const digits = choices.map((c) => digitCount(c));
  const mags = choices.map((c) => magnitude(c));
  const topDigits = Math.max(...digits);
  return {
    longest: isLongest ? 1 / longest.length : 0,
    shortest: isShortest ? 1 / shortestIdx.length : 0,
    extremes: isLongest || isShortest ? 1 / extremes : 0,
    middles: !isLongest && !isShortest && middles > 0 ? 1 / middles : 0,
    digits: topDigits > 0 && digits[answer] === topDigits ? 1 / digits.filter((d) => d === topDigits).length : 0,
    magnitude: mags[answer] !== null && argmaxOf(mags).includes(answer) ? 1 / argmaxOf(mags).length : 0,
    first: answer === 0 ? 1 : 0,
    last: answer === choices.length - 1 ? 1 : 0,
  };
}

function emptyTally() {
  return { n: 0, longest: 0, shortest: 0, extremes: 0, middles: 0, digits: 0, magnitude: 0, first: 0, last: 0 };
}
function add(t, s) {
  t.n += 1;
  for (const k of STRATEGIES) t[k] += s[k];
}
/** Combine one concept's TALLY into the bank's — `add` counts ITEMS, this counts
 *  what a tally already counted. Using `add` for tallies divides the bank by the
 *  number of concepts instead of the number of items, which reported a 2040%
 *  "win rate" the first time this gate ran. */
function mergeTally(a, b) {
  a.n += b.n;
  for (const k of STRATEGIES) a[k] += b[k];
  return a;
}
const best = (t) => Math.max(...STRATEGIES.map((k) => t[k])) / (t.n || 1);

/** Every concept's tally on the served surface, plus the bank-wide pool. */
function measure() {
  const per = {};
  const bank = emptyTally();
  for (const id of [...Q.GENERATED_CONCEPT_IDS].sort()) {
    const t = emptyTally();
    for (let k = 0; k < SEEDS; k++) {
      const q = Q.generateQuestionNear(id, `gate:options:${id}:${k}`, TARGET, ATTEMPTS);
      if (!q?.choices || q.choices.length < 2) continue;
      add(t, scoreItem(q.choices, q.answer));
    }
    if (t.n) {
      per[id] = {
        n: t.n,
        best: best(t),
        subject: Q.generatorSubject(id) ?? "other",
        ...Object.fromEntries(STRATEGIES.map((k) => [k, t[k] / t.n])),
      };
      mergeTally(bank, t);
    }
  }
  return { per, bank: { ...bank, best: best(bank) } };
}

const write = process.argv.includes("--write-baseline");
console.log(`Measuring ${Q.GENERATED_CONCEPT_IDS.length} concepts on the served@${TARGET.toFixed(2)} surface (${SEEDS} draws each, ${ATTEMPTS} attempts)…`);
const { per, bank } = measure();
const ids = Object.keys(per).sort((a, b) => per[b].best - per[a].best);

// ── Baseline ─────────────────────────────────────────────────────────────────
if (write) {
  const out = {
    note: "Option-length-bias baseline. Regenerated ONLY with `npm run gate:options -- --write-baseline`; the diff is the review.",
    seeds: SEEDS,
    target: TARGET,
    attempts: ATTEMPTS,
    chance: CHANCE,
    reportLine: REPORT_LINE,
    bank: { best: bank.best, n: bank.n, ...Object.fromEntries(STRATEGIES.map((k) => [k, bank[k] / bank.n])) },
    perConcept: Object.fromEntries(ids.map((id) => [id, { best: per[id].best, n: per[id].n }])),
  };
  fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
  fs.writeFileSync(BASELINE, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${BASELINE}: ${ids.length} concepts, bank best ${(100 * bank.best).toFixed(2)}%.`);
}

let baseline;
try {
  baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
} catch {
  console.error(`FATAL: ${BASELINE} is missing or unreadable. Create it deliberately with:`);
  console.error("  npm run gate:options -- --write-baseline");
  process.exit(1);
}

// ── Checks ───────────────────────────────────────────────────────────────────
let pass = 0;
const failures = [];
const ok = (cond, name, detail = "") => {
  if (cond) pass += 1;
  else { failures.push({ name, detail }); console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
};

// 1. The repaired concepts are asserted ABSOLUTELY, not merely held still.
for (const [id, ceiling] of Object.entries(REPAIRED)) {
  if (!per[id]) { ok(false, `repaired concept "${id}" still has a generator`); continue; }
  ok(per[id].best <= ceiling, `"${id}" holds its repaired ceiling ${(100 * ceiling).toFixed(0)}%`,
     `now ${(100 * per[id].best).toFixed(1)}%`);
}

// 2. Every concept is held at its recorded floor — the frontier cannot widen
//    silently.
let regressed = 0;
for (const [id, b] of Object.entries(baseline.perConcept)) {
  if (!per[id]) { ok(false, `baseline names concept "${id}", which no longer generates`); continue; }
  if (per[id].best > b.best + TOL) {
    regressed += 1;
    ok(false, `"${id}" did not regress`, `now ${(100 * per[id].best).toFixed(1)}% vs baseline ${(100 * b.best).toFixed(1)}%`);
  }
}
if (!regressed) pass += 1;

// 3. The bank-wide figure, and the SAME claim measured over four strategies.
ok(bank.best <= baseline.bank.best + TOL, `bank-wide best length-only strategy holds at or below ${(100 * baseline.bank.best).toFixed(2)}%`,
   `now ${(100 * bank.best).toFixed(2)}%`);
for (const strategy of STRATEGIES) {
  const before = baseline.bank[strategy] ?? 0;
  ok(bank[strategy] / bank.n <= before + TOL, `bank-wide "${strategy}" strategy holds at or below ${(100 * before).toFixed(2)}%`,
     `now ${(100 * bank[strategy] / bank.n).toFixed(2)}%`);
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log("");
console.log(`bank-wide, served@${TARGET.toFixed(2)} — chance is ${(100 * CHANCE).toFixed(0)}%`);
for (let i = 0; i < STRATEGIES.length; i += 4) {
  console.log("  " + STRATEGIES.slice(i, i + 4).map((k) => `${k} ${(100 * bank[k] / bank.n).toFixed(2)}%`).join("   "));
}
console.log(`  BEST OF THE EIGHT ${(100 * bank.best).toFixed(2)}%   (chance ${(100 * CHANCE).toFixed(0)}%)`);
console.log("");
const offenders = ids.filter((id) => per[id].best > REPORT_LINE && !(id in REPAIRED));
console.log(`concepts above the ${(100 * REPORT_LINE).toFixed(0)}% reporting line: ${offenders.length} of ${ids.length}` +
  `   · repaired and asserted: ${Object.keys(REPAIRED).length}`);
console.log("\nthe worst 25 (the measured content backlog — a per-family authoring job, not a code defect):");
console.log(`  ${"concept".padEnd(23)}${"subject".padEnd(10)}${"best".padStart(6)}  ${STRATEGIES.map((k) => k.slice(0, 8).padStart(9)).join("")}`);
for (const id of ids.slice(0, 25)) {
  const c = per[id];
  console.log(`  ${id.padEnd(23)}${String(c.subject).padEnd(10)}${(100 * c.best).toFixed(1).padStart(6)}  ${STRATEGIES.map((k) => (100 * c[k]).toFixed(1).padStart(9)).join("")}`);
}
const repairedRows = Object.keys(REPAIRED).filter((id) => per[id]);
if (repairedRows.length) {
  console.log("\nrepaired and asserted absolutely (verified at the SERVED level):");
  for (const id of repairedRows) console.log(`  ${id.padEnd(23)}${(100 * per[id].best).toFixed(1).padStart(6)}%  (ceiling ${(100 * REPAIRED[id]).toFixed(0)}%)`);
}
const attemptedRows = Object.keys(ATTEMPTED).filter((id) => per[id]);
if (attemptedRows.length) {
  console.log("\nREWRITTEN BUT NOT FIXED — measured at the served level, recorded as backlog:");
  for (const id of attemptedRows) {
    const c = per[id];
    console.log(`  ${id.padEnd(23)}${(100 * c.best).toFixed(1).padStart(6)}%  (longest ${(100 * c.longest).toFixed(1)}% · shortest ${(100 * c.shortest).toFixed(1)}% · middles ${(100 * c.middles).toFixed(1)}% · digits ${(100 * c.digits).toFixed(1)}%)`);
    console.log(`      ${ATTEMPTED[id]}`);
  }
}
// ── THE PUBLISHED REPORT MUST AGREE WITH THIS RUN ───────────────────────────────
// docs/ASSESSMENT_VALIDITY.md is prose: nothing generated it and, until this
// block existed, nothing read it. Measured drift: §7 said "82 of 135" while this
// gate's own artefact said 64, and the disagreeement was invisible until a reader
// compared the two by hand — in a document whose stated rule is "one reproducible
// measurement source, with every claim checked against it". The document is the
// surface a school, a reviewer or a funder actually reads, so its headline figures
// are asserted HERE, where the numbers are produced. Each anchor is a phrase
// unique to the CURRENT-figure sentence, so the historical "82" the report keeps
// on purpose is not matched. An anchor that cannot be found is a FAILURE, not a
// skip: a report that stops stating its figure has stopped being checkable, and a
// guard that silently passes on a reworded document is the silence this gate
// exists to prevent.
const REPORT_DOC = "docs/ASSESSMENT_VALIDITY.md";
if (fs.existsSync(REPORT_DOC)) {
  const doc = fs.readFileSync(REPORT_DOC, "utf8").replace(/\s+/g, " ");
  const claim = (re, name, expected) => {
    const m = doc.match(re);
    if (!m) return ok(false, `${name}: the report no longer states this figure`, REPORT_DOC);
    ok(Number(m[1]) === expected, `${name} matches this run (${expected})`, `the report says ${m[1]}`);
  };
  claim(/\*\*(\d+) of \d+ concepts are still above the 35% reporting line\*\*/, "the report's offender count", offenders.length);
  claim(/\*\*(\d+) are repaired and asserted absolutely\*\*/, "the report's repaired count", Object.keys(REPAIRED).length);
  claim(/best of the eight strategies is \*\*([\d.]+)%\*\*/, "the report's bank-wide best-of-eight", Number((100 * bank.best).toFixed(2)));
} else {
  ok(false, "the assessment-validity report is missing", REPORT_DOC);
}

console.log(`\n${"─".repeat(60)}`);
console.log(`PASS ${pass}   FAIL ${failures.length}`);
if (failures.length) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  · ${f.name}${f.detail ? " — " + f.detail : ""}`);
}
fs.writeFileSync("audit/options-gate.json", JSON.stringify({
  pass, fail: failures.length, failures,
  bank: { best: bank.best, n: bank.n, ...Object.fromEntries(STRATEGIES.map((k) => [k, bank[k] / bank.n])) },
  offenders: offenders.length,
  repaired: Object.keys(REPAIRED).length,
  concepts: ids.length,
}, null, 2));
process.exit(failures.length ? 1 : 0);
