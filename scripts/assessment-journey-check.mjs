#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE LEARNER-FACING ASSESSMENT JOURNEY, AGAINST A REAL SERVER.
//
// This is deliberately not another marker test. It drives the HTTP route on a
// SCRATCH store (the caller starts it with a temporary data directory) through:
//   serve → submit → deterministic mark → partial credit → feedback →
//   evidence → mastery → next step.
//
// The fixture is test data. Every response must say `notTeacherApproval: true`;
// the real blueprints must remain refused by the gate. A run that cannot prove
// the refusal is a run that has only tested the happy path.
// ─────────────────────────────────────────────────────────────────────────────
const BASE = process.env.OPENMIND_BASE ?? "http://localhost:4173";

let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${label}`);
  }
}
async function call(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, init);
  let body = null;
  try { body = await response.json(); } catch { /* a door may answer no body */ }
  return { status: response.status, body };
}
const post = (path, body) => call(path, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const get = (path) => call(path);

const health = await get("/api/ready");
if (health.status !== 200) {
  console.error(`assessment journey: server is not ready at ${BASE} (status ${health.status})`);
  process.exit(1);
}

const secret = `assessment-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const created = await post("/api/profile", {
  handle: "assessment_journey_e2e",
  country: "GB",
  language: "en",
  birthYear: 2009,
  subjects: ["biology"],
  secret,
});
const id = created.body?.profile?.id ?? created.body?.id ?? created.body?.state?.profile?.id;
ok(created.status === 200 && typeof id === "string" && id.length > 0, "a scratch learner is created");

const catalog = await get("/api/assessment");
ok(catalog.status === 200, "the assessment status door answers");
ok(catalog.body?.fixture?.notTeacherApproval === true, "the fixture is labelled notTeacherApproval");
ok(catalog.body?.fixture?.itemIds?.length === 4, "the fixture exposes numeric, short-answer, prose and table formats");
ok(catalog.body?.fixture?.itemIds?.includes("mt-01"), "the table fixture is an explicit test item, not an approved blueprint");
ok(catalog.body?.approved === 0, "no real blueprint is approved");
const maths = catalog.body?.blueprints?.find((bp) => bp.subject === "maths");
ok(maths?.reviewStatus === "unreviewed" && maths?.clearance?.rights === "cleared"
  && maths?.clearance?.licensing === "cleared" && maths?.servable === false,
  "the table blueprint has clear rights/licensing but is still refused for missing review");
ok(catalog.body?.blueprints?.every((bp) => bp.servable === false), "all three real blueprints are refused");

const unauth = await post("/api/assessment", { id, itemId: "dd-05", fixture: true, responses: ["630 J/g"], working: [""] });
ok(unauth.status === 401, "a submission without a capability is refused");

const publicItem = await get("/api/assessment?fixture=1&itemId=dd-05");
ok(publicItem.status === 200 && publicItem.body?.notTeacherApproval === true, "the fixture item is served as test data");
const publicJson = JSON.stringify(publicItem.body);
ok(!/"modelAnswer"/.test(publicJson), "the served item does not carry its model answer");
ok(!/"answer"\s*:/.test(publicJson), "the served item does not carry the numeric key");
ok(!/"accepted"\s*:/.test(publicJson), "the served item does not carry accepted answers");
ok(!/"tolerance"\s*:/.test(publicJson), "the served item does not carry tolerances");
ok(!/"explanation"\s*:/.test(publicJson), "the served item does not carry the marking explanation");

let submission = 0;
const submit = async (itemId, responses, working = [""]) => post("/api/assessment", {
  id, secret, itemId, fixture: true,
  responses, working,
  submissionId: `assessment-e2e-${++submission}`,
});

const full = await submit("dd-05", ["630 J/g"], ["20 × 4.2 × 15 = 1260"]);
ok(full.status === 200 && full.body?.score?.awarded === 2 && full.body?.score?.total === 2, "dd-05 full response earns 2/2");
ok(full.body?.recorded === true && full.body?.notTeacherApproval === true, "the result is recorded and labelled test-only");

