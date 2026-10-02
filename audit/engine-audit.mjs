// OpenMind repair audit — Stage 1 engine baseline.
//
// METHOD NOTE (this changed the answer once): the motivating audit measured
// serving through generateQuestionNear's DEFAULT attempt count (4). Production
// does NOT use the default — app/api/progress/route.ts sets
// PRACTICE_DRAW_ATTEMPTS = 40 and passes it explicitly. Every number here is
// therefore reported at the PRODUCTION attempt count, with 4/12 shown only as
// a sensitivity so the gap between "default" and "production" stays visible.
import fs from "node:fs";
import path from "node:path";
import { compileEngines } from "../scripts/compile-engines.mjs";

compileEngines();
const V = "../.verify";
const { SPECIFICATIONS, coverageOf } = await import(`${V}/specifications.js`);
const { generateQuestionNear, conceptDepth, hasGenerator, difficultyBandFor, GENERATED_CONCEPT_IDS } = await import(`${V}/questions.js`);
const { skillForDifficulty, SKILL_LADDER, SKILLS_IN_BANK, SKILL_MIX, SKILL_MIN_DIFFICULTY } = await import(`${V}/skills.js`);
const { bandsFor, LADDER_STAGES, LADDER_DIFFICULTIES, BAND_RULES } = await import(`${V}/diagnostic.js`);

const PROD_ATTEMPTS = 40; // app/api/progress/route.ts:27
const DRAW_PER_CONCEPT = 3;
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);
const r3 = (n) => Math.round(n * 1000) / 1000;
const out = { generatedAt: new Date().toISOString(), productionAttempts: PROD_ATTEMPTS, findings: {} };

// ── F1 + F3: served difficulty per course/tier, and per-concept reachability ──
const tiers = [];
for (const spec of SPECIFICATIONS) {
  for (const level of spec.levels) {
    const cov = coverageOf({ spec, level }).filter((c) => hasGenerator(c.id));
    if (!cov.length) continue;
    const served = [], ceilings = [];
    for (const c of cov) {
      ceilings.push(conceptDepth(c.id));
      for (let s = 0; s < DRAW_PER_CONCEPT; s++) {
        const q = generateQuestionNear(c.id, `${spec.id}:${level.id}:${c.id}:${s}`, level.difficulty, PROD_ATTEMPTS);
        if (q) served.push({ id: c.id, d: q.difficulty, ceiling: conceptDepth(c.id) });
      }
    }
    const ds = served.map((x) => x.d);
    const bands = {};
    for (const d of ds) bands[difficultyBandFor(d)] = (bands[difficultyBandFor(d)] || 0) + 1;
    tiers.push({
      spec: spec.id, level: level.id, name: level.name, target: level.difficulty,
      concepts: cov.length, items: served.length,
      meanServed: r3(mean(ds)),
      shortfall: r3(level.difficulty - mean(ds)),
      p90Shortfall: r3(level.difficulty - [...ds].sort((a, b) => b - a)[Math.floor(ds.length * 0.1)]),
      medianCeiling: r3([...ceilings].sort((a, b) => a - b)[Math.floor(ceilings.length / 2)]),
      maxCeiling: r3(Math.max(...ceilings)),
      conceptsCeilingBelowTarget: ceilings.filter((c) => c < level.difficulty).length,
      pctConceptsUnreachable: pct(ceilings.filter((c) => c < level.difficulty).length, ceilings.length),
      pctItemsBelowTarget: pct(served.filter((x) => x.d < level.difficulty - 1e-9).length, served.length),
      pctItemsAtCeiling: pct(served.filter((x) => x.d >= x.ceiling - 1e-9).length, served.length),
      pctItemsBand1to2: pct((bands[1] || 0) + (bands[2] || 0), served.length),
      pctItemsBand5: pct(bands[5] || 0, served.length),
    });
  }
}
tiers.sort((a, b) => b.target - a.target);
out.findings.servedByTier = tiers;
const adv = tiers.filter((t) => t.target >= 0.7);
out.findings.servedByTierSummary = {
  advancedTiers: adv.length,
  advancedMeanServed: r3(mean(adv.map((t) => t.meanServed))),
  advancedMeanShortfall: r3(mean(adv.map((t) => t.shortfall))),
  advancedPctItemsBand1to2: Math.round(mean(adv.map((t) => t.pctItemsBand1to2))),
  advancedPctConceptsUnreachable: Math.round(mean(adv.map((t) => t.pctConceptsUnreachable))),
  juniorMeanServed: r3(mean(tiers.filter((t) => t.target <= 0.45).map((t) => t.meanServed))),
  fullCurriculumServedRange: [r3(Math.min(...tiers.map((t) => t.meanServed))), r3(Math.max(...tiers.map((t) => t.meanServed)))],
  declaredTargetRange: [Math.min(...tiers.map((t) => t.target)), Math.max(...tiers.map((t) => t.target))],
};

