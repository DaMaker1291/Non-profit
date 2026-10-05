// ─────────────────────────────────────────────────────────────────────────────
// THE FORMAL AUTHORISATION MATRIX (§9 of the deployment brief).
//
// "Do not trust IDs from the browser." Every one of these assertions is a
// NEGATIVE claim made over HTTP against a real server: something that must be
// refused. A negative claim is the only kind worth testing, because the failure
// mode the brief names — a learner reading another learner's evidence, or a
// student editing a class — is a 200 where a 401/403 should have been.
//
// What it drives and against what:
//
//   · a running OpenMind server (prod or dev — every route here is a real route,
//     no `reveal` test hook, so it runs against the production build);
//   · a SCRATCH store. Point OPENMIND_DATA_DIR at an empty directory when you
//     start the server, or this suite writes throwaway profiles into the real
//     one (the deployment gate does exactly that; see scripts/production-check.mjs).
//
// Usage:
//   OPENMIND_BASE=http://localhost:4173 node scripts/verify-permissions.mjs
//
// Exit code 0 when every authority rule held and every boundary refused.
// ─────────────────────────────────────────────────────────────────────────────
const BASE = process.env.OPENMIND_BASE ?? "http://localhost:4173";

let pass = 0, fail = 0;
const bad = [];
const ok = (cond, msg, detail = "") => {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; bad.push(msg); console.error(`  ✗ ${msg}${detail ? ` — ${detail}` : ""}`); }
};
const group = (n) => console.log(`\n${n}`);

async function call(path, opts) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 200) }; }
  return { status: res.status, body, headers: res.headers };
}
const json = (body, extra = {}) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...extra },
  body: JSON.stringify(body),
});

