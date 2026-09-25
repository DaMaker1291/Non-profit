// End-to-end API lifecycle test against the running dev server.
// Usage: node scripts/e2e-api.mjs   (requires dev server on :4173)
//
// This suite runs in the same checkout as the server, which lets a few
// assertions read the DATA DIRECTORY directly. That is not a shortcut: the
// strongest available claim about "your own paper" is that the store contains
// marks and ideas and no question text, and only the file can prove it.
import fs from "node:fs";

const BASE = "http://localhost:4173";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  ✗", m); } };

async function call(path, opts) {
  const res = await fetch(BASE + path, opts);
  // The body is parsed defensively: a route that answers 500 with an EMPTY
  // body used to take this whole file down with "Unexpected end of JSON
  // input" at whichever line happened to call it — turning one failed
  // assertion into no report at all. The status is what the assertions read;
  // an unparseable body is recorded as its raw text so it can be printed.
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 200) }; }
  // Headers as well as the body: the accounts section proves that a session
  // survives on the cookie ALONE, and the cookie only exists in the response.
  return { status: res.status, body, headers: res.headers };
}
const json = (body, headers = {}) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify(body),
});
// Capability secrets (audit P0-E): every profile created by this suite gets a
// secret; any POST naming that profile carries it automatically.
const SECRETS = new Map();
const post = (p, b) => {
  const body = b && typeof b === "object" && b.id && SECRETS.has(b.id) ? { ...b, secret: SECRETS.get(b.id) } : b;
  return call(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
};
const getAuthed = (path, id) => {
  const s = SECRETS.get(id);
  return call(`${path}${path.includes("?") ? "&" : "?"}secret=${encodeURIComponent(s ?? "")}`);
};
async function newProfile(body) {
  const secret = `e2e-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const r = await post("/api/profile", { ...body, secret });
  if (r.body?.profile?.id) SECRETS.set(r.body.profile.id, secret);
  return r;
}

// 1. Profile lifecycle
const prof = await newProfile({
  handle: "amina_k", country: "KE", language: "sw", birthYear: 2010,
  goal: "I want to become an engineer", subjects: ["maths", "physics"],
});
ok(prof.status === 200 && prof.body.profile?.id, "profile created");
const pid = prof.body.profile.id;
ok(prof.body.profile.handle === "amina_k" && prof.body.profile.country === "KE", "profile fields persisted");

const profGet = await getAuthed(`/api/profile?id=${pid}`, pid);
ok(profGet.status === 200 && profGet.body.profile.id === pid, "profile fetched back with its secret");
// Audit P0-E: the id alone is no longer a credential.
const profNoSecret = await call(`/api/profile?id=${pid}`);
ok(profNoSecret.status === 401, "profile GET without the capability secret → 401");
const profWrongSecret = await call(`/api/profile?id=${pid}&secret=wrong-wrong-wrong`);
ok(profWrongSecret.status === 401, "profile GET with a wrong secret → 401");

// 2. Question API
const q = await call("/api/question?conceptId=linear-equations&seed=e2e-1");
ok(q.status === 200 && q.body.question?.choices?.length === 4, "question generated with 4 choices");
ok(q.body.question.prompt.includes("="), "linear-equations question is well-formed");

const qBad = await call("/api/question?conceptId=nope");
ok(qBad.status === 404, "unknown concept → 404");

// 3. Practice API (server-graded): serve → wrong answer → serve → right answer
// (reveal:true is a non-production test hook; the served question carries no
// answer fields in production.)
const s1 = await post("/api/progress", { action: "serve", id: pid, conceptId: "linear-equations", reveal: true });
ok(s1.status === 200 && s1.body.question?.choices?.length === 4, "practice question served");
// PREFLIGHT, because the failure this suite would otherwise produce is a
// lie about the product: a PRODUCTION build compiles the `reveal` hook OUT on
// purpose (a test hook that works in production is a production hole), so every
// later assertion here would fail as "wrong answer graded server-side" and then
// die on `undefined.toFixed` — which reads like a broken grading route. The
// suite only means anything against the DEVELOPMENT server; say so, loudly,
// instead of reporting the product broken.
if (s1.status === 200 && s1.body.question && !("answer" in s1.body.question)) {
  console.error(
    "\n  This suite drives the `reveal` test hook, which a production build strips.\n" +
    "  Run it against the development server:\n\n" +
    "      npm run dev &   # → http://localhost:4173\n      npm run e2e\n\n" +
    "  A production build can still be checked with `npm run build`.\n",
  );
  process.exit(2);
}
// without the hook the answer fields must be stripped
const sPlain = await post("/api/progress", { action: "serve", id: pid, conceptId: "fractions" });
ok(!("answer" in sPlain.body.question) && !("explanation" in sPlain.body.question), "served question carries no answer fields");
const wrongIdx = (s1.body.question.answer + 1) % s1.body.question.choices.length;
const p1 = await post("/api/progress", { action: "answer", id: pid, conceptId: "linear-equations", questionId: s1.body.question.id, choiceIndex: wrongIdx });
ok(p1.status === 200 && p1.body.correct === false, "wrong answer graded server-side");
ok(p1.body.misconceptionId, `wrong answer names a misconception (${p1.body.misconceptionId})`);
const s2 = await post("/api/progress", { action: "serve", id: pid, conceptId: "linear-equations", reveal: true });
const p2 = await post("/api/progress", { action: "answer", id: pid, conceptId: "linear-equations", questionId: s2.body.question.id, choiceIndex: s2.body.question.answer });
ok(p2.status === 200 && p2.body.correct === true && p2.body.streak === 1, "streak builds on correct");
ok(p2.body.mastery > p1.body.mastery, `mastery rose (${p1.body.mastery.toFixed(3)} → ${p2.body.mastery.toFixed(3)})`);
// stale question (already graded) must be refused
const pStale = await post("/api/progress", { action: "answer", id: pid, conceptId: "linear-equations", questionId: s2.body.question.id, choiceIndex: 0 });
ok(pStale.status === 400, "replayed practice answer rejected");
// unserved question must be refused
const pGhost = await post("/api/progress", { action: "answer", id: pid, conceptId: "linear-equations", questionId: "never-served", choiceIndex: 0 });
ok(pGhost.status === 400, "never-served question rejected");

// helper: one server-graded correct answer for a concept (uses the reveal
// test hook — production clients never see the answer before grading)
async function lift(conceptId, times = 1) {
  for (let i = 0; i < times; i++) {
    const s = await post("/api/progress", { action: "serve", id: pid, conceptId, reveal: true });
    if (s.status !== 200) return false;
    const r = await post("/api/progress", { action: "answer", id: pid, conceptId, questionId: s.body.question.id, choiceIndex: s.body.question.answer });
    if (r.status !== 200 || !r.body.correct) return false;
  }
  return true;
}

// 3b. Profile GET must not leak live diagnostic sessions
const leak = await getAuthed(`/api/profile?id=${pid}`, pid);
ok(!JSON.stringify(leak.body).includes(":session"), "profile response carries no live session objects");

// 3c. Concepts (Knowledge Genome) API
const cList = await call("/api/concepts?subject=maths");
ok(cList.status === 200 && cList.body.count >= 60, `genome API lists maths concepts (${cList.body?.count})`);
const cOne = await call("/api/concepts?concept=quadratics");
ok(cOne.status === 200 && cOne.body.prereqChain.includes("algebra-expand"), "concept API returns prereq chain");
ok(cOne.body.misconceptions.length > 0, "concept API carries misconception catalogues");

// 4. Path API — lift every other maths concept above the 0.65 mastery gate
// (3 server-graded correct answers: 0.2 → 0.44 → 0.61 → 0.73), leaving
// quadratics as the only true gap. The path must then point at exactly that.
for (const c of cList.body.concepts) {
  if (c.id !== "quadratics" && c.hasGenerator) {
    const lifted = await lift(c.id, 3);
    ok(lifted, `baseline lift for ${c.id}`);
  }
}
const path1 = await getAuthed(`/api/path?id=${pid}&subject=maths`, pid);
ok(path1.status === 200 && Array.isArray(path1.body.path), "path returned");
const quadStep = path1.body.path.find((s) => s.conceptId === "quadratics");
ok(!!quadStep, "isolated gap (quadratics) appears on the path");
ok(path1.body.path.some((s) => s.actions?.length > 0), "path steps carry actions");

// 4b. The closed learning loop (lib/session.ts) through the API: baseline →
// evidence → recomputed plan → a diff that admits what happened. A separate
// learner is used so the hand-built state above stays a controlled fixture.
const lprof = await newProfile({ handle: "loop_e2e", country: "GB", language: "en", birthYear: 2010, goal: "", subjects: ["maths"] });
ok(lprof.status === 200 && lprof.body.profile?.id, "loop profile created");
const lid = lprof.body.profile.id;

async function gradeOne(who, conceptId, correct) {
  const s = await post("/api/progress", { action: "serve", id: who, conceptId, reveal: true });
  if (s.status !== 200) return null;
  const idx = correct ? s.body.question.answer : (s.body.question.answer + 1) % s.body.question.choices.length;
  const r = await post("/api/progress", { action: "answer", id: who, conceptId, questionId: s.body.question.id, choiceIndex: idx });
  return r.status === 200 ? r.body : null;
}

for (let i = 0; i < 4; i++) {
  ok((await gradeOne(lid, "fractions", true))?.correct === true, `loop warm-up answer ${i + 1} graded correct`);
}
const planBefore = await getAuthed(`/api/next?id=${lid}`, lid);
ok(planBefore.body.actions?.[0], "the learner has a recommendation before the session");

const opened = await post("/api/session", { action: "start", id: lid, conceptId: "fractions", kind: "PRACTISE", target: 3 });
ok(opened.status === 200 && opened.body.session?.target === 3 && opened.body.session?.asked === 0,
  "a session opens with a target and no activity");
ok(opened.body.session?.before?.mastery > 0, "its baseline carries what the engines already knew");
ok(opened.body.session?.complete === false, "a fresh session is not complete");
// The ledger holds the baseline the result is measured against: it must not
// cross the wire, or a client could edit the measurement it is judged by.
const noLeak = await getAuthed(`/api/profile?id=${lid}`, lid);
ok(!("learnSession" in (noLeak.body ?? {})), "the open session's baseline never reaches the client");
const midway = await getAuthed(`/api/session?id=${lid}`, lid);
ok(midway.status === 200 && midway.body.session?.asked === 0, "the open session is reportable");

ok((await gradeOne(lid, "fractions", false))?.correct === false, "an answer inside the session is graded wrong");
ok((await gradeOne(lid, "fractions", false))?.correct === false, "a second one likewise");
const counted = await getAuthed(`/api/session?id=${lid}`, lid);
ok(counted.body.session?.asked === 2 && counted.body.session?.correct === 0,
  "activity is counted server-side as answers are graded, not declared by the client");

const fin = await post("/api/session", { action: "finish", id: lid, conceptId: "fractions" });
const res = fin.body.result;
ok(fin.status === 200 && !!res, "the session closes with a result");
ok(res.activity.asked === 2 && res.activity.correct === 0, "the result carries the server's activity record");
ok(res.before.mastery === opened.body.session.before.mastery, "the 'before' column is the captured baseline");
ok(res.after.mastery < res.before.mastery,
  `the learner model moved down, not just the log (${res.before.mastery.toFixed(3)} → ${res.after.mastery.toFixed(3)})`);
ok(res.nextStepChanged === true, "the recommendation changed because of what was just done");
ok(typeof res.changeReason === "string" && res.changeReason !== "unchanged",
  `the result states why it moved (${res.changeReason})`);
ok(res.nextStep && res.nextStep.kind !== "TRANSFER",
  `the plan no longer offers a stretch on a concept just failed (${res.nextStep?.kind})`);
const planAfter = await getAuthed(`/api/next?id=${lid}`, lid);
const key = (a) => (a ? `${a.kind}:${a.conceptId}` : "none");
ok(key(planAfter.body.actions?.[0]) !== key(planBefore.body.actions?.[0]),
  `the next-step engine re-ran and changed its mind (${key(planBefore.body.actions?.[0])} → ${key(planAfter.body.actions?.[0])})`);

const afterProfile = await getAuthed(`/api/profile?id=${lid}`, lid);
ok(afterProfile.body.lastSession?.changeReason === res.changeReason,
  "the change is persisted on the profile, which is how Home shows it");
ok(!("learnSession" in afterProfile.body), "the finished ledger is cleared");
const summaryText = JSON.stringify(afterProfile.body.lastSession);
ok(!/"(title|reason|evidence)"/.test(summaryText),
  "the persisted summary is structural — a profile cannot freeze one language");
const again = await post("/api/session", { action: "finish", id: lid, conceptId: "fractions" });
ok(again.status === 409, "finishing with no baseline is refused rather than fabricated");

// Transfer, end to end: the staged intent is the server's, and the credit
// lands in the session's own record. linear-equations is used because its
// prompts are genuine equations, which is what the re-framing surfaces need.
await post("/api/session", { action: "start", id: lid, conceptId: "linear-equations", kind: "TRANSFER", target: 3 });
const ts = await post("/api/progress", { action: "serve", id: lid, conceptId: "linear-equations", intent: "transfer", reveal: true });
ok(ts.status === 200 && ts.body.question, "a transfer question is served");
const ta = await post("/api/progress", { action: "answer", id: lid, conceptId: "linear-equations", questionId: ts.body.question.id, choiceIndex: ts.body.question.answer });
ok(ta.status === 200 && ta.body.correct === true, "it is answered correctly");
const tf = await post("/api/session", { action: "finish", id: lid, conceptId: "linear-equations" });
ok(tf.status === 200 && tf.body.result?.activity?.transferAsked === 1,
  "the transfer question is counted as transfer activity in the session");
ok(tf.body.result?.proof?.transfer === true,
  "and it is recorded as transfer proof, not as more of the same");
ok(tf.body.result?.activity?.hints === 0, "with no hints, so independence is intact");

// ── 4b. Practice difficulty follows the learner's own record ────────────────
// The claim a student can feel: the question they get is chosen from what they
// have DONE, not from a fixed setting. Driven end to end — serve, answer, serve
// — through the same grading door the UI uses, on two learners who differ only
// in how their answers went, plus a third who has done nothing, so "adapts to
// you" cannot be confused with "leaks between learners".
const bandOf = (d) => (d < 0.3 ? 1 : d < 0.45 ? 2 : d < 0.6 ? 3 : d < 0.8 ? 4 : 5);
const CONCEPT = "percentages";
const answerOnce = async (who, correct, log) => {
  const s = await post("/api/progress", { action: "serve", id: who, conceptId: CONCEPT, reveal: true });
  if (s.status !== 200) return null;
  const q = s.body.question;
  log?.push({ difficulty: q.difficulty, target: s.body.target });
  const idx = correct ? q.answer : (q.answer + 1) % q.choices.length;
  const r = await post("/api/progress", { action: "answer", id: who, conceptId: CONCEPT, questionId: q.id, choiceIndex: idx });
  return r.status === 200 ? { served: s.body, graded: r.body } : null;
};

await post("/api/session", { action: "start", id: lid, conceptId: CONCEPT, kind: "PRACTISE", target: 5 });
const climbLog = [];
const firstServe = await answerOnce(lid, true, climbLog);
ok(firstServe?.graded?.correct === true, "the ramp journey starts with a correct answer");
ok(firstServe?.served?.target?.reason === "fresh",
  `a concept with no answers is served at the course tier (reason ${firstServe?.served?.target?.reason})`);
ok(bandOf(firstServe.served.question.difficulty) === firstServe.served.target.band,
  `and the band in the payload describes the item actually served (${firstServe.served.target.band} for difficulty ${firstServe.served.question.difficulty})`);
for (let i = 0; i < 3; i++) await answerOnce(lid, true, climbLog);
const last = climbLog[climbLog.length - 1];
ok(last.target?.reason === "stretch",
  `a run of correct answers raises the aim (reason ${last.target?.reason}, tier ${last.target?.tier ?? firstServe.served.target.tier} → ${last.difficulty})`);
// The hard claim is about the ITEM, not the label: an item that is genuinely
// harder than the first one. (The band can legitimately hold when the tier
// already sits inside the band the concept's deeper items land in — what must
// never happen is the band falling while the reason says "stretch".)
const firstDifficulty = firstServe.served.question.difficulty;
ok(last.difficulty > firstDifficulty + 0.02,
  `and the questions really got harder, not just the label (difficulty ${Number(firstDifficulty).toFixed(2)} → ${Number(last.difficulty).toFixed(2)})`);
ok(bandOf(last.difficulty) >= firstServe.served.target.band,
  `the served band never falls as the ramp rises (band ${firstServe.served.target.band} → ${bandOf(last.difficulty)})`);
ok(last.target.band === bandOf(last.difficulty),
  "the reason shown still describes the served item, not the target it aimed at");

// A learner who is struggling gets a lower rung AND support — not more of what
// is not working.
const struggler = await newProfile({ handle: "e2e_struggler", country: "GB", language: "en", birthYear: 2010, subjects: ["maths"] });
const strugglerId = struggler.body.profile.id;
await post("/api/session", { action: "start", id: strugglerId, conceptId: CONCEPT, kind: "PRACTISE", target: 5 });
const strugglerFirst = await answerOnce(strugglerId, false);
for (let i = 0; i < 2; i++) await answerOnce(strugglerId, false);
const repairServe = await post("/api/progress", { action: "serve", id: strugglerId, conceptId: CONCEPT, reveal: true });
ok(repairServe.body.target?.reason === "repair" && repairServe.body.target?.scaffold === true,
  `a learner getting them wrong is eased down and offered support (reason ${repairServe.body.target?.reason}, scaffold ${repairServe.body.target?.scaffold})`);
ok(bandOf(repairServe.body.question.difficulty) < bandOf(last.difficulty),
  `and the difficulty falls rather than rising (band ${bandOf(repairServe.body.question.difficulty)} < ${bandOf(last.difficulty)})`);

// …and a FRESH learner is unaffected by either of them. Compared against the
// struggler's FIRST serve, because the tier is the learner's own (a different
// curriculum level starts somewhere else on purpose) — what must not transfer
// is the other learner's rung.
const untouched = await newProfile({ handle: "e2e_untouched", country: "GB", language: "en", birthYear: 2010, subjects: ["maths"] });
const untouchedServe = await post("/api/progress", { action: "serve", id: untouched.body.profile.id, conceptId: CONCEPT, reveal: true });
ok(untouchedServe.body.target?.reason === "fresh" && untouchedServe.body.target?.band === strugglerFirst.served.target.band,
  `a learner with no answers on the concept starts at the tier, not at anyone else's rung (${untouchedServe.body.target?.reason}, band ${untouchedServe.body.target?.band} vs the struggler's fresh ${strugglerFirst.served.target.band})`);
ok(bandOf(untouchedServe.body.question.difficulty) > bandOf(repairServe.body.question.difficulty),
  `and above the struggling learner's eased rung (band ${bandOf(untouchedServe.body.question.difficulty)} > ${bandOf(repairServe.body.question.difficulty)})`);

// A transfer request is not an adaptive-rung decision, so it carries no reason:
// a surface must not be able to label a stretch as "because you got three right".
const transferTarget = await post("/api/progress", { action: "serve", id: lid, conceptId: "linear-equations", intent: "transfer", reveal: true });
ok(transferTarget.body.target === null,
  "a transfer serve carries no practice target, so a stretch is never shown as an adaptive rung");

// 5. Diagnostic lifecycle — server grades; the client never declares correctness
const d0 = await post("/api/diagnostic", { id: pid, subject: "maths", action: "start" });
ok(d0.status === 200 && d0.body.question && !("answer" in d0.body.question), "diagnostic question served without answer fields");
// restart with the reveal test hook for the state-building loop
const d1 = await post("/api/diagnostic", { id: pid, subject: "maths", action: "start", reveal: true });
ok(d1.status === 200 && d1.body.question, "diagnostic started with a question");
let cur = d1.body, guard = 0;
let sawCorrect = false, sawWrong = false, accepted = 0, rejected = 0;
while (cur.question && guard++ < 60) {
  const isRight = guard % 2 === 0;
  const chosen = isRight ? cur.question.answer : (cur.question.answer + 1) % cur.question.choices.length;
  const r = await post("/api/diagnostic", {
    id: pid, subject: "maths", action: "answer", reveal: true,
    questionId: cur.question.id, chosen,
  });
  if (r.status === 200) {
    accepted++;
    if (r.body.correct === true) sawCorrect = true;
    if (r.body.correct === false) sawWrong = true;
    ok(r.body.explanation?.length > 10, `server returned explanation (#${guard})`);
    cur = { question: r.body.next };
  } else {
    rejected++;
    break;
  }
}
ok(accepted >= 6, `diagnostic session ran (${accepted} answers accepted)`);
ok(rejected === 0, "no answers rejected during the session");
ok(sawCorrect && sawWrong, "server graded both correct and incorrect answers itself");
// stale-question protection: a replayed answer must be refused
const stale = await post("/api/diagnostic", { id: pid, subject: "maths", action: "answer", questionId: "stale:replay", chosen: 0 });ok(stale.status === 400, "stale/replayed answer rejected");
const dFin = await post("/api/diagnostic", { id: pid, subject: "maths", action: "finish" });
ok(dFin.status === 200 && dFin.body.result?.scores?.length > 0, "diagnostic finished with scores");
ok(dFin.body.result.misconceptions !== undefined, "result carries misconception analysis");

// 5b. Audit P0-A: the diagnostic initialized the learner model. A fresh
// profile runs ONLY a diagnostic — no practice — so any progress on the probed
// concepts can have come from the diagnostic fold alone. The next-step engine
// reads state.progress; a report-only diagnostic would leave it empty.
{
  const dProf = await newProfile({ handle: "diag_only_e2e", country: "KE", language: "en" });
  const dPid = dProf.body.profile.id;
  const dStart = await post("/api/diagnostic", { id: dPid, subject: "maths", action: "start", kind: "baseline", reveal: true });
  ok(dStart.status === 200 && dStart.body.question, "diagnostic-only profile started a baseline");
  let curD = dStart.body, guardD = 0;
  while (curD.question && guardD++ < 40) {
    const rD = await post("/api/diagnostic", {
      id: dPid, subject: "maths", action: "answer", reveal: true,
      questionId: curD.question.id, chosen: curD.question.answer,
    });
    if (rD.status !== 200) break;
    curD = { question: rD.body.next };
  }
  const dRes = await post("/api/diagnostic", { id: dPid, subject: "maths", action: "finish" });
  const probedIds = (dRes.body.result?.scores ?? []).filter((s) => s.asked > 0).map((s) => s.conceptId);
  ok(probedIds.length > 0, "diagnostic probed at least one concept");
  const snapD = await getAuthed(`/api/progress?id=${dPid}&subject=maths`, dPid);
  const seeded = probedIds.filter((cid) => (snapD.body.progress?.[cid]?.attempts ?? 0) > 0);
  ok(seeded.length === probedIds.length, `diagnostic evidence reached the learner model (${seeded.length}/${probedIds.length})`);
}

// 5c. Audit P0-B: a baseline run walks the subject's fixed anchors.
{
  const dBase = await post("/api/diagnostic", { id: pid, subject: "maths", action: "start", kind: "baseline", reveal: true });
  ok(dBase.status === 200 && dBase.body.question, "baseline diagnostic started");
  const cids = new Set();
  let curB = dBase.body, guardB = 0;
  while (curB.question && guardB++ < 40) {
    cids.add(curB.conceptId || curB.question.conceptId);
    const rB = await post("/api/diagnostic", {
      id: pid, subject: "maths", action: "answer", reveal: true,
      questionId: curB.question.id, chosen: curB.question.answer,
    });
    if (rB.status !== 200) break;
    curB = { question: rB.body.next };
  }
  ok(cids.size >= 3, `baseline walked multiple anchor concepts (${cids.size})`);
  const dBaseFin = await post("/api/diagnostic", { id: pid, subject: "maths", action: "finish" });
  ok(dBaseFin.status === 200 && dBaseFin.body.result?.kind === "baseline", "result records the benchmark kind");

  // ── The diagnostic is a MEASUREMENT, and two things make that true:
  // a probe is spent once served, and the result reports demand level rather
  // than only topics.
  const res = dBaseFin.body.result;
  ok(Array.isArray(res.skills) && res.skills.length === 5, "the result reports all five demand levels");
  const measured = (res.skills ?? []).filter((s) => s.estimate?.measured);
  ok(measured.length >= 1, `the probes are attributed to a demand level (${measured.map((s) => s.skill).join(",")})`);
  ok(measured.every((s) => s.estimate.value !== null), "a measured level carries a number");
  ok((res.skills ?? []).filter((s) => !s.estimate?.measured).every((s) => s.estimate.value === null),
    "an unmeasured level is null, never 0 — 'not yet measured' is not 'failed'");
  // A percentage without a confidence is an over-claim: 2/2 and 6/6 are the
  // same number and not the same evidence.
  ok(measured.every((s) => ["low", "medium", "high"].includes(s.estimate.confidence)),
    `every measured level reports how much its number is worth (${measured.map((s) => `${s.skill}:${s.estimate.confidence}`).join(", ")})`);
  ok(measured.every((s) => Array.isArray(s.estimate.interval) && s.estimate.interval.length === 2),
    "and the interval behind it");
  ok(measured.every((s) => s.estimate.sources?.includes("openmind_authored")),
    "with the source of the items it rests on, so authored work can never read as board material");
  ok((res.skills ?? []).find((s) => s.skill === "extended_response")?.inBank === false,
    "extended written response is reported as beyond what this bank can measure");
  // The depth layer (lib/questions-deep.ts) moved this band INSIDE the
  // instrument, so the honest assertion is no longer "declared beyond the bank"
  // but "declared in, reachable by this sitting, and actually measured" — the
  // three are different claims and the report has to hold all of them.
  const dataRow = (res.skills ?? []).find((s) => s.skill === "data_interpretation");
  ok(dataRow?.inBank === true && dataRow?.reachable === true && dataRow?.estimate?.measured === true,
    `and data & graphs is inside the instrument, reachable and measured by a full baseline (${dataRow?.estimate?.correct}/${dataRow?.estimate?.attempts} at ${dataRow?.estimate?.confidence} confidence)`);
  // Every band this COURSE's questions can reach is measured by a full
  // baseline: without the depth-cover in the blueprint sample, multi-step read
  // "not measured" for every learner in the world, forever. And an unmeasured
  // band always states WHY, so an empty row is never read as a gap in the
  // learner.
  const reachable = (res.skills ?? []).filter((s) => s.inBank && s.reachable);
  ok(reachable.length >= 2, `this course's questions reach at least two demand bands (${reachable.map((s) => s.skill).join(", ")})`);
  ok(reachable.every((s) => s.estimate.measured),
    `a full baseline measures every band this course can reach (missing: ${reachable.filter((s) => !s.estimate.measured).map((s) => s.skill).join(", ") || "none"})`);
  ok((res.skills ?? []).every((s) => s.estimate.measured || !s.inBank || !s.reachable),
    `an unmeasured band always says why (${(res.skills ?? []).filter((s) => !s.estimate.measured).map((s) => `${s.skill}:${s.inBank ? (s.reachable ? "reachable" : "beyond-course") : "beyond-instrument"}`).join(", ")})`);

  const spent = (await getAuthed(`/api/profile?id=${pid}`, pid)).body;
  const ledger = spent.seenQuestions ?? {};
  const spentIds = Object.keys(ledger);
  ok(spentIds.length > 0, `every probe served is recorded as spent (${spentIds.length})`);
  ok(spentIds.every((id) => /^[a-z0-9-]+:d\d+:.+$/.test(id)),
    `the ledger holds probe ids in the item-id form (${spentIds[0]})"`);
  // Starting a second baseline samples the SAME concepts — the blueprint is
  // deterministic in (spec, subject), which is what makes a later retest
  // comparable with this one.
  const dAgain = await post("/api/diagnostic", { id: pid, subject: "maths", action: "start", kind: "baseline", reveal: true });
  ok(dAgain.status === 200 && cids.has(dAgain.body.conceptId),
    `a repeated baseline samples the same concepts (${dAgain.body.conceptId} vs ${[...cids].join("/")})`);
  await post("/api/diagnostic", { id: pid, subject: "maths", action: "skip" });
  await post("/api/diagnostic", { id: pid, subject: "maths", action: "finish" });
}

// 5d. THE PROOF, over HTTP: a diagnostic changes what the app tells the learner
//     to do, and a LATER INDEPENDENT SITTING measures whether the change was
//     real. The engines prove the logic (`npm run verify` ▸ THE PROOF); this
//     proves the wiring — store, routes, learner model and decision engine
//     actually carry it, and that nothing moves when nothing happened.
{
  const pf = await newProfile({ handle: "proof_http", country: "GB", language: "en", subjects: ["maths"] });
  const kid2 = pf.body.profile.id;
  ok(Boolean(kid2), "proof profile created");

  const sit = async (kind, wrongFor) => {
    const first = await post("/api/diagnostic", { id: kid2, subject: "maths", action: "start", kind, reveal: true });
    let cur = first.body;
    let guard = 0;
    const seen = new Set();
    const ids = {};
    while (cur.question && guard++ < 40) {
      const cid = cur.conceptId || cur.question.conceptId;
      seen.add(cid);
      (ids[cid] ??= []).push(cur.question.id);
      const wrong = wrongFor.includes(cid);
      const chosen = wrong ? (cur.question.answer + 1) % cur.question.choices.length : cur.question.answer;
      const r = await post("/api/diagnostic", {
        id: kid2, subject: "maths", action: "answer", reveal: true,
        questionId: cur.question.id, chosen,
      });
      if (r.status !== 200) break;
      cur = { question: r.body.next, conceptId: r.body.conceptId };
    }
    const fin = await post("/api/diagnostic", { id: kid2, subject: "maths", action: "finish" });
    return { result: fin.body.result, seen: [...seen], ids, asked: guard };
  };
  const nextNow = async () => (await getAuthed(`/api/next?id=${kid2}`, kid2)).body.actions;
  const k = (a) => `${a.kind}:${a.conceptId}`;

  // The learner sits the baseline: the concept they meet first is the one they
  // fail, every other concept they pass.
  const peek = await post("/api/diagnostic", { id: kid2, subject: "maths", action: "start", kind: "baseline", reveal: true });
  const WEAK = peek.body.conceptId;
  const b = await sit("baseline", [WEAK]);
  ok(b.seen.includes(WEAK) && b.seen.length >= 3, `baseline measured ${b.seen.length} concepts, including the one it will find weak`);

  const actionsA = await nextNow();
  const a1 = actionsA[0];
  ok(a1.conceptId === WEAK && ["EXPLAIN", "PRACTISE", "REMEDIATE"].includes(a1.kind),
    `the plan targets what the diagnostic found weak (${k(a1)})`);
  ok(typeof a1.why === "string" && a1.why.length > 0 && Array.isArray(a1.plan) && a1.plan.length > 0,
    "and says why now and how the session is shaped — not just what");
  const actionsA2 = await nextNow();
  ok(k(actionsA2[0]) === k(a1),
    "CONTROL: with no new evidence the plan does not move, so the change below is caused and not drift");

  // The learner works on it: hint-free answers through the real practice API.
  // Hints are the only thing that can buy guided credit, and the client cannot
  // claim them — so omitting them is what makes this INDEPENDENT evidence.
  let practised = 0;
  for (let i = 0; i < 6; i++) {
    const srv = await post("/api/progress", { action: "serve", id: kid2, conceptId: WEAK, reveal: true });
    const qp = srv.body.question;
    if (!qp) break;
    const ans = await post("/api/progress", { action: "answer", id: kid2, conceptId: WEAK, questionId: qp.id, choiceIndex: qp.answer });
    if (ans.status === 200) practised++;
  }
  ok(practised >= 4, `${practised} hint-free answers were graded server-side on the weak concept`);
  const snap = (await getAuthed(`/api/progress?id=${kid2}&subject=maths`, kid2)).body.progress?.[WEAK] ?? {};
  ok((snap.independent?.asked ?? 0) >= 4, `and recorded as independent evidence (${JSON.stringify(snap.independent ?? {})})`);

  const actionsB = await nextNow();
  const b1 = actionsB[0];
  ok(k(b1) !== k(a1), `the work changes the plan (${k(a1)} → ${k(b1)})`);
  ok(!(b1.conceptId === WEAK && ["EXPLAIN", "REMEDIATE"].includes(b1.kind)),
    `and it stops telling the learner to rebuild what they just proved (${k(b1)})`);

  // The independent sitting: same concepts, items never served before.
  const r = await sit("retest", []);
  ok(r.seen.length === b.seen.length && r.seen.every((c) => b.seen.includes(c)),
    `the retest samples the same concepts as the baseline (${r.seen.length} = ${b.seen.length})`);
  const baseIds = new Set(b.ids[WEAK] ?? []);
  ok((r.ids[WEAK] ?? []).length > 0 && (r.ids[WEAK] ?? []).every((id) => !baseIds.has(id)),
    "with items the learner had not been served — otherwise 'improved' would mean 'remembered'");
  const est = (result, skill) => (result.skills ?? []).find((s) => s.skill === skill)?.estimate;
  const worst = (b.result.skills ?? []).filter((s) => s.estimate.measured)
    .sort((x, y) => x.estimate.value - y.estimate.value)[0];
  const after = est(r.result, worst.skill);
  ok(after.measured && after.value > worst.estimate.value,
    `the independent sitting measures the repair on the same band (${worst.skill}: ${Math.round(worst.estimate.value * 100)}% → ${Math.round(after.value * 100)}%)`);
  ok((after.interval[1] - after.interval[0]) < (worst.estimate.interval[1] - worst.estimate.interval[0]),
    "and the claim is more precise, not merely higher");
  const actionsD = await nextNow();
  const d1 = actionsD[0];
  ok(!(d1.conceptId === WEAK && d1.kind === "EXPLAIN"),
    `after an independent confirmation the plan is not remediation (${k(d1)})`);
}

// 6. Tutor API (offline Socratic mode)
const tut = await post("/api/tutor", { conceptId: "quadratics", message: "I am stuck, give me the answer", language: "en" });
ok(tut.status === 200 && tut.body.reply.length > 40, "tutor replied");
// WHICH engine answered depends on how the deployment was configured — and the
// payload has to say so honestly either way (section 17 asserts the detail).
// What is configuration-independent is that a learner always gets an answer.
ok(tut.body.answerSource === "ai"
  ? tut.body.mode === "ai" && tut.body.labelKey === "tutor.aiNote"
  : tut.body.mode === "socratic" && ["tutor.offlineNote", "tutor.fallbackNote"].includes(tut.body.labelKey),
  `the tutor discloses which engine answered (${tut.body.answerSource}/${tut.body.mode}/${tut.body.labelKey})`);
ok(!/the answer is/i.test(tut.body.reply), "tutor refuses to hand over the answer");

// 7. Rooms lifecycle: create → join → message (tutor reply) → fork
const room = await post("/api/rooms", { action: "create", name: "GCSE Physics", subject: "physics", language: "en", handle: "amina_k" });
ok(room.status === 200 && room.body.room?.id, "room created");
const rid = room.body.room.id;
const join = await post("/api/rooms", { action: "join", id: rid, handle: "kip" });
ok(join.status === 200 && join.body.room.members.includes("kip"), "second student joined");
const msg = await post("/api/rooms", { action: "message", id: rid, handle: "kip", text: "why does the ball accelerate?" });
ok(msg.status === 200 && msg.body.room.messages.length === 1, "message stored");
const first = msg.body.room.messages[0];
ok(first.tutorReply?.includes("?"), "Socratic tutor replied with a question");
// THE FOCUS a room has — not one invented for it. This room is Physics with no
// concept set, and it used to be taught `linear-equations` (the fallback was a
// maths concept), so a physics question was answered with balance scales.
ok(first.tutorFocus === null,
  `a room with no declared concept does not invent one (focus ${JSON.stringify(first.tutorFocus)})`);
ok(!/balance scale|3x|denominator/i.test(first.tutorReply),
  "and it answers nothing from another subject: no algebra in a physics room");
ok(/Physics/.test(first.tutorReply) && /\?/.test(first.tutorReply),
  `it names the room's own subject and asks which idea is meant (${first.tutorReply.slice(0, 70)}…)`);
// WHO answered is stored with the reply, so the room can disclose it and a
// fallback can never be read as a model's answer.
{
  const aiOn = (await call("/api/ai")).body?.enabled === true;
  ok(typeof first.tutorSource === "string" && first.tutorLabelKey === "tutor.offlineNote",
    `the reply carries its provenance (${first.tutorSource}/${first.tutorLabelKey}) — a room with no focus is answered by the offline tutor, whatever the deployment has configured`);
  const named = await post("/api/rooms", { action: "message", id: rid, handle: "kip", text: "I am stuck on momentum" });
  const namedMsg = named.body.room.messages[1];
  ok(namedMsg.tutorFocus === "momentum",
    `a message naming an idea in the room's own subject resolves to it (${namedMsg.tutorFocus})`);
  ok(namedMsg.tutorLabelKey === (aiOn ? "tutor.aiNote" : "tutor.offlineNote"),
    `and the disclosure matches who actually answered (${namedMsg.tutorLabelKey}, ai configured: ${aiOn})`);
  if (aiOn) {
    ok(/STUB-AI-REPLY/.test(namedMsg.tutorReply),
      "with a model configured, a ROOM's turn reaches it — the room used to call the offline engine directly and never ask");
  } else {
    ok(namedMsg.tutorReply?.includes("?") && namedMsg.tutorSource === "offline",
      "with no model configured the room answers from the offline tutor, in the room's language");
  }
  const cross = await post("/api/rooms", { action: "message", id: rid, handle: "kip", text: "I am stuck on fractions and denominators" });
  const crossMsg = cross.body.room.messages[2];
  ok(crossMsg.tutorFocus === null,
    "an idea from another subject is not read as this room's focus — a physics room stays physics");
}
const fork = await post("/api/rooms", { action: "fork", id: rid, handle: "zuri" });
ok(fork.status === 200 && fork.body.room.forkOf === rid && fork.body.room.messages.length === 0, "room forked cleanly");
const roomsList = await call("/api/rooms");
ok(roomsList.status === 200 && roomsList.body.rooms.length >= 2, "rooms listed");

// 8. Classes lifecycle: create → join by code → LEARN → live roster → report
// Every action presents the CALLER's capability (a class carries its learners'
// handles, their mastery and its join code — see section 18). The roster the
// teacher reads is DERIVED SERVER-SIDE from each member's evidence ledger: the
// same projection the learner's own pages read, not a number the client sent.
let stranger; // (filled in §8, reused by §9.5's non-member assertion)
const cls = await post("/api/classes", { id: pid, action: "create", name: "Class 9A — Mathematics" });
ok(cls.status === 200 && /^[A-Z2-9]{6}$/.test(cls.body.cls.joinCode), `class created with join code (${cls.body.cls.joinCode})`);
const code = cls.body.cls.joinCode;
const cj = await post("/api/classes", { id: pid, action: "join", joinCode: code, handle: "amina_k" });
ok(cj.status === 200 && cj.body.cls.students["amina_k"], "teacher joined their own class by code");
ok((await post("/api/classes", { action: "join", joinCode: code, handle: "ghost" })).status === 400, "joining with NO identity is refused outright");

// A second learner joins — the student flow — and does REAL work on the real
// grading path, so the live roster has something true to show.
const stu = await newProfile({ handle: "bk_2009", country: "KE", language: "en", subjects: ["maths"] });
const sid = stu.body.profile.id;
ok((await post("/api/classes", { id: sid, action: "join", joinCode: code, handle: "bk_2009" })).status === 200, "student joined by code");
for (let i = 0; i < 4; i++) ok((await gradeOne(sid, "fractions", true))?.correct === true, `class student fractions answer ${i + 1} graded correct`);
for (let i = 0; i < 2; i++) ok((await gradeOne(sid, "linear-equations", false)) !== null, `class student linear-equations answer ${i + 1} recorded`);

// Three doors on the same class: two members, one authenticated stranger.
const roster = await getAuthed(`/api/classes?me=${sid}&id=${cls.body.cls.id}`, sid);
ok(roster.status === 200, "a member reads the roster with their own capability");
const rosterT = await getAuthed(`/api/classes?me=${pid}&id=${cls.body.cls.id}`, pid);
ok(rosterT.status === 200, "so does the class's creator");
stranger = await newProfile({ handle: "stranger_p", country: "GB" });
ok(stranger.status === 200 && !!stranger.body.profile?.id, "an authenticated stranger exists for the refusal tests");
// (raw call, not post(): post() auto-presents the profile's REAL secret, and
// this assertion exists to prove the door refuses a WRONG one)
ok((await call("/api/classes", json({ id: stranger.body.profile.id, action: "join", joinCode: code, handle: "ghost", secret: "not-the-secret" }))).status === 401, "joining with a WRONG secret is refused the way every door refuses it");
const rosterX = await getAuthed(`/api/classes?me=${stranger.body.profile.id}&id=${cls.body.cls.id}`, stranger.body.profile.id);
ok(rosterX.status === 403 && rosterX.body.error === "not a member", "an authenticated NON-member is refused — 403, not the roster");
const rosterAnon = await call(`/api/classes?id=${cls.body.cls.id}&me=${pid}`);
ok(rosterAnon.status === 401, "and without a secret the class answers nothing");

// The live view: the projection talking, with what it was computed from named.
const lm = roster.body.cls.live?.["bk_2009"];
ok(!!lm && lm.learnerId === sid, "the live roster names the member's learner id");
ok(lm?.projectionVersion === 2, `and stamps the projection version that produced it (v${lm?.projectionVersion})`);
ok(lm?.concepts?.fractions?.asked === 4 && lm?.concepts?.fractions?.correct === 4,
  `fractions measured 4/4 independent (${JSON.stringify(lm?.concepts?.fractions)})`);
ok(lm?.concepts?.["linear-equations"]?.asked === 2 && lm?.concepts?.["linear-equations"]?.correct === 0,
  "linear-equations measured 0/2 — the weak concept the plan must find");
ok(lm?.weakest?.conceptId === "linear-equations", `the weakest MEASURED concept is named (${lm?.weakest?.conceptId})`);
ok(lm?.answers === 6, `the member's ledger holds exactly their graded answers (${lm?.answers})`);
ok(!("quadratics" in (lm?.concepts ?? {})), "a concept the member never answered is ABSENT from the live view — unmeasured, never 0");

// A client can still flatter itself in the stored report — and it changes
// nothing the teacher reads, because the table is the projection.
const flatter = await post("/api/classes", { id: sid, action: "report", joinCode: code, handle: "bk_2009", conceptMastery: { fractions: 0.99, "linear-equations": 0.99, quadratics: 0.99 } });
ok(flatter.status === 200, "a self-report is accepted (the fallback channel)");
const live2 = await getAuthed(`/api/classes?me=${sid}&id=${cls.body.cls.id}`, sid);
const lm2 = live2.body.cls.live?.["bk_2009"];
ok(lm2?.concepts?.fractions?.rate === 1 && lm2?.concepts?.["linear-equations"]?.rate === 0 && !("quadratics" in (lm2?.concepts ?? {})),
  "but the live view is UNCHANGED by it — the projection decides what the teacher sees");
ok(live2.body.cls.students["bk_2009"]?.quadratics === 0.99, "while the stored self-report is kept for what it is: a claim");

// 8b. The wedge: question → concept match → server-graded prove-it
const wedge = await post("/api/match", { text: "Solve 3x + 5 = 20" });
ok(wedge.status === 200 && wedge.body.match?.conceptId === "linear-equations", `wedge matches linear-equations (got ${wedge.body.match?.conceptId})`);
ok(wedge.body.match?.confident === true, "wedge is confident on a clear question");
const wedgeJunk = await post("/api/match", { text: "asdf qwerty zzz" });
ok(wedgeJunk.status === 200 && !(wedgeJunk.body.match?.confident), "wedge refuses to fake confidence on gibberish");
const wedgeAnon = await newProfile({ handle: "anon", country: "XX", language: "sw" });
ok(wedgeAnon.status === 200 && wedgeAnon.body.profile?.id, "anonymous wedge profile created (no onboarding fields)");
const wedgeServe = await post("/api/progress", { action: "serve", id: wedgeAnon.body.profile.id, conceptId: "linear-equations" });
ok(wedgeServe.status === 200 && wedgeServe.body.question?.choices?.length === 4 && !("answer" in wedgeServe.body.question), "wedge serve: no answer fields");
const wedgeAns = await post("/api/progress", { action: "answer", id: wedgeAnon.body.profile.id, conceptId: "linear-equations", questionId: wedgeServe.body.question.id, choiceIndex: 1 });
ok(wedgeAns.status === 200 && typeof wedgeAns.body.correct === "boolean", "wedge answer graded server-side");

// 9.5 Teacher network: plan determinism + offline pack export
// The class from section 8 has REAL measured evidence now (§8 drove answers
// through the grading path); the plan must reflect what was measured — not
// the self-report the same section deliberately planted. The pack carries the
// answer key, so it answers members only.
const packBase = `/api/pack-export?id=${cls.body.cls.id}`;
const packNoAuth = await call(`${packBase}&format=json`);
ok(packNoAuth.status === 400, "the offline pack (with its answer key) answers nothing to a caller with no identity");
const packWrong = await getAuthed(`${packBase}&me=${stranger.body.profile.id}&format=json`, stranger.body.profile.id);
ok(packWrong.status === 403, "and a non-member gets the same refusal the roster gives");
// (raw fetch: the HTML body must be read as TEXT, and the capability rides in
// the URL exactly as the teacher page's own download links carry it)
const planHtml = await fetch(`${BASE}${packBase}&me=${pid}&format=html&secret=${encodeURIComponent(SECRETS.get(pid) ?? "")}`);
const planText = await planHtml.text();
ok(planHtml.status === 200 && planHtml.headers.get("content-type").includes("text/html"), "pack export: printable HTML responds for a member");
ok(planText.includes("Linear equations"), "pack focuses the class's MEASURED weak concept (linear-equations)");
ok((planText.match(/Linear equations/g) ?? []).length >= 2, "weak concept appears in the week plan AND the lessons section");
// Separate answer key section — never inline with the questions.
ok(/class="key"/.test(planText), "answer key is its own section (print-split)");
ok(planText.includes('dir="rtl"') === /lang="(ar|ur|fa)"/.test(planText), "RTL flag matches class language");
const planJson = (await getAuthed(`${packBase}&me=${pid}&format=json`, pid)).body;
ok(Array.isArray(planJson.bank) && planJson.bank.length === 5, "pack JSON: five days");
ok(planJson.bank.every((d) => d.questions.length >= 3), "pack JSON: every day has a question bank");
ok(planJson.plan.focus.includes("linear-equations"), "pack JSON: plan focuses the weak concept");
ok(planJson.plan.days.every((d) => d.seeds.length >= 3), "pack JSON: days carry deterministic seeds");
// No answer leak in the JSON question bank — answers live in the answer field, questions standalone.
ok(planJson.bank.every((d) => d.questions.every((q) => typeof q.prompt === "string" && Array.isArray(q.choices))), "pack JSON: questions are self-contained (prompt + choices)");

// 9.6 Micro-diagnostic: repeated hits flare, the probe classifies honestly.
// Two students are driven into the neg-slip window on neg-sub questions
// (answers known via the dev-only reveal hook), then the probe is graded
// right (procedural) and wrong (conceptual + walk-through).
async function driveFlare(handle) {
  const prof = await newProfile({ handle, country: "KE", language: "en" });
  if (prof.status !== 200) return { prof: null, flare: null };
  const pid = prof.body.profile.id;
  let flare = null;
  for (let n = 0; n < 6 && !flare; n++) {
    const s = await post("/api/progress", { action: "serve", id: pid, conceptId: "negatives", reveal: true });
    if (s.status !== 200 || !s.body.question) break;
    const q = s.body.question;
    const wrong = (q.answer + 1) % q.choices.length;
    const a = await post("/api/progress", { action: "answer", id: pid, conceptId: "negatives", questionId: q.id, choiceIndex: wrong, reveal: true });
    flare = a.body?.flare ?? null;
  }
  return { prof, pid, flare };
}
const m1 = await driveFlare("micro_p");
ok(!!m1.flare && m1.flare.misconceptionId && typeof m1.flare.name === "string", "repeated hits flare a named misconception");
ok(m1.flare?.check && !("answer" in m1.flare.check.question) && typeof m1.flare.check.question.answerIndex === "number", "probe served answer-free; answerIndex only via the dev test hook");
const mGrade = await post("/api/progress", { action: "micro", id: m1.pid, conceptId: "negatives", misconceptionId: m1.flare.misconceptionId, questionId: m1.flare.check.question.id, choiceIndex: m1.flare.check.question.answerIndex });
ok(mGrade.status === 200 && mGrade.body.status === "procedural", "passed micro-check classifies procedural");
ok(mGrade.body.hint === undefined, "passed check carries no walk-through");
const mAgain = await post("/api/progress", { action: "micro", id: m1.pid, conceptId: "negatives", misconceptionId: m1.flare.misconceptionId, questionId: m1.flare.check.question.id, choiceIndex: m1.flare.check.question.answerIndex });
ok(mAgain.status === 400, "answered flare cannot be re-graded");
const m2 = await driveFlare("micro_c");
ok(!!m2.flare?.check, "second student's flare carries the probe");
const mWrong = await post("/api/progress", { action: "micro", id: m2.pid, conceptId: "negatives", misconceptionId: m2.flare.misconceptionId, questionId: m2.flare.check.question.id, choiceIndex: (m2.flare.check.question.answerIndex + 1) % 4 });
ok(mWrong.status === 200 && mWrong.body.status === "conceptual", "failed micro-check classifies conceptual");
ok(typeof mWrong.body.hint?.text === "string" && mWrong.body.hint.text.length > 0, "failed check carries the walk-through");

// 9.7 Starter Mode: the four-step initiation scaffold on a live served
// question — the bridge step is served answer-free, a wrong pick still
// completes with the true connector + first move, the right pick grades true.
{
  const prof = await newProfile({ handle: "starter_e2e", country: "KE", language: "en" });
  ok(prof.status === 200, "starter profile created");
  const pid = prof.body.profile.id;
  const sv = await post("/api/progress", { action: "serve", id: pid, conceptId: "linear-equations", reveal: true });
  ok(sv.status === 200 && !!sv.body.question, "question served for the starter flow");
  const sq = sv.body.question;
  const st = await post("/api/progress", { action: "starter", id: pid, conceptId: "linear-equations", questionId: sq.id });
  ok(st.status === 200 && st.body.step === 1 && Array.isArray(st.body.choices) && st.body.choices.length === 3, "starter flow opens at the goal step with connectors staged (reflection first, never the bridge)");
  ok(st.body.choices.includes("Linear equations"), "the real connector is among the served choices");
  ok(!("answerIndex" in st.body), "bridge step is served answer-free");
  const wrongIdx = st.body.choices.findIndex((t) => t !== "Linear equations");
  const pickW = await post("/api/progress", { action: "starterPick", id: pid, conceptId: "linear-equations", questionId: sq.id, choiceIndex: wrongIdx });
  ok(pickW.status === 200 && pickW.body.done === true && pickW.body.correct === false, "a wrong bridge pick still completes the flow");
  ok(pickW.body.connectorTitle === "Linear equations" && typeof pickW.body.firstMoveText === "string" && pickW.body.firstMoveText.length > 0, "the reveal names the real connector and hands over the first move");
  const again = await post("/api/progress", { action: "starterPick", id: pid, conceptId: "linear-equations", questionId: sq.id, choiceIndex: wrongIdx });
  ok(again.status === 400, "a completed starter flow cannot be re-graded");
  // Fresh profile for the correct-pick path.
  const prof2 = await newProfile({ handle: "starter_e2e_ok", country: "KE", language: "en" });
  const pid2 = prof2.body.profile.id;
  const sv2 = await post("/api/progress", { action: "serve", id: pid2, conceptId: "linear-equations", reveal: true });
  const st2 = await post("/api/progress", { action: "starter", id: pid2, conceptId: "linear-equations", questionId: sv2.body.question.id });
  const rightIdx = st2.body.choices.indexOf("Linear equations");
  const pickR = await post("/api/progress", { action: "starterPick", id: pid2, conceptId: "linear-equations", questionId: sv2.body.question.id, choiceIndex: rightIdx });
  ok(pickR.status === 200 && pickR.body.correct === true, "the correct bridge pick grades true");
  // Learner-model trace: asking for the scaffold + picking the bridge records.
  const snap = await getAuthed(`/api/progress?id=${pid2}&subject=maths`, pid2);
  const snapBody = snap.body;
  const stRec = snapBody.progress?.["linear-equations"]?.starter;
  ok(stRec && stRec.asked >= 1 && stRec.correct >= 1, "starter usage is recorded in the learner model");
}

// 10b. Server-side attribution (audit P0-B/§29): the client cannot buy
// independence or transfer credit by asserting metadata.
{
  // a) A hinted answer must NOT count as independence, no matter what the
  //    client claimed — a fresh profile isolates this assertion.
  const prof3 = await newProfile({ handle: "attrib_hint_e2e", country: "KE", language: "en" });
  const pid3 = prof3.body.profile.id;
  const svA = await post("/api/progress", { action: "serve", id: pid3, conceptId: "fractions", reveal: true });
  await post("/api/progress", { action: "hint", id: pid3, conceptId: "fractions", questionId: svA.body.question.id, level: 2 });
  await post("/api/progress", { action: "answer", id: pid3, conceptId: "fractions", questionId: svA.body.question.id, choiceIndex: svA.body.question.answer });
  const snap3 = (await getAuthed(`/api/progress?id=${pid3}&subject=maths`, pid3)).body;
  const pr3 = snap3.progress?.fractions ?? {};
  ok(!pr3.independent?.asked, `hinted answer bought no independence (${JSON.stringify(pr3.independent ?? null)})`);
  // b) Staged transfer on a second profile: the serve intent attributes the
  //    grading as transfer — but only when the served surface is genuinely
  //    different (story/inverse re-framing, audit P0-D). Credit-claiming
  //    answer fields are ignored either way.
  const prof4 = await newProfile({ handle: "attrib_transfer_e2e", country: "KE", language: "en" });
  const pid4 = prof4.body.profile.id;
  const smuggle = await post("/api/progress", { action: "serve", id: pid4, conceptId: "fractions", reveal: true });
  await post("/api/progress", {
    action: "answer", id: pid4, conceptId: "fractions", questionId: smuggle.body.question.id,
    choiceIndex: smuggle.body.question.answer, mode: "transfer", hints: 0,
  });
  const snap4s = (await getAuthed(`/api/progress?id=${pid4}&subject=maths`, pid4)).body;
  ok(!(snap4s.progress?.fractions?.transfer?.asked), "client-declared transfer mode bought no credit");
  // A transfer serve on a concept whose prompt is NOT a re-frameable equation
  // falls back to a direct re-draw — and a direct re-draw must never buy
  // transfer credit (audit P0-D honesty).
  const svD = await post("/api/progress", { action: "serve", id: pid4, conceptId: "fractions", intent: "transfer", reveal: true });
  await post("/api/progress", { action: "answer", id: pid4, conceptId: "fractions", questionId: svD.body.question.id, choiceIndex: svD.body.question.answer });
  const snap4d = (await getAuthed(`/api/progress?id=${pid4}&subject=maths`, pid4)).body;
  ok(!(snap4d.progress?.fractions?.transfer?.asked), "direct (same-surface) re-draw granted no transfer credit");
  // A transfer serve on a linear-equation question IS re-framed (story or
  // inverse surface) and correct recognition there earns the credit.
  const svC = await post("/api/progress", { action: "serve", id: pid4, conceptId: "linear-equations", intent: "transfer", reveal: true });
  ok(svC.status === 200 && svC.body.question, "transfer-staged serve succeeds");
  const trAns = await post("/api/progress", { action: "answer", id: pid4, conceptId: "linear-equations", questionId: svC.body.question.id, choiceIndex: svC.body.question.answer });
  ok(trAns.status === 200 && trAns.body.correct === true, "transfer question graded server-side");
  const snap4 = (await getAuthed(`/api/progress?id=${pid4}&subject=maths`, pid4)).body;
  const pr4 = snap4.progress?.["linear-equations"] ?? {};
  ok(pr4.transfer?.asked >= 1 && pr4.transfer?.correct >= 1, `staged transfer attributed server-side (${JSON.stringify(pr4.transfer)})`);
  // c) Transfer credit is one-shot: replaying the spent questionId is rejected
  //    outright and cannot farm further transfer attempts.
  const replay = await post("/api/progress", { action: "answer", id: pid4, conceptId: "linear-equations", questionId: svC.body.question.id, choiceIndex: svC.body.question.answer });
  ok(replay.status === 400, "replayed/credited question rejected (one grading per serve)");
  const snap4b = (await getAuthed(`/api/progress?id=${pid4}&subject=maths`, pid4)).body;
  ok((snap4b.progress?.["linear-equations"]?.transfer?.asked ?? 0) === 1, `no transfer credit farming (${JSON.stringify(snap4b.progress?.["linear-equations"]?.transfer)})`);
}

// 8b. Papers: marking is exact, the key never ships, and a paper is DIAGNOSTIC
//     EVIDENCE rather than a score. Two sittings of the same stored paper are
//     used on purpose: the first learns the answers from the mark scheme, the
//     second proves the key is stable and that a perfect paper repairs nothing.
{
  const pprof = await newProfile({ handle: "paper_e2e", country: "GB", language: "en", birthYear: 2009, subjects: ["maths"] });
  const kid = pprof.body.profile.id;

  const list = await getAuthed(`/api/paper?list=1&id=${kid}&spec=uk-gcse`, kid);
  ok(list.status === 200 && Array.isArray(list.body.papers) && list.body.papers.length > 0, "paper list resolves for a qualification");
  ok(typeof list.body.ai?.enabled === "boolean", "the paper list states whether the AI layer is enabled");

  const built = await getAuthed(`/api/paper?id=${kid}&subject=maths&spec=uk-gcse&level=higher&seed=e2e-paper`, kid);
  ok(built.status === 200 && built.body.paper?.questionCount > 0, "a paper is built and stored");
  const paper = built.body.paper;
  ok(built.body.source === "engine" || built.body.source === "ai" || built.body.source === "mixed", `provenance is stated (${built.body.source})`);
  ok(built.body.aiQuestions + built.body.engineQuestions === paper.questionCount, "every question is attributed to a source");
  // The served paper must not carry the mark scheme.
  ok(!/"answer"\s*:/.test(JSON.stringify(paper)), "the served paper leaks no answer key");
  ok(!/"explanation"\s*:/.test(JSON.stringify(paper)), "the served paper leaks no explanations");
  const sectionMarks = paper.sections.reduce((s, sec) => s + sec.questions.length * sec.marksEach, 0);
  ok(sectionMarks === paper.marks, `the paper's own marks add up (${sectionMarks} = ${paper.marks})`);

  const paperId = paper.id;
  // Sloppy sitting: every answer index 0. Afterwards we know the key.
  const zeros = {};
  for (const sec of paper.sections) for (const q of sec.questions) zeros[q.id] = 0;
  const first = await post("/api/paper", { paperId, answers: zeros, id: kid, lang: "en" });
  ok(first.status === 200 && first.body.result, "a sitting is marked");
  const r1 = first.body.result;
  const a1 = first.body.analysis;
  const nQ = r1.perQuestion.length;
  ok(nQ === paper.questionCount, "every served question is marked");
  ok(r1.total === paper.marks, "the mark total matches the paper");
  ok(r1.perQuestion.every((q) => q.awarded === (q.correct === true ? q.marks : 0)), "marks awarded follow the key exactly");
  ok(r1.perQuestion.every((q) => typeof q.answer === "number"), "the mark scheme is returned after marking (and only after)");
  ok(first.body.gradeIsEstimate === true, "the grade is labelled an estimate");
  ok(first.body.recorded === nQ, "every answered question is recorded as evidence");

  // The sitting reaches the LEDGER too, not only the model: one event per
  // answered question, carrying its score and exam independence. A paper is
  // evidence; if the ledger missed it, a replay would lose the sitting.
  const pled = await getAuthed(`/api/evidence?id=${kid}`, kid);
  const paperEvents = pled.body.events.filter((e) => e.type === "answer_submitted" && e.source === "past_paper");
  ok(paperEvents.length === nQ, `every answered paper question reached the ledger (${paperEvents.length}/${nQ})`);
  ok(paperEvents.every((e) => e.mode === "independent" && e.hints === 0), "paper evidence is exam-independent by construction");
  ok(paperEvents.every((e) => e.score && e.score.max > 0 && (e.correct ? e.score.awarded === e.score.max : e.score.awarded === 0)),
    "each paper event carries the marks it was worth and the marks it won");
  ok(pled.body.deepReconcile.differences.length === 0,
    "and the model the paper wrote is exactly what its events replay to");

  // The analysis must account for every mark, exactly once.
  const available = a1.byConcept.reduce((s, c) => s + c.marksAvailable, 0);
  const awardedSum = a1.byConcept.reduce((s, c) => s + c.marksAwarded, 0);
  const lostSum = a1.byConcept.reduce((s, c) => s + c.marksLost, 0);
  ok(available === r1.total, `analysis accounts for every mark (${available} = ${r1.total})`);
  ok(awardedSum === r1.raw, "analysis awards match the raw score");
  ok(lostSum === r1.total - r1.raw && lostSum === a1.lostMarks, "analysis losses match the marks lost");
  ok(a1.unansweredCount === 0, "nothing was skipped, so nothing is counted unanswered");
  ok(a1.byConcept.every((c) => c.correct + c.wrong + c.unanswered === c.questions), "each question is classified exactly once");
  ok(a1.missed.length === r1.perQuestion.filter((q) => q.awarded < q.marks).length, "the review list is every question that cost marks");
  ok(a1.concentration >= 0 && a1.concentration <= 1, `loss concentration is a real ratio (${a1.concentration})`);
  ok(a1.recurring.every((c) => c.questions > 1 && c.marksLost > 0), "only repeated, mark-losing ideas are called recurring");
  ok(a1.weakest === null || a1.weakest.marksLost > 0, "the drill target always lost marks");
  ok(Array.isArray(first.body.conceptsTested) && first.body.conceptsTested.length > 0, "the concepts tested are named");

  // Papers are sat under exam conditions, so the evidence is independent —
  // and that is what the learner model must have been fed.
  const snapP = (await getAuthed(`/api/profile?id=${kid}`, kid)).body;
  const tested = first.body.conceptsTested.map((c) => c.id);
  const askedIndep = tested.reduce((s, c) => s + (snapP.progress?.[c]?.independent?.asked ?? 0), 0);
  ok(askedIndep === nQ, `paper answers land as independent evidence (${askedIndep} = ${nQ})`);
  // The mark scheme knows WHY a question was set, not only which idea it
  // tested. Those tags must reach the learner model, or a paper can say which
  // ideas cost marks but never what the learner actually believes.
  const tagsAfter = tested.reduce((s, c) => {
    const m = snapP.progress?.[c]?.misconceptions ?? {};
    return s + Object.values(m).reduce((a, b) => a + b, 0);
  }, 0);
  ok(tagsAfter > 0, `paper mistakes record their misconception tags (${tagsAfter} tagged misses)`);

  // Second sitting of the SAME stored paper, now with the key we were given.
  const good = {};
  for (const q of r1.perQuestion) good[q.id] = q.answer;
  const second = await post("/api/paper", { paperId, answers: good, id: kid, lang: "en" });
  ok(second.status === 200, "the paper can be re-sat from its stored key");
  ok(second.body.result.raw === second.body.result.total, "a perfect sitting scores the paper's full marks");
  const a2 = second.body.analysis;
  ok(a2.lostMarks === 0 && a2.missed.length === 0, "a paper that lost no marks has nothing to review");
  ok(a2.recurring.length === 0 && a2.weakest === null, "a clean paper names no weakness and no recurring idea");
  ok(a2.concentration === 0, "concentration of an empty loss is zero, not NaN");
  const snapP2 = (await getAuthed(`/api/profile?id=${kid}`, kid)).body;
  const tagsAfterGood = tested.reduce((s, c) => {
    const m = snapP2.progress?.[c]?.misconceptions ?? {};
    return s + Object.values(m).reduce((a, b) => a + b, 0);
  }, 0);
  ok(tagsAfterGood === tagsAfter, `a clean sitting adds no misconception (${tagsAfterGood} = ${tagsAfter})`);

  // Skipping is not believing: skipped questions lose marks, are counted
  // unanswered, and never tag a misconception.
  const half = {};
  for (const [i, q] of r1.perQuestion.entries()) if (i % 2 === 0) half[q.id] = q.answer;
  const partial = await post("/api/paper", { paperId, answers: half, id: kid });
  const a3 = partial.body.analysis;
  const skippedCount = partial.body.result.perQuestion.filter((q) => q.correct === null).length;
  ok(skippedCount > 0 && a3.unansweredCount === skippedCount, `skipped questions are counted unanswered (${a3.unansweredCount})`);
  ok(partial.body.recorded === nQ - skippedCount, "skipped questions are not recorded as evidence");
  ok(a3.byConcept.some((c) => c.unanswered > 0), "a skipped question is attributed to its idea, as a gap not an error");
  ok(a3.missed.length > 0, "a skipped question still costs its marks");
  const unansweredFlaggedWrong = a3.byConcept.filter((c) => c.unanswered > 0 && c.correct + c.wrong + c.unanswered !== c.questions);
  ok(unansweredFlaggedWrong.length === 0, "unanswered is never miscounted as wrong");

  const noId = await post("/api/paper", { answers: {} });
  ok(noId.status === 400, "marking without a paperId is refused");
  const ghost = await post("/api/paper", { paperId: "pap_nope", answers: {} });
  ok(ghost.status === 404, "marking an unknown paper is refused");
}

// 8b-ter. Bring your own paper: evidence from a paper OpenMind never receives.
//     The learner sits their board's paper (which this project may not host)
//     and hands over marks and ideas only. The assertions below are mostly
//     about what is REFUSED, because that is what keeps the route from becoming
//     a reproduction service by accident.
{
  const own = await newProfile({ handle: "own_paper", country: "KE", language: "en", subjects: ["maths"] });
  const oid = own.body.profile.id;
  const QUESTIONS = [
    { number: "1", conceptId: "fractions", marks: 3, awarded: 3 },
    { number: "2", conceptId: "fractions", marks: 4, awarded: 1 },
    { number: "3", conceptId: "fractions", marks: 3, awarded: 0 },
    { number: "4", conceptId: "quadratics", marks: 5, awarded: 5 },
  ];
  const made = await post("/api/my-paper", { action: "create", id: oid, title: "KCSE Mathematics Paper 1", year: "2024", questions: QUESTIONS });
  ok(made.status === 200 && made.body.analysis, "a personal paper is accepted and analysed");
  const pa = made.body.analysis;
  ok(pa.total === 15 && pa.lostMarks === 6, `the marks add up (${pa.raw}/${pa.total}, ${pa.lostMarks} lost)`);
  ok(pa.recurring.some((c) => c.conceptId === "fractions"), "an idea that cost marks twice is reported as a pattern");
  ok(pa.weakest?.conceptId === "fractions", `and named as the thing to work on next (${pa.weakest?.conceptId})`);
  ok(pa.byConcept.every((c) => c.tags.length === 0),
    "no misconception is invented: a mark total says which idea cost marks, never why");
  const skippedQ = pa.missed.find((m) => m.id.endsWith(":q2"));
  ok(skippedQ && skippedQ.correct === null, "a question left out is lost marks but never a wrong answer");
  ok(made.body.recorded === 4, `every question becomes evidence (${made.body.recorded})`);

  // The evidence reached the learner model as INDEPENDENT work: a paper is sat
  // without OpenMind's help, which is exactly the evidence the model is starved
  // of. And no misconception was tagged, because none was observed.
  const snap = (await getAuthed(`/api/progress?id=${oid}&subject=maths`, oid)).body.progress ?? {};
  ok((snap.fractions?.independent?.asked ?? 0) === 3, `paper answers are independent evidence (${JSON.stringify(snap.fractions?.independent ?? {})})`);
  ok(Object.keys(snap.fractions?.misconceptions ?? {}).length === 0,
    "and they tagged no misconception — we know the question lost marks, not why");

  // ── What the route refuses. Question text must never reach the server.
  const withText = await post("/api/my-paper", {
    action: "create", id: oid, title: "Leaked",
    questions: [{ number: "1", conceptId: "fractions", marks: 3, awarded: 1, prompt: "Solve for x: 2x + 3 = 11" }],
  });
  ok(withText.status === 400 && withText.body.error === "content_not_accepted" && withText.body.field === "prompt",
    `question text is refused, and the offending field is named (${withText.body.error}:${withText.body.field})`);
  const withDoc = await post("/api/my-paper", { action: "create", id: oid, title: "Doc", document: "JVBERi0xLjQK", questions: QUESTIONS });
  ok(withDoc.status === 400 && withDoc.body.error === "content_not_accepted", "so is a whole uploaded document");
  const badMarks = await post("/api/my-paper", {
    action: "create", id: oid, title: "Bad", questions: [{ number: "1", conceptId: "fractions", marks: 2, awarded: 7 }],
  });
  ok(badMarks.status === 400 && badMarks.body.error === "bad_marks", "marks above the marks available are refused");
  const badConcept = await post("/api/my-paper", {
    action: "create", id: oid, title: "Bad", questions: [{ number: "1", conceptId: "not-a-concept", marks: 2, awarded: 1 }],
  });
  ok(badConcept.status === 400 && badConcept.body.error === "bad_concept", "an idea outside the genome is refused");

  // ── Private to its owner: another learner cannot open it (not even with a
  //    valid id), and the list requires the capability secret.
  const nosy = await newProfile({ handle: "nosy", country: "KE", language: "en", subjects: ["maths"] });
  const stolen = await post("/api/my-paper", { action: "mark", id: nosy.body.profile.id, paperId: made.body.paper.id });
  ok(stolen.status === 404, "another learner opening your paper gets 404 — private means owner-scoped, not guessable");
  const reopened = await post("/api/my-paper", { action: "mark", id: oid, paperId: made.body.paper.id });
  ok(reopened.status === 200 && reopened.body.analysis.weakest?.conceptId === "fractions", "the owner can reopen it and see the same diagnosis");
  ok((await call(`/api/my-paper?id=${oid}`)).status === 401, "the list requires the capability secret");
  const listed = await getAuthed(`/api/my-paper?id=${oid}`, oid);
  ok(listed.status === 200 && listed.body.papers.some((p) => p.id === made.body.paper.id), "and lists the owner's own papers");
  ok(listed.body.rights?.origin === "user_provided" && listed.body.rights.permitted.includes("process"),
    `the route states what it is permitted to do (${JSON.stringify(listed.body.rights?.permitted ?? [])})`);

  // ── The strongest claim of all, checked against the FILE: OpenMind stored
  //    marks and ideas, and no question text, because none was ever sent.
  const stored = JSON.parse(fs.readFileSync(".openmind-data/personal-papers.json", "utf8"));
  const record = Object.values(stored).find((p) => p && p.id === made.body.paper.id);
  ok(Boolean(record), "the personal paper is on disk under its own id");
  const allowedPaper = ["id", "owner", "origin", "title", "board", "specId", "year", "questions", "createdAt"];
  ok(Object.keys(record).every((k) => allowedPaper.includes(k)),
    `and carries nothing but the agreed fields (${Object.keys(record).join(",")})`);
  const allowedQ = ["number", "conceptId", "marks", "awarded"];
  ok(record.questions.every((q) => Object.keys(q).every((k) => allowedQ.includes(k))),
    "every stored question is a number, an idea and two marks — no text, on any path");
  ok(!JSON.stringify(record).includes("Solve for x"),
    "and the question text the route refused appears nowhere in the store");
}

// 8c. The decision the API hands the UI. A recommendation is only actionable if
//     it says why NOW and how the session is shaped — and it must fit the day
//     the learner said they have, or it is advice they cannot take.
{
  const dayStr = (offset) => {
    const d = new Date(Date.now() + offset * 86400000);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const nprof = await newProfile({
    handle: "next_e2e", country: "GB", language: "en", birthYear: 2009,
    subjects: ["maths"], examDate: dayStr(5), exam: "GCSE Maths", timePerDay: 20,
  });
  ok(nprof.status === 200 && nprof.body.profile?.id, "the deadline profile is created");
  const nid = nprof.body.profile.id;
  ok(nprof.body.profile.examDate === dayStr(5) && nprof.body.profile.timePerDay === 20,
    "its exam date and daily minutes are stored");

  await gradeOne(nid, "fractions", true);
  const plan = await getAuthed(`/api/next?id=${nid}`, nid);
  const top = plan.body.actions?.[0];
  ok(Boolean(top), "a learner with evidence has a next step");
  ok(typeof top.why === "string" && top.why.length > 0, "the action answers why now");
  ok(top.urgency === "now", `an exam in five days makes it urgent (${top.urgency})`);
  ok(top.why.includes("5"), `and states the days left ("${top.why}")`);
  ok(Array.isArray(top.plan) && top.plan.length > 0, "the action states how the session is shaped");
  ok(top.plan.every((p) => Number.isInteger(p.count) && p.count >= 1),
    `every plan block has at least one item (${JSON.stringify(top.plan)})`);
  const planMinutes = top.plan.reduce((s, p) => {
    const cost = { learn: 2, retrieve: 1, practise: 1, remediate: 1, transfer: 2.5, exam: 2.5, project: 30 }[p.kind];
    return s + p.count * cost;
  }, 0);
  ok(top.minutes === Math.round(planMinutes), `the stated time is the plan's own cost (${top.minutes})`);
  const minimum = top.plan.every((p) => p.count === 1);
  ok(planMinutes <= 20 || minimum, `the plan fits the learner's stated 20 minutes (${planMinutes})`);
  ok(!/\{\w+\}/.test(`${top.title} ${top.reason} ${top.evidence} ${top.why}`),
    "no unfilled placeholder reaches the client");

  // The same learner with the date removed gets the honest alternative rather
  // than an invented deadline.
  await post("/api/profile", { id: nid, examDate: "", exam: "", timePerDay: 20 });
  const undated = await getAuthed(`/api/next?id=${nid}`, nid);
  ok(undated.body.actions?.[0]?.urgency === "none", "clearing the date clears the urgency");
  ok(undated.body.actions[0].why !== top.why, "and changes what the card says about now");
}

// 8d. The offline pack is THE artefact for a school with no internet, so its
//     recommendation has to be in the learner's own language — and it is the
//     surface where a missing translator is silent, because `decideNext`
//     simply falls back to English and the JSON still looks well-formed.
{
  const packEn = await newProfile({ handle: "pack_en", country: "GB", language: "en", birthYear: 2009, subjects: ["maths"] });
  const packAr = await newProfile({ handle: "pack_ar", country: "EG", language: "ar", teachingLang: "ar", birthYear: 2009, subjects: ["maths"] });
  const enId = packEn.body.profile.id;
  const arId = packAr.body.profile.id;
  for (const who of [enId, arId]) {
    await gradeOne(who, "fractions", true);
    await gradeOne(who, "fractions", false);
  }
  const pen = await getAuthed(`/api/my-pack?id=${enId}`, enId);
  const par = await getAuthed(`/api/my-pack?id=${arId}`, arId);
  ok(pen.status === 200 && par.status === 200, "both offline packs are served");
  ok(pen.body.today?.[0]?.why && pen.body.today[0].plan?.length > 0,
    "the offline pack carries why-now and the session shape");
  ok(par.body.today?.[0]?.why && par.body.today[0].plan?.length > 0,
    "and so does a pack built in another language");
  const arTop = par.body.today?.[0] ?? {};
  ok(!/[A-Za-z]{4,}/.test(`${arTop.title ?? ""} ${arTop.reason ?? ""} ${arTop.why ?? ""}`),
    `the Arabic pack's recommendation is Arabic, not English ("${arTop.title}")`);
  ok(/[\u0600-\u06FF]/.test(`${arTop.title ?? ""} ${arTop.why ?? ""}`), "it is actually Arabic script, not an empty string");
  ok(par.body.note !== pen.body.note && /[\u0600-\u06FF]/.test(par.body.note ?? ""),
    "the pack's own note is translated too");
  // The lessons are the concept layer: titles and blurbs are translated in every
  // dictionary, so a pack must not ship the genome's English title and blurb.
  const arLesson = (par.body.lessons ?? []).find((l) => l.conceptId === "fractions") ?? {};
  ok(/[\u0600-\u06FF]/.test(arLesson.title ?? ""), `the pack's concept titles are translated ("${arLesson.title}")`);
  ok(!/[A-Za-z]{4,}/.test(arLesson.blurb ?? ""), `and so are its blurbs ("${(arLesson.blurb ?? "").slice(0, 40)}")`);
}

// 9. i18n / static pages respond
for (const page of ["/", "/solve", "/try/linear-equations", "/onboarding", "/rooms", "/teacher", "/genome", "/about", "/learn/maths", "/learn/maths/quadratics", "/diagnostic/maths", "/papers", "/mistakes"]) {
  const res = await fetch(BASE + page);
  ok(res.status === 200, `page ${page} → 200`);
}

// 11. Adaptation layer: the ♿ panel button and the offline bar's status role
// are present in the prerendered shell of every page — accessibility is
// architecture, not a settings page. Server HTML can't run the client
// effects, so what we can prove here is that the markup ships everywhere.
// ── Home is one decision (HTTP half) ──
// These pages are client-rendered, so SSR ships the shell; what a route must
// give a learner is that it EXISTS, resolves, and is reachable from the shell
// the learner actually lands on. The source-level invariants (one CTA, no
// duplicate plan, no auth contradiction) are asserted in `npm run verify`.
for (const page of ["/dashboard", "/access", "/curriculum", "/offline", "/account", "/progress", "/mind", "/mind/fractions"]) {
  const res = await fetch(BASE + page);
  ok(res.status === 200, `restructured page ${page} → 200 (the refactor moved real destinations, not just markup)`);
}
for (const page of ["/", "/solve", "/learn/maths/quadratics", "/teacher", "/about"]) {
  const html = await (await fetch(BASE + page)).text();
  ok(html.includes("access-btn"), `${page} ships the ♿ adaptation button`);
  ok(html.includes('role="status"'), `${page} ships the offline status region`);
}
const rootHtml = await (await fetch(BASE + "/")).text();
ok(rootHtml.includes("openmind:lang") || rootHtml.includes("access-panel") || rootHtml.includes("I18nProvider") || rootHtml.includes("__next"), "root shell renders through the providers");

// 12. Accounts: one session, and NAVIGATION CANNOT INVALIDATE IT.
//
// The invariant the user asked for is split across two halves, and this is the
// server half. The client half — that a route is never redirected while the
// session probe is still in flight, and that a redirect remembers where the
// learner was going — is asserted over the whole route table in
// `npm run verify` (▸ Where the learner is allowed to be).
//
// What can only be proved over HTTP: a page load, a nav click and a refresh all
// arrive as INDEPENDENT requests carrying nothing but the session cookie, and
// they must all resolve to the same account and the same learner profile. The
// capability secret deliberately never appears here.
{
  const email = `e2e-guard-${Date.now()}@example.test`;
  const password = "guard-test-password";
  const created = await call("/api/auth/signup", json({
    email, password, name: "Guard Tester", country: "GB", language: "en", subjects: ["maths"],
  }));
  ok(created.status === 200 && created.body.account?.email === email, "an account can be created");

  const cookie = created.headers.get("set-cookie");
  ok(Boolean(cookie) && /session/i.test(cookie), "signing up sets a session cookie");
  const jar = { Cookie: cookie ?? "" };

  const me1 = await call("/api/auth/me", { headers: jar });
  const accountId = me1.body.account?.id;
  const learnerId = me1.body.profile?.profile?.id;
  ok(Boolean(accountId) && Boolean(learnerId),
    "one request answers both questions: who is signed in, and which learner that is");

  // Three "page loads" — the nav-tab case that used to end in a sign-up form.
  const me2 = await call("/api/auth/me", { headers: jar });
  const me3 = await call("/api/auth/me", { headers: jar });
  ok(me2.body.account?.id === accountId && me3.body.account?.id === accountId,
    "independent requests resolve to the SAME account (navigation does not sign anyone out)");
  ok(me3.body.profile?.profile?.id === learnerId,
    "and to the SAME learner profile (a page load never creates a second one)");

  // The session owns the profile, so no capability secret is needed to read it.
  const viaSession = await call(`/api/profile?id=${learnerId}`, { headers: jar });
  ok(viaSession.status === 200 && viaSession.body.profile?.id === learnerId,
    "a session-owning request reads the profile with NO capability secret at all");
  const stranger = await call(`/api/profile?id=${learnerId}`);
  ok(stranger.status === 401 || stranger.status === 403,
    `and the same read without the session is refused (got ${stranger.status})`);

  // Sign-out is the ONE thing allowed to change identity.
  const out = await call("/api/auth/logout", { method: "POST", headers: { ...jar, "Content-Type": "application/json" }, body: "{}" });
  ok(out.status === 200, "sign-out succeeds");
  const after = await call("/api/auth/me", { headers: jar });
  ok(after.body.account === null, "after sign-out the very same cookie is nobody");

  // ...and signing back in restores that learner rather than starting over.
  const back = await call("/api/auth/login", json({ email, password }));
  ok(back.body.account?.id === accountId && back.body.profile?.profile?.id === learnerId,
    "signing back in returns the same account AND the same learner — never a fresh profile");
  ok(back.body.profile?.profile?.onboardedAt === undefined || typeof back.body.profile?.profile?.onboardedAt === "number",
    "and the enrolment state rides on the profile it returned, ready for the guard to read");
}

// 13. The evidence ledger: every graded answer leaves a trace, and the trace
// agrees with the learner model the app is actually teaching from.
{
  const p = await newProfile({ handle: "ledger_e2e", country: "GB", language: "en", subjects: ["maths"] });
  const id = p.body.profile.id;
  const g = { id, conceptId: "fractions" };

  const s1 = await post("/api/progress", { ...g, action: "serve" });
  ok(s1.status === 200 && !!s1.body.question?.id, "a question is served to the ledger learner");
  const a1 = await post("/api/progress", { ...g, action: "answer", questionId: s1.body.question.id, choiceIndex: 0, ms: 4000 });
  ok(a1.status === 200 && typeof a1.body.correct === "boolean", "and graded by the server as usual");
  ok(a1.body.evidence === undefined,
    "the evidence event written for that answer is NOT handed back to the client — a client that can read the shape can author one");

  const led = await getAuthed(`/api/evidence?id=${id}`, id);
  ok(led.status === 200 && led.body.count === 1, `one graded answer, one event (${led.body.count})`);
  const ev = led.body.events[0];
  ok(ev.type === "answer_submitted" && ev.learnerId === id, "the event names its type and the learner it belongs to");
  ok(ev.provenance === "server", "and is marked server-observed, because the server graded it");
  ok(ev.conceptId === "fractions" && typeof ev.at === "number", "carrying the concept and a server clock, not a client timestamp");
  ok(led.body.projection.byConcept.fractions.attempts === 1, "the ledger's projection counts the attempt");
  ok(led.body.projection.byConcept.fractions.hints === 0, "and knows no hint was used");

  // A hinted answer: independence is the server's call, so the EVENT must say so.
  const s2 = await post("/api/progress", { ...g, action: "serve" });
  await post("/api/progress", { ...g, action: "hint", questionId: s2.body.question.id, level: 1 });
  await post("/api/progress", { ...g, action: "answer", questionId: s2.body.question.id, choiceIndex: 0, ms: 3000 });
  const led2 = await getAuthed(`/api/evidence?id=${id}`, id);
  const last = led2.body.events[led2.body.events.length - 1];
  ok(last.hints === 1 && last.mode === "guided",
    "a hinted answer is recorded as guided, with the hint count from the server's own ledger");
  ok(led2.body.projection.byConcept.fractions.independent.asked === 1,
    "so the hinted answer buys no independence credit in the ledger either");

  // The reconciliation, over HTTP, on a live server: the ledger and the model
  // that is actually teaching this learner must agree about the same answers.
  // Read the MODEL off disk, not through the public profile view: the view
  // deliberately omits progress, and the claim here is about the model the
  // teaching engine actually reads.
  const stored = JSON.parse(fs.readFileSync(".openmind-data/profiles.json", "utf8"));
  // Shape on disk: { [profileId]: { profile, progress, ... } } — progress is a
  // SIBLING of profile, not inside it.
  const model = stored[id]?.progress?.fractions ?? stored[id]?.profile?.progress?.fractions;
  const ledgerC = led2.body.projection.byConcept.fractions;
  ok(!!model, "the learner's model is on disk for this profile");
  ok(model.attempts === ledgerC.attempts,
    `the running learner model and the ledger agree on attempts (${model.attempts})`);
  ok(model.correct === ledgerC.correct,
    `and on how many were right (${model.correct})`);
  ok(model.independent?.asked === ledgerC.independent.asked,
    `and on how much of it was independent work (${model.independent?.asked ?? 0})`);

  // Idempotency: a device that re-sends its queue must not double its own work.
  const dup = await post("/api/evidence", { id, events: led2.body.events });
  ok(dup.status === 200 && dup.body.accepted === 0 && dup.body.duplicates === led2.body.events.length,
    "re-syncing the same events is idempotent: every one is recognised as already held, and none is written twice");
  const afterDup = await getAuthed(`/api/evidence?id=${id}`, id);
  ok(afterDup.body.count === led2.body.count, "so the ledger is exactly as long as it was before the re-sync");

  // Evidence about somebody else is refused, and the refusal names its reason.
  const forged = led2.body.events.map((e) => ({ ...e, learnerId: pid }));
  const refused = await post("/api/evidence", { id, events: forged });
  ok(refused.status === 200 && refused.body.accepted === 0 && refused.body.refused.every((r) => r.reason === "learner_mismatch"),
    "evidence naming a different learner is refused, and the refusal says why");

  // Offline work is real work — and the ledger never claims to have watched it.
  const offline = { ...led2.body.events[0], id: "ev_offlinework12345678", correct: true, chosen: 9 };
  const sync = await post("/api/evidence", { id, events: [offline] });
  ok(sync.body.accepted === 1, "a device may sync work it did while offline");
  const back = await getAuthed(`/api/evidence?id=${id}`, id);
  ok(back.body.events.find((e) => e.id === "ev_offlinework12345678")?.provenance === "device",
    "but it lands as device-reported, so the server never asserts it observed what it did not");

  // The ledger is not readable or writable without the learner's capability.
  const readOpen = await call(`/api/evidence?id=${id}`);
  ok(readOpen.status === 401, "the ledger is not readable without the learner's capability secret");
  const writeOpen = await call("/api/evidence", json({ id, events: [] }));
  ok(writeOpen.status === 401, "nor writable without it");

  // The deployment report: aggregate, limited, and free of identities.
  const impact = await call("/api/impact");
  ok(impact.status === 200 && impact.body.containsIndividualData === false,
    "the impact report is aggregate only, and says so in its own payload");
  ok(Array.isArray(impact.body.limitations) && impact.body.limitations.length >= 4,
    "it ships its limitations with every response, so a figure cannot be quoted without them");
  ok(impact.body.methodology.deviceReported.includes("unverifiable"),
    "and names device-reported evidence as unverifiable rather than counting it as observed");
  const asText = JSON.stringify(impact.body);
  ok(!asText.includes(id) && !asText.includes("ledger_e2e"),
    "no learner id or handle appears anywhere in the report");
}

// ── Evidence drives the experience (HTTP half) ───────────────────────────
// The display door serves the learner's own ledger summary; the live answer
// path feeds it. One learner, one answer, one increment — the loop the UI
// narrates, proved end to end.
{
  const lp = await newProfile({ handle: "exp_e2e", country: "GB", subjects: ["maths"] });
  ok(lp.status === 200, "experience learner created");
  const lid = lp.body.profile.id;

  // The summary is the learner's own: locked without the capability secret.
  const noAuth = await call(`/api/evidence-summary?id=${lid}`);
  ok(noAuth.status === 401, "the evidence summary is not readable without the capability secret");

  const s0 = await getAuthed(`/api/evidence-summary?id=${lid}`, lid);
  ok(s0.status === 200 && s0.body.totals.answers === 0,
    "the summary answers honestly at zero evidence");
  ok(s0.body.recent.length === 0 && Array.isArray(s0.body.concepts),
    "with no evidence there are no recent answers — an empty list, never a fabrication");

  // The live loop: serve → answer → the display door sees it.
  const sv = await post("/api/progress", { action: "serve", id: lid, conceptId: "fractions", reveal: true });
  const an = await post("/api/progress", {
    action: "answer", id: lid, conceptId: "fractions",
    questionId: sv.body.question.id, choiceIndex: sv.body.question.answer,
  });
  ok(an.status === 200 && an.body.correct === true, "the live answer is graded");

  const s1 = await getAuthed(`/api/evidence-summary?id=${lid}`, lid);
  ok(s1.body.totals.answers === 1 && s1.body.totals.correct === 1,
    "one graded answer reaches the evidence summary (the loop is live, not narrated)");
  const fr = s1.body.concepts.find((c) => c.conceptId === "fractions");
  ok(fr && fr.attempts === 1, "the concept row carries the attempt");
  // Guided vs independent is decided by the grading path (hints, session
  // shape), not by the summary. What the API must guarantee is that a
  // dimension with no answers of that kind is null — never a fabricated 0.
  const dimsAttempted = [fr.independent, fr.transfer].filter((d) => d !== null);
  ok(dimsAttempted.every((d) => d.asked > 0),
    "any dimension the API reports has actually been attempted");
  ok(fr.measured === null,
    "an unprobed concept reports no measured rate — unknown, not zero");
  ok(s1.body.recent.length === 1 && typeof s1.body.recent[0].offline === "boolean" && s1.body.recent[0].offline === false,
    "recent answers carry disclosed provenance (server-observed here, not offline)");
  ok(!JSON.stringify(s1.body).includes("schemaVersion"),
    "the display door speaks experience, not the event log's schema");
}

// ── Replay parity, over HTTP (ledger authority) ───────────────────────────
// The ledger's read door rebuilds the model from its events alone
// (replayModel) and compares it, field by field, against the learner model the
// product holds (reconcileDeep). An empty difference list is the claim the
// architecture rests on: the learner's history is sufficient to reconstruct
// their current state. Since the cutover that model is itself a projection of
// the ledger, so this is no longer a shadow comparison — it is the round trip.
{
  const rp = await newProfile({ handle: "replay_e2e", country: "GB", subjects: ["maths"] });
  ok(rp.status === 200, "replay learner created");
  const rid = rp.body.profile.id;

  // Two practice answers: one right, one wrong — counts, streak, accuracy,
  // misconception tags and pace all move on the live model.
  const sv1 = await post("/api/progress", { action: "serve", id: rid, conceptId: "fractions", reveal: true });
  const an1 = await post("/api/progress", { action: "answer", id: rid, conceptId: "fractions", questionId: sv1.body.question.id, choiceIndex: sv1.body.question.answer, ms: 4000 });
  ok(an1.status === 200, "first practice answer graded");
  const sv2 = await post("/api/progress", { action: "serve", id: rid, conceptId: "fractions", reveal: true });
  const an2 = await post("/api/progress", { action: "answer", id: rid, conceptId: "fractions", questionId: sv2.body.question.id, choiceIndex: (sv2.body.question.answer + 1) % sv2.body.question.choices.length, ms: 3000 });
  ok(an2.status === 200, "second practice answer graded");

  const led = await getAuthed(`/api/evidence?id=${rid}`, rid);
  ok(led.status === 200 && led.body.deepReconcile?.compared === true, "the ledger read door reports the deep reconciliation");
  ok(Array.isArray(led.body.deepReconcile.differences) && led.body.deepReconcile.differences.length === 0,
    `the ledger alone rebuilds the live model exactly — every derivable field (${led.body.deepReconcile.differences.length} differences)`);
  ok(led.body.projection.byConcept.fractions.attempts === 2, "both answers reached the ledger (the comparison is not vacuous)");
  // The projection is versioned separately from the evidence schema, and a
  // learner whose whole history is in the ledger must report nothing
  // unprojectable — the strongest form of the claim, over HTTP.
  //
  // The version is read from the door and cross-checked against the one the
  // DECISION reports for its own model: they must be the same algorithm tag, so
  // an unsynchronised bump cannot leave a surface deciding from one projection
  // while the ledger advertises another.
  const ledNext = await getAuthed(`/api/next?id=${rid}`, rid);
  ok(led.body.deepReconcile.projectionVersion >= 1
    && led.body.deepReconcile.projectionVersion === ledNext.body.decision?.projectionVersion,
    `the read door names the projection ALGORITHM that produced the model, and the decision names the same one (${led.body.deepReconcile.projectionVersion} vs ${ledNext.body.decision?.projectionVersion}), not just the event schema`);
  ok(led.body.deepReconcile.unprojectable === null,
    "and a learner whose history is entirely in the ledger reports nothing the evidence cannot account for");

  // The live model really does carry the deep surface being compared —
  // otherwise "zero differences" could mean "nothing was checked".
  const storedR = JSON.parse(fs.readFileSync(".openmind-data/profiles.json", "utf8"));
  const rmodel = storedR[rid]?.progress?.fractions;
  ok(!!rmodel && typeof rmodel.accuracy === "number" && typeof rmodel.totalMs === "number" && rmodel.attempts === 2,
    "the live model carries the deep surface (accuracy, pace) the replay claims to reproduce");
}

// ── What the decision claims about its own basis (five states, over HTTP) ──
// `basis` is the difference between "we have not measured you yet" and "we have
// not looked" and "the record is missing". A route can only ever produce the
// first two — it always reads the ledger — and which one is true of a learner
// is decided by the MODEL, not by the absence of a citation list.
{
  const bp = await newProfile({ handle: "basis_e2e", country: "KE", subjects: ["maths"] });
  ok(bp.status === 200, "basis learner created");
  const bid = bp.body.profile.id;

  const fresh = await getAuthed(`/api/next?id=${bid}`, bid);
  ok(fresh.status === 200 && Array.isArray(fresh.body.actions) && fresh.body.actions.length > 0,
    "a brand-new learner still gets a plan (the engine decides from an unmeasured model)");
  ok(fresh.body.actions.every((a) => a.basis !== "unknown"),
    "but never `unknown`: a server route holds the ledger, so it cannot plead it has not looked");
  ok(fresh.body.actions[0].basis === "no_evidence" && fresh.body.actions[0].evidenceIds.length === 0,
    `and with nothing measured the action says so (${fresh.body.actions[0].basis}) — the honest starting point, not an error`);
  ok(fresh.body.decision.evidenceEvents === 0,
    "the decision reports how much evidence it was made from");

  const sv = await post("/api/progress", { action: "serve", id: bid, conceptId: "fractions", reveal: true });
  const an = await post("/api/progress", {
    action: "answer", id: bid, conceptId: "fractions", questionId: sv.body.question.id,
    choiceIndex: sv.body.question.answer, ms: 2500,
  });
  ok(an.status === 200, "one recorded answer");

  const after = await getAuthed(`/api/next?id=${bid}`, bid);
  const cited = after.body.actions.filter((a) => a.basis === "cited");
  ok(cited.length > 0,
    `and once real evidence exists the action becomes \`cited\` (${cited.length} of ${after.body.actions.length} actions)`);
  const led2 = await getAuthed(`/api/evidence?id=${bid}`, bid);
  const ids = new Set((led2.body.events ?? []).map((e) => e.id));
  // The citation is a PROMISE: the id it names must resolve in the learner's
  // own ledger. Asserted over HTTP because the drawer renders exactly this.
  ok(cited.every((a) => a.evidenceIds.every((eid) => ids.has(eid))),
    "every id a citation names resolves in that learner's own ledger");
  ok(after.body.decision.evidenceEvents === (led2.body.events ?? []).length,
    "and the decision was made over the whole ledger, not a fragment of it");
  ok(after.body.actions.every((a) => a.basis !== "no_evidence" && a.basis !== "unrecorded"),
    "a learner whose ledger holds their work is never told their evidence is missing");
}

// 14. ONE LEARNER, ONE JOURNEY, ONE DECISION.
//
// 4b proves the loop and 5d proves the diagnostic; this runs ONE learner through
// diagnose → practise → prove → transfer and, after EVERY stage, asserts the
// three properties the architecture rests on:
//
//   · the decision the product would show is the one the server gives — and the
//     SAME decision comes out of a second surface (the offline pack, decided in
//     its own request from its own read of the profile and the ledger);
//   · every citation resolves in that learner's OWN ledger: the drawer's
//     "based on these answers" chain, checked end to end rather than assumed;
//   · the ledger alone still rebuilds the model (`deepReconcile`).
//
// Retrieval is deliberately NOT faked here. The RETRIEVE rung needs evidence
// that has aged, and only the engines suite can produce that honestly with a
// fixed clock — writing a `lastSeen` the learner never earned is precisely the
// kind of mutation the cutover removed, so this journey ends at transfer and
// says so.
{
  const jp = await newProfile({ handle: "journey_e2e", country: "GB", language: "en", subjects: ["maths"] });
  ok(jp.status === 200 && jp.body.profile?.id, "journey learner created");
  const jid = jp.body.profile.id;
  const jkey = (a) => (a ? `${a.kind}:${a.conceptId ?? "-"}` : "none");
  const stages = [];

  /** The canonical decision, plus the checks that make it a decision rather
   *  than a sentence. Returns the top action; everything read is kept so the
   *  next stage can be checked against what this one actually recorded. */
  async function readDecision(label) {
    const nx = await getAuthed(`/api/next?id=${jid}`, jid);
    const actions = nx.body.actions ?? [];
    const top = actions[0] ?? null;
    ok(nx.status === 200 && top !== null, `${label}: the decision API answers with a next action`);
    ok(actions.every((a) => a.basis !== "unknown"),
      `${label}: a server route always holds the ledger, so nothing here is decided blind`);

    const ev = await getAuthed(`/api/evidence?id=${jid}`, jid);
    const ids = new Set((ev.body.events ?? []).map((e) => e.id));
    ok(actions.every((a) => a.evidenceIds.every((id) => ids.has(id))),
      `${label}: every citation resolves in this learner's own ledger`);
    ok(ev.body.deepReconcile?.differences?.length === 0,
      `${label}: and the ledger alone still rebuilds the model it produced (${ev.body.deepReconcile?.differences?.length ?? "?"} differences)`);

    // The second surface: the pack a school with no internet would download.
    // It is built in a different request, from its own read of the profile and
    // ledger — so agreement here is not two copies of one answer.
    const pack = await getAuthed(`/api/my-pack?id=${jid}`, jid);
    const packed = pack.body.today?.[0] ?? null;
    ok(packed && jkey(packed) === jkey(top),
      `${label}: the downloadable pack asks for the SAME work (${jkey(top)} vs ${jkey(packed)})`);
    ok(pack.body.decision?.projectionVersion === top.projectionVersion,
      `${label}: and names the same projection algorithm as the action it ships`);

    stages.push({
      label,
      top,
      events: ev.body.events ?? [],
      projection: ev.body.projection,
      fingerprint: actions.map((a) => `${a.kind}:${a.conceptId ?? "-"}:${a.evidenceIds.join("|")}`).join(" > "),
    });
    return top;
  }

  // ── Stage 0: as the learner arrives. Nothing measured yet, and the product
  // says exactly that instead of inventing a weakness to work on.
  const top0 = await readDecision("before any evidence");
  ok(top0.basis === "no_evidence",
    `nothing measured yet is stated as \`no_evidence\`, not dressed as a diagnosis (${top0.basis})`);
  ok(top0.href.includes("diagnostic"), `and the first action points at the diagnostic (${top0.href})`);

  // ── Stage 1: DIAGNOSE. Every answer is deliberately wrong, so the sitting
  // has something to find and the next stage has a real cause.
  const dStart = await post("/api/diagnostic", { id: jid, subject: "maths", action: "start", kind: "baseline", reveal: true });
  ok(dStart.status === 200 && dStart.body.question, "the diagnostic opens for the journey learner");
  // The answer response carries the NEXT question as `next` (the client is
  // never handed a question it could have answered twice) — the shape this
  // loop got wrong first time round, which silently ended the sitting after
  // one question.
  let cur = { question: dStart.body.question }, guard = 0, answered = 0;
  const missed = new Set();
  while (cur.question && guard++ < 60) {
    const chosen = (cur.question.answer + 1) % cur.question.choices.length;
    const r = await post("/api/diagnostic", {
      id: jid, subject: "maths", action: "answer", reveal: true,
      questionId: cur.question.id, chosen,
    });
    if (r.status !== 200) break;
    missed.add(cur.question.conceptId);
    answered++;
    cur = { question: r.body.next };
  }
  const dFin = await post("/api/diagnostic", { id: jid, subject: "maths", action: "finish" });
  ok(dFin.status === 200 && missed.size > 1,
    `the sitting measured ${missed.size} concepts over ${answered} questions (the journey is not vacuous)`);

  const top1 = await readDecision("after the diagnostic");
  ok(top1.conceptId !== null && jkey(top1) !== jkey(top0),
    `the diagnostic CHANGED what OpenMind asks for (${jkey(top0)} → ${jkey(top1)})`);
  ok(missed.has(top1.conceptId),
    `and it asks for a concept the sitting actually tried (${top1.conceptId}) — a projection of the measurement, not of the sitting`);
  ok(top1.basis === "cited", `the action cites the answers that caused it (${top1.basis})`);
  const st1 = stages[stages.length - 1];
  const byId = new Map(st1.events.map((e) => [e.id, e]));
  ok(top1.evidenceIds.some((id) => byId.get(id)?.conceptId === top1.conceptId),
    "and the events it names are answers on THAT concept — the chain Home's drawer walks");

  // ── Stage 2: PRACTISE then PROVE. The learner does what the decision said,
  // in a session that captures its own baseline first.
  const target = top1.conceptId;
  const kind = top1.kind;
  const s1 = await post("/api/session", { action: "start", id: jid, conceptId: target, kind, target: 3 });
  ok(s1.status === 200 && s1.body.session?.conceptId === target,
    `the session the learner opens is the one the decision named (${target})`);
  ok(s1.body.session?.kind === kind,
    `and it records the KIND the plan asked for (${kind}), not a default`);
  ok(s1.body.session?.before?.mastery < 0.65,
    `its baseline agrees the concept is weak (mastery ${s1.body.session?.before?.mastery?.toFixed(2)}) — the measurement Home used is the one the session measures against`);

  let proved = 0;
  for (let i = 0; i < 3; i++) {
    const g = await gradeOne(jid, target, true);
    if (g?.correct === true) proved++;
  }
  ok(proved === 3, "three hint-free answers are graded correct inside the session");

  const fin1 = await post("/api/session", { action: "finish", id: jid, conceptId: target });
  const r1 = fin1.body.result;
  ok(fin1.status === 200 && r1?.activity?.asked === 3, "the session closes with the server's own activity record");
  ok(r1.proof.independent === true,
    "hint-free correct work is recorded as INDEPENDENT proof, which is what 'prove it' means");
  ok(r1.after.mastery > r1.before.mastery,
    `and the model moved on evidence (${r1.before.mastery.toFixed(3)} → ${r1.after.mastery.toFixed(3)})`);
  ok(r1.previousStep && jkey(r1.previousStep) === jkey(top1),
    `the plan the session opened with was the decision the learner was actually shown (${jkey(r1.previousStep)} vs ${jkey(top1)})`);

  const top2 = await readDecision("after practise and proof");
  ok(jkey(top2) === jkey(r1.nextStep),
    `the plan the session CLOSED with is the plan the server now serves (${jkey(r1.nextStep)} vs ${jkey(top2)}) — one decision, not two`);

  // ── Stage 3: TRANSFER. The same idea in unfamiliar wording, which is the
  // strongest evidence a learner can give and the only thing that may claim it.
  // `linear-equations` is used because its bank holds genuinely re-framable
  // prompts: the credit is only granted when the server's own transfer layer
  // produced a different surface, so a concept that can only re-draw its own
  // question would be recorded as ordinary work (and assert nothing).
  const tConcept = "linear-equations";
  await post("/api/session", { action: "start", id: jid, conceptId: tConcept, kind: "TRANSFER", target: 3 });
  const ts = await post("/api/progress", { action: "serve", id: jid, conceptId: tConcept, intent: "transfer", reveal: true });
  ok(ts.status === 200 && ts.body.question, "a re-framed question is served for the transfer stage");
  const ta = await post("/api/progress", {
    action: "answer", id: jid, conceptId: tConcept,
    questionId: ts.body.question.id, choiceIndex: ts.body.question.answer, ms: 3000,
  });
  ok(ta.status === 200 && ta.body.correct === true, "and answered correctly, hint-free");
  const fin2 = await post("/api/session", { action: "finish", id: jid, conceptId: tConcept });
  const r2 = fin2.body.result;
  ok(r2?.proof?.transfer === true, "the re-framed answer is recorded as TRANSFER proof");
  ok(r2.changeReason === "transfer",
    `and the result states the strongest reason it has (${r2.changeReason})`);

  const top3 = await readDecision("after transfer");
  const p3 = stages[stages.length - 1].projection.byConcept[tConcept];
  ok(p3.transfer.asked >= 1 && p3.transfer.correct >= 1,
    `the learner's own record now carries transfer proof on that concept (${p3.transfer.correct}/${p3.transfer.asked})`);
  // Independence was earned on ordinary questions, on the concept the decision
  // chose — and the two dimensions stay apart: the concept where the learner
  // proved independence is not the one where they transferred, and neither
  // record borrows the other's credit.
  const pTarget = stages[stages.length - 1].projection.byConcept[target];
  ok(pTarget.independent.asked >= 3 && pTarget.independent.correct >= 3,
    `independence stays on the concept it was earned on (${pTarget.independent.correct}/${pTarget.independent.asked} on ${target})`);
  ok((pTarget.transfer?.asked ?? 0) === 0 || target === tConcept,
    "and transfer credit is not granted to a concept that was only practised");
  const sessState = await getAuthed(`/api/session?id=${jid}`, jid);
  ok(sessState.body.lastSession?.changeReason === r2.changeReason,
    "Home can say WHY the plan moved, because the reason is persisted with the session");

  // ── The ledger's own accounting of this journey: one sitting as ONE event,
  // its per-answer detail beside it, and the session's answers as their own.
  const finals = stages[stages.length - 1].events;
  ok(finals.filter((e) => e.type === "diagnostic_completed").length === 1,
    "the diagnostic is in the ledger as ONE sitting event, carrying its seeds");
  ok(finals.filter((e) => e.type === "answer_submitted" && e.source === "diagnostic").length === answered,
    `with its ${answered} individual answers kept beside it as detail`);
  ok(finals.filter((e) => e.type === "answer_submitted" && e.source !== "diagnostic").length === 4,
    "and the four answers given inside sessions as their own events");

  // ── Reproducible, not remembered. Ask the same learner twice and the whole
  // ranking must come back the same, citations included: the state is a
  // consequence of their evidence, not of the page they happen to be on.
  const repeat = await getAuthed(`/api/next?id=${jid}`, jid);
  const fingerprint = (repeat.body.actions ?? [])
    .map((a) => `${a.kind}:${a.conceptId ?? "-"}:${a.evidenceIds.join("|")}`).join(" > ");
  ok(fingerprint === stages[stages.length - 1].fingerprint,
    `asking again returns the identical ranking and the identical citations (${top3?.kind}${top3?.conceptId ? ":" + top3.conceptId : ""})`);
  ok(stages.length === 4 && new Set(stages.map((s) => jkey(s.top))).size >= 2,
    `and the plan genuinely moved across the journey rather than repeating one card (${stages.map((s) => s.label + " → " + jkey(s.top)).join(" · ")})`);
}

// 15. TWO LEARNERS, ONE BANK, DIFFERENT EVIDENCE.
//
// 14 proves ONE learner's decision follows their own evidence. This is the pair
// form of that claim, over HTTP, where a surface actually gets it: the same
// specification, the same concept, the same bank, with the answers as the only
// difference between them — and the two learners told apart at the end. The
// engines suite holds the strict version (both learners served the identical
// draws by seed); what this adds is the real serve → answer → ledger →
// projection → /api/next path, with the server choosing every question.
{
  const pair = async (handle) =>
    (await newProfile({ handle, country: "GB", language: "en", subjects: ["maths"], spec: "uk-gcse" })).body.profile?.id;
  const aid = await pair("pair_strong_e2e");
  const bid = await pair("pair_weak_e2e");
  ok(!!aid && !!bid, "two learners enrol on the same specification");

  const answerSix = async (id, correctCount) => {
    let correct = 0;
    for (let i = 0; i < 6; i++) {
      const g = await gradeOne(id, "fractions", i < correctCount);
      if (g?.correct === true) correct++;
    }
    return correct;
  };
  ok(await answerSix(aid, 6) === 6, "the first learner answers six served questions correctly");
  ok(await answerSix(bid, 1) === 1, "the second answers the same number, one of them right");

  const evA = await getAuthed(`/api/evidence?id=${aid}`, aid);
  const evB = await getAuthed(`/api/evidence?id=${bid}`, bid);
  const specs = new Set([...evA.body.events, ...evB.body.events].map((e) => e.specificationId));
  ok(specs.size === 1 && specs.has("uk-gcse"),
    `both sat the same specification, stamped on the events rather than inferred (${[...specs].join(", ") || "none"})`);
  const fA = evA.body.projection?.byConcept?.fractions;
  const fB = evB.body.projection?.byConcept?.fractions;
  ok(fA?.independent?.correct === 6 && fA?.independent?.asked === 6,
    `the first learner's record says 6/6 independent (${fA?.independent?.correct}/${fA?.independent?.asked})`);
  ok(fB?.independent?.correct === 1 && fB?.independent?.asked === 6,
    `the second's says 1/6 over the same denominator (${fB?.independent?.correct}/${fB?.independent?.asked})`);
  ok((fA.transfer?.asked ?? 0) === 0 && (fB.transfer?.asked ?? 0) === 0,
    "and the dimensions neither of them produced evidence for hold no observations — unmeasured, which is not a zero score");

  const nxA = await getAuthed(`/api/next?id=${aid}`, aid);
  const nxB = await getAuthed(`/api/next?id=${bid}`, bid);
  const topA = nxA.body.actions?.[0];
  const topB = nxB.body.actions?.[0];
  ok(topA && topB, "both learners get a next action");
  ok(`${topA.kind}:${topA.conceptId}` !== `${topB.kind}:${topB.conceptId}`,
    `the same concept, answered differently, gives different next work (${topA.kind}:${topA.conceptId} vs ${topB.kind}:${topB.conceptId})`);
  ok(topA.kind === "TRANSFER" && topB.kind === "EXPLAIN",
    `the learner who proved the concept is stretched, the one who missed it is taught again (${topA.kind} vs ${topB.kind})`);

  for (const [label, nx, ev] of [["the strong learner", nxA, evA], ["the weak learner", nxB, evB]]) {
    const mine = new Set((ev.body.events ?? []).map((e) => e.id));
    const measured = new Set((ev.body.events ?? []).map((e) => e.conceptId));
    const actions = nx.body.actions ?? [];
    ok(actions.every((a) => a.evidenceIds.every((x) => mine.has(x))),
      `${label}: every citation resolves in their OWN ledger`);
    const ground = actions.filter((a) => a.conceptId && !measured.has(a.conceptId));
    ok(ground.every((a) => a.basis === "unattributed" && a.evidenceIds.length === 0),
      `${label}: a concept they have no evidence on is offered as new ground (${ground.map((a) => `${a.kind}:${a.conceptId}`).join(", ") || "none"}), never as a cited weakness`);
  }
}

// 16. RETENTION, OVER HTTP: delayed recall is measured, a repeat is not.
//
// The engines suite proves the scheduler, the stamp and the fold with a fixed
// clock; here the same loop runs through the real serve → answer path, where
// the SERVER decides that a concept is due. The only honest way to age evidence
// over HTTP is the learner's own offline work: it is synced with the clock it
// happened at, arrives stamped `device` (real, unverified, disclosed), and the
// model rebuilt from it is what makes the review due.
{
  const DAY = 24 * 60 * 60 * 1000;
  const rp = await newProfile({ handle: "retention_e2e", country: "GB", language: "en", subjects: ["maths"], spec: "uk-gcse" });
  const rid = rp.body.profile.id;
  ok(!!rid, "a learner enrols on a course");

  // Four correct, hint-free answers recorded a month and a half ago: mastery
  // worth reviewing, and nothing left in the same sitting to mistake for recall.
  const aged = [60, 55, 50, 45].map((days, i) => ({
    id: `ev_e2e_offline_${rid.slice(-6)}_${i}`,
    schemaVersion: 1, learnerId: rid, at: Date.now() - days * DAY,
    source: "practice", subject: "maths", conceptId: "fractions",
    specificationId: "uk-gcse", type: "answer_submitted",
    questionId: `offline-${i}`, correct: true, chosen: 0,
    mode: "independent", hints: 0, tags: [],
  }));
  const ingest = await post("/api/evidence", { id: rid, events: aged });
  ok(ingest.status === 200 && ingest.body.accepted === 4,
    `the learner's offline work syncs into the ledger (${ingest.body.accepted} accepted)`);
  const fresh = await getAuthed(`/api/evidence?id=${rid}`, rid);
  ok(fresh.body.events.every((e) => e.provenance === "device"),
    "and it is disclosed as device-reported — real work the server did not watch");
  ok(fresh.body.projection.byConcept.fractions.retention.asked === 0,
    "with NO retention claim yet: work done once, however good, is not memory");
  ok(fresh.body.deepReconcile.differences.length === 0,
    "and the model installed is that ledger, rebuilt (the aged events are the whole history)");

  // The scheduler, not the client, decides that this concept is due — so the
  // plan offers the review and the serve path stages it as one.
  const nx = await getAuthed(`/api/next?id=${rid}`, rid);
  const top = nx.body.actions?.[0];
  ok(top?.kind === "RETRIEVE" && top.conceptId === "fractions",
    `an aged concept is put back in front of the learner (${top?.kind}:${top?.conceptId} — ${nx.body.actions?.map((a) => `${a.kind}:${a.conceptId}`).join(", ")})`);
  ok(top.basis === "cited", `and the review cites the work it is re-measuring (${top.basis})`);

  const served = await post("/api/progress", { action: "serve", id: rid, conceptId: "fractions", reveal: true });
  ok(served.status === 200 && served.body.question, "a review question is served");
  const recalled = await post("/api/progress", {
    action: "answer", id: rid, conceptId: "fractions",
    questionId: served.body.question.id, choiceIndex: served.body.question.answer, ms: 2500,
  });
  ok(recalled.body?.correct === true, "and recalled correctly, hint-free");

  const after = await getAuthed(`/api/evidence?id=${rid}`, rid);
  const mine = after.body.events.filter((e) => e.provenance === "server");
  ok(mine.length === 1 && mine[0].source === "retrieval",
    `the answer is recorded as a RETRIEVAL, not as more practice (${mine[0]?.source})`);
  ok(after.body.projection.byConcept.fractions.retention.asked === 1
    && after.body.projection.byConcept.fractions.retention.correct === 1,
    `retention is measured on the ledger (${after.body.projection.byConcept.fractions.retention.correct}/${after.body.projection.byConcept.fractions.retention.asked})`);
  ok(after.body.deepReconcile.differences.length === 0,
    `and the model is still exactly its ledger, retention included (${after.body.deepReconcile.differences.length} differences)`);

  // The gate: the same sitting, seconds later. Real work, but nothing was
  // delayed, so it cannot be memory — the elapsed gap IS the measurement.
  const again = await post("/api/progress", { action: "serve", id: rid, conceptId: "fractions", reveal: true });
  await post("/api/progress", {
    action: "answer", id: rid, conceptId: "fractions",
    questionId: again.body.question.id, choiceIndex: again.body.question.answer, ms: 2000,
  });
  const third = await getAuthed(`/api/evidence?id=${rid}`, rid);
  ok(third.body.projection.byConcept.fractions.retention.asked === 1,
    `answering again seconds later adds no retention credit (${third.body.projection.byConcept.fractions.retention.asked} asked after two reviews)`);
  ok(third.body.projection.byConcept.fractions.independent.asked === 6,
    "while both reviews still count as independent work — the dimension is refused, not the answer");

  // And the loop closes: the concept is no longer overdue, so the plan stops
  // asking for it and moves on to what is actually next.
  const moved = await getAuthed(`/api/next?id=${rid}`, rid);
  ok(moved.body.actions.every((a) => !(a.kind === "RETRIEVE" && a.conceptId === "fractions")),
    `having retrieved it, the learner is no longer asked to (${moved.body.actions?.map((a) => `${a.kind}:${a.conceptId}`).join(", ")})`);
}

// 17. THE TUTOR IS GROUNDED, AND THE OFFLINE TUTOR IS AN OUTCOME.
//
// The AI layer's job is to explain, hint and adapt — never to move the model.
// Three claims, over the real routes:
//
//   * the tutor's input is the decision the SURFACES display: the same kind,
//     concept, reason, citations, basis and projection version /api/next hands
//     the UI for the same learner, read from their projection and not from the
//     request body (which may name a concept and nothing else);
//   * a learner is never told a model answered when it did not — the disclosure
//     travels with each reply and cannot be escalated;
//   * with a model configured but silent (500, timeout, unparseable body, empty
//     completion) the learner still gets the offline Socratic reply, in their
//     language, and the payload names which failure it was.
//
// The AI-configured half runs when the dev server was launched against a stub
// provider (scripts/ai-stub.mjs, see AGENTS.md). Without one, this section still
// runs and asserts the no-key path — and OPENMIND_E2E_AI=1 makes a missing
// configuration a FAILURE rather than a silent skip, so an "AI run" that proved
// nothing cannot report success.
const stubLog = process.env.OPENMIND_AI_STUB_LOG ?? "";
{
  const ai = (await call("/api/ai")).body;
  const configured = ai?.enabled === true;
  const mustHaveAi = process.env.OPENMIND_E2E_AI === "1";
  console.log(`  ai layer: ${configured ? `configured (${ai.provider}/${ai.model}, timeout ${ai.timeoutMs}ms)` : "not configured — no-key path only"}`);
  ok(!mustHaveAi || configured,
    "this run was asked to prove the AI matrix, so the server must have a model configured");

  // A learner with real evidence, so a decision exists to be grounded in.
  const tp = await newProfile({
    handle: "tutor_e2e", country: "GB", language: "en", birthYear: 2009,
    goal: "Revise GCSE maths", subjects: ["maths"],
  });
  const tid = tp.body.profile.id;
  for (let i = 0; i < 3; i++) {
    const serve = await post("/api/progress", { action: "serve", id: tid, conceptId: "fractions", reveal: true });
    await post("/api/progress", {
      action: "answer", id: tid, conceptId: "fractions",
      questionId: serve.body.question.id,
      choiceIndex: i === 0 ? serve.body.question.answer : (serve.body.question.answer + 1) % 4,
      ms: 4000,
    });
  }
  const next = await getAuthed(`/api/next?id=${tid}`, tid);
  const shown = next.body.actions[0];
  ok(!!shown, `the learner has a canonical next step to be grounded in (${shown?.kind}:${shown?.conceptId})`);

  // ── (a) the tutor's input IS the decision the surfaces display ──────────
  const turn = await post("/api/tutor", { id: tid, conceptId: shown.conceptId ?? "fractions", message: "I am stuck on this one", language: "en" });
  ok(turn.status === 200 && turn.body.reply.length > 20, `the tutor replied (${turn.status})`);
  const gr = turn.body.grounding;
  ok(gr?.learnerId === tid, "the turn is grounded in the authenticated learner, not in the request body's claims");
  ok(gr.decision.kind === shown.kind && gr.decision.conceptId === shown.conceptId,
    `the tutor is given the same action the UI is showing (${gr.decision.kind}:${gr.decision.conceptId} vs ${shown.kind}:${shown.conceptId})`);
  ok(gr.decision.reason === shown.reason, "with the same reason, word for word — read from the projection, not composed for the model");
  ok(JSON.stringify(gr.decision.evidenceIds) === JSON.stringify(shown.evidenceIds),
    `and the same citations (/api/next: ${shown.evidenceIds.length}, grounding: ${gr.decision.evidenceIds.length})`);
  ok(gr.decision.basis === shown.basis && gr.decision.projectionVersion === shown.projectionVersion,
    `the same basis and projection algorithm (${gr.decision.basis} · v${gr.decision.projectionVersion})`);
  // The citations comparison above is only worth anything if there ARE
  // citations: a learner with three recorded answers that the decision cites
  // makes `[] === []` a real comparison, and an empty one proves nothing.
  ok(shown.evidenceIds.length > 0,
    `the decision this learner is being shown cites their own recorded answers, so the comparison has content (${shown.evidenceIds.length})`);
  ok(typeof gr.decision.title === "string" && gr.decision.title.trim().length > 1,
    `and the step is named for the model and the payload, concept or not ("${gr.decision.title}")`);
  ok(gr.projectionVersion === next.body.decision.projectionVersion
    && gr.evidenceEvents === next.body.decision.evidenceEvents,
    `and the same projection version and ledger size the decision door reports (v${gr.projectionVersion}, ${gr.evidenceEvents} events)`);

  // The request names the concept to TALK about; it cannot name the decision.
  const offTurn = await post("/api/tutor", { id: tid, conceptId: "quadratics", message: "what about quadratics", language: "en" });
  ok(offTurn.body.grounding.focus.conceptId === "quadratics"
    && offTurn.body.grounding.decision.kind === shown.kind
    && offTurn.body.grounding.decision.reason === shown.reason,
    "asking about another concept changes what the tutor discusses, never what the app decided");
  ok(offTurn.body.grounding.measured.length === 0,
    "and a concept with no evidence on it is handed over with nothing measured — never as a 0%");

  // ── (b) the capability rule on an optional-auth door ────────────────────
  const noSecret = await call("/api/tutor", json({ id: tid, conceptId: "fractions", message: "hello", language: "en" }));
  ok(noSecret.status === 401, `an id with no secret is refused rather than downgraded to a concept-only turn (${noSecret.status})`);
  const wrongSecret = await call("/api/tutor", json({ id: tid, secret: "wrong-secret-value", conceptId: "fractions", message: "hello", language: "en" }));
  ok(wrongSecret.status === 401, `and a wrong one is refused the same way (${wrongSecret.status})`);
  const anon = await post("/api/tutor", { conceptId: "fractions", message: "I am stuck", language: "en" });
  ok(anon.status === 200 && anon.body.grounding.learnerId === null && anon.body.grounding.decision === null,
    "a signed-out visitor still gets a tutor, grounded in the concept and in nobody in particular");

  // ── (c) the disclosure is honest, in both directions ────────────────────
  const AI_NOTE = "tutor.aiNote";
  const OFFLINE_NOTES = ["tutor.offlineNote", "tutor.fallbackNote"];
  const disclosure = (b) => b.answerSource === "ai" ? AI_NOTE : (OFFLINE_NOTES.includes(b.labelKey) ? b.labelKey : "?");
  ok(turn.body.mode === "ai" || turn.body.mode === "socratic", `the turn reports which engine wrote it (${turn.body.mode})`);
  ok(disclosure(turn.body) !== "?" && disclosure(anon.body) !== "?", "every reply carries a disclosure the UI can render");
  ok(turn.body.answerSource === "ai" ? turn.body.labelKey === AI_NOTE : turn.body.labelKey !== AI_NOTE,
    `a reply that did not come from a model can never carry the AI label (${turn.body.answerSource}/${turn.body.labelKey})`);

  // ── (d) the four ways a model fails to answer ───────────────────────────
  const failures = [
    ["[[FAIL]] provider is down", "provider_error"],
    ["[[HANG]] provider never answers", "timeout"],
    ["[[NOTJSON]] provider answers with an HTML error page", "malformed"],
    ["[[EMPTY]] provider answers with an empty completion", "malformed"],
  ];
  if (configured) {
    for (const [message, reason] of failures) {
      const r = await post("/api/tutor", { id: tid, conceptId: "fractions", message, language: "en" });
      ok(r.status === 200 && r.body.aiUnavailable === reason,
        `${reason}: the server names the failure instead of erroring (${r.status}/${r.body.aiUnavailable})`);
      ok(r.body.answerSource === "offline" && r.body.mode === "socratic" && r.body.reply.length > 20,
        `${reason}: and the learner gets a real Socratic reply, not an error page (${r.body.reply.length} chars)`);
      ok(r.body.labelKey === "tutor.fallbackNote",
        `${reason}: disclosed as the offline tutor's answer (${r.body.labelKey})`);
      ok(r.body.grounding.decision.reason === shown.reason, `${reason}: still grounded in the same decision`);
    }
    // And what the model was ACTUALLY told, read out of the stub's own log.
    if (stubLog && fs.existsSync(stubLog)) {
      const lines = fs.readFileSync(stubLog, "utf8").trim().split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      const probe = lines.filter((l) => l.prompt.includes("I am stuck on this one")).pop();
      ok(!!probe, `the stub provider received the grounded turn (${lines.length} requests logged)`);
      if (probe) {
        ok(probe.prompt.includes(shown.reason), "the prompt carries the decision's own reason — the model is told why this learner is seeing this question");
        ok(shown.evidenceIds.every((id) => probe.prompt.includes(id)), `and the ids of the answers the decision cites (${shown.evidenceIds.length})`);
        ok(probe.prompt.includes(`projection v${shown.projectionVersion}`), "and the projection algorithm the model is reasoning from");
        // A credential was attached — and compared EXACTLY when the suite is
        // told what the deployment's credential is (`OPENMIND_E2E_AI_KEY`, which
        // the server's own environment cannot be read from here). Compared by
        // value, never by length: "Bearer dev" is a real credential, and a
        // length rule calls it missing while accepting any stray 16-char header.
        const wantKey = process.env.OPENMIND_E2E_AI_KEY ?? "";
        const authOk = wantKey ? probe.auth === `Bearer ${wantKey}` : /^Bearer \S+$/.test(String(probe.auth));
        ok(authOk,
          wantKey
            ? `the request reached it with the deployment's credential attached (${probe.auth === `Bearer ${wantKey}` ? "exact match" : `got ${JSON.stringify(probe.auth)}, wanted ${JSON.stringify(`Bearer ${wantKey}`)}`})`
            : "the request reached it with a credential attached (set OPENMIND_E2E_AI_KEY to compare it exactly)");
      }
    } else {
      ok(false, `a configured AI run must log what the model was told (OPENMIND_AI_STUB_LOG=${stubLog || "unset"})`);
    }
  } else {
    ok(turn.body.aiUnavailable === "no_key" && turn.body.answerSource === "offline",
      `with no model configured the learner is answered offline and told why (${turn.body.aiUnavailable})`);
    ok(turn.body.labelKey === "tutor.offlineNote",
      `and the disclosure describes the deployment, not a failure (${turn.body.labelKey})`);
    ok(turn.body.reply.length > 20 && turn.body.grounding.decision.reason === shown.reason,
      "the offline reply is real and still grounded in the learner's own decision");
  }

  // ── (e) none of it wrote anything ───────────────────────────────────────
  const before = await getAuthed(`/api/evidence?id=${tid}`, tid);
  const profileBefore = await getAuthed(`/api/profile?id=${tid}`, tid);
  await post("/api/tutor", { id: tid, conceptId: "fractions", message: "one more turn", language: "en" });
  const after = await getAuthed(`/api/evidence?id=${tid}`, tid);
  const profileAfter = await getAuthed(`/api/profile?id=${tid}`, tid);
  ok(after.body.events.length === before.body.events.length,
    `a tutor turn adds no evidence (${before.body.events.length} → ${after.body.events.length})`);
  ok(JSON.stringify(profileAfter.body.profile.progress) === JSON.stringify(profileBefore.body.profile.progress),
    "and not one mastery field moves: a model's words are not evidence, and only append → confirm → replay/adopt writes");
  ok(after.body.deepReconcile.differences.length === 0,
    "the model is still exactly its ledger after the AI has spoken");
}

// 18. ONE CAPABILITY RULE, EVERY LEARNER-SCOPED READ DOOR.
//
// Four doors used to answer 200 to anyone holding an id — the decision
// (/api/next), the offline pack (/api/my-pack), the learning path (/api/path)
// and the class door (/api/classes, which even handed back a join code) — while
// profile, session, progress, evidence, evidence-summary and my-paper already
// refused. They all go through lib/server/capability.ts now, and this section
// is the assertion that they stay that way: for every door, a named id with no
// secret is refused, a wrong secret is refused the same way, and the learner
// holding the right one is served.
//
// The URL shape is exactly what the surfaces build: lib/client.tsx's
// withCapability() appends `secret=<the learner's own token>` to the query, so
// a door that answers this URL is a door the page can still read.
{
  const dp = await newProfile({
    handle: "door_e2e", country: "GB", language: "en", birthYear: 2009,
    goal: "Check every read door", subjects: ["maths"],
  });
  const did = dp.body.profile.id;
  const cls = await post("/api/classes", { id: did, action: "create", name: "Door check" });
  const cid = cls.body.cls.id;
  // One graded answer, so "served" cannot be confused with "served an empty
  // body": the member list of every door below is non-trivial for this learner.
  const serve = await post("/api/progress", { action: "serve", id: did, conceptId: "fractions", reveal: true });
  await post("/api/progress", {
    action: "answer", id: did, conceptId: "fractions",
    questionId: serve.body.question.id, choiceIndex: serve.body.question.answer, ms: 2500,
  });

  const WRONG = "wrong-secret-value";
  const doors = [
    ["the decision", `/api/next?id=${did}`],
    ["the offline pack", `/api/my-pack?id=${did}`],
    ["the learning path", `/api/path?id=${did}&subject=maths`],
    ["the class list", `/api/classes?me=${did}`],
    ["a class itself", `/api/classes?me=${did}&id=${cid}`],
    ["the profile", `/api/profile?id=${did}`],
    ["the open session", `/api/session?id=${did}`],
    ["the progress snapshot", `/api/progress?id=${did}&subject=maths`],
    ["the evidence ledger", `/api/evidence?id=${did}`],
    ["the evidence summary", `/api/evidence-summary?id=${did}`],
    ["their own paper", `/api/my-paper?id=${did}`],
  ];
  for (const [label, url] of doors) {
    const anon = await call(url);
    ok(anon.status === 401, `${label}: an id with no secret is refused (${anon.status})`);
    const wrong = await call(`${url}&secret=${WRONG}`);
    ok(wrong.status === 401, `${label}: a wrong secret is refused the same way (${wrong.status})`);
    const mine = await getAuthed(url, did);
    ok(mine.status === 200, `${label}: the learner holding the right secret is served (${mine.status})`);
  }

  // The class door is the one that used to hand a join code to strangers: the
  // teacher's own view must keep working, and an anonymous caller must get
  // neither the roster nor the code.
  const ownClass = await getAuthed(`/api/classes?me=${did}&id=${cid}`, did);
  ok(ownClass.status === 200 && ownClass.body.cls.joinCode === cls.body.cls.joinCode,
    "a class still hands its join code to the profile that created it — the door is closed to strangers, not to its teacher");
  const anonClass = await call(`/api/classes?me=${did}&id=${cid}`);
  ok(anonClass.status === 401 && anonClass.body.cls === undefined,
    `an anonymous caller gets neither the roster nor the join code (${anonClass.status})`);
  const anonList = await call(`/api/classes?me=${did}`);
  ok(anonList.status === 401 && anonList.body.classes === undefined,
    `and cannot enumerate the store's classes either (${anonList.status})`);
  const noCaller = await call("/api/classes");
  ok(noCaller.status === 400 && noCaller.body.classes === undefined,
    `an unnamed caller is turned away before anything is read (${noCaller.status})`);
  const wrongClass = await call(`/api/classes?me=${did}&id=${cid}&secret=${WRONG}`);
  ok(wrongClass.status === 401, `a wrong secret buys no class (${wrongClass.status})`);

  // And the surfaces can still read their own data. These are the exact URLs
  // the pages build through withCapability() — dashboard and /solve read the
  // path, the offline download button reads the pack, the teacher page reads
  // its classes — so each one is asserted to return something to render, not
  // merely 200.
  const dashPath = await getAuthed(`/api/path?id=${did}&subject=maths`, did);
  ok(dashPath.status === 200 && (dashPath.body.path?.length ?? 0) > 0,
    `the URL /dashboard builds still returns a path (${dashPath.body.path?.length} concepts)`);
  const packUrl = await getAuthed(`/api/my-pack?id=${did}`, did);
  ok(packUrl.status === 200 && (packUrl.body.lessons?.length ?? 0) > 0,
    `the URL the offline download button builds still returns a pack (${packUrl.body.lessons?.length} lessons)`);
  const nx = await getAuthed(`/api/next?id=${did}`, did);
  ok(nx.status === 200 && (nx.body.actions?.length ?? 0) > 0,
    `the URL Home and the pack decide from still returns actions (${nx.body.actions?.length})`);
  const ledUrl = await getAuthed(`/api/evidence?id=${did}`, did);
  ok(ledUrl.status === 200 && (ledUrl.body.events?.length ?? 0) > 0,
    `the URL /mind reads still returns the recorded ledger (${ledUrl.body.events?.length} events)`);

  // Finally the routes themselves render. A door that answers a learner while
  // the page that reads it cannot load would not be a fix; /onboarding is here
  // because the production build fix was a Suspense boundary on that page.
  for (const p of ["/onboarding", "/onboarding?mode=signin", "/dashboard", "/solve", "/teacher", "/offline"]) {
    const res = await fetch(BASE + p);
    const html = await res.text();
    ok(res.status === 200 && html.includes("<html"), `the page ${p} still renders HTML (${res.status})`);
  }
}

// 19. OFFLINE WORK, SYNCED OVER HTTP: held, replayed once, in order.
//
// The engines suite drives the queue's dedupe/ordering/retry against a fake
// storage and a fake fetch. This section proves the half that only a server can
// prove: an answer taken without a connection is replayed through the SAME
// route the online path uses, the SERVER decides what it means, delivering the
// same batch twice changes nothing, and delivering it in reverse produces the
// same model and the same recommendation. The device's claimed clock rides
// along as a claim and is disclosed — and buys no memory evidence.
{
  const DAY = 24 * 60 * 60 * 1000;
  const CONCEPTS = ["fractions", "decimals", "ratio"];
  const courses = async (handle) =>
    (await newProfile({ handle, country: "GB", language: "en", subjects: ["maths"], spec: "uk-gcse" })).body.profile?.id;
  const ledgerFile = (id) => `.openmind-data/evidence/${id}.jsonl`;
  /** Serve one question per concept and keep the served id + right choice, so a
   *  later delivery can name the SAME question the device was holding. */
  const stage = async (id) => {
    const held = [];
    for (const conceptId of CONCEPTS) {
      const s = await post("/api/progress", { action: "serve", id, conceptId, reveal: true });
      if (s.status !== 200 || !s.body.question) return null;
      held.push({ conceptId, questionId: s.body.question.id, choiceIndex: s.body.question.answer });
    }
    return held;
  };
  /** The device's queue: one submission per answer, each naming its own token,
   *  carrying the device's claim about when it happened. The questions are the
   *  ones THIS learner was served — a held answer to somebody else's question
   *  must be refused, which is what "stale or unknown question" is for. */
  const submissions = (id, held) => held.map((h, i) => ({
    action: "answer", id,
    submissionId: `sub_e2e_${id.slice(-6)}_${i}`,
    deviceAt: Date.now() - 3 * DAY,
    conceptId: h.conceptId, questionId: h.questionId, choiceIndex: h.choiceIndex, ms: 3000,
  }));
  const deliver = async (batch) => {
    const out = [];
    for (const body of batch) out.push(await post("/api/progress", body));
    return out;
  };
  const dims = (p) => JSON.stringify({
    answers: p.totals.answers, independent: p.totals.independent,
    retention: p.totals.retention, transfer: p.totals.transfer,
    concepts: Object.fromEntries(Object.entries(p.byConcept)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, c]) => [k, [c.attempts, c.correct, c.independent.asked, c.independent.correct, c.retention.asked]])),
  });

  const oid = await courses("offline_sync_e2e");
  const tid = await courses("offline_sync_twin");
  ok(!!oid && !!tid, "two learners enrol on the same course");
  const staged = await stage(oid);
  ok(Array.isArray(staged) && staged.length === CONCEPTS.length,
    `a question for each concept is served while the device still has a connection (${staged?.length})`);
  const batch = submissions(oid, staged);

  // ── The delivery: the same route the online path uses ────────────────────
  const first = await deliver(batch);
  ok(first.every((r) => r.status === 200 && r.body.correct === true),
    `every held answer is graded by the server on arrival (${first.map((r) => r.status).join(",")})`);
  const ledA = await getAuthed(`/api/evidence?id=${oid}`, oid);
  const evA = ledA.body.events ?? [];
  ok(evA.length === CONCEPTS.length, `all three reach the ledger (${evA.length})`);
  ok(evA.every((e) => e.provenance === "server"),
    "graded server-side — the answer key never left the server, offline or not");
  ok(evA.every((e) => typeof e.deviceAt === "number" && e.at > e.deviceAt),
    "with the device's claimed time KEPT on the event beside the server's own stamp");
  ok(ledA.body.projection.byConcept.fractions.independent.correct === 1,
    "and the work counts: an offline answer moves the model like any other");
  ok(ledA.body.projection.totals.retention.asked === 0,
    `a batch claiming it was answered three days ago buys NO retention (${ledA.body.projection.totals.retention.asked})`);
  ok(ledA.body.deepReconcile.differences.length === 0,
    "the model installed is that ledger, rebuilt after the sync");
  const summary = await getAuthed(`/api/evidence-summary?id=${oid}`, oid);
  const replayedRow = (summary.body.recent ?? []).find((r) => r.claimedAt !== null && r.claimedAt !== undefined);
  ok(replayedRow?.offline === true && replayedRow?.claimedAt === batch[2].deviceAt,
    `and the learner's own record says it was recorded offline, with the claimed time shown (${replayedRow?.claimedAt})`);

  // ── Delivered AGAIN: the ledger does not move a byte ─────────────────────
  const bytesAfterFirst = fs.readFileSync(ledgerFile(oid), "utf8");
  const dimsAfterFirst = dims(ledA.body.projection);
  const second = await deliver(batch);
  ok(second.every((r) => r.status === 200 && r.body.duplicate === true),
    `a device that retries the same batch is told it was already recorded (${second.map((r) => r.body.duplicate).join(",")})`);
  ok(second.every((r) => r.body.recorded === true && typeof r.body.correct === "boolean"),
    "and is answered from the ledger rather than re-graded");
  ok(fs.readFileSync(ledgerFile(oid), "utf8") === bytesAfterFirst,
    "the ledger file is BYTE-IDENTICAL after the second delivery: one answer, counted once");
  const ledA2 = await getAuthed(`/api/evidence?id=${oid}`, oid);
  ok(ledA2.body.events.length === evA.length && dims(ledA2.body.projection) === dimsAfterFirst,
    "the projection is unchanged too — no mastery moved for a replay");
  ok(ledA2.body.deepReconcile.differences.length === 0, "and it still reconciles against its ledger");

  // ── Delivered REVERSED: the same model, the same recommendation ─────────
  const tStaged = await stage(tid);
  ok(tStaged?.length === CONCEPTS.length, "the twin is served the same three questions");
  const tBatch = submissions(tid, tStaged).reverse();
  const reversed = await deliver(tBatch);
  ok(reversed.every((r) => r.status === 200), "and answers them in the OPPOSITE order (two tabs, or a second device)");
  const ledB = await getAuthed(`/api/evidence?id=${tid}`, tid);
  ok(ledB.body.events.length === CONCEPTS.length && dims(ledB.body.projection) === dims(ledA.body.projection),
    "the folded record is identical whichever order the answers arrived in");
  ok(ledB.body.deepReconcile.differences.length === 0, "and the twin's model is its ledger, rebuilt");
  // ── What "must not reorder" actually means, stated so it can fail ────────
  // The ledger's canonical order is (server stamp, id) — the ARRIVAL order. The
  // device's claims are the same in both learners (three days ago, in answer
  // order), so if a claimed clock could order the record, the twin's ledger
  // would read fractions-first too. It does not: the claims are carried, and
  // they decide nothing.
  const seq = (ev) => [...ev].sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1)).map((e) => e.conceptId).join(",");
  ok(seq(evA) === CONCEPTS.join(","),
    `the first ledger reads in the order the answers reached the server (${seq(evA)})`);
  ok(seq(ledB.body.events) === [...CONCEPTS].reverse().join(","),
    `and the reversed delivery reads reversed — its device claims did NOT reorder it back (${seq(ledB.body.events)})`);
  ok(ledB.body.events.every((e) => typeof e.deviceAt === "number"),
    "while those claims are still on every event, for a human to read");

  // ── The recommendation moved for exactly one reason, and it is nameable ──
  // The ranking's tie-break among equally-weak concepts is the order the
  // learner's record touched them (lib/next-engine: the model's own order), and
  // that order IS the arrival order the server owns — so a learner whose work
  // arrived reversed is correctly offered a different one of the three. What is
  // claimed here is the whole of it: the advice is the same KIND, it rests on
  // cited events in each learner's OWN ledger, one of which is the concept their
  // record touched first — and everything the order cannot touch is identical.
  const nxA = await getAuthed(`/api/next?id=${oid}`, oid);
  const nxB = await getAuthed(`/api/next?id=${tid}`, tid);
  const worked = (nx) => (nx.body.actions ?? []).find((a) => CONCEPTS.includes(a.conceptId));
  const wA = worked(nxA);
  const wB = worked(nxB);
  ok(wA?.conceptId === CONCEPTS[0] && wB?.conceptId === [...CONCEPTS].reverse()[0],
    `each learner is offered the practised concept their own record touched FIRST (A: ${wA?.conceptId}, B: ${wB?.conceptId})`);
  ok(wA?.kind === wB?.kind && (wA?.evidenceIds.length ?? 0) > 0 && (wB?.evidenceIds.length ?? 0) > 0,
    `with the same advice for the same state, resting on cited events in their own ledger (${wA?.kind}, ${wA?.evidenceIds.length} vs ${wB?.evidenceIds.length} citations)`);
  const ground = (nx) => (nx.body.actions ?? []).filter((a) => a.evidenceIds.length === 0)
    .map((a) => `${a.kind}:${a.conceptId}`).join(" · ");
  ok(ground(nxA) === ground(nxB) && ground(nxA).length > 0,
    `and the parts an arrival order cannot touch are identical (new ground: ${ground(nxA)})`);
  for (const [who, nx, led] of [["the synced learner", nxA, ledA], ["the twin", nxB, ledB]]) {
    const ids = new Set((led.body.events ?? []).map((e) => e.id));
    ok((nx.body.actions ?? []).every((a) => a.evidenceIds.every((x) => ids.has(x))),
      `${who}: every citation after the sync resolves in their own ledger`);
    ok((nx.body.actions ?? []).every((a) => a.basis !== "unknown"),
      `${who}: and the decision knows what its evidence is (basis: ${(nx.body.actions ?? []).map((a) => a.basis).join(",")})`);
  }
  ok(nxA.body.decision?.projectionVersion === ledA.body.deepReconcile.projectionVersion,
    `and the door and the ledger agree on the algorithm that produced it (v${nxA.body.decision?.projectionVersion} vs v${ledA.body.deepReconcile.projectionVersion})`);
}

