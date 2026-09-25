// Keeper probe: race N parallel answers against ONE served practice question
// and assert the graded semantics — exactly one grading accepted, the rest
// rejected as stale, and the store stays valid JSON. The E2E suite has no
// concurrency coverage; this is the only guard against double-grade bugs.
const BASE = "http://localhost:4173";
const post = (p, b) =>
  fetch(BASE + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })
    .then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  RACE-FAIL:", m); } };

// fresh profile so this run is isolated
const prof = await post("/api/profile", { handle: "race-probe", country: "KE", language: "en", birthYear: 2010, goal: "probe", subjects: ["maths"] });
const pid = prof.body.profile.id;
ok(prof.status === 200 && pid, "probe profile created");

// 1) one question, 8 racing answers (4 pick the right choice, 4 pick a wrong one)
// serve uses the non-production `reveal` hook (same contract as the E2E) so the
// probe knows which choice is correct; production clients never see answers.
const serve = await post("/api/progress", { action: "serve", id: pid, conceptId: "fractions", reveal: true });
ok(serve.status === 200 && serve.body.question, "question served");
const q = serve.body.question;
ok(typeof q.answer === "number", "reveal hook returned the answer (non-production)");
const right = q.answer, wrong = (q.answer + 1) % q.choices.length;
const answers = await Promise.all(
  Array.from({ length: 8 }, (_, i) => {
    const choiceIndex = i % 2 ? wrong : right;
    return post("/api/progress", { action: "answer", id: pid, conceptId: "fractions", questionId: q.id, choiceIndex })
      .then((r) => ({ ...r, choiceIndex }));
  })
);
const accepted = answers.filter((a) => a.status === 200);
const rejected = answers.filter((a) => a.status === 400);
ok(accepted.length === 1, `exactly one grading accepted (got ${accepted.length})`);
ok(rejected.length === 7, `seven rejected as stale (got ${rejected.length})`);
// the accepted grading must reflect the server's own grade for that choice
ok(accepted[0].body.correct === (accepted[0].choiceIndex === right), "accepted grading is the server's verdict");
ok(typeof accepted[0].body.mastery === "number", "accepted grading returns mastery");

// 2) store integrity after the race: profile is valid JSON with the one attempt folded in
const profGet = await fetch(`${BASE}/api/profile?id=${pid}`).then((r) => r.json());
const fp = profGet.progress?.fractions;
ok(fp && fp.attempts === 1, `store holds exactly one recorded attempt (got ${fp?.attempts})`);
ok(Object.keys(profGet).length > 0 && !JSON.stringify(profGet).includes(":session"), "profile response valid and leak-free");

// 3) racing profile creates (distinct ids, no corruption)
const creates = await Promise.all(
  Array.from({ length: 6 }, (_, i) => post("/api/profile", { handle: `race-${i}`, country: "IN", language: "en", birthYear: 2009, goal: "", subjects: ["maths"] }))
);
ok(creates.every((c) => c.status === 200 && c.body.profile?.id), "6 parallel profile creates all succeed");
ok(new Set(creates.map((c) => c.body.profile.id)).size === 6, "all created ids distinct");

console.log(`\nRACE PROBE: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
