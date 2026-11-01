// Generate the teacher-facing review packet and inventory FROM the product's own
// modules. This is deliberately not a hand-written document: if a plan changes,
// the packet changes with it, and the version in the packet is the version the
// approval rule checks.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const OUT = "reports/.pilot-verify";
const DIR = "pilot-readiness";
// Compile the final tree every time. A cached mirror once let this packet
// describe a plan the product no longer had.
fs.rmSync(OUT, { recursive: true, force: true });
execSync(
  `npx tsc lib/pilot.ts lib/pilot-mappings.ts lib/pilot-rights.ts lib/source-registry.ts lib/questions.ts --outDir ${OUT} --rootDir . ` +
  "--module commonjs --target es2020 --skipLibCheck --esModuleInterop --strict",
  { stdio: "inherit" },
);
const require = createRequire(import.meta.url);
const P = require(`../${OUT}/lib/pilot.js`);
const M = require(`../${OUT}/lib/pilot-mappings.js`);
const PR = require(`../${OUT}/lib/pilot-rights.js`);
const S = require(`../${OUT}/lib/source-registry.js`);
const Q = require(`../${OUT}/lib/questions.js`);
fs.mkdirSync(DIR, { recursive: true });

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const rows = [["concept_id", "title", "subject", "complete_lesson", "readiness", "version", "curriculum_ref", "curriculum_source_id", "mapping_status", "reviewer", "rights_status", "external_assets", "fallback_visible_as_lesson"]];
for (const id of P.PILOT_SEQUENCE) {
  const c = P.pilotConcept(id);
  const s = P.lessonStatus(id);
  const m = M.pilotMappingFor(id);
  const r = PR.pilotRightsFor(id);
  rows.push([
    id, c.title, c.subject, s.plan ? "yes" : "no", s.state, s.version,
    m?.ref ?? "MISSING", m?.sourceId ?? "MISSING", m?.status ?? "missing", m?.reviewer ?? "none",
    r?.status ?? "missing", r?.externalAssets.length ?? "missing",
    s.state === "unavailable-for-pilot" ? "no — gated" : "no — a plan exists",
  ]);
}
fs.writeFileSync(path.join(DIR, "PILOT_CONTENT_INVENTORY.csv"), rows.map((r) => r.map(esc).join(",")).join("\n") + "\n");

const out = [];
out.push("# Pilot lessons — educator review packet");
out.push("");
out.push("**This is a review packet, not an approved course.** No lesson in it has been reviewed by a subject teacher. The reviewer should write their own name, role and date; the product will not generate them.");
out.push("");
out.push(`Scope: **${P.CBSE_X_PILOT.title}** · ${P.CBSE_X_PILOT.curriculumEdition} · lesson version **${P.PILOT_LESSON_VERSION}**.`);
out.push("");
out.push("## What approval means");
out.push("");
out.push("A lesson may be used in the learner path only for the curriculum, level and language recorded here. Approval requires every checklist item to be true and the reviewer to sign the exact lesson version. Any content edit changes the version and voids the approval.");
out.push("");
out.push("## How to return a review");
out.push("");
out.push("Copy `pilot-readiness/REVIEW_RECORD_TEMPLATE.json`, fill it in as the reviewer, and validate it with `npm run pilot:review -- --file <record>.json`. The command refuses a missing name, role or date, a future date, an unticked checklist, a tool signing as the reviewer, or a review of an older lesson version. It never writes an approval: a valid record is filed with the project owner, and a deliberate code change to `PILOT_APPROVALS` is what would open the learner path. Until that happens every lesson below remains `needs-educator-review`.");
out.push("");
out.push("## Rights and provenance");
out.push("");
out.push("Every lesson is OpenMind-authored; its figures are generated from OpenMind FigureSpecs. The CBSE syllabus entries are curriculum references, not copied teaching text. The source registry is in `lib/source-registry.ts`; `npm run pilot:pack` also writes `SOURCE_AND_RIGHTS_REGISTRY.md`. Unknown or unproven external rights block ingestion.");
out.push("");
out.push("## Review checklist (per lesson)");
out.push("");
out.push("- [ ] Subject accuracy: every factual and mathematical statement is correct.");
out.push("- [ ] Explanation quality: the idea is taught, not merely described.");
out.push("- [ ] Worked examples: each step is valid and the answer is correct.");
out.push("- [ ] Questions and marking: the key is correct; distractors are plausible; explanations teach.");
out.push("- [ ] Diagram quality: labels, units, scale and caption agree with the text.");
out.push("- [ ] Language and terminology: suitable for the declared English medium.");
out.push("- [ ] Age appropriateness: examples and wording suit the declared level.");
out.push("- [ ] Accessibility: readable at 320 px; figure has a spoken caption.");
out.push("");

