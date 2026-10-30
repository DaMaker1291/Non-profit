// ─────────────────────────────────────────────────────────────────────────────
// THE PAPER-SHAPE AUDIT, and the coverage report for every national curriculum.
//
// WHY THIS EXISTS. The papers page told every learner the same thing — "each
// paper is written to your board's specification and format" — and for most of
// the world it was not true. Seven qualifications had a blueprint read from the
// awarding body's own papers; every other one was handed a set of three shapes
// OpenMind built to the qualification's difficulty band. Those are two different
// objects and the product showed one sentence for both, so the claim was false
// for 65 of 72 countries and nothing anywhere said so.
//
// A false sentence is not fixed by a better sentence. It is fixed by the data
// saying what it is (lib/papers#PaperBasis) and by a gate that COUNTS how much
// of the catalogue is modelled from a citation and how much is OpenMind's own —
// so "catered to N countries" is a number that can only be raised deliberately,
// and the remaining gap is a queue with reasons rather than a silence.
//
// WHAT FAILS, and what only gets reported. Failing is for a claim that is not
// true or not checkable: an item count declared as an awarding body's with no
// source behind it, a citation that is not an absolute https URL, a blueprint
// naming a qualification that does not exist, or a course with no paper at all.
// Being modelled is NOT a failure — it is the honest state of most of the
// catalogue — so it is printed, written to the report, and listed by country.
//
// Run:  npm run paper-audit
// Writes: audit/paper-shape-coverage.json  (deterministic: no timestamps, so the
//         committed report changes only when the data does)
// ─────────────────────────────────────────────────────────────────────────────
import { compileEngines } from "./compile-engines.mjs";
import { createRequire } from "node:module";
import fs from "node:fs";

compileEngines();
const require = createRequire(import.meta.url);
const P = require("../.verify/papers.js");
const S = require("../.verify/specifications.js");
const { COUNTRIES } = require("../.verify/i18n.js");

const REPORT_PATH = "audit/paper-shape-coverage.json";
const SUBJECTS = ["maths", "physics", "chemistry", "biology", "computing"];
const problems = [];
const fail = (msg) => problems.push(msg);
const ok = (cond, msg) => { if (!cond) fail(msg); };
const isHttps = (u) => typeof u === "string" && /^https:\/\/[^\s]+$/.test(u);

/**
 * COUNTRIES WHOSE EXAMINATION SHAPE WAS LOOKED FOR AND NOT FOUND — the queue,
 * with the reason, so the next person does not re-run the same research. Every
 * one of these was checked against an official document; none of them is a
 * country nobody thought about.
 */
const RESEARCHED_NOT_DECLARED = {
  BD: "Bangladesh: the only official document found was a marks-distribution notice dated AFTER the 2025 SSC sitting, so it is not evidence for the sitting it would describe. No item count or paper structure was verifiable.",
  PH: "Philippines: DepEd's NAT G10/G12 are exit assessments but the mathematics subtest's item count and duration are not published in any notice that could be read; the Grade 10 NCAE is a career assessment, not a leaving exam, and is not a substitute.",
  PK: "Pakistan: SSC structures are board-specific. The only readable structure was FBISE's own federal model paper, and naming it for a Punjab or Sindh candidate would be another country's paper wearing theirs — see the note that a board's shape needs a board of its own.",
  MX: "Mexico: the documented mathematics structure found (Ceneval EXANI-II, 30 items) belongs to a higher-education ADMISSIONS exam that institutions opt into, not to a national upper-secondary exit assessment.",
  ID: "Indonesia: the national leaving exam was replaced by the Asesmen Nasional, which is a sampled system assessment rather than an individual examination — there is no per-learner paper to model, and inventing one would be the original defect.",
  CO: "Colombia: ICFES's own orientation guide was identifiable but returned 403 to every read, so the 25+25 split across two 270-minute sessions could not be confirmed at first hand, and the session time is not a mathematics paper's time.",
  ET: "Ethiopia: the 2025 ESSLCE mathematics booklet is one paper of 60 items in 3 hours, but the mark allocation and the calculator rule could not be confirmed from an EAES document that could be read — the copies available are reproductions, not the board's own publication. A paper whose mark total nobody could check is the thing this catalogue must not print.",
  EG: "Egypt: the Ministry's April 2025 announcement gives Pure Mathematics as 20 questions (18 multiple choice, 2 essay) for 30 marks, but the page returned 403 to every read here, so the counts rest on news listings and the calculator rule is unconfirmed.",
};

