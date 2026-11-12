#!/usr/bin/env node
// ── ASSIGNMENTS, FROM THE TEACHER'S SCREEN TO TWO PUPILS' SCREENS ──────────
//
// The teacher walk proves the assignment builder and the publication gate. This
// walk proves the part a second account is needed for: two independent pupils
// receive the same assigned lesson, one does it and one does not, and the
// teacher's monitor shows those two states from the pupils' own evidence.
//
// The class and the assignment fixture are created through the API so this walk
// is about delivery, not about repeating the teacher walk's form steps. Both
// pupils and the teacher still sign in through the normal interface, and the
// completion is a real served question answered through the concept page.
//
// Run with the development server on a scratch store, with test approvals on:
//   OPENMIND_DATA_DIR=/tmp/openmind-assign OPENMIND_TEST_CONTENT_APPROVALS=1 npm run dev
//   node scripts/verify-assignment-browser.mjs
import { launchChrome, pageFor } from "./browser.mjs";

const BASE = process.env.ASSIGNMENT_BASE ?? "http://127.0.0.1:4173";
const ports = [11100, 11200, 11300, 11400].map((n) => n + Math.floor(Math.random() * 80));
let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ FAIL: ${msg}`); }
};
const section = (s) => console.log(`\n▸ ${s}`);
const json = (body, cookie = null) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify(body),
});
const qs = (o) => new URLSearchParams(o).toString();
async function call(path, opts) {
  const r = await fetch(BASE + path, opts);
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 300) }; }
  return { status: r.status, body, headers: r.headers };
}
const exactButton = (text) => `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim() === ${JSON.stringify(text)})`;
const prefixedButton = (text) => `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim().startsWith(${JSON.stringify(text)}))`;
const isLogin = (u) => { try { return new URL(u).pathname === "/api/auth/login"; } catch { return false; } };
const created = [];
async function account(role, handle) {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const email = `asg-${role}-${stamp}@example.test`;
  const password = "asg-password-123";
  const r = await call("/api/auth/signup", json({
    email, password, name: handle, role, country: "GB", language: "en", subjects: ["maths"],
  }));
  const id = r.body?.profile?.profile?.id;
  const secret = r.body?.secret;
  const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  if (r.status !== 200 || !id || !secret) throw new Error(`signup ${role}: ${r.status} ${JSON.stringify(r.body)}`);
  const a = { email, password, id, secret, cookie, handle };
  created.push(a);
  return a;
}
const patch = (a, body) => call("/api/profile", json({ id: a.id, secret: a.secret, ...body }, a.cookie));

/** Give a fixture pupil a completed baseline sitting. This is the product's
 *  own diagnostic door, not a route bypass: Home is only reachable after a
 *  sitting has actually been recorded, and the assignment walk is not a
 *  twenty-question diagnostic walk. The event is before the assignment opens,
 *  so it cannot count as assignment work. */
async function seedDiagnostic(a) {
  const start = await call("/api/diagnostic", json({
    id: a.id, secret: a.secret, subject: "maths", action: "start", kind: "baseline",
  }, a.cookie));
  check(start.status === 200, `${a.handle} can open a real baseline diagnostic`);
  const finish = await call("/api/diagnostic", json({
    id: a.id, secret: a.secret, subject: "maths", action: "finish",
  }, a.cookie));
  check(finish.status === 200, `${a.handle} has a recorded diagnostic sitting`);
}

async function open() {
  const requests = [];
  const exceptions = [];
  const chrome = await launchChrome({
    port: ports.pop(),
    onEvent: (m) => {
      if (m.method === "Network.requestWillBeSent") requests.push(m.params.request.url);
      if (m.method === "Runtime.exceptionThrown") exceptions.push(m.params.exceptionDetails?.text ?? "exception");
    },
  });
  return { ...chrome, requests, exceptions, p: pageFor(chrome.send) };
}
async function signIn(p, requests, a) {
  await p.goto(`${BASE}/onboarding?mode=signin`);
  await p.waitFor(`return !!document.querySelector("main input[type=email]");`, "the sign-in form", 25000);
  await p.typeInto(`document.querySelector("main input[type=email]")`, a.email, "the email");
  await p.typeInto(`document.querySelector("main input[type=password]")`, a.password, "the password");
  const before = requests.filter(isLogin).length;
  await p.clickExpr(exactButton("Sign in"), "the Sign in button");
  await p.waitFor(
    `return !document.querySelector("main input[type=email]") && (!!document.querySelector("main input[type=text]") || document.querySelectorAll("main input[type=checkbox]").length > 0 || location.pathname !== "/onboarding");`,
    "the signed-in step",
    30000,
  );
  check(requests.filter(isLogin).length > before, "the normal form sent the login request");
}
async function finishPupil(p) {
  if (await p.evaluate(`return !!${prefixedButton("Next")};`)) {
    await p.clickExpr(prefixedButton("Next"), "the pupil Next button");
    await p.waitFor(`return document.querySelectorAll("main input[type=checkbox]").length > 0;`, "the subjects step", 20000);
  }
  await p.clickExpr(prefixedButton("Start learning"), "the pupil finish button");
  await p.waitFor(`return location.pathname !== "/onboarding";`, "the pupil to leave enrolment", 30000);
  // A new pupil is offered the diagnostic first. Home is legitimately behind
  // it, and "Leave for now" is the product's own way past — not a test URL.
  if ((await p.evaluate(`return location.pathname.startsWith("/diagnostic");`))) {
    const leave = exactButton("Leave for now");
    if (await p.evaluate(`return !!${leave};`)) {
      await p.clickExpr(leave, "Leave for now");
      await p.waitFor(`return !location.pathname.startsWith("/diagnostic");`, "the diagnostic to be left", 25000);
    }
  }
}
async function finishTeacher(p) {
  await p.waitFor(`return !!document.querySelector("main input[type=text]");`, "the teacher name step", 20000);
  await p.clickExpr(prefixedButton("Teacher"), "the teacher finish button");
  await p.waitFor(`return location.pathname === "/teacher";`, "the teacher console", 30000);
}
async function openClass(p, cls) {
  await p.waitFor(`return !!document.querySelector('a.class-card[href="#class-${cls.id}"]');`, "the class card", 25000);
  await p.clickExpr(`document.querySelector('a.class-card[href="#class-${cls.id}"]')`, "the class card");
  await p.waitFor(`return !!document.getElementById("class-${cls.id}");`, "the opened class", 25000);
}
async function openWork(p, title) {
  await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim() === "Work")`, "the Work tab");
  await p.waitFor(`return (document.body.innerText || "").includes(${JSON.stringify(title)});`, "the assignment on the Work tab", 25000);
}
async function answerOne(p, concept) {
  await p.goto(`${BASE}/learn/maths/${concept}`);
  await p.waitFor(`return !!document.querySelector("main h1");`, `the ${concept} lesson`, 25000);
  const turn = `[...document.querySelectorAll("main button")].find(b => /Now your turn/.test(b.textContent || ""))`;
  if (await p.evaluate(`return !!${turn};`)) await p.clickExpr(turn, `the practice door on ${concept}`);
  // THE SERVE DECLARES FOUR ANSWER KINDS. Waiting only for `.choices` or the
  // numeric box made a fraction item look like a missing question: `fractions`
  // served a fraction response, the page was correctly showing its numerator /
  // denominator fields, and this walk timed out on a stage that had rendered.
  // Every kind the page can draw is recognised here, and answered with a value
  // that is a real submission — this walk is about the assignment becoming Done
  // from recorded evidence, not about the answer being right.
  await p.waitFor(
    `return document.querySelectorAll("main .choices button").length > 0 || !!document.querySelector("main .numeric-input") || !!document.querySelector("main .fraction-input") || !!document.querySelector("main .pair-input");`,
    `a practice item on ${concept}`,
    30000,
  );
  const item = await p.evaluate(`return {
    prompt: (document.querySelector("main .qprompt")?.innerText || "").trim().slice(0, 120),
    choices: document.querySelectorAll("main .choices button").length,
    numeric: !!document.querySelector("main .numeric-input"),
    fraction: !!document.querySelector("main .fraction-input"),
    pair: !!document.querySelector("main .pair-input"),
  };`);
  check(item.prompt.length > 0, `the pupil was served a real ${concept} question`);
  if (item.fraction) {
    const fields = `[...document.querySelectorAll("main .fraction-input")]`;
    await p.typeInto(`${fields}[0]`, "1", "the numerator");
    await p.typeInto(`${fields}[1]`, "2", "the denominator");
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /Check/.test(b.textContent || ""))`, "the Check button");
  } else if (item.pair) {
    const fields = `[...document.querySelectorAll("main .pair-input")]`;
    await p.typeInto(`${fields}[0]`, "0", "the x coordinate");
    await p.typeInto(`${fields}[1]`, "0", "the y coordinate");
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /Check/.test(b.textContent || ""))`, "the Check button");
  } else if (item.numeric) {
    await p.typeInto(`document.querySelector("main .numeric-input")`, "0", "the numeric answer box");
    await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => /Check/.test(b.textContent || ""))`, "the Check button");
  } else {
    await p.clickExpr(`document.querySelector("main .choices button")`, "the first practice choice");
  }
  await p.waitFor(`return !!document.querySelector("main .feedback");`, "the server's mark", 25000);
  return item;
}

let teacherBrowser = null, aBrowser = null, bBrowser = null;
try {
  section("A real teacher, a class, and two pupils");
  const teacher = await account("teacher", "asg_teacher");
  check((await patch(teacher, { onboarded: true, handle: "asg_teacher", country: "GB", language: "en" })).status === 200,
    "the teacher profile is complete");
  const clsRes = await call("/api/classes", json({
    action: "create", name: "Assignment Class", subject: "maths", specificationId: "uk-gcse",
  }, teacher.cookie));
  const cls = clsRes.body?.cls;
  check(clsRes.status === 200 && !!cls?.id, "the class exists with a join code");
  const pupils = [];
  for (const handle of ["asg_p1", "asg_p2"]) {
    const p = await account("student", handle);
    await patch(p, {
      onboarded: true, handle, grade: "Year 10", subjects: ["maths"],
      subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
    });
    const join = await call("/api/classes", json({
      action: "join", id: p.id, secret: p.secret, joinCode: cls.joinCode, handle,
    }, p.cookie));
    check(join.status === 200, `${handle} joined the class`);
    await seedDiagnostic(p);
    pupils.push(p);
  }
  const unapproved = await call("/api/assignments", json({
    action: "create", clsId: cls.id, conceptIds: ["quadratics"],
    dueAt: Date.now() + 86400000, title: "Must not publish",
  }, teacher.cookie));
  check(unapproved.status === 400 && /not yet approved/i.test(String(unapproved.body?.error)),
    "an unapproved lesson is refused before any assignment is stored");
  const made = await call("/api/assignments", json({
    action: "create", clsId: cls.id, conceptIds: ["fractions"],
    dueAt: Date.now() + 86400000, title: "Browser reviewed task",
  }, teacher.cookie));
  const assignment = made.body?.assignment;
  check(made.status === 200 && assignment?.state === "published", "the test-approved lesson is published to the class");

  section("The teacher signs in and sees the work on the class's Work tab");
  teacherBrowser = await open();
  await signIn(teacherBrowser.p, teacherBrowser.requests, teacher);
  await finishTeacher(teacherBrowser.p);
  await openClass(teacherBrowser.p, cls);
  await openWork(teacherBrowser.p, "Browser reviewed task");
  check(true, "the assignment is on the teacher's Work tab");

  section("Pupil A receives the work and completes it through the concept page");
  aBrowser = await open();
  const a = aBrowser.p;
  await signIn(a, aBrowser.requests, pupils[0]);
  await finishPupil(a);
  await a.goto(`${BASE}/dashboard`);
  await a.waitFor(`return /assigned work/i.test(document.body.innerText || "") && (document.body.innerText || "").includes("Browser reviewed task");`,
    "pupil A's assigned work", 30000);
  check(true, "the assignment is on pupil A's Home screen");
  const start = `document.querySelector('main a.btn[href*="/learn/maths/fractions"]')`;
  check(await a.evaluate(`return !!${start};`), "pupil A is offered the concept to start");
  await a.clickExpr(start, "the assignment start link");
  await answerOne(a, "fractions");
  await a.goto(`${BASE}/dashboard`);
  await a.waitFor(`return (document.body.innerText || "").includes("Browser reviewed task") && (document.body.innerText || "").includes("Done");`,
    "pupil A's completed assignment", 30000);
  check(true, "pupil A's Home shows the assignment as Done after one recorded answer");

  section("Pupil B receives the same work but has not done it");
  bBrowser = await open();
  const b = bBrowser.p;
  await signIn(b, bBrowser.requests, pupils[1]);
  await finishPupil(b);
  await b.goto(`${BASE}/dashboard`);
  await b.waitFor(`return (document.body.innerText || "").includes("Browser reviewed task");`, "pupil B's assigned work", 30000);
  const bText = await b.allText();
  check(/1 of 1 ideas to do/.test(bText), "pupil B is shown one outstanding idea, not Done");
  check(!bText.includes("Done"), "pupil B has not been marked complete");

  section("The teacher's monitor distinguishes the two pupils from their own evidence");
  await teacherBrowser.p.goto(`${BASE}/teacher`);
  await openClass(teacherBrowser.p, cls);
  await openWork(teacherBrowser.p, "Browser reviewed task");
  await teacherBrowser.p.waitFor(
    `return [...document.querySelectorAll("main table.tbl tbody tr")].some(tr => (tr.innerText || "").includes("asg_p1") && /Done/.test(tr.innerText || ""));`,
    "pupil A's completed row",
    25000,
  );
  const rows = await teacherBrowser.p.evaluate(`return [...document.querySelectorAll("main table.tbl tbody tr")].map(tr => (tr.innerText || "").replace(/\\n+/g, " · "));`);
  check(rows.some((r) => r.includes("asg_p1") && /Done/.test(r)), "the teacher sees pupil A as Done");
  check(rows.some((r) => r.includes("asg_p2") && r.includes("0/1")), "the teacher sees pupil B as 0/1, not Done");
  check(rows.some((r) => r.includes("asg_p1") && /%/.test(r)), "the teacher's row carries the measured accuracy, not just a tick");

  const monitorRes = await call(`/api/assignments?${qs({ me: teacher.id, secret: teacher.secret })}`, {
    method: "GET", headers: { Cookie: teacher.cookie },
  });
  const mon = (monitorRes.body?.monitor ?? []).find((m) => m.assignment.id === assignment.id);
  const rowA = mon?.members.find((m) => m.handle === "asg_p1");
  const rowB = mon?.members.find((m) => m.handle === "asg_p2");
  check(monitorRes.status === 200 && !!mon, "the persisted monitor contains the assignment");
  check(rowA?.complete === true && rowA.answers >= 1, `the server records pupil A as complete with ${rowA?.answers ?? 0} answer(s)`);
  check(rowB?.complete === false && (rowB.outstanding ?? []).includes("fractions"), "the server records pupil B as outstanding");
  check(rowA?.concepts?.fractions?.asked >= 1, "pupil A's accuracy is derived from the recorded fractions event");

  const mineA = await call(`/api/assignments?${qs({ me: pupils[0].id, secret: pupils[0].secret })}`, { method: "GET" });
  const workA = (mineA.body?.assigned ?? []).find((w) => w.assignment.id === assignment.id);
  check(workA?.mine.complete === true, "pupil A's own API view agrees that the work is complete");
  const mineB = await call(`/api/assignments?${qs({ me: pupils[1].id, secret: pupils[1].secret })}`, { method: "GET" });
  const workB = (mineB.body?.assigned ?? []).find((w) => w.assignment.id === assignment.id);
  check(workB?.mine.complete === false, "pupil B's own API view agrees that the work is outstanding");

  console.log(`\n${"─".repeat(58)}`);
  console.log(`ASSIGNMENT BROWSER: ${passed} passed, ${failed} failed`);
} finally {
  for (const b of [teacherBrowser, aBrowser, bBrowser]) {
    if (b) await b.close();
  }
  for (const a of created) {
    await call(`/api/profile?id=${encodeURIComponent(a.id)}&secret=${encodeURIComponent(a.secret)}&confirm=ERASE`, { method: "DELETE" });
  }
}
process.exit(failed ? 1 : 0);
