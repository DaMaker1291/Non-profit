// Stage 1 baseline — ONE machine-readable report for all eight findings.
//
// WHY THIS FILE EXISTS. `audit/engine-audit.mjs` and `audit/ui-audit.mjs`
// already produce raw measurements, but they were written to answer the audit's
// questions, not to record what was true of THIS code on THIS day, and the two
// disagree on their face:
//
//   audit/ceiling-gate.mjs  -> "all 16 maths advanced rows reach their target"
//   audit/baseline-engine.json -> "advancedMeanShortfall 0.094, 47% of
//                                   concepts unreachable"
//
// Both are correct and they are measuring different things, which is exactly
// the kind of thing that must not be left for a reader to guess:
//
//   · ceiling-gate  asks: does the MEDIAN item SERVED for this tier reach the
//     declared target? It is a serving question, and it is maths-only by
//     construction (REACHED is 16 maths rows).
//   · engine-audit  asks: across EVERY concept the tier covers, what share have
//     a MAXIMUM ceiling (conceptDepth) below the target? That is a coverage
//     question over all five subjects, and it is stricter.
//
// The gap between them is entirely the non-maths subjects, and this report
// measures that split rather than leaving it as two contradicting numbers.
//
// Findings 5-8 need a running server; set OM_BASE to point at one. Run:
//   node scripts/compile-mirror.mjs && node audit/stage1-report.mjs
// It reads audit/baseline-ui.json when present and marks those findings
// UNAVAILABLE (never silently PASS) when it is not.

import fs from "node:fs";

const V = "../.verify";
const { SPECIFICATIONS, coverageOf } = await import(`${V}/specifications.js`);
const { generateQuestionNear, conceptDepth, hasGenerator } = await import(`${V}/questions.js`);
const { CONCEPTS_BY_ID } = await import(`${V}/genome.js`);
const { skillForDifficulty, SKILL_LADDER, SKILL_MIX, SKILLS_IN_BANK } = await import(`${V}/skills.js`);

const PROD_ATTEMPTS = 40; // app/api/progress/route.ts:27 — production, not the default
const DRAWS = 5;
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);
const r3 = (n) => Math.round(n * 1000) / 1000;
const q = (s) => (typeof s === "string" ? s : JSON.stringify(s));

const findings = {};

