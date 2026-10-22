#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// ▸ THE CLASSROOM IDENTITY MODEL, OVER REAL HTTP.
//
// The shared-device audit measured, against a scratch store, that a LEARNER's
// capability could create a class and then administer it — and that the same two
// strings could read, export and erase any learner on the device's roster. Those
// were behaviours, not hypotheses, and a fix is only a fix if the same requests
// now fail.
//
// This suite therefore drives the REAL routes. It is deliberately HTTP and not a
// unit test of the authority module: the defect was that each route made its own
// decision, so a green module proves nothing about what a door answers.
//
// RUN IT AGAINST A SCRATCH STORE, AND NOWHERE ELSE. It creates accounts, classes
// and learner records. `npm run verify:kiosk` refuses to start without
// OPENMIND_BASE naming the deployment, which is the small speed bump between a
// reviewer and their own data:
//
//     OPENMIND_DATA_DIR=/tmp/om-kiosk npm run dev
//     OPENMIND_BASE=http://127.0.0.1:4173 npm run verify:kiosk
//
// It is read-only with respect to the repository: no files under app/ or lib/ are
// touched, and the store it writes is whatever the server was pointed at.
import { classify, measureHeadroom } from "./disk-headroom.mjs";

const BASE = (process.env.OPENMIND_BASE ?? "").replace(/\/$/, "");
if (!BASE) {
  console.error(
    "verify:kiosk needs OPENMIND_BASE.\n" +
      "  It writes accounts, classes and learners, so it must be pointed at a scratch\n" +
      "  deployment explicitly:  OPENMIND_DATA_DIR=/tmp/om-kiosk npm run dev\n" +
      "                          OPENMIND_BASE=http://127.0.0.1:4173 npm run verify:kiosk",
  );
  process.exit(2);
}

const head = measureHeadroom();
if (head.measured && classify(head.freeMb, head) === "low") {
  // The same bar the e2e suite uses, for the same reason: a full disk disguised
  // as a broken product costs more time than this guard ever will. An
  // UNMEASURABLE volume is reported as such and does not refuse — it is not
  // evidence of headroom, and it is not evidence against it either.
  console.error(`Refusing to run: ${head.freeMb} MB free, below the ${head.lowMb} MB floor.`);
  process.exit(3);
}

let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}
function section(name) {
  console.log(`\n▸ ${name}`);
}

async function call(path, { method = "GET", body, cookie, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, body: json, cookie: res.headers.get("set-cookie") ?? "" };
}
const cookieOf = (r) => (r.cookie || "").split(";")[0];

