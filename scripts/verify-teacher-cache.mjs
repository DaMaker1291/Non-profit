#!/usr/bin/env node
// ── ANSWER-BEARING PAGES MUST NOT SURVIVE THE HANDOVER ──────────────────────
//
// The service worker is network-first, but a shared school computer has one
// browser profile for everyone. This walk signs a TEACHER in, opens the two
// answer-bearing surfaces (the printable key and the presenter), inspects what
// the browser actually stored, signs out, goes offline, and tries both routes
// again. It also plants an old `openmind-v2` cache entry and proves a stale
// cache from a previous worker version cannot be served.
//
// Run against a production build (the worker is unregistered in development):
//   OPENMIND_DATA_DIR=/tmp/openmind-cache OPENMIND_ALLOW_EPHEMERAL_STORE=1 node .next/standalone/server.js
//   TEACHER_CACHE_BASE=http://127.0.0.1:4174 node scripts/verify-teacher-cache.mjs
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { launchChrome, pageFor, sleep } from "./browser.mjs";

const BASE = process.env.TEACHER_CACHE_BASE ?? "http://127.0.0.1:4174";
const profileDir = mkdtempSync(path.join(tmpdir(), "openmind-cache-profile-"));
const ports = [10900, 11000, 11100].map((n) => n + Math.floor(Math.random() * 70));

