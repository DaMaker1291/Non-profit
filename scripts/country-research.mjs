#!/usr/bin/env node
// ── COUNTRY RESEARCH, KEPT HONEST ──────────────────────────────────────────
//
// The curriculum registry records a country's school structure: years,
// qualifications, boards and specification ids. That is NOT country research.
// This script keeps the two apart.
//
//   * every national route gets a profile file, so no route can silently
//     disappear from the research queue;
//   * a route with no collected evidence says NOT_RESEARCHED in its own file,
//     in the index and in the machine-readable state;
//   * existing profiles are never overwritten by this generator. Hand-written
//     evidence survives regeneration;
//   * `--check` fails if a route has no profile, a profile is missing a required
//     section, or a status is outside the agreed ladder.
//
// The generator writes only registry facts into a stub. A ministry homepage is
// labelled as a structural source, never as subject-level curriculum evidence.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const registry = require("../.verify/curricula/registry.js");
const worlds = require("../.verify/world-countries.js");

const OUT = path.join(process.cwd(), "docs", "country-research");
const STATE = path.join(OUT, "COUNTRY_RESEARCH_STATE.json");
const INDEX = path.join(OUT, "COUNTRY_RESEARCH_INDEX.md");
const CHECK = process.argv.includes("--check");

export const STATUSES = [
  "NOT_RESEARCHED",
  "INITIAL_RESEARCH",
  "SOURCES_COLLECTED",
  "STRUCTURAL_REVIEWED",
  "CURRICULUM_MAPPED",
  "SUBJECT_EXPERT_REVIEW_REQUIRED",
  "HUMAN_REVIEWED",
  "IMPLEMENTED",
  "BROWSER_VERIFIED",
  "SCHOOL_VALIDATED",
];

export const SECTIONS = [
  "National school structure",
  "Curriculum",
  "Examinations",
  "Learning outcomes",
  "Foundational skills",
  "Teacher conditions",
  "Classroom conditions",
  "Textbook availability",
  "Language policy",
  "Common teaching languages",
  "Technology access",
  "Electricity",
  "Internet",
  "Devices",
  "Gender and inclusion",
  "Rural and urban differences",
  "Offline requirements",
  "Cost constraints",
  "Relevant educational interventions",
  "OpenMind product implications",
  "Unverified questions",
  "Source bibliography",
];

// Income groups are recorded only where the profile has checked the current
// World Bank classification. "unknown" is deliberate: a country's income group
// must not be inferred from the region or from the route's existence.
const META = {
  BD: { income: "lower-middle", status: "INITIAL_RESEARCH" },
  MW: { income: "low", status: "INITIAL_RESEARCH" },
  NG: { income: "lower-middle", status: "INITIAL_RESEARCH" },
  IN: { income: "lower-middle", status: "INITIAL_RESEARCH" },
  KE: { income: "lower-middle", status: "INITIAL_RESEARCH" },
  NP: { income: "lower-middle", status: "INITIAL_RESEARCH" },
  TZ: { income: "low", status: "INITIAL_RESEARCH" },
  GH: { income: "lower-middle", status: "INITIAL_RESEARCH" },
  ZM: { income: "lower-middle", status: "INITIAL_RESEARCH" },
  RW: { income: "low", status: "INITIAL_RESEARCH" },
  PK: { income: "lower-middle", status: "INITIAL_RESEARCH" },
  PH: { income: "lower-middle", status: "INITIAL_RESEARCH" },
  ID: { income: "upper-middle", status: "INITIAL_RESEARCH" },
};

const NAME = new Map(worlds.WORLD_COUNTRIES.map((c) => [c.code, c.name]));
const codes = registry.nationalRouteCodes().sort();
const routes = new Map(
  codes.map((code) => {
    const pathways = registry.nationalPathwaysFor(code);
    return [code, {
      code,
      name: NAME.get(code) ?? code,
      pathways: pathways.map((p) => ({
        id: p.id,
        name: p.name,
        years: p.schoolYears.map((y) => y.label),
        qualifications: p.qualifications.map((q) => q.name),
        qualificationStages: p.qualifications.map((q) => q.stage),
        boards: p.boards.map((b) => b.name),
        specs: p.specificationIds,
        sources: p.sourceUrls,
        recordReview: p.recordReview,
        mappingReview: p.mappingReview,
      })),
    }];
  }),
);

