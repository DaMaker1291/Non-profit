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

const ROUTES: Record<string, CurriculumRoute> = {
  KE: { system: "Kenya · Secondary", grades: ["Form 1", "Form 2", "Form 3", "Form 4"], entry: ["fractions", "linear-equations", "quadratics"], boards: [{ id: "kenyan", name: "Kenya National Examinations (KNEC)", exams: ["KCPE", "KCSE Form 4"] }] },
  IN: { system: "India · Secondary", grades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"], entry: ["fractions", "linear-equations", "triangles"], boards: [
    { id: "cbse", name: "Central Board of Secondary Education (CBSE)", exams: ["AISSE Class 10", "AISSCE Class 12"] },
    { id: "icse", name: "Indian Certificate of Secondary Education (ICSE)", exams: ["ICSE Class 10", "ISC Class 12"] },
    { id: "state", name: "State board", exams: ["SSC / HSC"] },
  ]},
  PH: { system: "Philippines · JHS/SHS", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "integers", "linear-equations"], boards: [{ id: "philippine", name: "DepEd K-12", exams: ["DepEd National Assessments"] }] },
  BD: { system: "Bangladesh · Secondary", grades: ["Class 6", "Class 8", "Class 10"], entry: ["fractions", "percentages", "linear-equations"], boards: [
    { id: "bangladeshi", name: "Board of Intermediate and Secondary Education", exams: ["JSC", "SSC"] },
  ]},
  NG: { system: "Nigeria · JSS/SSS", grades: ["JSS 1", "JSS 3", "SSS 1", "SSS 3"], entry: ["fractions", "percentages", "linear-equations"], boards: [{ id: "nigerian", name: "West African Examinations Council (WAEC) / NECO", exams: ["BECE", "WAEC / NECO SSSCE"] }] },
  GH: { system: "Ghana · JHS/SHS", grades: ["JHS 1", "JHS 3", "SHS 1", "SHS 3"], entry: ["fractions", "integers", "linear-equations"], boards: [{ id: "state", name: "Ghana Education Service", exams: ["BECE", "WASSCE"] }] },
  TZ: { system: "Tanzania · Secondary", grades: ["Form 1", "Form 2", "Form 4"], entry: ["fractions", "linear-equations", "quadratics"], boards: [{ id: "kenyan", name: "Tanzania National Examinations (NECTA)", exams: ["PSLE", "CSEE"] }] },
  UG: { system: "Uganda · Secondary", grades: ["S1", "S2", "S4"], entry: ["fractions", "linear-equations", "triangles"], boards: [{ id: "kenyan", name: "Uganda National Examinations Board (UNEB)", exams: ["PLE", "UCE", "UACE"] }] },
  PK: { system: "Pakistan · Secondary", grades: ["Class 6", "Class 8", "Class 10"], entry: ["fractions", "percentages", "linear-equations"], boards: [
    { id: "matric", name: "Matriculation (Punjab/Sindh/Balochistan)", exams: ["Matric"] },
    { id: "state", name: "Federal Board / Cambridge", exams: ["O/A Levels"] },
  ]},
  ID: { system: "Indonesia · SMP/SMA", grades: ["SMP 7", "SMP 9", "SMA 10"], entry: ["fractions", "integers", "linear-equations"], boards: [{ id: "indonesian", name: "Kurikulum Merdeka", exams: ["US SMP", "US SMA"] }] },
  BR: { system: "Brazil · Fundamental/Médio", grades: ["8º ano", "9º ano", "1º médio"], entry: ["fractions", "percentages", "linear-equations"], boards: [{ id: "brazilian", name: "INEP / ENEM", exams: ["BNCC", "ENEM"] }] },
  MX: { system: "Mexico · Secundaria", grades: ["1º", "2º", "3º"], entry: ["fractions", "integers", "linear-equations"], boards: [{ id: "mexican", name: "SEP / ENP", exams: ["ENP"] }] },
  GB: { system: "United Kingdom · Secondary", grades: ["Year 7", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [
    { id: "aqa", name: "AQA", exams: ["GCSE", "A-Level"] },
    { id: "edexcel", name: "Pearson Edexcel", exams: ["GCSE", "A-Level"] },
    { id: "ocr", name: "OCR", exams: ["GCSE", "A-Level"] },
    { id: "wjec", name: "WJEC / Eduqas", exams: ["GCSE", "A-Level"] },
  ]},
  IE: { system: "Ireland · Junior/Senior Cycle", grades: ["1st Year", "3rd Year", "5th Year", "6th Year"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [{ id: "state", name: "NCCA (Junior Cycle / Leaving Certificate)", exams: ["Junior Cycle", "Leaving Certificate"] }] },
  US: { system: "United States · Middle/High School", grades: ["Grade 6", "Grade 8", "Grade 9", "Grade 11", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [
    { id: "commoncore", name: "Common Core State Standards", exams: ["State assessments"] },
    { id: "collegeboard", name: "College Board", exams: ["SAT", "AP"] },
  ]},
  CA: { system: "Canada · Secondary", grades: ["Grade 7", "Grade 9", "Grade 11", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [{ id: "canadian", name: "Provincial curriculum", exams: ["Provincial diploma exams"] }] },
  AU: { system: "Australia · Secondary", grades: ["Year 7", "Year 10", "Year 11", "Year 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [{ id: "acara", name: "Australian Curriculum (ACARA)", exams: ["NAPLAN", "ATAR"] }] },
  ZA: { system: "South Africa · Senior/FET", grades: ["Grade 8", "Grade 9", "Grade 10", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], boards: [{ id: "caps", name: "CAPS / National Senior Certificate", exams: ["NSC (Matric)"] }] },
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
