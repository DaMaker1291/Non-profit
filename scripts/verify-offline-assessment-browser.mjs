#!/usr/bin/env node
// ── AUTHORED ASSESSMENT, OFFLINE, ACROSS A REAL RESTART ────────────────────
//
// The pack now carries the authored items whose marking is deterministic. This
// walk proves the learner-facing loop rather than only the marker:
//
//   online download → service-worker control → browser close → offline reopen →
//   gap-fill and matching answered on the device → local score and criterion
//   detail → queued twice → reconnect → exactly two ledger events with scores.
//
// Prose and code are not in the pack; the screen says where the written route
// is. This walk does not claim a paper assessment was physically printed.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";
import { launchChrome, pageFor, sleep } from "./browser.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const authored = require("../.verify/lessons/authored/index.js");

const BASE = process.env.OPENMIND_BASE ?? process.env.OFFLINE_BASE ?? "http://127.0.0.1:4174";
const profileDir = mkdtempSync(path.join(tmpdir(), "openmind-offline-assessment-"));
const port = 10900 + Math.floor(Math.random() * 80);
const lesson = authored.AUTHORED_LESSONS.find((entry) => entry.conceptId === "photosynthesis");
const gapItem = lesson.assessment.find((item) => item.id === "a3");
const matchItem = lesson.assessment.find((item) => item.id === "a4");

let passed = 0;
let failed = 0;
const check = (condition, label) => {
  if (condition) { passed += 1; console.log(`  ✓ ${label}`); }
  else { failed += 1; console.error(`  ✗ FAIL: ${label}`); }
};
const section = (label) => console.log(`\n▸ ${label}`);
const json = (body, cookie = null) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify(body),
});
async function call(pathname, init = {}) {
  const response = await fetch(BASE + pathname, init);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 300) }; }
  return { status: response.status, body, headers: response.headers };
}
const exactButton = (text) => `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim() === ${JSON.stringify(text)})`;
const prefixedButton = (text) => `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim().startsWith(${JSON.stringify(text)}))`;
const isLogin = (u) => { try { return new URL(u).pathname === "/api/auth/login"; } catch { return false; } };

async function account() {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const email = `offline-assess-${stamp}@example.test`;
  const password = "offline-assess-password-123";
  const created = await call("/api/auth/signup", json({
    email, password, name: "offline_assess", role: "student", country: "GB", language: "en", subjects: ["biology"],
  }));
  const id = created.body?.profile?.profile?.id;
  const secret = created.body?.secret;
  const cookie = (created.headers.get("set-cookie") ?? "").split(";")[0];
  if (created.status !== 200 || !id || !secret) throw new Error(`signup: ${created.status} ${JSON.stringify(created.body)}`);
  const patched = await call("/api/profile", json({
    id, secret, onboarded: true, handle: "offline_assess", grade: "Year 10", subjects: ["biology"],
    subjectCourses: { biology: { spec: "uk-gcse", specLevel: "foundation" } },
  }, cookie));
  if (patched.status !== 200) throw new Error(`profile: ${patched.status} ${JSON.stringify(patched.body)}`);
  return { email, password, id, secret, cookie };
}

async function signIn(p, requests, pupil) {
  await p.goto(`${BASE}/onboarding?mode=signin`);
  await p.waitFor(`return !!document.querySelector("main input[type=email]");`, "the sign-in form", 25000);
  await p.typeInto(`document.querySelector("main input[type=email]")`, pupil.email, "the email");
  await p.typeInto(`document.querySelector("main input[type=password]")`, pupil.password, "the password");
  const before = requests.filter(isLogin).length;
  await p.clickExpr(exactButton("Sign in"), "the Sign in button");
  await p.waitFor(`return !document.querySelector("main input[type=email]");`, "the signed-in step", 30000);
  check(requests.filter(isLogin).length > before, "the normal form sent the login request");
}

async function launch(profile, debugPort) {
  const requests = [];
  const exceptions = [];
  const chrome = await launchChrome({
    port: debugPort,
    userDataDir: profile,
    keepProfile: true,
    onEvent: (message) => {
      if (message.method === "Network.requestWillBeSent") requests.push(message.params.request.url);
      if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails?.text ?? "exception");
    },
  });
  return { chrome, p: pageFor(chrome.send), requests, exceptions };
}

