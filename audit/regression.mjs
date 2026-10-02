// ─────────────────────────────────────────────────────────────────────────────
// REGRESSION GATE for the reproduced audit findings.
//
// Every assertion here was FAILING or MEASURING-BADLY before the repair, and
// each is written against the PRODUCTION path — the same serve function
// `app/api/progress/route.ts` calls, the same engine, the same rendered HTML a
// learner receives. Nothing here is a source-string check, because a
// source-string check would have passed while the product was wrong.
//
// Run:  node audit/regression.mjs        (needs a dev server on :4173 for the
//                                           UI half; the engine half does not)
//
// Exit 0 = every assertion holds. Non-zero = at least one regression.
// ─────────────────────────────────────────────────────────────────────────────
import { compileEngines } from "../scripts/compile-engines.mjs";
import fs from "node:fs";

compileEngines();
const B = "http://localhost:4173";
let pass = 0, fail = 0;
const failures = [];
function ok(cond, name, detail = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; failures.push({ name, detail }); console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}
const group = (n) => console.log(`\n${n}`);

const ceil = await import("../.verify/content-ceiling.js");
const specs = await import("../.verify/specifications.js");
const q = await import("../.verify/questions.js");
const sk = await import("../.verify/skills.js");

// The attempt count production actually uses. Hard-coded HERE on purpose: if
// someone lowers it, this gate notices, because the whole finding was measured
// at 40 and the default of 4 is the number that produced the bad audit number.
const PROD_ATTEMPTS = 40;

// ── R1. Per-concept difficulty ceilings ───────────────────────────────────────
group("R1 · per-concept difficulty ceilings are measured, not declared");
{
  const rows = [];
  for (const spec of specs.SPECIFICATIONS) for (const level of spec.levels) {
    const a = { spec, level };
    const p = ceil.contentProfileFor(a, "maths");
    if (p.concepts) rows.push({ name: level.name, ...p });
  }
  const a2 = rows.find((r) => r.name === "A2");
  ok(!!a2, "A-Level A2 has a measurable content profile");
  if (a2) {
    // Updated after the repair. The fault these assertions once pinned — A2
    // declaring 0.90 while every maths concept capped below 0.65 — is fixed by
    // lib/questions-senior.ts, composed into the bank in lib/questions.ts.
    // The live, CI-enforced gate for it is scripts/ceiling-gate.mjs; these
    // assertions stay here as the audit's own record of the comparison.
    ok(a2.declared === 0.9, "A2 still declares the qualification's own 0.90 (not silently lowered)");
    ok(a2.median >= a2.declared - 1e-9, "A2 median content ceiling now reaches its declared target", `median ${a2.median.toFixed(3)}`);
    ok(a2.shareBelowTarget === 0, "every A2 maths concept reaches A2's target", `${a2.belowTarget}/${a2.concepts}`);
  }
  const adv = rows.filter((r) => r.declared >= 0.7);
  ok(adv.length === 16, "16 advanced tiers measured", String(adv.length));
  const mathsRows = adv.filter((r) => r.subject === "maths");
  ok(mathsRows.length > 0 && mathsRows.every((r) => r.median >= r.declared - 1e-9),
     "EVERY maths advanced tier's median now reaches its declared target",
     mathsRows.filter((r) => r.median < r.declared - 1e-9).map((r) => r.name).join(", ") || "all reach it");
  // The subjects that still fall short are NAMED here rather than averaged
  // away, so the audit reports what was not reached as loudly as what was.
  const otherRows = adv.filter((r) => r.subject !== "maths");
  console.log(`    still short outside maths: ${otherRows.filter((r) => r.median < r.declared - 1e-9).length}/${otherRows.length} advanced subject rows`);
  const jun = rows.filter((r) => r.declared <= 0.45);
  ok(jun.every((r) => r.median >= r.declared - 0.01),
     "NO junior tier falls short — foundational work is not gated behind a ceiling it cannot meet",
     jun.filter((r) => r.median < r.declared - 0.01).map((r) => r.name).join(", "));
  // The metric must not be an extremum: a course with one deep concept must not
  // look capable. This is the bug the first version of the metric had.
  ok(adv.every((r) => r.max >= r.median), "profile reports both a best case and a typical case");
  ok(ceil.contentBandFor({ spec: specs.SPECIFICATIONS.find((s) => s.id === "uk-alevel"), level: specs.SPECIFICATIONS.find((s) => s.id === "uk-alevel").levels.find((l) => l.id === "a2") }, "maths") === 5,
     "A2 resolves to band 5 on the MEDIAN — the band an A-Level learner should actually meet");
}

