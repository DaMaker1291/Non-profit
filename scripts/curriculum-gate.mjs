// ─────────────────────────────────────────────────────────────────────────────
// THE CURRICULUM-INTEGRITY GATE, and the coverage report (§1, §7, §17).
//
// WHY THIS EXISTS. A country used to BE the curriculum: one route per country
// code, one list of qualifications per country code. That is a data model with
// exactly one way to be wrong, and the product was wrong in it — of the 70
// countries the enrolment picker offers, 18 had a national route and the other
// 52 were answered with Cambridge IGCSE and the IB, silently, as if those were
// the local qualifications. The registry (lib/curricula/registry.ts) makes a
// country a set of PATHWAYS, so Cameroon's Anglophone and Francophone systems
// can both be described and neither has to stand in for the other.
//
// With the data model fixed, the risk moves: it is now possible to add a country
// whose pathway has no source, whose qualification is a specification nobody can
// be enrolled in, whose year list has a hole, or whose "national" route quietly
// resolves to somebody else's curriculum. Each of those is a check below, and
// each is a failure rather than a warning. The report is printed and written on
// every run — including a failing one — because the point of the audit is to
// show what remains, not only to say whether today built.
//
// THE ONE RULE THE DATA MUST NEVER BREAK: **a learner is never handed a
// curriculum their country is not recorded as running.** International
// programmes stay available to everyone — chosen. They are never the answer to
// "what does this country's school system look like?".
//
// Run:  npm run curriculum-gate
// Writes: audit/curriculum-coverage.json   (deterministic: no timestamps, so the
//         committed report only changes when the data does)
// ─────────────────────────────────────────────────────────────────────────────
import { compileEngines } from "./compile-engines.mjs";
import { createRequire } from "node:module";
import fs from "node:fs";

compileEngines();
const require = createRequire(import.meta.url);
const R = require("../.verify/curricula/registry.js");
const C = require("../.verify/curriculum.js");
const S = require("../.verify/specifications.js");
const G = require("../.verify/genome.js");
const { COUNTRIES } = require("../.verify/i18n.js");

const REPORT_PATH = "audit/curriculum-coverage.json";
const SUBJECTS = ["maths", "physics", "chemistry", "biology", "computing"];
const problems = [];
const fail = (msg) => problems.push(msg);
const ok = (cond, msg) => { if (!cond) fail(msg); };

const NON_NATIONAL_SPECS = new Set(["int-igcse", "int-ib", "any-independent"]);
const isNationalSpec = (id) => !NON_NATIONAL_SPECS.has(id);

// ── 1. Every offered country is accounted for ───────────────────────────────
// "We have not researched this" and "somebody forgot it" are different answers,
// and the report has to be able to tell them apart: one is a queue, the other is
// a bug. A country in neither list is the bug.
const knownCodes = new Set([...R.RESEARCHED_CODES, ...R.UNRESEARCHED_CODES, "INT"]);
const unlisted = COUNTRIES.map((c) => c.code).filter((code) => !knownCodes.has(code));
ok(unlisted.length === 0, `offered but unclassified: ${unlisted.join(", ")}`);

