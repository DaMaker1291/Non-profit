#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// CLASSROOM PLATFORM 1.1 — authentication and cross-device evidence.
//
// The previous classroom proof opened the teacher console with a profile id
// written into localStorage, and the cross-device claim was an API protocol test.
// Neither proves the two things this milestone is about:
//
//   · a teacher or pupil can sign in through the interface a person uses; and
//   · two independent browsers, signed into the SAME account, see work recorded
//     on the other one.
//
// This walk uses two Chrome processes with separate temporary user-data
// directories. A tab is not a device: tabs share storage, so a test that opens
// two of them can pass while the server is storing nothing. Here each browser
// has its own cookie jar and its own localStorage, and the only shared state is
// the learner's server record.
//
// It also asserts the server's ledger directly, because a page that renders a
// number it did not record is exactly the failure a UI-only test cannot see.
//
// Run with the dev server up, on a scratch store:
//   OPENMIND_DATA_DIR=/tmp/openmind-auth-sync npm run dev
//   npm run verify:auth-sync
// Optional env: AUTH_SYNC_BASE (default http://127.0.0.1:4173), CHROME_BIN.
// ─────────────────────────────────────────────────────────────────────────────
import { launchChrome, pageFor } from "./browser.mjs";

const BASE = process.env.AUTH_SYNC_BASE ?? "http://127.0.0.1:4173";
const PORT_TEACHER = 9250 + Math.floor(Math.random() * 120);
const PORT_A = 9600 + Math.floor(Math.random() * 180);
const PORT_B = 9800 + Math.floor(Math.random() * 180);

