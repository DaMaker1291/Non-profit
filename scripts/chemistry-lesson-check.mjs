#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE CHEMISTRY LESSONS, CHECKED AS LESSONS.
//
// The formatting defect was not "the text is bad"; it was that a lesson arrived
// as one undifferentiated block. These assertions are about the SHAPE a learner
// meets: sections, formulas, tables and worked examples, plus the reaction
// profile whose sign must agree with the arithmetic beside it. They do not claim
// the lessons are subject-reviewed — the plans say `unreviewed`, and so does the
// page.
//
// Run: node scripts/chemistry-lesson-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const P = require("../.verify/lesson-plans.js");
const A = require("../.verify/lessons/authored/index.js");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}

const CASES = {
  "moles-calcs": { tables: 2, formulas: 3, steps: 7, worked: 3, words: 450 },
  "energy-changes": { tables: 2, formulas: 4, steps: 4, worked: 2, words: 450 },
};

for (const [id, expected] of Object.entries(CASES)) {
  const plan = P.planFor(id);
  ok(Boolean(plan), `${id}: an authored plan exists`);
  if (!plan) continue;
  ok(plan.provenance === "authored", `${id}: provenance says authored`);
  ok(plan.review === "unreviewed", `${id}: review status is not overstated`);
  ok(Array.isArray(plan.sections) && plan.sections.length >= 5, `${id}: at least five teaching sections`);
  ok(plan.sections.every((s) => s.heading.trim().length > 0), `${id}: every section has a heading`);
  ok(plan.sections.every((s) => s.body.length > 0), `${id}: every section has prose`);
  ok(plan.sections.filter((s) => s.body.length >= 2).length >= 4, `${id}: sections develop more than one point where needed`);
  ok(plan.sections.filter((s) => s.formula).length >= expected.formulas, `${id}: formulas are given their own blocks`);
  ok(plan.sections.filter((s) => s.table).length >= expected.tables, `${id}: comparison tables are present`);
  ok(plan.sections.reduce((n, s) => n + (s.steps?.length ?? 0), 0) >= expected.steps, `${id}: methods are numbered steps`);
  ok(plan.workedExamples.length >= expected.worked, `${id}: worked examples are present`);
  ok(plan.traps.length >= 3, `${id}: wrong moves are named with reasons`);
  ok(plan.recap.length >= 3, `${id}: the retrieval recap has three points`);
  ok(plan.terms.length >= 5, `${id}: key terms are defined`);
  const words = plan.idea.join(" ").split(/\s+/).filter(Boolean).length;
  ok(words >= expected.words, `${id}: teaching prose is substantial (${words} words)`);
  const paragraphs = plan.sections.flatMap((s) => s.body);
  ok(paragraphs.every((p) => p.split(/\s+/).filter(Boolean).length >= 12), `${id}: no one-line orphan paragraphs`);
  const longest = Math.max(...paragraphs.map((p) => p.length));
  ok(longest <= 700, `${id}: no paragraph is a wall (longest ${longest} chars)`);
  ok(plan.sections.some((s) => s.formula?.includes("=")), `${id}: at least one formula is an equation, not a label`);
}

// THE CHEMISTRY VERTICAL IS COMPLETE ON THE THING WE CAN HONESTLY CLAIM: every
// one of the sixteen concepts has a subject-specific diagram. It has NO video
// card: the old BBC/Khan cards were longer than the lesson and opened behind a
// consent screen. A future card must clear both bars; this gate fails if an old
// source or a six-minute video returns.
const G = require("../.verify/genome.js");
const chemistry = G.CONCEPTS.filter((c) => c.subject === "chemistry");
const missingFigures = chemistry.filter((c) => !P.planFor(c.id)?.figure);
ok(chemistry.length === 16, `chemistry has its full sixteen concepts (${chemistry.length})`);
ok(missingFigures.length === 0, `every chemistry concept has a diagram (missing: ${missingFigures.map((c) => c.id).join(", ") || "none"})`);
const badVideoHost = /(?:bbc\.co\.uk|khanacademy\.org)/i;
const badSource = chemistry.filter((c) => badVideoHost.test(P.planFor(c.id)?.video?.url ?? ""));
ok(badSource.length === 0, `no chemistry video sends a learner to an unverified consent-walled host (${badSource.map((c) => c.id).join(", ") || "none"})`);
const tooLong = chemistry.filter((c) => {
  const length = P.planFor(c.id)?.video?.length;
  if (!length) return false;
  const seconds = String(length).split(":").reduce((n, part) => n * 60 + Number(part), 0);
  return seconds > 180;
});
ok(tooLong.length === 0, `no chemistry video is longer than three minutes (${tooLong.map((c) => c.id).join(", ") || "none"})`);

