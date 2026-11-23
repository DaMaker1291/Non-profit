#!/usr/bin/env node
// ── A READ-ONLY CONTENT MIRROR A SCHOOL CAN CARRY ON A USB STICK ────────────
//
// Feasibility answer: a school does not need a server product. It needs one
// approved, versioned folder that any laptop can serve over its own network.
// This script builds that folder from the same authored lessons the app uses:
//
//   dist/openmind-content/manifest.json   version, counts, SHA-256 per file
//   dist/openmind-content/lessons/<id>.json   teaching + marked practice
//   dist/openmind-content/index.html      a plain list, no answers
//   dist/openmind-content/README.txt      how to serve and copy it
//
// IT DOES NOT CONTAIN LEARNER RECORDS, ACCOUNTS, TEACHER KEYS OR A DATABASE.
// The learner devices still send evidence to the main OpenMind instance when
// they reconnect. The mirror is content, not an authenticated package, and the
// README says exactly that.
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const authored = require("../.verify/lessons/authored/index.js");
const plans = require("../.verify/lesson-plans.js");
const questions = require("../.verify/questions.js");
const genome = require("../.verify/genome.js");

const OUT = path.resolve(process.env.OPENMIND_CONTENT_DIR ?? "dist/openmind-content");
const VERSION = process.env.OPENMIND_CONTENT_VERSION ?? `content-${new Date().toISOString().slice(0, 10)}`;

function planFor(lesson) {
  const authoredPlan = plans.planFor?.(lesson.conceptId, "en");
  if (authoredPlan) return authoredPlan;
  return {
    objective: lesson.objectives[0]?.statement ?? lesson.curriculum.reference,
    intuition: lesson.introduction.hook,
    idea: lesson.explanation.flatMap((e) => [e.heading, ...e.paragraphs]),
    traps: lesson.misconceptions.map((m) => ({ move: m.belief, why: m.whyItFails })),
    usedFor: lesson.curriculum.reference,
    figure: null,
    workedExamples: lesson.workedExamples.map((w) => ({
      prompt: w.prompt,
      steps: w.steps.map((s) => `${s.move} — ${s.why}`),
      answer: w.answer,
    })),
  };
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(path.join(OUT, "lessons"), { recursive: true });

const files = [];
const index = [];
for (const lesson of authored.AUTHORED_LESSONS) {
  const concept = genome.getConcept(lesson.conceptId);
  const plan = planFor(lesson);
  const pack = {
    contract: "openmind.offline-pack/1.0",
    conceptId: lesson.conceptId,
    title: concept?.title ?? lesson.conceptId,
    subject: lesson.subject,
    review: lesson.declaredStatus,
    language: "en",
    rights: {
      basis: "OpenMind-authored",
      licence: "MIT",
      note: "Only lessons authored in this repository are packaged. No third-party text is included.",
    },
    plan: {
      objective: plan.objective,
      intuition: plan.intuition,
      idea: plan.idea,
      traps: plan.traps,
      usedFor: plan.usedFor,
      figure: plan.figure ?? null,
      workedExamples: plan.workedExamples ?? [],
    },
    questions: [0, 1, 2]
      .map((i) => questions.generateQuestion(lesson.conceptId, `local:${lesson.conceptId}:${i}`))
      .filter(Boolean),
  };
  const rel = `lessons/${lesson.conceptId}.json`;
  const body = JSON.stringify(pack, null, 2) + "\n";
  writeFileSync(path.join(OUT, rel), body);
  const sha256 = createHash("sha256").update(body).digest("hex");
  files.push({ path: rel, bytes: Buffer.byteLength(body), sha256 });
  index.push({ id: lesson.conceptId, title: pack.title, subject: pack.subject, review: pack.review, path: rel });
}

const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpenMind local content ${VERSION}</title>
<style>body{font:16px/1.45 system-ui,sans-serif;max-width:820px;margin:40px auto;padding:0 18px}code{background:#f1f3f2;padding:1px 4px}li{margin:4px 0}</style>
<h1>OpenMind local content</h1>
<p><strong>${index.length} lessons.</strong> Version <code>${VERSION}</code>. This is a read-only content mirror, not an account server and not a learner record store.</p>
<p>Serve it on the school network with <code>node scripts/serve-local-content.mjs</code>, or copy this folder to a USB stick. The manifest lists a SHA-256 for every lesson file.</p>
<ul>${index.map((r) => `<li><a href="${r.path}">${r.title}</a> · ${r.subject} · ${r.review.replace(/_/g, " ")}</li>`).join("")}</ul>
</html>
`;
writeFileSync(path.join(OUT, "index.html"), html);

const readme = `OpenMind local content mirror — ${VERSION}

WHAT THIS IS
  ${index.length} authored lessons, with teaching, worked examples and three
  marked practice questions each. It is the same content the app packages for
  one learner to keep on a device, served read-only from one computer.

WHAT THIS IS NOT
  - Not an account server. There is no sign-in here.
  - Not a learner record store. No profiles, papers, evidence or classes.
  - Not a teacher answer key. The separate key stays behind the teacher account
    in the main OpenMind application.
  - Not an authenticated package. Integrity is a SHA-256 manifest, which detects
    damage in transit; it does not prove who produced the folder. Check the
    version with the person who exported it.

HOW TO USE IT
  1. Export: npm run content:bundle
  2. Copy dist/openmind-content to the school laptop or a USB stick.
  3. On the laptop: node scripts/serve-local-content.mjs
  4. Devices on the same network open the printed URL. Nothing leaves the LAN.
  5. Learner answers still synchronise to the main OpenMind instance when that
     device has a connection; the local mirror never receives them.

UPDATE
  Replace the whole folder with a newly exported version. Clients compare
  manifest.version and the per-file SHA-256; a partial copy is detectable.
`;
writeFileSync(path.join(OUT, "README.txt"), readme);

const manifest = {
  contract: "openmind.local-content/1.0",
  version: VERSION,
  generatedAt: new Date().toISOString(),
  lessons: index.length,
  subjects: index.reduce((acc, r) => ({ ...acc, [r.subject]: (acc[r.subject] ?? 0) + 1 }), {}),
  files: files.concat([
    { path: "index.html", bytes: Buffer.byteLength(html), sha256: createHash("sha256").update(html).digest("hex") },
    { path: "README.txt", bytes: Buffer.byteLength(readme), sha256: createHash("sha256").update(readme).digest("hex") },
  ]),
  note: "Read-only content mirror. No learner records, accounts or teacher keys. Integrity is a checksum, not an authentication guarantee.",
};
writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

// Verify what was just written, from disk, before claiming the bundle is good.
let bad = 0;
for (const f of manifest.files) {
  const body = readFileSync(path.join(OUT, f.path));
  const sha = createHash("sha256").update(body).digest("hex");
  if (body.length !== f.bytes || sha !== f.sha256) {
    bad++;
    console.error(`  ✗ ${f.path}: bytes or checksum differ`);
  }
}
const packFiles = readdirSync(path.join(OUT, "lessons")).filter((f) => f.endsWith(".json"));
if (packFiles.length !== index.length) {
  bad++;
  console.error(`  ✗ lesson file count ${packFiles.length} != ${index.length}`);
}
if (bad) process.exit(1);
console.log(`▸ Local content bundle: ${index.length} lessons, ${manifest.files.length} files, ${manifest.files.reduce((n, f) => n + f.bytes, 0)} bytes`);
console.log(`  ${OUT}`);
console.log("  checksums verified from disk; no learner records or teacher keys included");
