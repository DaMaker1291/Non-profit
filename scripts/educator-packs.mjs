#!/usr/bin/env node
// ▸ EDUCATOR REVIEW PACKS — one per researched, modelled concept.
//
// Generated FROM the modules, not written by hand: the pack prints the dossier's
// sources, the model's stated assumptions and limits, and the authored lesson, so a
// reviewer is looking at the version the product actually serves. It cannot mark
// anything reviewed: every pack says `pending` and carries a blank signature block.
//
// Run: npm run educator:packs

import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const R = require("../.verify/learning-research.js");
const C = require("../.verify/model-coverage.js");
const A = require("../.verify/model-assumptions.js");
const E = require("../.verify/model-evidence.js");
const T = require("../.verify/model-teaching.js");
const P = require("../.verify/lesson-plans.js");

const OUT = join("pilot-readiness", "educator-packs");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const rows = C.coverageRows().filter((r) => r.interaction !== null);
const researchById = new Map(R.RESEARCH_SOURCES.map((s) => [s.id, s]));

function sourcesFor(conceptId, dossier) {
  const cited = new Set(dossier ? dossier.misconceptions.map((m) => m.sourceId) : []);
  const tagged = R.RESEARCH_SOURCES.filter((s) => s.concepts.includes(conceptId));
  const byId = new Map();
  for (const s of tagged) byId.set(s.id, s);
  for (const id of cited) if (researchById.has(id)) byId.set(id, researchById.get(id));
  return [...byId.values()];
}