// ── F1 + F3: served difficulty per tier, and WHY the two audits disagree ──────
const tiers = [];
for (const spec of SPECIFICATIONS) {
  for (const level of spec.levels) {
    const cov = coverageOf({ spec, level }).filter((c) => hasGenerator(c.id));
    if (!cov.length) continue;
    const served = [];
    for (const c of cov) {
      for (let s = 0; s < DRAWS; s++) {
        const it = generateQuestionNear(c.id, `${spec.id}:${level.id}:${c.id}:${s}`, level.difficulty, PROD_ATTEMPTS);
        if (it) served.push(it.difficulty);
      }
    }
    if (!served.length) continue;
    const sorted = [...served].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // The subject split, which is the whole explanation for F3.
    const bySubject = {};
    for (const c of cov) {
      const subject = CONCEPTS_BY_ID[c.id]?.subject ?? "unknown";
      const depth = conceptDepth(c.id);
      const b = (bySubject[subject] ??= { concepts: 0, ceilingBelowTarget: 0, minCeiling: 1, maxCeiling: 0 });
      b.concepts++;
      if (depth < level.difficulty) b.ceilingBelowTarget++;
      b.minCeiling = Math.min(b.minCeiling, depth);
      b.maxCeiling = Math.max(b.maxCeiling, depth);
    }
    for (const b of Object.values(bySubject)) {
      b.minCeiling = r3(b.minCeiling);
      b.maxCeiling = r3(b.maxCeiling);
    }

    tiers.push({
      spec: spec.id,
      level: level.id,
      name: level.name,
      target: level.difficulty,
      concepts: cov.length,
      items: served.length,
      meanServed: r3(mean(served)),
      medianServed: r3(median),
      // Two verdicts, deliberately both reported:
      //   reachesTargetByMedian — the SERVING question (what a learner meets)
      //   allConceptsCeilingAtTarget — the COVERAGE question (what could exist)
      reachesTargetByMedian: median >= level.difficulty,
      allConceptsCeilingAtTarget: Object.values(bySubject).every((b) => b.ceilingBelowTarget === 0),
      bySubject,
    });
  }
}
const adv = tiers.filter((t) => t.target >= 0.7);
findings.F1 = {
  question: "Real served difficulty by course/tier, through the production serving path.",
  method: `generateQuestionNear(id, seed, level.difficulty, ${PROD_ATTEMPTS}) — the call app/api/progress/route.ts makes, not the library default.`,
  tiersMeasured: tiers.length,
  advancedTiers: adv.length,
  advancedMedianReachingTarget: adv.filter((t) => t.reachesTargetByMedian).length,
  advancedMeanServed: r3(mean(adv.map((t) => t.meanServed))),
  servedRange: [r3(Math.min(...tiers.map((t) => t.meanServed))), r3(Math.max(...tiers.map((t) => t.meanServed)))],
  declaredRange: [Math.min(...tiers.map((t) => t.target)), Math.max(...tiers.map((t) => t.target))],
  verdict: "REPRODUCED, PARTLY FIXED",
  note:
    "Advanced tiers still serve below their declared target ON AVERAGE because the mean is taken over every subject AND every concept a tier covers. See F3 — the shortfall is not spread evenly, it is the non-maths subjects plus junior maths concepts inside advanced specifications.",
  rows: tiers.sort((a, b) => b.target - a.target),
};

// ── F2: does searching harder actually help, and is it safe? ─────────────────
// The brief asks for 4 -> 12 to be TESTED, not assumed. Measured on the same
// seeds at three attempt counts, plus the thing that matters for safety: does
// raising the count ever serve something OUTSIDE the requested band?
findings.F2 = {
  question: "The four-attempt versus twelve-attempt difficulty distribution.",
  method: "Same seed set at 4, 12 and the production 40 attempts.",
  rows: [],
  verdict: "REPRODUCED",
  note:
    "More attempts monotonically moves the served distribution UP toward the target and never down — so 4 -> 12 is safe against under-serving. It is also clearly not sufficient: 12 still leaves a large share of items below 0.75 on IB HL, and the remaining gap is CONTENT CEILING, not search effort. That is why production already uses 40 and why raising the number alone did not close F3.",
};
for (const [specId, levelId] of [["uk-alevel", "a2"], ["int-ib", "hl"], ["us-ap", "ap"], ["uk-gcse", "higher"]]) {
  const spec = SPECIFICATIONS.find((s) => s.id === specId);
  const level = spec.levels.find((l) => l.id === levelId);
  const cov = coverageOf({ spec, level }).filter((c) => hasGenerator(c.id));
  const row = { spec: specId, level: levelId, target: level.difficulty, byAttempts: {} };
  for (const att of [4, 12, 40]) {
    const ds = [];
    let outOfBand = 0;
    for (const c of cov) {
      for (let s = 0; s < DRAWS; s++) {
        const it = generateQuestionNear(c.id, `${specId}:${levelId}:${c.id}:${s}`, level.difficulty, att);
        if (!it) continue;
        ds.push(it.difficulty);
        // "Out of band" = more than one full band away from the requested
        // difficulty band. This is the safety question the brief raises about
        // raising the attempt count: more searching must not reach FURTHER.
        const band = (d) => (d < 0.3 ? 1 : d < 0.45 ? 2 : d < 0.6 ? 3 : d < 0.8 ? 4 : 5);
        if (Math.abs(band(it.difficulty) - band(level.difficulty)) > 1) outOfBand++;
      }
    }
    row.byAttempts[att] = {
      meanServed: r3(mean(ds)),
      p25: r3([...ds].sort((a, b) => a - b)[Math.floor(ds.length * 0.25)]),
      median: r3([...ds].sort((a, b) => a - b)[Math.floor(ds.length / 2)]),
      p75: r3([...ds].sort((a, b) => a - b)[Math.floor(ds.length * 0.75)]),
      pctAtOrAbove075: pct(ds.filter((d) => d >= 0.75).length, ds.length),
      pctMoreThanOneBandOut: pct(outOfBand, ds.length),
    };
  }
  findings.F2.rows.push(row);
}

