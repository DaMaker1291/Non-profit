// ─────────────────────────────────────────────────────────────────────────────
// WHAT A COUNTRY CHOICE ACTUALLY MEANS — six facts, kept apart.
//
// The audit found one number doing six jobs: "251 countries" was being read as
// "251 national curricula", and 181 of them have no national route at all. They
// are not the same fact and they never were:
//
//   1. COUNTRY AVAILABILITY      the learner can name their country (251)
//   2. NATIONAL PATHWAY          a recorded education system for it (70 of them)
//   3. CURRICULUM RESEARCH       a syllabus document is on file for that system
//   4. MAPPING                   OpenMind concepts are mapped to that syllabus
//   5. EDUCATOR REVIEW           a qualified person has checked the mapping
//   6. CLASSROOM VALIDATION      a real class has been taught and assessed
//
// The product only ever had (1) and (2) at scale, and (4)–(6) are zero in every
// country. This module exists so a surface cannot collapse them: it returns the
// six as separate fields, and `sentence` is the one line a screen may print
// without implying the rest.
//
// WHY 70 COUNTRIES HOLD 71 PATHWAYS: Cameroon runs two systems — Anglophone and
// Francophone — so one country holds two national pathways. That is the whole
// reconciliation, and `curriculumCoverage` states it from the data rather than
// from a comment, so it cannot drift.
//
// WHAT THIS MODULE REFUSES TO DO: hand a learner another country's national
// curriculum. `pathwayChoices` never includes a foreign national pathway (only
// the international and independent ones, which belong to no country), and
// `offersForeignNational` is the assertion a test runs against every choice.
// ─────────────────────────────────────────────────────────────────────────────
import { WORLD_COUNTRIES } from "../world-countries";
import { allPathways, countryRecord, nationalRouteCodes, pathwayChoices } from "./registry";

export type ResearchStatus = "recorded" | "not-recorded";
export type MappingStatus = "mapped" | "not-mapped";
/** Reviews and classroom trials are people-shaped: until a named person does
 *  one, the only honest value is this one. */
export type NotYetDone = "none";

export interface CountryAvailability {
  code: string;
  name: string;
  /** The country's own recorded systems. Empty is a real answer. */
  national: { available: boolean; pathwayIds: string[] };
  /** What a learner there CAN take when the national route is absent (and, for
   *  a country that has one, what is offered beside it). */
  fallback: { pathwayIds: string[]; what: string };
  curriculumResearch: ResearchStatus;
  mapping: MappingStatus;
  educatorReview: NotYetDone;
  classroomValidation: NotYetDone;
  /** Structurally false: this module never returns another country's system.
   *  Kept as a value so a surface can print the guarantee, not just trust it. */
  substitutesAnotherCountrysCurriculum: false;
  /** The one sentence a screen may print. It never claims the other five. */
  sentence: string;
}

const NAME = new Map(WORLD_COUNTRIES.map((c) => [c.code, c.name]));

export function countryName(code: string): string {
  return NAME.get(code) ?? code;
}

const FALLBACK_WHAT = "international programmes and the independent skills pathway";

export function countryAvailability(code: string): CountryAvailability {
  const record = countryRecord(code);
  const nationalIds = record?.nationalPathways.map((p) => p.id) ?? [];
  const offered = pathwayChoices(code);
  const fallbackIds = offered.filter((p) => p.pathwayType !== "national").map((p) => p.id);
  const available = nationalIds.length > 0;
  const name = countryName(code);
  return {
    code,
    name,
    national: { available, pathwayIds: nationalIds },
    fallback: { pathwayIds: fallbackIds, what: FALLBACK_WHAT },
    curriculumResearch: available ? "recorded" : "not-recorded",
    // A national route existing is not a reviewed mapping. Every mapping is
    // unreviewed, in every country, and the field says so rather than the
    // screen implying otherwise by omission.
    mapping: available ? "mapped" : "not-mapped",
    educatorReview: "none",
    classroomValidation: "none",
    substitutesAnotherCountrysCurriculum: false,
    sentence: available
      ? `National curriculum recorded for ${name}. Courses there are mapped to it; no curriculum specialist has reviewed the mapping.`
      : `No national curriculum is recorded for ${name}. The courses offered are ${FALLBACK_WHAT} — not a mapping of ${name}'s curriculum, and nothing here claims to be.`,
  };
}

/** Does this country's picker offer a NATIONAL pathway belonging to a different
 *  country? The answer must be no, in every one of the 251 choices. */
export function offersForeignNational(code: string): boolean {
  return pathwayChoices(code).some((p) => p.pathwayType === "national" && p.countryCode !== code);
}

export interface CurriculumCoverage {
  countryChoices: number;
  withNationalRoute: number;
  withoutNationalRoute: number;
  nationalPathways: number;
  pathwaysTotal: number;
  /** Countries holding more than one national system, with the count. */
  multiSystemCountries: { code: string; name: string; pathways: number }[];
  /** The reconciliation, computed rather than written down. */
  explanation: string;
}

export function curriculumCoverage(): CurriculumCoverage {
  const codes = WORLD_COUNTRIES.map((c) => c.code);
  const national = nationalRouteCodes();
  const nationalPaths = allPathways().filter((p) => p.pathwayType === "national");
  const byCountry = new Map<string, number>();
  for (const p of nationalPaths) byCountry.set(p.countryCode, (byCountry.get(p.countryCode) ?? 0) + 1);
  const multi = [...byCountry.entries()]
    .filter(([, n]) => n > 1)
    .map(([code, n]) => ({ code, name: countryName(code), pathways: n }))
    .sort((a, b) => a.code.localeCompare(b.code));
  const without = codes.filter((c) => !national.includes(c)).length;
  const extra = multi.reduce((sum, m) => sum + (m.pathways - 1), 0);
  return {
    countryChoices: codes.length,
    withNationalRoute: national.length,
    withoutNationalRoute: without,
    nationalPathways: nationalPaths.length,
    pathwaysTotal: allPathways().length,
    multiSystemCountries: multi,
    explanation:
      `${national.length} of ${codes.length} country choices have a recorded national route, and they hold ` +
      `${nationalPaths.length} national pathways` +
      (extra > 0
        ? ` because ${multi.map((m) => `${m.name} runs ${m.pathways} systems`).join("; ")}.`
        : ".") +
      ` The other ${without} are offered ${FALLBACK_WHAT}, and no national mapping is claimed for them.`,
  };
}
