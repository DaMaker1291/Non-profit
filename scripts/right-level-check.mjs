#!/usr/bin/env node
// ── THE RIGHT-LEVEL GATE ───────────────────────────────────────────────────
//
// The engine (lib/right-level.ts) decides four things that a screenshot cannot
// check and a teacher would only discover in week three:
//
//   1. whether an unmeasured pupil is ever given a rung,
//   2. whether every pupil ends up in exactly one band,
//   3. whether the move-up rule can fire on one day, a group answer or a
//      sampled marking,
//   4. whether the product ever claims literacy content it does not have.
//
// Each is asserted below on the REAL compiled module. The fixture numbers are
// invented; the rules are not.
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const rl = require("../.verify/right-level.js");
const sheet = require("../.verify/right-level-sheet.js");
const serve = require("../.verify/right-level-serve.js");
const genome = require("../.verify/genome.js");
const curriculum = require("../.verify/curriculum.js");

let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`  ✗ ${label}`);
  }
}

console.log("▸ Right-level engine");

// ── THE LADDER IS MADE OF REAL CONCEPTS ─────────────────────────────────────
ok(rl.RUNGS.length === 6, "the ladder has six rungs (0–5)");
ok(
  rl.RUNGS.every((r, i) => r.level === i),
  "the rungs are ordered 0..5 with no gap",
);
ok(rl.RUNGS[0].conceptIds.length === 0, "rung 0 carries no app concept, and says so");
ok(rl.RUNGS[0].teach.includes("not a lesson in this app"), "rung 0 names itself as outside the app's content");

for (const rung of rl.RUNGS) {
  for (const id of rung.conceptIds) {
    ok(!!genome.CONCEPTS_BY_ID[id], `rung ${rung.level} names a real concept: ${id}`);
  }
}
ok(rl.RUNGS.slice(1).every((r) => r.conceptIds.length > 0), "every rung above 0 is carried by at least one concept");

// Foundations-first: a rung may not sit BELOW the rung before it.
const depthOf = (rung) =>
  Math.min(...rung.conceptIds.map((id) => genome.ancestorsOf(id).length), Number.POSITIVE_INFINITY);
let previousDepth = -1;
for (const rung of rl.RUNGS.slice(1)) {
  const depth = depthOf(rung);
  ok(depth >= previousDepth, `rung ${rung.level} is not shallower than rung ${rung.level - 1}`);
  previousDepth = depth;
}

// ── THE PLACEMENT IS FIXED AND COMPLETE ─────────────────────────────────────
for (const rung of rl.RUNGS) {
  const prompts = rl.PLACEMENT[rung.level] ?? [];
  ok(prompts.length === 3, `rung ${rung.level} has three probes (${prompts.length})`);
  ok(
    prompts.every((p) => typeof p.show === "string" && p.show.trim().length > 0 && p.expect.trim().length > 0),
    `rung ${rung.level}'s probes are complete`,
  );
}
ok(
  new Set(rl.RUNGS.map((r) => JSON.stringify(rl.PLACEMENT[r.level]))).size === 6,
  "no two rungs share the same probes",
);

// ── THE STAIRCASE ───────────────────────────────────────────────────────────
const resp = (level, correct, times = 3) =>
  Array.from({ length: times }, (_, i) => ({ level, correct: i < correct }));

ok(rl.markPlacement([]).level === "unknown", "no probes at all is 'unknown', never rung 0");

const allClear = [0, 1, 2, 3, 4, 5].flatMap((l) => resp(l, 3));
const top = rl.markPlacement(allClear);
ok(top.level === 5 && top.complete === true, "clearing every rung places at rung 5");

const zeroOnly = rl.markPlacement(resp(0, 3));
ok(zeroOnly.level === 0 && zeroOnly.complete === false, "counting but no place-value probe is rung 0 and incomplete");

const failsOne = rl.markPlacement([...resp(0, 3), ...resp(1, 1)]);
ok(failsOne.level === 0 && failsOne.stoppedAt === 1 && failsOne.complete === true, "failing rung 1 places at rung 0");

const below = rl.markPlacement(resp(0, 1));
ok(below.level === "below", "failing the counting probes is 'below', not rung 0");

const stopsEarly = rl.markPlacement([...resp(0, 3), ...resp(1, 3)]);
ok(stopsEarly.level === 1 && stopsEarly.complete === false, "a staircase that runs out of probes is a floor, not a ceiling");

const oneSlip = rl.markPlacement([...resp(0, 3), ...resp(1, 2), ...resp(2, 1)]);
ok(oneSlip.level === 1, "two of three promotes one rung, and one of three stops there");