function frontmatter(file) {
  const text = fs.readFileSync(file, "utf8");
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) return { text, fields: {} };
  const fields = {};
  for (const line of match[1].split("\n")) {
    const at = line.indexOf(":");
    if (at < 1) continue;
    fields[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return { text, fields };
}

function stub(route) {
  const p = route.pathways[0];
  const years = p.years.join(", ");
  const quals = p.qualifications.length ? p.qualifications.join("; ") : "No qualification recorded";
  const boards = p.boards.length ? p.boards.join("; ") : "No board recorded";
  const specs = p.specs.join(", ");
  const sources = [...new Set(route.pathways.flatMap((x) => x.sources))];
  return `---
code: ${route.code}
name: ${route.name}
status: NOT_RESEARCHED
income_group: unknown
routes: ${route.pathways.length}
specs: ${p.specs.join(", ")}
updated: 2026-11-13
---

# ${route.name} (${route.code})

> **Research status: \`NOT_RESEARCHED\`.** This file is a registry-derived
> placeholder, not a country education profile. It records only the school
> structure already held in \`lib/curricula/registry.ts\`. No curriculum,
> classroom, language, learning-outcome or cost claim has been collected for
> this route. The route's existence is not evidence that OpenMind is aligned to
> the country's curriculum.

## 1. National school structure

Registry record: **${p.name}**.

- School years: ${years}
- Qualification(s): ${quals}
- Awarding body/bodies: ${boards}
- OpenMind specification(s): ${specs}
- Registry structural review: \`${p.recordReview}\`
- Registry concept-mapping review: \`${p.mappingReview}\`

The year list is the registry's structural record. It does not establish the
actual age range, phase boundaries, vocational routes, non-formal routes or
regional systems in this country.

## 2. Curriculum

Not yet collected. A ministry homepage is not a subject syllabus.

## 3. Examinations

Registry record only: ${quals}. Examination format, papers, tiers and practical
requirements have not been reviewed.

## 4. Learning outcomes

Not yet collected. No national, regional or household assessment figure is
recorded here.

## 5. Foundational skills

Not yet collected. No claim is made about reading, numeracy or the share of
learners working below their nominal grade.

## 6. Teacher conditions

Not yet collected. No claim is made about qualifications, training, workload,
absenteeism or deployment.

## 7. Classroom conditions

Not yet collected. No claim is made about class size, multigrade teaching,
double shifts or mixed-ability grouping.

## 8. Textbook availability

Not yet collected. No pupil-textbook ratio is recorded.

## 9. Language policy

Not yet collected. The registry does not record the language of instruction.

## 10. Common teaching languages

Not yet collected. A country's official language is not evidence of the
language a particular classroom uses.

## 11. Technology access

Not yet collected. No school-level device, computer-room or connectivity claim
is made.

## 12. Electricity

Not yet collected. No school electricity figure is recorded.

## 13. Internet

Not yet collected. Household connectivity is not school connectivity.

## 14. Devices

Not yet collected. No claim is made about personal device ownership or shared
devices.

## 15. Gender and inclusion

Not yet collected. No claim is made about gender gaps, disability, language
minorities, displacement or rural disadvantage.

## 16. Rural and urban differences

Not yet collected. No national average is treated as a description of every
school.

## 17. Offline requirements

Not yet researched. The product already has printable worksheets, separate
teacher keys and an offline assessment pack, but this route's actual offline
constraints have not been established.

## 18. Cost constraints

Not yet collected. No claim is made about household costs, printing costs, data
costs or hidden costs of using OpenMind.

## 19. Relevant educational interventions

Not yet reviewed for this country. No trial result is transferred from another
country as if it applied here.

## 20. OpenMind product implications

No country-specific product implication is claimed. The only safe instruction
is to keep the generic no-device, shared-device, print and offline paths
available while this route remains unresearched.

## 21. Unverified questions

- What is the current official curriculum and which subject syllabi are in use?
- Which examinations and boards actually govern this route?
- What language(s) do pupils and teachers use in the classroom?
- What are typical class sizes, textbook ratios and school resources?
- Which regional, rural, gender, disability and language differences matter?
- What would make the existing lessons unusable or unsafe in this context?

## 22. Source bibliography

${sources.length ? sources.map((s) => `- Registry structural source (not subject-level evidence): ${s}`).join("\n") : "- No country-specific source has been collected. The only record is the OpenMind curriculum registry."}

- OpenMind registry: \`lib/curricula/registry.ts\`; specifications: \`lib/specifications.ts\`.
`;
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

for (const route of routes.values()) {
  const file = path.join(OUT, `${route.code}.md`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, stub(route));
}

const countries = [];
const problems = [];
for (const route of routes.values()) {
  const file = path.join(OUT, `${route.code}.md`);
  if (!fs.existsSync(file)) {
    problems.push(`${route.code}: no profile file`);
    continue;
  }
  const { text, fields } = frontmatter(file);
  const status = fields.status ?? "";
  if (!STATUSES.includes(status)) problems.push(`${route.code}: invalid status ${JSON.stringify(status)}`);
  for (let i = 0; i < SECTIONS.length; i++) {
    const heading = `## ${i + 1}. ${SECTIONS[i]}`;
    if (!text.includes(heading)) problems.push(`${route.code}: missing ${heading}`);
  }
  const sourceUrls = [...new Set([...text.matchAll(/https?:\/\/[^\s)\]}]+/g)].map((m) => m[0].replace(/[.,;]+$/, "")))];
  countries.push({
    code: route.code,
    name: route.name,
    status,
    incomeGroup: fields.income_group ?? "unknown",
    profile: `${route.code}.md`,
    routeCount: route.pathways.length,
    years: [...new Set(route.pathways.flatMap((p) => p.years))],
    qualifications: [...new Set(route.pathways.flatMap((p) => p.qualifications))],
    specs: [...new Set(route.pathways.flatMap((p) => p.specs))],
    registryRecordReview: [...new Set(route.pathways.map((p) => p.recordReview))],
    registryMappingReview: [...new Set(route.pathways.map((p) => p.mappingReview))],
    sourceUrls,
    updated: fields.updated ?? "unknown",
  });
}

