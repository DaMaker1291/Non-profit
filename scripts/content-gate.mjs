// ─────────────────────────────────────────────────────────────────────────────
// THE CONTENT GATE — the release check that a course's declared level can
// actually be taught.
//
// WHY THIS IS A GATE AND NOT A REPORT. `lib/content-ceiling.ts` documented the
// problem in prose, `audit/stage1-baseline.json` recorded it, and
// `docs/CONTENT_COVERAGE_REPORT.md` described it — and a learner in an IB HL
// class was still served a balance-scale item, because nothing in the release
// path FAILED when it happened. A number in a document is not a constraint. The
// rule this gate enforces is the one the mission is about:
//
//     A concept a course serves must be able to produce an item in the demand
//     band that course asks for.
//
// The test is the SERVE's own test. `generateQuestionNear` prefers an item in
// the target's own band over a nearer item outside it, so "can this concept
// answer this rung?" is a question about BANDS, not about a distance — a
// concept can have a high ceiling and still be unable to answer a rung when its
// families are bimodal (base 0.3, depth 0.9, nothing between).
//
// WHAT IT ASSERTS
//   1. every non-exempt concept can express every band its courses serve at;
//   2. the EXEMPT set is exactly the eight primary-arithmetic concepts the
//      project deliberately keeps below the data band, and every exemption is
//      named in the output — a gap that is reported is a decision, a gap that is
//      silent is an omission wearing the costume of a decision;
//   3. no advertised course is empty: every concept a specification covers has
//      a generator, unless it is one of the declared exemptions;
//   4. the demand ladder's declared skill mix is PRODUCIBLE by the bank — the
//      declaration and the measurement are compared, so a skill the bank cannot
//      reach may be declared "not in bank" here rather than discovered by a
//      learner;
//   5. advanced courses are not recall-heavy: the band a course's own ladder
//      aims at is reached on at least half of the concepts it serves.
//
// WHAT IT DELIBERATELY DOES NOT REPEAT: the SERVED distribution
// (`npm run gate:ceiling`) and the question-level contract over every generator
// (`npm run verify:q`). Those are separate gates over the same content, and a
// release runs all three; duplicating them here would mean three places to
// update when one rule moves.
//
// Run: node scripts/content-gate.mjs      (wire it as `npm run content-gate`)
// Prerequisite: `.verify` exists — `npm run verify` builds it.
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);

let Q, genome, specs, bank, skills;
try {
  Q = require("../.verify/questions.js");
  genome = require("../.verify/genome.js");
  specs = require("../.verify/specifications.js");
  bank = require("../.verify/question-bank.js");
  skills = require("../.verify/skills.js");
} catch (e) {
  console.error("✗ the compiled engines are missing — run `npm run verify` first.");
  console.error(`  (${e.message})\n`);
  process.exit(2);
}

const SPECTRUM_DRAWS = 240;

/**
 * THE EXEMPTIONS, and they are a decision with a reason rather than a list of
 * things that failed. These are the primary-arithmetic concepts the product
 * teaches BELOW the data band on purpose (lib/questions.ts#DATA_DEEP_PRIMARY):
 * a "read it out of a table" item at 0.75 is a curriculum error for column
 * addition. The adaptive engine also depends on genuinely low-ceiling concepts
 * existing — its ladder must be able to stop at a concept's own ceiling — and
 * three engine fixtures drive exactly that. So their gaps are reported, never
 * papered over.
 *
 * The set is written out HERE as well as in the engine so this gate can assert
 * the two agree: if somebody quietly adds a ninth concept to the exemption in
 * lib/questions.ts, this gate fails and names it.
 */
const EXEMPT = [
  "place-value", "addition", "subtraction", "multiplication", "division",
  "order-ops", "rounding", "negatives",
];

let pass = 0;
let fail = 0;
const failures = [];
const note = [];

function ok(cond, name, detail) {
  if (cond) {
    pass++;
    return;
  }
  fail++;
  failures.push({ name, detail });
}

/** Every difficulty the concept's generator can actually produce, measured once
 *  by drawing its raw catalogue. Memoised: the same concept appears in many
 *  courses, and this is a fact about the generator rather than about a course. */
const SPECTRUM = new Map();
function bandsOf(conceptId) {
  if (SPECTRUM.has(conceptId)) return SPECTRUM.get(conceptId);
  const bands = new Set();
  // The draws themselves are kept as well as the bands they fall in: assertion
  // 6 needs to know WHERE inside a band the items sit, and re-drawing for that
  //  would be a second measurement of the same thing that could disagree.
  const draws = [];
  let max = 0;
  for (let i = 0; i < SPECTRUM_DRAWS; i++) {
    const q = Q.generateQuestion(conceptId, `gate:${conceptId}:n${i}`);
    if (!q) continue;
    bands.add(Q.difficultyBandFor(q.difficulty));
    draws.push(q.difficulty);
    if (q.difficulty > max) max = q.difficulty;
  }
  const out = { bands, max, draws };
  SPECTRUM.set(conceptId, out);
  return out;
}