// ── EVIDENCE NEVER INVENTS A LEVEL ──────────────────────────────────────────
ok(rl.levelFromEvidence(undefined).level === "unknown", "no ledger is 'unknown'");
ok(rl.levelFromEvidence({}).level === "unknown", "an empty ledger is 'unknown'");

const full = (rate, asked = 6) => ({ asked, correct: Math.round(asked * rate), rate });

const placeOnly = rl.levelFromEvidence({ "place-value": full(0.9) });
ok(placeOnly.level === 1, "place value held alone places at rung 1");

const placeWeak = rl.levelFromEvidence({ "place-value": full(0.2) });
ok(placeWeak.level === 1, "weak place value is rung 1, never rung 0 — counting is not in the ledger");

const addOnly = rl.levelFromEvidence({ addition: full(1), subtraction: full(1) });
ok(addOnly.level === "unknown", "addition with no place value is not a rung: the ladder starts at its first rung");

const twoRungs = rl.levelFromEvidence({ "place-value": full(1), addition: full(1), subtraction: full(1) });
ok(twoRungs.level === 2, "two rungs held places at rung 2");

const thin = rl.levelFromEvidence({ "place-value": full(1, 2) });
ok(thin.level === "unknown", "two answers is not enough evidence for a level");

const everything = rl.levelFromEvidence({
  "place-value": full(1),
  addition: full(1),
  subtraction: full(1),
  multiplication: full(1),
  division: full(1),
  fractions: full(1),
  decimals: full(1),
  percentages: full(1),
});
ok(everything.level === 5, "every rung held places at rung 5");

// ── BANDS PARTITION THE CLASS ───────────────────────────────────────────────
const plan = rl.bandsFrom({ a: 0, b: 1, c: 1, d: 2, e: "below", f: "unknown" });
const banded = plan.bands.flatMap((b) => b.members);
const everyone = [...banded, ...plan.below, ...plan.unknown].sort();
ok(
  JSON.stringify(everyone) === JSON.stringify(["a", "b", "c", "d", "e", "f"]),
  "every pupil lands in exactly one band, below, or unknown",
);
ok(new Set(everyone).size === everyone.length, "no pupil is counted twice");
ok(!banded.includes("f"), "an unmeasured pupil is never placed in a band");
ok(plan.total === 6 && plan.measured === 5, "the totals count the unmeasured");
ok(plan.bands.map((b) => b.level).join(",") === "0,1,2", "bands are ordered lowest first");
ok(plan.bands[0].inApp === false && plan.bands[0].conceptId === null, "rung 0 is marked as outside the app");
ok(plan.bands[1].conceptId === "place-value", "rung 1 points at place value");

const wide = rl.bandsFrom({ a: 1, b: 4 });
ok(wide.spread === 3 && wide.oneExplanationCannotCover === true, "a three-rung spread is flagged as uncoverable by one explanation");

const emptyPlan = rl.bandsFrom({});
ok(emptyPlan.bands.length === 0 && emptyPlan.total === 0 && emptyPlan.spread === 0, "an empty class is an empty plan, not a level");

// ── ASSESSING A CLASS FROM THE LEDGER ───────────────────────────────────────
const live = {
  amina: { concepts: { "place-value": full(1) } },
  joseph: { concepts: {} },
};
const assessed = rl.assessClass(live);
ok(assessed.levels.amina === 1, "assessClass reads the member's own concepts");
ok(assessed.levels.joseph === "unknown", "a member with no concepts is unmeasured");
ok(assessed.sources === 1, "only measured members are counted as sources");
ok(Object.keys(rl.assessClass(undefined).levels).length === 0, "no live view is no members");

// ── THE SPRINT IS TWENTY MINUTES AND SAYS SO ────────────────────────────────
const oneEach = { version: 1, languages: ["en"], materials: [], access: [], devices: "one-per-pupil", internet: "reliable" };
for (let level = 1; level <= 5; level += 1) {
  const sprint = rl.dailySprint(level, oneEach);
  const sum = sprint.blocks.reduce((s, b) => s + b.minutes, 0);
  ok(sum === rl.SPRINT_MINUTES && sprint.totalMinutes === rl.SPRINT_MINUTES, `rung ${level}'s sprint is exactly 20 minutes (${sum})`);
  ok(sprint.available === true, `rung ${level}'s sprint is app content`);
  ok(sprint.blocks.some((b) => b.step === "Books closed"), `rung ${level}'s sprint has an unaided check`);
  ok(sprint.record === "per-child", `rung ${level} records per child when every pupil has a device`);
}

