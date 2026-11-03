#!/usr/bin/env node
// ── AUTHENTICATION BOUNDARIES, THROUGH THE REAL FORM ───────────────────────
//
// The cross-device walk proves a teacher and a pupil can sign in. This walk
// proves what the form and the server do when they CANNOT: empty fields, an
// unknown account, a wrong password, an expired session, a signed-out return
// to /teacher, a pupil trying the teacher console, and a second teacher trying
// to read or set work on a class they do not own.
//
// Run with the development server on a scratch store:
//   OPENMIND_DATA_DIR=/tmp/openmind-auth-bounds npm run dev
//   node scripts/verify-auth-boundaries.mjs
import { launchChrome, pageFor } from "./browser.mjs";

const BASE = process.env.AUTH_BOUNDARY_BASE ?? "http://127.0.0.1:4173";
const ports = [11500, 11600, 11700].map((n) => n + Math.floor(Math.random() * 80));
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
  const email = `bound-${role}-${stamp}@example.test`;
  const password = "bound-password-123";
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

async function open() {
  const requests = [];
  const chrome = await launchChrome({
    port: ports.pop(),
    onEvent: (m) => {
      if (m.method === "Network.requestWillBeSent") requests.push(m.params.request.url);
    },
  });
  return { ...chrome, requests, p: pageFor(chrome.send) };
}
async function fill(p, email, password) {
  await p.typeInto(`document.querySelector("main input[type=email]")`, email, "the email");
  await p.typeInto(`document.querySelector("main input[type=password]")`, password, "the password");
}

/** A signed-in teacher may still see the teacher's own setup step. Complete the
 *  step the product shows; do not skip it by writing a route or a session. */
async function finishTeacherIfShown(p) {
  if (await p.evaluate(`return location.pathname === "/teacher";`)) return;
  await p.waitFor(`return !!document.querySelector("main input[type=text]");`, "the teacher setup step", 20000);
  await p.clickExpr(
    `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim().startsWith("Teacher"))`,
    "the teacher finish button",
  );
  await p.waitFor(`return location.pathname === "/teacher";`, "the teacher console", 30000);
}
const stillOnForm = `return !!document.querySelector("main input[type=email]");`;
const hasRefusal = `return !!document.querySelector("main input[type=email]") && /wrong|incorrect|not correct|match|invalid|not recognised|not recognized/i.test(document.body.innerText || "");`;