const energy = P.planFor("energy-changes");
ok(energy.figure?.spec?.kind === "energy-profile", "energy-changes: the reaction profile is attached");
ok(energy.figure?.spec?.delta === -185, "energy-changes: the profile's ΔH is the calculated value");
ok(energy.figure?.spec?.activation === 150, "energy-changes: the profile declares its activation barrier");
ok(/not to scale/i.test(energy.figure?.caption ?? ""), "energy-changes: the schematic caption says it is not to scale");

// The second calculation-first repair. The defect was identical in shape to the
// moles one: the lesson opened with "Enthalpy is the energy ledger", so a learner
// met the definition of ΔH before meeting a single ΔH. The first section must
// now DO the bond-energy calculation — with the table's numbers and the sign —
// and the definition may only follow it.
const energyFirst = energy.sections[0];
const energyFirstBody = energyFirst?.body.join(" ") ?? "";
ok(/calculate/i.test(energyFirst?.heading ?? ""), "energy-changes: the lesson starts with a calculation, not a definition");
ok((energyFirst?.steps?.length ?? 0) >= 4, "energy-changes: the first section carries the four-move bond-energy method");
ok(/679/.test(energyFirstBody) && /864/.test(energyFirstBody) && /−185|-185/.test(energyFirstBody), "energy-changes: the first section substitutes real bond energies and gives ΔH");
ok(!/enthalpy is the energy ledger/i.test(energyFirst?.heading ?? ""), "energy-changes: the definition no longer precedes the method");
ok(energy.sections.findIndex((s) => /what the sign/i.test(s.heading)) > 0, "energy-changes: the definition follows the worked calculation");
ok(energy.sections.some((s) => /calorimetry/i.test(s.heading) && /q = m c/.test(s.body.join(" "))), "energy-changes: calorimetry is taught with its equation");

const moles = P.planFor("moles-calcs");
const molesFirst = moles.sections[0];
ok(/calculate/i.test(molesFirst?.heading ?? ""), "moles-calcs: the lesson starts with a calculation, not a definition");
ok((molesFirst?.steps?.length ?? 0) >= 4, "moles-calcs: the first section carries the four-move method");
ok(/8\.0 g/.test(molesFirst?.body.join(" ") ?? "") && /0\.20 mol/.test(molesFirst?.body.join(" ") ?? ""), "moles-calcs: the first section substitutes real numbers and gives the answer");
ok(!/count, not a mass/i.test(molesFirst?.heading ?? ""), "moles-calcs: the definition no longer precedes the method");
ok(moles.sections.some((s) => /limiting reagent|limiting reactant/i.test(s.body.join(" "))), "moles-calcs: limiting reagent is taught, not only named");
ok(moles.sections.some((s) => /0\.0250|cm³.*1000|1000.*cm³/i.test(s.body.join(" "))), "moles-calcs: the cm³-to-dm³ conversion is explicit");

