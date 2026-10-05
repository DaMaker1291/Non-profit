// Country routes + continuity foundations (§7, §17).
// Country → system → grades → boards → exam names.
//
// This file answers "what does school look like in this country?". The
// *qualification-level* mapping onto the genome — which subjects and stages a
// GCSE Higher, CBSE Class 10 or KCSE Form 4 course actually contains, plus the
// difficulty band and the curriculum's own terminology — lives in
// lib/specifications.ts, which is what chooses a student's path.
//
// The BoardId union lives in lib/types.ts so both layers share one registry.
import type { BoardId } from "./types";

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
const ROUTES: Record<string, CurriculumRoute> = {
  KE: { system: "Kenya · Secondary", grades: ["Form 1", "Form 2", "Form 3", "Form 4"], entry: ["fractions", "linear-equations", "quadratics"], boards: [{ id: "kenyan", name: "Kenya National Examinations (KNEC)", exams: ["KCPE", "KCSE Form 4"] }] },
  IN: { system: "India · Secondary", grades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"], entry: ["fractions", "linear-equations", "triangles"], boards: [
    { id: "cbse", name: "Central Board of Secondary Education (CBSE)", exams: ["AISSE Class 10", "AISSCE Class 12"] },
    { id: "icse", name: "Indian Certificate of Secondary Education (ICSE)", exams: ["ICSE Class 10", "ISC Class 12"] },
    { id: "state", name: "State board", exams: ["SSC / HSC"] },
  ]},
  PH: { system: "Philippines · JHS/SHS", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "integers", "linear-equations"], boards: [{ id: "philippine", name: "DepEd K-12", exams: ["DepEd National Assessments"] }] },
  BD: { system: "Bangladesh · Secondary", grades: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"], entry: ["fractions", "percentages", "linear-equations"], boards: [
    { id: "bangladeshi", name: "Board of Intermediate and Secondary Education", exams: ["JSC", "SSC"] },
  ]},
  NG: { system: "Nigeria · JSS/SSS", grades: ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"], entry: ["fractions", "percentages", "linear-equations"], boards: [{ id: "nigerian", name: "West African Examinations Council (WAEC) / NECO", exams: ["BECE", "WAEC / NECO SSSCE"] }] },
  GH: { system: "Ghana · JHS/SHS", grades: ["JHS 1", "JHS 2", "JHS 3", "SHS 1", "SHS 2", "SHS 3"], entry: ["fractions", "integers", "linear-equations"], boards: [{ id: "state", name: "Ghana Education Service", exams: ["BECE", "WASSCE"] }] },
  TZ: { system: "Tanzania · Secondary", grades: ["Form 1", "Form 2", "Form 3", "Form 4"], entry: ["fractions", "linear-equations", "quadratics"], boards: [{ id: "kenyan", name: "Tanzania National Examinations (NECTA)", exams: ["PSLE", "CSEE"] }] },
  UG: { system: "Uganda · Secondary", grades: ["S1", "S2", "S3", "S4"], entry: ["fractions", "linear-equations", "triangles"], boards: [{ id: "kenyan", name: "Uganda National Examinations Board (UNEB)", exams: ["PLE", "UCE", "UACE"] }] },
  PK: { system: "Pakistan · Secondary", grades: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"], entry: ["fractions", "percentages", "linear-equations"], boards: [
    { id: "matric", name: "Matriculation (Punjab/Sindh/Balochistan)", exams: ["Matric"] },
    { id: "state", name: "Federal Board / Cambridge", exams: ["O/A Levels"] },
  ]},
  ID: { system: "Indonesia · SMP/SMA", grades: ["SMP 7", "SMP 8", "SMP 9", "SMA 10", "SMA 11", "SMA 12"], entry: ["fractions", "integers", "linear-equations"], boards: [{ id: "indonesian", name: "Kurikulum Merdeka", exams: ["US SMP", "US SMA"] }] },
  BR: { system: "Brazil · Fundamental/Médio", grades: ["6º ano", "7º ano", "8º ano", "9º ano", "1º médio", "2º médio", "3º médio"], entry: ["fractions", "percentages", "linear-equations"], boards: [{ id: "brazilian", name: "INEP / ENEM", exams: ["BNCC", "ENEM"] }] },
  MX: { system: "Mexico · Secundaria", grades: ["1º", "2º", "3º"], entry: ["fractions", "integers", "linear-equations"], boards: [{ id: "mexican", name: "SEP / ENP", exams: ["ENP"] }] },
  GB: { system: "United Kingdom · Secondary", grades: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [
    { id: "aqa", name: "AQA", exams: ["GCSE", "A-Level"] },
    { id: "edexcel", name: "Pearson Edexcel", exams: ["GCSE", "A-Level"] },
    { id: "ocr", name: "OCR", exams: ["GCSE", "A-Level"] },
    { id: "wjec", name: "WJEC / Eduqas", exams: ["GCSE", "A-Level"] },
  ]},
  IE: { system: "Ireland · Junior/Senior Cycle", grades: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [{ id: "state", name: "NCCA (Junior Cycle / Leaving Certificate)", exams: ["Junior Cycle", "Leaving Certificate"] }] },
  US: { system: "United States · Middle/High School", grades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [
    { id: "commoncore", name: "Common Core State Standards", exams: ["State assessments"] },
    { id: "collegeboard", name: "College Board", exams: ["SAT", "AP"] },
  ]},
  CA: { system: "Canada · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [{ id: "canadian", name: "Provincial curriculum", exams: ["Provincial diploma exams"] }] },
  AU: { system: "Australia · Secondary", grades: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [{ id: "acara", name: "Australian Curriculum (ACARA)", exams: ["NAPLAN", "ATAR"] }] },
  ZA: { system: "South Africa · Senior/FET", grades: ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [{ id: "caps", name: "CAPS / National Senior Certificate", exams: ["NSC (Matric)"] }] },
  INT: { system: "International · Cambridge / IB", grades: ["Year 10", "Year 11", "Year 12", "Year 13"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [
    { id: "cambridge", name: "Cambridge Assessment International Education", exams: ["IGCSE", "AS/A Level"] },
    { id: "ib", name: "International Baccalaureate", exams: ["MYP", "Diploma Programme"] },
  ]},
};

/** Independent pathway (§7 "I'm learning independently"): skills route, no syllabus. */
export const INDEPENDENT_ROUTE: CurriculumRoute = {
  system: "Independent · skills pathway",
  grades: ["Foundations", "Core", "Advanced"],
  entry: ["place-value", "fractions", "linear-equations"],
  boards: [],
};

export function curriculumFor(country: string): CurriculumRoute | null {
  return ROUTES[country] ?? null;
}

/** The awarding body's own name for an id — a proper noun ("AQA", "Pearson
 *  Edexcel"), so it is never translated. Board ids are not globally unique
 *  ("state" is Ghana and India; "kenyan" is Kenya, Tanzania and Uganda), so
 *  this returns the first binding, which is the one the learner's own route
 *  would have offered. An unknown id degrades to its uppercase letters rather
 *  than to an empty header. */
export function boardName(id: string | undefined | null): string {
  if (!id) return "";
  for (const route of Object.values(ROUTES)) {
    const b = route.boards.find((x) => x.id === id);
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
