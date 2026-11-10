#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE REVIEW INTAKE, THROUGH ITS REAL HTTP DOOR.
//
// `validation-check.mjs` proves the contract against a temporary store. This
// file proves the part that a pure test cannot: that a signed-in TEACHER's
// cookie reaches `teacherCaller`, that a learner's cookie is refused, that the
// server derives the reviewer from the account rather than the body, and that
// an accepted review and its improvement task survive a round trip.
//
// It is deliberately not runnable against the live store. Start a dev server
// with a scratch directory, then run this with the SAME directory declared:
//
//   OPENMIND_DATA_DIR=/tmp/openmind-validation-http \
//   OPENMIND_ALLOW_EPHEMERAL_STORE=1 npm run dev
//
//   OPENMIND_BASE=http://127.0.0.1:4173 \
//   OPENMIND_DATA_DIR=/tmp/openmind-validation-http npm run validation:http
//
// The accounts it creates are real accounts IN THAT SCRATCH STORE. They are
// deleted when the operator removes the scratch directory; no live learner,
// teacher or review is touched.
// ─────────────────────────────────────────────────────────────────────────────
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const BASE = (process.env.OPENMIND_BASE ?? "").replace(/\/+$/, "");
const DATA_DIR = process.env.OPENMIND_DATA_DIR ? path.resolve(process.env.OPENMIND_DATA_DIR) : "";
if (!BASE || !DATA_DIR || /(^|\/)\.openmind-data\/?$/.test(DATA_DIR)) {
  console.error(
    "Refusing to run: set OPENMIND_BASE and a SCRATCH OPENMIND_DATA_DIR (not .openmind-data).\n" +
    "This test creates real teacher and learner accounts in the store the server is using.",
  );
  process.exit(2);
}
console.log(`  · base ${BASE}`);
console.log(`  · expected scratch store ${DATA_DIR}`);
console.log("  · the server must have been started with this same OPENMIND_DATA_DIR; this check cannot inspect its process");

compileEngines();
const require = createRequire(import.meta.url);
const validation = require("../.verify/validation/review.js");
const { AUTHORED_BY_CONCEPT } = require("../.verify/lessons/authored/index.js");

const lesson = AUTHORED_BY_CONCEPT.ratio;
if (!lesson) {
  console.error("No authored ratio lesson; cannot run the HTTP checks.");
  process.exit(2);
}
const hash = validation.lessonContentHash(lesson);
const RUN = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

let passed = 0;
let failed = 0;
const check = (condition, name, detail = "") => {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

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
  const email = `validation-http-${role}-${RUN}@example.test`;
  const result = await call("/api/auth/signup", {
    method: "POST",
    body: {
      email,
      password: "validation-http-password-1",
      name,
      role,
      country: "GB",
      language: "en",
      subjects: ["maths"],
    },
  });
  return { ...result, email };
}

const allCriteria = Object.fromEntries(
  require("../.verify/validation/types.js").REVIEW_CRITERIA.map((criterion) => [criterion.id, true]),
);
const finding = {
  id: "f-http-1",
  location: "worked example",
  problem: "The example omits the step that chooses the multiplier.",
  educationalConsequence: "A pupil can copy the result without being able to choose the operation in a new problem.",
  recommendation: "State the multiplier and show it applied to both quantities.",
  severity: "major",
  blockPublication: false,
};
const submission = {
  lessonId: lesson.conceptId,
  lessonVersion: lesson.version,
  contentHash: hash,
  reviewRole: "subject-teacher",
  qualifications: "PGCE Mathematics, 8 years teaching the relevant curriculum (HTTP test fixture)",
  scope: "Whole lesson, current curriculum level (HTTP test fixture)",
  criteria: allCriteria,
  decision: "changes-requested",
  findings: [finding],
  notes: "HTTP integration fixture: this record exercises the signed-in route, not a real teacher's judgement.",
  reviewer: { name: "Spoofed client reviewer", accountId: "spoofed-account" },
};

console.log("\n▸ Accounts and authority");
const teacherName = "Validation HTTP teacher";
const teacher = await signup("teacher", teacherName);
check(teacher.status === 200 && Boolean(teacher.cookie), `a teacher account signs up with a session (${teacher.status})`, JSON.stringify(teacher.body).slice(0, 160));
const student = await signup("student", "Validation HTTP student");
check(student.status === 200 && Boolean(student.cookie), `a learner account signs up with a session (${student.status})`, JSON.stringify(student.body).slice(0, 160));

const publicList = await call("/api/lesson-review");
check(publicList.status === 200 && Array.isArray(publicList.body?.reviews), `the review ledger is readable (${publicList.status})`);

const unauth = await call("/api/lesson-review", { method: "POST", body: submission });
check(unauth.status === 401 && unauth.body?.error === "teacher_account_required", `no cookie is refused (${unauth.status} ${unauth.body?.error ?? ""})`);

