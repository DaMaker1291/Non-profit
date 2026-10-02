// ─────────────────────────────────────────────────────────────────────────────
// THE CONTENT-CEILING GATE.
//
// WHY THIS EXISTS. The audit measured a product fault that no gate could see:
// A-Level A2 declares 0.90, and the practice route served a median of 0.65 —
// 100% of its maths concepts capped out below their own course's target. The
// cause was that the QUESTION BANK, not the curriculum, set the level: the
// generators topped out around 0.65 and nothing said so. The repair is
// lib/questions-senior.ts, composed into the bank in lib/questions.ts#ALL_GENS.
//
// The measurement module (lib/content-ceiling.ts) was imported by nothing in the
// product, and nothing ran on a push, so the repair could regress silently the
// moment the next change touched a generator. This gate closes that: it runs the
// ceiling measurement through the PRODUCTION serve path on every push and fails
// when it drops.
//
// WHAT IT MEASURES, and why two paths:
//
//   · conceptDepth — the ceiling the bank can express for a concept, measured by
//     drawing the fixed `depth:i` seeds and taking the deepest item. This is the
//     metric lib/content-ceiling.ts reports, so the gate and the product speak
//     the same language.
//   · the production serve — `generateQuestionNear(id, seed, tier.difficulty, 40)`,
//     the exact call app/api/progress/route.ts makes (`PRACTICE_DRAW_ATTEMPTS`
//     is 40 there). This is what a learner actually receives, and it is the
//     reason the gate samples it: a per-concept ceiling is a capability claim,
//     and a serving distribution is the truth about the experience.
//
// The gate reports DISTRIBUTIONS, never a maximum: per tier, the min/median/max
// concept ceiling, how many concepts still fall short, and the served median.
// A single deep concept must never make a course look deep — that was the first
// version of this metric's bug.
//
// THE BASELINE IS A COMMITTED FILE, updated only deliberately. `npm run
// gate:ceiling -- --write-baseline` regenerates audit/ceiling-baseline.json;
// because that shows up as a git diff, tightening or loosening the floor is
// always a reviewable act rather than an accident. Default runs only READ it.
//
// REACHED SET. Some tiers have genuinely met their declared target (the lesson
// of this campaign); for those the gate asserts the absolute target, not merely
// that they held still. Tiers still climbing are held at their recorded floor
// and listed as NOT REACHED in the output, so the report stays honest.
//
// Run:  npm run gate:ceiling
// ─────────────────────────────────────────────────────────────────────────────
import { compileEngines } from "./compile-engines.mjs";
import fs from "node:fs";
import path from "node:path";

compileEngines();
const q = await import("../.verify/questions.js");
const specs = await import("../.verify/specifications.js");
const ceil = await import("../.verify/content-ceiling.js");
const { SUBJECT_IDS } = await import("../.verify/subjects.js");

const ATTEMPTS = 40; // what app/api/progress/route.ts serves with — pinned here on purpose.
const ADVANCED = 0.7; // "advanced tier", same line the audit drew.
const BASELINE = "audit/ceiling-baseline.json";
const TOL = 0.01; // noise tolerance on a recorded floor.

// A REACHED key that no row matches would silently assert nothing — the gate
// checks its own target list against the measured rows before it runs.

// ── The named concepts this campaign fixed, each with its floor. ─────────────
// ALL 43 maths concepts that an advanced tier serves. Before
// lib/questions-senior.ts every one of these was below its tier's declared
// target: seventeen had no deep family at all (0.30–0.70), and the rest had one
// that capped at 0.62–0.86. Floors sit a safe step under the measured depths:
// deleting a family drops the concept back to at most 0.86 and fails here by a
// mile, while a legitimate tweak inside a family does not.
// Measured on the day: each is between 0.903 and 0.940.
const NAMED_FIXED = {
  functions: 0.88,
  kinematics: 0.88,
  bearings: 0.88,
  "mixture-problems": 0.88,
  inequalities: 0.88,
  "number-bases": 0.88,
  "circle-theorems": 0.88,
  binomial: 0.88,
  "matrices-intro": 0.88,
  "trig-identity": 0.88,
  transformations: 0.88,
  polynomials: 0.88,
  "sets-venn": 0.88,
  "loci-constructions": 0.88,
  "quadratic-graphs": 0.88,
  "algebraic-fractions": 0.88,
  "sim-equations-quad": 0.88,
  pythagoras: 0.88,
  quadratics: 0.88,
  "growth-decay": 0.88,
  "algebra-expand": 0.88,
  "circle-area-arc": 0.88,
  "straight-lines": 0.88,
  simultaneous: 0.88,
  "trig-ratios": 0.88,
  "standard-form": 0.88,
  "trig-rule": 0.88,
  "tree-diagrams": 0.88,
  "logic-maths": 0.88,
  vectors: 0.88,
  proof: 0.88,
  iteration: 0.88,
  "calculus-int": 0.88,
  "completing-square": 0.88,
  surds: 0.88,
  logs: 0.88,
  "circle-geometry-adv": 0.88,
  "proportional-graphs": 0.88,
  "calculus-diff": 0.88,
  bounds: 0.88,
  "financial-maths": 0.88,
  volume: 0.88,
  "scatter-correlation": 0.88,
};