const noDevices = { version: 1, languages: ["en"], materials: ["board"], access: [], devices: "none", internet: "none" };
const deviceFree = rl.dailySprint(3, noDevices);
ok(deviceFree.record === "band-only", "no pupil device means a band count, never an individual claim");
ok(deviceFree.recordNote.includes("never promotes"), "the band-only note says it cannot promote a child");

const rungZero = rl.dailySprint(0, noDevices);
ok(rungZero.available === false, "rung 0's routine is not claimed as an OpenMind lesson");
ok(rungZero.totalMinutes === 10, "rung 0's counting routine is ten minutes");
ok(rungZero.record === "band-only", "rung 0 is never per-child evidence");

// ── THE MOVE-UP RULE CANNOT BE FOOLED ───────────────────────────────────────
const DAY = 86_400_000;
const sitting = (day, unaided, extra = {}) => ({ at: day * DAY, items: 6, unaided, group: false, sampled: false, ...extra });

ok(rl.evaluateMoveUp([]).decision === "not-enough-evidence", "no sittings is not enough evidence");
ok(rl.evaluateMoveUp([sitting(1, 6)]).decision === "not-enough-evidence", "one perfect sitting does not move a pupil up");
ok(
  rl.evaluateMoveUp([sitting(1, 6), { ...sitting(1, 6), at: DAY + 3_600_000 }]).decision === "not-enough-evidence",
  "two sittings on one day do not move a pupil up",
);
ok(rl.evaluateMoveUp([sitting(1, 5), sitting(2, 5)]).decision === "move-up", "five of six on two days moves up");
ok(rl.evaluateMoveUp([sitting(1, 6), sitting(2, 5)]).decision === "move-up", "six and five on two days moves up");
ok(rl.evaluateMoveUp([sitting(1, 4), sitting(2, 6)]).decision === "reteach", "four of six on either day is a reteach");
ok(rl.evaluateMoveUp([sitting(1, 2), sitting(2, 3)]).decision === "hold", "two weak sittings hold the pupil");
ok(rl.evaluateMoveUp([sitting(1, 6, { group: true }), sitting(2, 6, { group: true })]).decision === "not-enough-evidence", "group answers never move a pupil up");
ok(rl.evaluateMoveUp([sitting(1, 6, { sampled: true }), sitting(2, 6, { sampled: true })]).decision === "not-enough-evidence", "a sampled marking never moves a pupil up");
ok(rl.evaluateMoveUp([sitting(1, 6), sitting(2, 6, { group: true })]).decision === "not-enough-evidence", "one group sitting cannot pair with one real sitting");
ok(rl.evaluateMoveUp([sitting(1, 6, { items: 3 }), sitting(2, 6, { items: 3 })]).decision === "not-enough-evidence", "three-item sittings are not the six-item check");

// ── LEVEL MOVEMENT DOES NOT INVENT A RATE ───────────────────────────────────
ok(rl.levelGain([{ at: DAY, level: 2 }]).gained === null, "one observation is a level, not a gain");
const short = rl.levelGain([{ at: DAY, level: 1 }, { at: 4 * DAY, level: 3 }]);
ok(short.gained === 2 && short.perWeek === null, "a three-day gain has no weekly rate");
const fortnight = rl.levelGain([{ at: DAY, level: 1 }, { at: 15 * DAY, level: 3 }]);
ok(fortnight.perWeek === 1 && fortnight.spanDays === 14, "a fortnight gain of two is one level per week");
const unordered = rl.levelGain([{ at: 15 * DAY, level: 3 }, { at: DAY, level: 1 }]);
ok(unordered.gained === 2, "observations are ordered before the gain is computed");

// ── THE CLAIMS, INCLUDING THE ONE ABOUT LITERACY ────────────────────────────
ok(rl.LITERACY_GAP.present === false, "the literacy gap is declared absent");
ok(rl.LITERACY_GAP.concepts === 0, "no literacy concept is claimed");
ok(rl.literacyConcepts().length === 0, "the genome really holds no literacy concept");
ok(rl.LITERACY_GAP.missing.length >= 5, "the gap names what is missing");
ok(rl.LITERACY_GAP.wouldRequire.length >= 3, "the gap names what it would take");
ok(
  rl.RIGHT_LEVEL_CLAIMS.doesNotAssert.some((line) => /literacy/i.test(line)),
  "the claims refuse a literacy effect in so many words",
);
ok(
  rl.RIGHT_LEVEL_CLAIMS.asserts.every((line) => !/raise|increase|improve/i.test(line)),
  "the engine asserts mechanics, never an effect size",
);