// Capability secrets: every profile in this suite carries one, so a request that
// names a profile can be sent with the right secret, a WRONG one, or none.
const secrets = new Map();
async function newProfile(body) {
  const secret = `perm-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const r = await call("/api/profile", json({ ...body, secret }));
  const id = r.body?.profile?.id;
  if (id) secrets.set(id, secret);
  return { id, secret, status: r.status };
}
const authedGet = (path, id, secret = secrets.get(id)) =>
  call(`${path}${path.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret ?? "")}`);
const authedPost = (path, body, id) =>
  call(path, json({ ...body, id, secret: secrets.get(id) }));

// ── Preflight: fail fast and clearly if no server is answering ────────────────
try {
  const ping = await call("/api/health");
  if (ping.status !== 200) throw new Error(`health returned ${ping.status}`);
} catch (e) {
  console.error(`\nverify-permissions: cannot reach ${BASE} — start a server first.`);
  console.error(`  (${e.message})\n`);
  process.exit(2);
}

// ── 1. An id is not a credential ─────────────────────────────────────────────
group("1 · a bare learner id opens nothing (the capability rule)");
const alice = await newProfile({ handle: "perm_alice", country: "GB", language: "en", subjects: ["maths"] });
const bob = await newProfile({ handle: "perm_bob", country: "GB", language: "en", subjects: ["maths"] });
ok(alice.status === 200 && alice.id, "a profile is created with a capability secret");
ok(bob.status === 200 && bob.id, "a second, unrelated profile is created");

// The read doors that take a learner id. Each used to be — or could become — an
// id-only door, so each is asserted to refuse an id with no secret.
const idOnlyDoors = [
  [`/api/profile?id=${alice.id}`, "profile"],
  [`/api/evidence-summary?id=${alice.id}`, "evidence summary"],
  [`/api/evidence?id=${alice.id}`, "the evidence read door"],
  [`/api/next?id=${alice.id}`, "the next-action engine"],
  [`/api/path?id=${alice.id}`, "the learning path"],
  [`/api/my-pack?id=${alice.id}`, "the personal pack"],
  [`/api/classes?me=${alice.id}`, "the class roster"],
];
for (const [path, name] of idOnlyDoors) {
  const r = await call(path);
  ok(r.status !== 200, `${name}: an id with no secret is refused`, `got HTTP ${r.status}`);
}
const wrong = await call(`/api/evidence?id=${alice.id}&secret=not-alices-secret`);
ok(wrong.status === 401, "the evidence door refuses a wrong secret", `got HTTP ${wrong.status}`);

// ── 2. One learner cannot read another's ledger ──────────────────────────────
group("2 · learner A's evidence is invisible to learner B");
const crossRead = await authedGet(`/api/evidence?id=${alice.id}`, bob.id);
ok(crossRead.status === 401, "B's valid secret cannot read A's ledger", `got HTTP ${crossRead.status}`);
const crossSummary = await authedGet(`/api/evidence-summary?id=${alice.id}`, bob.id);
ok(crossSummary.status === 401, "B's valid secret cannot read A's evidence summary", `got HTTP ${crossSummary.status}`);
const crossNext = await authedGet(`/api/next?id=${alice.id}`, bob.id);
ok(crossNext.status === 401, "B's valid secret cannot ask for A's next action", `got HTTP ${crossNext.status}`);

// The sync door is a WRITE about a named learner. A batch naming A, posted with
// B's secret, must not land in A's ledger.
const crossWrite = await call("/api/evidence", json({
  id: alice.id, secret: bob.secret,
  events: [{ type: "answer_submitted", learnerId: alice.id, id: "perm-cross-1" }],
}));
ok(crossWrite.status === 401, "B's secret cannot append to A's ledger", `got HTTP ${crossWrite.status}`);
// …and A's own read still shows no such event, so the refusal was real and not
// merely a status code.
const afterCross = await authedGet(`/api/evidence?id=${alice.id}`, alice.id);
const leaked = Array.isArray(afterCross.body?.events)
  && afterCross.body.events.some((e) => e.id === "perm-cross-1");
ok(!leaked, "and the refused event is genuinely absent from A's ledger");

// ── 3. Class membership governs the roster, not the caller's word ────────────
group("3 · a class answers only a member (and hides its join code)");
const teacher = await newProfile({ handle: "perm_teacher", country: "GB", language: "en", subjects: ["maths"] });
const stranger = await newProfile({ handle: "perm_stranger", country: "GB", language: "en", subjects: ["maths"] });
const made = await authedPost("/api/classes", { action: "create", name: "Permissions 10A", subject: "maths" }, teacher.id);
ok(made.status === 200 && made.body?.cls?.id, "a teacher creates a class");
const cls = made.body.cls;
const joinCode = cls.joinCode;
ok(typeof joinCode === "string" && joinCode.length >= 4, "the class carries a join code");

const joined = await authedPost("/api/classes", { action: "join", joinCode, handle: "perm_student" }, bob.id);
ok(joined.status === 200, "a learner joins by code");

// The roster door names the CALLER in `me` and the CLASS in `id`; both are sent,
// which is the shape the route actually reads.
const classRead = (caller) =>
  call(`/api/classes?me=${caller.id}&id=${cls.id}&secret=${encodeURIComponent(caller.secret)}`);
const studentRead = await classRead(bob);
ok(studentRead.status === 200 && studentRead.body?.cls?.id === cls.id, "a member reads the class roster", `got HTTP ${studentRead.status}`);
const teacherRead = await classRead(teacher);
ok(teacherRead.status === 200, "the teacher (also a member) reads it", `got HTTP ${teacherRead.status}`);
const strangerRead = await classRead(stranger);
ok(strangerRead.status === 403, "a non-member is refused with 403, not shown the class", `got HTTP ${strangerRead.status}`);
ok(!JSON.stringify(strangerRead.body ?? {}).includes(joinCode), "and the refusal body does not leak the join code");
const anonRead = await call(`/api/classes?id=${cls.id}`);
ok(anonRead.status !== 200, "an anonymous caller cannot read a class by id", `got HTTP ${anonRead.status}`);

// ── 4. Only the class's OWNER may change it or set its work ──────────────────
group("4 · teacher authority: the owner, and only the owner");
const studentEdit = await authedPost("/api/classes", { action: "update", clsId: cls.id, subject: "physics" }, bob.id);
ok(studentEdit.status === 403, "a non-owner cannot edit the class's curriculum", `got HTTP ${studentEdit.status}`);
const studentAssign = await authedPost("/api/assignments", {
  action: "create", clsId: cls.id, subject: "maths",
  conceptIds: ["linear-equations"], title: "Not yours to set", dueAt: Date.now() + 86_400_000,
}, bob.id);
ok(studentAssign.status === 403, "a non-owner cannot set the class work", `got HTTP ${studentAssign.status}`);
const teacherAssign = await authedPost("/api/assignments", {
  action: "create", clsId: cls.id, subject: "maths",
  conceptIds: ["linear-equations"], title: "Owner's work", dueAt: Date.now() + 86_400_000,
}, teacher.id);
ok(teacherAssign.status === 200 && teacherAssign.body?.assignment?.id, "the owner sets work successfully");

// A student receives their OWN row and no monitor; the owner receives the
// monitor. That asymmetry is the leak the brief warns about, stated as a test.
const studentView = await authedGet("/api/assignments?me=" + bob.id, bob.id);
ok(studentView.status === 200, "a student reads their assigned work");
ok(Array.isArray(studentView.body?.monitor) && studentView.body.monitor.length === 0,
  "and receives NO monitor of the class");
const teacherView = await authedGet("/api/assignments?me=" + teacher.id, teacher.id);
ok(Array.isArray(teacherView.body?.monitor) && teacherView.body.monitor.length >= 1,
  "the owner receives a monitor for the class they own");

// ── 5. The aggregate report is gated by its publisher key, when set ──────────
group("5 · the aggregate impact report honours its publisher key");
const impactKey = process.env.OPENMIND_IMPACT_KEY;
const impactNoKey = await call("/api/impact");
if (impactKey) {
  ok(impactNoKey.status === 401, "with OPENMIND_IMPACT_KEY set, an unkeyed request is refused", `got HTTP ${impactNoKey.status}`);
  const impactWithKey = await call(`/api/impact?key=${encodeURIComponent(impactKey)}`);
  ok(impactWithKey.status === 200, "and the keyed request succeeds");
} else {
  ok(impactNoKey.status === 200, "with no key configured the report is open (a documented single-school default)");
  ok(impactNoKey.body?.containsIndividualData !== true,
    "but it still carries no individual learner data (aggregate by construction)");
}

// ── 6. The session is the server's decision, and sign-out is real ────────────
group("6 · session authority is server-side, and sign-out revokes");
const email = `perm_${Date.now().toString(36)}@example.org`;
const signup = await call("/api/auth/signup", json({
  email, password: "a-long-enough-password", name: "Perm Learner", role: "student",
}));
ok(signup.status === 200, "sign-up succeeds");
const setCookie = signup.headers.get("set-cookie") ?? "";
ok(/HttpOnly/i.test(setCookie), "the session cookie is HttpOnly (a script cannot read it)");
ok(/Path=\//i.test(setCookie), "the session cookie is scoped to the whole app");
const cookie = setCookie.split(";")[0];
ok(cookie.startsWith("om_session="), "the session cookie is the one the routes read");

const meWith = await call("/api/auth/me", { headers: { cookie } });
ok(meWith.status === 200 && meWith.body?.account?.email === email, "the cookie alone identifies the account");
const meWithout = await call("/api/auth/me");
ok(meWithout.body?.account === null || meWithout.body?.account === undefined,
  "and with no cookie there is no account (never a guessed one)");

const logout = await call("/api/auth/logout", { method: "POST", headers: { cookie, "Content-Type": "application/json" }, body: "{}" });
ok(logout.status === 200, "sign-out succeeds");
const meAfter = await call("/api/auth/me", { headers: { cookie } });
ok(!meAfter.body?.account, "the OLD cookie no longer authenticates — sign-out is a server decision, not a client courtesy");

console.log(`\n${"─".repeat(58)}`);
console.log(`PERMISSIONS: ${pass} passed, ${fail} failed`);
if (fail) for (const b of bad) console.log(`  · ${b}`);
process.exit(fail ? 1 : 0);
