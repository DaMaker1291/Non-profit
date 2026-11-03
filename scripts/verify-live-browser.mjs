#!/usr/bin/env node
// ── LIVE CLASSROOM, IN REAL BROWSERS ────────────────────────────────────────
//
// The server suite proves the state machine. This walk proves the classroom a
// person uses: a teacher signs in through the form, opens their class, starts a
// room and publishes an activity; two pupils in independent Chrome processes
// receive it WITHOUT a reload; their submissions appear on the teacher's screen;
// pausing and ending reach the pupils; and a third browser signed into the same
// pupil sees the same recorded submission.
//
// It never injects a session or calls the login API on the browser's behalf.
// Run with the dev server on a scratch store, with test content approvals on:
//   OPENMIND_DATA_DIR=/tmp/openmind-live OPENMIND_TEST_CONTENT_APPROVALS=1 npm run dev
//   node scripts/verify-live-browser.mjs
import { launchChrome, pageFor } from "./browser.mjs";

const BASE = process.env.LIVE_BASE ?? "http://127.0.0.1:4173";
const ports = [10100, 10200, 10300, 10400].map((n) => n + Math.floor(Math.random() * 80));
let passed = 0, failed = 0;
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
const created = [];
async function account(role, handle) {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const email = `live-${role}-${stamp}@example.test`;
  const password = "live-password-123";
  const r = await call("/api/auth/signup", json({
    email, password, name: handle, role,
    country: "GB", language: "en", subjects: ["maths"],
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
const exactButton = (text) => `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim() === ${JSON.stringify(text)})`;
const prefixedButton = (text) => `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim().startsWith(${JSON.stringify(text)}))`;
const isLogin = (url) => { try { return new URL(url).pathname === "/api/auth/login"; } catch { return false; } };

async function open() {
  const requests = [];
  const responses = [];
  const exceptions = [];
  const port = ports.pop();
  const chrome = await launchChrome({
    port,
    onEvent: (m) => {
      if (m.method === "Network.requestWillBeSent") requests.push(m.params.request.url);
      if (m.method === "Network.responseReceived" && /\/api\/classroom/.test(m.params.response.url)) {
        responses.push({ url: m.params.response.url, status: m.params.response.status });
      }
      if (m.method === "Runtime.exceptionThrown") {
        exceptions.push(m.params.exceptionDetails?.exception?.description ?? m.params.exceptionDetails?.text ?? "exception");
      }
    },
  });
  return { ...chrome, requests, responses, exceptions, p: pageFor(chrome.send) };
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

async function finishTeacher(p) {
  await p.waitFor(`return !!document.querySelector("main input[type=text]");`, "the teacher name step", 20000);
  await p.clickExpr(prefixedButton("Teacher"), "the teacher finish button");
  await p.waitFor(`return location.pathname === "/teacher";`, "the teacher console", 30000);
}

async function finishPupil(p) {
  if (await p.evaluate(`return !!${prefixedButton("Next")};`)) {
    await p.clickExpr(prefixedButton("Next"), "the pupil Next button");
    await p.waitFor(`return document.querySelectorAll("main input[type=checkbox]").length > 0;`, "the subjects step", 20000);
  }
  await p.clickExpr(prefixedButton("Start learning"), "the pupil finish button");
  await p.waitFor(`return location.pathname !== "/onboarding";`, "the pupil to leave enrolment", 30000);
}

async function openClass(p, cls) {
  await p.waitFor(`return !!document.querySelector('a.class-card[href="#class-${cls.id}"]');`, "the class card", 25000);
  await p.clickExpr(`document.querySelector('a.class-card[href="#class-${cls.id}"]')`, "the class card");
  await p.waitFor(`return !!document.getElementById("class-${cls.id}");`, "the opened class", 25000);
}

async function openLiveTab(p) {
  await p.clickExpr(`[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim() === "Live")`, "the Live tab");
  await p.waitFor(`return !!document.querySelector("[data-live-classroom]");`, "the live classroom", 25000);
}

/** The phone check the release checklist asks for: the live surface may wrap,
 *  but it may not make the page wider than the viewport or hide a control
 *  behind a horizontal scroll. */
async function noHorizontalOverflow(p, label) {
  const size = await p.evaluate(`return {
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bodyWidth: document.body.scrollWidth,
  };`);
  check(size.scrollWidth <= size.innerWidth + 1 && size.bodyWidth <= size.innerWidth + 1,
    `${label} fits the ${size.innerWidth}px viewport without sideways scrolling`, JSON.stringify(size));
}

try {
  section("A teacher, a class and two pupils, all with real accounts");
  const teacher = await account("teacher", "live_teacher");
  check((await patch(teacher, { onboarded: true, handle: "live_teacher", country: "GB", language: "en" })).status === 200, "teacher profile complete");
  const clsRes = await call("/api/classes", json({ action: "create", name: "Live Class", subject: "maths", specificationId: "uk-gcse" }, teacher.cookie));
  const cls = clsRes.body?.cls;
  check(clsRes.status === 200 && !!cls?.joinCode, "the class exists with a join code");
  const pupils = [];
  for (const h of ["live_p1", "live_p2"]) {
    const p = await account("student", h);
    await patch(p, {
      onboarded: true, handle: h, grade: "Year 10", subjects: ["maths"],
      subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
    });
    const join = await call("/api/classes", json({ action: "join", id: p.id, secret: p.secret, joinCode: cls.joinCode, handle: h }, p.cookie));
    check(join.status === 200, `${h} joined the class`);
    pupils.push(p);
  }

  let teacherBrowser = null, aBrowser = null, bBrowser = null, cBrowser = null;
  try {
    section("The teacher signs in and starts a room through the Live tab");
    teacherBrowser = await open();
    const t = teacherBrowser.p;
    await signIn(t, teacherBrowser.requests, teacher);
    await finishTeacher(t);
    await openClass(t, cls);
    await openLiveTab(t);
    await t.clickExpr(exactButton("Start live class"), "Start live class");
    await t.waitFor(`return (document.body.innerText || "").includes("Live — waiting for the teacher to publish an activity.");`, "the started room", 20000);
    check(true, "the room starts and waits for an activity");
    await noHorizontalOverflow(t, "the teacher's live room");

    section("Two independent pupil browsers open the class before anything is published");
    aBrowser = await open();
    bBrowser = await open();
    const a = aBrowser.p, b = bBrowser.p;
    for (const [name, p] of [["pupil A", a], ["pupil B", b]]) {
      await signIn(p, name === "pupil A" ? aBrowser.requests : bBrowser.requests, pupils[name === "pupil A" ? 0 : 1]);
      await finishPupil(p);
      await p.goto(`${BASE}/classroom`);
      await p.waitFor(`return (document.body.innerText || "").includes("Live Class");`, `${name}'s class`, 25000);
      await p.waitFor(`return (document.body.innerText || "").includes("waiting for the teacher to publish") || (document.body.innerText || "").includes("Join live activity");`, `${name}'s live room`, 25000);
    }
    check(aBrowser.port !== bBrowser.port, "the two pupils are separate browser processes");
    check(!(await a.evaluate(`return (document.body.innerText || "").includes("Publish activity");`)), "a pupil has no teacher control");

    // Join before the activity is published, so the next assertion is about the
    // stream carrying a NEW activity, not about a page that was loaded after it.
    for (const [name, p, browser] of [["pupil A", a, aBrowser], ["pupil B", b, bBrowser]]) {
      // Wait for the CONTROL, not for a sentence that can be on screen while the
      // panel is still settling. This was a race in the first walk: it checked a
      // button in the same tick that the loading branch was replaced.
      let present = false;
      try {
        await p.waitFor(`return !!${exactButton("Join live activity")};`, `${name}'s join control`, 20000);
        present = true;
      } catch { present = false; }
      check(present, `${name} is offered the join control`);
      if (present) {
        await p.clickExpr(exactButton("Join live activity"), "Join live activity");
        try {
          await p.waitFor(`return !${exactButton("Join live activity")};`, `${name}'s join to take effect`, 15000);
        } catch (e) {
          console.error(`    ${name} classroom responses:`, JSON.stringify(browser.responses));
          console.error(`    ${name} exceptions:`, JSON.stringify(browser.exceptions));
          console.error(`    ${name} panel:`, await p.evaluate(`return (document.querySelector("[data-live-classroom]")?.innerText || "").replace(/\\n+/g, " · ").slice(0, 900);`));
          throw e;
        }
      }
    }
    check(true, "both pupils joined before the activity existed");

    section("The teacher publishes; both pupils receive it without a reload");
    await t.pickOption(`document.querySelector("[data-live-classroom] select")`, "fractions", "the activity lesson");
    await t.clickExpr(exactButton("Publish activity"), "Publish activity");
    await t.waitFor(`return !!document.querySelector("[data-live-activity]");`, "the teacher's activity", 20000);
    const prompt = await t.evaluate(`return (document.querySelector("[data-live-activity] p")?.innerText || "").trim();`);
    await noHorizontalOverflow(t, "the teacher's published activity");
    check(!!prompt, `the teacher sees the published prompt (${prompt.slice(0, 60)})`);
    for (const [name, p] of [["pupil A", a], ["pupil B", b]]) {
      await p.waitFor(`return (document.body.innerText || "").includes(${JSON.stringify(prompt)});`, `${name}'s streamed activity`, 30000);
      check(true, `${name} received the activity with no navigation`);
    }

    section("Pupils submit through the interface; the teacher sees participation");
    for (const [name, p] of [["pupil A", a], ["pupil B", b]]) {
      const diag = await p.evaluate(`return {
        text: (document.querySelector("[data-live-classroom]")?.innerText || document.body.innerText || "").replace(/\\n+/g, " · ").slice(0, 900),
        buttons: [...document.querySelectorAll("[data-live-classroom] button")].map(x => (x.textContent || "").trim()).slice(0, 12),
        activityButtons: [...document.querySelectorAll("[data-live-activity] button")].map(x => (x.textContent || "").trim()).slice(0, 8),
        choices: document.querySelectorAll("[data-live-activity] button.btn.ghost").length,
      };`);
      console.log(`    ${name} DOM: ${JSON.stringify(diag)}`);
      check(diag.choices > 0, `${name} has answer choices rendered`);
      await p.clickExpr(`document.querySelector("[data-live-activity] button.btn.ghost")`, "a live answer option");
      await p.clickExpr(exactButton("Submit answer"), "Submit answer");
      await p.waitFor(`return /recorded\\./.test(document.querySelector("[data-live-activity]")?.innerText || "");`, "the submission confirmation", 25000);
    }
    await t.waitFor(`return (document.body.innerText || "").includes("2 submitted");`, "the teacher's live participation count", 30000);
    check(true, "the teacher sees both submissions without reloading");

    section("Pause and end reach the pupil screens through the stream");
    await t.clickExpr(exactButton("Pause submissions"), "Pause submissions");
    for (const p of [a, b]) {
      await p.waitFor(`return (document.body.innerText || "").includes("Paused — submissions are closed.");`, "the paused pupil screen", 25000);
    }
    check(true, "both pupils see the pause without a reload");
    await t.clickExpr(exactButton("End class"), "End class");
    for (const p of [a, b]) {
      await p.waitFor(`return (document.body.innerText || "").includes("This live class has ended.");`, "the ended pupil screen", 25000);
    }
    check(true, "both pupils see the end without a reload");

    section("The teacher refreshes; the room and its results remain on the server");
    await t.goto(`${BASE}/teacher`);
    await openClass(t, cls);
    await openLiveTab(t);
    await t.waitFor(`return (document.body.innerText || "").includes("This live class has ended.");`, "the persisted ended room", 25000);
    check((await t.evaluate(`return (document.body.innerText || "").includes("2 submitted");`)), "the refreshed teacher page still shows two submissions");

    section("The same pupil signs in on a third device and sees their own submission");
    cBrowser = await open();
    const c = cBrowser.p;
    await signIn(c, cBrowser.requests, pupils[1]);
    await finishPupil(c);
    await c.goto(`${BASE}/classroom`);
    await c.waitFor(`return (document.body.innerText || "").includes("This live class has ended.");`, "the third device's room", 30000);
    check((await c.evaluate(`return (document.body.innerText || "").includes("Not yet — recorded.") || (document.body.innerText || "").includes("Correct — recorded.");`)),
      "the third device sees the same pupil's recorded result");

    console.log(`\n${"─".repeat(58)}`);
    console.log(`LIVE BROWSER: ${passed} passed, ${failed} failed`);
  } finally {
    for (const b of [teacherBrowser, aBrowser, bBrowser, cBrowser]) {
      if (b) await b.close();
    }
  }
} finally {
  for (const a of created) {
    await call(`/api/profile?id=${encodeURIComponent(a.id)}&secret=${encodeURIComponent(a.secret)}&confirm=ERASE`, { method: "DELETE" });
  }
}
process.exit(failed ? 1 : 0);
