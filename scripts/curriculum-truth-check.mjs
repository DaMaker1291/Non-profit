#!/usr/bin/env node
// ── COUNTRY → COURSE TRUTHFULNESS ──────────────────────────────────────────
//
// The audit's Phase 3 asks for three things this can check without a human:
// that no country is ever handed another country's national curriculum, that
// the 251/70/71/181 numbers reconcile, and that the absence of a national
// mapping is labelled in every one of the fifteen languages rather than only
// in English.
//
// The numbers are asserted ABSOLUTELY. They are not a target and not a claim of
// coverage — they are the shape the product currently has, and a change to them
// is a decision that must be made deliberately rather than noticed later.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();
const require = createRequire(import.meta.url);
const availability = require("../.verify/curricula/availability.js");
const registry = require("../.verify/curricula/registry.js");
const world = require("../.verify/world-countries.js");
const spec = require("../.verify/specifications.js");

let passed = 0;
let failed = 0;
const ok = (condition, label) => {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`  ✗ ${label}`);
  }
};

console.log("▸ Curriculum availability");

const cov = availability.curriculumCoverage();
const codes = world.WORLD_COUNTRIES.map((c) => c.code);

ok(cov.countryChoices === 251, `251 country choices (${cov.countryChoices})`);
ok(cov.withNationalRoute === 70, `70 countries hold a national route (${cov.withNationalRoute})`);
ok(cov.nationalPathways === 71, `those countries hold 71 national pathways (${cov.nationalPathways})`);
ok(cov.withoutNationalRoute === 181, `181 choices have no national route (${cov.withoutNationalRoute})`);
ok(
  cov.withNationalRoute + cov.withoutNationalRoute === cov.countryChoices,
  "the two availability counts partition the country list",
);
ok(
  cov.nationalPathways === cov.withNationalRoute + cov.multiSystemCountries.reduce((s, m) => s + m.pathways - 1, 0),
  "the pathway count is countries plus their extra systems",
);
ok(
  cov.multiSystemCountries.length === 1 && cov.multiSystemCountries[0].code === "CM" && cov.multiSystemCountries[0].pathways === 2,
  `the reconciliation names Cameroon's two systems (${JSON.stringify(cov.multiSystemCountries)})`,
);
ok(cov.explanation.includes("Cameroon runs 2 systems"), "the explanation states the reconciliation, computed from the data");

// ── NO COUNTRY IS OFFERED ANOTHER COUNTRY'S NATIONAL CURRICULUM ────────────
const foreign = codes.filter((c) => availability.offersForeignNational(c));
ok(foreign.length === 0, `no country is offered a foreign national pathway (${foreign.slice(0, 5).join(", ") || "none"})`);

// ── EVERY CHOICE LEADS SOMEWHERE ───────────────────────────────────────────
const empty = codes.filter((c) => registry.pathwayChoices(c).length === 0);
ok(empty.length === 0, `every country offers at least one pathway (empty: ${empty.join(", ") || "none"})`);

// ── A QUALIFICATION CANNOT BE PULLED ACROSS A BORDER ───────────────────────
// One sampled spec per country is enough: the rule is `pathwayChoices`, not a
// per-spec table, and a violation would show on any of them.
const specs = spec.SPECIFICATIONS ?? [];
ok(specs.length > 0, "the specification registry is readable");
let crossed = 0;
for (const code of ["GB", "NG", "IN", "ZA", "CM", "KE", "FR", "US"]) {
  for (const s of specs.slice(0, 6)) {
    const pw = registry.pathwayForSpec(code, s.id);
    if (pw && pw.countryCode && pw.countryCode !== code && pw.pathwayType === "national") crossed += 1;
  }
}
ok(crossed === 0, `no sampled qualification resolves through a foreign national pathway (${crossed})`);

// ── THE SENTENCE NEVER OVERCLAIMS ──────────────────────────────────────────
const unmapped = availability.countryAvailability("FR");
const noRouteCode = codes.find((c) => !cov.withNationalRoute || !registry.nationalRouteCodes().includes(c));
ok(!!noRouteCode, "there is a country without a national route to test");
if (noRouteCode) {
  const absent = availability.countryAvailability(noRouteCode);
  ok(absent.national.available === false, `${noRouteCode} reports no national route`);
  ok(absent.curriculumResearch === "not-recorded", `${noRouteCode} reports no curriculum research`);
  ok(absent.mapping === "not-mapped", `${noRouteCode} reports no mapping`);
  ok(absent.fallback.pathwayIds.length > 0, `${noRouteCode} still offers a course`);
  ok(/not a mapping/i.test(absent.sentence), `${noRouteCode}'s sentence says what it is NOT`);
  ok(!/national curriculum recorded/i.test(absent.sentence), `${noRouteCode}'s sentence does not claim a national curriculum`);
}
const mapped = availability.countryAvailability("GB");
ok(/no curriculum specialist has reviewed/i.test(mapped.sentence), "a mapped country says the mapping is unreviewed");

// ── THE LABEL EXISTS IN ALL FIFTEEN LANGUAGES ──────────────────────────────
// `curr.unmapped` is the string the course screen shows for a country with no
// national course. It is a dictionary key, so "labelled" means labelled for a
// learner who does not read English — a test that only checked the English
// string would pass while fourteen languages said nothing.
const i18nSource = fs.readFileSync(path.join(process.cwd(), "lib/i18n.ts"), "utf8");
const labelCount = (i18nSource.match(/"curr\.unmapped"\s*:/g) ?? []).length;
ok(labelCount === 15, `the no-national-mapping label is authored in all 15 dictionaries (${labelCount})`);

console.log(`  ${passed} passed, ${failed} failed`);
console.log(`  ${cov.explanation}`);
if (failed > 0) process.exitCode = 1;