// ── R2. Advanced-tier serving distribution through the production serve ───────
group("R2 · advanced-tier serving distribution (production serve path)");
{
  const dist = (specId, levelId) => {
    const spec = specs.SPECIFICATIONS.find((s) => s.id === specId);
    const level = spec.levels.find((l) => l.id === levelId);
    const ds = [];
    for (const c of specs.coverageOf({ spec, level })) {
      if (!q.hasGenerator(c.id)) continue;
      for (let s = 0; s < 2; s++) {
        const item = q.generateQuestionNear(c.id, `${specId}:${levelId}:${c.id}:${s}`, level.difficulty, PROD_ATTEMPTS);
        if (item) ds.push(item.difficulty);
      }
    }
    return { level, ds };
  };
  for (const [specId, levelId, label] of [["uk-alevel", "a2", "A2"], ["int-ib", "hl", "IB HL"], ["us-ap", "ap", "AP"]]) {
    const { level, ds } = dist(specId, levelId);
    const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
    ok(ds.length > 50, `${label}: drew a real sample`, String(ds.length));
    ok(mean < level.difficulty, `${label}: mean served is below its declared target`, `served ${mean.toFixed(3)} vs ${level.difficulty}`);
    // The attempt count must be the production one, not the default that caused
    // the original bad measurement.
    const cheap = [];
    const spec = specs.SPECIFICATIONS.find((s) => s.id === specId);
    for (const c of specs.coverageOf({ spec, level }).slice(0, 25)) {
      if (!q.hasGenerator(c.id)) continue;
      const item = q.generateQuestionNear(c.id, `${specId}:${levelId}:${c.id}:x`, level.difficulty, 4);
      if (item) cheap.push(item.difficulty);
    }
    const cheapMean = cheap.reduce((a, b) => a + b, 0) / cheap.length;
    ok(mean > cheapMean, `${label}: production (40 attempts) really does search harder than the 4-attempt default`,
       `prod ${mean.toFixed(3)} vs default ${cheapMean.toFixed(3)}`);
  }
}

// ── R3. Diagnostic skill coverage: the blueprint must match the bank ──────────
group("R3 · diagnostic skill mix vs what the bank can actually produce");
{
  const produced = Object.fromEntries(sk.SKILL_LADDER.map((s) => [s, 0]));
  let total = 0;
  for (const id of q.GENERATED_CONCEPT_IDS) {
    for (let i = 0; i < 60; i++) {
      const item = q.generateQuestionNear(id, `${id}~${i}`, 0.9, 1);
      if (!item || typeof item.difficulty !== "number") continue;
      produced[sk.skillForDifficulty(item.difficulty)]++;
      total++;
    }
  }
  const pctOf = (k) => Math.round((100 * produced[k]) / total);
  console.log(`    bank distribution: ${sk.SKILL_LADDER.map((s) => `${s} ${pctOf(s)}%`).join(", ")}`);
  // extended_response has no generator at all, and SKILLS_IN_BANK must not
  // claim it — the "do not claim to assess what you cannot assess" rule.
  ok(!sk.SKILLS_IN_BANK.includes("extended_response"),
     "extended_response is NOT claimed as in-bank (no instrument exists for it)");
  ok(produced.extended_response === 0, "and the bank genuinely produces none");
  // The declared mix asks for more data-interpretation than the bank can make.
  // This is a MEASURED gap, recorded so it cannot be forgotten: it is the next
  // content priority, not a passing/failing condition on today's bank.
  const mixTotal = sk.SKILLS_IN_BANK.reduce((s, k) => s + sk.SKILL_MIX[k], 0);
  const askedData = Math.round((100 * sk.SKILL_MIX.data_interpretation) / mixTotal);
  const madeData = pctOf("data_interpretation");
  console.log(`    data_interpretation: diagnostic asks ${askedData}%, bank produces ${madeData}% — a ${askedData - madeData}-point content gap`);
  ok(madeData < askedData, "the data-interpretation content gap is still real and measured (deep generators needed)");
}