const asLearner = await call("/api/lesson-review", { method: "POST", cookie: student.cookie, body: submission });
check(asLearner.status === 403 && asLearner.body?.error === "teacher_role_required", `a learner's session is refused (${asLearner.status} ${asLearner.body?.error ?? ""})`);

const blank = await call("/api/lesson-review", { method: "POST", cookie: teacher.cookie, body: { lessonId: lesson.conceptId } });
check(blank.status === 422 && Array.isArray(blank.body?.problems) && blank.body.problems.length > 0, `a blank form is refused with its reasons (${blank.status}, ${blank.body?.problems?.length ?? 0} problems)`);

const stale = await call("/api/lesson-review", {
  method: "POST",
  cookie: teacher.cookie,
  body: { ...submission, lessonVersion: "0.0.0" },
});
check(stale.status === 409 && stale.body?.error === "review_stale", `an old lesson version is stale (${stale.status} ${stale.body?.error ?? ""})`);

const staleHash = await call("/api/lesson-review", {
  method: "POST",
  cookie: teacher.cookie,
  body: { ...submission, contentHash: "0".repeat(64) },
});
check(staleHash.status === 409 && staleHash.body?.error === "review_stale", `an old content hash is stale (${staleHash.status} ${staleHash.body?.error ?? ""})`);

const aiAttempt = await call("/api/lesson-review", {
  method: "POST",
  cookie: teacher.cookie,
  body: { ...submission, source: "ai", decision: "approved" },
});
check(aiAttempt.status === 422 && aiAttempt.body?.problems?.some((p) => p.code === "not_human"), `an AI-sourced approval is refused at the HTTP door (${aiAttempt.status})`);

const blockingAttempt = await call("/api/lesson-review", {
  method: "POST",
  cookie: teacher.cookie,
  body: {
    ...submission,
    decision: "approved",
    findings: [{ ...finding, severity: "blocking", blockPublication: true }],
    notes: "HTTP integration fixture: a blocking finding must make approval impossible.",
  },
});
check(blockingAttempt.status === 422 && blockingAttempt.body?.problems?.some((p) => p.code === "approval_with_blocking_finding"), `an approval with a blocking finding is refused (${blockingAttempt.status})`);

const accepted = await call("/api/lesson-review", { method: "POST", cookie: teacher.cookie, body: submission });
check(accepted.status === 200 && accepted.body?.review?.id, `a current human review is accepted (${accepted.status})`, JSON.stringify(accepted.body).slice(0, 220));
check(accepted.body?.review?.reviewer?.name === teacherName, `the reviewer is the signed-in account, not the body's name (${accepted.body?.review?.reviewer?.name ?? "none"})`);
check(accepted.body?.review?.reviewer?.accountRole === "teacher" && accepted.body?.review?.reviewer?.accountId !== "spoofed-account", "the stored account identity is server-derived");
check(accepted.body?.review?.source === "human" && accepted.body?.review?.authority === "teacher-account", "the stored authority is human/teacher-account");
check(accepted.body?.review?.lessonVersion === lesson.version && accepted.body?.review?.contentHash === hash, "the record is pinned to the current version and hash");
check(accepted.body?.tasks?.length === 1 && accepted.body.tasks[0].status === "open", `the finding becomes one open task (${accepted.body?.tasks?.length ?? 0})`);

const taskId = accepted.body?.tasks?.[0]?.id;
check(Boolean(taskId), "the accepted task has an id");
const shortResolution = await call("/api/lesson-review", {
  method: "PATCH",
  cookie: teacher.cookie,
  body: { taskId, status: "done", note: "fixed" },
});
check(shortResolution.status === 422 && shortResolution.body?.error === "resolution_note_required", `marking done without a real note is refused (${shortResolution.status})`);

const resolved = await call("/api/lesson-review", {
  method: "PATCH",
  cookie: teacher.cookie,
  body: { taskId, status: "done", note: "Revised the worked example to name and apply the multiplier." },
});
check(resolved.status === 200 && resolved.body?.task?.status === "done", `the teacher can record a resolution (${resolved.status})`);

const after = await call("/api/lesson-review");
check(after.body?.reviews?.some((review) => review.id === accepted.body?.review?.id), "the review survives the round trip");
check(after.body?.tasks?.some((task) => task.id === taskId && task.status === "done"), "the completed task survives the round trip");
check(after.body?.reviews?.find((review) => review.id === accepted.body?.review?.id)?.decision === "changes-requested", "completing the task did not convert the review into an approval");

console.log("\n▸ Result");
console.log(`  ${passed} passed, ${failed} failed`);
console.log("  These accounts and records live only in the declared scratch store; they are not human evidence.");
process.exit(failed === 0 ? 0 : 1);