// ── 2. Every pathway is well formed ─────────────────────────────────────────
const pathwayIds = new Set();
for (const pw of R.allPathways()) {
  const where = `pathway ${pw.id}`;
  if (pathwayIds.has(pw.id)) fail(`${where}: duplicate id`);
  pathwayIds.add(pw.id);
  if (!pw.id.startsWith(pw.pathwayType === "national" ? pw.countryCode.toLowerCase() + "-" : "int-")) {
    // Not a hard rule about naming — a signal that a national pathway is
    // probably mistyped, because a national id is derived from its country.
    fail(`${where}: a ${pw.pathwayType} pathway whose id does not name it as one`);
  }
  if (pw.schoolYears.length === 0) fail(`${where}: offers no school years`);
  pw.schoolYears.forEach((y, i) => {
    if (y.sequence !== i + 1) fail(`${where}: ${y.label} carries sequence ${y.sequence} at position ${i}`);
  });
  const labels = pw.schoolYears.map((y) => y.label);
  if (new Set(labels).size !== labels.length) fail(`${where}: a school year is listed twice`);
  // The system's own sequence, checked per pathway so a hole in one system
  // cannot hide inside the other's numbers.
  const byPhase = new Map();
  for (const y of pw.schoolYears) {
    const n = Number((y.label.match(/\d+/) ?? [])[0]);
    if (!Number.isFinite(n)) continue;
    const phase = y.label.replace(/\d+/g, "").replace(/[º°]|st|nd|rd|th/gi, " ").replace(/\s+/g, " ").trim().toLowerCase();
    if (!byPhase.has(phase)) byPhase.set(phase, []);
    byPhase.get(phase).push(n);
  }
  for (const [phase, nums] of byPhase) {
    const sorted = [...nums].sort((a, b) => a - b);
    if (sorted[sorted.length - 1] - sorted[0] + 1 !== sorted.length) {
      fail(`${where}: the “${phase}” years skip one (${nums.join(", ")})`);
    }
  }

  if (pw.pathwayType === "national") {
    if (pw.boards.length === 0) fail(`${where}: a national system with no awarding body`);
    // THE RICHER RECORD IS DEMANDED OF A RESEARCHED PATHWAY. A route inherited
    // from the table this registry replaces carries its qualifications as
    // specification ids, because the learner-facing NAME of a qualification
    // lives on the specification itself — one owner, not two. A pathway that
    // claims to have been researched has been read, so it must name its own
    // examinations and say when they are sat; that is exactly the difference
    // between structuring a system from its ministry's pages and inheriting a
    // list from production.
    if (R.reviewAtLeast(pw.recordReview, "researched")) {
      if (pw.qualifications.length === 0) fail(`${where}: a researched national system that names no examination`);
      for (const q of pw.qualifications) {
        if (!q.name || !q.stage) fail(`${where}: qualification ${q.id} is missing its own name or stage`);
      }
    }
    for (const q of pw.qualifications) {
      if (q.specIds.length === 0) fail(`${where}: qualification ${q.id} leads to no specification`);
      for (const id of q.specIds) if (!pw.specificationIds.includes(id)) fail(`${where}: ${q.id} names ${id}, which the pathway does not lead to`);
    }
  }

  if (pw.specificationIds.length === 0) fail(`${where}: leads to no qualification at all`);
  for (const id of pw.specificationIds) {
    const spec = S.specById(id);
    if (!spec) fail(`${where}: unknown specification ${id}`);
    else if (pw.pathwayType === "national" && spec.country !== pw.countryCode) {
      fail(`${where}: a national pathway leading to ${id}, which belongs to ${spec.country}`);
    }
  }

  // Provenance, and the ladder that keeps a label honest. A pathway that claims
  // to have been researched must say what it was researched FROM, and nothing
  // reaches "verified" without a reviewed mapping — "verified" is a claim about
  // a human having read it.
  if (R.reviewAtLeast(pw.recordReview, "researched") && pw.sourceUrls.length === 0) {
    fail(`${where}: claims recordReview "${pw.recordReview}" with no source`);
  }
  if (pw.sourceUrls.some((u) => !/^https:\/\//.test(u))) fail(`${where}: a source that is not an https reference`);
  if (pw.recordReview === "verified" && !R.reviewAtLeast(pw.mappingReview, "reviewed")) {
    fail(`${where}: "verified" with a mapping nobody has reviewed`);
  }
  if (pw.mappingReview === "reviewed" || pw.mappingReview === "verified") {
    // The gate's own claim about the state of the world: no mapping in this
    // repository has been reviewed by a subject specialist yet. When one is, the
    // registry records the reviewer and the date and this assertion goes.
    fail(`${where}: the mapping claims "${pw.mappingReview}", but no review is recorded (audit/item-reviews.json)`);
  }
}

// ── 3. No specification is unreachable, and none names a concept that is not
// there. A course nobody can be enrolled in is dead data; an `include` id that
// does not exist is a silent no-op that reads like coverage. ────────────────
const reachable = new Set(R.allPathways().flatMap((pw) => pw.specificationIds));
for (const spec of S.SPECIFICATIONS) {
  if (!reachable.has(spec.id)) fail(`specification ${spec.id} is led to by no pathway — nobody can choose it`);
}
const conceptIds = new Set(G.CONCEPTS.map((c) => c.id));
for (const spec of S.SPECIFICATIONS) {
  for (const level of spec.levels) {
    for (const id of [...(level.include ?? []), ...(level.exclude ?? [])]) {
      if (!conceptIds.has(id)) fail(`${spec.id}/${level.id}: names the concept ${id}, which the genome does not have`);
    }
  }
}

// ── 4. NO COUNTRY IS SILENTLY GIVEN ANOTHER COUNTRY'S CURRICULUM ────────────
// Both directions, because both are the same defect: a recorded national system
// that resolves to no national course, and an unrecorded country that resolves to
// somebody else's. And the international alternative must always be REACHABLE,
// because "we have not mapped your country" may not mean "you cannot use this".
for (const { code, name } of COUNTRIES) {
  const rec = R.countryRecord(code);
  const national = [...(rec?.nationalPathways ?? [])];
  const offered = S.specsFor(code).map((s) => s.id);
  const nationalOffered = offered.filter(isNationalSpec);
  if (national.length > 0 && nationalOffered.length === 0) {
    fail(`${code} (${name}): a national system is recorded but no national course is offered`);
  }
  if (national.length === 0 && nationalOffered.length > 0) {
    fail(`${code} (${name}): no national system recorded, yet ${nationalOffered.join(", ")} is offered`);
  }
  const international = R.pathwayChoices(code).filter((p) => p.pathwayType === "international");
  if (international.length === 0) fail(`${code} (${name}): the international programmes are not reachable at all`);
  if (!offered.includes("int-igcse") && national.length === 0) {
    fail(`${code} (${name}): neither a national course nor IGCSE is offered`);
  }
}

// AND THE OTHER DIRECTION, which the first version of this gate missed: a
// currency can exist without being OFFERED. Ireland had a national route and an
// Irish specification while "Ireland" was not in the picker at all, so the
// learner-facing count said one more national route than any learner could
// choose — an Irish learner had to pick "prefer not to say" or another country
// and was answered with somebody else's curriculum. The count and the offer are
// two different claims and this is the one that keeps them equal.
{
  const pickable = new Set(COUNTRIES.map((c) => c.code));
  for (const code of R.RESEARCHED_CODES) {
    if (code === "INT" || code === "XX") continue;
    if (!pickable.has(code)) {
      const rec = R.countryRecord(code);
      const what = (rec?.nationalPathways ?? []).length > 0 ? "a national route" : "a record";
      fail(`${code}: the registry holds ${what} for a country the picker does not offer — no learner can choose it`);
    }
  }
}

// ── 5. A country with two systems must ASK, and the two must not overlap ────
for (const code of R.RESEARCHED_CODES) {
  const rec = R.countryRecord(code);
  if (rec.nationalPathways.length < 2) continue;
  if (!R.pathwayChoiceRequired(code)) fail(`${code}: runs ${rec.nationalPathways.length} systems but the choice is not required`);
  if (R.defaultPathwayFor(code) !== null) fail(`${code}: a default pathway is set for a country with two systems`);
  const sets = rec.nationalPathways.map((p) => new Set(p.specificationIds));
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const shared = [...sets[i]].filter((id) => sets[j].has(id));
      if (shared.length > 0) fail(`${code}: two systems share ${shared.join(", ")}, so neither is distinct`);
    }
    if (sets[i].size === 0) fail(`${code}: a national system leads to nothing`);
  }
}