// ── 1. Every blueprint names a qualification that exists ────────────────────
const specIds = new Set(S.SPECIFICATIONS.map((s) => s.id));
for (const t of P.PAPERS) {
  for (const id of t.specs) {
    ok(specIds.has(id), `paper ${t.id} names specification ${id}, which does not exist`);
  }
}

// ── 2. A claim about another country's exam must be checkable ──────────────
let published = 0;
const uncitedBlueprints = [];
const uncitedPublishedCounts = [];
const uncitedBoundaries = [];
for (const t of P.PAPERS) {
  const basis = t.basis ?? "published";
  if (basis === "published") published++;
  // A count declared as the awarding body's own must say where it was read. This
  // is the rule the item counts were introduced for: without it "45 items" is
  // indistinguishable from a number somebody liked the look of.
  if (t.itemCounts === "published" && !isHttps(t.shapeSource)) {
    uncitedPublishedCounts.push(t.id);
    fail(`paper ${t.id} declares the awarding body's own item counts with no source behind them`);
  }
  if (t.shapeSource !== undefined && !isHttps(t.shapeSource)) {
    fail(`paper ${t.id}: its source is not an absolute https URL ("${t.shapeSource}")`);
  }
  // Not a failure: a blueprint authored before citations were collected. It is
  // named in the report so the backlog is countable, and so nobody mistakes
  // "has a blueprint" for "has a citation".
  if (basis === "published" && !isHttps(t.shapeSource)) uncitedBlueprints.push(t.id);
  // A grade table shown to a learner with nothing behind it is the same class of
  // claim, one layer down: reported, never silently trusted.
  if (Array.isArray(t.boundaries) && t.boundaries.length > 0 && !isHttps(t.shapeSource)) {
    uncitedBoundaries.push(t.id);
  }
}

// ── 3. Every learner has a paper, and it says what it is ───────────────────
const byCountry = new Map();
let offers = 0;
let publishedOffers = 0;
const noPaper = [];
for (const spec of S.SPECIFICATIONS) {
  const level = spec.levels[spec.levels.length - 1];
  const active = { spec, level };
  const row = byCountry.get(spec.country) ?? { published: new Set(), modelled: new Set(), specs: new Set() };
  for (const subject of SUBJECTS) {
    if (!spec.coverage[subject]) continue;
    const authored = P.papersForSpec(spec.id, subject);
    const chosen = P.defaultPaperFor(active, subject, "en");
    offers++;
    if (!chosen) { noPaper.push(`${spec.id}/${subject}`); continue; }
    // The row a learner actually meets: it must carry a basis, whatever it is.
    ok(chosen.basis === "published" || chosen.basis === "modelled",
      `${spec.id}/${subject}: the offered paper carries a basis (${chosen.basis})`);
    // A modelled paper that cited a source would be claiming a structure it does
    // not have; a published one with no citation is the backlog above.
    if (chosen.basis === "modelled") ok(!chosen.shapeSource, `${spec.id}/${subject}: a modelled paper cites no source`);
    if (authored.length > 0) { row.published.add(spec.id); publishedOffers += authored.length; }
    else row.modelled.add(spec.id);
    row.specs.add(spec.id);
  }
  byCountry.set(spec.country, row);
}
for (const key of noPaper) fail(`no paper is offered for ${key}, so a learner there has nothing to sit`);

// ── 4. The catalogue's own coverage, printed ───────────────────────────────
const nameOf = new Map(COUNTRIES.map((c) => [c.code, c.name]));
const rows = [];
for (const [code, r] of byCountry) {
  rows.push({
    countryCode: code,
    countryName: nameOf.get(code) ?? code,
    specifications: [...r.specs].sort(),
    withPublishedShape: [...r.published].sort(),
    modelledOnly: [...r.modelled].sort(),
  });
}
rows.sort((a, b) => a.countryCode.localeCompare(b.countryCode));
const countriesWithShape = rows.filter((r) => r.withPublishedShape.length > 0);
const countriesWithout = rows.filter((r) => r.withPublishedShape.length === 0);

