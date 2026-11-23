#!/usr/bin/env node
// ── A GRAPH QUESTION, ANSWERED IN THE REAL LESSON PAGE ──────────────────────
//
// The paper sheet has always been able to print a graph part. The digital
// authored lesson refused one, because its renderer had no surface for the
// answer. This walk proves the gap is closed through the product a learner
// actually uses:
//   1. sign a pupil in through the normal form;
//   2. open the scatter-correlation lesson on a production build;
//   3. answer item a7 with two points on y = −3x + 40 and a read-off at x = 4;
//   4. submit to /api/progress and read the 3/3 verdict from the page.
//
// It does not claim physical printing or teacher review. The print path is
// checked separately by scripts/verify-print-browser.mjs.
//
//   OPENMIND_DATA_DIR=/tmp/openmind-graph OPENMIND_ALLOW_EPHEMERAL_STORE=1 PORT=4174 node .next/standalone/server.js
//   node scripts/verify-graph-lesson-browser.mjs
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { launchChrome, pageFor, sleep } from "./browser.mjs";

const BASE = process.env.OPENMIND_BASE ?? process.env.OFFLINE_BASE ?? "http://127.0.0.1:4174";
const profileDir = mkdtempSync(path.join(tmpdir(), "openmind-graph-profile-"));
const port = 10800 + Math.floor(Math.random() * 80);

let passed = 0;
let failed = 0;
const check = (cond, msg) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ FAIL: ${msg}`); }
};
const json = (body, cookie = null) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify(body),
});
async function call(p, opts) {
  const r = await fetch(BASE + p, opts);
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 300) }; }
  return { status: r.status, body, headers: r.headers };
}
const exactButton = (text) => `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim() === ${JSON.stringify(text)})`;
const prefixedButton = (text) => `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim().startsWith(${JSON.stringify(text)}))`;
const isLogin = (u) => { try { return new URL(u).pathname === "/api/auth/login"; } catch { return false; } };

async function account() {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const email = `graph-${stamp}@example.test`;
  const password = "graph-password-123";
  const r = await call("/api/auth/signup", json({
    email, password, name: "graph_pupil", role: "student", country: "GB", language: "en", subjects: ["maths"],
  }));
  const id = r.body?.profile?.profile?.id;
  const secret = r.body?.secret;
  const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  if (r.status !== 200 || !id || !secret) throw new Error(`signup: ${r.status} ${JSON.stringify(r.body)}`);
  const patched = await call("/api/profile", json({
    id, secret, onboarded: true, handle: "graph_pupil", grade: "Year 10", subjects: ["maths"],
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
  }, cookie));
  if (patched.status !== 200) throw new Error(`profile: ${patched.status} ${JSON.stringify(patched.body)}`);
  return { email, password, id, secret, cookie };
}

async function signIn(p, requests, a) {
  await p.goto(`${BASE}/onboarding?mode=signin`);
  await p.waitFor(`return !!document.querySelector("main input[type=email]");`, "the sign-in form", 25000);
  await p.typeInto(`document.querySelector("main input[type=email]")`, a.email, "the email");
  await p.typeInto(`document.querySelector("main input[type=password]")`, a.password, "the password");
  const before = requests.filter(isLogin).length;
  await p.clickExpr(exactButton("Sign in"), "the Sign in button");
  await p.waitFor(`return !document.querySelector("main input[type=email]");`, "the signed-in step", 30000);
  check(requests.filter(isLogin).length > before, "the normal form sent the login request");
}

let chrome = null;
try {
  const ping = await fetch(`${BASE}/api/health`);
  if (!ping.ok) throw new Error(`health ${ping.status}`);

  const pupil = await account();
  const requests = [];
  chrome = await launchChrome({
    port,
    userDataDir: profileDir,
    keepProfile: true,
    onEvent: (m) => {
      if (m.method === "Network.requestWillBeSent") requests.push(m.params.request.url);
    },
  });
  const p = pageFor(chrome.send);

  console.log("\n▸ A signed-in pupil answers an authored graph question");
  await signIn(p, requests, pupil);
  await p.goto(`${BASE}/learn/maths/scatter-correlation`);
  await p.waitFor(
    `return !!document.querySelector('[data-structured-item="a7"]');`,
    "the graph assessment item",
    30000,
  );
  check(true, "the lesson page rendered item a7");
  check(
    (await p.evaluate(`return !!document.querySelector('[data-structured-item="a7"] [data-structured-part="a"] [data-structured-answer]');`)) === true,
    "part (a) has an answer box for the two points",
  );
  check(
    (await p.evaluate(`return !!document.querySelector('[data-structured-item="a7"] [data-structured-part="b"] [data-structured-answer]');`)) === true,
    "part (b) has a read-off answer box",
  );

  await p.typeInto(
    `document.querySelector('[data-structured-item="a7"] [data-structured-part="a"] [data-structured-answer]')`,
    "0,40 10,10",
    "two points on the line",
  );
  await p.typeInto(
    `document.querySelector('[data-structured-item="a7"] [data-structured-part="b"] [data-structured-answer]')`,
    "28",
    "the read-off at x = 4",
  );
  await p.clickExpr(
    `document.querySelector('[data-structured-item="a7"] [data-structured-submit]')`,
    "the Check all parts button",
  );
  await p.waitFor(
    `return !!document.querySelector('[data-structured-item="a7"] [data-structured-verdict]');`,
    "the marked verdict",
    30000,
  );
  const score = await p.evaluate(
    `return document.querySelector('[data-structured-item="a7"] [data-structured-score]')?.textContent?.trim() ?? "";`,
  );
  const verdict = await p.evaluate(
    `return document.querySelector('[data-structured-item="a7"] [data-structured-verdict]')?.textContent?.replace(/\\s+/g, " ").trim() ?? "";`,
  );
  check(score === "3 / 3", `the page shows 3 / 3 (got ${JSON.stringify(score)})`);
  check(verdict.includes("full marks"), "the page says the parts earned full marks");
  check(verdict.includes("gradient −3") || verdict.includes("intercept 40"), "the marking names the graph criteria");
  check(requests.some((u) => u.includes("/api/progress")), "the submission reached the progress route");

  // The record is the durable claim: one lessonCheck for this concept, and one
  // evidence event naming the authored item. A UI-only verdict would leave no
  // such event and would not be evidence of learning.
  const snap = await call(`/api/progress?id=${encodeURIComponent(pupil.id)}&secret=${encodeURIComponent(pupil.secret)}`, { headers: { Cookie: pupil.cookie } });
  check(snap.status === 200, "the pupil's progress snapshot is readable");
  const record = snap.body?.progress?.["scatter-correlation"]?.lessonCheck;
  check(record?.asked === 1 && record?.correct === 1,
    `the lessonCheck counter records asked 1 / correct 1 (${JSON.stringify(record)})`);

  const evidence = await call(`/api/evidence?id=${encodeURIComponent(pupil.id)}&secret=${encodeURIComponent(pupil.secret)}`, { headers: { Cookie: pupil.cookie } });
  const events = Array.isArray(evidence.body?.events) ? evidence.body.events : [];
  const graphEvents = events.filter((e) => e.questionId === "lesson:scatter-correlation:a7");
  check(graphEvents.length === 1, `exactly one ledger event names item a7 (${graphEvents.length})`);
  check(graphEvents[0]?.score?.awarded === 3 && graphEvents[0]?.score?.max === 3,
    `the ledger carries the 3/3 partial-credit score (${JSON.stringify(graphEvents[0]?.score)})`);
} finally {
  if (chrome) { try { await chrome.close(); } catch { /* already gone */ } }
  rmSync(profileDir, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
