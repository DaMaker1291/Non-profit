#!/usr/bin/env node
// ▸ What the five-pilot standard covers, concept by concept.
//
// The pilot proved a shape: research → authored lesson → interactive model → browser
// walk. Repeating it needs the queue visible, so this prints NINE SEPARATE MEASURES
// rather than one number that flatters the project, and refuses to imply more:
// educator review and learner testing are 0 until real people do them.
//
// Exit code is 0 even when coverage is incomplete — this is a dashboard, not a gate.
// The gate is in `npm run verify`, which asserts the numbers agree with the modules.

import { pathToFileURL } from "node:url";
import { join } from "node:path";

const mirror = join(process.cwd(), ".verify", "model-coverage.js");
const researchMirror = join(process.cwd(), ".verify", "learning-research.js");

async function main() {
  let mod;
  let research;
  try {
    mod = await import(pathToFileURL(mirror).href);
    research = await import(pathToFileURL(researchMirror).href);
  } catch {
    console.error("no .verify/ mirror: run `npm run verify` once (it compiles lib/ into .verify/)");
    process.exit(1);
  }
  const summary = mod.coverageSummary();
  const rows = mod.coverageRows();
  const reconciliation = research.researchReconciliation();
  const researchSummary = research.researchSummary();

  console.log("▸ concept coverage — nine separate measures, per concept");
  console.log(`  1 concept in genome      ${summary.concepts}`);
  console.log(`  2 lesson file            ${summary.lessonFiles}`);
  console.log(`  3 teaching sequence      ${summary.teachingSequences}`);
  console.log(`  4 research dossier       ${summary.researched} researched · ${summary.identified} identified · ${summary.concepts - summary.researched - summary.identified} none`);
  console.log(`  5 modality delivered     ${summary.interactiveModels} interactive · ${summary.planText} prose plan · ${summary.noContent} none`);
  console.log(`  6 interaction built      ${summary.modelled}`);
  console.log(`  7 browser verified       ${summary.browserVerified}`);
  console.log(`  8 educator reviewed      ${summary.educatorReviewed}`);
  console.log(`  9 learner tested         ${summary.learnerTested}`);
  console.log(`    (review-pack plans: ${summary.pilotPlans}; never counted as lesson files)`);
  console.log("");
  for (const [subject, s] of Object.entries(summary.bySubject)) {
    console.log(`  ${String(subject).padEnd(10)} ${String(s.concepts).padStart(3)} concepts · ${String(s.lessonFiles).padStart(3)} lesson files · ${String(s.sequences).padStart(2)} sequences · ${String(s.modelled).padStart(2)} models · ${String(s.browserVerified).padStart(2)} browser-verified`);
  }
  console.log("");
  const modelled = rows.filter((r) => r.interaction);
  console.log(`  interactions (${modelled.length}):`);
  for (const row of modelled) {
    console.log(`    ${row.conceptId.padEnd(22)} ${String(row.interaction).padEnd(20)} research: ${row.researchDossier.padEnd(10)} browser: ${row.browserVerified ? "yes" : "NO"}`);
  }
  if (summary.modelsWithoutBrowserEvidence.length) {
    console.log(`\n  ⚠ modelled but NOT browser verified: ${summary.modelsWithoutBrowserEvidence.join(", ")}`);
  }
  if (summary.modelledWithoutDossier.length) {
    console.log(`\n  ⚠ modelled with NO research dossier: ${summary.modelledWithoutDossier.join(", ")}`);
  }
  console.log("");
  console.log(`  queue (${summary.queue.length} concepts without a model):`);
  const line = summary.queue.join(", ");
  console.log(`    ${line.slice(0, 700)}${line.length > 700 ? " …" : ""}`);
  console.log("");
  console.log(`  research register: ${researchSummary.sources} sources · reconciled: ${reconciliation.reconciled ? "yes" : "NO"}`);
  for (const [depth, count] of Object.entries(reconciliation.byDepth)) {
    if (count) console.log(`    ${depth.padEnd(20)} ${count}`);
  }
  console.log("");
  console.log(`  educator review: ${summary.educatorReviewed} of ${summary.researched} researched dossiers signed off`);
  if (summary.educatorReviewed === 0) {
    console.log("  ⚠ no subject teacher has signed off any concept; nothing here is an approved course");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
