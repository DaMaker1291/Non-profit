// Keeper probe: race N parallel answers against ONE served practice question
// and assert the graded semantics — exactly one grading accepted, the rest
// rejected as stale, and the store stays valid JSON. The E2E suite has no
// concurrency coverage; this is the only guard against double-grade bugs.
//
// ── WHY THIS FILE CARRIES A CAPABILITY SECRET ───────────────────────────────
// It did not, and that made it a guard that could not fail. Every learner-scoped
// door needs the profile's `secret`: an id alone is a 401 by design. The probe
// created a profile with NO secret and then called `/api/progress` with the id
// only, so it died on assertion 3 ("question served") with 0 recorded answers —
// and had done since capability secrets were introduced. The README, AGENTS.md
// and this file's own header went on claiming "8 parallel gradings → exactly one
// accepted" the whole time, because a run that dies early reports a non-zero exit
// and nobody re-read which line failed.
//
// A profile created without a secret can never be called AT ALL: the route binds
// the first secret presented and refuses everything afterwards
// (app/api/profile/route.ts#authorize). So the probe must present one at
// creation, exactly as scripts/e2e-api.mjs does, and carry it on every call.
const BASE = "http://localhost:4173";

const SECRET = `race-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
const SECRETS = new Map();

/** POST naming a profile: the secret rides along automatically, so no call site
 *  can forget it — the failure mode this file was living proof of is silence. */
const post = (p, b) => {
  const body = b && typeof b === "object" && b.id && SECRETS.has(b.id) ? { ...b, secret: SECRETS.get(b.id) } : b;
  return fetch(BASE + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    .then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
};
/** GET with the profile's secret in the query, which is how a read door
 *  authenticates when there is no session. */
const get = (p, id) =>
  fetch(`${BASE}${p}?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(SECRETS.get(id) ?? "")}`)
    .then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  RACE-FAIL:", m); } };

// fresh profile so this run is isolated. The secret is presented AT CREATION:
// the route binds the first one it is given, and a profile that never received
// one is unreachable for the rest of its life.
const prof = await (await fetch(`${BASE}/api/profile`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ handle: "race-probe", country: "KE", language: "en", birthYear: 2010, goal: "probe", subjects: ["maths"], secret: SECRET }),
})).json();
const pid = prof.profile?.id;
if (pid) SECRETS.set(pid, SECRET);
ok(Boolean(pid) && prof.secret === SECRET, "probe profile created with its capability secret");

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
const profGet = await get("/api/profile", pid);
const fp = profGet.body.progress?.fractions;
ok(fp && fp.attempts === 1, `store holds exactly one recorded attempt (got ${fp?.attempts})`);
ok(Object.keys(profGet.body).length > 0 && !JSON.stringify(profGet.body).includes(":session"), "profile response valid and leak-free");

// 3) racing profile creates (distinct ids, no corruption)
const creates = await Promise.all(
  Array.from({ length: 6 }, (_, i) => {
    const s = `race-${i}-${Math.random().toString(36).slice(2)}`;
    return fetch(`${BASE}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: `race-${i}`, country: "IN", language: "en", birthYear: 2009, goal: "", subjects: ["maths"], secret: s }),
    }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
  })
);
ok(creates.every((c) => c.status === 200 && c.body.profile?.id), "6 parallel profile creates all succeed");
ok(new Set(creates.map((c) => c.body.profile.id)).size === 6, "all created ids distinct");

// ── THE COUNT IS PART OF THE CONTRACT ──────────────────────────────────────
// Eleven assertions are what this file promises the README and AGENTS.md, and
// the way it broke before was not a wrong assertion — it was a run that stopped
// after two of them and still exited non-zero, which reads as "the probe failed"
// rather than "the probe never ran". A refactor that drops one would be silent;
// this makes it loud. The check does not count itself.
const RAN = pass + fail;
if (RAN !== 11) {
  fail++;
  console.error(`  RACE-FAIL: expected 11 assertions to run, ${RAN} did — the probe is not covering what it claims`);
}

console.log(`\nRACE PROBE: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