// 20. ASSIGN WORK → MONITOR, ON THE REAL RECORD.
//
// The teacher flow's last missing step, end to end: a class that declares its
// curriculum, a teacher who sets work from it, a student who retrieves and
// completes that work through the ORDINARY practice door this suite's other
// sections use, and a monitor whose every number is derived from the same
// ledger — never from a counter the assignment stored. Then the negative: a
// second teacher can neither read nor alter that class's data, and neither can
// a student who merely belongs to it.
{
  const DAY = 24 * 60 * 60 * 1000;

  // The teacher, the class, and the curriculum it declares.
  const t = await newProfile({ handle: "teach_w", country: "GB", language: "en", subjects: ["maths"] });
  const teacher = t.body.profile.id;
  const cls = await post("/api/classes", { id: teacher, action: "create", name: "Year 10 Maths", subject: "maths" });
  ok(cls.status === 200 && cls.body.cls.subject === "maths",
    `a class is created with the curriculum it is taught declared (${cls.body.cls?.subject})`);
  const cid = cls.body.cls.id;
  const code = cls.body.cls.joinCode;

  // What a class may be SET comes from its declared curriculum: proven by trying.
  const stray = await post("/api/assignments", {
    id: teacher, action: "create", clsId: cid, conceptIds: ["momentum"], dueAt: Date.now() + 7 * DAY,
  });
  ok(stray.status === 400 && String(stray.body?.error ?? "").includes("momentum"),
    `work from another subject is refused, naming the concept (${stray.status}: ${stray.body?.error})`);
  const past = await post("/api/assignments", {
    id: teacher, action: "create", clsId: cid, conceptIds: ["fractions"], dueAt: Date.now() - DAY,
  });
  ok(past.status === 400, "and a deadline that has already passed is refused");

  // The student joins by code.
  const st = await newProfile({ handle: "pupil_w", country: "GB", language: "en", subjects: ["maths"] });
  const student = st.body.profile.id;
  ok((await post("/api/classes", { id: student, action: "join", joinCode: code, handle: "pupil_w" })).status === 200,
    "the student joins the class by code");

  // The teacher sets work: two ideas from the class's own curriculum, a week out.
  const dueAt = Date.now() + 7 * DAY;
  const made = await post("/api/assignments", {
    id: teacher, action: "create", clsId: cid, conceptIds: ["fractions", "decimals"], dueAt, title: "Fractions and decimals",
  });
  ok(made.status === 200 && !!made.body.assignment?.id,
    `the teacher sets work drawn from the class's declared curriculum (${made.status})`);
  const aid = made.body.assignment.id;

  // ── BEFORE: the student retrieves it, outstanding, carrying its deadline ──
  const before = await getAuthed(`/api/assignments?me=${student}`, student);
  const mineBefore = before.body.assigned?.find((w) => w.assignment.id === aid);
  ok(before.status === 200 && !!mineBefore, "the student retrieves the work set for them");
  ok(mineBefore?.assignment.dueAt === dueAt,
    "with the deadline the teacher set, as the server recorded it");
  ok(mineBefore?.mine.complete === false && mineBefore?.mine.outstanding.length === 2,
    `not started, and the row names the ideas still owed (${mineBefore?.mine.outstanding.join()})`);
  ok(mineBefore?.mine.weakest === null,
    "and names NO weakness yet — nothing has been measured on it");
  // A student sees their own row and nobody else's.
  ok(before.body.monitor?.length === 0,
    "and a member's read carries no monitor at all — the class's other rows are not theirs to see");

  const teachBefore = await getAuthed(`/api/assignments?me=${teacher}`, teacher);
  const monBefore = teachBefore.body.monitor?.find((m) => m.assignment.id === aid);
  const rowBefore = monBefore?.members?.find((r) => r.learnerId === student);
  ok(rowBefore && rowBefore.answers === 0 && rowBefore.complete === false,
    "while the teacher's monitor agrees from the same ledger: nothing recorded yet");

  // ── COMPLETE IT: the ordinary practice door, exactly as self-directed work ──
  for (let i = 0; i < 3; i++) {
    ok((await gradeOne(student, "fractions", true))?.correct === true, `assigned fractions answer ${i + 1} graded correct`);
  }
  ok((await gradeOne(student, "decimals", false)) !== null, "an answer on the second assigned idea, wrong");

  // ── AFTER: completion, accuracy and the weakness, all from the record ──
  const after = await getAuthed(`/api/assignments?me=${student}`, student);
  const mineAfter = after.body.assigned.find((w) => w.assignment.id === aid);
  ok(mineAfter.mine.complete === true && mineAfter.mine.outstanding.length === 0,
    "the work now reads complete — from the evidence, not because a box was ticked");
  ok(mineAfter.mine.concepts.fractions.asked === 3 && mineAfter.mine.concepts.decimals.asked === 1,
    `with each idea's own count in the window (${JSON.stringify(mineAfter.mine.concepts)})`);

  const teachAfter = await getAuthed(`/api/assignments?me=${teacher}`, teacher);
  const mon = teachAfter.body.monitor.find((m) => m.assignment.id === aid);
  const row = mon.members.find((r) => r.learnerId === student);
  ok(row.answers === 4 && row.complete === true,
    `the monitor reports the completion from the ledger (${row.answers} answers)`);
  ok(mon.interventions.some((i) => i.handle === "pupil_w" && i.conceptId === "decimals" && i.reason === "weak" && i.rate === 0),
    `and names the weakness the record shows, with its rate (${JSON.stringify(mon.interventions.map((i) => `${i.reason}:${i.conceptId}`))})`);
  // The teacher's row and the learner's own row are ONE derivation of ONE ledger.
  const digest = (r) => JSON.stringify({
    answers: r.answers, concepts: r.concepts, outstanding: r.outstanding,
    complete: r.complete, weakest: r.weakest, prior: r.prior,
  });
  ok(digest(row) === digest(mineAfter.mine),
    "the teacher's row and the learner's own row are the same projection of the same ledger");
  // And the misconceptions in it are the ledger's own tags, not a stored tally.
  const led = await getAuthed(`/api/evidence?id=${student}`, student);
  const decEvent = (led.body.events ?? []).find((e) => e.type === "answer_submitted" && e.conceptId === "decimals");
  const tagged = (decEvent?.tags ?? []).slice().sort().join(",");
  ok(Object.keys(row.misconceptions).sort().join(",") === tagged,
    `the monitor's misconceptions are the ledger's own tags (${Object.keys(row.misconceptions).join(",") || "none"} vs ${tagged || "none"})`);
  ok(row.projectionVersion === 2,
    `and the row names the projection algorithm that produced it (v${row.projectionVersion})`);

  // ── NEGATIVE: another teacher can neither read nor alter this class's data ──
  const ot = await newProfile({ handle: "teach_x", country: "GB", language: "en", subjects: ["maths"] });
  const other = ot.body.profile.id;
  const steal = await post("/api/assignments", {
    id: other, action: "create", clsId: cid, conceptIds: ["ratio"], dueAt: Date.now() + DAY,
  });
  ok(steal.status === 403, `another teacher cannot set work on a class they do not own (${steal.status})`);
  const kill = await post("/api/assignments", { id: other, action: "remove", clsId: cid, assignmentId: aid });
  ok(kill.status === 403, `nor remove the work in it (${kill.status})`);
  const peek = await getAuthed(`/api/assignments?me=${other}`, other);
  ok((peek.body.assigned ?? []).every((w) => w.assignment.clsId !== cid) &&
     (peek.body.monitor ?? []).every((m) => m.assignment.clsId !== cid),
    "nor read its work or its monitor — the read is scoped to classes they belong to");
  // And a student who IS in the class cannot set work in it: membership ≠ authority.
  const studentTry = await post("/api/assignments", {
    id: student, action: "create", clsId: cid, conceptIds: ["ratio"], dueAt: Date.now() + DAY,
  });
  ok(studentTry.status === 403, `a member who is not the teacher cannot set work (${studentTry.status})`);
  // The door refuses the missing and the wrong capability like every other one.
  const anon = await call(`/api/assignments?me=${teacher}`);
  ok(anon.status === 401, `the assignment door answers nothing without the capability (${anon.status})`);
  const wrong = await call(`/api/assignments?me=${teacher}&secret=wrong-secret-value`);
  ok(wrong.status === 401, `nor with a wrong one (${wrong.status})`);

  // ── REMOVAL IS REAL, on both sides ──
  const rem = await post("/api/assignments", { id: teacher, action: "remove", clsId: cid, assignmentId: aid });
  ok(rem.status === 200, "the teacher can remove the work they set");
  const gone = await getAuthed(`/api/assignments?me=${student}`, student);
  ok(!(gone.body.assigned ?? []).some((w) => w.assignment.id === aid),
    "and it is gone from the learner's list — the state transition is real");
  const goneT = await getAuthed(`/api/assignments?me=${teacher}`, teacher);
  ok(!(goneT.body.monitor ?? []).some((m) => m.assignment.id === aid),
    "and from the teacher's monitor");
}