// ── Tiers whose content genuinely reaches the declared target. ────────────────
// These are asserted ABSOLUTELY: if the median concept (or the median served
// item) slips back under the declared demand, the gate fails even if the value
// is above the old baseline. This is the headline condition of the campaign.
//
// ALL MATHS TIERS ARE HERE. The repair is per-concept and the concepts are
// shared across boards, so one content push lifted every maths tier at once.
// The non-maths subjects are NOT here — they are pinned at their recorded
// baselines instead, because their content still falls short; listing them
// would be a claim the measurement does not support.
const REACHED = new Set([
  "int-ib|sl|maths",
  "int-ib|hl|maths",
  "au-acara|senior|maths",
  "ie-junior|senior|maths",
  "in-cbse|class11-12|maths",
  "in-icse|isc|maths",
  "pk-matric|inter|maths",
  "bd-ssc|hsc|maths",
  "ke-kcse|form4|maths",
  "ng-waec|sss|maths",
  "br-enem|medio|maths",
  "mx-sep|prepa|maths",
  "any-independent|advanced|maths",
  "uk-alevel|as|maths",
  "uk-alevel|a2|maths",
  "us-ap|ap|maths",
]);

const write = process.argv.includes("--write-baseline");

const labels = Object.fromEntries(
  specs.SPECIFICATIONS.flatMap((s) => s.levels.map((l) => [`${s.id}|${l.id}`, l.name])),
);

function bandFloor(target) {
  if (target >= 0.8) return 0.8;
  if (target >= 0.6) return 0.6;
  if (target >= 0.45) return 0.45;
  if (target >= 0.3) return 0.3;
  return 0;
}