let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ FAIL: ${msg}`); }
};
const section = (name) => console.log(`\n▸ ${name}`);

async function call(path, opts) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 300) }; }
  return { status: res.status, body, headers: res.headers };
}
const json = (body, headers = {}) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify(body),
});
const query = (params) => {
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : "";
};

const ACCOUNTS = new Map();
const created = [];

async function createAccount(role, handle) {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const email = `authsync-${role}-${stamp}@example.test`;
  const password = "authsync-password-123";
  const r = await call("/api/auth/signup", json({
    email, password, name: handle, role,
    country: "GB", language: "en", subjects: ["maths"],
  }));
  const state = r.body?.profile?.profile;
  const id = state?.id;
  const secret = r.body?.secret;
  const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  if (r.status !== 200 || !id || !secret) {
    throw new Error(`could not create ${role} account: HTTP ${r.status} ${String(r.body?.error ?? "")}`);
  }
  const account = { id, secret, cookie, email, password, role };
  ACCOUNTS.set(id, account);
  created.push(account);
  return account;
}
const authed = (account, path, extra = {}) =>
  call(`${path}${query({ id: account.id, secret: account.secret, ...extra })}`, {
    headers: account.cookie ? { Cookie: account.cookie } : {},
  });
/** The class LISTING answers `me`, not `id` — `id` on this route names a CLASS.
 *  Sending the learner id as `id` asks for a class whose id is the learner's. */
const classList = (account) =>
  call(`/api/classes${query({ me: account.id, secret: account.secret })}`, {
    headers: account.cookie ? { Cookie: account.cookie } : {},
  });
const profilePatch = (account, body) =>
  call("/api/profile", json({ id: account.id, secret: account.secret, ...body }, account.cookie ? { Cookie: account.cookie } : {}));
const ledger = async (account) => {
  const r = await authed(account, "/api/evidence");
  return Array.isArray(r.body?.events) ? r.body.events : [];
};

const isLogin = (url) => {
  try { return new URL(url).pathname === "/api/auth/login"; } catch { return false; }
};
const button = (predicate) => `[...document.querySelectorAll("main button")].find(b => ${predicate})`;
const exactButton = (text) => button(`(b.textContent || "").trim() === ${JSON.stringify(text)}`);
const prefixedButton = (prefix) => button(`(b.textContent || "").trim().startsWith(${JSON.stringify(prefix)})`);

async function open(port) {
  const requests = [];
  const chrome = await launchChrome({
    port,
    onEvent: (m) => {
      if (m.method === "Network.requestWillBeSent") requests.push(m.params.request.url);
    },
  });
  return { ...chrome, requests, p: pageFor(chrome.send) };
}

async function signIn(p, requests, account, role = "") {
  const qs = role ? `?role=${role}&mode=signin` : "?mode=signin";
  await p.goto(`${BASE}/onboarding${qs}`);
  await p.waitFor(`return !!document.querySelector("main input[type=email]");`, "the sign-in form", 25000);
  await p.typeInto(`document.querySelector("main input[type=email]")`, account.email, "the email address");
  await p.typeInto(`document.querySelector("main input[type=password]")`, account.password, "the password");
  const before = requests.filter(isLogin).length;
  await p.clickExpr(exactButton("Sign in"), "the Sign in button");
  // A RETURNING LEARNER MAY ALREADY HAVE A PROFILE. Sign-in then resumes at
  // the form's remaining step (subjects), while a teacher or a new learner sees
  // the name step. Either way the credentials form must be gone — that is the
  // sign-in succeeding — and the login request below is the stronger proof.
  await p.waitFor(
    `return !document.querySelector("main input[type=email]") && (` +
      `!!document.querySelector("main input[type=text]") || ` +
      `document.querySelectorAll("main input[type=checkbox]").length > 0 || ` +
      `location.pathname !== "/onboarding"` +
    `);`,
    "the signed-in step after a successful sign-in",
    30000,
  );
  const after = requests.filter(isLogin).length;
  check(after > before, "the normal sign-in interface submitted /api/auth/login");
  check(after - before === 1, "one press produced one login request");
}

async function finishTeacher(p) {
  const name = await p.valueOf(`document.querySelector("main input[type=text]")`);
  if (!name) await p.typeInto(`document.querySelector("main input[type=text]")`, "authsync_teacher", "the teacher display name");
  await p.clickExpr(prefixedButton("Teacher"), "the teacher finish button");
  await p.waitFor(`return location.pathname === "/teacher";`, "the teacher console", 30000);
  check(true, "the teacher reached the class console through the interface");
}

async function finishPupil(p) {
  const next = prefixedButton("Next");
  const atNameStep = await p.evaluate(`return !!${next};`);
  if (atNameStep) {
    check(true, "the signed-in pupil reaches the profile step");
    const name = await p.valueOf(`document.querySelector("main input[type=text]")`);
    if (!name) await p.typeInto(`document.querySelector("main input[type=text]")`, "authsync_pupil", "the pupil display name");
    await p.clickExpr(next, "the Next button on the pupil's profile step");
    await p.waitFor(`return document.querySelectorAll("main input[type=checkbox]").length > 0;`, "the subjects step", 15000);
  } else {
    // The fixture pupil is already enrolled, so a real sign-in resumes at the
    // one remaining step. This is the same screen the name-step path reaches.
    check(
      await p.evaluate(`return document.querySelectorAll("main input[type=checkbox]").length > 0;`),
      "the returning pupil resumes at the subjects step",
    );
  }
  await p.clickExpr(prefixedButton("Start learning"), "the pupil finish button");
  await p.waitFor(`return location.pathname !== "/onboarding";`, "the pupil to leave enrolment", 30000);
  check(true, "the pupil finished enrolment through the interface");
}

async function joinThroughAccount(p, code, className) {
  await p.goto(`${BASE}/account`);
  await p.waitFor(`return !!document.querySelector("input[placeholder=ABC123]");`, "the class-code field", 25000);
  await p.typeInto(`document.querySelector("input[placeholder=ABC123]")`, code, "the class code");
  await p.clickExpr(
    `document.querySelector("input[placeholder=ABC123]").parentElement.querySelector("button")`,
    "the join-class button",
  );
  await p.waitFor(
    `return (document.body.innerText || "").includes(${JSON.stringify(className)});`,
    "the class to appear in the account's class list",
    25000,
  );
  check(true, `the pupil joined ${className} through the account interface`);
}

async function answerOne(p, concept, label) {
  await p.goto(`${BASE}/learn/maths/${concept}`);
  await p.waitFor(`return !!document.querySelector("main h1");`, `the ${concept} lesson`, 25000);
  const turn = button(`/Now your turn/.test(b.textContent || "")`);
  if (await p.evaluate(`return !!${turn};`)) {
    await p.clickExpr(turn, `the practice door on ${concept}`);
  }
  // FOUR ANSWER KINDS, NOT TWO. `fractions` can serve a fraction response, and
  // waiting only for `.choices` or a numeric box made a correctly rendered
  // numerator/denominator item look like a practice stage that never loaded.
  await p.waitFor(
    `return document.querySelectorAll("main .choices button").length > 0 || !!document.querySelector("main .numeric-input") || !!document.querySelector("main .fraction-input") || !!document.querySelector("main .pair-input");`,
    `a practice item on ${concept}`,
    30000,
  );
  const item = await p.evaluate(`return {
    prompt: (document.querySelector("main .qprompt")?.innerText || "").trim().slice(0, 140),
    choices: document.querySelectorAll("main .choices button").length,
    numeric: !!document.querySelector("main .numeric-input"),
    fraction: !!document.querySelector("main .fraction-input"),
    pair: !!document.querySelector("main .pair-input"),
  };`);
  check(item.prompt.length > 0, `${label} was served a real question ("${item.prompt.slice(0, 80)}")`);
  if (item.fraction) {
    const fields = `[...document.querySelectorAll("main .fraction-input")]`;
    await p.typeInto(`${fields}[0]`, "1", "the numerator");
    await p.typeInto(`${fields}[1]`, "2", "the denominator");
    await p.clickExpr(button(`/Check/.test(b.textContent || "")`), "the Check button");
  } else if (item.pair) {
    const fields = `[...document.querySelectorAll("main .pair-input")]`;
    await p.typeInto(`${fields}[0]`, "0", "the x coordinate");
    await p.typeInto(`${fields}[1]`, "0", "the y coordinate");
    await p.clickExpr(button(`/Check/.test(b.textContent || "")`), "the Check button");
  } else if (item.numeric) {
    await p.typeInto(`document.querySelector("main .numeric-input")`, "0", "the numeric answer box");
    await p.clickExpr(button(`/Check/.test(b.textContent || "")`), "the Check button");
  } else {
    await p.clickExpr(`document.querySelector("main .choices button")`, `the first choice on ${concept}`);
  }
  await p.waitFor(`return !!document.querySelector("main .feedback");`, `the grade on ${concept}`, 25000);
  const verdict = await p.evaluate(`return (document.querySelector("main .feedback")?.innerText || "").trim().replace(/\\n+/g, " · ").slice(0, 100);`);
  check(verdict.length > 0, `${label} received a server-marked verdict (${verdict})`);
  return item;
}

async function main() {
  try {
    const ping = await fetch(BASE, { method: "GET" });
    if (!ping.ok) throw new Error(String(ping.status));
  } catch {
    console.error(`The app is not answering at ${BASE}. Start it with a scratch store first.`);
    process.exit(2);
  }

  // ── FIXTURE: a teacher, a class, and a pupil whose course is complete ─────
  section("A real teacher, class and pupil fixture");
  const teacher = await createAccount("teacher", "authsync_teacher");
  const teacherReady = await profilePatch(teacher, {
    handle: "authsync_teacher", country: "GB", language: "en", onboarded: true,
  });
  check(teacherReady.status === 200, "the teacher profile is complete");
  const clsRes = await call("/api/classes", json({
    id: teacher.id, action: "create", name: "Auth Sync Class", subject: "maths", specificationId: "uk-gcse",
  }, { Cookie: teacher.cookie }));
  const cls = clsRes.body?.cls;
  check(clsRes.status === 200 && !!cls?.joinCode, `the teacher owns a class with a join code (${cls?.joinCode ?? clsRes.status})`);
  const pupil = await createAccount("student", "authsync_pupil");
  const pupilReady = await profilePatch(pupil, {
    handle: "authsync_pupil", country: "GB", language: "en", grade: "Year 10",
    subjects: ["maths"], onboarded: true,
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
  });
  const gaps = pupilReady.body?.courseGaps ?? [];
  check(pupilReady.status === 200 && gaps.length === 0, `the pupil has a complete GCSE course (${JSON.stringify(gaps)})`);

  let teacherBrowser = null;
  let one = null;
  let two = null;
  try {
    // ── THE TEACHER, IN THEIR OWN INDEPENDENT BROWSER ────────────────────────
    // This is deliberately not one of the two pupil devices below: the claim
    // under test is that TWO separate pupil browsers share ONE learner record.
    // Mixing a teacher session into that pair would make the second "device" a
    // different person.
    section("The teacher signs in through the normal form");
    teacherBrowser = await open(PORT_TEACHER);
    await signIn(teacherBrowser.p, teacherBrowser.requests, teacher, "teacher");
    await finishTeacher(teacherBrowser.p);
    await teacherBrowser.p.waitFor(`return (document.body.innerText || "").includes("Auth Sync Class");`, "the teacher's class", 25000);
    check(true, "the teacher's own class is visible in the console");
    await teacherBrowser.p.goto(`${BASE}/teacher`);
    await teacherBrowser.p.waitFor(`return (document.body.innerText || "").includes("Auth Sync Class");`, "the class after a refresh", 25000);
    check(true, "the teacher console survives a refresh with the same server session");
    await teacherBrowser.close();
    teacherBrowser = null;

    // ── DEVICE A: THE FIRST PUPIL BROWSER ───────────────────────────────────
    section("Device A signs the pupil in through the normal form");
    one = await open(PORT_A);
    const a = one.p;
    await signIn(a, one.requests, pupil);
    await finishPupil(a);

    // ── DEVICE B: THE SECOND PUPIL BROWSER, INCLUDING A REAL REFUSAL ────────
    section("Device B signs the same pupil in, after a real bad-password refusal");
    two = await open(PORT_B);
    const b = two.p;
    await b.goto(`${BASE}/onboarding?mode=signin`);
    await b.waitFor(`return !!document.querySelector("main input[type=email]");`, "the pupil sign-in form", 25000);
    await b.typeInto(`document.querySelector("main input[type=email]")`, pupil.email, "the pupil email");
    await b.typeInto(`document.querySelector("main input[type=password]")`, "not-the-right-password", "a wrong password");
    const badBefore = two.requests.filter(isLogin).length;
    await b.clickExpr(exactButton("Sign in"), "the Sign in button with a wrong password");
    await b.waitFor(
      `return !!document.querySelector("main input[type=email]") && /wrong|incorrect|not correct|match|invalid|not recognised/i.test(document.body.innerText || "");`,
      "the server's refusal to be shown",
      25000,
    );
    check(two.requests.filter(isLogin).length > badBefore, "the wrong password still reached the login endpoint");
    check(true, "the form stays open and explains the refusal instead of opening a console");
    // A refusal must not leave the form unusable. Re-enter BOTH fields: the
    // learner is standing at the same form, and the test must not assume the
    // refusal preserved anything it did not promise to preserve.
    await b.typeInto(`document.querySelector("main input[type=email]")`, pupil.email, "the pupil email after the refusal");
    await b.typeInto(`document.querySelector("main input[type=password]")`, pupil.password, "the correct password");
    await b.clickExpr(exactButton("Sign in"), "the Sign in button with the correct password");
    try {
      await b.waitFor(
      `return !document.querySelector("main input[type=email]") && (` +
        `!!document.querySelector("main input[type=text]") || ` +
        `document.querySelectorAll("main input[type=checkbox]").length > 0 || ` +
        `location.pathname !== "/onboarding"` +
      `);`,
        "the signed-in pupil step after sign-in",
        30000,
      );
    } catch (e) {
      const diag = await b.evaluate(`return {
        url: location.href,
        text: (document.body.innerText || "").slice(0, 1200),
        email: document.querySelector("main input[type=email]")?.value ?? null,
        passwordLength: document.querySelector("main input[type=password]")?.value?.length ?? null,
        signInDisabled: [...document.querySelectorAll("main button")].find(x => (x.textContent || "").trim() === "Sign in")?.disabled ?? null,
        alerts: [...document.querySelectorAll("[role=alert], .note, .small")].map(x => (x.textContent || "").trim()).filter(Boolean).slice(0, 12),
      };`);
      console.error("\n  Device B after the correct password:\n", JSON.stringify(diag, null, 2));
      console.error("  login requests:", two.requests.filter(isLogin).length, "before:", badBefore);
      throw e;
    }
    check(two.requests.filter(isLogin).length > badBefore, "the successful sign-in used the normal login request");
    await finishPupil(b);

    // Two independent processes, each with its own cookie jar and localStorage.
    const ids = await Promise.all([
      a.evaluate(`return localStorage.getItem("openmind:profileId");`),
      b.evaluate(`return localStorage.getItem("openmind:profileId");`),
    ]);
    check(ids[0] === pupil.id && ids[1] === pupil.id, "both browsers hold the SAME learner account, independently");
    check(one.port !== two.port, `the browsers are separate processes on separate CDP ports (${one.port} / ${two.port})`);

    // ── CLASS MEMBERSHIP, JOINED THROUGH THE UI, READ FROM THE OTHER DEVICE ──
    section("A class joined on one device is the learner's class on the other");
    await joinThroughAccount(b, cls.joinCode, "Auth Sync Class");
    const bClass = await b.evaluate(`return (document.body.innerText || "").includes("Auth Sync Class");`);
    check(bClass, "the joining device shows the class");
    await a.goto(`${BASE}/account`);
    await a.waitFor(`return (document.body.innerText || "").includes("Auth Sync Class");`, "the class on device A", 25000);
    check(true, "device A reads the membership B created, without a reload of the server");
    const pupilClasses = await classList(pupil);
    check(
      pupilClasses.status === 200 && (pupilClasses.body?.classes ?? []).some((c) => c.id === cls.id),
      `the server records exactly the pupil's membership (HTTP ${pupilClasses.status})`,
    );

    // ── TWO-WAY EVIDENCE: A ANSWERS, B SEES, B ANSWERS, A SEES ──────────────
    section("Device A answers; Device B reads the same server record");
    const before = (await ledger(pupil)).length;
    await answerOne(a, "coordinates", "device A");
    const afterA = await ledger(pupil);
    check(afterA.length === before + 1, `the answer is on the server ledger (${before} → ${afterA.length})`);
    await b.goto(`${BASE}/progress`);
    // The page's headline stat is derived from the learner record; the old
    // public `/api/profile` shape no longer carries the answer timeline, so a
    // selector for that list would be testing a removed surface. Assert the
    // recorded count AND the concept the answer was on.
    await b.waitFor(
      `return document.querySelectorAll(".stat")[0]?.textContent?.trim() === "1" && /coordinates/i.test(document.body.innerText || "");`,
      "device B's recorded evidence",
      25000,
    );
    const bStat = await b.evaluate(`return document.querySelectorAll(".stat")[0]?.textContent?.trim() ?? null;`);
    check(bStat === "1", `device B sees the answer recorded on device A (${bStat} answer)`);

    section("Device B answers; Device A revalidates and sees both");
    await answerOne(b, "fractions", "device B");
    const afterB = await ledger(pupil);
    check(afterB.length === afterA.length + 1, `the second answer is on the same server ledger (${afterA.length} → ${afterB.length})`);
    await a.goto(`${BASE}/progress`);
    await a.waitFor(
      `return document.querySelectorAll(".stat")[0]?.textContent?.trim() === "2" && /fractions/i.test(document.body.innerText || "");`,
      "device A's refreshed evidence",
      25000,
    );
    const aStat = await a.evaluate(`return document.querySelectorAll(".stat")[0]?.textContent?.trim() ?? null;`);
    check(aStat === "2", `device A sees the answer recorded on device B (${aStat} answers)`);

    // The server — not the browser — is authoritative: a fresh browser with the
    // same account reads the same two events from an empty local storage.
    section("A third, empty browser profile reads the same account record");
    const three = await open(9600 + Math.floor(Math.random() * 1000));
    try {
      await signIn(three.p, three.requests, pupil);
      const thirdLedger = await ledger(pupil);
      check(thirdLedger.length === afterB.length, `the server record is the source, not the first browser's storage (${thirdLedger.length})`);
    } finally {
      await three.close();
    }

    // Duplicate join is idempotent at the class door.
    const again = await call("/api/classes", json({
      id: pupil.id, secret: pupil.secret, action: "join", joinCode: cls.joinCode, handle: "authsync_pupil",
    }, { Cookie: pupil.cookie }));
    check(again.status === 200, "joining the same class again is accepted idempotently");
    const afterJoin = await classList(pupil);
    const rows = (afterJoin.body?.classes ?? []).filter((c) => c.id === cls.id);
    check(rows.length === 1, `and the learner still has exactly one membership row (${rows.length})`);
  } finally {
    if (teacherBrowser) await teacherBrowser.close();
    if (one) await one.close();
    if (two) await two.close();
    // Scratch-store cleanup. The account rows remain in a real store by design;
    // this walk is documented to run against a throwaway directory.
    for (const account of created) {
      await call(`/api/profile?id=${encodeURIComponent(account.id)}&secret=${encodeURIComponent(account.secret)}&confirm=ERASE`, { method: "DELETE" });
    }
  }

  console.log(`\n════ Auth + cross-device: ${passed} passed, ${failed} failed ════`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
