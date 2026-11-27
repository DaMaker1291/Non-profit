#!/usr/bin/env node
// ── FROM DECLARED YEAR TO SERVED QUESTION ───────────────────────────────────
//
// A reproducible audit of the whole chain:
//
//   year → qualification → tier → curriculum → diagnostic concept →
//   generated question → difficulty actually served
//
// It runs against the compiled engines only. No learner store is opened and no
// production data is read or written.
//
// The output has two halves:
//
//   · a JSONL trace with the first ten questions of every simulated sitting;
//   · a JSON summary and a Markdown report with the aggregate distributions.
//
// The audit deliberately separates three questions that are easy to conflate:
//
//   1. Is the question in the learner's course?          (membership)
//   2. Does it meet the rung the ladder asked for?       (served demand)
//   3. Does the course itself open at the declared band? (course opening)
//
// A question can be in the course and still be below the rung (a generator
// ceiling); a course can open one rung below its declared maximum (A-level
// 0.75 opens at the 0.6 rung). Both are reported with the reason, never
// smoothed into a single “appropriate” percentage.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const S = require("../.verify/specifications.js");
const D = require("../.verify/diagnostic.js");
const Q = require("../.verify/questions.js");
const B = require("../.verify/question-bank.js");

const OUT_DIR = path.join(process.cwd(), "audit");
const SUMMARY_JSON = path.join(OUT_DIR, "diagnostic-pipeline.json");
const ROWS_JSONL = path.join(OUT_DIR, "diagnostic-pipeline-rows.jsonl");
const REPORT_MD = path.join(OUT_DIR, "diagnostic-pipeline.md");
const JOURNEYS_JSON = path.join(OUT_DIR, "diagnostic-journeys.json");
const JOURNEYS_MD = path.join(OUT_DIR, "diagnostic-journeys.md");

const SUBJECT = "maths";
const SESSIONS_PER_PATTERN = 40;
const QUESTIONS_PER_SESSION = 10;
const RAW_DRAWS = 96;
const PATTERNS = ["correct", "wrong", "alternate"];

/** A profile is the learner's declaration, not a hand-built course. The engine
 *  must resolve it the same way the product does. */
const PROFILES = [
  {
    id: "year5-primary",
    label: "Year 5 · primary mathematics (GB)",
    profile: { country: "GB", grade: "Year 5", subjects: ["maths"] },
    note: "The national route has no Year 5 entry and the qualification registry has no primary specification. The gate must refuse rather than serve GCSE.",
  },
  {
    id: "year5-generic-foundations",
    label: "Year 5 proxy · generic foundations (international)",
    profile: {
      country: "XX", grade: "Foundations", subjects: ["maths"],
      subjectCourses: { maths: { spec: "any-independent", specLevel: "foundations" } },
    },
    note: "A proxy for a low-demand learner, not a primary curriculum: the product has no primary specification. It shows the pipeline at 0.35 demand.",
  },
  {
    id: "year7-lower-secondary",
    label: "Year 7 · lower secondary (GB)",
    profile: {
      country: "GB", grade: "Year 7", subjects: ["maths"],
      subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
    },
    note: "No pre-GCSE specification exists in the registry; the only completable GB course is GCSE Foundation.",
  },
  {
    id: "year9-gcse-preparation",
    label: "Year 9 · GCSE preparation (GB)",
    profile: {
      country: "GB", grade: "Year 9", subjects: ["maths"],
      subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
    },
    note: "No Key Stage 3 specification exists; GCSE Foundation is the only completable GB course.",
  },
  {
    id: "year11-higher",
    label: "Year 11 · GCSE Higher",
    profile: {
      country: "GB", grade: "Year 11", subjects: ["maths"],
      subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher" } },
    },
  },
  {
    id: "year11-foundation",
    label: "Year 11 · GCSE Foundation",
    profile: {
      country: "GB", grade: "Year 11", subjects: ["maths"],
      subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } },
    },
  },
  {
    id: "year11-no-tier",
    label: "Year 11 · GCSE with no tier chosen",
    profile: {
      country: "GB", grade: "Year 11", subjects: ["maths"],
      subjectCourses: { maths: { spec: "uk-gcse" } },
    },
    note: "The exact silent-Foundation case. The course gate must name specLevel and serve nothing.",
  },
  {
    id: "year12-alevel",
    label: "Year 12 · A-level",
    profile: {
      country: "GB", grade: "Year 12", subjects: ["maths"],
      subjectCourses: { maths: { spec: "uk-alevel", specLevel: "as" } },
    },
  },
  {
    id: "international-extended",
    label: "International · Cambridge IGCSE Extended",
    profile: {
      country: "INT", grade: "Year 11", subjects: ["maths"],
      subjectCourses: { maths: { spec: "int-igcse", specLevel: "extended" } },
    },
  },
];

