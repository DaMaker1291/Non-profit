// ─────────────────────────────────────────────────────────────────────────────
// THE APPLICATION, RUN AGAINST POSTGRES — the check the port contract cannot make.
//
// Runs next dev with OPENMIND_STORE=postgres and a scratch database.
// The scratch data directory must stay EMPTY — an empty directory is the evidence
// that no write went to a file instead of the database.
//
//   OPENMIND_TEST_DATABASE_URL=postgres://user@host/db node scripts/postgres-app-smoke.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = Number(process.env.SMOKE_PORT ?? 4199);
const BASE = `http://127.0.0.1:${PORT}`;
let pass = 0;
let fail = 0;
const check = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};

const json = (body, extra = {}) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...(extra.headers ?? {}) },
  body: JSON.stringify(body),
  ...extra,
});

async function call(path, init) {
  const r = await fetch(BASE + path, { ...init, redirect: "manual" });
  let body = null;
  try { body = await r.json(); } catch { body = null; }
  return { status: r.status, body, cookie: r.headers.get("set-cookie"), type: r.headers.get("content-type") };
}

/**
 * THE ANSWER, IN THE FORM THE SERVE'S OWN ITEM DECLARES.
 *
 * This function did not exist in the previous draft of this script — it was
 * CALLED twice and never defined, so the run died with `ReferenceError:
 * answerFields is not defined` the first time it reached a question. That is the
 * argument for running this file rather than reading it: the whole journey after
 * sign-up had never been exercised.
 *
 * `reveal: true` is honoured outside production (see app/api/progress), so the
 * served item arrives WITH its key and the answer is read from the item's own
 * declared response shape — never guessed from the prompt. Which form is legal is
 * the server's decision (`q.responseKind`), exactly as the route says.
 */
function answerFields(q) {
  if (!q) return {};
  if (q.responseKind === "fraction" && q.answerFraction) {
    return { fractionAnswer: { numerator: String(q.answerFraction.numerator), denominator: String(q.answerFraction.denominator) } };
  }
  if (q.responseKind === "pair" && q.answerPair) {
    return { pairAnswer: { x: String(q.answerPair.x), y: String(q.answerPair.y) } };
  }
  if (q.responseKind === "numeric" && typeof q.answerValue === "number") {
    return { numericAnswer: String(q.answerValue) };
  }
  return { choiceIndex: q.answer };
}

async function startServer(env) {
  const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    cwd: process.cwd(), env, stdio: ["ignore", "pipe", "pipe"], detached: true,
  });
  let log = "";
  child.stdout.on("data", (d) => { log += d; });
  child.stderr.on("data", (d) => { log += d; });
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const r = await fetch(BASE + "/api/ready");
      if (r.ok) return { child, log: () => log };
    } catch { /* not listening yet */ }
  }
  throw new Error(`the server did not answer /api/ready in 120 s:\n${log.slice(-2000)}`);
}

async function stopServer(child) {
  try { process.kill(-child.pid, "SIGTERM"); } catch { try { child.kill("SIGKILL"); } catch { /* gone */ } }
  for (let i = 0; i < 30; i++) {
    try { await fetch(BASE + "/api/ready"); await new Promise((r) => setTimeout(r, 200)); } catch { return; }
  }
}