// ── 6. EVERY YEAR OF EVERY PATHWAY IS DECLARABLE, WITH A COURSE THAT FITS IT ─
// The failure this catches is a pathway whose years and whose qualifications
// disagree — a year the course gate would then refuse, which on the wizard means
// a disabled `Next` with nothing left on the screen to change.
for (const pw of R.allPathways()) {
  const code = pw.pathwayType === "national" ? pw.countryCode : "FR";
  for (const subject of SUBJECTS) {
    const options = S.specOptionsFor(code, subject, pw.id);
    const spec = options.find((s) => pw.specificationIds.includes(s.id)) ?? options[0];
    if (!spec) { fail(`${pw.id}: offers no course for ${subject}`); continue; }
    const level = spec.levels[0];
    for (const year of pw.schoolYears) {
      const gaps = S.courseGaps(
        {
          country: code,
          pathway: pw.id,
          grade: year.label,
          subjects: [subject],
          subjectCourses: { [subject]: { spec: spec.id, specLevel: level.id } },
        },
        subject,
      );
      if (gaps.length > 0) fail(`${pw.id} · ${year.label} · ${subject}: still missing ${gaps.join("+")}`);
    }
  }
}

// ── 7. Counts come from the registry, never from a sentence ─────────────────
const nationalCodes = R.nationalRouteCodes();
ok(S.NATIONAL_ROUTE_COUNT === nationalCodes.length,
  `the published national-route count (${S.NATIONAL_ROUTE_COUNT}) is not the registry's (${nationalCodes.length})`);