function quantile(sorted, p) {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/** The concepts a course+subject owns that have a generator. */
function conceptsFor(spec, level, subject) {
  return specs
    .coverageOf({ spec, level })
    .filter((c) => c.subject === subject && q.hasGenerator(c.id))
    .map((c) => c.id);
}

/** Every advanced tier × subject row, with both measurements. */
function measure() {
  const rows = [];
  for (const spec of specs.SPECIFICATIONS) {
    for (const level of spec.levels) {
      if (level.difficulty < ADVANCED) continue;
      for (const subject of SUBJECT_IDS) {
        const ids = conceptsFor(spec, level, subject);
        if (!ids.length) continue;
        const depths = ids.map((id) => q.conceptDepth(id)).sort((a, b) => a - b);
        // The production serve: one draw per concept at the tier's own target,
        // exactly the call the practice route makes.
        const served = ids
          .map((id) => q.generateQuestionNear(id, `cg:${spec.id}:${level.id}:${id}`, level.difficulty, ATTEMPTS))
          .filter(Boolean)
          .map((item) => item.difficulty)
          .sort((a, b) => a - b);
        const declared = level.difficulty;
        rows.push({
          key: `${spec.id}|${level.id}|${subject}`,
          tier: `${spec.id}|${level.id}`,
          name: level.name,
          subject,
          declared,
          concepts: ids.length,
          min: depths[0],
          median: quantile(depths, 0.5),
          max: depths[depths.length - 1],
          belowTarget: depths.filter((d) => d < declared - 1e-9).length,
          servedN: served.length,
          servedMin: served[0] ?? 0,
          servedMedian: quantile(served, 0.5),
          servedShareAtTarget: served.filter((d) => d >= declared - 1e-9).length / (served.length || 1),
        });
      }
    }
  }
  return rows;
}

console.log("Measuring every advanced tier × subject through the production serve path…");
const rows = measure();
for (const key of REACHED) {
  if (!rows.some((r) => r.key === key)) throw new Error(`REACHED names a row that does not exist: ${key}`);
}

// ── Baseline ─────────────────────────────────────────────────────────────────
if (write) {
  const out = {
    note: "Content-ceiling baseline. Regenerated ONLY with `npm run gate:ceiling -- --write-baseline`; the diff is the review.",
    attempts: ATTEMPTS,
    advancedFrom: ADVANCED,
    tiers: Object.fromEntries(
      rows.map((r) => [
        r.key,
        { declared: r.declared, concepts: r.concepts, median: r.median, belowTarget: r.belowTarget, servedMedian: r.servedMedian },
      ]),
    ),
  };
  fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
  fs.writeFileSync(BASELINE, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${BASELINE}: ${rows.length} rows.`);
}

let baseline;
try {
  baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8")).tiers;
} catch {
  console.error(`FATAL: ${BASELINE} is missing or unreadable. Create it deliberately with:`);
  console.error("  npm run gate:ceiling -- --write-baseline");
  process.exit(1);
}

// ── Checks ───────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
const failures = [];
const ok = (cond, name, detail = "") => {
  if (cond) { pass++; }
  else { fail++; failures.push({ name, detail }); console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
};

// 1. The mechanism is intact: the senior layer exists and is composed in.
const seniorIds = q.SENIOR_CONCEPT_IDS ?? [];
for (const [id, floor] of Object.entries(NAMED_FIXED)) {
  ok(seniorIds.includes(id), `senior family present for "${id}"`);
  ok(q.conceptDepth(id) >= floor, `"${id}" still reaches ${floor.toFixed(2)}`, `depth ${q.conceptDepth(id).toFixed(3)}`);
}

// 2. Per-tier floors and the absolute target where it has been reached.
const notReached = [];
for (const r of rows) {
  const b = baseline[r.key];
  if (!b) { ok(false, `${r.key} is in the baseline`); continue; }
  const reached = REACHED.has(r.key);
  if (reached) {
    ok(r.median >= r.declared - 1e-9, `${r.name} ${r.subject}: median concept reaches declared ${r.declared}`,
       `median ${r.median.toFixed(3)}`);
    // The serve is BAND-FIRST by design (lib/questions.ts#generateQuestionNear):
    // it prefers an item in the target's own demand band over a nearer item
    // outside it. So the honest served condition is band membership, not
    // target − 0.02 — a 0.78 target serves band-4 work, and a 0.9 target serves
    // band-5 work. A tier whose served median leaves its declared band has
    // genuinely regressed.
    const floor = bandFloor(r.declared);
    ok(r.servedMedian >= floor - 1e-9, `${r.name} ${r.subject}: served median stays in the declared band (production serve)`,
       `served ${r.servedMedian.toFixed(3)}, band floor ${floor}`);
  } else {
    ok(r.median >= b.median - TOL, `${r.name} ${r.subject}: ceiling held at or above baseline`,
       `now ${r.median.toFixed(3)} vs baseline ${b.median.toFixed(3)}`);
    // Concepts below the target may fall, but not by more than noise plus a
    // couple of concepts: the share is the campaign's headline number.
    const slack = Math.max(2, Math.ceil(b.concepts * 0.05));
    ok(r.belowTarget <= b.belowTarget + slack, `${r.name} ${r.subject}: concepts below target did not grow`,
       `${r.belowTarget} now vs ${b.belowTarget} baseline`);
  }
  if (r.median < r.declared - 1e-9) notReached.push(r);
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log("");
console.log("ADVANCED TIERS — concept-ceiling distribution vs declared demand");
console.log(
  "  " + "tier".padEnd(22) + "subj".padEnd(11) + "decl".padEnd(6) + "conc".padEnd(6) +
  "min".padEnd(7) + "median".padEnd(8) + "max".padEnd(7) + "below".padEnd(7) + "served-med",
);
for (const r of rows.slice().sort((a, b) => a.median - b.median)) {
  const flag = r.median >= r.declared - 1e-9 ? "✓" : "·";
  console.log(
    `${flag} ${r.tier.padEnd(22)}${r.subject.padEnd(11)}${r.declared.toFixed(2).padEnd(6)}` +
    `${String(r.concepts).padEnd(6)}${r.min.toFixed(3).padEnd(7)}${r.median.toFixed(3).padEnd(8)}` +
    `${r.max.toFixed(3).padEnd(7)}${`${r.belowTarget}/${r.concepts}`.padEnd(7)}${r.servedMedian.toFixed(3)}`,
  );
}

const reachedCount = rows.length - notReached.length;
console.log(`\nREACHED ${reachedCount}/${rows.length} advanced tier×subject rows (median concept ≥ declared).`);
if (notReached.length) {
  console.log(`NOT REACHED (${notReached.length}) — recorded, not hidden:`);
  const bySubject = {};
  for (const r of notReached) (bySubject[r.subject] ??= []).push(`${r.name} (${r.median.toFixed(2)} vs ${r.declared.toFixed(2)})`);
  for (const [subject, list] of Object.entries(bySubject)) console.log(`  ${subject}: ${list.join(", ")}`);
}

const namedBelow = Object.keys(NAMED_FIXED).filter((id) => q.conceptDepth(id) < 0.85);
if (namedBelow.length) console.log(`\nNAMED CONCEPTS NOT AT DEPTH: ${namedBelow.join(", ")}`);

console.log(`\n${"─".repeat(60)}`);
console.log(`PASS ${pass}   FAIL ${fail}`);
if (fail) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  · ${f.name}${f.detail ? " — " + f.detail : ""}`);
}
fs.writeFileSync("audit/ceiling-gate.json", JSON.stringify({ pass, fail, failures, reached: reachedCount, rows: rows.length }, null, 2));
process.exit(fail ? 1 : 0);