function rank(skill) {
  return B.skillRank(skill);
}

function distribution(conceptId, target) {
  const values = [];
  for (let i = 0; i < RAW_DRAWS; i++) {
    const q = Q.generateQuestion(conceptId, `dist:${i}`);
    if (q) values.push(q.difficulty);
  }
  values.sort((a, b) => a - b);
  const at = (p) => values[Math.min(values.length - 1, Math.floor(p * values.length))];
  const bands = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of values) bands[B.difficultyBandFor(d)] += 1;
  return {
    conceptId,
    samples: values.length,
    min: values[0] ?? null,
    p25: at(0.25) ?? null,
    median: at(0.5) ?? null,
    p75: at(0.75) ?? null,
    max: values[values.length - 1] ?? null,
    rawReachRate: values.length ? values.filter((d) => d + 1e-9 >= target).length / values.length : 0,
    reachRate64: Q.conceptReachRate(conceptId, target),
    depth: Q.conceptDepth(conceptId),
    bands,
  };
}

function blankAggregate() {
  return {
    sessions: 0,
    questions: 0,
    outOfCourse: 0,
    expectedMet: 0,
    expectedBelow: 0,
    courseOpeningBelow: 0,
    declaredMet: 0,
    declaredBelow: 0,
    firstQuestions: 0,
    firstMeetsOpening: 0,
    sessionsWithLimitation: 0,
    bySkill: {},
    byBand: {},
    reasons: {},
  };
}

function addCount(obj, key) {
  obj[key] = (obj[key] ?? 0) + 1;
}