async function signUp(role, tag) {
  const email = `kiosk-${role}-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const r = await call("/api/auth/signup", {
    method: "POST",
    body: { email, password: "kiosk-audit-password-1", name: `${role} ${tag}`, role, country: "KE", language: "en", subjects: ["maths"] },
  });
  return { r, email, cookie: cookieOf(r), id: r.body?.profile?.profile?.id ?? null };
}

const stamp = `${Date.now()}`;

// ── 1. A TEACHER PROVISIONS A CLASS ──────────────────────────────────────────
section("A teacher account creates a class and provisions two learners");
const teacher1 = await signUp("teacher", `a${stamp}`);
ok(teacher1.r.status === 200, "teacher sign-up succeeds", `status ${teacher1.r.status}`);
ok(Boolean(teacher1.cookie), "sign-up returns a session cookie");

const createdCls = await call("/api/classes", {
  method: "POST",
  cookie: teacher1.cookie,
  body: { action: "create", name: `Kiosk audit ${stamp}`, subject: "maths" },
});
ok(createdCls.status === 200, "a teacher account creates a class", `status ${createdCls.status} ${JSON.stringify(createdCls.body).slice(0, 160)}`);
const clsId = createdCls.body?.cls?.id;
const joinCode = createdCls.body?.cls?.joinCode;
ok(Boolean(clsId && joinCode), "the class carries an id and a join code");
ok(createdCls.body?.cls?.teacherAccountId === teacher1.r.body?.account?.id,
  "the class records the ACCOUNT that may administer it, not just the owner profile");

const provisioned = await call("/api/classes", {
  method: "POST",
  cookie: teacher1.cookie,
  body: { action: "provision", clsId, learners: [{ handle: "Amina" }, { handle: "Baraka" }] },
});
ok(provisioned.status === 200, "the teacher provisions two learners", `status ${provisioned.status} ${JSON.stringify(provisioned.body).slice(0, 160)}`);
const kids = provisioned.body?.learners ?? [];
ok(kids.length === 2 && kids.every((k) => /^\d{6}$/.test(k.pin)), "each learner gets a 6-digit PIN, returned once");
ok(kids.every((k) => k.id && k.handle), "each provisioned learner has an id and a handle");

// ── 2. A LEARNER CAPABILITY IS NOT TEACHER AUTHORITY ─────────────────────────
section("A learner capability cannot act as a teacher (the measured defect)");
const attacker = await call("/api/profile", {
  method: "POST",
  body: { secret: "learner-attacker-secret-0001", handle: "Attacker", country: "KE", language: "en", subjects: ["maths"] },
});
const attackerId = attacker.body?.profile?.id;
const attackerSecret = "learner-attacker-secret-0001";
ok(attacker.status === 200, "a learner profile exists (the attacker)");

const learnerCreate = await call("/api/classes", {
  method: "POST",
  body: { id: attackerId, secret: attackerSecret, action: "create", name: "Learner-made class", subject: "maths" },
});
ok(learnerCreate.status === 401 && learnerCreate.body?.error === "teacher_account_required",
  "a learner's capability cannot create a class", `status ${learnerCreate.status} ${learnerCreate.body?.error}`);

const learnerUpdate = await call("/api/classes", {
  method: "POST",
  body: { id: attackerId, secret: attackerSecret, action: "update", clsId, subject: "physics" },
});
ok(learnerUpdate.status === 401 && learnerUpdate.body?.error === "teacher_account_required",
  "a learner's capability cannot edit a class", `status ${learnerUpdate.status} ${learnerUpdate.body?.error}`);

const learnerRoster = await call(`/api/classes?me=${attackerId}&secret=${attackerSecret}&id=${clsId}`, {});
ok(learnerRoster.status === 403, "a non-member cannot read the class roster", `status ${learnerRoster.status}`);

const learnerEvidence = await call(
  `/api/classes?me=${attackerId}&secret=${attackerSecret}&id=${clsId}&learner=${kids[0]?.id}`,
  {},
);
ok(learnerEvidence.status === 403, "a learner cannot read another learner's evidence", `status ${learnerEvidence.status}`);

const learnerExport = await call(
  `/api/export/oneroster?class=${clsId}&me=${attackerId}&secret=${attackerSecret}`,
  {},
);
ok(learnerExport.status !== 200, "a learner's capability cannot export the class roster", `status ${learnerExport.status}`);

const learnerAssignment = await call("/api/assignments", {
  method: "POST",
  body: {
    id: attackerId,
    secret: attackerSecret,
    clsId,
    action: "create",
    conceptIds: ["fractions"],
    dueAt: Date.now() + 86_400_000,
  },
});
ok(learnerAssignment.status === 401, "a learner cannot set the class's work", `status ${learnerAssignment.status}`);

// ── 3. A TEACHER OF ANOTHER CLASS IS NOT THIS CLASS'S TEACHER ────────────────
section("Teacher B cannot administer teacher A's class");
const teacher2 = await signUp("teacher", `b${stamp}`);
const foreignUpdate = await call("/api/classes", {
  method: "POST",
  cookie: teacher2.cookie,
  body: { action: "update", clsId, subject: "physics" },
});
ok(foreignUpdate.status === 403 && foreignUpdate.body?.error === "not_the_teacher",
  "another teacher is refused by name", `status ${foreignUpdate.status} ${foreignUpdate.body?.error}`);

const foreignRoster = await call(`/api/classes?me=${teacher2.id}&secret=none&id=${clsId}`, { cookie: teacher2.cookie });
ok(foreignRoster.status === 403, "and cannot read its roster", `status ${foreignRoster.status}`);

// ── 4. THE PIN BUYS A SESSION, NOT A CAPABILITY ──────────────────────────────
section("A PIN is exchanged for a short-lived session");
const badPin = await call("/api/kiosk/login", {
  method: "POST",
  body: { joinCode, handle: "Amina", pin: "000000" },
});
ok(badPin.status === 401, "a wrong PIN is refused", `status ${badPin.status}`);

const loginA = await call("/api/kiosk/login", {
  method: "POST",
  body: { joinCode, handle: "Amina", pin: kids[0]?.pin },
});
ok(loginA.status === 200, "the right PIN opens a classroom session", `status ${loginA.status} ${JSON.stringify(loginA.body).slice(0, 160)}`);
const tokenA = loginA.body?.secret;
ok(typeof tokenA === "string" && tokenA.length === 64, "the credential is a session token (64 hex), not the profile id");
ok(loginA.body?.expiresAt > Date.now() && loginA.body?.expiresAt <= Date.now() + 91 * 60 * 1000,
  "and it carries a server-side expiry inside the lesson window");
const kioskIdA = loginA.body?.profile?.profile?.id;

ok((await call(`/api/profile?id=${kioskIdA}&secret=${tokenA}`)).status === 200,
  "the session reads its OWN learner");

// ── 4b. AND IT CAN ACTUALLY LEARN ────────────────────────────────────────────
//
// The first version of this suite proved everything a session may NOT do and
// never that its learner could practise — and MEASURED, they could not: the
// guard inside every mutator compared the token against the record's permanent
// capability, so a PIN sign-in returned 200 and then serve, progress and the
// learner's own evidence all answered 401. A classroom that signs children in
// and refuses them the lesson is not a working identity model, so the lesson
// itself is asserted here, on the real routes, before the restrictions below.
section("A classroom session can actually learn");
const served = await call("/api/progress", {
  method: "POST",
  body: { action: "serve", id: kioskIdA, secret: tokenA, conceptId: "quadratics" },
});
ok(served.status === 200, "it is served practice through its session", `status ${served.status} ${JSON.stringify(served.body).slice(0, 160)}`);
const servedQ = served.body?.question;
// A numeric item names no choices (the learner types), so the contract is "four
// choices OR a typed response" — the served view calls them `choices`, which is
// why this reads the payload rather than assuming the field's name.
const typedItem = servedQ?.responseKind === "numeric";
ok(Boolean(servedQ?.id) && (typedItem || (Array.isArray(servedQ?.choices) && servedQ.choices.length === 4)),
  "with a complete item (four choices, or a typed response)", `${servedQ?.choices?.length} choices`);
ok(Boolean(servedQ) && !("answer" in servedQ) && !("answerIndex" in servedQ) && !("explanation" in servedQ),
  "and the key does not leave the server with the question");

const graded = await call("/api/progress", {
  method: "POST",
  body: {
    action: "answer", id: kioskIdA, secret: tokenA, conceptId: "quadratics",
    questionId: servedQ?.id, submissionId: `kiosk-suite-${stamp}`,
    ...(typedItem ? { numericAnswer: "1" } : { choiceIndex: 0 }),
  },
});
ok(graded.status === 200, "it can answer, and the server grades it", `status ${graded.status} ${JSON.stringify(graded.body).slice(0, 160)}`);
ok(typeof graded.body?.correct === "boolean", "the mark is the server's, not the client's");

const snapshot = await call(`/api/progress?id=${kioskIdA}&secret=${tokenA}&subject=maths`, {});
ok(snapshot.status === 200 && Boolean(snapshot.body?.progress),
  "its progress snapshot reads back", `status ${snapshot.status}`);

const summary = await call(`/api/evidence-summary?id=${kioskIdA}&secret=${tokenA}`, {});
ok(summary.status === 200 && (summary.body?.totals?.answers ?? 0) >= 1,
  "and the answer it just gave is in its own evidence", `status ${summary.status} answers ${summary.body?.totals?.answers}`);
ok(summary.body?.totals?.deviceReported === 0,
  "recorded as observed, not as an offline claim — the session is online", `deviceReported ${summary.body?.totals?.deviceReported}`);

const ledger = await call(`/api/evidence?id=${kioskIdA}&secret=${tokenA}`, {});
ok(ledger.status === 200 && (ledger.body?.total ?? 0) >= 1,
  "its own ledger is readable", `status ${ledger.status}`);

// ── 5. WHAT A CLASSROOM SESSION MAY NOT DO ───────────────────────────────────
section("A classroom session is restricted");
const kioskErase = await call(`/api/profile?id=${kioskIdA}&secret=${tokenA}&confirm=ERASE`, { method: "DELETE" });
ok(kioskErase.status === 403 && kioskErase.body?.error === "kiosk_cannot_erase",
  "it cannot erase a record", `status ${kioskErase.status} ${kioskErase.body?.error}`);

const kioskExport = await call(`/api/my-data?id=${kioskIdA}&secret=${tokenA}`, {});
ok(kioskExport.status === 403 && kioskExport.body?.error === "kiosk_cannot_export",
  "it cannot pull the full personal-data export", `status ${kioskExport.status} ${kioskExport.body?.error}`);

const kioskCreate = await call("/api/classes", {
  method: "POST",
  body: { id: kioskIdA, secret: tokenA, action: "create", name: "Kiosk-made class", subject: "maths" },
});
ok(kioskCreate.status === 401, "it cannot create a class", `status ${kioskCreate.status}`);

const kioskAssign = await call("/api/assignments", {
  method: "POST",
  body: { id: kioskIdA, secret: tokenA, clsId, action: "create", conceptIds: ["fractions"], dueAt: Date.now() + 86_400_000 },
});
ok(kioskAssign.status === 401, "it cannot set work", `status ${kioskAssign.status}`);

const kioskCourse = await call("/api/profile", {
  method: "POST",
  body: { id: kioskIdA, secret: tokenA, spec: "ke-kcse", specLevel: "form4" },
});
ok(kioskCourse.status === 403 && String(kioskCourse.body?.error).startsWith("kiosk_field_locked"),
  "it cannot re-declare the course the teacher provisioned", `status ${kioskCourse.status} ${kioskCourse.body?.error}`);

const kioskGoal = await call("/api/profile", {
  method: "POST",
  body: { id: kioskIdA, secret: tokenA, goal: "finish the term" },
});
ok(kioskGoal.status === 200, "…but it may change a preference of its own", `status ${kioskGoal.status}`);

// ── 6. TWO LEARNERS DO NOT INHERIT EACH OTHER ────────────────────────────────
section("Two learners on one handset, in sequence");
const loginB = await call("/api/kiosk/login", {
  method: "POST",
  body: { joinCode, handle: "Baraka", pin: kids[1]?.pin },
});
ok(loginB.status === 200, "the second learner opens their own session");
const tokenB = loginB.body?.secret;
const kioskIdB = loginB.body?.profile?.profile?.id;
ok(kioskIdA !== kioskIdB, "the two sessions name different learners");

const crossRead = await call(`/api/profile?id=${kioskIdB}&secret=${tokenA}`, {});
ok(crossRead.status === 401, "A's token cannot read B's record by changing the id", `status ${crossRead.status}`);

const crossData = await call(`/api/my-data?id=${kioskIdB}&secret=${tokenB}`, {});
ok(crossData.status === 403, "B's session cannot export B's data either — same restriction", `status ${crossData.status}`);

// ── 7. HAND-BACK ENDS THE SESSION SERVER-SIDE ────────────────────────────────
section("Hand-back ends the session where the client cannot lie about it");
const left = await call("/api/kiosk/leave", { method: "POST", body: { token: tokenA } });
ok(left.status === 200, "the hand-back call is accepted", `status ${left.status}`);
const afterLeave = await call(`/api/profile?id=${kioskIdA}&secret=${tokenA}`, {});
ok(afterLeave.status === 401, "the token is dead on the SERVER, not just cleared locally", `status ${afterLeave.status}`);

// ── 8. A FORGOTTEN PIN IS RE-ISSUED ON THE SAME RECORD ───────────────────────
//
// The ordinary classroom event: a child cannot remember six digits. The answer
// is a NEW secret on the SAME learner — not a second profile, which would split
// their evidence in two — and it must end the sessions the old PIN bought.
section("A re-issued PIN keeps the record and kills the old sessions");
const reissued = await call("/api/classes", {
  method: "POST",
  cookie: teacher1.cookie,
  body: { action: "provision", clsId, learners: [{ id: kioskIdA }] },
});
ok(reissued.status === 200, "the teacher re-issues a PIN for an existing learner", `status ${reissued.status}`);
const newPin = reissued.body?.learners?.[0]?.pin;
const newPinId = reissued.body?.learners?.[0]?.id;
ok(/^\d{6}$/.test(newPin ?? "") && newPinId === kioskIdA,
  "the new credential names the SAME learner", `${newPinId} vs ${kioskIdA}`);
ok(reissued.body?.learners?.[0]?.pin !== kids[0]?.pin, "and it is not the old PIN");

const oldPinNow = await call("/api/kiosk/login", { method: "POST", body: { joinCode, handle: "Amina", pin: kids[0]?.pin } });
ok(oldPinNow.status === 401 || oldPinNow.status === 429, "the old PIN no longer opens a session", `status ${oldPinNow.status}`);
const newPinWorks = await call("/api/kiosk/login", { method: "POST", body: { joinCode, handle: "Amina", pin: newPin } });
ok(newPinWorks.status === 200 && newPinWorks.body?.profile?.profile?.id === kioskIdA,
  "the new PIN opens the same record", `status ${newPinWorks.status}`);
// Kept for the permission matrix below: a LIVE classroom session is one of the
// principals every teacher-only door must refuse, and §7 ended the old token.
const liveKioskToken = newPinWorks.body?.secret;
const keptWork = await call(`/api/progress?id=${kioskIdA}&secret=${newPinWorks.body?.secret}`, {});
ok(keptWork.status === 200 && Boolean(keptWork.body?.progress?.quadratics),
  "and the work recorded under the old PIN is still there", `status ${keptWork.status}`);
const strangerId = await call("/api/classes", {
  method: "POST",
  cookie: teacher1.cookie,
  body: { action: "provision", clsId, learners: [{ id: "prof_not_on_this_roster" }] },
});
ok(strangerId.status === 404 && strangerId.body?.error === "not_a_classroom_learner",
  "a re-issue for a learner this class does not carry is refused, not guessed", `status ${strangerId.status}`);

// ── 9. PIN ATTEMPTS ARE BOUNDED, PER LEARNER ─────────────────────────────────
section("Repeated PIN attempts are rate-limited");
const seen = [];
for (let i = 0; i < 10; i++) {
  const r = await call("/api/kiosk/login", { method: "POST", body: { joinCode, handle: "Amina", pin: "999999" } });
  seen.push(r.status);
}
ok(seen.includes(429), "the budget is spent after repeated wrong PINs", `statuses ${seen.join(",")}`);
const otherStillWorks = await call("/api/kiosk/login", { method: "POST", body: { joinCode, handle: "Baraka", pin: kids[1]?.pin } });
ok(otherStillWorks.status === 200, "one learner's spent budget does not lock a classmate out", `status ${otherStillWorks.status}`);

// ── 10. REVOKING A CREDENTIAL ENDS THE SESSIONS IT NAMED ─────────────────────
section("Revocation reaches the sessions it names");
const revoked = await call("/api/classes", {
  method: "POST",
  cookie: teacher1.cookie,
  body: { action: "revoke", clsId, learnerId: kioskIdB },
});
ok(revoked.status === 200, "the teacher revokes a classroom credential", `status ${revoked.status} ${JSON.stringify(revoked.body).slice(0, 120)}`);
const afterRevoke = await call(`/api/profile?id=${kioskIdB}&secret=${tokenB}`, {});
ok(afterRevoke.status === 401, "and the session it named is dead", `status ${afterRevoke.status}`);
const reLogin = await call("/api/kiosk/login", { method: "POST", body: { joinCode, handle: "Baraka", pin: kids[1]?.pin } });
ok(reLogin.status === 401, "the revoked PIN no longer opens anything", `status ${reLogin.status}`);

// ── 11. THE TEACHER'S OWN CREDENTIAL IS NOT A CLASSROOM ONE ──────────────────
section("The teacher account keeps its console");
const teacherRoster = await call(`/api/classes?me=${teacher1.id}&secret=none&id=${clsId}`, { cookie: teacher1.cookie });
ok(teacherRoster.status === 200 && Boolean(teacherRoster.body?.cls?.id),
  "the teacher reads the live roster through their session", `status ${teacherRoster.status}`);

// ── 12. THE TEACHER-ONLY SURFACE, AS A MATRIX ────────────────────────────────
//
// A screen that refuses is not a boundary. The defect this whole model exists
// for was an API that said YES, so every teacher-only action and door is asked
// here with each of the five credentials a real deployment can present:
//
//   · the class's teacher ACCOUNT (the only one allowed);
//   · ANOTHER teacher's account (a teacher, not this class's);
//   · the teacher's own PROFILE CAPABILITY — the exact defect, since a
//     capability is a learner credential even when the profile is an adult's;
//   · a learner's capability;
//   · a LIVE classroom session (a PIN sign-in, which is a learner credential);
//   · a signed-in LEARNER ACCOUNT (authenticated, wrong role).
//
// Each door names the refusal, because the browser has a different instruction
// for each one: sign in, this is not your class, or this is not a teacher.
section("The teacher-only surface, as a matrix");
const studentAccount = await signUp("student", `matrix${stamp}`);
const matrixPin = await call("/api/classes", {
  method: "POST",
  cookie: teacher1.cookie,
  body: { action: "provision", clsId, learners: [{ handle: "MatrixKid" }] },
});
const matrixKid = matrixPin.body?.learners?.[0];
ok(matrixPin.status === 200 && Boolean(matrixKid?.pin), "a learner exists for the matrix's targets");

const PRINCIPALS = {
  owner: { cookie: teacher1.cookie },
  foreign: { cookie: teacher2.cookie },
  teacherCapability: { id: teacher1.id, secret: teacher1.r.body?.secret },
  learnerCapability: { id: attackerId, secret: attackerSecret },
  kiosk: { id: kioskIdA, secret: liveKioskToken },
  studentAccount: { cookie: studentAccount.cookie },
};

const wouldBe = (label, r, status, error) => {
  const seen = `${r.status}${r.body?.error ? `:${r.body.error}` : ""}`;
  ok(r.status === status && (error === undefined || r.body?.error === error),
    `${label} is refused with ${status}${error ? ` ${error}` : ""}`,
    `got ${seen}`);
};
const wouldPass = (label, r) => ok(r.status === 200, `${label} is allowed`, `got ${r.status}${r.body?.error ? `:${r.body.error}` : ""}`);

async function ask(principal, path, { method = "POST", body } = {}) {
  const p = PRINCIPALS[principal];
  // A capability rides in the query on a GET and in the body on a POST — the
  // same two shapes every browser call site uses — so a door is asked with the
  // credential it will actually receive, not with the one that is convenient.
  const url = method === "GET" && p.id
    ? `${path}${path.includes("?") ? "&" : "?"}me=${encodeURIComponent(p.id)}&secret=${encodeURIComponent(p.secret ?? "")}`
    : path;
  return await call(url, {
    method,
    cookie: p.cookie,
    body: body === undefined ? undefined : { ...body, ...(p.id ? { id: p.id, secret: p.secret } : {}) },
  });
}

// create — a teacher account may make its own class; nobody else may make one.
wouldPass("create, by the owner account", await ask("owner", "/api/classes", { body: { action: "create", name: `Matrix owner ${stamp}`, subject: "maths" } }));
wouldPass("create, by another teacher account (a class of their own)", await ask("foreign", "/api/classes", { body: { action: "create", name: `Matrix foreign ${stamp}`, subject: "maths" } }));
wouldBe("create, by the teacher's PROFILE CAPABILITY", await ask("teacherCapability", "/api/classes", { body: { action: "create", name: "Capability class", subject: "maths" } }), 401, "teacher_account_required");
wouldBe("create, by a learner capability", await ask("learnerCapability", "/api/classes", { body: { action: "create", name: "Learner class", subject: "maths" } }), 401, "teacher_account_required");
wouldBe("create, by a classroom session", await ask("kiosk", "/api/classes", { body: { action: "create", name: "Kiosk class", subject: "maths" } }), 401, "teacher_account_required");
wouldBe("create, by a learner ACCOUNT", await ask("studentAccount", "/api/classes", { body: { action: "create", name: "Student class", subject: "maths" } }), 403, "teacher_role_required");

// update — this class. Only its own teacher account.
wouldPass("update, by the owner account", await ask("owner", "/api/classes", { body: { action: "update", clsId, subject: "maths" } }));
wouldBe("update, by another teacher", await ask("foreign", "/api/classes", { body: { action: "update", clsId, subject: "physics" } }), 403, "not_the_teacher");
wouldBe("update, by the teacher's own capability", await ask("teacherCapability", "/api/classes", { body: { action: "update", clsId, subject: "physics" } }), 401, "teacher_account_required");
wouldBe("update, by a classroom session", await ask("kiosk", "/api/classes", { body: { action: "update", clsId, subject: "physics" } }), 401, "teacher_account_required");
wouldBe("update, by a learner ACCOUNT", await ask("studentAccount", "/api/classes", { body: { action: "update", clsId, subject: "physics" } }), 403, "teacher_role_required");

// provision — issuing a printable PIN. The refusal must not carry PINs.
wouldPass("provision, by the owner account", await ask("owner", "/api/classes", { body: { action: "provision", clsId, learners: [{ handle: "MatrixKid2" }] } }));
for (const who of ["foreign", "teacherCapability", "learnerCapability", "kiosk", "studentAccount"]) {
  const r = await ask(who, "/api/classes", { body: { action: "provision", clsId, learners: [{ handle: `MatrixNo${who}` }] } });
  ok(r.status !== 200 && r.body?.learners === undefined,
    `provision, by ${who}: refused and no PIN is printed (${r.status}${r.body?.error ? `:${r.body.error}` : ""})`);
}
wouldBe("provision, by another teacher", await ask("foreign", "/api/classes", { body: { action: "provision", clsId, learners: [{ handle: "Nope" }] } }), 403, "not_the_teacher");

// revoke — destroying a credential.
for (const who of ["foreign", "teacherCapability", "learnerCapability", "kiosk", "studentAccount"]) {
  const r = await ask(who, "/api/classes", { body: { action: "revoke", clsId, learnerId: matrixKid?.id } });
  ok(r.status !== 200, `revoke, by ${who}: refused (${r.status}${r.body?.error ? `:${r.body.error}` : ""})`);
}
wouldBe("revoke, by another teacher", await ask("foreign", "/api/classes", { body: { action: "revoke", clsId, learnerId: matrixKid?.id } }), 403, "not_the_teacher");
wouldPass("revoke, by the owner account", await ask("owner", "/api/classes", { body: { action: "revoke", clsId, learnerId: matrixKid?.id } }));

// ONE MEMBER'S EVIDENCE — the class's teacher only.
const evidencePath = `/api/classes?id=${clsId}&learner=${matrixKid?.id}`;
wouldPass("one learner's evidence, by the owner account", await ask("owner", evidencePath, { method: "GET" }));
wouldBe("one learner's evidence, by another teacher", await ask("foreign", evidencePath, { method: "GET" }), 403);
wouldBe("one learner's evidence, by a classroom session", await ask("kiosk", evidencePath, { method: "GET" }), 403, "not_the_teacher");

// THE ANSWER-KEY PACK AND THE ROSTER EXPORT — teacher documents.
for (const [label, path] of [
  ["the offline pack", `/api/pack-export?id=${clsId}&format=json`],
  ["the OneRoster export", `/api/export/oneroster?class=${clsId}`],
]) {
  wouldPass(`${label}, by the owner account`, await ask("owner", path, { method: "GET" }));
  wouldBe(`${label}, by another teacher`, await ask("foreign", path, { method: "GET" }), 403, "not_the_teacher");
  wouldBe(`${label}, by the teacher's own capability`, await ask("teacherCapability", path, { method: "GET" }), 401, "teacher_account_required");
  wouldBe(`${label}, by a classroom session`, await ask("kiosk", path, { method: "GET" }), 401, "teacher_account_required");
  wouldBe(`${label}, by a learner capability`, await ask("learnerCapability", path, { method: "GET" }), 401, "teacher_account_required");
}

