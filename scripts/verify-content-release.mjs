// ─────────────────────────────────────────────────────────────────────────────
// THE CONTENT RELEASE PIPELINE (§17, §18 of the deployment brief).
//
// "You cannot have a question bank changing underneath active learners." The
// curriculum, the question generators and the evidence schema are CODE in this
// repository, which means editing one and deploying it silently rewrites what a
// learner is taught and what their recorded history means.
//
// So the content a deployment serves has a VERSION, and that version is a
// fingerprint of the actual engines — concept ids, the concepts that can serve a
// question, the qualification catalogue, the reasoner's structural constants,
// and the evidence schema/projection versions. This script is the release gate:
//
//   DRAFT        the fingerprint does not match the published record
//                  ↓
//   REVIEW       a human reads what changed (this script names the section)
//                  ↓
//   PUBLISH      `--write` records the new content version as reviewed
//
// It refuses to guess. A mismatch FAILS and names the section that moved, so
// "the content changed" is never discovered by a learner seeing a new question
// appear mid-course.
//
// An evidence-schema change is called out separately and more loudly: that is
// not a content edit, it is a change to what every stored event MEANS, and it
// needs a migration rather than a republish (lib/evidence.ts#EVIDENCE_SCHEMA_VERSION).
//
// Usage:
//   npm run verify:content-release            # the gate (fails on an unpublished change)
//   node scripts/verify-content-release.mjs --write   # publish the current content as reviewed
//
// Prerequisite: a compiled `.verify` mirror — `npm run verify` builds it.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const RECORD_PATH = path.join(process.cwd(), "audit", "content-release.json");
const WRITE = process.argv.includes("--write");

let pass = 0, fail = 0;
const ok = (c, msg, detail = "") => {
  if (c) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}${detail ? ` — ${detail}` : ""}`); }
};

console.log(`\nContent release gate — record: ${path.relative(process.cwd(), RECORD_PATH)}\n`);

let genome, questions, specs, evidence, questionBank;
try {
  genome = require("../.verify/genome.js");
  questions = require("../.verify/questions.js");
  specs = require("../.verify/specifications.js");
  evidence = require("../.verify/evidence.js");
  questionBank = require("../.verify/question-bank.js");
} catch (e) {
  console.error(`  ✗ the compiled engines are missing — run \`npm run verify\` first.`);
  console.error(`    (${e.message})\n`);
  process.exit(2);
}

/** Deterministic JSON: keys sorted, so a fingerprint depends on content and
 *  never on property order. */