const partial = await submit("dd-01", ["fatty acids"]);
ok(partial.status === 200 && partial.body?.score?.awarded === 1 && partial.body?.score?.total === 2, "dd-01 partial response earns 1/2");
ok(partial.body?.grade?.parts?.[0]?.criteria?.some((c) => c.met) === true
  && partial.body?.grade?.parts?.[0]?.criteria?.some((c) => !c.met) === true,
  "partial credit names both the earned and the missing criterion");

const alternative = await submit("dd-01", ["glycerine and fatty acid"]);
ok(alternative.status === 200 && alternative.body?.score?.awarded === 2, "an authored alternative earns full marks");

const missingUnit = await submit("dd-05", ["630"], ["20 × 4.2 × 15 = 1260"]);
ok(missingUnit.status === 200 && missingUnit.body?.score?.awarded === 1, "a missing unit keeps the method mark and loses the answer mark");
ok(/unit/i.test(JSON.stringify(missingUnit.body?.grade ?? {})), "the missing-unit feedback names the unit");

const wrong = await submit("dd-01", ["glucose and amino acids"]);
ok(wrong.status === 200 && wrong.body?.score?.awarded === 0, "incorrect reasoning earns 0");
ok(wrong.body?.grade?.parts?.[0]?.criteria?.some((c) => c.misconception?.id === "fat-products-are-sugars"),
  "the wrong response names the authored misconception");

const beforeInvalid = (await get(`/api/evidence?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`)).body?.events?.length ?? -1;
const invalid = await submit("dd-05", ["not a number"], [""]);
ok(invalid.status === 400, "an unparseable numeric submission is refused");
const afterInvalid = (await get(`/api/evidence?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`)).body?.events?.length ?? -1;
ok(beforeInvalid >= 0 && afterInvalid === beforeInvalid, "an invalid submission writes no evidence");

const prose = await submit("dd-02", ["Villi are muscles that push food along."]);
ok(prose.status === 200 && prose.body?.unscored === true && prose.body?.score === null, "prose is returned unscored");
ok(prose.body?.recorded === false, "prose is not recorded as answer evidence");
ok(Array.isArray(prose.body?.rubric) && prose.body.rubric.length === 4, "prose returns the authored four-point rubric");
ok(prose.body?.advisory?.some((flag) => flag.id === "villi-are-muscles" && flag.advisory === true),
  "prose returns an advisory misconception, not a mark");

const ledger = await get(`/api/evidence?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`);
const events = ledger.body?.events ?? [];
const assessmentEvents = events.filter((event) => event.type === "answer_submitted" && event.source === "assessment");
ok(assessmentEvents.length === 5, "exactly the five machine-marked responses are on the assessment ledger");
ok(assessmentEvents.every((event) => event.provenance === "server" && event.score && event.score.max > 0),
  "every assessment event is server-observed and carries a mark scheme");
ok(assessmentEvents.some((event) => event.score.awarded < event.score.max), "partial credit survives into the evidence ledger");

const progress = await get(`/api/progress?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`);
const digestion = progress.body?.progress?.digestion;
ok(progress.status === 200 && digestion?.attempts === 5, "the five answers project into the learner model");
ok(digestion?.marksAwarded === 6 && digestion?.marksAvailable === 10, "the model keeps 6/10 marks, not just right/wrong");
ok(typeof digestion?.mastery === "number" && digestion.mastery >= 0 && digestion.mastery <= 1, "mastery is a number");
ok(full.body?.nextStep?.kind && full.body.nextStep.basis, "the first result carries a next-step action with a basis");

const refused = await post("/api/assessment", {
  id, secret, blueprintId: "biology.diet-digestion.year9", itemId: "dd-05",
  responses: ["630 J/g"], working: ["20 × 4.2 × 15 = 1260"],
});
ok(refused.status === 403 && refused.body?.error === "not_servable", "the real blueprint is refused at the learner door");
ok(refused.body?.reasons?.some((reason) => /unreviewed/i.test(reason)), "the refusal names the missing teacher review");
ok(refused.body?.reasons?.some((reason) => /rights are unknown/i.test(reason)), "the refusal names the unknown rights independently");

console.log(`\nassessment journey: ${passed} passed, ${failed} failed`);
if (failed) {
  console.error("assessment journey: the learner-facing loop or the gate did not hold");
  process.exit(1);
}
console.log("✓ compile → serve without keys → mark → partial credit → evidence → mastery → next step, with the test label and the gate intact.");