// SETTING THE CLASS'S WORK, and the needs door that proposes it.
const due = Date.now() + 86_400_000;
wouldPass("set work, by the owner account", await ask("owner", "/api/assignments", { body: { action: "create", clsId, conceptIds: ["fractions"], dueAt: due } }));
wouldBe("set work, by another teacher", await ask("foreign", "/api/assignments", { body: { action: "create", clsId, conceptIds: ["ratio"], dueAt: due } }), 403, "not_the_teacher");
wouldBe("set work, by the teacher's own capability", await ask("teacherCapability", "/api/assignments", { body: { action: "create", clsId, conceptIds: ["ratio"], dueAt: due } }), 401, "teacher_account_required");
wouldBe("set work, by a classroom session", await ask("kiosk", "/api/assignments", { body: { action: "create", clsId, conceptIds: ["ratio"], dueAt: due } }), 401, "teacher_account_required");
wouldBe("set work, by a learner ACCOUNT", await ask("studentAccount", "/api/assignments", { body: { action: "create", clsId, conceptIds: ["ratio"], dueAt: due } }), 403, "teacher_role_required");

const needsPath = `/api/needs?cls=${clsId}`;
wouldPass("the needs door, by the owner account", await ask("owner", needsPath, { method: "GET" }));
wouldBe("the needs door, by another teacher", await ask("foreign", needsPath, { method: "GET" }), 403, "not_the_teacher");
wouldBe("the needs door, by the teacher's own capability", await ask("teacherCapability", needsPath, { method: "GET" }), 401, "teacher_account_required");
wouldBe("the needs door, by a classroom session", await ask("kiosk", needsPath, { method: "GET" }), 401, "teacher_account_required");
wouldBe("the needs door, by a learner ACCOUNT", await ask("studentAccount", needsPath, { method: "GET" }), 403, "teacher_role_required");

console.log(`\n${failed === 0 ? "PASS" : "FAIL"}: ${passed} passed, ${failed} failed`);
if (failed) {
  console.log("FAILURES:");
  for (const f of failures) console.log(`  · ${f}`);
}
process.exit(failed === 0 ? 0 : 1);