function stableStringify(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(",")}}`;
}
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);

// ── 1. The live content fingerprint ──────────────────────────────────────────
const conceptIds = genome.CONCEPTS.map((c) => c.id).sort();
const specIds = specs.SPECIFICATIONS.map((s) => s.id).sort();
const generated = [...(questions.GENERATED_CONCEPT_IDS ?? [])].sort();

// A deterministic sample of the ACTUAL served questions, so a change to a
// question's body is caught and not only a change to its concept. Computed twice
// and required to be identical: a generator that is not deterministic could not
// be fingerprinted at all, and that itself is a release-blocking fact.
function questionSample() {
  let s = "";
  for (const cid of generated) {
    const q = questions.generateQuestion(cid, "release-fingerprint");
    s += `${cid}:${q ? stableStringify(q) : "-"}|`;
  }
  return s;
}
const sampleA = sha(questionSample());
const sampleB = sha(questionSample());
ok(sampleA === sampleB, "the question generators are deterministic (fingerprintable)",
  sampleA === sampleB ? "" : "two runs of the same seed disagreed");

const curriculum = {
  concepts: conceptIds.length,
  specifications: specIds.length,
  hash: sha(conceptIds.join(",") + "|" + specIds.join(",")),
};
const questionBankRecord = {
  generatedConcepts: generated.length,
  numeric: (questions.NUMERIC_CONCEPTS ?? []).length,
  senior: (questions.SENIOR_CONCEPT_IDS ?? []).length,
  depth: (questions.DEPTH_CONCEPT_IDS ?? []).length,
  drawsPerConcept: questionBank.DRAWS_PER_CONCEPT,
  officialItems: questionBank.OFFICIAL_ITEMS,
  sample: sampleA,
};
const evidenceRecord = {
  schemaVersion: evidence.EVIDENCE_SCHEMA_VERSION,
  projectionVersion: evidence.PROJECTION_VERSION,
};
const fingerprint = sha(stableStringify({ curriculum, questionBank: questionBankRecord, evidence: evidenceRecord }));

const live = { fingerprint, curriculum, questionBank: questionBankRecord, evidence: evidenceRecord };

console.log("live content:");
console.log(`  curriculum   ${curriculum.concepts} concepts, ${curriculum.specifications} specifications (${curriculum.hash})`);
console.log(`  question bank ${questionBankRecord.generatedConcepts} servable concepts; draws/concept ${questionBankRecord.drawsPerConcept}; sample ${questionBankRecord.sample}`);
console.log(`  evidence     schema v${evidenceRecord.schemaVersion}, projection v${evidenceRecord.projectionVersion}`);
console.log(`  fingerprint  ${fingerprint}\n`);

// ── 2. The published record ──────────────────────────────────────────────────
let published = null;
try {
  published = JSON.parse(fs.readFileSync(RECORD_PATH, "utf8"));
} catch {
  published = null;
}

if (WRITE) {
  const record = {
    note: "Published content version. Regenerate with `node scripts/verify-content-release.mjs --write` AFTER reviewing what changed — never merely to make the gate pass.",
    ...live,
    reviewedAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(RECORD_PATH), { recursive: true });
  fs.writeFileSync(RECORD_PATH, JSON.stringify(record, null, 2) + "\n", "utf8");
  console.log(`PUBLISHED content version ${fingerprint} → ${path.relative(process.cwd(), RECORD_PATH)}`);
  console.log(`CONTENT RELEASE: PUBLISHED`);
  process.exit(0);
}

if (!published) {
  console.error("  ✗ no published content record exists.");
  console.error("    Review the live content above, then publish it: node scripts/verify-content-release.mjs --write\n");
  console.error("CONTENT RELEASE: DRAFT — no published version.");
  process.exit(1);
}

// ── 3. Compare, section by section, so a mismatch names what moved ───────────
console.log("3 · the published version vs the live content");
ok(published.fingerprint === fingerprint,
  "the served content matches the published content version",
  published.fingerprint === fingerprint ? "" : `published ${published.fingerprint}, live ${fingerprint}`);

// Named sections: which part moved is what a reviewer needs. A changed
// curriculum or question bank is a CONTENT release; a changed evidence schema is
// a DATA MIGRATION and is treated as such.
for (const [name, liveSection, pubSection] of [
  ["curriculum", curriculum, published.curriculum],
  ["question bank", questionBankRecord, published.questionBank],
  ["evidence schema", evidenceRecord, published.evidence],
]) {
  const same = stableStringify(liveSection) === stableStringify(pubSection);
  if (!same) {
    const changed = Object.keys(liveSection).filter(
      (k) => stableStringify(liveSection[k]) !== stableStringify((pubSection ?? {})[k]),
    );
    console.error(`  · ${name} changed: ${changed.join(", ")}`);
  }
}

ok(published.evidence?.schemaVersion === evidence.EVIDENCE_SCHEMA_VERSION,
  "planned evidence schema version matches the released one (old events stay interpretable)",
  `published v${published.evidence?.schemaVersion} vs live v${evidence.EVIDENCE_SCHEMA_VERSION}`);
ok(published.evidence?.projectionVersion === evidence.PROJECTION_VERSION,
  "and the projection version is the one the release was reviewed against",
  `published v${published.evidence?.projectionVersion} vs live v${evidence.PROJECTION_VERSION}`);

// ── 4. Explaining the outcome ────────────────────────────────────────────────
if (fail) {
  const schemaMoved = published.evidence?.schemaVersion !== evidence.EVIDENCE_SCHEMA_VERSION;
  console.log("");
  if (schemaMoved) {
    console.log("  The evidence SCHEMA changed. This is not a republish: every stored event's");
    console.log("  meaning moved. Write a migration that keeps existing events interpretable,");
    console.log("  then bump EVIDENCE_SCHEMA_VERSION and republish the content version.");
  } else {
    console.log("  The served content has changed since it was published.");
    console.log("  Review the named sections above (curriculum, question bank), then publish:");
    console.log("    node scripts/verify-content-release.mjs --write");
  }
}

console.log(`\n${"─".repeat(58)}`);
console.log(`CONTENT RELEASE: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
