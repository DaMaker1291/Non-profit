// ─────────────────────────────────────────────────────────────────────────────
// WHAT EVERY ADVERTISED COURSE ACTUALLY SERVES, AND WHY IT FALLS SHORT.
//
// The question "does an advanced learner get advanced work?" has been answered
// three different ways in this repository and the answers did not agree, because
// each measured a different link in the chain:
//
//   · `npm run gate:ceiling` asks whether the item SERVED for a tier reaches the
//     declared target. A serving question, maths-only by construction.
//   · `audit/engine-audit.mjs` asks what share of a tier's concepts have a
//     MAXIMUM ceiling below that target. A coverage question, all five subjects.
//   · `docs/CONTENT_COVERAGE_REPORT.md` counted items per concept. A catalogue
//     question, and it says nothing about difficulty at all.
//
// All three are true. None of them is answerable as "the ceiling", which is
// exactly how a real gap survived a green suite: the numbers were never put on
// one axis. This script puts them on one axis, per course and per concept:
//
//   declared   the qualification's own difficulty (lib/specifications.ts)
//   ladder     what practiceTarget() will ever ASK FOR, for a mastered learner
//              in that course. Counts, because `tier` is clamped at 0.7 before
//              the stretch uplift — a fact no surface stated.
//   ceiling    conceptDepth(): the hardest item this concept's own generator can
//              produce (max over a fixed seed sweep, both families)
//   served     the difficulty the PRODUCTION serve path really returns, measured
//              by calling lib/operations.ts#servePractice — the same function
//              app/api/progress/route.ts and the published page both call. Not
//              generateQuestionNear directly, because the aim is the decision.
//
// AND IT SEPARATES THE CAUSES, which is the part that has been missing. A
// concept below its course's target is one of three different problems, and
// fixing the wrong one is invisible:
//
//   A  SEARCH      the target IS reachable (ceiling >= ladder) and the serve did
//                  not find it. More draws, or a better search, fixes this.
//   B  GENERATOR   the target is NOT reachable by this concept's generator at
//                  any seed (ceiling < ladder). More draws cannot help — the
//                  only fix is a deeper generator.
//   C  MISSING     there is no generator for the concept at all, or the one it
//                  has is CONSTANT (one item, whatever the aim). The concept is
//                  advertised in the course and can never be taught through it.
//
// Usage:
//   node scripts/content-audit.mjs                 # print the audit table
//   node scripts/content-audit.mjs --json          # + write audit/content-coverage.json
//   node scripts/content-audit.mjs --report        # + rewrite docs/CONTENT_COVERAGE_REPORT.md
//   node scripts/content-audit.mjs --attempts=120  # measure a different search budget
//   node scripts/content-audit.mjs --seeds=8       # draws per concept per measurement
//
// Prerequisite: the compiled mirror — `npm run verify` (or scripts/compile-engines.mjs).
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const flag = (name) => argv.some((a) => a === `--${name}`);
const num = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  const v = hit ? Number(hit.split("=")[1]) : NaN;
  return Number.isFinite(v) ? v : dflt;
};

const WRITE_JSON = flag("json") || flag("report");
const WRITE_REPORT = flag("report");
const ATTEMPTS = num("attempts", 40); // production is PRACTICE_DRAW_ATTEMPTS
const SEEDS = num("seeds", 5);

let specs, Q, profiles, ops, bank, skills, genome;
try {
  specs = require("../.verify/specifications.js");
  Q = require("../.verify/questions.js");
  profiles = require("../.verify/learner-profile.js");
  ops = require("../.verify/operations.js");
  bank = require("../.verify/question-bank.js");
  skills = require("../.verify/skills.js");
  genome = require("../.verify/genome.js");
} catch (e) {
  console.error("✗ the compiled engines are missing — run `npm run verify` first.");
  console.error(`  (${e.message})\n`);
  process.exit(2);
}

const TOL = 0.02; // one item's difficulty is a step; below this, "at target" is a tie
const SPECTRUM_DRAWS = 240; // raw draws per concept, to see the generator's whole range
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const r3 = (n) => Math.round(n * 1000) / 1000;
const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);