function auditProfile(def, index) {
  const resolution = S.resolveCourse(def.profile, SUBJECT);
  const gate = S.servingCourseFor(def.profile, SUBJECT);
  const years = resolution.effective?.schoolYears ?? [];
  const base = {
    id: def.id,
    label: def.label,
    note: def.note ?? "",
    year: resolution.year,
    subject: SUBJECT,
    course: resolution.spec
      ? { id: resolution.spec.id, name: resolution.spec.name, board: resolution.spec.board }
      : null,
    // A refused course may still have a DISPLAY fallback tier (`resolution`
    // reports one), but the audit must not print it as the learner's tier.
    tier: gate.ok && resolution.effective
      ? { id: resolution.effective.id, name: resolution.effective.name, difficulty: resolution.effective.difficulty }
      : null,
    fallbackTier: resolution.effective
      ? { id: resolution.effective.id, name: resolution.effective.name, difficulty: resolution.effective.difficulty }
      : null,
    source: resolution.source,
    complete: resolution.complete,
    gaps: resolution.gaps,
    yearInCourse: years.length ? years.includes(resolution.year) : null,
    gate: gate.ok
      ? { ok: true, specificationId: gate.active.spec.id, levelId: gate.active.level.id, difficulty: gate.active.level.difficulty }
      : { ok: false, missing: gate.missing },
  };

  if (!gate.ok) {
    return { ...base, sessions: 0, questions: 0, limitation: "course-refused", aggregate: blankAggregate(), concepts: [], distributions: [], rows: [] };
  }

  const active = gate.active;
  const declaredSkill = B.skillForDifficulty(active.level.difficulty);
  const declaredRank = rank(declaredSkill);
  const openingDifficulty = D.LADDER_DIFFICULTIES[D.openingStageFor(active.level.difficulty)];
  const openingSkill = B.skillForDifficulty(openingDifficulty);
  const openingRank = rank(openingSkill);
  const aggregate = blankAggregate();
  const rows = [];
  let limitation = null;

  for (const [patternIndex, pattern] of PATTERNS.entries()) {
    for (let i = 0; i < SESSIONS_PER_PATTERN; i++) {
      const session = D.newDiagnosticSession(SUBJECT, "baseline", active);
      // Deterministic seeds. `startedAt` is the session's salt, and overriding
      // it before the first serve is what makes the trace reproducible.
      session.startedAt = 1_700_000_000_000 + index * 10_000_000 + patternIndex * 1_000_000 + i;
      if (session.limitation) limitation = session.limitation;
      aggregate.sessions += 1;
      if (session.limitation) aggregate.sessionsWithLimitation += 1;

      for (let n = 0; n < QUESTIONS_PER_SESSION; n++) {
        const q = D.nextQuestion(session);
        if (!q) break;
        const concept = session.concepts.find((c) => c.conceptId === q.conceptId);
        const stage = concept?.stage ?? 0;
        const target = D.LADDER_DIFFICULTIES[Math.min(stage, D.LADDER_DIFFICULTIES.length - 1)];
        const depth = Q.conceptDepth(q.conceptId);
        const want = Math.min(target, depth);
        const actualSkill = B.skillForDifficulty(q.difficulty);
        const expectedSkill = B.skillForDifficulty(target);
        const meetsExpected = rank(actualSkill) >= rank(expectedSkill);
        const meetsDeclared = rank(actualSkill) >= declaredRank;
        const belowOpening = rank(actualSkill) < openingRank;
        const courseMembers = session.courseConceptIds ? session.courseConceptIds.includes(q.conceptId) : null;
        const purpose = rank(B.skillForDifficulty(depth)) >= declaredRank ? "course_level" : "prerequisite_check";
        const reason = meetsExpected
          ? (meetsDeclared ? "meets" : "course_opening_rung")
          : (q.difficulty + 1e-9 < want ? "generator_ceiling" : "serve_below_target");

        aggregate.questions += 1;
        if (courseMembers === false) aggregate.outOfCourse += 1;
        if (meetsExpected) aggregate.expectedMet += 1; else aggregate.expectedBelow += 1;
        if (meetsDeclared) aggregate.declaredMet += 1; else aggregate.declaredBelow += 1;
        if (belowOpening) aggregate.courseOpeningBelow += 1;
        if (n === 0) {
          aggregate.firstQuestions += 1;
          if (!belowOpening) aggregate.firstMeetsOpening += 1;
        }
        addCount(aggregate.bySkill, actualSkill);
        addCount(aggregate.byBand, String(B.difficultyBandFor(q.difficulty)));
        addCount(aggregate.reasons, reason);

        rows.push({
          profile: def.id,
          session: `${pattern}:${i}`,
          n: n + 1,
          specification: active.spec.id,
          tier: active.level.id,
          year: resolution.year,
          subject: SUBJECT,
          concept: q.conceptId,
          prompt: q.prompt,
          difficulty: Number(q.difficulty.toFixed(4)),
          band: B.difficultyBandFor(q.difficulty),
          expectedDifficulty: target,
          expectedSkill,
          declaredSkill,
          actualSkill,
          meetsExpected,
          meetsDeclared,
          belowCourseOpening: belowOpening,
          courseMember: courseMembers,
          purpose,
          stage,
          openedAt: concept?.openedAt ?? null,
          selection: session.kind === "probe"
            ? "probe_spread"
            : concept?.asked === 0
              ? "blueprint_course_open"
              : "blueprint_climb",
          reason,
          answerPattern: pattern,
        });

        const correct = pattern === "correct" || (pattern === "alternate" && n % 2 === 0);
        const choice = correct ? q.answer : (q.answer + 1) % q.choices.length;
        D.gradeAnswer(session, q.conceptId, q, choice);
      }
    }
  }

  const conceptIds = [...new Set(rows.map((r) => r.concept))];
  return {
    ...base,
    sessions: aggregate.sessions,
    questions: aggregate.questions,
    declaredSkill,
    openingSkill,
    openingDifficulty,
    limitation: limitation ?? "none",
    aggregate,
    concepts: conceptIds,
    distributions: conceptIds.map((id) => distribution(id, active.level.difficulty)),
    rows,
  };
}

