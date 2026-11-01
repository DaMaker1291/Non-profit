// Dump the ACTUAL learner-visible lesson material for the 12 pilot concepts:
// plan fields, worked examples, traps, figure specs, generated questions and
// keys. The markdown is an audit tool, not a teacher approval.
import fs from "node:fs";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const OUT = "reports/.lesson-audit";
fs.rmSync(OUT, { recursive: true, force: true });
execSync(
  `npx tsc lib/pilot.ts lib/pilot-mappings.ts lib/pilot-rights.ts lib/source-registry.ts lib/lesson-plans.ts lib/questions.ts --outDir ${OUT} --rootDir . ` +
  "--module commonjs --target es2020 --skipLibCheck --esModuleInterop --strict",
  { stdio: "inherit" },
);
const require = createRequire(import.meta.url);
const P = require(`../${OUT}/lib/pilot.js`);
const M = require(`../${OUT}/lib/pilot-mappings.js`);
const PR = require(`../${OUT}/lib/pilot-rights.js`);
const Q = require(`../${OUT}/lib/questions.js`);

const lines = [];
const put = (s = "") => lines.push(s);
const IDs = [...P.PILOT_SEQUENCE];
put("# Pilot lesson content dump");
put("");
put("Generated from the real modules. This is an inspection aid; it is not an educator review and not an approval.");
put("");
for (const id of IDs) {
  const c = P.pilotConcept(id);
  const s = P.lessonStatus(id);
  const p = s.plan;
  const m = M.pilotMappingFor(id);
  const r = PR.pilotRightsFor(id);
  put(`## ${c.title} (\`${id}\`)`);
  put("");
  put(`- Subject: ${c.subject}`);
  put(`- State: ${s.state}`);
  put(`- Version: ${s.version}`);
  put(`- Mapping: ${m?.sourceId ?? "missing"} · ${m?.ref ?? "missing"} · ${m?.status ?? "missing"} · reviewer ${m?.reviewer ?? "none"}`);
  put(`- Rights: ${r?.status ?? "missing"} · external assets ${r?.externalAssets.length ?? "missing"}`);
  put("");
  put(`### Objective`);
  put("");
  put(p.objective);
  put("");
  put(`### Intuition`);
  put("");
  put(p.intuition);
  put("");
  if (p.figure) {
    put(`### Figure`);
    put("");
    put("```json");
    put(JSON.stringify(p.figure, null, 2));
    put("```");
    put("");
  }
  put(`### Idea`);
  put("");
  for (const para of p.idea) put(para, "");
  if (p.terms?.length) {
    put(`### Terms`);
    put("");
    for (const t of p.terms) put(`- **${t.term}:** ${t.meaning}`);
    put("");
  }
  if (p.workedExamples?.length) {
    put(`### Worked examples`);
    put("");
    for (const [i, ex] of p.workedExamples.entries()) {
      put(`**Example ${i + 1}: ${ex.prompt}**`);
      put("");
      for (const step of ex.steps) put(`- ${step}`);
      put("", `**Answer:** ${ex.answer}`, "");
    }
  }
  put(`### Traps`);
  put("");
  for (const t of p.traps) put(`- **${t.move}** ${t.why}`);
  put("");
  if (p.recap?.length) {
    put(`### Recap`);
    put("");
    for (const x of p.recap) put(`- ${x}`);
    put("");
  }
  put(`### Generated questions`);
  put("");
  for (let i = 0; i < 8; i++) {
    const q = Q.generateQuestion(id, `lesson-audit:${i}`);
    if (!q) { put(`- No question at draw ${i}.`); continue; }
    put(`**Q${i + 1}.**`);
    put("");
    put("```text");
    put(q.prompt);
    put("```");
    if (Array.isArray(q.choices)) {
      for (const [j, choice] of q.choices.entries()) put(`${String.fromCharCode(65 + j)}. ${choice}`);
      put(`Key: ${String.fromCharCode(65 + q.answer)}`);
    } else {
      put(`Key: ${q.answerValue ?? q.answer}`);
    }
    put("", `Explanation: ${q.explanation}`, "");
  }
  put("---", "");
}
fs.mkdirSync("pilot-readiness/evidence", { recursive: true });
fs.writeFileSync("pilot-readiness/evidence/lesson-content-dump.md", lines.join("\n") + "\n");
console.log(`Wrote pilot-readiness/evidence/lesson-content-dump.md (${lines.length} lines) from ${IDs.length} lessons.`);