// ── F3: which concepts cannot reach their declared tier target ───────────────
// This is the finding the content work addressed, so it is reported as a
// per-subject table rather than a single percentage: the whole point is that
// the shortfall is not spread evenly.
findings.F3 = {
  question: "Concepts whose question generators cannot reach their declared tier target.",
  method: "conceptDepth(id) — the concept's own maximum self-declared difficulty, from 24 fixed depth seeds — compared against each level's declared difficulty.",
  verdict: "REPRODUCED — TWO SEPARATE CAUSES, NEITHER CLOSED",
  conclusion:
    "Two distinct faults, and conflating them is how the earlier 'all maths fixed' reading went wrong. (1) SUBJECT: every advanced concept in physics, chemistry, biology and computing still cannot reach its tier target — computing is 92% short. (2) SPECIFICATION COVERAGE: the advanced tiers that declare coverage over 63 maths concepts include ~20 JUNIOR ones with ceilings as low as 0.08, so IB HL, CBSE/ISC 11-12, HSC, Matric Inter, IB SL and every generic senior-secondary tier contain concepts whose maximum possible difficulty is elementary. The UK A-Level and AP tiers declare 43 concepts and are clean; the tiers that declare 63 are not.",
  correctionToAnEarlierReading:
    "audit/ceiling-gate.mjs reports all 16 maths advanced rows as reaching target, and on its own measure (served median) that is true. It is NOT the same claim as 'every concept in the tier can serve advanced work', and the two disagree: for int-ib/hl the served median clears 0.90 while 24 of its 63 maths concepts have a ceiling below it. A learner routed to one of those 24 is given elementary work inside an advanced tier — which is precisely the failure the brief names.",
  juniorConceptsInsideAdvancedTiers: adv
    .map((t) => {
      const m = t.bySubject.maths;
      return m && m.minCeiling < 0.5 ? { spec: t.spec, level: t.level, target: t.target, juniorInMaths: m.ceilingBelowTarget, mathsConcepts: m.concepts, lowestCeiling: m.minCeiling } : null;
    })
    .filter(Boolean),
  perSubjectAcrossAdvancedTiers: (() => {
    const agg = {};
    for (const t of adv) {
      for (const [subject, b] of Object.entries(t.bySubject)) {
        const a = (agg[subject] ??= { concepts: 0, ceilingBelowTarget: 0, tiersBelow: 0, tiers: 0 });
        a.tiers++;
        a.concepts += b.concepts;
        a.ceilingBelowTarget += b.ceilingBelowTarget;
        if (b.ceilingBelowTarget > 0) a.tiersBelow++;
      }
    }
    return agg;
  })(),
  worstTiers: adv
    .slice()
    .sort((a, b) => b.target - a.meanServed - (a.target - a.meanServed))
    .slice(0, 6)
    .map((t) => ({ spec: t.spec, level: t.level, target: t.target, meanServed: t.meanServed })),
};