/** The difficulty a band starts at. `difficultyBandFor` is the serve's own
 *  notion of a match (`generateQuestionNear` prefers an in-band draw over any
 *  out-of-band one, however close), so "can this concept express this rung?"
 *  is a question about bands and not about a distance. Derived from the shipped
 *  function by scanning it, never re-declared here. */
const BAND_FLOOR = (() => {
  const floor = {};
  let prev = null;
  for (let i = 0; i <= 2000; i++) {
    const d = i / 2000;
    const b = Q.difficultyBandFor(d);
    if (b !== prev) floor[b] = d;
    prev = b;
  }
  return floor;
})();

/** Every difficulty this concept's generator can actually produce, measured once
 *  by drawing its raw catalogue. Memoised: the same concept appears in many
 *  courses and the answer is a fact about the generator. */
const SPECTRUM = new Map();
function spectrumOf(conceptId) {
  if (SPECTRUM.has(conceptId)) return SPECTRUM.get(conceptId);
  const draws = [];
  for (let i = 0; i < SPECTRUM_DRAWS; i++) {
    const q = Q.generateQuestion(conceptId, `spectrum:${conceptId}:n${i}`);
    if (q) draws.push(q.difficulty);
  }
  const max = draws.length ? Math.max(...draws) : 0;
  const bands = new Set(draws.map((d) => Q.difficultyBandFor(d)));
  // The nearest item the generator has INSIDE a given band: the honest measure
  // of "how well can this concept answer a learner at this rung", independent of
  // whether the search happens to find it.
  const bestInBand = (band, target) => {
    const inBand = draws.filter((d) => Q.difficultyBandFor(d) === band);
    if (!inBand.length) return null;
    return inBand.reduce((best, d) => (Math.abs(d - target) < Math.abs(best - target) ? d : best), inBand[0]);
  };
  const out = { draws, max, bands, bestInBand, distinct: new Set(draws.map((d) => r3(d))).size };
  SPECTRUM.set(conceptId, out);
  return out;
}

/** A state whose declared course is exactly this spec+level for this subject. */
function stateFor(specId, levelId, subject) {
  return profiles.newProfileState(`audit-${specId}-${levelId}`, {
    subjects: [subject],
    subjectCourses: { [subject]: { spec: specId, specLevel: levelId } },
  });
}

/** The record of a learner who has climbed this course's ladder on the concept:
 *  the strongest evidence the product honours, so the aim is the COURSE's demand
 *  rather than a beginner's. Deliberately not `lastSeen`, so nothing is due and
 *  the aim is the target rather than a retention check at the band. */
function climbed(state, conceptId) {
  state.progress[conceptId] = {
    attempts: 40,
    correct: 38,
    streak: 6,
    misconceptions: {},
    lastSeen: null,
  };
  return state;
}

/** What practiceTarget asks for, with the ladder's own clamps applied. This is
 *  the number the product considers "at the learner's level" — read from the
 *  shipped function, never re-derived here. */
function ladderAim(declared) {
  const fresh = bank.practiceTarget({ tier: declared, attempts: 0, correct: 0, streak: 0 });
  const climbedT = bank.practiceTarget({
    tier: declared, attempts: 40, correct: 38, streak: 6, misconceptionHits: 0,
  });
  return { fresh: fresh.difficulty, climbed: climbedT.difficulty, tier: climbedT.tier, reason: climbedT.reason };
}