// ════════════════════════════════════════════════════════════════════════════
// 21. ONE COURSE PER SUBJECT — chosen, validated, honoured
// ════════════════════════════════════════════════════════════════════════════
// A learner sits GCSE Maths (Foundation) and A-Level Physics in the same year.
// One flat course cannot express that: whichever one is stored, the other
// subject is planned at the wrong depth — or, worse, against a coverage set that
// does not contain it at all (the Digital SAT is mathematics only). What is
// asserted here is the whole path: the choice persists per subject, a
// qualification that does not teach the subject is REFUSED BY NAME, and the
// course the learner chose for a subject is the one the surfaces actually plan
// that subject's work against.
{
  const pv = await newProfile({
    handle: "two_courses", country: "GB", language: "en", grade: "Year 11",
    subjects: ["maths", "physics"],
    subjectCourses: {
      maths: { spec: "uk-gcse", specLevel: "foundation" },
      physics: { spec: "uk-alevel", specLevel: "as" },
    },
  });
  ok(pv.status === 200, `a learner can enrol on two different qualifications at once (${pv.status})`);
  const vid = pv.body.profile.id;
  ok(Array.isArray(pv.body.courseGaps) && pv.body.courseGaps.length === 0,
    `and a course chosen for every subject leaves nothing missing (${JSON.stringify(pv.body.courseGaps ?? null)})`);
  ok(pv.body.profile.subjectCourses?.maths?.spec === "uk-gcse" &&
     pv.body.profile.subjectCourses?.physics?.spec === "uk-alevel",
    `both courses are stored per subject (${pv.body.profile.subjectCourses?.maths?.spec} + ${pv.body.profile.subjectCourses?.physics?.spec})`);
  // The flat fields follow the FIRST subject, so a reader with one course in
  // hand still reads a course the learner actually chose.
  ok(pv.body.profile.spec === "uk-gcse",
    `and the single-course fields mirror the learner's first subject (${pv.body.profile.spec})`);

  // Read back through the door, not just the create response.
  const rv = await getAuthed(`/api/profile?id=${vid}`, vid);
  ok(rv.body.profile.subjectCourses?.physics?.specLevel === "as",
    `the per-subject course survives a re-read (physics tier: ${rv.body.profile.subjectCourses?.physics?.specLevel})`);
  ok(rv.body.courseGaps.length === 0, "and the derived gap report on a GET agrees it is complete");

  // ── The proof that a choice is HONOURED, not merely stored ──
  // The paper list is written to the course in force for the requested subject.
  const mathsPapers = await getAuthed(`/api/paper?id=${vid}&subject=maths&list=1`, vid);
  const physicsPapers = await getAuthed(`/api/paper?id=${vid}&subject=physics&list=1`, vid);
  ok(mathsPapers.body.qualification === "GCSE" ,
    `a Maths paper is written to the Maths course (${mathsPapers.body.qualification})`);
  ok(physicsPapers.body.qualification === "A-Level",
    `and a Physics paper to the Physics course, in the same profile (${physicsPapers.body.qualification})`);

  // ── NEGATIVE: a qualification that does not teach the subject is refused ──
  const notTaught = await post("/api/profile", {
    id: vid, subjectCourses: { physics: { spec: "us-sat" } },
  });
  ok(notTaught.status === 400 && notTaught.body.error === "spec_does_not_teach_physics",
    `a maths-only qualification cannot be saved as a Physics course (${notTaught.status} ${notTaught.body.error})`);
  const nonsense = await post("/api/profile", { id: vid, subjectCourses: { physics: { spec: "not-a-spec" } } });
  ok(nonsense.status === 400 && nonsense.body.error === "unknown_spec",
    `nor can an unknown qualification (${nonsense.status} ${nonsense.body.error})`);
  const badLevel = await post("/api/profile", { id: vid, subjectCourses: { physics: { spec: "uk-alevel", specLevel: "higher" } } });
  ok(badLevel.status === 400 && badLevel.body.error === "bad_spec_level",
    `nor a tier that belongs to a different qualification (${badLevel.status} ${badLevel.body.error})`);
  // A refusal must not have half-applied: physics is still A-Level.
  const afterRefusals = await getAuthed(`/api/profile?id=${vid}`, vid);
  ok(afterRefusals.body.profile.subjectCourses.physics.spec === "uk-alevel",
    "a refused course leaves the stored one untouched — no half-applied write");

  // ── A subject left unchosen is REPORTED, and its plan is not pretended ──
  const partial = await newProfile({
    handle: "one_course", country: "GB", language: "en", grade: "Year 11",
    subjects: ["maths", "biology"],
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher" } },
  });
  const qid = partial.body.profile.id;
  const gap = (partial.body.courseGaps ?? []).find((g) => g.subject === "biology");
  ok(Boolean(gap) && gap.missing.includes("spec"),
    `a declared subject with no course is named in the gap report (${JSON.stringify(partial.body.courseGaps ?? null)})`);
  const nextPlan = await getAuthed(`/api/next?id=${qid}`, qid);
  ok((nextPlan.body.courseGaps ?? []).some((g) => g.subject === "biology"),
    "and the decision API discloses it, so no surface has to guess whether the course was chosen");

  // ── Dropping a subject drops its course; it is not a stale preference ──
  const dropped = await post("/api/profile", { id: vid, subjects: ["maths"] });
  ok(dropped.body.profile.subjectCourses?.physics === undefined,
    "a subject the learner no longer studies takes its course with it");
  ok(dropped.body.profile.subjectCourses?.maths?.spec === "uk-gcse",
    "while the subjects they kept keep theirs");
  // And the course entries are the learner's own record: no capability, no read.
  const peek = await call(`/api/profile?id=${vid}`);
  ok(peek.status === 401, `the course record is behind the same capability rule (${peek.status})`);
}

console.log(`\nE2E: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
