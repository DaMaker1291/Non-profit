#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE EDUCATOR REVIEW, DRIVEN THROUGH THE REAL BROWSER AND THE REAL DOOR.
//
// `validation-check.mjs` proves the contract; `validation-http-check.mjs` proves
// the HTTP authority. Neither proves that a teacher can reach the queue, fill the
// form and submit with the session the sign-in form gave them. This walk does,
// against a scratch store only:
//
//   teacher console → lesson review queue → ratio → fill → Record human review
//
// It then reads `lesson-validation.json` off disk, because a page that renders a
// record it never stored is the failure this exists for. A second invocation
// (`--phase=after-restart`) signs in again and proves the record is still there
// after the server has been replaced against the same directory.
//
// WHAT IT IS NOT. The account is a fixture and the review text says so. It is
// not a teacher's subject judgement and not human evidence. It never runs
// against `.openmind-data`.
//
//   OPENMIND_BASE=http://127.0.0.1:4173 \
//   OPENMIND_DATA_DIR=/tmp/openmind-validation-browser \
//   node scripts/validation-browser-check.mjs --phase=submit
//
//   … restart the server with the same OPENMIND_DATA_DIR …
//
//   OPENMIND_BASE=http://127.0.0.1:4173 \
//   OPENMIND_DATA_DIR=/tmp/openmind-validation-browser \
//   node scripts/validation-browser-check.mjs --phase=after-restart
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { launchChrome, pageFor, sleep } from "./browser.mjs";

const BASE = (process.env.OPENMIND_BASE ?? "").replace(/\/+$/, "");
const DATA_DIR = process.env.OPENMIND_DATA_DIR ? path.resolve(process.env.OPENMIND_DATA_DIR) : "";
const PHASE = process.argv.includes("--phase=after-restart") ? "after-restart" : "submit";
if (!BASE || !DATA_DIR || /(^|\/)\.openmind-data\/?$/.test(DATA_DIR)) {
  console.error(
    "Refusing to run: set OPENMIND_BASE and a SCRATCH OPENMIND_DATA_DIR (not .openmind-data).\n" +
    "This walk creates a teaching account and a review record in the store the server is using.",
  );
  process.exit(2);
}

const RUN = process.env.VALIDATION_RUN ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const FIXTURE_FILE = process.env.VALIDATION_FIXTURE_FILE ?? path.join(os.tmpdir(), "openmind-validation-browser-fixture.json");
const EVIDENCE_FILE = process.env.VALIDATION_EVIDENCE_FILE ?? path.join(os.tmpdir(), "openmind-validation-browser-evidence.json");
const LEDGER_FILE = path.join(DATA_DIR, "lesson-validation.json");
const LESSON_ID = "ratio";
const TEACHER_NAME = "Validation Browser Teacher";
const TEACHER_HANDLE = "vb_teacher";
const LEARNER_NAME = "Validation Browser Learner";
const QUALIFICATIONS = "Fixture account only — no teaching qualification is claimed or represented.";
const SCOPE = "Fixture review of the ratio lesson; no human subject judgement is represented.";
const FINDING = {
  id: "f1",
  location: "Worked example — ratio",
  problem: "Fixture finding: this text exists only to exercise the finding and task records.",
  educationalConsequence: "Fixture only: no learner consequence is claimed for this record.",
  recommendation: "Fixture only: carry this finding through persistence, task creation and restart.",
  severity: "major",
  blockPublication: false,
};
const NOTES = "Fixture submission — not a teacher's judgement. Proves authenticated storage and restart persistence.";