// ── THE CONTINUITY CORE NO LONGER PROMISES LITERACY ────────────────────────
ok(curriculum.CONTINUITY_CORE.length === 8, "the continuity core holds eight concepts");
ok(
  curriculum.CONTINUITY_CORE.every((id) => !!genome.CONCEPTS_BY_ID[id]),
  "every continuity-core id is a real concept",
);
ok(
  !curriculum.CONTINUITY_CORE.some((id) => /read|sentence/i.test(id)),
  "the continuity core no longer names reading or sentences",
);

// ── THE PLAN IS PURE AND THE LOAD IS HONEST ─────────────────────────────────
const levels = { a: 1, b: 1, c: 2, d: "unknown" };
const first = JSON.stringify(rl.classPlan(levels, noDevices));
const second = JSON.stringify(rl.classPlan(levels, noDevices));
ok(first === second, "the same class produces the same plan twice");
const planForClass = rl.classPlan(levels, noDevices);
ok(planForClass.warnings.some((w) => /unmeasured/.test(w)), "unmeasured pupils are warned about by name");
ok(planForClass.sprints.length === planForClass.bands.bands.length, "every band gets its own sprint");

const load = rl.placementLoad(55);
ok(load.wholeClassMinutes === 165 && load.wholeClassLessons === 5, "55 pupils is 165 minutes — five lessons, stated");
ok(load.routes.length === 3 && load.routes.some((r) => r.id === "show-me"), "three honest placement routes are offered");
ok(load.routes.some((r) => /Approximate/.test(r.precision)), "the whole-class route admits it is approximate");
ok(rl.placementLoad(0).wholeClassMinutes === 0, "no pupils is no placement time");

// ── THE PAPER CHECK: SIX ITEMS, NO ANSWERS, SAME SIX ALL DAY ────────────────
const DATE = "2026-11-23";
for (const rung of rl.RUNGS) {
  const paper = sheet.bandSheet(rung.level, DATE);
  ok(paper.level === rung.level, `rung ${rung.level}'s sheet knows its rung`);
  if (rung.conceptIds.length === 0) {
    ok(paper.outside === true && paper.items.length === 0, `rung ${rung.level} prints no items, and says it is outside the app`);
    continue;
  }
  ok(paper.outside === false, `rung ${rung.level}'s sheet is app content`);
  ok(paper.items.length === rl.CHECK_ITEMS, `rung ${rung.level}'s sheet holds ${rl.CHECK_ITEMS} items (${paper.items.length})`);
  ok(paper.answers.length === paper.items.length, `rung ${rung.level} has one key entry per item`);
  ok(paper.short === false, `rung ${rung.level}'s sheet is not short`);
  ok(new Set(paper.items.map((i) => i.id)).size === paper.items.length, `rung ${rung.level}'s six items are distinct`);
  ok(
    paper.items.every((i) => typeof i.prompt === "string" && i.prompt.trim().length > 0 && i.choices.length >= 2),
    `rung ${rung.level}'s items each have a prompt and options`,
  );
  ok(
    paper.items.every((i) => !("answer" in i) && !("explanation" in i) && !("answerIndex" in i)),
    `rung ${rung.level}'s pupil items carry no answer or explanation`,
  );
  const aligned = paper.answers.every((a, i) => a.id === paper.items[i].id && paper.items[i].choices[a.answerIndex] === a.answer);
  ok(aligned, `rung ${rung.level}'s key points at the option the item marks`);
  ok(paper.answers.every((a) => a.explanation.trim().length > 0), `rung ${rung.level}'s key explains every answer`);
}

const todaySheet = sheet.bandSheet(1, DATE);
const tomorrowSheet = sheet.bandSheet(1, "2026-11-24");
ok(
  JSON.stringify(sheet.bandSheet(1, DATE)) === JSON.stringify(todaySheet),
  "the same rung on the same date draws the same six items",
);
ok(
  todaySheet.items.some((i) => !tomorrowSheet.items.some((j) => j.id === i.id)),
  "tomorrow's sheet is a different set of items",
);