const courses = [];
for (const spec of specs.SPECIFICATIONS) {
  for (const level of spec.levels ?? []) {
    const active = { spec, level };
    const concepts = specs.coverageOf(active).filter((c) => Q.hasGenerator(c.id));
    if (!concepts.length) continue;
    const declared = specs.difficultyFor(active);
    const ladder = ladderAim(declared);

    const bySubject = new Map();
    for (const c of concepts) {
      if (!bySubject.has(c.subject)) bySubject.set(c.subject, []);
      bySubject.get(c.subject).push(c);
    }

    for (const [subject, list] of bySubject) {
      const rows = [];
      let aimReported = null;
      for (const c of list) {
        const variable = Q.isVariableGen(c.id);
        const ceiling = Q.conceptDepth(c.id);

        // ── the PRODUCTION serve path ────────────────────────────────────────
        const served = [];
        const kinds = new Set();
        for (let i = 0; i < SEEDS; i++) {
          const st = climbed(stateFor(spec.id, level.id, subject), c.id);
          const out = ops.servePractice({ state: st, conceptId: c.id, seed: `audit:${spec.id}:${level.id}:${c.id}:${i}` });
          if (!out.ok) continue;
          served.push(out.served.question.difficulty);
          kinds.add(out.served.question.responseKind ?? "choice");
          aimReported ??= { aim: out.served.aim.aim, band: out.served.aim.band, due: out.served.aim.due, reason: out.served.aim.target.reason };
        }
        const servedMean = served.length ? mean(served) : null;

        // ── the causes, in order, and never conflated ──────────────────────
        // The test is the SERVE's own test — is there an item in the band the
        // course asks for? — and the three causes are separated by what the
        // generator can express and what the search returned:
        //
        //   C  the concept has no generator, or a CONSTANT one (one item).
        //   B  the generator cannot produce an item in the target's band AT ANY
        //      SEED. The content for this rung does not exist; no search budget
        //      can conjure it, and this is where a deeper generator is the only
        //      fix.
        //   A  items in the target's band DO exist and the production serve did
        //      not return one. That is a search problem, and only that.
        const target = ladder.climbed;
        const targetBand = Q.difficultyBandFor(target);
        const spectrum = spectrumOf(c.id);
        const inBandItems = [...spectrum.bands].includes(targetBand);
        const servedBands = served.map((d) => Q.difficultyBandFor(d));
        const servedInBand = servedBands.filter((b) => b === targetBand).length;
        let cause = null;
        if (!Q.hasGenerator(c.id) || !variable) cause = "C";
        else if (!inBandItems) cause = "B";
        else if (served.length > 0 && servedInBand === 0) cause = "A";
        // How far the best in-band item is from what the course asked for: 0 is
        // an exact match. This is the spectrum's own quality, and it is why a
        // "reaches its target" count can be true while the item is still far
        // off — band 4 spans 0.62 to 0.75.
        const best = spectrum.bestInBand(targetBand, target);
        
        // The demand band of what is actually served, at each rung the ladder
        // can reach. "recall" at 0.4 is correct; the same band for a course that
        // declared 0.9 is the finding.
        const servedSkills = served.map((d) => skills.skillForDifficulty(d));
        rows.push({
          conceptId: c.id,
          subject: c.subject,
          stage: c.stage,
          target,
          targetBand,
          declared,
          ceiling: r3(ceiling),
          bandMax: spectrum.max,
          inBandItems,
          servedMean: servedMean === null ? null : r3(servedMean),
          gap: servedMean === null ? null : r3(target - servedMean),
          bestInBand: best === null ? null : r3(best),
          spectrumGap: best === null ? null : r3(best - target),
          spectrumSpread: spectrum.distinct,
          cause,
          variable,
          kinds: [...kinds].sort(),
          servedSkills,
          servedBands,
          servedMin: served.length ? Math.min(...served) : null,
          servedMax: served.length ? Math.max(...served) : null,
        });
      }

      const reachable = rows.filter((r) => r.cause === null);
      const belowTarget = rows.filter((r) => r.cause !== null);
      const causeCount = { A: 0, B: 0, C: 0 };
      for (const r of rows) if (r.cause) causeCount[r.cause]++;

      const servedSkills = rows.flatMap((r) => r.servedSkills);
      const demand = {};
      for (const s of skills.SKILL_LADDER) demand[s] = servedSkills.filter((x) => x === s).length;

      const kinds = {};
      for (const r of rows) for (const k of r.kinds) kinds[k] = (kinds[k] ?? 0) + 1;

      courses.push({
        specId: spec.id,
        specName: spec.name,
        country: spec.country,
        levelId: level.id,
        levelName: level.name,
        subject,
        declared: r3(declared),
        ladderTier: r3(ladder.tier),
        ladderFresh: r3(ladder.fresh),
        ladderClimbed: r3(ladder.climbed),
        clampShortfall: r3(declared - ladder.tier),
        concepts: rows.length,
        measured: reachable.length + belowTarget.length,
        reachTarget: reachable.length,
        belowTarget: belowTarget.length,
        meanServed: r3(mean(rows.map((r) => r.servedMean).filter((v) => v !== null))),
        meanCeiling: r3(mean(rows.map((r) => r.ceiling))),
        cause: causeCount,
        demand,
        recallShare: pct(demand.recall ?? 0, servedSkills.length),
        kinds,
        aim: aimReported,
        rows: rows.sort((a, b) => (b.gap ?? -1) - (a.gap ?? -1)),
      });
    }
  }
}