export async function smoke() {
  const testUrl = (process.env.OPENMIND_TEST_DATABASE_URL ?? "").trim();
  if (!testUrl) { console.log("SKIP app smoke: OPENMIND_TEST_DATABASE_URL is not set."); return 0; }

  // Use the provided database directly - no creation needed
  const dataDir = mkdtempSync(join(tmpdir(), `om-smoke-${Date.now().toString(36)}-`));
  const env = {
    ...process.env,
    OPENMIND_STORE: "postgres",
    DATABASE_URL: testUrl,
    OPENMIND_DATA_DIR: dataDir,
    NODE_ENV: "development",
  };
  // The suite's own variables must not reach the server as configuration — a
  // second DATABASE_URL is how a smoke test writes to the database it was told to
  // keep its hands off.
  delete env.OPENMIND_TEST_DATABASE_URL;
  delete env.OPENMIND_SOURCE_DATA_DIR;
  delete env.OPENMIND_TEST_DATABASE_URL;

  let server;
  const emails = { learner: `smoke-learner-${Date.now()}@example.test`, other: `smoke-other-${Date.now()}@example.test` };
  const password = "smoke-test-password-1";
  let learnerId = null;
  let learnerSecret = null;
  let cookie = null;
  let answered = 0;

  try {
    console.log("\n▸ the app starts on PostgreSQL and writes NOTHING to the data directory");
    server = await startServer(env);
    const ready = await call("/api/ready");
    check("/api/ready answers", ready.status === 200, String(ready.status));
    check("the readiness report names the postgres backend", /postgres/i.test(JSON.stringify(ready.body)), JSON.stringify(ready.body)?.slice(0, 200));

    console.log("\n▸ a learner registers, and the record is a database row");
    const signup = await call("/api/auth/signup", json({
      email: emails.learner, password, name: "Smoke Learner", country: "GB", language: "en", subjects: ["maths"],
    }));
    check("sign-up returns an account", signup.status === 200 && Boolean(signup.body?.account?.id), `${signup.status} ${JSON.stringify(signup.body)?.slice(0, 160)}`);
    learnerId = signup.body?.profile?.profile?.id ?? signup.body?.profile?.id ?? null;
    learnerSecret = signup.body?.secret ?? null;
    // THE COOKIE WAS NEVER CAPTURED HERE, so every authenticated call below ran
    // with an empty Cookie header and this check could only ever fail. Found by
    // reading the script before trusting it: an assertion whose subject is never
    // assigned is not a weak test, it is no test.
    cookie = signup.cookie ?? null;
    check("the account owns a learner record", Boolean(learnerId), String(learnerId));
    check("sign-up sets a session cookie", Boolean(cookie) && /session/i.test(cookie ?? ""), String(cookie).slice(0, 60));

    const signedIn = await call("/api/auth/me", { headers: { Cookie: cookie ?? "" } });
    check("the session is readable with the cookie", signedIn.status === 200, String(signedIn.status));

    const profile = await call(`/api/profile?id=${learnerId}`, { headers: { Cookie: cookie ?? "" } });
    check("the record reads back from the database", profile.status === 200 && profile.body?.profile?.id === learnerId, String(profile.status));

    console.log("\n▸ real work: a question is served, graded, and becomes evidence");
    for (let i = 0; i < 3; i++) {
      const served = await call("/api/progress", json({ action: "serve", id: learnerId, secret: learnerSecret, conceptId: "fractions", reveal: true }, { headers: { Cookie: cookie } }));
      if (served.status !== 200) break;
      const q = served.body?.question;
      if (!q) break;
      const graded = await call("/api/progress", json({
        action: "answer", id: learnerId, secret: learnerSecret, conceptId: "fractions", questionId: q.id, ...answerFields(q, true),
      }, { headers: { Cookie: cookie } }));
      if (graded.status === 200 && graded.body?.correct === true) answered++;
    }
    check("three answers were graded correct", answered === 3, String(answered));

    console.log("\n▸ a teacher creates a class, and a stranger cannot read its roster");
    const teacherEmail = `smoke-teacher-${Date.now()}@example.test`;
    const teacher = await call("/api/auth/signup", json({
      email: teacherEmail, password, name: "Smoke Teacher", role: "teacher", country: "GB", language: "en", subjects: ["maths"],
    }));
    const teacherId = teacher.body?.profile?.profile?.id;
    // The picker is a LEARNER-CAPABILITY door (it names `me` and `secret`), unlike
    // the teacher-only write below it, which reads the session cookie. Both
    // credentials are needed here and only the cookie was being sent.
    const teacherSecret = teacher.body?.secret ?? "";
    const cls = await call("/api/classes", json({ id: teacherId, action: "create", name: "Smoke 7A", subject: "maths" }, { headers: { Cookie: teacher.cookie } }));
    check("a class is created with a join code", cls.status === 200 && /^[A-Z2-9]{6}$/.test(cls.body?.cls?.joinCode ?? ""), JSON.stringify(cls.body)?.slice(0, 160));
    const joinCode = cls.body?.cls?.joinCode;
    const join = await call("/api/classes", json({ id: learnerId, secret: learnerSecret, action: "join", joinCode, handle: "smoke_kid" }, { headers: { Cookie: cookie } }));
    check("the learner joins by code", join.status === 200, `${join.status} ${JSON.stringify(join.body)?.slice(0, 160)}`);

    const other = await call("/api/auth/signup", json({
      email: emails.other, password, name: "Smoke Stranger", country: "GB", language: "en", subjects: ["maths"],
    }));
    const otherId = other.body?.profile?.profile?.id;
    const rosterX = await call(`/api/classes?me=${otherId}&id=${cls.body?.cls?.id}`, { headers: { Cookie: other.cookie } });
    check("a non-member is refused the roster (403)", rosterX.status === 403, String(rosterX.status));
    const profileX = await call(`/api/profile?id=${learnerId}`, { headers: { Cookie: other.cookie } });
    check("another account cannot open this learner's record without its secret", profileX.status === 401, String(profileX.status));

    console.log("\n▸ the other stored entities are rows too, not files beside the database");
    // EVERY DOOR HERE WAS FILE-BACKED UNTIL THIS PASS. The class journey above
    // proved the class and the ledger; these prove the entities a school actually
    // uses day to day — a study room, a shared pack, homework, an export, the
    // learner's own data — and each one wrote a JSON file before it was moved to
    // the port. The `1/0` failure earlier in this project came from exactly this
    // shape: a 200 from the route and no row in the table.
    const classId = cls.body?.cls?.id;

    const room = await call("/api/rooms", json({ action: "create", name: "Smoke room", subject: "maths", conceptIds: ["fractions"], handle: "smoke_kid" }));
    check("a study room is created", room.status === 200 && Boolean(room.body?.room?.id), `${room.status} ${JSON.stringify(room.body)?.slice(0, 140)}`);
    const roomId = room.body?.room?.id;
    const roomJoin = await call("/api/rooms", json({ action: "join", id: roomId, handle: "smoke_other" }));
    check("a second learner joins the room", roomJoin.status === 200 && (roomJoin.body?.room?.members ?? []).length === 2, `${roomJoin.status} ${JSON.stringify(roomJoin.body?.room?.members)}`);
    const roomList = await call("/api/rooms");
    check("the room reads back from the store", (roomList.body?.rooms ?? []).some((r) => r.id === roomId), String(roomList.status));

    const pack = await call("/api/packs", json({ action: "create", id: learnerId, secret: learnerSecret, conceptId: "fractions", title: "Smoke pack", body: "Halve both parts before you add them." }, { headers: { Cookie: cookie } }));
    check("a shared pack is created", pack.status === 200 && Boolean(pack.body?.pack?.id), `${pack.status} ${JSON.stringify(pack.body)?.slice(0, 140)}`);
    const packList = await call("/api/packs?conceptId=fractions");
    check("the pack reads back from the store", (packList.body?.packs ?? []).some((p) => p.id === pack.body?.pack?.id), String(packList.status));

    // HOMEWORK CANNOT BE SET IN THIS BUILD, and the reason is CONTENT, not storage:
    // `assignableConcepts` keeps only lessons whose review state is
    // `approved-for-pilot`, and the product's approval registry is deliberately
    // empty (lib/pilot.ts — "the product always uses the empty real registry"). So
    // this section measures what the door DOES after the migration — the picker
    // reads the class from the store, and the write is refused with a named reason
    // rather than a storage error — instead of asserting a success that no
    // teacher can reach. Reported as an open product finding, not as a pass.
    const picker = await call(`/api/assignments?me=${teacherId}&secret=${teacherSecret}`, { headers: { Cookie: teacher.cookie } });
    const owned = (picker.body?.classes ?? []).find((c) => c.id === classId);
    check("the teacher's picker finds the class in the store", picker.status === 200 && owned?.id === classId, `${picker.status} ${JSON.stringify(picker.body?.classes)?.slice(0, 160)}`);
    check("and reports the course has no approved work yet", Array.isArray(owned?.assignable) && owned.assignable.length === 0 && owned.awaitingReview > 0, JSON.stringify(owned)?.slice(0, 160));
    const homework = await call("/api/assignments", json({ action: "create", clsId: classId, conceptIds: ["fractions"], dueAt: Date.now() + 86_400_000, title: "Smoke homework" }, { headers: { Cookie: teacher.cookie } }));
    check("setting homework is REFUSED for a named reason, not a storage error", homework.status === 400 && /not yet approved/.test(JSON.stringify(homework.body)), `${homework.status} ${JSON.stringify(homework.body)?.slice(0, 140)}`);
    const forLearner = await call(`/api/assignments?me=${learnerId}&secret=${learnerSecret}`);
    check("the learner's own assignment door still answers", forLearner.status === 200 && Array.isArray(forLearner.body?.assigned), String(forLearner.status));

    const oneRoster = await call(`/api/export/oneroster?class=${classId}`, { headers: { Cookie: teacher.cookie } });
    // A OneRoster export is a ZIP PACKAGE, so the assertion is the package, not a
    // substring of a JSON body: the earlier version of this check could never pass.
    check("a OneRoster export is a package for the class", oneRoster.status === 200 && /application\/zip/.test(oneRoster.type ?? ""), `${oneRoster.status} ${oneRoster.type}`);

    const mine = await call(`/api/my-data?id=${learnerId}&secret=${learnerSecret}`, { headers: { Cookie: cookie } });
    check("the learner's own data exports", mine.status === 200, String(mine.status));

    const papers = await call(`/api/paper?list=1&subject=maths&id=${learnerId}&secret=${learnerSecret}`);
    check("the paper list answers from the store", papers.status === 200, `${papers.status} ${JSON.stringify(papers.body)?.slice(0, 140)}`);

    console.log("\n▸ concurrent writes to one learner do not lose a record");
    const concepts = ["fractions", "linear-equations", "quadratics"];
    const parallel = await Promise.all(concepts.map(async (conceptId) => {
      const s = await call("/api/progress", json({ action: "serve", id: learnerId, secret: learnerSecret, conceptId, reveal: true }, { headers: { Cookie: cookie } }));
      if (s.status !== 200) return { status: s.status };
      return call("/api/progress", json({
        action: "answer", id: learnerId, secret: learnerSecret, conceptId, questionId: s.body.question.id, ...answerFields(s.body.question, true),
      }, { headers: { Cookie: cookie } }));
    }));
    check("all three concurrent serves answered", parallel.every((r) => r.status === 200), JSON.stringify(parallel.map((r) => r.status)));
    const afterConcurrent = await call(`/api/profile?id=${learnerId}`, { headers: { Cookie: cookie } });
    check("the record is intact after concurrent writes", afterConcurrent.body?.profile?.id === learnerId);

    const evidence = await call(`/api/evidence-summary?id=${learnerId}&secret=${learnerSecret}`, { headers: { Cookie: cookie } });
    check("the evidence summary reads the ledger back", evidence.status === 200, String(evidence.status));

    console.log("\n▸ the server is KILLED, restarted, and the learner signs in again");
    await stopServer(server.child);
    server = await startServer(env);
    const again = await call("/api/auth/login", json({ email: emails.learner, password }));
    check("sign-in works against the restarted server", again.status === 200, `${again.status} ${JSON.stringify(again.body)?.slice(0, 160)}`);
    const cookie2 = again.cookie ?? cookie;
    const profile2 = await call(`/api/profile?id=${learnerId}`, { headers: { Cookie: cookie2 } });
    check("the same record id is there after the restart", profile2.body?.profile?.id === learnerId, JSON.stringify(profile2.body)?.slice(0, 160));
    const evidence2 = await call(`/api/evidence-summary?id=${learnerId}&secret=${learnerSecret}`, { headers: { Cookie: cookie2 } });
    check("the evidence SURVIVED the restart", evidence2.status === 200 && (evidence2.body?.totals?.answers ?? evidence2.body?.answered ?? 0) >= answered, JSON.stringify(evidence2.body)?.slice(0, 200));

    console.log("\n▸ nothing fell back to a file");
    const stray = existsSync(dataDir) ? readdirSync(dataDir).filter((f) => f.endsWith(".json") || f === "evidence") : [];
    check("the data directory stayed EMPTY", stray.length === 0, stray.join(", "));

    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    const users = await client.query("select count(*)::int as n from users");
    const profiles = await client.query("select count(*)::int as n from profiles");
    const events = await client.query("select count(*)::int as n from evidence_events");
    const classes = await client.query("select count(*)::int as n from classes");
    const members = await client.query("select count(*)::int as n from class_members");
    const roomRows = await client.query("select count(*)::int as n from rooms");
    const packRows = await client.query("select count(*)::int as n from packs");

    await client.end();
    check("three accounts are rows in `users`", users.rows[0].n === 3, String(users.rows[0].n));
    check("three learner records are rows in `profiles`", profiles.rows[0].n === 3, String(profiles.rows[0].n));
    check("the ledger has events", events.rows[0].n >= answered, String(events.rows[0].n));
    check("the class and its membership are rows", classes.rows[0].n === 1 && members.rows[0].n >= 1, `${classes.rows[0].n}/${members.rows[0].n}`);
    check("the room and the pack are rows too",
      roomRows.rows[0].n >= 1 && packRows.rows[0].n >= 1,
      `${roomRows.rows[0].n}/${packRows.rows[0].n}`);
  } finally {
    if (server) await stopServer(server.child);
    if (!process.env.SMOKE_KEEP) rmSync(dataDir, { recursive: true, force: true });
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  return fail === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  smoke().then((c) => process.exit(c)).catch((e) => { console.error(e?.stack ?? String(e)); process.exit(1); });
}