// ── THE LINK THE TEACHER'S PAGE BUILDS ─────────────────────────────────────
const parsed = sheet.parseBands("2:25,1:12,3:18");
ok(parsed.map((b) => b.level).join(",") === "1,2,3", "bands parse and sort lowest first");
ok(sheet.parseBands("9:4,x:2,1:0,-1:3").length === 0, "a rung outside 0–5 or a count of zero is dropped, not clamped");
ok(sheet.parseBands("2:99999")[0].count === 200, "a headcount is capped at 200");
ok(sheet.parseBands("1:5,1:9").length === 1, "a repeated rung prints one sheet, not two");
ok(sheet.parseBands(undefined).length === 0, "no query is no sheets");
ok(sheet.bandsQuery([{ level: 3, count: 18 }, { level: 1, count: 12 }]) === "1:12,3:18", "the query is built lowest rung first");
ok(
  JSON.stringify(sheet.parseBands(sheet.bandsQuery([{ level: 0, count: 7 }, { level: 5, count: 2 }]))) ===
    JSON.stringify([{ level: 0, count: 7 }, { level: 5, count: 2 }]),
  "the query round-trips, rung 0 included",
);
ok(sheet.sheetDate("nonsense", "2026-01-01") === "2026-01-01", "an invalid date falls back rather than seeding from garbage");
ok(sheet.sheetDate("2026-11-23", "2026-01-01") === "2026-11-23", "a valid date is used as given");
ok(sheet.bandSheets(sheet.parseBands("1:5,2:9"), DATE).length === 2, "one sheet per band in the link");

// ── THE RUNG CHANGES WHAT IS SERVED ────────────────────────────────────────
// This is the assertion the audit's Phase 4 asked for: a placement that only
// informs a human changes nothing for the child.
const deep = genome.CONCEPTS.filter((c) => c.stage >= 3).map((c) => c.id);
ok(deep.length > 0, "the genome holds concepts above stage 2 to test with");
const deepId = deep[0];
const placed = serve.servedForRung(deepId, 2);
ok(placed.changed === true, `a stage-3 concept is not served to rung 2 (${deepId})`);
ok(placed.conceptId === "addition", "rung 2's substitution is the rung's own concept (addition)");
ok(serve.rungConceptId(0) === "place-value", "rung 0 opens at the lowest concept the app has");
ok(placed.from === deepId, "the adjustment reports what was asked for");
ok(serve.servedForRung("place-value", 2).changed === false, "a stage-0 concept passes unchanged at rung 2");
ok(serve.servedForRung(deepId, null).reason === "no-level", "no placement changes nothing");
ok(serve.servedForRung(deepId, undefined).changed === false, "an absent rung is not rung 0");
ok(serve.servedForRung("not-a-concept", 2).reason === "unknown-concept", "an unknown concept is reported, not guessed");
const beyondFive = genome.CONCEPTS.filter((c) => c.stage > serve.RUNG_STAGE_CEILING[5]).map((c) => c.id);
ok(beyondFive.length > 0 ? serve.servedForRung(beyondFive[0], 5).changed === true : true, "rung 5 still caps above its own ceiling");
ok(serve.servedForRung(deepId, 5).changed === false, "a concept at rung 5's ceiling is served unchanged");
ok(serve.servedForRung(deepId, 0).belowContent === true, "rung 0 admits the app has nothing below place value");

for (let level = 1; level <= 5; level += 1) {
  ok(
    serve.RUNG_STAGE_CEILING[level] >= serve.RUNG_STAGE_CEILING[level - 1],
    `the stage ceiling does not fall from rung ${level - 1} to ${level}`,
  );
}

const mapped = serve.adjustActions(
  [{ conceptId: deepId, title: "a" }, { conceptId: "place-value", title: "b" }, { title: "paper reminder" }],
  2,
);
ok(mapped[0].conceptId === "addition", "an above-rung recommendation is substituted with the rung's concept");
ok(mapped[1].conceptId === "place-value", "a within-rung recommendation is left alone");
ok(!("conceptId" in mapped[2]), "a recommendation with no concept passes through untouched");
ok(mapped.length === 3, "no action is dropped");

const stored = serve.normalizeClassLevels({ amina: 2, joseph: 4, stranger: 3, bad: 9, worse: "2" }, ["amina", "joseph", "bad", "worse"]);
ok(JSON.stringify(stored) === JSON.stringify({ amina: 2, joseph: 4 }), "a level for a non-member or outside 0–5 is dropped, never clamped");
ok(serve.normalizeClassLevels({}, ["a"]) === undefined, "an empty placement is 'not placed', not an empty record");
ok(serve.rungForHandle({ a: 3 }, "a") === 3, "a stored rung is read back");
ok(serve.rungForHandle({ a: 3 }, "b") === null, "a member with no level is unplaced");
ok(serve.rungForHandle({ a: 99 }, "a") === null, "a corrupted stored value is absent, not a level");

console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