// ── The report ──────────────────────────────────────────────────────────────
const countries = COUNTRIES.map(({ code, name }) => {
  const rec = R.countryRecord(code);
  const national = rec?.nationalPathways ?? [];
  const offered = S.specsFor(code);
  const sources = national.flatMap((p) => p.sourceUrls);
  const review = national.map((p) => p.recordReview);
  return {
    countryCode: code,
    countryName: name,
    status: national.length > 0 ? "national" : code === "INT" ? "international" : code === "XX" ? "independent" : "unmapped",
    nationalPathways: national.map((p) => ({
      id: p.id,
      name: p.name,
      years: p.schoolYears.map((y) => y.label),
      specificationIds: p.specificationIds,
      recordReview: p.recordReview,
      mappingReview: p.mappingReview,
      sourceUrls: p.sourceUrls,
    })),
    // What a learner in this country is offered WITHOUT choosing a pathway.
    offeredCourses: offered.map((s) => s.id),
    recordReview: review.length > 0 ? review.sort((a, b) => R.REVIEW_ORDER.indexOf(b) - R.REVIEW_ORDER.indexOf(a))[0] : "unmapped",
    sourcesOnFile: sources.length,
  };
});

const pathways = R.allPathways().map((p) => ({
  id: p.id,
  countryCode: p.countryCode,
  pathwayType: p.pathwayType,
  years: p.schoolYears.length,
  qualifications: p.qualifications.map((q) => q.name),
  specificationIds: p.specificationIds,
  recordReview: p.recordReview,
  mappingReview: p.mappingReview,
  sourceUrls: p.sourceUrls,
}));

const counts = {
  countriesOffered: COUNTRIES.length,
  countriesWithNationalRoute: nationalCodes.length,
  countriesUnmapped: COUNTRIES.filter((c) => (R.countryRecord(c.code)?.nationalPathways ?? []).length === 0).length,
  nationalPathways: R.allPathways().filter((p) => p.pathwayType === "national").length,
  specifications: S.SPECIFICATIONS.length,
  nationalSpecifications: S.SPECIFICATIONS.filter((s) => isNationalSpec(s.id)).length,
  internationalSpecifications: S.SPECIFICATIONS.filter((s) => s.id === "int-igcse" || s.id === "int-ib").length,
  independentSpecifications: S.SPECIFICATIONS.filter((s) => s.id === "any-independent").length,
  pathsWithNoSource: R.allPathways().filter((p) => p.sourceUrls.length === 0).length,
  reviewedMappings: R.allPathways().filter((p) => R.reviewAtLeast(p.mappingReview, "reviewed")).length,
  verifiedPathways: R.allPathways().filter((p) => p.recordReview === "verified").length,
};