// ── F2: attempt-count sensitivity at the production serve function ──
const sensitivity = [];
for (const [specId, levelId] of [["uk-alevel", "a2"], ["int-ib", "hl"], ["us-ap", "ap"], ["uk-gcse", "higher"]]) {
  const spec = SPECIFICATIONS.find((s) => s.id === specId);
  const level = spec.levels.find((l) => l.id === levelId);
  const cov = coverageOf({ spec, level }).filter((c) => hasGenerator(c.id));
  const row = { spec: specId, level: levelId, target: level.difficulty, byAttempts: {} };
  for (const att of [4, 12, 40]) {
    const ds = [];
    for (const c of cov) for (let s = 0; s < 2; s++) {
      const q = generateQuestionNear(c.id, `${specId}:${levelId}:${c.id}:${s}`, level.difficulty, att);
      if (q) ds.push(q.difficulty);
    }
    row.byAttempts[att] = { meanServed: r3(mean(ds)), shortfall: r3(level.difficulty - mean(ds)), pctAtOrAbove075: pct(ds.filter((d) => d >= 0.75).length, ds.length) };
  }
  sensitivity.push(row);
}
out.findings.attemptSensitivity = sensitivity;

// ── F4: bank-wide demand distribution vs the diagnostic's declared mix ──
const bankSkill = Object.fromEntries(SKILL_LADDER.map((s) => [s, 0]));
let bankTotal = 0;
for (const id of GENERATED_CONCEPT_IDS) {
  for (let i = 0; i < 120; i++) {
    const q = generateQuestionNear(id, `${id}#${i}`, 0.9, 1); // raw draw, un-aimed
    if (!q || typeof q.difficulty !== "number") continue;
    bankSkill[skillForDifficulty(q.difficulty)]++;
    bankTotal++;
  }
}
const producible = Object.fromEntries(Object.entries(bankSkill).map(([k, v]) => [k, r3(pct(v, bankTotal))]));
const mixTotal = SKILLS_IN_BANK.reduce((s, k) => s + SKILL_MIX[k], 0);
const declared = Object.fromEntries(SKILL_LADDER.map((k) => [k, SKILLS_IN_BANK.includes(k) ? r3(pct(SKILL_MIX[k] / mixTotal, 1)) : 0]));
out.findings.diagnosticSkillCoverage = {
  samples: bankTotal,
  produciblePct: producible,
  declaredQuotaPct: declared,
  unproducible: SKILL_LADDER.filter((k) => (producible[k] || 0) < 1),
  skillMinDifficulty: SKILL_MIN_DIFFICULTY,
  ladder: { stages: LADDER_STAGES, difficulties: LADDER_DIFFICULTIES, rules: BAND_RULES },
  note: "declaredQuotaPct is what skillQuotaFor redistributes toward after extended_response is removed; the gap vs produciblePct is what the selector must cover by over-sampling rare deep concepts.",
};

fs.mkdirSync("audit", { recursive: true });
fs.writeFileSync("audit/baseline-engine.json", JSON.stringify(out, null, 2));
console.log("wrote audit/baseline-engine.json");
console.log(`tiers measured: ${tiers.length}`);
console.log(`ADVANCED (target>=0.70, n=${adv.length}): meanServed=${out.findings.servedByTierSummary.advancedMeanServed} shortfall=${out.findings.servedByTierSummary.advancedMeanShortfall} band1-2 items=${out.findings.servedByTierSummary.advancedPctItemsBand1to2}% concepts-unreachable=${out.findings.servedByTierSummary.advancedPctConceptsUnreachable}%`);
console.log(`curriculum served range ${out.findings.servedByTierSummary.fullCurriculumServedRange} vs declared ${out.findings.servedByTierSummary.declaredTargetRange}`);
console.log("attempt sensitivity:"); for (const r of sensitivity) console.log("  ", r.spec + "/" + r.level, JSON.stringify(r.byAttempts));
console.log("producible:", JSON.stringify(producible));
console.log("declared  :", JSON.stringify(declared));