function offline(send, on) {
  return send("Network.emulateNetworkConditions", {
    offline: on,
    latency: 0,
    downloadThroughput: on ? 0 : -1,
    uploadThroughput: on ? 0 : -1,
    connectionType: on ? "none" : "wifi",
  });
}

async function waitController(p, url) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (await p.evaluate(`return !!navigator.serviceWorker?.controller;`)) {
      // THE EXACT URL, NOT ONLY THE CONTROLLER, MUST BE CACHED. The download
      // changed the address with history.replaceState, which fetches nothing;
      // the initial page was loaded before the worker controlled it. Reloading
      // now is what puts this query-string page in CacheStorage for the restart.
      await p.goto(url);
      await p.waitFor(`return !!document.querySelector("[data-offline-study]");`, "the downloaded lesson", 20000);
      return true;
    }
    await sleep(700);
    await p.goto(url);
    await p.waitFor(`return !!document.querySelector("[data-offline-study]");`, "the downloaded lesson", 20000);
  }
  return await p.evaluate(`return !!navigator.serviceWorker?.controller;`);
}

const gapAnswers = gapItem.gaps.gaps.map((gap) => gap.accepted[0]);
const matchAnswers = matchItem.matching.left.map((left) => matchItem.matching.pairs[left.id]);

let first = null;
let second = null;
try {
  const ping = await fetch(`${BASE}/api/health`);
  if (!ping.ok) throw new Error(`health ${ping.status}`);
  const pupil = await account();

  section("Online: download the authored assessment");
  first = await launch(profileDir, port);
  const p = first.p;
  await signIn(p, first.requests, pupil);
  await p.goto(`${BASE}/offline/study`);
  await p.waitFor(`return !!document.querySelector("#offline-concept");`, "the offline lesson picker", 30000);
  await p.waitFor(`return [...document.querySelectorAll("#offline-concept option")].some(o => o.value === "photosynthesis");`, "the photosynthesis option", 20000);
  await p.pickOption(`document.querySelector("#offline-concept")`, "photosynthesis", "offline lesson");
  await p.clickExpr(exactButton("Download lesson"), "the download button");
  await p.waitFor(`return !!document.querySelector("[data-offline-study]");`, "the downloaded lesson page", 30000);
  await p.waitFor(`return !!document.querySelector("[data-offline-authored-assessment]");`, "the authored assessment block", 20000);
  check(true, "the authored assessment block is on the downloaded lesson");
  check(await p.evaluate(`return !!document.querySelector('[data-offline-assessment="a3"] [data-offline-gap="${gapItem.gaps.gaps[0].id}"]');`) === true,
    "the gap-fill item renders a gap input");
  check(await p.evaluate(`return !!document.querySelector('[data-offline-assessment="a4"] [data-offline-match]');`) === true,
    "the matching item renders a pair select");
  const pack = await p.evaluate(`return JSON.parse(localStorage.getItem(${JSON.stringify(`openmind:offline-pack:${pupil.id}:photosynthesis`)}) || "null");`);
  check(Array.isArray(pack?.assessments) && pack.assessments.some((item) => item.id === "a3") && pack.assessments.some((item) => item.id === "a4"),
    "the stored pack contains the gap-fill and matching items");
  check(!pack.assessments.some((item) => item.kind === "constructed-response" || item.kind === "code"),
    "prose and code are not in the offline assessment");
  check(await waitController(p, `${BASE}/offline/study?concept=photosynthesis`), "a service worker controls the downloaded page");

  section("Offline after a browser restart: answer gap-fill and matching");
  await first.chrome.close();
  first = null;
  second = await launch(profileDir, port + 1);
  const q = second.p;
  await offline(second.chrome.send, true);
  await q.goto(`${BASE}/offline/study?concept=photosynthesis`);
  await q.waitFor(`return !!document.querySelector("[data-offline-authored-assessment]");`, "the cached assessment after restart", 30000);
  check(await q.evaluate(`return navigator.onLine === false;`) === true, "the browser really reports offline");
  for (let i = 0; i < gapItem.gaps.gaps.length; i += 1) {
    const gap = gapItem.gaps.gaps[i];
    await q.typeInto(`document.querySelector('[data-offline-assessment="a3"] [data-offline-gap="${gap.id}"]')`, gapAnswers[i], `gap ${gap.id}`);
  }
  await q.clickExpr(`document.querySelector('[data-offline-assessment="a3"] [data-offline-assessment-submit]')`, "the gap-fill submit");
  await q.waitFor(`return !!document.querySelector('[data-offline-assessment-result="a3"]');`, "the gap-fill result", 20000);
  const gapText = await q.evaluate(`return document.querySelector('[data-offline-assessment-result="a3"]')?.innerText ?? "";`);
  check(/5 \/ 5/.test(gapText), `the gap-fill earns 5/5 offline (${gapText.split("\n")[0]})`);
  check(/Local only/i.test(gapText), "the gap-fill is labelled local-only");
  check((gapText.match(/✓/g) ?? []).length >= gapItem.marking.length, "each gap criterion is shown as met");

  for (let i = 0; i < matchItem.matching.left.length; i += 1) {
    const left = matchItem.matching.left[i];
    await q.pickOption(`document.querySelector('[data-offline-assessment="a4"] [data-offline-match="${left.id}"]')`, matchAnswers[i], `match ${left.id}`);
  }
  await q.clickExpr(`document.querySelector('[data-offline-assessment="a4"] [data-offline-assessment-submit]')`, "the matching submit");
  await q.waitFor(`return !!document.querySelector('[data-offline-assessment-result="a4"]');`, "the matching result", 20000);
  const matchText = await q.evaluate(`return document.querySelector('[data-offline-assessment-result="a4"]')?.innerText ?? "";`);
  check(/5 \/ 5/.test(matchText), `the matching earns 5/5 offline (${matchText.split("\n")[0]})`);
  check(/Local only/i.test(matchText), "the matching is labelled local-only");

  const draft = await q.evaluate(`return JSON.parse(localStorage.getItem(${JSON.stringify(`openmind:offline-draft:${pupil.id}:photosynthesis`)}) || "null");`);
  check(Object.keys(draft?.answers ?? {}).length === 2, "both authored answers are persisted in the scoped draft");
  check(draft.answers.a3?.status === "queued" && draft.answers.a4?.status === "queued", "both authored answers are queued, not lost");

  section("Reconnect: exactly two scored events reach the ledger");
  await offline(second.chrome.send, false);
  await q.evaluate(`window.dispatchEvent(new Event("online")); return true;`);
  await q.waitFor(
    `return [...document.querySelectorAll("[data-offline-assessment-result]")].every(el => /Synced/i.test(el.innerText));`,
    "both assessment results to sync",
    30000,
  );
  const syncedText = await q.evaluate(`return [...document.querySelectorAll("[data-offline-assessment-result]")].map(el => el.innerText).join(" · ");`);
  check(/Synced/.test(syncedText), "both authored submissions show the synced state");

  const evidence = await call(`/api/evidence?id=${encodeURIComponent(pupil.id)}&secret=${encodeURIComponent(pupil.secret)}`, { headers: { Cookie: pupil.cookie } });
  const events = (evidence.body?.events ?? []).filter((event) => event.questionId?.startsWith("lesson:photosynthesis:"));
  check(events.length === 2, `exactly two authored assessment events are on the ledger (${events.length})`);
  check(events.some((event) => event.questionId === "lesson:photosynthesis:a3" && event.score?.awarded === 5 && event.score?.max === 5),
    "the gap-fill event carries 5/5");
  check(events.some((event) => event.questionId === "lesson:photosynthesis:a4" && event.score?.awarded === 5 && event.score?.max === 5),
    "the matching event carries 5/5");
  check(events.every((event) => event.provenance === "device"), "both events are labelled device provenance");
  const progress = await call(`/api/progress?id=${encodeURIComponent(pupil.id)}&secret=${encodeURIComponent(pupil.secret)}`, { headers: { Cookie: pupil.cookie } });
  const record = progress.body?.progress?.photosynthesis;
  check(record?.attempts === 2 && record?.marksAwarded === 10 && record?.marksAvailable === 10,
    `the two offline assessments project 10/10 marks into the learner model (${JSON.stringify(record && { attempts: record.attempts, marksAwarded: record.marksAwarded, marksAvailable: record.marksAvailable })})`);
  check(typeof record?.mastery === "number" && record.mastery > 0,
    "the scored evidence contributes to mastery rather than only a counter");
} finally {
  for (const running of [first, second]) {
    if (running) { try { await running.chrome.close(); } catch { /* already closed */ } }
  }
  rmSync(profileDir, { recursive: true, force: true });
}

console.log(`\noffline assessment browser: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
console.log("✓ authored gap-fill and matching were marked offline, survived a restart, queued once each and synced with their scores.");