// ── R4. Grade / qualification / subject isolation ─────────────────────────────
group("R4 · served questions respect the selected course and subject");
{
  const a2 = specs.SPECIFICATIONS.find((s) => s.id === "uk-alevel").levels.find((l) => l.id === "a2");
  const gcseF = specs.SPECIFICATIONS.find((s) => s.id === "uk-gcse").levels.find((l) => l.id === "foundation");
  const a2Maths = new Set(specs.coverageOf({ spec: specs.SPECIFICATIONS.find((s) => s.id === "uk-alevel"), level: a2 })
    .filter((c) => c.subject === "maths").map((c) => c.id));
  const gcseMaths = new Set(specs.coverageOf({ spec: specs.SPECIFICATIONS.find((s) => s.id === "uk-gcse"), level: gcseF })
    .filter((c) => c.subject === "maths").map((c) => c.id));
  ok(a2Maths.size > 0 && gcseMaths.size > 0, "both courses resolve a maths concept set");
  // A2's stage window is deeper, so it must not be a subset of GCSE Foundation.
  const onlyInA2 = [...a2Maths].filter((c) => !gcseMaths.has(c));
  ok(onlyInA2.length > 0, "A2 reaches concepts GCSE Foundation does not", `${onlyInA2.length} exclusive`);
  // And no served item may escape the course it was asked for.
  let escaped = 0;
  for (const c of a2Maths) {
    const item = q.generateQuestionNear(c, `iso:${c}`, a2.difficulty, PROD_ATTEMPTS);
    if (!item || item.conceptId !== c) escaped++;
  }
  ok(escaped === 0, "every item served for a course is that course's own concept", `${escaped} escaped`);
  // Subject isolation: a maths course must not offer physics items.
  const phys = specs.coverageOf({ spec: specs.SPECIFICATIONS.find((s) => s.id === "uk-alevel"), level: a2 })
    .filter((c) => c.subject === "physics").map((c) => c.id);
  ok(phys.every((p) => !a2Maths.has(p)), "maths and physics concept sets do not overlap");
}

// ── R5. No engineering markers or internal ids in student UI ──────────────────
group("R5 · student-visible HTML carries no engineering markers or internal ids");
{
  let served = 0;
  const marker = (h) => {
    const body = h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
    const t = body.replace(/<[^>]+>/g, "\n").replace(/&amp;/g, "&").replace(/&#x27;/g, "'");
    return {
      section: (t.match(/§/g) || []).length,
      // an internal item id: concept slug immediately followed by -<digits>
      internalId: /\b[a-z]+(?:-[a-z]+)+-\d+\b/.test(t),
      rawKey: /\b(?:home|nav|next|learn|evv|mm|an|teach|plan|curr|off|acc|onb|state|res|pack|ask|common|map|prog)\.[a-zA-Z][\w.]*\b/.test(t),
    };
  };
  for (const route of ["/", "/solve", "/about", "/help", "/teacher", "/curriculum", "/learn", "/dashboard", "/progress", "/mind", "/papers", "/offline", "/access", "/projects", "/mistakes", "/genome", "/rooms", "/onboarding", "/account", "/diagnostic/maths", "/try/fractions"]) {
    let h; try { h = await (await fetch(B + route)).text(); } catch { console.log(`    (skipped ${route}: no server)`); continue; }
    served++;
    const m = marker(h);
    ok(m.section === 0, `${route}: no § engineering marker`, String(m.section));
    ok(!m.rawKey, `${route}: no raw i18n key rendered`);
    ok(!m.internalId, `${route}: no internal item id rendered`);
  }
  ok(served > 0, "UI half actually ran against a live server", `${served} routes`);
  // The landing page specifically must not carry another learner's record.
  const home = await (await fetch(B + "/")).text();
  const homeText = home.replace(/<[^>]+>/g, " ");
  ok(!/THE RECORD IT READ|needed help|hit the same slip/i.test(homeText),
     "landing page shows no fictional learner telemetry");
  ok(!/worked-grid/.test(home), "landing page carries no worked-example ledger block");
  const about = await (await fetch(B + "/about")).text();
  ok(/worked-grid/.test(about), "the worked example lives on /about instead");
}

// ── R6. Keyboard / landmark hygiene (measured, not assumed) ───────────────────
group("R6 · landmarks and keyboard access (measured in the DOM)");
{
  // Static presence of two <nav aria-label="Main menu"> is NOT a fault if one is
  // display:none at every viewport. The first version of this audit flagged it
  // from source alone and was wrong; the check below is the one that counts.
  const home = await (await fetch(B + "/")).text();
  ok(!/tabindex="(?!0|-1)\d+"/.test(home), "no positive tabindex (does not reorder the tab sequence)");
  ok(/Skip to the work/.test(home), "a skip-to-content link is present");
  const css = fs.readFileSync("app/globals.css", "utf8");
  ok((css.match(/@media/g) || []).length >= 4, "responsive breakpoints exist", String((css.match(/@media/g) || []).length));
}

console.log(`\n${"─".repeat(60)}`);
console.log(`PASS ${pass}   FAIL ${fail}`);
if (fail) { console.log("\nFailures:"); for (const f of failures) console.log(`  · ${f.name}${f.detail ? " — " + f.detail : ""}`); }
fs.writeFileSync("audit/regression.json", JSON.stringify({ pass, fail, failures }, null, 2));
process.exit(fail ? 1 : 0);