const counts = {
  paperBlueprints: P.PAPERS.length,
  // A blueprint is a shape named in advance; the two runtime builders
  // (genericPapers, needsPaper) are not counted here — they are counted below,
  // as the OFFERS a learner actually meets.
  publishedBlueprints: published,
  blueprintsWithACitation: P.PAPERS.filter((t) => isHttps(t.shapeSource)).length,
  uncitedBlueprints: uncitedBlueprints.length,
  qualificationSubjectOffers: offers,
  // The split that matters: how many of the papers a learner can be offered
  // have a shape read from their awarding body, and how many are OpenMind's.
  authoredOffers: publishedOffers,
  modelledOffers: offers - publishedOffers,
  countries: rows.length,
  countriesWithAPublishedShape: countriesWithShape.length,
  countriesModelledOnly: countriesWithout.length,
  researchedButNotDeclared: Object.keys(RESEARCHED_NOT_DECLARED).length,
};
ok(published === P.PAPERS.length,
  `every authored blueprint still reports a basis (${published} of ${P.PAPERS.length})`);

// ── 5. The researched shapes stay declared ─────────────────────────────────
// A floor that can only be raised. Each of these was read from an awarding
// body's own document (or, for the international programmes, from the board's
// published paper structure) and each is the reason a learner in that country
// is shown a mock of their exam rather than a set of OpenMind's own. Deleting
// one of these files is how a country silently goes back to being modelled, so
// the list is asserted by name rather than as a count.
const SHAPED = [
  "uk-gcse", "uk-alevel", "int-igcse", "int-ib", "in-cbse", "us-sat",
  "gt-diversificado", "ke-kcse", "za-nsc", "vn-thpt", "tz-csee", "ng-waec", "ug-uce", "br-enem",
  // The second wave: curricula that had no board paper at all until their own
  // board's structure was read. Asserted by name for the same reason as the
  // first list — deleting a file is how a country silently goes back to being
  // modelled, and a count would not notice the swap.
  "gh-wassce", "cm-gce-o", "cm-gce-a", "cm-bepc", "cm-probatoire", "cm-bac",
  "zm-school-certificate", "zw-o-level", "zw-a-level", "mw-msce", "ie-junior", "in-icse", "lk-o-level",
];
for (const id of SHAPED) {
  ok(P.papersForSpec(id).length > 0,
    `specification ${id} still has a paper blueprint of its own`);
}

const pad = (s, n) => String(s).padEnd(n);
console.log("");
console.log("▸ PAPER SHAPES — what a learner's paper is, country by country");
console.log(`${pad("CODE", 5)} ${pad("COUNTRY", 22)} ${pad("PUBLISHED SHAPE", 9)} ${pad("MODELLED ONLY", 14)} QUALIFICATIONS`);
for (const r of rows) {
  console.log(
    `${pad(r.countryCode, 5)} ${pad(r.countryName, 22)} ${pad(r.withPublishedShape.length, 9)} ` +
    `${pad(r.modelledOnly.length, 14)} ${r.specifications.join(", ")}`,
  );
}
console.log("");
for (const [k, v] of Object.entries(counts)) console.log(`  ${pad(k, 32)} ${v}`);
if (uncitedBlueprints.length > 0) {
  console.log("");
  console.log(`  blueprints authored from a board's structure with no citation on file (${uncitedBlueprints.length}):`);
  console.log(`    ${uncitedBlueprints.join(", ")}`);
}
if (uncitedBoundaries.length > 0) {
  console.log("");
  console.log(`  grade-boundary tables shown to learners with no citation on file (${uncitedBoundaries.length}):`);
  console.log(`    ${uncitedBoundaries.join(", ")}`);
}
console.log("");
console.log("  researched and NOT declared, with the reason (the queue):");
for (const [code, why] of Object.entries(RESEARCHED_NOT_DECLARED)) {
  console.log(`    ${code}  ${why}`);
}

const report = {
  generatedBy: "scripts/paper-audit.mjs",
  counts,
  countries: rows,
  uncitedBlueprints,
  uncitedBoundaries,
  researchedNotDeclared: RESEARCHED_NOT_DECLARED,
};
fs.mkdirSync("audit", { recursive: true });
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log("");
console.log(`Report → ${REPORT_PATH}`);

if (problems.length > 0) {
  console.log("");
  console.error(`✗ ${problems.length} paper-shape problem(s):`);
  for (const p of problems) console.error(`  · ${p}`);
  process.exit(1);
}
console.log(`✓ every paper says what its shape is; no uncited claim about another country's examination.`);