for (const id of P.PILOT_SEQUENCE) {
  const c = P.pilotConcept(id);
  const s = P.lessonStatus(id);
  const p = s.plan;
  const m = M.pilotMappingFor(id);
  out.push(`---`);
  out.push("");
  out.push(`## ${c.title} (\`${id}\`)`);
  out.push("");
  out.push(`- **Subject / level:** ${c.subject} · ${P.CBSE_X_PILOT.levelId}`);
  out.push(`- **State:** ${s.state}${s.gaps.length ? ` — ${s.gaps.map((g) => `${g.field} ${g.problem}`).join("; ")}` : " — no structural gaps"}`);
  out.push(`- **Curriculum:** ${m ? `${m.ref} — ${m.statement}` : "MISSING"}`);
  out.push(`- **Source:** ${m ? `${m.source.title}, ${m.source.publisher}, ${m.source.published} — ${m.source.url}` : "—"}`);
  out.push(`- **Mapping status:** ${m?.status ?? "missing"}; reviewer: ${m?.reviewer ?? "none"}`);
  const rights = PR.pilotRightsFor(id);
  out.push(`- **Rights:** ${rights?.status ?? "MISSING"} — teaching ${rights?.teaching?.id ?? "missing"}, figures ${rights?.figures?.id ?? "missing"}, curriculum ${rights?.curriculum?.id ?? "missing"} (${rights?.curriculumLink.status ?? "blocked"}); external assets: ${rights?.externalAssets.length ?? "missing"}.`);
  if (rights?.problems.length) out.push(`- **Rights problems:** ${rights.problems.join("; ")}`);
  out.push("");
  out.push(`### Objective`);
  out.push("");
  out.push(p.objective);
  out.push("");
  out.push(`### Intuition`);
  out.push("");
  out.push(p.intuition);
  out.push("");
  if (p.figure) {
    out.push(`### Figure`);
    out.push("");
    out.push(`Kind: \`${p.figure.spec.kind}\`. ${p.figure.caption}`);
    out.push("");
  }
  out.push(`### The idea`);
  out.push("");
  for (const para of p.idea) out.push(para, "");
  if (p.terms?.length) {
    out.push(`### Terms`);
    out.push("");
    for (const t of p.terms) out.push(`- **${t.term}:** ${t.meaning}`);
    out.push("");
  }
  if (p.workedExamples?.length) {
    out.push(`### Authored worked examples`);
    out.push("");
    for (const [i, ex] of p.workedExamples.entries()) {
      out.push(`**${i + 1}. ${ex.prompt}**`, "");
      for (const step of ex.steps) out.push(`- ${step}`);
      out.push("", `Answer: **${ex.answer}**`, "");
    }
  }
  out.push(`### Traps`);
  out.push("");
  for (const trap of p.traps) out.push(`- **${trap.move}** ${trap.why}`);
  out.push("");
  out.push(`### Where it is used next`);
  out.push("");
  out.push(p.usedFor);
  out.push("");
  if (p.recap?.length) {
    out.push(`### Recap`);
    out.push("");
    for (const line of p.recap) out.push(`- ${line}`);
    out.push("");
  }
  out.push(`### Questions for the reviewer to check`);
  out.push("");
  for (let i = 0; i < 2; i++) {
    const q = Q.generateQuestion(id, `review-pack:${i}`);
    if (!q) { out.push(`- No generator produced a question. **This is a blocker.**`, ""); continue; }
    out.push(`**Q${i + 1}.** ${q.prompt}`);
    if (Array.isArray(q.choices)) {
      for (const [j, choice] of q.choices.entries()) out.push(`  - ${String.fromCharCode(65 + j)}. ${choice}`);
      out.push(`  - **Key:** ${String.fromCharCode(65 + q.answer)}`);
    } else {
      out.push(`  - **Key:** ${q.answerValue ?? q.answer}`);
    }
    out.push(`  - **Explanation:** ${q.explanation}`);
    out.push(`  - **Misconception tags:** ${(q.misconceptionTags ?? []).join(", ") || "none"}`);
    out.push("");
  }
  out.push(`**Reviewer decision:** approve for this scope / request revisions / reject.`);
  out.push("");
}

fs.writeFileSync(path.join(DIR, "PILOT_LESSONS_REVIEW_PACK.md"), out.join("\n") + "\n");

const rightsRows = ["# Source and rights registry", "", "**Generated from `lib/source-registry.ts`. This is not legal advice.** A source is ingestible only when its basis is known and primary rights proof is recorded. An unknown licence blocks ingestion; a free download or ministry logo is not a licence.", "", `Coverage: ${S.sourceCoverage().total} records, ${S.sourceCoverage().authored} authored, ${S.sourceCoverage().ingestible} ingestible, ${S.sourceCoverage().linkOnly} link-only.`, "", "| id | kind | jurisdiction | rights basis | proof | ingestible | verification |", "|---|---|---|---|---|---|---|"];
for (const s of S.SOURCE_RECORDS) {
  rightsRows.push(`| \`${s.id}\` | ${s.kind} | ${s.jurisdiction} | ${s.rights.basis} | ${s.rights.proof} | ${S.ingestible(s) ? "yes" : "no"} | ${s.verification} |`);
}
rightsRows.push("", "## Not used in this pilot", "", "No external OER, textbook, simulation or platform asset is embedded in the 12 lessons. The registry is the allowlist the next ingestion must pass, not an inventory of materials already copied.", "");
fs.writeFileSync(path.join(DIR, "SOURCE_AND_RIGHTS_REGISTRY.md"), rightsRows.join("\n") + "\n");
console.log(`Wrote ${DIR}/PILOT_CONTENT_INVENTORY.csv (${P.PILOT_SEQUENCE.length} rows) and PILOT_LESSONS_REVIEW_PACK.md (${out.length} lines), plus SOURCE_AND_RIGHTS_REGISTRY.md (${S.SOURCE_RECORDS.length} records).`);