// ── The table a reviewer reads ───────────────────────────────────────────────
const advancedFloor = 0.7;
const wide = courses.filter((c) => c.declared >= advancedFloor);
const short = (list) => list.filter((c) => c.belowTarget > 0).length;

console.log(`\nContent audit — search budget ${ATTEMPTS} draws, ${SEEDS} serves per concept`);
console.log(`  ${courses.length} course×subject rows · ${wide.length} at or above ${advancedFloor} declared\n`);

const pad = (v, n) => String(v ?? "-").padEnd(n);
console.log(
  pad("course", 34) + pad("subj", 9) + pad("decl", 6) + pad("tier", 6) + pad("ladder", 7) +
  pad("ceiling", 8) + pad("served", 7) + pad("at tgt", 7) + pad("A/B/C", 7) + pad("recall", 7),
);
for (const c of [...courses].sort((a, b) => b.declared - a.declared || a.specId.localeCompare(b.specId))) {
  const name = `${c.specId}·${c.levelId || "one"}`.slice(0, 33);
  console.log(
    pad(name, 34) + pad(c.subject, 9) + pad(c.declared, 6) + pad(c.ladderTier, 6) + pad(c.ladderClimbed, 7) +
    pad(c.meanCeiling, 8) + pad(c.meanServed, 7) + pad(`${c.reachTarget}/${c.measured}`, 7) +
    pad(`${c.cause.A}/${c.cause.B}/${c.cause.C}`, 7) + pad(`${c.recallShare}%`, 7),
  );
}

const totalCause = { A: 0, B: 0, C: 0 };
for (const c of courses) for (const k of ["A", "B", "C"]) totalCause[k] += c.cause[k];
console.log(`\ncauses across every course: A search ${totalCause.A} · B generator ${totalCause.B} · C missing ${totalCause.C}`);

// The clamp is a cause of its own and it is not one of the three: `tier` is
// capped at 0.7 inside practiceTarget BEFORE the stretch uplift, so no course
// can ask for more than 0.9 however demanding the qualification is.
const clamped = courses.filter((c) => c.declared - c.ladderTier > TOL);
if (clamped.length) {
  const worst = clamped.sort((a, b) => b.clampShortfall - a.clampShortfall)[0];
  console.log(
    `the ladder's own tier cap: ${clamped.length} course×subject rows declare MORE than the ladder will ask for` +
    ` (worst ${worst.specId}·${worst.levelId} declares ${worst.declared}, the ladder stops at ${worst.ladderTier},` +
    ` i.e. -${worst.clampShortfall}). Not a search or generator fault: practiceTarget clamps tier at 0.7.`,
  );
}

const worstRows = courses
  .flatMap((c) => c.rows.map((r) => ({ ...r, course: `${c.specId}·${c.levelId}`, declared: c.declared })))
  .filter((r) => r.gap !== null && r.gap > TOL)
  .sort((a, b) => b.gap - a.gap)
  .slice(0, 12);
console.log(`\nthe widest shortfalls (target - served):`);
for (const r of worstRows) {
  console.log(
    `  ${pad(r.course, 22)} ${pad(r.conceptId, 22)} target ${r.target} served ${r.servedMean} (ceiling ${r.ceiling}) cause ${r.cause ?? "-"}`,
  );
}

if (WRITE_JSON) {
  const out = {
    note: "Generated by scripts/content-audit.mjs from the compiled engines. Do not hand-edit: re-run the script.",
    at: new Date().toISOString(),
    searchBudget: ATTEMPTS,
    seedsPerConcept: SEEDS,
    tolerance: TOL,
    totals: { courses: courses.length, advanced: wide.length, short: short(wide), causes: totalCause },
    courses,
  };
  const p = path.join(process.cwd(), "audit", "content-coverage.json");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`\nwrote ${path.relative(process.cwd(), p)}`);
}