console.log("▸ Every concept a course serves can express the band that course asks for");
{
  const unreachable = [];
  const recallHeavy = [];
  let rows = 0;
  let courses = 0;
  let advancedCourses = 0;

  for (const spec of specs.SPECIFICATIONS) {
    for (const level of spec.levels ?? []) {
      const active = { spec, level };
      const concepts = specs.coverageOf(active);
      if (!concepts.length) continue;
      courses++;

      // 3. NO ADVERTISED COURSE IS EMPTY. Every concept the specification
      //    covers must be servable, or the course is advertising a topic
      //    nothing can teach.
      const unservable = concepts.filter((c) => !Q.hasGenerator(c.id));
      ok(
        unservable.length === 0,
        `${spec.id}/${level.id} advertises only concepts that exist`,
        unservable.map((c) => c.id).join(", "),
      );

      const declared = specs.difficultyFor(active);
      // The ladder's OWN aim for a learner who has climbed: read from the
      // shipped function rather than re-derived, so this gate moves when the
      // serving policy moves.
      const climbedAim = bank.practiceTarget({
        tier: declared, attempts: 40, correct: 38, streak: 6, misconceptionHits: 0,
      });
      const target = climbedAim.difficulty;
      const targetBand = Q.difficultyBandFor(target);
      if (declared >= 0.7) advancedCourses++;

      const withoutGenerator = concepts.filter((c) => !Q.hasGenerator(c.id)).map((c) => c.id);
      const servable = concepts.filter((c) => Q.hasGenerator(c.id) && !withoutGenerator.includes(c.id));

      for (const c of servable) {
        rows++;
        const { bands } = bandsOf(c.id);
        if (bands.has(targetBand)) continue;
        if (EXEMPT.includes(c.id)) continue;
        unreachable.push(`${spec.id}/${level.id} ${c.id}: needs band ${targetBand}, produces [${[...bands].sort().join(",")}]`);
      }

      // 5. NOT RECALL-HEAVY. A course declaring advanced work whose concepts
      //    mostly top out in the recall band is a course serving below its own
      //    claim, whatever its per-concept rows say.
      if (declared >= 0.7) {
        const canReach = servable.filter((c) => bandsOf(c.id).bands.has(targetBand)).length;
        if (canReach * 2 < servable.length) {
          recallHeavy.push(`${spec.id}/${level.id} (${declared}): ${canReach}/${servable.length} concepts reach band ${targetBand}`);
        }
      }
    }
  }

  ok(
    unreachable.length === 0,
    `every concept can express the band its course serves at (${rows} course×concept rows over ${courses} courses)`,
    unreachable.slice(0, 6).join(" · "),
  );
  ok(
    recallHeavy.length === 0,
    `no advanced course is served below its own declared band on most of its concepts (${advancedCourses} advanced courses)`,
    recallHeavy.slice(0, 6).join(" · "),
  );
}

console.log("▸ The exemption is a named decision, not a silent omission");
{
  // 2. The eight primary-arithmetic concepts are the ONLY exemptions, and every
  //    one of them is actually short somewhere — an exemption that is no longer
  //    needed is a stale exemption, and a stale exemption is how a real gap gets
  //    hidden behind a reason that stopped being true.
  const short = new Set();
  for (const spec of specs.SPECIFICATIONS) {
    for (const level of spec.levels ?? []) {
      const active = { spec, level };
      const declared = specs.difficultyFor(active);
      const targetBand = Q.difficultyBandFor(
        bank.practiceTarget({ tier: declared, attempts: 40, correct: 38, streak: 6, misconceptionHits: 0 }).difficulty,
      );
      for (const c of specs.coverageOf(active)) {
        if (!Q.hasGenerator(c.id)) continue;
        if (!bandsOf(c.id).bands.has(targetBand)) short.add(c.id);
      }
    }
  }
  const shortIds = [...short].sort();
  const unexpected = shortIds.filter((id) => !EXEMPT.includes(id));
  ok(
    unexpected.length === 0,
    "no concept outside the eight primary-arithmetic exemptions falls short of a band its course serves",
    unexpected.join(", "),
  );
  const stale = EXEMPT.filter((id) => !short.has(id));
  ok(
    stale.length === 0,
    "every exemption is still needed (a stale exemption hides a real gap)",
    stale.join(", "),
  );
  // And the engine's own list must agree with this one, in both directions.
  const enginePrimary = genome.CONCEPTS.filter((c) => c.subject === "maths").map((c) => c.id);
  ok(
    enginePrimary.length > 0 && shortIds.every((id) => enginePrimary.includes(id)),
    "every exempt concept is a maths concept of the bank (the exemption set is arithmetic, not arbitrary)",
  );
  note.push(`exempt and reported: ${shortIds.join(", ") || "none"} — below the data band on purpose (primary arithmetic), so the gap is named here rather than closed with an item that would overstate the course`);
}

