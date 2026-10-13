// Country routes + continuity foundations (§7, §17).
// Country → pathway → years → boards → exam names.
//
// This file answers "what does school look like in this country?" — and it no
// longer answers it from a table of its own. The DATA moved to
// lib/curricula/registry.ts, which models a country as a set of PATHWAYS (a
// country can run two systems at once, as Cameroon does) rather than as one
// record per country code. What is left here is the compatibility face the rest
// of the product reads: `curriculumFor(country)` for a reader that needs SOME
// route, and a route built from a CHOSEN pathway for a reader that knows which
// system the learner follows.
//
// The *qualification-level* mapping onto the genome — which subjects and stages
// a GCSE Higher, CBSE Class 10 or GCE Advanced Level course actually contains,
// plus the difficulty band and the curriculum's own terminology — lives in
// lib/specifications.ts, which is what chooses a student's path.
//
// The BoardId union lives in lib/types.ts so both layers share one registry.
import type { BoardId } from "./types";
import {
  countryRecord,
  defaultPathwayFor,
  pathwayById,
  allPathways,
  type CurriculumPathway,
} from "./curricula/registry";

export type { BoardId };

export interface BoardDef { id: BoardId; name: string; exams: string[] }

export interface CurriculumRoute {
  system: string;
  grades: string[];
  entry: string[];
  boards: BoardDef[];
}

// A ROUTE'S YEAR LIST IS THE WHOLE SEQUENCE, not a sample of it.
//
// These lists were written with gaps — GB jumped Year 7 → Year 9, AU skipped
// Years 8 and 9, NG skipped JSS 2 and SSS 2 — and nothing said so: no comment,
// no pin, and 15 of the 20 routes affected. The UI renders the list as the
// years the system HAS, and `courseGaps` (lib/specifications.ts) reports a
// grade outside it as a missing course field, so a UK Year 8 pupil — the first
// year of secondary school for an entire cohort — could not name their real
// year: they had to declare Year 7 or Year 9, and every decision downstream
// (the course step's seeding, the diagnostic's opening band) then answered a
// question they never asked. Measured live: the GB select read "Year 7, Year 9,
// Year 10…".
//
// The rule is one rule, and it is the system's own: the years a learner can
// declare are every year of each phase the route names, in order. Adding a year
// is a data correction, never a content claim — nothing in the engine keys
// teaching on the year string (the course's qualification and tier do that),
// so completing a sequence gives the learner a truthful answer to give and
// changes no lesson. Where a phase genuinely ends (India's secondary starts at
// Class 8; INT's Cambridge/IB span is Years 10–13), the span is what it is.
//
// THE SAME RULE NOW APPLIES PER PATHWAY, which is why the sequences are checked
// per pathway in `npm run verify` rather than per country: Cameroon's
// Anglophone and Francophone systems are checked as two sequences, so a hole in
// one cannot be masked by the other's numbers.

/** The route a reading of ONE pathway produces. A caller that knows which
 *  education system the learner follows must use this — `curriculumFor` can only
 *  answer for a country, and a country with two systems has no single answer. */
export function routeForPathway(pathway: CurriculumPathway): CurriculumRoute {
  return {
    system: pathway.name,
    grades: pathway.schoolYears.map((y) => y.label),
    entry: pathway.entryConcepts ?? [],
    boards: pathway.boards,
  };
}

/** The route a CHOSEN pathway produces, or null when the id names nothing or
 *  names a pathway this learner cannot follow.
 *
 *  The country check matters for a NATIONAL pathway: the id is a stored profile
 *  field, and a stale one (a learner who moved, or changed their country) must
 *  not keep offering the old system's years. It deliberately does NOT apply to
 *  the international and independent pathways, which belong to no country and
 *  are offered in every one of them — requiring a country record for those was
 *  the first version of this function, and it broke the case it most needed to
 *  serve: a learner in an unrecorded country (France, Germany, and the rest)
 *  choosing IGCSE got the skills pathway's band names instead of Years 10–13,
 *  which the curriculum gate reports as a year the course does not contain. */
export function routeForPathwayId(
  country: string | undefined | null,
  pathwayId: string | undefined | null,
): CurriculumRoute | null {
  const pw = pathwayById(pathwayId);
  if (!pw) return null;
  if (pw.pathwayType !== "national") return routeForPathway(pw);
  const record = countryRecord(country);
  const own = record?.nationalPathways.some((p) => p.id === pw.id) ?? false;
  return own ? routeForPathway(pw) : null;
}

/** The route a reader gets when it has only a country in hand.
 *
 *  Null means "this country has no single route", and it covers three different
 *  situations that the callers distinguish by the registry, not by a second
 *  table: the country has no record at all (unresearched — France, Germany, and
 *  50 others), the country has TWO national systems and the learner has not said
 *  which (Cameroon must be asked), or the code is the deliberate "Prefer not to
 *  say". Every caller already falls back to the independent pathway for a null
 *  route; what none of them may do is guess WHICH system a two-system country
 *  runs. */
export function curriculumFor(country: string): CurriculumRoute | null {
  const record = countryRecord(country);
  if (!record) return null;
  const dflt = defaultPathwayFor(country);
  if (!dflt) return null;
  // A country with no national pathway keeps returning null (the independent
  // and international pathways are the caller's fallback), EXCEPT for the
  // international code itself, whose route the international programme is.
  if (record.nationalPathways.length === 0 && dflt.pathwayType === "independent") return null;
  return routeForPathway(dflt);
}

/** Independent pathway (§7 "I'm learning independently"): the skills route, no
 *  syllabus — and, unlike every national system here, its years are OpenMind's
 *  own bands rather than a country's classes. Derived from the registry so the
 *  one definition of it lives with every other pathway. */
export const INDEPENDENT_ROUTE: CurriculumRoute = routeForPathway(
  defaultPathwayFor("XX") ?? allPathways().find((p) => p.pathwayType === "independent")!,
);

/** The awarding body's own name for an id — a proper noun ("AQA", "Pearson
 *  Edexcel"), so it is never translated. Board ids are not globally unique
 *  ("state" is Ghana's, India's, Ireland's and Pakistan's; "kenyan" is Kenya's,
 *  Tanzania's and Uganda's), so this returns the first binding, which is the one
 *  the learner's own route would have offered — hence the registry's order is
 *  load-bearing. An unknown id degrades to its uppercase letters rather than to
 *  an empty header. */
export function boardName(id: string | undefined | null): string {
  if (!id) return "";
  for (const pathway of allPathways()) {
    const b = pathway.boards.find((x) => x.id === id);
    if (b) return b.name;
  }
  return id.toUpperCase();
}

/** Emergency continuity core (§17): literacy + numeracy foundations that work
 *  fully offline from a printed pack. Filter NextStep/diagnostics to these. */
export const CONTINUITY_CORE = [
  "place-value", "addition", "subtraction", "multiplication", "division",
  "fractions", "decimals", "percentages", "reading", "sentences",
];

export function isContinuityMode(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem("openmind:continuity") === "1"; } catch { return false; }
}

export function setContinuityMode(on: boolean): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem("openmind:continuity", on ? "1" : "0"); } catch { /* ignore */ }
}