let browser = null;
try {
  section("A teacher with a class, a second teacher, and a pupil");
  const teacher = await account("teacher", "bound_teacher");
  const other = await account("teacher", "bound_other");
  const pupil = await account("student", "bound_pupil");
  for (const a of [teacher, other]) {
    await patch(a, { onboarded: true, handle: a.handle, country: "GB", language: "en" });
  }
  await patch(pupil, {
    onboarded: true, handle: "bound_pupil", grade: "Year 10", subjects: ["maths"],
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
  });
  const clsRes = await call("/api/classes", json({
    action: "create", name: "Auth Boundary Class", subject: "maths", specificationId: "uk-gcse",
  }, teacher.cookie));
  const cls = clsRes.body?.cls;
  check(clsRes.status === 200 && !!cls?.id, "the first teacher owns a class");

  browser = await open();
  const p = browser.p;
  section("A signed-out /teacher visit keeps its return target");
  await p.goto(`${BASE}/teacher`);
  await p.waitFor(`return (document.body.innerText || "").includes("Teacher tools");`, "the public teacher door", 25000);
  const signInLink = `document.querySelector('a[href*="mode=signin"]')`;
  const offered = await p.waitFor(`return !!${signInLink};`, "the teacher sign-in door to resolve", 20000)
    .then(() => true).catch(() => false);
  check(offered, "the signed-out teacher page offers its own sign-in door");
  await p.clickExpr(signInLink, "the teacher sign-in link");
  await p.waitFor(stillOnForm, "the sign-in form after the guarded route", 30000);
  const guardUrl = await p.evaluate(`return location.pathname + location.search;`);
  check(guardUrl.includes("return=%2Fteacher") || guardUrl.includes("return=/teacher"), `the guard carries /teacher as the return path (${guardUrl})`);

  section("Empty, unknown and wrong credentials do not open a session");
  const beforeEmpty = browser.requests.filter(isLogin).length;
  await p.clickExpr(exactButton("Sign in"), "Sign in with empty fields");
  await new Promise((r) => setTimeout(r, 500));
  check(browser.requests.filter(isLogin).length === beforeEmpty, "empty fields did not send a login request");
  check(await p.evaluate(stillOnForm), "the form stayed open with its fields empty");

  await fill(p, `unknown-${Date.now()}@example.test`, "not-a-password");
  const beforeUnknown = browser.requests.filter(isLogin).length;
  await p.clickExpr(exactButton("Sign in"), "Sign in with an unknown account");
  await p.waitFor(hasRefusal, "the unknown-account refusal", 20000);
  check(browser.requests.filter(isLogin).length > beforeUnknown, "the unknown account reached the login endpoint");
  check(await p.evaluate(stillOnForm), "an unknown account did not open the teacher console");

  await fill(p, teacher.email, "definitely-the-wrong-password");
  const beforeWrong = browser.requests.filter(isLogin).length;
  await p.clickExpr(exactButton("Sign in"), "Sign in with the wrong password");
  await p.waitFor(hasRefusal, "the wrong-password refusal", 20000);
  check(browser.requests.filter(isLogin).length > beforeWrong, "the wrong password reached the login endpoint");
  check(await p.evaluate(stillOnForm), "the wrong password did not open the teacher console");

  section("The correct password returns the teacher to the guarded page");
  await fill(p, teacher.email, teacher.password);
  await p.clickExpr(exactButton("Sign in"), "Sign in with the correct teacher password");
  await p.waitFor(`return location.pathname !== "/onboarding" || !!document.querySelector("main input[type=text]");`,
    "the teacher sign-in to resolve", 30000);
  await finishTeacherIfShown(p);
  await p.waitFor(`return location.pathname === "/teacher" && (document.body.innerText || "").includes("Auth Boundary Class");`,
    "the teacher console returned to from the guarded route", 30000);
  check(true, "the correct teacher credentials reached /teacher, not Home");
  await p.goto(`${BASE}/teacher`);
  await p.waitFor(`return location.pathname === "/teacher" && (document.body.innerText || "").includes("Auth Boundary Class");`,
    "the teacher console after a refresh", 25000);
  check(true, "the session survives a page refresh");

  section("An expired browser session is refused and can be re-established");
  await browser.send("Network.clearBrowserCookies");
  await p.goto(`${BASE}/teacher`);
  await p.waitFor(`return !!document.querySelector('a[href*="mode=signin"]');`, "the teacher door after the session was removed", 25000);
  await p.clickExpr(`document.querySelector('a[href*="mode=signin"]')`, "the teacher sign-in link after expiry");
  await p.waitFor(stillOnForm, "the sign-in form after the session was removed", 30000);
  const expiredUrl = await p.evaluate(`return location.pathname + location.search;`);
  check(expiredUrl.includes("return=%2Fteacher") || expiredUrl.includes("return=/teacher"),
    "the expired session preserves the return target");
  await fill(p, teacher.email, teacher.password);
  await p.clickExpr(exactButton("Sign in"), "Sign in after the session expired");
  await p.waitFor(`return location.pathname !== "/onboarding" || !!document.querySelector("main input[type=text]");`,
    "the reauthentication to resolve", 30000);
  await finishTeacherIfShown(p);
  await p.waitFor(`return location.pathname === "/teacher" && (document.body.innerText || "").includes("Auth Boundary Class");`,
    "the teacher console after reauthentication", 30000);
  check(true, "reauthentication returns to the same teacher console");

  section("Signing out removes the session");
  await p.goto(`${BASE}/account`);
  await p.waitFor(`return !!${exactButton("Sign out")};`, "the sign-out control", 25000);
  await p.clickExpr(exactButton("Sign out"), "Sign out");
  await p.waitFor(`return location.pathname === "/" || location.pathname === "/onboarding";`, "the signed-out screen", 25000);
  await p.goto(`${BASE}/teacher`);
  await p.waitFor(`return !!document.querySelector('a[href*="mode=signin"]');`, "the public teacher door after signing out", 25000);
  check(!(await p.evaluate(`return (document.body.innerText || "").includes("Create a class") && (document.body.innerText || "").includes("Your classes");`)),
    "a signed-out browser cannot reach the teacher console");

  section("A pupil cannot enter the teacher console");
  await p.goto(`${BASE}/onboarding?mode=signin`);
  await p.waitFor(stillOnForm, "the pupil sign-in form", 25000);
  await fill(p, pupil.email, pupil.password);
  await p.clickExpr(exactButton("Sign in"), "Sign in as the pupil");
  await p.waitFor(`return location.pathname !== "/onboarding" || !!document.querySelector("main input[type=checkbox]");`,
    "the pupil's post-sign-in step", 30000);
  if (await p.evaluate(`return location.pathname === "/onboarding";`)) {
    await p.clickExpr(prefixedButton("Start learning"), "the pupil finish button");
    await p.waitFor(`return location.pathname !== "/onboarding";`, "the pupil's post-sign-in screen", 30000);
  }
  await p.goto(`${BASE}/teacher`);
  await new Promise((r) => setTimeout(r, 1200));
  const pupilPath = await p.evaluate(`return location.pathname;`);
  const pupilConsole = await p.evaluate(`return !!document.querySelector('a.class-card') || (document.body.innerText || "").includes("Auth Boundary Class");`);
  check(pupilPath !== "/teacher" || !pupilConsole, `a pupil is not shown the teacher console (${pupilPath})`);

  section("Another teacher, or a pupil, cannot read or set work on the class");
  const otherRead = await call(`/api/classes?${qs({ id: cls.id, me: other.id, secret: other.secret })}`, {
    method: "GET", headers: { Cookie: other.cookie },
  });
  check(otherRead.status === 403, `a second teacher cannot read the class (${otherRead.status} ${otherRead.body?.error ?? ""})`);
  const otherAssign = await call("/api/assignments", json({
    action: "create", clsId: cls.id, conceptIds: ["fractions"], dueAt: Date.now() + 86400000, title: "Stolen",
  }, other.cookie));
  check(otherAssign.status === 403 && otherAssign.body?.error === "not_the_teacher",
    "a second teacher cannot set work on the class");
  const pupilRead = await call(`/api/classes?${qs({ id: cls.id, me: pupil.id, secret: pupil.secret })}`, {
    method: "GET", headers: { Cookie: pupil.cookie },
  });
  check(pupilRead.status === 403, "a pupil outside the class cannot read its roster");
  const pupilAssign = await call("/api/assignments", json({
    action: "create", clsId: cls.id, conceptIds: ["fractions"], dueAt: Date.now() + 86400000, title: "Pupil work",
  }, pupil.cookie));
  check(pupilAssign.status === 403, "a pupil cannot set work on a class");

  console.log(`\n${"─".repeat(58)}`);
  console.log(`AUTH BOUNDARIES: ${passed} passed, ${failed} failed`);
} finally {
  if (browser) await browser.close();
  for (const a of created) {
    await call(`/api/profile?id=${encodeURIComponent(a.id)}&secret=${encodeURIComponent(a.secret)}&confirm=ERASE`, { method: "DELETE" });
  }
}
process.exit(failed ? 1 : 0);