let passed = 0;
let failed = 0;
const check = (condition, name, detail = "") => {
  if (condition) {
    passed++;
    console.log(`   ✓ ${name}`);
  } else {
    failed++;
    console.log(`   ✗ FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
};
const section = (name) => console.log(`\n▸ ${name}`);

async function call(route, { method = "GET", cookie, body } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let response;
  try {
    response = await fetch(BASE + route, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(`could not reach ${BASE}${route}: ${error.message}`);
  }
  const raw = await response.text();
  let parsed = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = { raw: raw.slice(0, 200) }; }
  const setCookies = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie") ?? ""].filter(Boolean);
  return {
    status: response.status,
    body: parsed,
    cookie: setCookies.map((value) => value.split(";")[0]).filter(Boolean).join("; "),
  };
}

async function signup(role, name) {
  const email = `validation-browser-${role}-${RUN}@example.test`;
  const result = await call("/api/auth/signup", {
    method: "POST",
    body: {
      email,
      password: "validation-browser-password-1",
      name,
      role,
      country: "GB",
      language: "en",
      subjects: ["maths"],
    },
  });
  const account = result.body?.account;
  const profile = result.body?.profile?.profile;
  const secret = result.body?.secret;
  if (result.status !== 200 || !account?.id || !profile?.id || !secret) {
    throw new Error(`could not create the ${role} fixture: HTTP ${result.status} ${JSON.stringify(result.body?.error ?? "")}`);
  }
  const ready = await call("/api/profile", {
    method: "POST",
    body: {
      id: profile.id,
      secret,
      handle: role === "teacher" ? TEACHER_HANDLE : "vb_learner",
      country: "GB",
      language: "en",
      subjects: ["maths"],
      onboarded: true,
    },
  });
  if (ready.status !== 200) throw new Error(`could not complete the ${role} profile: HTTP ${ready.status}`);
  return {
    email,
    password: "validation-browser-password-1",
    name,
    role,
    accountId: account.id,
    profileId: profile.id,
    cookie: result.cookie,
  };
}

function ledger() {
  return JSON.parse(fs.readFileSync(LEDGER_FILE, "utf8"));
}

function findReview(records, id) {
  return records.find((review) => review.id === id) ?? null;
}

function findTask(records, reviewId) {
  return records.find((task) => task.reviewId === reviewId) ?? null;
}

async function loginThroughTheForm(page, requests, teacher) {
  const loginCount = () => requests.filter((url) => {
    try { return new URL(url).pathname === "/api/auth/login"; } catch { return false; }
  }).length;
  const before = loginCount();
  await page.goto(`${BASE}/onboarding?role=teacher&mode=signin`);
  await page.waitFor(`return !!document.querySelector("main input[type=email]");`, "the teacher sign-in form", 25000);
  await page.typeInto(`document.querySelector("main input[type=email]")`, teacher.email, "the teacher email");
  await page.typeInto(`document.querySelector("main input[type=password]")`, teacher.password, "the teacher password");
  await page.clickExpr(
    `[...document.querySelectorAll("main button")].find(b => (b.textContent || "").trim() === "Sign in")`,
    "the Sign in button",
  );
  await page.waitFor(`return !document.querySelector("main input[type=email]") && !!document.querySelector("main input[type=text]");`, "the teacher profile step after login", 25000);
  const name = await page.valueOf(`document.querySelector("main input[type=text]")`);
  if (!name) await page.typeInto(`document.querySelector("main input[type=text]")`, TEACHER_HANDLE, "the teacher display name");
  await page.clickExpr(
    `[...document.querySelectorAll("main button")].find(b => /^Teacher/.test((b.textContent || "").trim()))`,
    "the teacher finish button",
  );
  await page.waitFor(`return location.pathname === "/teacher";`, "the teacher console after signing in", 30000);
  check(loginCount() > before, "the normal sign-in form sent the login request");
  check(true, "the teacher reaches their console through the normal interface");
}

async function reachReview(page) {
  // The console renders its heading first, then the hub card and the class reads
  // land. A click dispatched during that re-render can be delivered to a node
  // the next render has already detached, which looks exactly like a dead link.
  // Wait for the client-side hub read as well as the link, so the page being
  // clicked is the hydrated console rather than its first paint.
  await page.waitFor(
    `return !!document.querySelector('a[href="/lesson-review"]') && /openmind hub · local/i.test(document.querySelector("main")?.innerText || "");`,
    "the teacher console's review link after its client reads",
    25000,
  );
  await page.clickExpr(`document.querySelector('a[href="/lesson-review"]')`, "the Review authored lessons link");
  await page.waitFor(`return location.pathname === "/lesson-review" && /Improvement queue/.test(document.querySelector("main")?.innerText || "");`, "the improvement queue", 25000);
  check(true, "the normal teacher journey opens /lesson-review");
  await page.waitFor(`return !!document.querySelector('a[href="/lesson-review/${LESSON_ID}"]');`, "the ratio lesson in the queue", 25000);
  await page.clickExpr(`document.querySelector('a[href="/lesson-review/${LESSON_ID}"]')`, "the ratio lesson link");
  await page.waitFor(`return location.pathname === "/lesson-review/${LESSON_ID}" && !!document.querySelector("#lesson-review-qualifications");`, "the ratio review form", 25000);
}

async function runSubmit() {
  section("An isolated teaching account and learner");
  check(DATA_DIR !== path.resolve(process.cwd(), ".openmind-data"), "the declared store is not the live .openmind-data");
  const teacher = await signup("teacher", TEACHER_NAME);
  const learner = await signup("student", LEARNER_NAME);
  check(teacher.accountId && teacher.profileId, "a teaching account exists in the scratch store");
  check(learner.accountId && learner.profileId, "a learner account exists in the same scratch store");
  check(teacher.cookie && learner.cookie, "both fixtures carry real account sessions");

  const requests = [];
  const posts = [];
  const responses = new Map();
  const chrome = await launchChrome({
    port: 9551,
    onEvent: (message) => {
      if (message.method === "Network.requestWillBeSent") {
        const request = message.params.request;
        requests.push(request.url);
        try {
          if (request.method === "POST" && new URL(request.url).pathname === "/api/lesson-review") {
            posts.push({
              requestId: message.params.requestId,
              url: request.url,
              postData: request.postData ?? "",
              headers: request.headers ?? {},
            });
          }
        } catch { /* not an absolute URL */ }
      }
      if (message.method === "Network.responseReceived") {
        responses.set(message.params.requestId, {
          status: message.params.response.status,
          url: message.params.response.url,
          mimeType: message.params.response.mimeType,
        });
      }
    },
  });
  const page = pageFor(chrome.send);
  try {
    section("The real sign-in form, the real queue, the real form");
    await loginThroughTheForm(page, requests, teacher);
    await reachReview(page);
    const pageState = await page.evaluate(`
      const form = document.querySelector("[data-lesson-review-form]");
      const codes = [...(form?.querySelectorAll("p code") ?? [])].map((el) => (el.textContent || "").trim());
      return {
        text: (document.querySelector("main")?.innerText || "").replace(/\\n+/g, " · "),
        version: codes[0] ?? null,
        hashPrefix: codes[1] ?? null,
        heading: document.querySelector("main h1")?.textContent?.trim() ?? null,
      };
    `);
    check(pageState.heading === "Ratio" || /ratio/i.test(pageState.text), `the ratio review screen is open (${pageState.heading})`);
    check(/Signed in as Validation Browser Teacher/.test(pageState.text), "the form names the signed-in account");
    check(/The server records your account, not a name supplied by this form/.test(pageState.text), "the interface states that identity is server-derived");

    await page.typeInto(`document.querySelector("#lesson-review-qualifications")`, QUALIFICATIONS, "the fixture qualifications");
    await page.typeInto(`document.querySelector("#lesson-review-scope")`, SCOPE, "the fixture review scope");
    await page.clickExpr(
      `[...document.querySelectorAll("[data-lesson-review-form] button")].find(b => (b.textContent || "").trim() === "Add finding")`,
      "the Add finding button",
    );
    await page.waitFor(`return !!document.querySelector("#finding-location-0");`, "the first finding fields");
    await page.typeInto(`document.querySelector("#finding-location-0")`, FINDING.location, "the finding location");
    await page.typeInto(`document.querySelector("#finding-problem-0")`, FINDING.problem, "the finding problem");
    await page.typeInto(`document.querySelector("#finding-consequence-0")`, FINDING.educationalConsequence, "the finding consequence");
    await page.typeInto(`document.querySelector("#finding-recommendation-0")`, FINDING.recommendation, "the finding recommendation");
    await page.clickExpr(
      `[...document.querySelectorAll("input[name='lesson-review-decision']")].find(el => /Request changes/.test(el.closest("label")?.innerText || ""))`,
      "the Request changes decision",
    );
    await page.typeInto(`document.querySelector("#lesson-review-notes")`, NOTES, "the review notes");
    const submitState = await page.evaluate(`
      const button = [...document.querySelectorAll("[data-lesson-review-form] button")].find(b => (b.textContent || "").trim() === "Record human review");
      return { exists: !!button, disabled: button?.disabled ?? null };
    `);
    check(submitState.exists && submitState.disabled === false, "the form enables submission with a signed-in teacher and a complete fixture");
    const beforePosts = posts.length;
    await page.clickExpr(
      `[...document.querySelectorAll("[data-lesson-review-form] button")].find(b => (b.textContent || "").trim() === "Record human review")`,
      "the Record human review button",
    );
    await page.waitFor(`return /Changes requested and recorded/.test(document.querySelector("[data-lesson-review-form] [role=status]")?.innerText || "");`, "the recorded-review notice", 25000);
    check(true, "the interface reports the review recorded");
    await page.waitFor(`return /A human reviewer requested changes to this version/.test(document.querySelector("main")?.innerText || "");`, "the server-rendered changes-requested state", 25000);

    let post = null;
    let response = null;
    for (let i = 0; i < 50; i++) {
      post = posts.length > beforePosts ? posts[posts.length - 1] : null;
      response = post ? responses.get(post.requestId) : null;
      if (post && response) break;
      await sleep(200);
    }
    check(Boolean(post), "the browser sent the review to the actual POST /api/lesson-review endpoint");
    check(response?.status === 200, `the actual endpoint accepted the session-backed review (${response?.status ?? "no response"})`);
    if (post && !post.postData) {
      try { post.postData = (await chrome.send("Network.getRequestPostData", { requestId: post.requestId })).postData ?? ""; } catch { /* the header assertion below reports the empty body */ }
    }
    let sent = null;
    try { sent = post ? JSON.parse(post.postData) : null; } catch { sent = null; }
    check(Boolean(sent), "the network request carried a JSON review body");
    check(sent?.lessonId === LESSON_ID, `the request is for the ratio lesson (${sent?.lessonId ?? "none"})`);
    check(sent?.lessonVersion === pageState.version, `the request is pinned to the rendered version (${sent?.lessonVersion} vs ${pageState.version})`);
    check(typeof sent?.contentHash === "string" && /^[0-9a-f]{64}$/.test(sent.contentHash), "the request is pinned to a full content hash");
    check(sent?.contentHash === String(sent?.contentHash).toLowerCase() && String(pageState.hashPrefix || "").startsWith(String(sent?.contentHash).slice(0, 16)), "the submitted hash matches the hash shown on the form");
    check(!("reviewer" in (sent ?? {})) && !("accountId" in (sent ?? {})) && !("source" in (sent ?? {})), "the browser sent no reviewer, account id or source field");
    check(!JSON.stringify(post?.headers ?? {}).includes("x-openmind"), "no test-only identity header was used");

    await page.waitFor(`return (document.querySelector("main")?.innerText || "").includes(${JSON.stringify(NOTES)});`, "the persisted review notes on the page", 20000);
    const pageAfter = await page.allText();
    check(/A human reviewer requested changes to this version/.test(pageAfter), "the page now shows a changes-requested human review");
    check(pageAfter.includes(TEACHER_NAME), "the page attributes the review to the signed-in teacher");
    check(pageAfter.includes(FINDING.problem), "the finding is rendered on the lesson review screen");

    const list = await call("/api/lesson-review");
    const review = (list.body?.reviews ?? []).find((row) => row.lessonId === LESSON_ID && row.notes === NOTES) ?? null;
    check(list.status === 200 && Boolean(review), `the review is readable through the API (${list.status})`);
    check(review?.reviewer?.name === TEACHER_NAME, `the API names the signed-in teacher as reviewer (${review?.reviewer?.name ?? "none"})`);
    check(review?.reviewer?.accountRole === "teacher", "the API records a teaching account, not a browser-supplied role");
    check(review?.decision === "changes-requested" && review?.lessonVersion === sent?.lessonVersion && review?.contentHash === sent?.contentHash, "the API record is decision-, version- and hash-specific");
    const task = (list.body?.tasks ?? []).find((row) => row.reviewId === review?.id) ?? null;
    check(Boolean(task) && task.status === "open" && task.severity === "major", `the finding became one open improvement task (${task?.status ?? "none"})`);

    const stored = ledger();
    const storedReview = findReview(stored.reviews ?? [], review?.id);
    const storedTask = findTask(stored.tasks ?? [], review?.id);
    check(Boolean(storedReview), "the review is present in the scratch store's lesson-validation.json");
    check(storedReview?.reviewer?.accountId === teacher.accountId, "the stored reviewer account id is the server's account id");
    check(storedReview?.reviewer?.name === TEACHER_NAME && storedReview?.source === "human" && storedReview?.authority === "teacher-account", "the stored record is pinned to the teaching account and its authority");
    check(Boolean(storedTask) && storedTask.status === "open", "the improvement task is persisted in the same ledger");
    check(storedReview?.lessonVersion === sent.lessonVersion && storedReview?.contentHash === sent.contentHash, "the stored record keeps the exact version and hash submitted");
    check(!fs.existsSync(path.resolve(process.cwd(), ".openmind-data", "lesson-validation.json")), "the live store was not given a lesson-validation.json by this run");

    const fixture = {
      run: RUN,
      base: BASE,
      dataDir: DATA_DIR,
      submittedAt: new Date().toISOString(),
      teacher,
      learner,
      reviewId: review.id,
      taskId: task.id,
      lessonId: LESSON_ID,
      lessonVersion: sent.lessonVersion,
      contentHash: sent.contentHash,
      notes: NOTES,
      findingProblem: FINDING.problem,
      reviewerName: TEACHER_NAME,
      createdAt: storedReview.createdAt,
    };
    await page.clickExpr(`document.querySelector('a[href="/lesson-review"]')`, "the View improvement queue link");
    await page.waitFor(`return location.pathname === "/lesson-review" && /1 human review record/.test(document.querySelector("main")?.innerText || "");`, "the queue after recording", 20000);
    const queue = await page.allText();
    check(/1 human review record/.test(queue) && /1 finding task/.test(queue), "the improvement queue counts the new review and task");
    check(queue.includes(FINDING.problem), "the queue renders the persisted finding");

    // Written AFTER the last assertion, so the record's own count matches the
    // run it describes. The first version wrote it earlier and reported 35 for
    // a 38-assertion pass — evidence that undercounts its own run is not
    // evidence a reader can reconcile.
    fs.writeFileSync(FIXTURE_FILE, JSON.stringify(fixture, null, 2));
    check(fs.existsSync(FIXTURE_FILE), `fixture written outside the repository (${FIXTURE_FILE})`);
    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify({
      ...fixture,
      phase: "submit",
      checksPassed: passed,
      checksFailed: failed,
      post: { status: response?.status, requestBody: sent },
      stored: { review: storedReview, task: storedTask },
    }, null, 2));
  } finally {
    await chrome.close();
  }
}

async function runAfterRestart() {
  section("The same authenticated journey after the server restart");
  if (!fs.existsSync(FIXTURE_FILE)) throw new Error(`no phase-one fixture at ${FIXTURE_FILE}`);
  const fixture = JSON.parse(fs.readFileSync(FIXTURE_FILE, "utf8"));
  check(fixture.dataDir === DATA_DIR, "this phase is pointed at the same scratch store the review was written to");
  const requests = [];
  const chrome = await launchChrome({ port: 9552, onEvent: (message) => {
    if (message.method === "Network.requestWillBeSent") requests.push(message.params.request.url);
  } });
  const page = pageFor(chrome.send);
  try {
    await loginThroughTheForm(page, requests, fixture.teacher);
    await reachReview(page);
    const pageBefore = await page.allText();
    check(/A human reviewer requested changes to this version/.test(pageBefore), "the restarted server still reports the changes-requested review");
    check(pageBefore.includes(fixture.notes), "the review notes survive the restart");
    check(pageBefore.includes(fixture.reviewerName), "the reviewer identity survives the restart");
    check(pageBefore.includes(fixture.findingProblem), "the finding survives the restart");
    const state = await page.evaluate(`
      const form = document.querySelector("[data-lesson-review-form]");
      const codes = [...(form?.querySelectorAll("p code") ?? [])].map((el) => (el.textContent || "").trim());
      return { version: codes[0] ?? null, hashPrefix: codes[1] ?? null };
    `);
    check(state.version === fixture.lessonVersion, `the review page still shows the reviewed version (${state.version})`);
    check(String(state.hashPrefix || "").startsWith(fixture.contentHash.slice(0, 16)), "the review page still shows the reviewed hash");

    await page.clickExpr(`document.querySelector('a[href="/lesson-review"]')`, "the improvement queue link after restart");
    await page.waitFor(`return location.pathname === "/lesson-review";`, "the queue after restart", 20000);
    const queue = await page.allText();
    check(/[1-9]\d* human review/.test(queue) && /[1-9]\d* finding task/.test(queue), "the improvement queue survives with its review and task");
    check(queue.includes(fixture.findingProblem), "the queue still shows the finding's task");

    const list = await call("/api/lesson-review");
    const review = (list.body?.reviews ?? []).find((row) => row.id === fixture.reviewId) ?? null;
    const task = (list.body?.tasks ?? []).find((row) => row.id === fixture.taskId) ?? null;
    check(Boolean(review) && review.notes === fixture.notes, "the API still returns the same review id and notes");
    check(Boolean(task) && task.status === "open" && task.problem === fixture.findingProblem, "the API still returns the same open task");
    const stored = ledger();
    const storedReview = findReview(stored.reviews ?? [], fixture.reviewId);
    const storedTask = findTask(stored.tasks ?? [], fixture.reviewId);
    check(storedReview?.createdAt === fixture.createdAt, "the stored review's creation time is unchanged");
    check(storedReview?.reviewer?.accountId === fixture.teacher.accountId, "the stored reviewer is still the authenticated account");
    check(storedTask?.status === "open", "the stored task survived the restart still open");
    check(true, "the review, finding and task survived the application restart intact");
    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify({
      ...fixture,
      phase: "after-restart",
      afterRestartAt: new Date().toISOString(),
      checksPassed: passed,
      checksFailed: failed,
      survivedRestart: Boolean(review && storedReview && storedTask),
    }, null, 2));
  } finally {
    await chrome.close();
  }
}

console.log(`  · base ${BASE}`);
console.log(`  · scratch store ${DATA_DIR}`);
console.log(`  · phase ${PHASE}`);
if (PHASE === "submit") await runSubmit();
else await runAfterRestart();

console.log("\n▸ Result");
console.log(`  ${passed} passed, ${failed} failed`);
console.log("  The account and review are labelled fixtures in the declared scratch store; they are not human evidence.");
process.exit(failed === 0 ? 0 : 1);