const index = [];
for (const row of rows) {
  const conceptId = row.conceptId;
  const dossier = R.CONCEPT_DOSSIERS.find((d) => d.conceptId === conceptId);
  const assumptions = A.assumptionsFor(row.interaction);
  const evidence = E.evidenceFor(row.interaction);
  const plan = P.planFor(conceptId);
  const teaching = T.teachingForConcept(conceptId);
  const sources = sourcesFor(conceptId, dossier);
  const lines = [];

  lines.push(`# Educator review pack — ${conceptId}`, "");
  lines.push(`> **STATUS: NOT REVIEWED.** No subject teacher has read this concept. Nothing in this pack is an approval, and the lesson is not an approved course. Reviewer: ____________________  Role: ____________________  Date: ____________`, "");
  lines.push(`**Subject:** ${row.subject} · **Interaction:** \`${row.interaction}\` · **Browser evidence:** ${evidence?.verifiedOn ? `recorded ${evidence.verifiedOn}` : "NONE"} · **Learner testing:** none`, "");
  lines.push("## The question this review answers", "");
  lines.push("Not \"is the interface pleasant\". **Would you use this to teach the concept, and what would you change before using it with your pupils?** Correct the subject accuracy first; then the level, the wording, and the model's simplifications.", "");

  lines.push("## 1. What the learner is meant to be able to do", "");
  lines.push(teaching?.objective ?? plan?.objective ?? "_No authored objective: the plan is missing._", "");
  if (plan && plan.provenance === "supplemental") {
    lines.push("> **The lesson plan behind this concept is the generated supplemental fallback, not an authored sequence.** The objective and the prediction above come from the model's own teaching frame; the sequence in section 6 is composed from the concept note, so treat its order and wording as unreviewed structure rather than as an authored lesson.", "");
  }
  if (teaching) lines.push("**The prediction the learner must commit to before touching the model:** " + teaching.predict.question, "");
  if (teaching?.predict.kind === "choice") {
    for (const o of teaching.predict.options) lines.push(`- ${o.id === teaching.predict.answerId ? "**" + o.label + "** *(the answer the model shows)*" : o.label}`);
    lines.push("", "**What the reveal says once a choice is made:** " + teaching.predict.reveal, "");
  } else if (teaching) {
    // A describe prediction is not marked, and the pack must not present it as if
    // it were: the prompt and the ideas to check against are what a teacher needs.
    lines.push("**Describe prediction — nothing is marked.** Prompt: " + teaching.predict.prompt, "");
    lines.push("**Ideas the learner can check their own sentence against:**", "");
    for (const l of teaching.predict.lookFor) lines.push(`- ${l}`);
    lines.push("", "**What the reveal says once the description is committed:** " + teaching.predict.reveal, "");
  }
  if (teaching) lines.push("**What the learner does with it afterwards:** " + teaching.apply, "");
  lines.push("**Starting point the lesson assumes:** " + (plan?.intuition ?? "_not stated_"), "");

  lines.push("## 2. Research basis", "");
  if (!sources.length) {
    lines.push("_No source is attached to this concept. That is a defect: the interaction should not be taught._", "");
  } else {
    lines.push("| Source | Depth | Licence / reuse | What was inspected |", "|---|---|---|---|");
    for (const s of sources) {
      const inspected = (s.whatWasInspected ?? s.findings).replace(/\|/g, "\\|").replace(/\n/g, " ");
      lines.push(`| ${s.creator} — ${s.title} (${s.url}) | \`${s.depth}\` | ${s.licence.name}; ${s.licence.reuse} | ${inspected} |`);
    }
    lines.push("");
    const shallow = sources.filter((s) => ["metadata", "discovered", "abstract"].includes(s.depth));
    if (shallow.length) lines.push(`**Depths below a full read:** ${shallow.map((s) => `\`${s.id}\` (${s.depth})`).join(", ")}. Their claims are limited to what that depth supports.`, "");
  }

  lines.push("## 3. Design decision", "");
  lines.push(dossier?.designDecision ?? "_No design decision recorded._", "");
  lines.push("", "### Misconceptions the lesson is built to refute", "");
  if (dossier?.misconceptions.length) {
    for (const m of dossier.misconceptions) lines.push(`- **${m.id}** — ${m.statement} _(${m.sourceId})_`);
  } else {
    lines.push("- _None recorded. This is a defect for a modelled concept._");
  }
  lines.push("");

  if (dossier?.disagreements.length) {
    lines.push("### Where the sources disagree", "");
    for (const d of dossier.disagreements) lines.push(`- **${d.question}** ${d.note} _(${d.sourceIds.join(", ")})_`);
    lines.push("");
  }

  lines.push("## 4. The model: assumptions and limits", "");
  if (assumptions) {
    lines.push(`**Intended level:** ${assumptions.level}`, "");
    lines.push("**Assumptions (scientific/mathematical):**", "");
    for (const a of assumptions.assumptions) lines.push(`- ${a}`);
    lines.push("", "**What it cannot show:**", "");
    for (const l of assumptions.limitations) lines.push(`- ${l}`);
    lines.push("", "**Misconceptions it addresses:**", "");
    for (const a of assumptions.addresses) lines.push(`- ${a}`);
    lines.push("", "**Misconceptions it might accidentally introduce — please check these first:**", "");
    for (const c of assumptions.couldIntroduce) lines.push(`- ${c}`);
    lines.push("");
  } else {
    lines.push("_No assumptions record. That is a defect._", "");
  }

  if (evidence) {
    lines.push("## 5. What was checked in a browser", "");
    lines.push(`Viewport(s): ${evidence.viewport || "not recorded"}`, "");
    if (evidence.checks.length) {
      lines.push("| Check | What was done | What the page showed |", "|---|---|---|");
      for (const c of evidence.checks) lines.push(`| ${c.id} | ${c.what} | ${c.result} |`);
    } else {
      lines.push("_Never opened in a browser._");
    }
    lines.push("", "**Not checked:**", "");
    for (const n of evidence.notChecked) lines.push(`- ${n}`);
    lines.push("");
  }

  lines.push("## 6. The teaching sequence", "");
  if (plan?.sections?.length) {
    for (const s of plan.sections) {
      lines.push(`### ${s.heading}`, "");
      if (s.formula) lines.push(`Formula: \`${s.formula}\``, "");
      if (s.steps?.length) for (const step of s.steps) lines.push(`1. ${step}`);
      for (const body of s.body) lines.push(body, "");
      if (s.table) {
        lines.push(`| ${s.table.columns.join(" | ")} |`, `| ${s.table.columns.map(() => "---").join(" | ")} |`);
        for (const r of s.table.rows) lines.push(`| ${r.join(" | ")} |`);
        lines.push("");
      }
    }
  } else if (plan) {
    lines.push("_This plan has no authored sections; the page groups its idea paragraphs. Treat the sequence as unreviewed structure._", "");
    for (const para of plan.idea) lines.push(para, "");
  } else {
    lines.push("_No lesson plan exists._", "");
  }

  if (plan?.traps?.length) {
    lines.push("## 7. Questions to ask and traps to expect", "");
    for (const t of plan.traps) lines.push(`- **${t.move}** ${t.why}`);
    lines.push("");
  }
  if (plan?.recap?.length) {
    lines.push("**Recap the learner should be able to say:**", "");
    for (const r of plan.recap) lines.push(`- ${r}`);
    lines.push("");
  }

  lines.push("## 8. Teacher run-of-show", "");
  if (teaching) {
    lines.push("### Before anyone touches the model", "");
    for (const step of teaching.teacher.demonstrate) lines.push(`1. ${step}`);
    lines.push("", "### Questions to ask while it runs", "");
    for (const q of teaching.teacher.ask) lines.push(`- ${q}`);
    lines.push("", "### One guided activity", "", teaching.teacher.guided, "");
    lines.push("### With no device", "", teaching.teacher.printable, "");
    lines.push("### What to look for", "", teaching.teacher.assessment, "");
    lines.push("### Where to go next", "");
    for (const f of teaching.teacher.followUp) lines.push(`- ${f}`);
    lines.push("");
  } else {
    lines.push("_No teaching frame: the objective, prediction, demonstration and printable alternative for this model have not been written. That is a defect for a modelled concept._", "");
  }
  lines.push("## 9. Teacher notes and printable alternative", "");
  lines.push("- The same plan supplies the printed worksheet path (`lib/lesson-print.ts`), which carries no answers; the classroom run-of-show is derived from the same plan (`lib/classroom-session.ts`).", "- Guided practice, independent assessment and the transfer item are rendered on the learner page from `lib/lesson-assessment.ts`; they are not duplicated in this pack, so there is one version of each question.", "- The prose lesson and its practice do not depend on the interaction. If the model is unavailable, the lesson still teaches; the model is the refutation, not the content.", "- **Not claimed:** that the interactive model has an offline equivalent. There is no printable substitute for manipulating the model, and this pack does not pretend otherwise.", "");

  lines.push("## 10. Reviewer checklist", "");
  for (const item of [
    "Subject accuracy: every factual and mathematical statement is correct.",
    "Level: the wording and the arithmetic suit the stated age band.",
    "Assumptions: the simplifications are acceptable for this level, and stated plainly enough.",
    "Limitations: nothing the model cannot show is implied to be false.",
    "Misconceptions it might introduce: each one is either fixed or acceptable with a teacher's framing.",
    "Misconception coverage: the named beliefs are the ones you actually see in pupils.",
    "Questions: the traps are real wrong moves, not invented ones.",
    "Accessibility: the readout carries the meaning; keyboard and mobile use are adequate.",
  ]) lines.push(`- [ ] ${item}`);
  lines.push("", "**Decision:** approve for this scope / request revisions / reject.", "", "**Changes required before classroom use:**", "", "1. ", "2. ", "3. ", "");

  writeFileSync(join(OUT, `${conceptId}.md`), lines.join("\n") + "\n");
  index.push({ conceptId, interaction: row.interaction, sources: sources.length, reviewed: dossier?.educatorReview ?? "none" });
}

const idx = ["# Educator review packs — index", "", "Generated by `npm run educator:packs` from the research register, the model assumptions, the browser evidence and the lesson plans. **Every pack is unreviewed.**", "", "| Concept | Interaction | Sources cited | Educator review |", "|---|---|---|---|"];
for (const i of index) idx.push(`| [\`${i.conceptId}\`](${i.conceptId}.md) | \`${i.interaction}\` | ${i.sources} | ${i.reviewed} |`);
idx.push("", "A pack is a request for review, not a record of one. When a teacher returns corrections, edit the dossier or the model and regenerate — a pack describing an older version is worse than none.", "");
writeFileSync(join(OUT, "README.md"), idx.join("\n") + "\n");
console.log(`Wrote ${index.length} educator packs to ${OUT}/ (all unreviewed).`);