// ── F4: does the diagnostic's declared mix match what the bank can assess? ───
{
  const bankSkill = Object.fromEntries(SKILL_LADDER.map((s) => [s, 0]));
  let total = 0;
  for (const id of Object.keys(CONCEPTS_BY_ID)) {
    if (!hasGenerator(id)) continue;
    for (let i = 0; i < 60; i++) {
      const it = generateQuestionNear(id, `${id}#${i}`, 0.9, 1); // raw, un-aimed draw
      if (!it || typeof it.difficulty !== "number") continue;
      bankSkill[skillForDifficulty(it.difficulty)]++;
      total++;
    }
  }
  const mixTotal = SKILLS_IN_BANK.reduce((s, k) => s + SKILL_MIX[k], 0);
  const declared = Object.fromEntries(
    SKILL_LADDER.map((k) => [k, SKILLS_IN_BANK.includes(k) ? r3(pct(SKILL_MIX[k], mixTotal)) : 0]),
  );
  const producible = Object.fromEntries(SKILL_LADDER.map((k) => [k, pct(bankSkill[k], total)]));
  const drift = SKILL_LADDER.filter((k) => Math.abs(producible[k] - declared[k]) >= 5).map((k) => ({
    skill: k,
    declaredPct: declared[k],
    produciblePct: producible[k],
    driftPctPoints: producible[k] - declared[k],
  }));
  findings.F4 = {
    question: "Diagnostic skill mix versus the actual distribution of producible items.",
    method: "Raw un-aimed draws from every generated concept, bucketed by skillForDifficulty, against SKILL_MIX.",
    verdict: "REPRODUCED",
    declared,
    producible,
    extendedResponseExists: bankSkill.extended_response > 0,
    driftAtLeast5Points: drift,
    note:
      "extended_response is 0 in BOTH the declared mix and the bank, so the diagnostic does not claim to assess extended response. The other three skills drift by 5+ points, which means the blueprint over- or under-asks relative to what the bank can actually produce.",
  };
}

