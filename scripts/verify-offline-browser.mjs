#!/usr/bin/env node
// ── OFFLINE LEARNING, IN A REAL BROWSER WITH THE NETWORK OFF ────────────────
//
// This is deliberately not an API test with a simulated failure. It:
//   1. signs a pupil in through the normal form;
//   2. downloads an authored lesson while online;
//   3. waits until the production service worker controls the page;
//   4. disables the browser's network, closes Chrome, and reopens the SAME
//      profile — so the work has to survive a real browser restart;
//   5. answers a question and proves the UI says LOCAL ONLY, not synced;
//   6. restores the network and proves the queue drains through /api/evidence;
//   7. reads the ledger and proves exactly one event; then replays the same
//      submission and proves it is a duplicate, not a second event;
//   8. signs out and proves the learner's local packs and queue are gone.
//
// Run against a PRODUCTION build, because the service worker is intentionally
// unregistered in development:
//   OPENMIND_DATA_DIR=/tmp/openmind-offline OPENMIND_ALLOW_EPHEMERAL_STORE=1 npx next start -p 4174
//   node scripts/verify-offline-browser.mjs
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { launchChrome, pageFor, sleep } from "./browser.mjs";

const BASE = process.env.OFFLINE_BASE ?? "http://127.0.0.1:4174";
const url = `${BASE}/offline/study?concept=fractions`;
const profileDir = mkdtempSync(path.join(tmpdir(), "openmind-offline-profile-"));
const ports = [10500, 10600, 10700].map((n) => n + Math.floor(Math.random() * 80));

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

async function account(role, handle) {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const email = `offline-${role}-${stamp}@example.test`;
  const password = "offline-password-123";
  const r = await call("/api/auth/signup", json({
    email, password, name: handle, role, country: "GB", language: "en", subjects: ["maths"],
  }));
  const id = r.body?.profile?.profile?.id;
  const secret = r.body?.secret;
  const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  if (r.status !== 200 || !id || !secret) throw new Error(`signup: ${r.status} ${JSON.stringify(r.body)}`);
  return { email, password, id, secret, cookie };
}
const patch = (a, body) => call("/api/profile", json({ id: a.id, secret: a.secret, ...body }, a.cookie));