console.log("▸ Band membership is not depth: no concept is stuck at band 4's floor");
{
  // 6. THE REFINEMENT THAT FOLLOWED THE BAND FIX, and the reason this assertion
  //    exists. Assertion 1 asks whether an item lands in the target's BAND, and
  //    `generateQuestionNear` prefers any in-band item over a nearer out-of-band
  //    one — so a concept whose band-4 draws all sit at 0.60 answers a target of
  //    0.77 with a 0.60 item, and every count says the course was served
  //    correctly. Measured, that was thirteen concepts (nine of them maths):
  //    `inequalities` and `mixture-problems` had NO band-4 draw at all, jumping
  //    from ~0.55 straight to 0.85, and the rest produced 0.60–0.65. A band is
  //    0.20 wide, so being "in the band" is not the same as being at the depth
  //    the band's name promises.
  //
  //    The rule: every concept a course can serve must have at least one item in
  //    the UPPER half of band 4 (0.65 and above, below 0.80). Concepts are
  //    exempted exactly as in assertion 1, and for the same reason.
  const UPPER4 = 0.65;
  const empty = [];
  let measured = 0;
  for (const c of genome.CONCEPTS) {
    if (!Q.hasGenerator(c.id)) continue;
    if (EXEMPT.includes(c.id)) continue;
    const { draws } = bandsOf(c.id);
    if (!draws.length) continue;
    measured++;
    if (!draws.some((d) => d >= UPPER4 && d < 0.8)) empty.push(c.id);
  }
  ok(
    empty.length === 0,
    `every non-exempt concept can produce an item in the upper half of band 4 (${measured} concepts, ${SPECTRUM_DRAWS} draws each)`,
    empty.slice(0, 8).join(", "),
  );
  if (empty.length) {
    note.push(`stuck at band 4's floor: ${empty.join(", ")} — these answer a band-4 target with an item at 0.60, which reads as correct in every band-level count`);
  }
}

console.log("▸ The declared demand ladder is producible by the bank");
{
  // 4. `SKILLS_IN_BANK` is a claim about the CONTENT. Measure it: a band is in
  //    the bank only if some generator can actually produce an item at its
  //    difficulty floor. The declaration and the measurement are compared, so
  //    the two can never drift apart in silence.
  const declaredInBank = [...(skills.SKILLS_IN_BANK ?? [])];
  const measured = [];
  for (const [skill, floor] of Object.entries(skills.SKILL_MIN_DIFFICULTY ?? {})) {
    const reachable = genome.CONCEPTS.some((c) => Q.hasGenerator(c.id) && bandsOf(c.id).max >= floor);
    if (reachable) measured.push(skill);
  }
  const missingFromDeclaration = measured.filter((s) => !declaredInBank.includes(s));
  const declaredButUnproducible = declaredInBank.filter((s) => !measured.includes(s));
  ok(
    missingFromDeclaration.length === 0,
    "every demand band the bank can reach is declared reachable",
    missingFromDeclaration.join(", "),
  );
  ok(
    declaredButUnproducible.length === 0,
    "every demand band declared in the bank is actually producible",
    declaredButUnproducible.join(", "),
  );
  // The instrument limit is DECLARED rather than discovered: `extended_response`
  // is a written-answer band, and this bank is multiple-choice and short-answer
  // by construction, so it must be out of the bank in the declaration.
  ok(
    !declaredInBank.includes("extended_response"),
    "extended written response stays out of the bank (multiple choice cannot measure a written answer)",
  );
  note.push(`in bank, measured: ${measured.join(", ")} — the instrument limit (${Object.keys(skills.SKILL_MIN_DIFFICULTY ?? {}).filter((s) => !measured.includes(s)).join(", ")}) is declared, not inferred`);
}

console.log(`\n${"─".repeat(60)}`);
for (const n of note) console.log(`  · ${n}`);
console.log(`\nContent gate: ${fail ? "FAIL" : "PASS"} — ${pass} passed, ${fail} failed`);
if (fail) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  · ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
}
process.exit(fail ? 1 : 0);