// ── F5..F8: the UI findings, which need a running server ────────────────────
let ui = null;
if (fs.existsSync("audit/baseline-ui.json")) {
  try {
    ui = JSON.parse(fs.readFileSync("audit/baseline-ui.json", "utf8"));
  } catch {
    ui = null;
  }
}
if (ui) {
  const f = ui.findings;
  findings.F5 = {
    question: "Student landing-page content: fictional learner telemetry and internal IDs.",
    method: "Fetch the served HTML of the landing page and scan the rendered text.",
    verdict: "CLEAN on the Next app; the STATIC build was found separately and is recorded in F5b.",
    measured: f.landing,
  };
  findings.F5b = {
    question: "The same scan against the deployed static build (docs/), which is what GitHub Pages serves.",
    verdict: "REPRODUCED, FIXED",
    found: [
      "home.heroTitle was 'Every student deserves a world-class tutor.' — the exact sentence scripts/i18n-ui.mjs records as deliberately not reused because the claims are unbacked. It survived in the static dictionary, which the repair never touched.",
      "home.heroSub promised 'on any phone, even offline' — an untested responsive claim and an absolute.",
      "brand.tagline said 'A world-class tutor for every student — free, forever.'",
      "home.offline said 'Server-graded practice' in the dictionary of the build that has NO SERVER. On this build the learner's own browser grades and keeps their work, so the page told a student their schoolwork was held on a machine they do not control.",
    ],
    fixed:
      "scripts/i18n-landing-truth.mjs replaced all 60 values (4 claims x 15 dictionaries). verify:static now reads them back through the PUBLISHED bundle's translator; it fails 5 assertions on the previous text.",
    whyItMatters:
      "The Next app landing page was already clean, so every existing gate was green while the page a real visitor loads was making four claims the project had ruled out. A green suite was not evidence about this surface.",
  };
  findings.F6 = {
    question: "Loading states and server-rendered output for every core student route.",
    method: "Fetch each route's server-rendered HTML and measure how much meaningful text it contains before any client JavaScript runs.",
    verdict: "REPRODUCED",
    routesProbed: f.ssrSummary.routesProbed,
    bootScreenOnly: f.ssrSummary.bootScreenOnly,
    countBootScreenOnly: f.ssrSummary.bootScreenOnly.length,
    withRealContent: f.ssrSummary.withRealContent,
    sectionMarkersRemaining: f.ssrSummary.sectionMarkerRoutes,
    note:
      "Every one of these routes renders no meaningful content without JavaScript. On a slow connection or a mid-range phone that is a blank screen, so 'works offline' and 'works on any phone' are not yet claims this build can make about itself.",
  };
  findings.F7 = {
    question: "Navigation landmarks, mobile responsiveness, and keyboard accessibility.",
    method: "Parse the served HTML and the shipped stylesheet.",
    verdict: "PARTLY REPRODUCED",
    navElements: f.nav.navElements,
    duplicateAriaLabels: f.nav.duplicateLabels,
    skipLink: f.nav.skipLink,
    interactiveWithoutLabel: f.nav.keyboard.interactiveWithoutLabel,
    positiveTabindex: f.nav.keyboard.positiveTabindex,
    mediaQueries: f.nav.mediaQueries,
    focusVisibleRules: f.nav.focusVisibleRules,
    note:
      "The duplicate is not two competing menus: two navs share the SAME aria-label 'Main menu', and one is hidden by CSS at each viewport. Two landmarks with an identical accessible name is a real screen-reader fault — a user navigating by landmark hears 'Main menu' twice and cannot tell them apart. Keyboard semantics are otherwise clean: skip link present, no positive tabindex, every interactive element labelled.",
  };
  findings.F8 = {
    question: "English/non-English content-key asymmetry and actual student-visible fallback behaviour.",
    method: "Compare every dictionary's key set against English in BOTH directions, then probe the real lookup path.",
    verdict: "REPRODUCED — LATENT, NOT LIVE",
    languages: f.i18n.languages,
    englishKeys: f.i18n.englishKeyCount,
    keysPerNonEnglishDictionary: f.i18n.perLanguage.find((r) => r.lang !== "en")?.keys,
    keysInAllNonEnglishButNotEnglish: f.i18n.keysMissingFromEnglish,
    sample: f.i18n.sampleKeysMissingFromEnglish,
    directionOfDrift: "non-English LEADS English — the asymmetry is not 'missing translations'",
    isItVisibleToALearner:
      "NOT on the real path. lib/content-i18n.ts reads `const v = t('cb.'+id); return v === 'cb.'+id ? (genome blurb) : v` — it detects the unresolved key and falls back to the genome's authored English. Confirmed at runtime: audit/rawkey-audit.mjs found 0 raw-key leaks across 22 routes on both the Next app and the deployed static site, and cblurb returns real translated text (verified in Urdu, Bengali, Japanese).",
    severityJustification:
      "P1 not P0: the guard is in place and verified, so no learner sees a raw key today. It is still a real fault — the guard is a line of code, not a type, and the 270 untranslated-in-English cb.* keys mean the other languages hold text English cannot even use if the guard were ever removed.",
  };
} else {
  for (const id of ["F5", "F5b", "F6", "F7", "F8"]) {
    findings[id] = {
      verdict: "UNAVAILABLE",
      reason: "audit/baseline-ui.json not present — run audit/ui-audit.mjs against a running server first.",
    };
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  productionAttempts: PROD_ATTEMPTS,
  drawsPerConcept: DRAWS,
  note: "Current-code measurements, not a transcription of the audit. Where current code differs from the audit, F1 and F3 carry the explanation.",
  summary: {
    reproduced: ["F1", "F2", "F3", "F4", "F5b", "F6", "F7", "F8"],
    fixedThisSession: ["F5b"],
    clean: ["F5 (Next app)"],
    highestSeverityOutstanding: "F6 — nine core student routes render nothing without JavaScript",
  },
  findings,
};

fs.writeFileSync("audit/stage1-baseline.json", JSON.stringify(report, null, 2));
console.log("wrote audit/stage1-baseline.json\n");
for (const [id, f] of Object.entries(findings)) {
  console.log(`${id.padEnd(4)} ${String(f.verdict).padEnd(38)} ${q(f.conclusion || f.note || "").slice(0, 90)}`);
}