// ── 3. The mappings: the half a ministry can actually audit ─────────────────
//
// The registry's `mappingReview` is a label; this is the evidence under it. Each
// mapping names a published document, quotes that document's headings, and
// places individual concepts under them. The checks below are what stop a
// mapping from being decoration: a concept that does not exist, a concept the
// course does not teach, a source that is not recorded on the pathway it claims,
// or a review claimed without a reviewer's name and date.
const M = require("../.verify/curricula/mappings.js");
const mappings = M.CONCEPT_MAPPINGS;
const mappingRows = [];
for (const m of mappings) {
  const where = `mapping ${m.specId}`;
  const spec = S.specById(m.specId);
  const pw = R.pathwayById(m.pathwayId);
  ok(Boolean(spec), `${where}: unknown specification`);
  ok(Boolean(pw), `${where}: unknown pathway ${m.pathwayId}`);
  if (spec && pw) {
    ok(pw.specificationIds.includes(m.specId), `${where}: ${m.pathwayId} does not lead to this course`);
    // THE PATHWAY MUST CARRY THE SOURCE IT IS MAPPED AGAINST. Otherwise the
    // citation lives only in a file the learner's course does not point at, and
    // "this is mapped against X" is unverifiable from the record.
    ok(pw.sourceUrls.includes(m.source.url), `${where}: the mapping's source is not recorded on pathway ${pw.id}`);
  }
  ok(/^https:\/\//.test(m.source.url), `${where}: the source is not an https reference`);
  ok(Boolean(m.source.title && m.source.publisher && m.source.published), `${where}: the source is missing its title, publisher or date`);
  ok(m.source.verification === "document" || m.source.verification === "portal", `${where}: unknown verification level`);
  ok((m.reviewer === null) === (m.reviewedAt === null), `${where}: reviewer and reviewedAt must both be set or both be absent`);
  if (m.reviewer !== null) {
    ok(m.reviewer.trim().length > 1, `${where}: a reviewer with no name`);
    ok(Number.isFinite(Date.parse(m.reviewedAt ?? "")), `${where}: reviewedAt is not a date`);
  }

  const coverage = spec ? S.courseConceptIds(spec) : new Set();
  const seen = new Set();
  for (const e of m.entries) {
    const concept = G.CONCEPTS_BY_ID[e.conceptId];
    if (!concept) { fail(`${where}: names concept “${e.conceptId}”, which the genome does not hold`); continue; }
    ok(coverage.has(e.conceptId), `${where}: “${e.conceptId}” is not in that course's coverage, so mapping it claims the course teaches what it does not`);
    ok(concept.subject === m.subject, `${where}: “${e.conceptId}” is ${concept.subject}, not ${m.subject}`);
    ok(!seen.has(e.conceptId), `${where}: “${e.conceptId}” is mapped twice`);
    seen.add(e.conceptId);
    ok(Boolean(e.ref && e.ref.trim()), `${where}: “${e.conceptId}” has no published heading`);
    ok(Boolean(e.statement && e.statement.trim().length > 10), `${where}: “${e.conceptId}” has no statement of what the source asks`);
  }
  ok(m.entries.length > 0, `${where}: an empty mapping is not a mapping`);

  // THE ONE DIRECTION THAT MUST NEVER INVERT: a pathway may not claim a review
  // that no reviewer signed, and a signed mapping should be reflected in the
  // pathway's own status rather than left unread.
  if (pw) {
    if (M.mappingIsReviewed(m)) {
      ok(R.reviewAtLeast(pw.mappingReview, "reviewed"), `${where}: a signed mapping whose pathway still reads “${pw.mappingReview}”`);
    } else {
      ok(!R.reviewAtLeast(pw.mappingReview, "reviewed"), `${where}: pathway ${pw.id} claims “${pw.mappingReview}” but no reviewer has signed its mapping`);
    }
  }
  mappingRows.push({
    specId: m.specId,
    pathwayId: m.pathwayId,
    source: m.source.title,
    publisher: m.source.publisher,
    published: m.source.published,
    verification: m.source.verification,
    conceptsMapped: m.entries.length,
    courseConcepts: coverage.size,
    reviewer: m.reviewer,
    reviewedAt: m.reviewedAt,
  });
}
const mappedSpecIds = new Set(mappings.map((m) => m.specId));
ok(mappedSpecIds.size === mappings.length, "two mappings for one specification");

counts.mappingsOnFile = mappings.length;
counts.mappedSpecifications = mappedSpecIds.size;
counts.mappingsWithReviewer = mappings.filter((m) => M.mappingIsReviewed(m)).length;
counts.conceptsMapped = mappings.reduce((n, m) => n + m.entries.length, 0);
counts.mappingsVerifiedAgainstDocument = mappings.filter((m) => m.source.verification === "document").length;

const report = { generatedBy: "scripts/curriculum-gate.mjs", counts, countries, pathways, mappings: mappingRows, problems };
fs.mkdirSync("audit", { recursive: true });
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");

// ── The printed table: one row per offered country ──────────────────────────
const pad = (s, n) => String(s).padEnd(n);
console.log("");
console.log("▸ CURRICULUM COVERAGE — country → pathways → courses");
console.log(`${pad("CODE", 5)} ${pad("COUNTRY", 22)} ${pad("SYSTEM", 9)} ${pad("NATIONAL PATHS", 15)} ${pad("COURSES", 26)} ${pad("SOURCES", 8)} REVIEW`);
for (const row of countries) {
  console.log(
    `${pad(row.countryCode, 5)} ${pad(row.countryName, 22)} ${pad(row.status, 9)} ` +
    `${pad(row.nationalPathways.length, 15)} ${pad(row.offeredCourses.join(","), 26)} ` +
    `${pad(row.sourcesOnFile, 8)} ${row.recordReview}`,
  );
}
console.log("");
for (const [k, v] of Object.entries(counts)) console.log(`  ${pad(k, 30)} ${v}`);
console.log("");
console.log(`Report → ${REPORT_PATH}`);

if (problems.length > 0) {
  console.log("");
  console.error(`✗ ${problems.length} curriculum-integrity problem(s):`);
  for (const p of problems) console.error(`  · ${p}`);
  process.exit(1);
}
console.log("✓ every pathway is well formed, sourced as it claims, and reachable; no country is given another's curriculum.");
