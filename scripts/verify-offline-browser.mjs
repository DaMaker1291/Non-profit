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
//   8. hands the device back OFFLINE and proves the unsynchronised queue is
//      retained, scoped to that learner, and invisible to the next learner;
//   9. signs a second learner in on the same browser profile, restarts offline,
//      and proves no pack, answer or queue crosses over;
//  10. signs the first learner back in and proves the held queue drains ONCE;
//  11. signs out and proves local packs/drafts are gone while no unsynchronised
//      evidence was deleted.
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
let third = null;
try {
  const ping = await fetch(`${BASE}/api/health`);
  if (!ping.ok) throw new Error(`health ${ping.status}`);

  section("A pupil downloads an authored lesson while online");
  const pupil = await account("student", "offline_p1");
  // THE SECOND LEARNER IS CREATED NOW, BUT DOES NOT TOUCH THE BROWSER UNTIL
  // THE HAND-BACK. That is the shared-computer sequence: one profile, one
  // browser, two people, and no assumption that the first one is gone.
  const classmate = await account("student", "offline_p2");
  check((await patch(classmate, {
    onboarded: true, handle: "offline_p2", grade: "Year 10", subjects: ["maths"],
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
  })).status === 200, "the second learner's profile is complete");
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
  check(/written assessment/i.test(downloaded) && /printable worksheet/i.test(downloaded),
    "the pack names the printed worksheet as the route to the written assessment");
  check(/teacher answer key is a separate/i.test(downloaded),
    "the pack does not present its marked practice as the teacher's answer key");
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

  section("Learner A hands the device back while still offline");
  await q.clickExpr(exactButton("Hand back this device"), "Hand back this device");
  await q.waitFor(
    `return !localStorage.getItem("openmind:profileId") && localStorage.getItem("openmind:signedOut") === "1";`,
    "the offline hand-back to clear the identity",
    20000,
  );
  const handed = await q.evaluate(`return (() => {
    const keys = Object.keys(localStorage);
    const queueKey = keys.find((k) => k.startsWith("openmind:sync-queue:"));
    const queue = queueKey ? JSON.parse(localStorage.getItem(queueKey) || "[]") : [];
    return {
      keys,
      packKey: keys.find((k) => k.startsWith("openmind:offline-pack:")) ?? null,
      draftKey: keys.find((k) => k.startsWith("openmind:offline-draft:")) ?? null,
      queueKey: queueKey ?? null,
      queue,
      signedOut: localStorage.getItem("openmind:signedOut"),
      profileId: localStorage.getItem("openmind:profileId"),
    };
  })();`);
  check(handed.profileId === null, "the hand-back really cleared the signed-in identity offline");
  check(handed.packKey === null && handed.draftKey === null, "the hand-back removed A's packs and drafts from the screen");
  const ledgerAtHandback = await call(`/api/evidence?id=${encodeURIComponent(pupil.id)}&secret=${encodeURIComponent(pupil.secret)}`, { method: "GET" });
  const eventsAtHandback = Array.isArray(ledgerAtHandback.body?.events) ? ledgerAtHandback.body.events : [];
  check(handed.queueKey && handed.queue.length === 1 && handed.queue[0]?.body?.events?.[0]?.id === eventId,
    `the unsynchronised answer was NOT deleted at sign-out (keys=${JSON.stringify(handed.keys)}, ledger=${eventsAtHandback.length})`);
  check(handed.signedOut === "1", "the device records that it was handed back, so a server cookie cannot restore A");

  section("Learner B signs in on the same browser profile");
  await offline(second.send, false);
  await q.goto(`${BASE}/onboarding?mode=signin`);
  await signIn(q, second.requests, classmate);
  await sleep(1200);
  const separated = await q.evaluate(`return (() => {
    const keys = Object.keys(localStorage);
    const queueFor = (prefix) => {
      const k = keys.find((x) => x.startsWith(prefix));
      return { key: k ?? null, rows: k ? JSON.parse(localStorage.getItem(k) || "[]") : [] };
    };
    return {
      profileId: localStorage.getItem("openmind:profileId"),
      signedOut: localStorage.getItem("openmind:signedOut"),
      allQueues: keys.filter((k) => k.startsWith("openmind:sync-queue")).map((k) => ({ key: k, rows: JSON.parse(localStorage.getItem(k) || "[]") })),
      aQueue: queueFor(${JSON.stringify(`openmind:sync-queue:${pupil.id}`)}),
      bQueue: queueFor(${JSON.stringify(`openmind:sync-queue:${classmate.id}`)}),
    };
  })();`);
  check(separated.profileId === classmate.id, "B's identity replaced A's after a real sign-in");
  check(separated.signedOut === null, "B's successful sign-in cleared the hand-back marker");
  const ledgerAtB = await call(`/api/evidence?id=${encodeURIComponent(pupil.id)}&secret=${encodeURIComponent(pupil.secret)}`, { method: "GET" });
  const eventsAtB = Array.isArray(ledgerAtB.body?.events) ? ledgerAtB.body.events : [];
  check(separated.aQueue.rows.length === 1 && separated.aQueue.rows[0]?.body?.events?.[0]?.id === eventId,
    `A's unsynchronised answer is still held under A's own key (ledger=${eventsAtB.length}, queues=${JSON.stringify(separated.allQueues.map((q) => ({ key: q.key, n: q.rows.length })))})`);
  check(separated.bQueue.rows.length === 0, "B's queue is empty: A's evidence was not adopted or drained under B");

  await q.goto(url);
  await q.waitFor(`return !!document.querySelector("#offline-concept");`, "B's download chooser, not A's lesson", 25000);
  const bView = await q.evaluate(`return {
    text: (document.body.innerText || "").replace(/\\n+/g, " · "),
    study: !!document.querySelector("[data-offline-study]"),
    answer: !!document.querySelector("[data-offline-answer-status]"),
  };`);
  check(!bView.study && !bView.answer, "B cannot open A's downloaded lesson or answers");
  check(!bView.text.includes(eventId), "A's event id is not rendered to B");

  section("The browser is restarted offline while B is signed in");
  await offline(second.send, true);
  await second.close();
  second = null;
  await sleep(1200);
  third = await open(profileDir, ports.pop());
  const r = third.p;
  await offline(third.send, true);
  await r.waitFor(`return navigator.onLine === false;`, "the third browser to report offline", 10000);
  let bRestartError = null;
  try { await r.goto(url); } catch (e) { bRestartError = e.message; }
  await r.waitFor(`return !!document.querySelector("#offline-concept");`, "B's cached download chooser after a restart", 30000);
  const bRestart = await r.evaluate(`return (() => {
    const keys = Object.keys(localStorage);
    const aKey = ${JSON.stringify(`openmind:sync-queue:${pupil.id}`)};
    return {
      text: (document.body.innerText || "").replace(/\\n+/g, " · "),
      study: !!document.querySelector("[data-offline-study]"),
      profileId: localStorage.getItem("openmind:profileId"),
      aQueue: aKey ? JSON.parse(localStorage.getItem(aKey) || "[]") : [],
      packs: keys.filter((k) => k.startsWith("openmind:offline-pack:")),
      drafts: keys.filter((k) => k.startsWith("openmind:offline-draft:")),
    };
  })();`);
  check(bRestartError === null, `B's offline page was served from the device (${bRestartError ?? "no navigation error"})`);
  check(bRestart.profileId === classmate.id, "the restarted browser still names B, not A");
  check(!bRestart.study && !/Correct|Not yet|Local only/.test(bRestart.text), "no previous learner answers are visible after the restart");
  check(bRestart.packs.length === 0 && bRestart.drafts.length === 0,
    `B's device holds none of A's packs or drafts (${JSON.stringify(bRestart.packs.concat(bRestart.drafts))})`);
  check(bRestart.aQueue.length === 1, "A's held answer survived B's restart and was not drained");

  section("B hands the device back; A signs in again");
  await offline(third.send, false);
  await r.goto(`${BASE}/account`);
  await r.waitFor(`return !!${exactButton("Sign out")};`, "B's account sign-out control", 25000);
  await r.clickExpr(exactButton("Sign out"), "Sign out");
  await r.waitFor(`return location.pathname === "/" || location.pathname === "/onboarding";`, "B's signed-out screen", 25000);
  await r.goto(`${BASE}/onboarding?mode=signin`);
  await signIn(r, third.requests, pupil);
  let events = [];
  for (let i = 0; i < 30; i++) {
    const ledger = await call(`/api/evidence?id=${encodeURIComponent(pupil.id)}&secret=${encodeURIComponent(pupil.secret)}`, { method: "GET" });
    events = Array.isArray(ledger.body?.events) ? ledger.body.events : [];
    if (events.length > 0) break;
    await sleep(1000);
  }
  const mine = events.filter((e) => e.id === eventId);
  check(mine.length === 1, `the server ledger has exactly one event for this submission (${mine.length})`);
  check(events.length === 1, `the learner's ledger contains exactly one answer (${events.length})`);
  check(mine[0]?.provenance === "device" || mine[0]?.source === "practice", "the recorded event is an answer event");
  const heldAfter = await r.evaluate(`return (() => {
    const k = ${JSON.stringify(`openmind:sync-queue:${pupil.id}`)};
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : [];
  })();`);
  check(heldAfter.length === 0, "A's queue is empty only after the server accepted the event");

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

  section("Sign-out removes local work and never deletes held evidence");
  await r.goto(`${BASE}/account`);
  await r.waitFor(`return !!${exactButton("Sign out")};`, "the account sign-out control", 25000);
  await r.clickExpr(exactButton("Sign out"), "Sign out");
  await r.waitFor(`return location.pathname === "/" || location.pathname === "/onboarding";`, "the signed-out screen", 25000);
  const leftover = await r.evaluate(`return (() => {
    const keys = Object.keys(localStorage);
    const queueKey = keys.find((k) => k.startsWith("openmind:sync-queue"));
    return {
      packsAndDrafts: keys.filter((k) => k.startsWith("openmind:offline-")),
      queueKey: queueKey ?? null,
      queue: queueKey ? JSON.parse(localStorage.getItem(queueKey) || "[]") : [],
      signedOut: localStorage.getItem("openmind:signedOut"),
    };
  })();`);
  check(leftover.packsAndDrafts.length === 0, `no offline packs or drafts remain after sign-out (${JSON.stringify(leftover.packsAndDrafts)})`);
  check(leftover.queue.length === 0, "the queue is empty because the server accepted it, not because sign-out deleted it");
  check(leftover.signedOut === "1", "sign-out records the hand-back for the next page load");
} finally {
  try { if (browser) await browser.close(); } catch { /* best effort */ }
  try { if (second) await second.close(); } catch { /* best effort */ }
  try { if (third) await third.close(); } catch { /* best effort */ }
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* best effort */ }
}

console.log(`\n${"─".repeat(58)}`);
console.log(`OFFLINE BROWSER: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
