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

/** The suite's own client address, when it is talking to a server that has
 *  DECLARED a trusted proxy.
 *
 *  Such a server refuses a credential request it cannot attribute (see
 *  lib/server/client-address.ts), which is the whole point of the fail-closed
 *  rule — so a harness testing that deployment has to send the header a real
 *  proxy would. `OPENMIND_TRUSTED_PROXY` in the HARNESS environment is the
 *  signal, and it must match the server's: the two are started from one
 *  command in CI (gates.yml) precisely so they cannot disagree. */
const PROXIED = /^(1|true|yes)$/i.test((process.env.OPENMIND_TRUSTED_PROXY ?? "").trim());
const SUITE_ADDRESS = "198.51.100.42";
function proxied(headers = {}) {
  if (!PROXIED) return headers;
  const has = Object.keys(headers).some((k) => k.toLowerCase() === "x-forwarded-for");
  return has ? headers : { ...headers, "x-forwarded-for": SUITE_ADDRESS };
}

async function call(path, opts) {
  const res = await fetch(BASE + path, opts ? { ...opts, headers: proxied(opts.headers) } : opts);
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
// Teacher authority is the ACCOUNT's (lib/server/authority.ts), so a teacher in
// this suite is a real signup and its cookie rides on every request that names
// it — the same thing a browser does, because same-origin fetch sends the
// session cookie by default. A capability in the same body is still sent (the
// class door ignores it for administration, which is the point asserted below).
const sessions = new Map();
const cookieOf = (id) => (id && sessions.has(id) ? { Cookie: sessions.get(id) } : {});
async function newProfile(body) {
  const secret = `perm-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const r = await call("/api/profile", json({ ...body, secret }));
  const id = r.body?.profile?.id;
  if (id) secrets.set(id, secret);
  return { id, secret, status: r.status };
}
async function newTeacher(body = {}) {
  const email = `perm-teacher-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}@example.org`;
  const r = await call("/api/auth/signup", json({
    email, password: "a-long-enough-password", name: body.handle ?? "Perm Teacher",
    role: "teacher", country: body.country ?? "GB", language: body.language ?? "en",
    subjects: body.subjects ?? ["maths"],
  }));
  const state = r.body?.profile?.profile;
  const id = state?.id;
  const secret = r.body?.secret;
  if (id) {
    if (secret) secrets.set(id, secret);
    const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
    if (cookie) sessions.set(id, cookie);
  }
  return { id, secret, status: r.status };
}
const authedGet = (path, id, secret = secrets.get(id)) =>
  call(`${path}${path.includes("?") ? "&" : "?"}secret=${encodeURIComponent(secret ?? "")}`, { headers: cookieOf(id) });
const authedPost = (path, body, id) =>
  call(path, json({ ...body, id, secret: secrets.get(id) }, cookieOf(id)));

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
const teacher = await newTeacher({ handle: "perm_teacher", country: "GB" });
ok(teacher.status === 200 && Boolean(teacher.id), "a TEACHER ACCOUNT exists (authority is the account's, not a capability's)");
const stranger = await newProfile({ handle: "perm_stranger", country: "GB", language: "en", subjects: ["maths"] });
const made = await authedPost("/api/classes", { action: "create", name: "Permissions 10A", subject: "maths" }, teacher.id);
ok(made.status === 200 && made.body?.cls?.id, "a teacher creates a class");
const cls = made.body.cls;
const joinCode = cls.joinCode;
ok(typeof joinCode === "string" && joinCode.length >= 4, "the class carries a join code");

const joined = await authedPost("/api/classes", { action: "join", joinCode, handle: "perm_student" }, bob.id);
ok(joined.status === 200, "a learner joins by code");
// THE JOIN REPLY IS A READ OF THE CLASS. It handed the joiner every classmate's
// row and the code they had just typed; it answers with their own row now.
ok(joined.body?.cls?.joinCode === "",
  `the join reply carries no join code (${JSON.stringify(joined.body?.cls?.joinCode)})`);
ok(!Object.values(joined.body?.cls?.membersById ?? {}).some((id) => id === teacher.id),
  "and names no other member's learner id");

// The roster door names the CALLER in `me` and the CLASS in `id`; both are sent,
// which is the shape the route actually reads.
const classRead = (caller) =>
  call(`/api/classes?me=${caller.id}&id=${cls.id}&secret=${encodeURIComponent(caller.secret)}`, { headers: cookieOf(caller.id) });
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
// ── 3b. A MEMBER READS THE CLASS, NOT THE CLASS'S MATERIAL ABOUT OTHERS ─────
//
// The roster door used to answer a student with exactly what it answers the
// teacher: the JOIN CODE they had just used, every classmate's measured rate,
// and the live view a teacher's screen is built on. On the shared-device
// deployment this product is written for, that is one child reading another's
// record — so the refusal is asserted as three separate facts rather than as a
// status code, because the status was 200 throughout the defect.
group("3b · a member receives their own row, never the class's material");
const studentOwn = await classRead(bob);
ok(!studentOwn.body?.cls?.joinCode, `a member's class read carries NO join code (${JSON.stringify(studentOwn.body?.cls?.joinCode)})`);
ok(!JSON.stringify(studentOwn.body ?? {}).includes(joinCode), "and the code appears nowhere in the body");
ok(Object.keys(studentOwn.body?.cls?.students ?? {}).length <= 1,
  `their class read holds no peer rows (${Object.keys(studentOwn.body?.cls?.students ?? {}).join(", ") || "none"})`);
ok(Object.keys(studentOwn.body?.cls?.live ?? {}).length <= 1,
  `and no peer's measured evidence (${Object.keys(studentOwn.body?.cls?.live ?? {}).join(", ") || "none"})`);
ok(Object.values(studentOwn.body?.cls?.live ?? {}).every((m) => m.learnerId === bob.id),
  "every live row it does hold is the caller's own");
// …and it is a REAL row: derived from the caller's own ledger by the same
// `deriveLive` the teacher's table uses, not copied out of a roster that does
// not store one. (An empty ledger is a row of zeros with `answers: 0`, which is
// how "unmeasured" is said — never an absence that a table renders as blank.)
ok(studentOwn.body?.cls?.live?.perm_student?.learnerId === bob.id,
  "the member's own live row is derived from their ledger (learnerId " + (studentOwn.body?.cls?.live?.perm_student?.learnerId ?? "absent") + ")");
ok(Array.isArray(studentOwn.body?.cls?.assignments) && studentOwn.body.cls.assignments.length === 0,
  "the class's set work is not read through this door (a member reads their own work from /api/assignments)");

const teacherOwn = await classRead(teacher);
ok(teacherOwn.body?.cls?.joinCode === joinCode, "the teacher's read of the same class still carries the join code");
ok(Object.keys(teacherOwn.body?.cls?.students ?? {}).includes("perm_student"),
  `and the teacher's table still lists the class's students (${Object.keys(teacherOwn.body?.cls?.students ?? {}).join(", ")})`);

// The LIST is the other half: the teacher page decides between the console and
// the door from the server's own answer, so the flag has to be the server's.
const teacherList = await authedGet(`/api/classes?me=${teacher.id}`, teacher.id);
ok(teacherList.body?.teaching === true, "a class's owner is told they teach (teaching: true)");
const studentList = await authedGet(`/api/classes?me=${bob.id}`, bob.id);
ok(studentList.body?.teaching === false, "a member who owns no class is told they do not");
const listed = (studentList.body?.classes ?? []).find((c) => c.id === cls.id);
ok(!!listed, "their class is still listed — membership is enough to see the class itself");
ok(listed?.joinCode === "", `but listed with no join code (${JSON.stringify(listed?.joinCode)})`);
ok(listed?.live?.perm_student?.learnerId === bob.id, "and with the caller's own derived row still in it");
ok(Object.keys(listed?.live ?? {}).length <= 1, "and with no classmate's evidence in it");

// The offline pack carries the week's full question bank WITH its answer key,
// and was answered to any member. It is the teacher's material.
const memberPack = await authedGet(`/api/pack-export?id=${cls.id}&me=${bob.id}&format=json`, bob.id);
ok(memberPack.status === 401 && memberPack.body?.error === "teacher_account_required",
  `a member's capability is not a teacher session, so the answer-key pack is refused (HTTP ${memberPack.status} ${memberPack.body?.error ?? ""})`);
// THE DEFECT, ASKED DIRECTLY: the class owner's own PROFILE CAPABILITY is a
// learner credential even though the profile belongs to an adult. If it were
// authority, a shared handset holding it could administer the class.
const ownerCapabilityPack = await call(`/api/pack-export?id=${cls.id}&me=${teacher.id}&format=json&secret=${encodeURIComponent(teacher.secret ?? "")}`);
ok(ownerCapabilityPack.status === 401 && ownerCapabilityPack.body?.error === "teacher_account_required",
  `the owner's own CAPABILITY cannot download the pack without the account session (HTTP ${ownerCapabilityPack.status} ${ownerCapabilityPack.body?.error ?? ""})`);
const ownerPack = await authedGet(`/api/pack-export?id=${cls.id}&me=${teacher.id}&format=json`, teacher.id);
ok(ownerPack.status === 200, `while the class's teacher still receives it (HTTP ${ownerPack.status})`);

const studentEdit = await authedPost("/api/classes", { action: "update", clsId: cls.id, subject: "physics" }, bob.id);
ok(studentEdit.status === 401 && studentEdit.body?.error === "teacher_account_required",
  "a learner's capability cannot edit the class's curriculum", `got HTTP ${studentEdit.status} ${studentEdit.body?.error ?? ""}`);
const ownerCapabilityEdit = await authedPost("/api/classes", { action: "update", clsId: cls.id, subject: "maths" }, teacher.id);
ok(ownerCapabilityEdit.status === 200,
  "the owner's account CAN (it carries the cookie its capability alone never could)", `got HTTP ${ownerCapabilityEdit.status}`);
const studentAssign = await authedPost("/api/assignments", {
  action: "create", clsId: cls.id, subject: "maths",
  conceptIds: ["linear-equations"], title: "Not yours to set", dueAt: Date.now() + 86_400_000,
}, bob.id);
ok(studentAssign.status === 401 && studentAssign.body?.error === "teacher_account_required",
  "a member's capability cannot set the class work", `got HTTP ${studentAssign.status} ${studentAssign.body?.error ?? ""}`);
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

// ── 7. Guessing a password is bounded, and the bound cannot deny the owner ───
//
// THE ASSERTION THIS SECTION EXISTS FOR IS THE ONE THAT USED TO BE ITS
// OPPOSITE. The first version of the limiter answered 429 to every attempt
// against an account after eight failures — including the account's own correct
// password — and this suite asserted that as a feature. It is a denial of
// service: anyone who knows an email address can keep its owner out for the
// length of the window, on a product where that owner may be a child on a
// shared device. So the last line below now requires the opposite: after the
// attack, the learner whose password is right SIGNS IN.
//
group("7 · the sign-in door bounds attempts without locking a learner out (docs/SECURITY.md §9)");
// A UNIQUE address per run, so this section is independent of every other suite
// that signs in against the same server.
const guessEmail = `rl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}@example.org`;
const realPassword = "a-long-enough-password";
// A REAL account, so the assertions below are about a password that WOULD work:
// bounding a nonexistent address proves much less than bounding a real one.
const seeded = await call("/api/auth/signup", json({
  email: guessEmail, password: realPassword, name: "Rate Limit", role: "student",
}));
ok(seeded.status === 200, "a real account exists to guess against");
const wrongGuess = (email = guessEmail, password = "definitely-not-it") =>
  call("/api/auth/login", json({ email, password }));
const statuses = [];
const elapsed = [];
for (let i = 0; i < 10; i++) {
  const t = Date.now();
  statuses.push((await wrongGuess()).status);
  elapsed.push(Date.now() - t);
}
ok(statuses.slice(0, 8).every((s) => s === 401),
  `the first eight wrong passwords are ordinary refusals (${statuses.slice(0, 8).join(",")})`);
ok(statuses.slice(8).every((s) => s === 401),
  `and the next two are STILL ordinary refusals, not a lockout (${statuses.slice(8).join(",")})`);
// THE PAUSE IS THE BOUND, so it has to be OBSERVED, not just computed: a route
// that forgot to await it would pass every assertion above while the limiter did
// nothing at all. The ninth attempt is the first over budget (the pause starts
// after the eighth failure), and it is compared with the eighth rather than with
// the first so a cold start or a compile is not mistaken for a delay.
ok(elapsed[8] - elapsed[7] >= 200,
  `the ninth attempt is actually made to WAIT — ${elapsed[8]}ms against ${elapsed[7]}ms for the eighth (the soft bound is awaited, not merely computed)`);

// The account is SLOWED, not shut: the correct password works. This is the
// review's finding pinned as the behaviour that must hold.
const correctAfterAttack = await call("/api/auth/login", json({ email: guessEmail, password: realPassword }));
ok(correctAfterAttack.status === 200,
  `the account's OWN correct password still signs in after ten wrong attempts (HTTP ${correctAfterAttack.status})`);
ok(!!correctAfterAttack.headers.get("set-cookie"),
  "and it really is a session — the cookie is issued, not just a 200");

// ONE BUDGET PER ACCOUNT, however the address is typed. Normalisation is the
// rule, so an attacker cannot buy a fresh budget by capitalising the address and
// a learner cannot lose theirs by typing it the way they remember it.
const shouty = `  ${guessEmail.toUpperCase()}  `;
for (let i = 0; i < 9; i++) await wrongGuess(shouty);
const afterShouty = await call("/api/auth/login", json({ email: guessEmail, password: realPassword }));
ok(afterShouty.status === 200,
  `a differently-cased address shares the same budget, and the owner still signs in (HTTP ${afterShouty.status})`);

// The bound is an account's, not the server's: a second account is unaware of it.
const otherEmail = `${guessEmail.split("@")[0]}_b@example.org`;
const other = await wrongGuess(otherEmail);
ok(other.status === 401, `a different account is still answered normally (HTTP ${other.status})`);
// …and an address with no account at all is answered IDENTICALLY, so neither
// the status nor the body says whether the address is registered.
const unknown = await wrongGuess(`nobody_${Date.now().toString(36)}@example.org`);
ok(unknown.status === 401 && unknown.body?.error === other.body?.error,
  `an unregistered address is refused with the same status and error as a wrong password (HTTP ${unknown.status} ${unknown.body?.error ?? ""})`);

// ── 7b. THE SOURCE BOUND, WHEN THE DEPLOYMENT DECLARES A PROXY ──────────────
//
// The address key exists only under OPENMIND_TRUSTED_PROXY=1, and then it is the
// RIGHTMOST x-forwarded-for hop. This suite does not start the server, so it must
// ASK whether the bound is live rather than assume it: distinct unknown accounts
// are used so the per-account pause cannot be mistaken for the source refusal,
// and the loop stops at the first 429.
// NOT `proxied` — that name is the header helper above, and this module is one
// scope. The duplicate declaration was a SyntaxError, so this whole suite failed
// at load with "Identifier 'proxied' has already been declared" and asserted
// nothing; `npm run verify:permissions` is a listed gate, so that is a gate that
// had stopped running rather than a gate that passed.
const proxyAttempts = [];
for (let i = 0; i < 45; i++) {
  const r = await call("/api/auth/login", json(
    { email: `src_${Date.now().toString(36)}_${i}@example.org`, password: "definitely-not-it" },
    { "x-forwarded-for": "198.51.100.7" },
  ));
  proxyAttempts.push(r);
  if (r.status === 429) break;
}
const refusal = proxyAttempts.find((r) => r.status === 429);
if (refusal) {
  ok(refusal.body?.error === "too_many_attempts",
    `a source that spends its budget is refused by the address bound (HTTP ${refusal.status} ${refusal.body?.error ?? ""})`);
  ok(Number(refusal.headers.get("retry-after")) > 0,
    `and says how long to wait in the header a proxy already understands (${refusal.headers.get("retry-after")})`);
  ok(/no-store/i.test(refusal.headers.get("cache-control") ?? ""),
    "and keeps the refusal out of any cache (a cached 429 locks out a learner who just typed the right password)");
} else {
  // NOT A PASS AND NOT A FAILURE: this server has no trusted proxy, so there is
  // no address key to spend — which is itself the documented default. The
  // policy's hard/soft modes and `clientAddress` are driven directly, with an
  // injected clock, in `npm run verify`.
  console.log(`  · source bound not exercised: this server was started without OPENMIND_TRUSTED_PROXY=1, so no address key exists (${proxyAttempts.length} attempts, all ${proxyAttempts[0]?.status ?? "?"})`);
  ok(proxyAttempts.every((r) => r.status === 401),
    "and with no declared proxy a forged x-forwarded-for buys no refusal (a header a client sets is not a limit)");
}

// ── 8. The doors that cost money or CPU are bounded too ─────────────────────
//
// Sign-in was never the expensive door; it was the one shaped like a guess.
// These are shaped like a BILL — every AI turn can be a paid model call, every
// paper submission runs the whole marking analysis, every sync batch writes a
// ledger — and before this section existed nothing measured them at all. Each
// assertion is a 429 that means "stop", plus a second learner who is unaffected
// (a bound that slows the whole school is not a bound, it is an outage).
//
group("8 · a loop on the expensive doors is refused, and only for the learner looping");
const worker = await newProfile({ handle: "perm_loop", country: "GB", language: "en", subjects: ["maths"] });
const bystander = await newProfile({ handle: "perm_bystander", country: "GB", language: "en", subjects: ["maths"] });

// AI: 20 turns a minute per learner.
const aiStatuses = [];
for (let i = 0; i < 21; i++) {
  const r = await authedPost("/api/ai", { conceptId: "fractions", language: "en" }, worker.id);
  aiStatuses.push(r.status);
}
const aiRefused = aiStatuses[20];
ok(aiStatuses.slice(0, 20).every((s) => s === 200),
  `twenty AI turns on one learner are served (${aiStatuses.slice(0, 5).join(",")}…${aiStatuses[19]})`);
ok(aiRefused === 429, `the twenty-first is refused (HTTP ${aiRefused})`);
const aiRefusal = await authedPost("/api/ai", { conceptId: "fractions", language: "en" }, bystander.id);
ok(aiRefusal.status === 200,
  `and a different learner is not affected by it (HTTP ${aiRefusal.status}) — the key is the learner, not the process`);

// UPLOAD: 10 submissions per ten minutes. The request is deliberately INVALID:
// the gate runs before validation, so a 429 here proves the limit is spent
// before the work, which is the only ordering that protects anything.
const uploadStatuses = [];
for (let i = 0; i < 11; i++) {
  const r = await authedPost("/api/my-paper", { action: "create", title: null }, worker.id);
  uploadStatuses.push(r.status);
}
ok(uploadStatuses.slice(0, 10).every((s) => s === 400),
  `ten malformed paper submissions are answered on their merits (${uploadStatuses.slice(0, 3).join(",")}…)`);
ok(uploadStatuses[10] === 429,
  `the eleventh is refused BEFORE validation — the bound is spent before the marking work (HTTP ${uploadStatuses[10]})`);

// SYNC: 60 batches a minute per learner. Empty batches are the cheapest possible
// request, so what is measured is the counter, not the ledger.
const syncStatuses = [];
for (let i = 0; i < 61; i++) {
  const r = await authedPost("/api/evidence", { events: [] }, worker.id);
  syncStatuses.push(r.status);
}
ok(syncStatuses.slice(0, 60).every((s) => s === 200),
  `sixty sync batches drain normally (${syncStatuses.slice(0, 3).join(",")}…)`);
ok(syncStatuses[60] === 429, `the sixty-first is refused (HTTP ${syncStatuses[60]})`);

// AND THE REFUSAL SAYS WHEN. One header, same shape as the sign-in door.
const wait = (await authedPost("/api/evidence", { events: [] }, worker.id)).headers.get("retry-after");
ok(Number(wait) > 0, `the refusal carries Retry-After, like every other bounded door (${wait})`);

console.log(`\n${"─".repeat(58)}`);
console.log(`PERMISSIONS: ${pass} passed, ${fail} failed`);
if (fail) for (const b of bad) console.log(`  · ${b}`);
process.exit(fail ? 1 : 0);