const results = PROFILES.map(auditProfile);
const rows = results.flatMap((r) => r.rows);
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(ROWS_JSONL, rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""));

const supported = results.filter((r) => r.gate.ok);
const refused = results.filter((r) => !r.gate.ok);
const totals = {
  profiles: results.length,
  profilesServed: supported.length,
  profilesRefused: refused.length,
  sessions: supported.reduce((n, r) => n + r.sessions, 0),
  questions: supported.reduce((n, r) => n + r.questions, 0),
  outOfCourse: supported.reduce((n, r) => n + r.aggregate.outOfCourse, 0),
  expectedBelow: supported.reduce((n, r) => n + r.aggregate.expectedBelow, 0),
  courseOpeningBelow: supported.reduce((n, r) => n + r.aggregate.courseOpeningBelow, 0),
  declaredBelow: supported.reduce((n, r) => n + r.aggregate.declaredBelow, 0),
  sessionsWithLimitation: supported.reduce((n, r) => n + r.aggregate.sessionsWithLimitation, 0),
};

const summary = {
  generatedAt: new Date().toISOString(),
  subject: SUBJECT,
  method: {
    sessionsPerPattern: SESSIONS_PER_PATTERN,
    patterns: PATTERNS,
    questionsPerSession: QUESTIONS_PER_SESSION,
    rawDrawsPerConcept: RAW_DRAWS,
    note: "Deterministic engine-only audit. No learner store is opened. `startedAt` is overridden before the first serve so every trace is reproducible.",
  },
  totals,
  profiles: results.map(({ rows: _rows, distributions, ...rest }) => ({
    ...rest,
    distributions,
  })),
};

fs.writeFileSync(SUMMARY_JSON, JSON.stringify(summary, null, 2));