// The renderers must consume the structured field; otherwise the data is present
// and the learner still sees the old wall.
const page = readFileSync(new URL("../app/learn/[subject]/[concept]/page.tsx", import.meta.url), "utf8");
const twin = readFileSync(new URL("../docs/app.js", import.meta.url), "utf8");
const appCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const twinCss = readFileSync(new URL("../docs/app.css", import.meta.url), "utf8");
ok(page.includes("plan.sections"), "the app renders the structured sections");
ok(twin.includes("plan.sections"), "the offline twin renders the structured sections");
ok(/\.lesson-sections\s*\{/.test(appCss) && /\.lesson-sections\s*\{/.test(twinCss), "both stylesheets give the sections a layout");
ok(/\.lesson-formula\s*\{/.test(appCss) && /\.lesson-formula\s*\{/.test(twinCss), "formulas are styled in both products");
ok(/\.lesson-table\s*\{/.test(appCss) && /\.lesson-table\s*\{/.test(twinCss), "tables are styled in both products");

// THE AUTHORED ANALYSIS LESSON. Its facts are the ones a learner acts on at the
// bench: a flame colour identifies the metal and not the compound, a white
// hydroxide is ambiguous until excess alkali is added, carbonate must be removed
// before a barium or silver precipitate, and Rf is a ratio under matched
// conditions. These are subject assertions, not just shape checks.
const analysis = A.AUTHORED_BY_CONCEPT["analysis-tests"];
ok(Boolean(analysis), "analysis-tests: the authored lesson is registered");
if (analysis) {
  const text = JSON.stringify(analysis);
  const a2 = analysis.assessment.find((item) => item.id === "a2");
  ok(analysis.explanation.length >= 5, "analysis-tests: five teaching sections, including instrumental methods");
  ok(analysis.objectives.length >= 4, "analysis-tests: sampling, sequencing and instrumental reasoning are objectives");
  ok(analysis.workedExamples.length >= 2, "analysis-tests: two worked examples with reasons");
  ok(analysis.misconceptions.length >= 4, "analysis-tests: four misconception repairs");
  ok(analysis.guidedPractice.length >= 3, "analysis-tests: three guided items");
  ok(analysis.assessment.length >= 4, "analysis-tests: four assessment items");
  ok(/lilac/.test(text) && /green-blue/.test(text), "analysis-tests: potassium and copper flame colours are named");
  ok(/barium carbonate/.test(text), "analysis-tests: the carbonate/barium false positive is taught");
  ok(/dilute nitric acid/.test(text) && /silver nitrate/.test(text), "analysis-tests: the halide acid choice is explicit");
  ok(/excess sodium hydroxide/.test(text), "analysis-tests: the excess-alkali discrimination is taught");
  ok(/4\.5 ÷ 9\.0 = 0\.50/.test(text), "analysis-tests: the Rf worked example calculates 0.50");
  ok(a2?.modelAnswer === "0.50", "analysis-tests: a2's model answer is 0.50");
  ok(a2?.check?.accepted?.includes("0.5"), "analysis-tests: a2 accepts the visible short form 0.5");
  ok(a2?.check?.accepted?.includes("1/2"), "analysis-tests: a2 accepts the equivalent fraction");
  ok(/oxygen/.test(analysis.assessment.find((item) => item.id === "a3")?.modelAnswer ?? ""), "analysis-tests: a3's key is oxygen");
  ok(analysis.retrieval.some((item) => item.when === "month-later"), "analysis-tests: retrieval is spaced to a month");
}

// THE AUTHORED COVALENT-BONDING LESSON. The facts checked here are the ones a
// learner acts on: a shared pair is not a transfer; a double bond is one bond
// of order two; boiling a simple molecular substance does not break its covalent
// bonds; and graphite's conductivity comes from delocalised electrons, not ions.
const covalent = A.AUTHORED_BY_CONCEPT["covalent-bonding"];
ok(Boolean(covalent), "covalent-bonding: the authored lesson is registered");
if (covalent) {
  const text = JSON.stringify(covalent);
  const a2 = covalent.assessment.find((item) => item.id === "a2");
  const a3 = covalent.assessment.find((item) => item.id === "a3");
  ok(covalent.explanation.length >= 5, "covalent-bonding: five teaching sections, including giant covalent structures");
  ok(covalent.objectives.length >= 4, "covalent-bonding: electron counting, representation, molecular properties and networks are objectives");
  ok(covalent.workedExamples.length >= 2, "covalent-bonding: two worked examples with reasons");
  ok(covalent.misconceptions.length >= 4, "covalent-bonding: four misconception repairs");
  ok(covalent.guidedPractice.length >= 3, "covalent-bonding: three guided items");
  ok(covalent.assessment.length >= 4, "covalent-bonding: four assessment items");
  ok(/shared pair/i.test(text) && /lone pair/i.test(text), "covalent-bonding: bonding and lone pairs are separated");
  ok(/not a transferred electron|not an electron transfer/i.test(text), "covalent-bonding: sharing is distinguished from electron transfer");
  ok(/one bond with order two|order two|not two separate single bonds/i.test(text), "covalent-bonding: a double bond is not two single bonds");
  ok(/intermolecular forces/i.test(text), "covalent-bonding: the forces between molecules are named");
  ok(/boiling water does not break|do not break|does not break|not breaking the C=O/i.test(text), "covalent-bonding: boiling is separated from breaking covalent bonds");
  ok(/diamond/i.test(text) && /graphite/i.test(text) && /silicon dioxide/i.test(text), "covalent-bonding: diamond, graphite and silicon dioxide are taught");
  ok(/tetrahedral/i.test(text), "covalent-bonding: diamond's tetrahedral network is described");
  ok(/delocalised electrons/i.test(text), "covalent-bonding: graphite's charge carrier is delocalised electrons");
  ok(/allotropes/i.test(text), "covalent-bonding: diamond and graphite are named as allotropes");
  ok(covalent.representations.some((block) => block.kind === "chemistry.particle-model"), "covalent-bonding: a particle-model representation is present");
  ok(a2?.modelAnswer === "6", "covalent-bonding: a2's model answer is six shared electrons");
  ok(a2?.check?.accepted?.includes("6"), "covalent-bonding: a2 accepts the visible short form 6");
  ok(a3?.check?.accepted?.some((answer) => /intermolecular|hydrogen bond/i.test(answer)), "covalent-bonding: a3 accepts intermolecular forces or hydrogen bonds");
  ok(covalent.retrieval.some((item) => item.when === "month-later"), "covalent-bonding: retrieval is spaced to a month");
}

// THE AUTHORED ELECTROLYSIS LESSON. The assessed facts are the ones a learner
// acts on: mobile ions are required; the cathode is negative and reduces
// cations; molten products differ from aqueous products because water competes;
// the anode reaction can be the electrode itself; and charge is current × time.
const electrolysis = A.AUTHORED_BY_CONCEPT["electrolysis"];
ok(Boolean(electrolysis), "electrolysis: the authored lesson is registered");
if (electrolysis) {
  const text = JSON.stringify(electrolysis);
  const a2 = electrolysis.assessment.find((item) => item.id === "a2");
  ok(electrolysis.explanation.length >= 5, "electrolysis: five teaching sections, including charge and industrial cells");
  ok(electrolysis.objectives.length >= 4, "electrolysis: mobile ions, electrode reactions, aqueous competition and charge are objectives");
  ok(electrolysis.workedExamples.length >= 2, "electrolysis: two worked examples with reasons");
  ok(electrolysis.misconceptions.length >= 4, "electrolysis: four misconception repairs");
  ok(electrolysis.guidedPractice.length >= 3, "electrolysis: three guided items");
  ok(electrolysis.assessment.length >= 4, "electrolysis: four assessment items");
  ok(/mobile ions/i.test(text) && /solid ionic/i.test(text), "electrolysis: mobile ions are distinguished from a fixed solid lattice");
  ok(/cathode is the negative electrode/i.test(text) && /anode is the positive electrode/i.test(text), "electrolysis: electrode polarity is stated explicitly");
  ok(/cations.*cathode/i.test(text) && /anions.*anode/i.test(text), "electrolysis: ion directions are tied to the electrodes");
  ok(/Na⁺ \+ e⁻ → Na/.test(text) && /2Cl⁻ → Cl₂ \+ 2e⁻/.test(text), "electrolysis: molten sodium chloride half-equations are present");
  ok(/Pb²⁺ \+ 2e⁻ → Pb/.test(text) && /2Br⁻ → Br₂ \+ 2e⁻/.test(text), "electrolysis: molten lead(II) bromide half-equations are present");
  ok(/2H₂O \+ 2e⁻ → H₂ \+ 2OH⁻/.test(text) && /4OH⁻ → O₂/.test(text), "electrolysis: water's competing half-equations are present");
  ok(/brine/i.test(text) && /chlorine/i.test(text) && /sodium hydroxide/i.test(text), "electrolysis: the three brine products are taught");
  ok(/dilute/i.test(text) && /oxygen/i.test(text), "electrolysis: dilution changes the anode product to oxygen");
  ok(/cryolite/i.test(text) && /aluminium/i.test(text), "electrolysis: aluminium extraction and cryolite are taught");
  ok(/copper purification|electroplating/i.test(text), "electrolysis: reactive electrodes and copper purification are taught");
  ok(/electrons.*wires|wires.*electrons/i.test(text) && /not through the electrolyte|do not travel through the solution/i.test(text), "electrolysis: electrons are kept in the circuit, not the electrolyte");
  ok(/Q = I × t/.test(text) && /600 C/.test(text), "electrolysis: charge is current × time with the worked 600 C value");
  ok(electrolysis.representations.some((block) => block.kind === "chemistry.particle-model"), "electrolysis: a particle-model representation is present");
  ok(electrolysis.representations.some((block) => block.kind === "chemistry.equation"), "electrolysis: an equation representation is present");
  ok(a2?.modelAnswer === "600", "electrolysis: a2's model answer is 600 C");
  ok(a2?.check?.accepted?.includes("600"), "electrolysis: a2 accepts the visible short form 600");
  ok(electrolysis.retrieval.some((item) => item.when === "month-later"), "electrolysis: retrieval is spaced to a month");
}

// THE AUTHORED ENERGY-CHANGES LESSON. The assessed facts are the ones a learner
// acts on: breaking bonds costs, forming bonds pays, the sign describes the
// system rather than the thermometer, q is a total that must be divided by the
// amount, and the profile's barrier is not its ΔH.
const energyChanges = A.AUTHORED_BY_CONCEPT["energy-changes"];
ok(Boolean(energyChanges), "energy-changes: the authored lesson is registered");
if (energyChanges) {
  const text = JSON.stringify(energyChanges);
  const a1 = energyChanges.assessment.find((item) => item.id === "a1");
  ok(energyChanges.explanation.length >= 4, "energy-changes: four teaching sections, including the profile");
  ok(energyChanges.objectives.length >= 4, "energy-changes: classification, bond energy, calorimetry and the profile are objectives");
  ok(energyChanges.workedExamples.length >= 2, "energy-changes: two worked examples with reasons");
  ok(energyChanges.misconceptions.length >= 3, "energy-changes: three misconception repairs");
  ok(energyChanges.guidedPractice.length >= 3, "energy-changes: three guided items, including the reaction profile");
  ok(energyChanges.assessment.length >= 3, "energy-changes: three assessment items");
  ok(/679/.test(text) && /864/.test(text) && /−185/.test(text), "energy-changes: the bond-energy example reaches −185 kJ/mol");
  ok(/breaking bonds costs|bonds broken are a cost/i.test(text), "energy-changes: bond breaking is taught as a cost, not a release");
  ok(/q = m × c × ΔT/.test(text), "energy-changes: calorimetry is taught with its equation");
  ok(/divide .*moles|÷ 0\.0500|per mole/i.test(text), "energy-changes: q is converted to a molar change");
  ok(/activation energy/i.test(text) && /does not move the reactant or product levels/i.test(text), "energy-changes: a catalyst is separated from ΔH");
  ok(a1?.modelAnswer?.includes("−103 kJ/mol"), "energy-changes: a1's model answer is −103 kJ/mol");
  ok(a1?.check?.accepted?.includes("-103 kJ/mol"), "energy-changes: a1 accepts the ASCII minus form");
  ok(energyChanges.retrieval.some((item) => item.when === "month-later"), "energy-changes: retrieval is spaced to a month");
}

// THE AUTHORED IONIC-BONDING LESSON. The assessed distinctions are the ones the
// topic turns on: the charge comes from the electron count, the formula is a
// neutral ratio rather than a molecule, the lattice is held together in every
// direction, and conductivity requires ions that can MOVE.
const ionicBonding = A.AUTHORED_BY_CONCEPT["ionic-bonding"];
ok(Boolean(ionicBonding), "ionic-bonding: the authored lesson is registered");
if (ionicBonding) {
  const text = JSON.stringify(ionicBonding);
  const a2 = ionicBonding.assessment.find((item) => item.id === "a2");
  ok(ionicBonding.explanation.length >= 4, "ionic-bonding: four teaching sections, including lattice properties");
  ok(ionicBonding.objectives.length >= 4, "ionic-bonding: ion charge, formulas, lattice properties and structure are objectives");
  ok(ionicBonding.workedExamples.length >= 2, "ionic-bonding: two worked examples with reasons");
  ok(ionicBonding.misconceptions.length >= 3, "ionic-bonding: three misconception repairs");
  ok(ionicBonding.guidedPractice.length >= 3, "ionic-bonding: three guided items");
  ok(ionicBonding.assessment.length >= 3, "ionic-bonding: three assessment items");
  ok(/2, 8, 1/.test(text) && /2, 8, 7/.test(text), "ionic-bonding: the sodium and chlorine electron counts are given");
  ok(/Al₂O₃/.test(text) && /2 × \+3|2 × 3\+/.test(text) && /3 × −2|3 × 2−/.test(text), "ionic-bonding: Al₂O₃ is derived from a 6+ and 6− balance");
  ok(/giant ionic lattice/i.test(text) && /no .*NaCl molecule|not a collection of NaCl molecules/i.test(text), "ionic-bonding: the lattice is distinguished from a molecule");
  ok(/fixed/i.test(text) && /mobile/i.test(text) && /conduct/i.test(text), "ionic-bonding: conduction is tied to mobile ions");
  ok(a2?.modelAnswer === "10", "ionic-bonding: a2's model answer is 10 electrons");
  ok(a2?.check?.accepted?.includes("10"), "ionic-bonding: a2 accepts the visible short form 10");
  ok(ionicBonding.retrieval.some((item) => item.when === "month-later"), "ionic-bonding: retrieval is spaced to a month");
}

// THE AUTHORED MOLES-CALCS LESSON. The assessed distinctions are the ones the
// topic turns on: a mole is a count rather than a mass, mass and solution
// amounts must be converted to moles before a ratio, coefficients are mole
// ratios rather than mass ratios, and the limiting reactant is found by
// dividing each amount by its coefficient.
const molesCalcs = A.AUTHORED_BY_CONCEPT["moles-calcs"];
ok(Boolean(molesCalcs), "moles-calcs: the authored lesson is registered");
if (molesCalcs) {
  const text = JSON.stringify(molesCalcs);
  const a2 = molesCalcs.assessment.find((item) => item.id === "a2");
  ok(molesCalcs.explanation.length >= 4, "moles-calcs: four teaching sections, including limiting reactants");
  ok(molesCalcs.objectives.length >= 4, "moles-calcs: mass, concentration, ratio and limiting reactant are objectives");
  ok(molesCalcs.workedExamples.length >= 3, "moles-calcs: three worked examples with reasons");
  ok(molesCalcs.misconceptions.length >= 3, "moles-calcs: three misconception repairs");
  ok(molesCalcs.guidedPractice.length >= 3, "moles-calcs: three guided items");
  ok(molesCalcs.assessment.length >= 3, "moles-calcs: three assessment items");
  ok(/6\.02 × 10²³/.test(text), "moles-calcs: Avogadro's constant is stated");
  ok(/8\.0 g/.test(text) && /0\.20 mol/.test(text), "moles-calcs: the mass-to-moles example reaches 0.20 mol");
  ok(/25\.0 cm³/.test(text) && /0\.0250 dm³/.test(text) && /0\.00250 mol/.test(text), "moles-calcs: the cm³ conversion is carried through to 0.00250 mol");
  ok(/C₃H₈ \+ 5O₂/.test(text) && /0\.40 mol/.test(text), "moles-calcs: the equation ratio produces 0.40 mol of water");
  ok(/limiting/i.test(text) && /divide .*coefficient|amount divided by its coefficient/i.test(text), "moles-calcs: limiting reactant uses amount divided by coefficient");
  ok(a2?.modelAnswer === "0.00250 mol", "moles-calcs: a2's model answer is 0.00250 mol");
  ok(a2?.check?.accepted?.includes("0.0025"), "moles-calcs: a2 accepts the visible short form 0.0025");
  ok(molesCalcs.retrieval.some((item) => item.when === "month-later"), "moles-calcs: retrieval is spaced to a month");
}

// THE AUTHORED ORGANIC-INTRO LESSON. Its assessed distinctions are structural:
// carbon's four bonds, alkane versus alkene, physical distillation versus
// chemical cracking, and addition polymerisation without elimination.
const organic = A.AUTHORED_BY_CONCEPT["organic-intro"];
ok(Boolean(organic), "organic-intro: the authored lesson is registered");
if (organic) {
  const text = JSON.stringify(organic);
  const a1 = organic.assessment.find((item) => item.id === "a1");
  const a2 = organic.assessment.find((item) => item.id === "a2");
  ok(organic.explanation.length >= 5, "organic-intro: five teaching sections, from carbon skeletons to polymers");
  ok(organic.objectives.length >= 4, "organic-intro: bonding, families, refining and polymers are objectives");
  ok(organic.workedExamples.length >= 3, "organic-intro: three worked examples with reasons");
  ok(organic.misconceptions.length >= 4, "organic-intro: four misconception repairs");
  ok(organic.guidedPractice.length >= 3, "organic-intro: three guided items");
  ok(/CₙH₂ₙ₊₂/.test(text) && /CₙH₂ₙ/.test(text), "organic-intro: both homologous-series formulas are stated");
  ok(/C₁₀H₂₂/.test(text) && /C₈H₁₈/.test(text) && /C₂H₄/.test(text), "organic-intro: the cracking equation conserves carbon and hydrogen");
  ok(/–CH₂–CH₂–/.test(text), "organic-intro: the poly(ethene) repeat unit is explicit");
  ok(/bromine water/i.test(text), "organic-intro: the alkene test is taught, not only named");
  ok(a1?.modelAnswer?.includes("C₅H₁₂") && a1?.check?.accepted?.includes("C5H12, 12"), "organic-intro: a1 uses the alkane count and accepts the typed formula");
  ok(a2?.modelAnswer === "propene, C₃H₆" && a2?.check?.accepted?.includes("propene, C3H6"), "organic-intro: a2 names propene and accepts the typed form");
  ok(organic.retrieval.some((item) => item.when === "month-later"), "organic-intro: retrieval is spaced to a month");
}

// THE AUTHORED METALLIC-BONDING LESSON. The assessed distinctions are the ones
// the topic turns on: a metal is a lattice of positive ions in a sea of mobile
// electrons, not an ionic solid; conductivity comes from mobile electrons;
// malleability comes from layers sliding; and an alloy is a variable mixture
// whose different-sized atoms make that sliding harder.
const metallicBonding = A.AUTHORED_BY_CONCEPT["metallic-bonding"];
ok(Boolean(metallicBonding), "metallic-bonding: the authored lesson is registered");
if (metallicBonding) {
  const text = JSON.stringify(metallicBonding);
  const a2 = metallicBonding.assessment.find((item) => item.id === "a2");
  ok(metallicBonding.explanation.length >= 4, "metallic-bonding: four teaching sections, including material choice");
  ok(metallicBonding.objectives.length >= 4, "metallic-bonding: structure, conductivity, malleability and alloys are objectives");
  ok(metallicBonding.workedExamples.length >= 2, "metallic-bonding: two worked examples with reasons");
  ok(metallicBonding.misconceptions.length >= 3, "metallic-bonding: three misconception repairs");
  ok(metallicBonding.guidedPractice.length >= 3, "metallic-bonding: three guided items");
  ok(metallicBonding.assessment.length >= 3, "metallic-bonding: three assessment items");
  ok(/positive (?:metal )?ions/i.test(text) && /delocalised electrons/i.test(text) && /no (?:separate )?negative ions/i.test(text), "metallic-bonding: the electron sea is distinguished from an ionic lattice");
  ok(/layers? .*slide|slide .*layers?/i.test(text) && /malleable|ductile/i.test(text), "metallic-bonding: malleability is explained by sliding layers");
  ok(/different[- ]sized atoms/i.test(text) && /alloy/i.test(text), "metallic-bonding: alloy hardening uses different-sized atoms");
  ok(/variable composition|composition can vary|mixture/i.test(text), "metallic-bonding: an alloy is a mixture, not a fixed compound");
  ok(a2?.modelAnswer === "3", "metallic-bonding: a2's model answer is 3 outer electrons");
  ok(a2?.check?.accepted?.includes("3"), "metallic-bonding: a2 accepts the visible short form 3");
  ok(metallicBonding.retrieval.some((item) => item.when === "month-later"), "metallic-bonding: retrieval is spaced to a month");
}

// THE AUTHORED EQUILIBRIA LESSON. The assessed distinction is the one the topic
// turns on: equilibrium is dynamic, pressure favours FEWER gas molecules, and a
// catalyst changes the rate but not the position or Kc. The Haber conditions
// are then a compromise rather than a list.
const equilibria = A.AUTHORED_BY_CONCEPT["equilibria"];
ok(Boolean(equilibria), "equilibria: the authored lesson is registered");
if (equilibria) {
  const text = JSON.stringify(equilibria);
  const a2 = equilibria.assessment.find((item) => item.id === "a2");
  ok(equilibria.explanation.length >= 4, "equilibria: four teaching sections, including the Haber compromise");
  ok(equilibria.objectives.length >= 4, "equilibria: dynamic equilibrium, Le Chatelier, Kc and the Haber process are objectives");
  ok(equilibria.workedExamples.length >= 2, "equilibria: two worked examples with reasons");
  ok(equilibria.misconceptions.length >= 3, "equilibria: three misconception repairs");
  ok(equilibria.guidedPractice.length >= 3, "equilibria: three guided items");
  ok(equilibria.assessment.length >= 3, "equilibria: three assessment items");
  ok(/dynamic/i.test(text) && /equal rates|rates are equal|forward and reverse rates/i.test(text), "equilibria: dynamic equilibrium is defined by equal rates");
  ok(/four gas molecules/i.test(text) && /fewer gas molecules/i.test(text), "equilibria: the pressure rule counts gas molecules");
  ok(/Kc = \(1\.60\)²/.test(text) && /64/.test(text), "equilibria: the Kc worked example reaches 64");
  ok(/450 °C/.test(text) && /200 atm/.test(text) && /iron catalyst/i.test(text), "equilibria: the Haber compromise names its conditions");
  ok(/does not change the position|unchanged/i.test(text) && /catalyst/i.test(text), "equilibria: a catalyst is separated from the equilibrium position");
  ok(a2?.modelAnswer === "Kc = 0.020 mol/dm³", "equilibria: a2's model answer is 0.020 mol/dm³");
  ok(a2?.check?.accepted?.includes("0.020"), "equilibria: a2 accepts the visible short form 0.020");
  ok(equilibria.retrieval.some((item) => item.when === "month-later"), "equilibria: retrieval is spaced to a month");
}

// THE AUTHORED RATES-REACTION LESSON. The assessed distinctions are the ones
// the topic turns on: rate is change divided by time, surface area raises
// collision frequency without changing Eₐ, a catalyst lowers Eₐ without
// changing the final amount, and a graph's gradient is the rate.
const ratesReaction = A.AUTHORED_BY_CONCEPT["rates-reaction"];
ok(Boolean(ratesReaction), "rates-reaction: the authored lesson is registered");
if (ratesReaction) {
  const text = JSON.stringify(ratesReaction);
  const a1 = ratesReaction.assessment.find((item) => item.id === "a1");
  const a2 = ratesReaction.assessment.find((item) => item.id === "a2");
  ok(ratesReaction.explanation.length >= 5, "rates-reaction: five teaching sections, including the graph");
  ok(ratesReaction.objectives.length >= 4, "rates-reaction: rate, collision theory, catalysts and graphs are objectives");
  ok(ratesReaction.workedExamples.length >= 2, "rates-reaction: two worked examples with reasons");
  ok(ratesReaction.misconceptions.length >= 4, "rates-reaction: four misconception repairs");
  ok(ratesReaction.guidedPractice.length >= 3, "rates-reaction: three guided items");
  ok(ratesReaction.assessment.length >= 3, "rates-reaction: three assessment items");
  ok(/0\.0040 g\/s/.test(text) && /0\.40 cm³\/s/.test(text), "rates-reaction: both rate calculations reach their stated units");
  ok(/surface area/i.test(text) && /collision frequency/i.test(text), "rates-reaction: surface area is tied to collision frequency");
  ok(/activation energy/i.test(text) && /both the forward and reverse/i.test(text), "rates-reaction: catalyst lowers both directions' barrier");
  ok(/plateau/i.test(text) && /gradient/i.test(text), "rates-reaction: the graph is read by gradient and plateau");
  ok(a1?.modelAnswer === "0.0040 g/s", "rates-reaction: a1's model answer is 0.0040 g/s");
  ok(a1?.check?.accepted?.includes("0.0040"), "rates-reaction: a1 accepts the visible short form 0.0040");
  ok(a2?.modelAnswer === "0.40 cm³/s", "rates-reaction: a2's model answer is 0.40 cm³/s");
  ok(a2?.check?.accepted?.includes("0.4 cm³/s"), "rates-reaction: a2 accepts the short decimal form");
  ok(ratesReaction.retrieval.some((item) => item.when === "month-later"), "rates-reaction: retrieval is spaced to a month");
}

if (failures.length) {
  console.error("Chemistry lesson failures:");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log(`✓ ${passed} assertions: chemistry sections, formulas, tables, worked examples, complete diagram coverage, no unverified chemistry video, profile and both renderers.`);