async function open(userDataDir, port) {
  const requests = [];
  const responses = [];
  const exceptions = [];
  const chrome = await launchChrome({
    port,
    userDataDir,
    keepProfile: true,
    onEvent: (m) => {
      if (m.method === "Network.requestWillBeSent") requests.push(m.params.request.url);
      if (m.method === "Network.responseReceived") responses.push({ url: m.params.response.url, status: m.params.response.status });
      if (m.method === "Runtime.exceptionThrown") exceptions.push(m.params.exceptionDetails?.exception?.description ?? m.params.exceptionDetails?.text ?? "exception");
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

async function finishPupil(p) {
  if (await p.evaluate(`return !!${prefixedButton("Next")};`)) {
    await p.clickExpr(prefixedButton("Next"), "the pupil Next button");
    await p.waitFor(`return document.querySelectorAll("main input[type=checkbox]").length > 0;`, "the subjects step", 20000);
  }
  await p.clickExpr(prefixedButton("Start learning"), "the pupil finish button");
  await p.waitFor(`return location.pathname !== "/onboarding";`, "the pupil to leave enrolment", 30000);
}

/** Wait until the page has a controlling service worker. A new registration
 *  controls only AFTER a navigation, so this reloads online until it does. */
async function awaitController(p) {
  for (let i = 0; i < 4; i++) {
    if (await p.evaluate(`return !!navigator.serviceWorker?.controller;`)) return true;
    await sleep(900);
    await p.goto(url);
    await p.waitFor(`return !!document.querySelector("[data-offline-study]");`, "the downloaded lesson", 25000);
  }
  return await p.evaluate(`return !!navigator.serviceWorker?.controller;`);
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

let browser = null;
let second = null;
try {
  const ping = await fetch(`${BASE}/api/health`);
  if (!ping.ok) throw new Error(`health ${ping.status}`);

  section("A pupil downloads an authored lesson while online");
  const pupil = await account("student", "offline_p1");
  check((await patch(pupil, {
    onboarded: true, handle: "offline_p1", grade: "Year 10", subjects: ["maths"],
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
  })).status === 200, "the pupil profile is complete");
  browser = await open(profileDir, ports.pop());
  const p = browser.p;
  await signIn(p, browser.requests, pupil);
  await finishPupil(p);
  await p.goto(url);
  await p.waitFor(`return !!document.querySelector("#offline-concept");`, "the offline lesson chooser", 25000);
  await p.pickOption(`document.querySelector("#offline-concept")`, "fractions", "the offline lesson");
  await p.clickExpr(exactButton("Download lesson"), "Download lesson");
  await p.waitFor(`return !!document.querySelector("[data-offline-study]");`, "the downloaded lesson", 30000);
  const downloaded = await p.allText();
  check(downloaded.includes("Fractions"), "the saved lesson is the authored Fractions lesson");
  check(downloaded.includes("MIT"), "the pack states its rights and licence");
  const control = await awaitController(p);
  check(control, "a production service worker controls the lesson page");

  section("The network is disabled; the browser is closed and reopened");
  await offline(browser.send, true);
  await p.waitFor(`return navigator.onLine === false;`, "the browser to report offline", 10000);
  let navError = null;
  try { await p.goto(url); } catch (e) { navError = e.message; }
  await p.waitFor(`return !!document.querySelector("[data-offline-study]");`, "the cached lesson after an offline reload", 30000);
  check(navError === null, `the offline reload was served from the device (${navError ?? "no navigation error"})`);
  check((await p.allText()).includes("Working offline"), "the page says Working offline");

  await p.clickExpr(`document.querySelector("[data-offline-question] button")`, "the first offline answer option");
  await p.waitFor(`return !!document.querySelector('[data-offline-answer-status="queued"]');`, "the local-only answer mark", 15000);
  const localOnly = await p.evaluate(`return {
    text: (document.querySelector("[data-offline-answer-status=queued]")?.innerText || "").replace(/\\n+/g, " · "),
    working: !!document.querySelector('[data-offline-status="working"]'),
    synced: !!document.querySelector('[data-offline-status="synced"]'),
  };`);
  check(localOnly.working && !localOnly.synced, "the learner is told the answer is local only, not synced");
  check(/Local only/i.test(localOnly.text), "the answer itself says it has not reached the server");

  const saved = await p.evaluate(`return (() => {
    const keys = Object.keys(localStorage);
    const packKey = keys.find((k) => k.startsWith("openmind:offline-pack:"));
    const draftKey = keys.find((k) => k.startsWith("openmind:offline-draft:"));
    const queueKey = keys.find((k) => k.startsWith("openmind:sync-queue:"));
    const draft = draftKey ? JSON.parse(localStorage.getItem(draftKey) || "null") : null;
    const queue = queueKey ? JSON.parse(localStorage.getItem(queueKey) || "[]") : [];
    return { packKey, draftKey, queueKey, draft, queue, allKeys: keys };
  })();`);
  const answer = saved.draft ? Object.values(saved.draft.answers)[0] : null;
  check(!!saved.packKey && !!saved.draftKey, "the pack and draft are scoped to this learner's keys");
  check(!!answer && answer.status === "queued", "the local draft holds one queued answer");
  check(Array.isArray(saved.queue) && saved.queue.length === 1, "the sync queue holds that answer exactly once");
  check(!!answer?.eventId && saved.queue?.[0]?.body?.events?.[0]?.id === answer.eventId, "the queued event and the draft name the same event");
  const queuedBody = saved.queue?.[0]?.body;
  const eventId = answer?.eventId;

  await browser.close();
  browser = null;
  await sleep(1200);

  // A NEW PROCESS, SAME PROFILE, AND STILL OFFLINE. This is the claim that a
  // tab refresh cannot make: the work lives in device storage and survives a
  // browser restart with no server reachable.
  second = await open(profileDir, ports.pop());
  const q = second.p;
  await offline(second.send, true);
  await q.waitFor(`return navigator.onLine === false;`, "the reopened browser to report offline", 10000);
  let reopenError = null;
  try { await q.goto(url); } catch (e) { reopenError = e.message; }
  try {
    await q.waitFor(`return !!document.querySelector("[data-offline-study]");`, "the cached lesson after reopening the browser", 30000);
  } catch (e) {
    const keys = await q.evaluate(`return { keys: Object.keys(localStorage), text: (document.body.innerText || "").replace(/\\n+/g, " · ").slice(0, 500) };`);
    console.error("    reopened profile storage:", JSON.stringify(keys));
    console.error("    reopened exceptions:", JSON.stringify(second.exceptions));
    console.error("    reopened responses:", JSON.stringify(second.responses.slice(-12)));
    throw e;
  }
  check(reopenError === null, `the reopened browser served the lesson from its cache (${reopenError ?? "no navigation error"})`);
  const reopened = await q.evaluate(`return {
    text: (document.querySelector("[data-offline-study]")?.innerText || "").replace(/\\n+/g, " · "),
    status: !!document.querySelector('[data-offline-answer-status="queued"]'),
    working: !!document.querySelector('[data-offline-status="working"]'),
  };`);
  check(reopened.status && reopened.working, "the queued answer and Working offline status survived the restart");
  check(reopened.text.includes("Fractions"), "the reopened page is still the downloaded Fractions lesson");

  section("The network returns; the queued answer is synchronised once");
  await offline(second.send, false);
  const cameBack = await q.waitFor(`return navigator.onLine === true;`, "the browser to report online", 15000).then(() => true).catch(() => false);
  check(cameBack, "the browser observes the restored connection");
  let synced = await q.waitFor(
    `return !!document.querySelector('[data-offline-status="synced"]') && !!document.querySelector('[data-offline-answer-status="synced"]');`,
    "the server-confirmed Synced state",
    30000,
  ).then(() => true).catch(() => false);
  if (!synced) {
    // A reload is still a real reconnect path; the mount sync must drain the
    // queue, and the page must then show the server-confirmed state.
    await q.goto(url);
    await q.waitFor(`return !!document.querySelector("[data-offline-study]");`, "the lesson after reconnect", 30000);
    synced = await q.waitFor(
      `return !!document.querySelector('[data-offline-status="synced"]');`,
      "the server-confirmed Synced state after reload",
      30000,
    ).then(() => true).catch(() => false);
  }
  check(synced, "the page says Synced only after the server answered");
  const after = await q.evaluate(`return (document.querySelector("[data-offline-study]")?.innerText || "").replace(/\\n+/g, " · ");`);
  check(/Synced/i.test(after), "the visible status names the server confirmation");

  const ledger = await call(`/api/evidence?id=${encodeURIComponent(pupil.id)}&secret=${encodeURIComponent(pupil.secret)}`, { method: "GET" });
  const events = Array.isArray(ledger.body?.events) ? ledger.body.events : [];
  const mine = events.filter((e) => e.id === eventId);
  check(ledger.status === 200 && mine.length === 1, `the server ledger has exactly one event for this submission (${mine.length})`);
  check(events.length === 1, `the learner's ledger contains exactly one answer (${events.length})`);
  check(mine[0]?.provenance === "device" || mine[0]?.source === "practice", "the recorded event is an answer event");

  // Replay the EVENT, not the request that carried it. Sending the whole body
  // as an event is a malformed request, and the first version of this walk
  // proved only that malformed requests are refused — not that replay is
  // idempotent.
  const replay = await call("/api/evidence", json({ id: pupil.id, secret: pupil.secret, events: [queuedBody.events[0]] }, pupil.cookie));
  if ((replay.body?.duplicates ?? 0) !== 1) console.error("    replay event:", JSON.stringify(queuedBody.events[0]));
  check(
    replay.status === 200 && (replay.body?.accepted ?? 0) === 0 && (replay.body?.duplicates ?? 0) === 1,
    `the same submission is a duplicate, not a second event (${JSON.stringify(replay.body)})`,
  );
  const ledger2 = await call(`/api/evidence?id=${encodeURIComponent(pupil.id)}&secret=${encodeURIComponent(pupil.secret)}`, { method: "GET" });
  const events2 = Array.isArray(ledger2.body?.events) ? ledger2.body.events : [];
  check(events2.length === 1, `the replay did not add an event (${events2.length})`);

  section("Sign-out removes the learner's local work");
  await q.goto(`${BASE}/account`);
  await q.waitFor(`return !!${exactButton("Sign out")};`, "the account sign-out control", 25000);
  await q.clickExpr(exactButton("Sign out"), "Sign out");
  await q.waitFor(`return location.pathname === "/" || location.pathname === "/onboarding";`, "the signed-out screen", 25000);
  const leftover = await q.evaluate(`return Object.keys(localStorage).filter((k) => k.startsWith("openmind:offline-") || k.startsWith("openmind:sync-queue"));`);
  check(leftover.length === 0, `no offline packs, drafts or queue remain after sign-out (${JSON.stringify(leftover)})`);
} finally {
  try { if (browser) await browser.close(); } catch { /* best effort */ }
  try { if (second) await second.close(); } catch { /* best effort */ }
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* best effort */ }
}

console.log(`\n${"─".repeat(58)}`);
console.log(`OFFLINE BROWSER: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