const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const md = [];
md.push("# Diagnostic pipeline audit");
md.push("");
md.push(`Generated: ${summary.generatedAt}`);
md.push("");
md.push("This is an engine-only, reproducible audit. It opens no learner store and changes no production data.");
md.push("");
md.push("## Verdict");
md.push("");
md.push(`- Profiles measured: **${totals.profiles}** — served **${totals.profilesServed}**, refused **${totals.profilesRefused}**.`);
md.push(`- Simulated baseline sittings: **${totals.sessions.toLocaleString()}**; questions traced: **${totals.questions.toLocaleString()}**.`);
md.push(`- Questions outside the learner's resolved course: **${totals.outOfCourse}**.`);
md.push(`- Questions below the rung the ladder asked for: **${totals.expectedBelow}** (${pct(totals.expectedBelow, totals.questions)}%).`);
md.push(`- Questions below the course's OPENING demand: **${totals.courseOpeningBelow}** (${pct(totals.courseOpeningBelow, totals.questions)}%).`);
md.push(`- Questions below the course's declared maximum demand: **${totals.declaredBelow}** (${pct(totals.declaredBelow, totals.questions)}%).`);
md.push("");
md.push("A question below the declared maximum is not automatically a defect: the ladder opens at the deepest rung at or below the course's declaration. The reason column records which case applies.");
md.push("");
md.push("## Profiles");
md.push("");
md.push("| Profile | Course | Tier | Year in course | Gate | Sessions | Questions | First question meets opening | Below declared | Limitation |");
md.push("|---|---|---|---|---|---:|---:|---:|---:|---|");
for (const r of results) {
  const course = r.course ? `${r.course.name} (${r.course.id})` : "—";
  const tier = r.tier
    ? `${r.tier.name} · ${r.tier.difficulty}`
    : r.fallbackTier
      ? `— (display fallback ${r.fallbackTier.name} · ${r.fallbackTier.difficulty})`
      : "—";
  const gate = r.gate.ok ? "served" : `refused: ${r.gate.missing.join(", ")}`;
  const first = r.gate.ok ? `${r.aggregate.firstMeetsOpening}/${r.aggregate.firstQuestions} (${pct(r.aggregate.firstMeetsOpening, r.aggregate.firstQuestions)}%)` : "—";
  const below = r.gate.ok ? `${r.aggregate.declaredBelow}` : "—";
  const inYear = r.yearInCourse === null ? "—" : r.yearInCourse ? "yes" : "**no**";
  const limitation = r.limitation === "none" ? "" : (r.limitation === "course-refused" ? "no course" : `${r.limitation.available}/${r.limitation.required} eligible concepts`);
  md.push(`| ${r.label} | ${course} | ${tier} | ${inYear} | ${gate} | ${r.sessions || "—"} | ${r.questions || "—"} | ${first} | ${below} | ${limitation} |`);
}
md.push("");
md.push("## Refusals and coverage limitations");
md.push("");
for (const r of refused) {
  md.push(`- **${r.label}** — ${r.gate.missing.join(", ")}. ${r.note}`);
}
if (supported.some((r) => r.limitation !== "none")) {
  for (const r of supported.filter((r) => r.limitation !== "none")) {
    md.push(`- **${r.label}** — ${r.limitation.available} eligible concepts for a required ${r.limitation.required}. ${r.limitation.reason}`);
  }
}
if (!refused.length && !supported.some((r) => r.limitation !== "none")) md.push("- None.");
md.push("");
md.push("## Served-demand detail");
md.push("");
for (const r of supported) {
  md.push(`### ${r.label}`);
  md.push("");
  md.push(`- Course: **${r.course.name}** · tier **${r.tier.name}** · declared demand **${r.declaredSkill}** · opening rung **${r.openingDifficulty.toFixed(2)} ${r.openingSkill}**.`);
  if (r.yearInCourse === false) md.push(`- **${r.year} is outside this qualification's declared years** (${r.course.name} declares ${r.tier.name}). No pre-GCSE/primary course exists for this route, so the audit records the mismatch rather than pretending the year selected a different curriculum.`);
  md.push(`- Sampling: ${r.aggregate.sessions} sittings × ${QUESTIONS_PER_SESSION} questions, across ${PATTERNS.join(" / ")} answer patterns.`);
  md.push(`- Served demand met: **${r.aggregate.expectedMet}/${r.aggregate.questions}** (${pct(r.aggregate.expectedMet, r.aggregate.questions)}%). Below the rung: **${r.aggregate.expectedBelow}**.`);
  md.push(`- Below the course's opening demand: **${r.aggregate.courseOpeningBelow}**. Below the declared maximum: **${r.aggregate.declaredBelow}**.`);
  md.push(`- Reasons: ${Object.entries(r.aggregate.reasons).map(([k, v]) => `${k.replaceAll("_", " ")} ${v}`).join(" · ")}.`);
  md.push("");
  md.push("| Concept | Samples | Min | Median | Max | Raw reach at declared | Cache rate | Bands |");
  md.push("|---|---:|---:|---:|---:|---:|---:|---|");
  for (const d of r.distributions) {
    md.push(`| ${d.conceptId} | ${d.samples} | ${d.min?.toFixed(2) ?? "—"} | ${d.median?.toFixed(2) ?? "—"} | ${d.max?.toFixed(2) ?? "—"} | ${(d.rawReachRate * 100).toFixed(1)}% | ${(d.reachRate64 * 100).toFixed(1)}% | ${Object.entries(d.bands).map(([b, n]) => `${b}:${n}`).join(" ")} |`);
  }
  md.push("");
}
// ── THE THREE YEAR-11 JOURNEYS, ONE PAGE EACH ────────────────────────────────
// The aggregate above answers "does the pipeline hold?". This answers the
// learner-facing question the report was written for: what does a Year 11
// Higher / Foundation / undecided-tier learner actually meet first? The trace is
// the same deterministic engine the browser calls, so the prompts and
// difficulties are reproducible; the screenshots beside it are the real page.
const JOURNEY_IDS = ["year11-higher", "year11-foundation", "year11-no-tier"];
const journeyResults = JOURNEY_IDS.map((id) => results.find((r) => r.id === id)).filter(Boolean);
const journeyJson = {
  generatedAt: summary.generatedAt,
  method: summary.method,
  journeys: journeyResults.map((r) => ({
    id: r.id,
    label: r.label,
    declaredProfile: PROFILES.find((p) => p.id === r.id)?.profile ?? null,
    course: r.course,
    tier: r.tier,
    year: r.year,
    gate: r.gate,
    firstTen: r.rows.filter((row) => row.session === "correct:0"),
    screenshots: r.id === "year11-higher"
      ? ["audit/screenshots/journey-a-year11-higher-q1.png"]
      : r.id === "year11-foundation"
        ? ["audit/screenshots/journey-b-year11-foundation-q1.png"]
        : ["audit/screenshots/journey-c-year11-no-tier-refused.png", "audit/screenshots/journey-c-year11-no-tier-refused-detail.png"],
  })),
};
fs.writeFileSync(JOURNEYS_JSON, JSON.stringify(journeyJson, null, 2));