if (CHECK) {
  if (countries.length !== codes.length) problems.push(`expected ${codes.length} profiles, found ${countries.length}`);
  if (problems.length) {
    console.error("country research check failed:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`country research: ${countries.length} national routes, ${countries.filter((c) => c.status !== "NOT_RESEARCHED").length} with collected research, 0 missing sections`);
  process.exit(0);
}

const counts = Object.fromEntries(STATUSES.map((s) => [s, countries.filter((c) => c.status === s).length]));
const state = {
  version: 1,
  generatedAt: "2026-11-13",
  registry: {
    nationalRoutes: codes.length,
    specifications: require("../.verify/specifications.js").SPECIFICATIONS.length,
    worldCountriesAndTerritories: worlds.WORLD_COUNTRIES.length,
  },
  reviewLadder: STATUSES,
  worldBankIncomeReference: {
    fiscalYear: 2027,
    gniYear: 2025,
    source: "https://datahelpdesk.worldbank.org/knowledgebase/articles/906519-world-bank-country-and-lending-groups",
    note: "Income group is one research dimension, never a description of an individual child or school. Unchecked routes are 'unknown', not guessed.",
  },
  counts,
  countries,
};
fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");

const rows = countries.map((c) =>
  `| ${c.code} | ${c.name} | ${c.incomeGroup} | ${c.routeCount} | ${c.specs.join(", ")} | \`${c.status}\` | [${c.profile}](${c.profile}) |`,
).join("\n");
const index = `# Country research index

> Generated from \`scripts/country-research.mjs\`. **A route is not a reviewed
> curriculum.** ${codes.length} national routes are listed; ${counts.NOT_RESEARCHED} remain
> \`NOT_RESEARCHED\` and contain only the registry's structural record.

The review ladder is deliberately separate from the curriculum registry's
\`mapped / researched / reviewed / verified\` vocabulary. A country can be
\`INITIAL_RESEARCH\` here while its OpenMind concept mapping remains \`mapped\`.

## Synthetic school scenarios

[SCHOOL_ARCHETYPES.md](SCHOOL_ARCHETYPES.md) documents the seven school
archetypes and eight evidence-derived delivery scenarios. They are
SYNTHETIC_ONLY, not representative schools or validation. The machine-readable
source is [SCHOOL_SCENARIOS.json](SCHOOL_SCENARIOS.json);
npm run verify:school-reality checks every scenario against every authored
lesson.

## Status counts

| Status | Routes |
|---|---:|
${STATUSES.map((s) => `| \`${s}\` | ${counts[s]} |`).join("\n")}

## Routes

| Code | Country | Income group | Routes | Specifications | Research status | Profile |
|---|---|---|---:|---|---|---|
${rows}

## What this index does not say

- It does not say that every school in a country has the same conditions.
- It does not say that a ministry homepage is a curriculum mapping.
- It does not convert a national learning-poverty estimate into a claim about
  one child, one district or one school.
- It does not treat a country's income group as a child's household income.

See \`COUNTRY_COMPARISON.md\`, \`COUNTRY_PRODUCT_REQUIREMENTS.md\` and
\`PILOT_COUNTRY_RECOMMENDATION.md\` for the cross-country synthesis.
`;
fs.writeFileSync(INDEX, index);
console.log(`country research: wrote ${countries.length} profiles, ${counts.NOT_RESEARCHED} not researched, ${countries.length - counts.NOT_RESEARCHED} with collected research`);
if (problems.length) {
  console.error("country research has section problems:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