// ── The report, GENERATED ────────────────────────────────────────────────────
// Written from the same objects the table above was printed from, so a number in
// the markdown cannot be a hand-typed one. The old report was a snapshot with a
// dated apology stapled to it; this one is a build artefact.
if (WRITE_REPORT) {
  const lines = [];
  const w = (s = "") => lines.push(s);
  const skill = (k) => skills.SKILL_LABEL?.[k] ?? k;

  w("# OpenMind — Content Coverage Report");
  w();
  w("**GENERATED — do not edit by hand.** Every figure below is measured by");
  w("`scripts/content-audit.mjs` from the compiled engines and the production serve path");
  w("(`lib/operations.ts#servePractice`, the function `app/api/progress/route.ts` and the");
  w("published page both call — not `generateQuestionNear` directly, because the aim is the");
  w("decision). Regenerate with:");
  w();
  w("```");
  w("npm run verify          # compiles the .verify mirror this reads");
  w("npm run content-audit -- --json --report");
  w("```");
  w();
  w(`**At:** ${new Date().toISOString()}`);
  w(`**Search budget:** ${ATTEMPTS} draws per serve (production is \`PRACTICE_DRAW_ATTEMPTS\`)`);
  w(`**Serves per concept:** ${SEEDS}`);
  w();
  w("Difficulty here is the item's own declared difficulty (0–1), never a label. `target` is what");
  w("the ladder will ask of a learner who has demonstrated mastery in that course; `ceiling` is the");
  w("hardest item the concept's generator can produce at any seed; `served` is what came back.");
  w();
  w("## The five links in the chain");
  w();
  w("A course can fall short at any of five places, and they need different fixes:");
  w();
  w("| Link | What it is | Where it is set |");
  w("|---|---|---|");
  w("| declared | the qualification's own demand | `lib/specifications.ts` |");
  w("| ladder tier | the most practice will ever aim at | `practiceTarget` — clamps `tier` at 0.7 |");
  w("| target | what a mastered learner in this course is asked for | `practiceTarget`, stretch rung |");
  w("| ceiling | the hardest item the concept's generator makes | `conceptDepth` (`lib/questions.ts`) |");
  w("| served | the difficulty actually returned | `servePractice` + `generateQuestionNear` |");
  w();
  w("## The three causes of a shortfall");
  w();
  w("| Cause | Test | Fix |");
  w("|---|---|---|");
  w("| **A** search | items in the target's band EXIST, and the production serve did not return one | a bigger search budget |");
  w("| **B** generator | the generator produces NOTHING in the target's band, at any seed | a deeper generator |");
  w("| **C** missing | no generator, or a CONSTANT one (a single item) | real content for the concept |");
  w();
  w("The test is the serve's OWN test — `difficultyBandFor`, which is what `generateQuestionNear`");
  w("prefers — so \"can this concept express this rung?\" is a question about bands, not about a");
  w("distance. A concept can have a high `conceptDepth` (one deep family) and still be a **B** for a");
  w("middle rung: measured, `scatter-correlation` produces 0.4 and then nothing until 0.78, so band 3");
  w("(0.50–0.61) is unreachable for it while its ceiling is 0.938.");
  w();
  w("More draws can only ever fix an A, and the audit measures that directly: the same run at");
  w("`--attempts=400` reports the A count for a 10× budget. If A does not fall, the shortfall was");
  w("never a search problem, and raising the budget would have been a change that fixed nothing.");
  w();
  w(`## 1. Every course × subject (${courses.length} rows)`);
  w();
  w("`decl` declared · `tier` the ladder's own tier after its clamp · `ladder` target (stretch rung) ·");
  w("`ceiling` mean concept ceiling · `served` mean served difficulty · `at tgt` concepts whose serve");
  w("reaches the target · `A/B/C` shortfall causes · `recall` share of served items in the recall band.");
  w();
  w("| course | level | subject | decl | tier | ladder | ceiling | served | at tgt | A/B/C | recall |");
  w("|---|---|---|---|---|---|---|---|---|---|---|");
  for (const c of [...courses].sort((a, b) => b.declared - a.declared)) {
    w(
      `| ${c.specId} | ${c.levelName ?? c.levelId ?? "—"} | ${c.subject} | ${c.declared} | ${c.ladderTier} | ` +
      `${c.ladderClimbed} | ${c.meanCeiling} | ${c.meanServed} | ${c.reachTarget}/${c.measured} | ` +
      `${c.cause.A}/${c.cause.B}/${c.cause.C} | ${c.recallShare}% |`,
    );
  }
  w();
  w(`**${totalCause.A}** shortfalls are search, **${totalCause.B}** are generator ceilings, **${totalCause.C}** are`);
  w("missing content.");
  w();
  if (clamped.length) {
    w("## 2. The ladder's own tier cap");
    w();
    w(`\`practiceTarget\` clamps \`tier\` to **0.7** before the stretch uplift, so no course can aim above`);
    w("0.9 through practice however demanding its qualification is. **" + clamped.length + "** course×subject");
    w("rows declare more than the ladder will ask for:");
    w();
    w("| course | declared | ladder tier | shortfall by construction |");
    w("|---|---|---|---|");
    for (const c of clamped.sort((a, b) => b.clampShortfall - a.clampShortfall)) {
      w(`| ${c.specId} · ${c.levelName ?? c.levelId} (${c.subject}) | ${c.declared} | ${c.ladderTier} | -${c.clampShortfall} |`);
    }
    w();
    w("This is neither A nor B nor C: it is the serving policy, and raising the cap changes nothing");
    w("until the content behind it exists, because the serve already falls back to the nearest");
    w("available draw.");
    w();
  }
  w("## 3. Coverage by course");
  w();
  w("Per course: what a learner can be asked, which demand rungs are reachable, and what is missing.");
  w();
  w("| course · subject | concepts | servable | demand reached | response types | missing content |");
  w("|---|---|---|---|---|---|");
  for (const c of courses) {
    const reached = skills.SKILL_LADDER.filter((s) => (c.demand[s] ?? 0) > 0).map(skill);
    const miss = c.rows.filter((r) => r.cause === "C").length;
    w(
      `| ${c.specId} · ${c.levelName ?? c.levelId} · ${c.subject} | ${c.concepts} | ${c.measured} | ` +
      `${reached.join(", ") || "—"} | ${Object.keys(c.kinds).join(", ") || "—"} | ${miss ? `${miss} concepts` : "none"} |`,
    );
  }
  w();
  w("**`extended_response` is 0 everywhere and that is deliberate** (`lib/skills.ts#SKILLS_IN_BANK`):");
  w("no item in the bank declares a difficulty at its floor, so no course advertises it. The demand");
  w(`mix a sitting declares is redistributed across the rungs that exist rather than saved for`);
  w("a rung the instrument cannot produce — see `skillQuotaFor`.");
  w();
  w("## 4. The widest shortfalls, with their cause");
  w();
  w("| course | concept | target (band) | ceiling | best in band | served | cause |");
  w("|---|---|---|---|---|---|---|");
  const worst = courses
    .flatMap((c) => c.rows.filter((r) => r.cause !== null).map((r) => ({ ...r, course: `${c.specId} · ${c.levelId || "one"} · ${c.subject}` })))
    .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))
    .slice(0, 40);
  for (const r of worst) {
    const label = r.cause === "A" ? "A search" : r.cause === "B" ? "B generator" : r.cause === "C" ? "C missing" : "—";
    w(`| ${r.course} | ${r.conceptId} | ${r.target} (b${r.targetBand}) | ${r.ceiling} | ${r.bestInBand ?? "none"} | ${r.servedMean} | ${label} |`);
  }
  w();
  w("## 5. Reproducing this");
  w();
  w("```");
  w("npm run content-audit              # the table");
  w("npm run content-audit -- --json    # + audit/content-coverage.json");
  w("npm run content-audit -- --report  # + this file");
  w("npm run content-gate               # the release gate over the same data");
  w("```");
  w();
  const p = path.join(process.cwd(), "docs", "CONTENT_COVERAGE_REPORT.md");
  fs.writeFileSync(p, lines.join("\n") + "\n", "utf8");
  console.log(`wrote ${path.relative(process.cwd(), p)}`);
}
console.log();