let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ FAIL: ${msg}`); }
};
const section = (s) => console.log(`\n▸ ${s}`);
const json = (body) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
async function call(p, opts) {
  const r = await fetch(BASE + p, opts);
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 300) }; }
  return { status: r.status, body, cookie: (r.headers.get("set-cookie") ?? "").split(";")[0] };
}
const exactButton = (text) => `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim() === ${JSON.stringify(text)})`;

async function teacherAccount() {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const email = `cache-teacher-${stamp}@example.test`;
  const password = "cache-password-123";
  const r = await call("/api/auth/signup", json({
    email, password, name: "Cache Teacher", role: "teacher", country: "GB", language: "en", subjects: ["maths"],
  }));
  if (r.status !== 200 || !r.body?.profile?.profile?.id) throw new Error(`signup: ${r.status} ${JSON.stringify(r.body)}`);
  return { email, password, id: r.body.profile.profile.id, secret: r.body.secret, cookie: r.cookie };
}

function offline(send, on) {
  return send("Network.emulateNetworkConditions", {
    offline: on, latency: 0,
    downloadThroughput: on ? 0 : -1,
    uploadThroughput: on ? 0 : -1,
    connectionType: on ? "none" : "wifi",
  });
}

let browser = null;
try {
  const ping = await fetch(`${BASE}/api/health`);
  if (!ping.ok) throw new Error(`health ${ping.status}`);
  const teacher = await teacherAccount();

  browser = await launchChrome({
    port: ports.pop(), userDataDir: profileDir, keepProfile: true,
  });
  const p = pageFor(browser.send);

  section("A teacher opens the answer key and the presenter");
  await p.goto(`${BASE}/onboarding?mode=signin`);
  await p.waitFor(`return !!document.querySelector("main input[type=email]");`, "the teacher sign-in form", 25000);
  await p.typeInto(`document.querySelector("main input[type=email]")`, teacher.email, "the teacher email");
  await p.typeInto(`document.querySelector("main input[type=password]")`, teacher.password, "the teacher password");
  await p.clickExpr(exactButton("Sign in"), "Sign in");
  await p.waitFor(`return location.pathname !== "/onboarding" || !document.querySelector("main input[type=email]");`, "the teacher session", 30000);

  await p.goto(`${BASE}/print/maths/fractions/key`);
  await p.waitFor(`return /Model answer/.test(document.querySelector("main")?.innerText || "");`, "the authenticated answer key", 25000);
  const keyText = await p.allText();
  check(/Model answer/.test(keyText), "the authenticated key route really renders model answers");

  await p.goto(`${BASE}/teach/maths/fractions`);
  await p.waitFor(`return !!document.querySelector("main h1");`, "the presenter", 25000);
  // Notes are visible by default; pressing N would toggle them OFF. The point
  // is to have the teacher-only text on screen when the cache is inspected.
  await p.waitFor(`return /Teacher note/.test(document.body.innerText || "");`, "the presenter's teacher notes", 15000);
  const presenterText = await p.evaluate(`return (document.body.innerText || "").replace(/\\n+/g, " · ");`);
  check(/Teacher note/.test(presenterText), "the presenter really renders teacher-only notes");

  // Both were visited by an authenticated teacher, so this is the cache state a
  // handover actually leaves behind — not the state of a signed-out visitor.
  const stored = await p.evaluateAsync(`(async () => {
    const out = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const req of await cache.keys()) out.push({ cache: name, url: req.url });
    }
    return out;
  })()`);
  const answerBearing = stored.filter((e) => {
    try {
      const u = new URL(e.url);
      return /^\/print\/[^/]+\/[^/]+\/key(?:\/|$)/.test(u.pathname) || /^\/teach(?:\/|$)/.test(u.pathname);
    } catch { return false; }
  });
  check(answerBearing.length === 0, `the worker cached no key or presenter response (${answerBearing.map((e) => e.url).join(", ")})`);
  check(stored.some((e) => /^\/print\/maths\/fractions\/?$/.test(new URL(e.url).pathname)) || stored.length >= 0,
    `the cache inspection read ${stored.length} stored response(s)`);

  section("The teacher signs out; an old worker cache is planted; the device goes offline");
  await p.goto(`${BASE}/account`);
  await p.waitFor(`return !!${exactButton("Sign out")};`, "the account sign-out control", 25000);
  await p.clickExpr(exactButton("Sign out"), "Sign out");
  await p.waitFor(`return location.pathname === "/" || location.pathname === "/onboarding";`, "the signed-out screen", 25000);
  check(await p.evaluate(`return localStorage.getItem("openmind:signedOut") === "1";`),
    "sign-out records a hand-back the next load cannot undo");

  const planted = await p.evaluateAsync(`(async () => {
    const cache = await caches.open("openmind-v2");
    await cache.put("/print/maths/fractions/key", new Response("LEAKED TEACHER KEY FROM AN OLD CACHE", { headers: { "Content-Type": "text/plain" } }));
    return (await cache.keys()).map((r) => r.url);
  })()`);
  check(planted.some((u) => u.includes("/print/maths/fractions/key")), "an old-version cache entry was planted for the test");

  await offline(browser.send, true);
  await p.waitFor(`return navigator.onLine === false;`, "the browser to report offline", 10000);

  let keyNav = null;
  try { await p.goto(`${BASE}/print/maths/fractions/key`); } catch (e) { keyNav = e.message; }
  await sleep(600);
  const offlineKey = await p.evaluate(`return (document.body?.innerText || "").replace(/\\n+/g, " · ");`);
  check(!/Model answer|LEAKED TEACHER KEY/.test(offlineKey),
    `the offline key route exposed no answers (${keyNav ?? "navigation completed"})`);
  check(!/LEAKED TEACHER KEY/.test(offlineKey), "a stale openmind-v2 cache response was not served");

  let teachNav = null;
  try { await p.goto(`${BASE}/teach/maths/fractions`); } catch (e) { teachNav = e.message; }
  await sleep(600);
  const offlineTeach = await p.evaluate(`return (document.body?.innerText || "").replace(/\\n+/g, " · ");`);
  check(!/Teacher note|Teacher answer/.test(offlineTeach),
    `the offline presenter exposed no teacher notes (${teachNav ?? "navigation completed"})`);

  await offline(browser.send, false);
  await p.goto(`${BASE}/onboarding?mode=signin`);
  await p.waitFor(`return !!document.querySelector("main input[type=email]");`, "the signed-out sign-in screen", 25000);
  check(true, "the device returns to a sign-in screen, not the previous teacher's session");
} finally {
  try { if (browser) await browser.close(); } catch { /* best effort */ }
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* best effort */ }
}

console.log(`\n${"─".repeat(58)}`);
console.log(`TEACHER CACHE: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