const jmd = [];
jmd.push("# Year 11 diagnostic journeys");
jmd.push("");
jmd.push(`Generated: ${summary.generatedAt}`);
jmd.push("");
jmd.push("Engine-only and deterministic: each sitting uses the same seed and the same course resolution as the running app. No learner store is opened.");
jmd.push("");
for (const r of journeyResults) {
  const declaredCourse = PROFILES.find((p) => p.id === r.id)?.profile?.subjectCourses?.maths;
  jmd.push(`## ${r.label}`);
  jmd.push("");
  jmd.push(`- Declared course: \`${JSON.stringify(declaredCourse)}\``);
  jmd.push(`- Resolved course: ${r.course ? `**${r.course.name}** (\`${r.course.id}\`)` : "—"}${r.tier ? ` · tier **${r.tier.name}** (\`${r.tier.id}\`) at demand **${r.tier.difficulty}**` : ""}`);
  jmd.push(`- Year: **${r.year}**${r.yearInCourse === false ? " — outside this qualification's declared years" : ""}`);
  if (r.gate.ok) jmd.push(`- Gate: served (${r.gate.specificationId} / ${r.gate.levelId})`);
  else jmd.push(`- Gate: **REFUSED** — missing ${r.gate.missing.join(", ")}. No question is served.`);
  jmd.push("");
  if (!r.gate.ok) {
    jmd.push("The learner-facing page redirects to `/curriculum?return=/diagnostic/maths`, keeps **GCSE** visible, asks for the tier, disables Save, and states `Still to choose: Level`. It never falls back to Foundation.");
    jmd.push("");
    continue;
  }
  jmd.push("| # | Concept | Prompt | Difficulty | Band | Expected | Actual skill | Selection | Reason | In course | Purpose |");
  jmd.push("|---:|---|---|---:|---:|---:|---|---|---|---|---|");
  for (const row of r.rows.filter((x) => x.session === "correct:0")) {
    jmd.push(`| ${row.n} | ${row.concept} | ${row.prompt.replaceAll("|", "\\|")} | ${row.difficulty.toFixed(2)} | ${row.band} | ${row.expectedDifficulty.toFixed(2)} | ${row.actualSkill} | ${row.selection} | ${row.reason} | ${row.courseMember ? "yes" : "**no**"} | ${row.purpose} |`);
  }
  jmd.push("");
}
jmd.push("## Screenshots");
jmd.push("");
jmd.push("- Journey A (Year 11 Higher): `audit/screenshots/journey-a-year11-higher-q1.png`");
jmd.push("- Journey B (Year 11 Foundation): `audit/screenshots/journey-b-year11-foundation-q1.png`");
jmd.push("- Journey C (Year 11, no tier): `audit/screenshots/journey-c-year11-no-tier-refused.png` and `...-detail.png`");
jmd.push("");
jmd.push("## Reproduce");
jmd.push("");
jmd.push("```bash");
jmd.push("npm run audit:diagnostic");
jmd.push("```");
fs.writeFileSync(JOURNEYS_MD, jmd.join("\n") + "\n");

md.push("## Reproduce");
md.push("");
md.push("```bash");
md.push("npm run audit:diagnostic");
md.push("```");
md.push("");
md.push(`The full ten-question trace is in \`audit/diagnostic-pipeline-rows.jsonl\` (${rows.length.toLocaleString()} rows).`);
fs.writeFileSync(REPORT_MD, md.join("\n") + "\n");

console.log("▸ Diagnostic pipeline audit");
console.log(`  profiles: ${totals.profiles} (${totals.profilesServed} served, ${totals.profilesRefused} refused)`);
console.log(`  sittings: ${totals.sessions.toLocaleString()} · questions: ${totals.questions.toLocaleString()}`);
console.log(`  out of course: ${totals.outOfCourse} · below opening demand: ${totals.courseOpeningBelow} · below rung: ${totals.expectedBelow} · below declared: ${totals.declaredBelow}`);
for (const r of results) {
  if (!r.gate.ok) console.log(`  REFUSED ${r.id}: ${r.gate.missing.join(", ")}`);
  else if (r.limitation !== "none") console.log(`  LIMITED ${r.id}: ${r.limitation.available}/${r.limitation.required} eligible concepts`);
}
console.log(`  wrote ${path.relative(process.cwd(), REPORT_MD)}`);
console.log(`  wrote ${path.relative(process.cwd(), SUMMARY_JSON)}`);
console.log(`  wrote ${path.relative(process.cwd(), ROWS_JSONL)}`);
console.log(`  wrote ${path.relative(process.cwd(), JOURNEYS_MD)}`);
console.log(`  wrote ${path.relative(process.cwd(), JOURNEYS_JSON)}`);

const noTier = results.find((r) => r.id === "year11-no-tier");
const failures = [];
if (!noTier || noTier.gate.ok) failures.push("year11-no-tier was served instead of refused");
if (totals.outOfCourse > 0) failures.push(`${totals.outOfCourse} questions left the resolved course`);
for (const id of ["year11-higher", "year11-foundation", "year12-alevel", "international-extended", "year5-generic-foundations"]) {
  const r = results.find((x) => x.id === id);
  if (!r) { failures.push(`${id} is missing from the audit`); continue; }
  if (!r.gate.ok) { failures.push(`${id} was refused: ${r.gate.missing.join(", ")}`); continue; }
  if (r.questions === 0) failures.push(`${id} served no questions`);
  if (r.aggregate.courseOpeningBelow > 0) failures.push(`${id} served ${r.aggregate.courseOpeningBelow} questions below its course opening`);
  if (r.aggregate.outOfCourse > 0) failures.push(`${id} served ${r.aggregate.outOfCourse} out-of-course questions`);
}
if (failures.length) {
  console.error("  ✗ FAIL:");
  for (const f of failures) console.error(`    - ${f}`);
  process.exitCode = 1;
} else {
  console.log("  ✓ course membership and opening demand hold across every supported profile");
}
