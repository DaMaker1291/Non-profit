// ─────────────────────────────────────────────────────────────────────────────
// Curriculum specifications (§1, §2, §4, §9, §11).
//
// The genome (lib/genome.ts) is the universal knowledge graph: 148 concepts
// across five subjects, ordered by a documented stage ladder 0 → 5. A
// specification is the *lens* a student's own education system puts on that
// graph — AQA GCSE Higher, CBSE Class 10, KCSE Form 4, IB, SAT.
//
// Three things this module must never do:
//   1. Promise a concept the platform cannot teach. Coverage is resolved
//      against the genome, so an id that does not exist simply is not covered.
//   2. Pretend a national syllabus is fully encoded here. What is encoded is
//      the *shape* (which subjects, which stage window, which named topics),
//      which is exactly what chooses a path, a difficulty band and a
//      terminology set. Named-topic lists are open data, like lessons.
//   3. Claim a student "covered" material they have not demonstrated. Coverage
//      says what the specification *contains*; mastery is always evidence.
//
// What is real and verifiable here:
//   · coverageOf() returns genome concepts — never invented ids
//   · difficultyFor() drives the practice engine's difficulty target, so
//     Foundation students get easier questions than A-Level students on the
//     same concept
//   · applyTerminology() renders the student's own curriculum vocabulary
//     (slope vs gradient, PEMDAS vs BIDMAS) on served questions
// ─────────────────────────────────────────────────────────────────────────────
import type { BoardId, Concept, StageId, SubjectCourse, SubjectId } from "./types";
import { CONCEPTS, bySubject } from "./genome";
import { INDEPENDENT_ROUTE, curriculumFor } from "./curriculum";

/** Generic tier name keys (lvl.*), translated in every dictionary. The
 *  country-specific name ("Form 4", "Class 10") is data, not translation. */
export type TierId = "primary" | "junior" | "foundation" | "higher" | "advanced" | "degree";

export const TIERS: TierId[] = ["primary", "junior", "foundation", "higher", "advanced", "degree"];

/** Stage window as [minStage, maxStage] — inclusive, matching StageId 0…5. */
export type StageWindow = [StageId, StageId];

export interface SpecLevel {
  id: string;
  tier: TierId;
  /** The system's own name for the tier, shown next to the translated tier
   *  (e.g. "Form 4", "Class 10", "Year 11"). Empty for generic tiers. */
  name: string;
  /** Global stage window for this tier, clipped by the specification. */
  stages: StageWindow;
  /** Difficulty band practice targets for this tier, 0–1. Consumed by
   *  generateQuestionAt via difficultyFor(). */
  difficulty: number;
  /** Per-subject narrowing (or widening) where a tier is not uniform. */
  narrow?: Partial<Record<SubjectId, StageWindow>>;
  /** Named topics this tier examines beyond its stage window. */
  include?: string[];
  /** Concepts inside the stage window that this tier does not examine. */
  exclude?: string[];
}

export interface Specification {
  id: string;
  /** ISO-3166 alpha-2, or "INT" for international qualifications. */
  country: string;
  /** Exam board / awarding body key (see BoardId). */
  board: BoardId;
  /** The qualification's own name. Data, not translation: these are proper
   *  nouns (GCSE, CBSE, KCSE, ENEM) — a student in any language sits the same
   *  exam under the same name. Only the generic tier names (lvl.*) are
   *  translated in every dictionary. */
  name: string;
  /** Subject → stage window the qualification covers. Subjects absent here are
   *  not part of this specification, but remain reachable through the genome. */
  coverage: Partial<Record<SubjectId, StageWindow>>;
  levels: SpecLevel[];
}

// ── The specifications ──────────────────────────────────────────────────────
// One entry per (country/system → qualification). Levels are the tiers a
// student actually chooses between at enrolment.

const UK: Specification = {
  id: "uk-gcse", country: "GB", board: "aqa", name: "GCSE",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "foundation", tier: "foundation", name: "Foundation tier", stages: [0, 3], difficulty: 0.45, exclude: ["completing-square", "polynomials", "binomial", "logs"] },
    { id: "higher", tier: "higher", name: "Higher tier", stages: [0, 4], difficulty: 0.65, exclude: ["logs", "calculus-diff", "calculus-int", "matrices-intro"] },
  ],
};

const UK_ALEVEL: Specification = {
  id: "uk-alevel", country: "GB", board: "aqa", name: "A-Level",
  coverage: { maths: [2, 5], physics: [2, 3], chemistry: [2, 4], biology: [1, 3], computing: [1, 3] },
  levels: [
    { id: "as", tier: "advanced", name: "AS", stages: [2, 4], difficulty: 0.75 },
    { id: "a2", tier: "degree", name: "A2", stages: [2, 5], difficulty: 0.9 },
  ],
};

const IGCSE: Specification = {
  id: "int-igcse", country: "INT", board: "cambridge", name: "Cambridge IGCSE",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "core", tier: "foundation", name: "Core", stages: [0, 2], difficulty: 0.4 },
    { id: "extended", tier: "higher", name: "Extended", stages: [0, 4], difficulty: 0.65, exclude: ["logs", "calculus-diff", "calculus-int"] },
  ],
};

const IB: Specification = {
  id: "int-ib", country: "INT", board: "ib", name: "International Baccalaureate",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 4], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "myp", tier: "junior", name: "MYP", stages: [0, 2], difficulty: 0.45 },
    { id: "sl", tier: "advanced", name: "Diploma SL", stages: [0, 4], difficulty: 0.7 },
    { id: "hl", tier: "degree", name: "Diploma HL", stages: [0, 5], difficulty: 0.9 },
  ],
};

const US_CORE: Specification = {
  id: "us-core", country: "US", board: "commoncore", name: "Common Core (US)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "middle", tier: "junior", name: "Grades 6–8", stages: [0, 2], difficulty: 0.4 },
    { id: "high", tier: "higher", name: "Grades 9–12", stages: [0, 4], difficulty: 0.65 },
  ],
};

const SAT: Specification = {
  id: "us-sat", country: "US", board: "collegeboard", name: "Digital SAT",
  coverage: { maths: [0, 3] },
  levels: [
    // The SAT papers do not examine proof, vectors, matrices or the sine and
    // cosine rules — listing them here would send students to the wrong work.
    { id: "sat", tier: "higher", name: "Digital SAT", stages: [0, 3], difficulty: 0.6, exclude: ["proof", "vectors", "matrices-intro", "trig-rule", "circle-theorems"] },
  ],
};

const US_AP: Specification = {
  id: "us-ap", country: "US", board: "collegeboard", name: "Advanced Placement (AP)",
  coverage: { maths: [2, 5], physics: [2, 3], chemistry: [2, 4], biology: [1, 3], computing: [1, 3] },
  levels: [
    { id: "ap", tier: "advanced", name: "AP", stages: [2, 5], difficulty: 0.85 },
  ],
};

const ZA: Specification = {
  id: "za-nsc", country: "ZA", board: "caps", name: "National Senior Certificate (CAPS)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 2] },
  levels: [
    { id: "senior", tier: "junior", name: "Grades 8–9", stages: [0, 2], difficulty: 0.4 },
    { id: "fet", tier: "higher", name: "Grades 10–12", stages: [0, 4], difficulty: 0.65, exclude: ["matrices-intro"] },
  ],
};

const AU: Specification = {
  id: "au-acara", country: "AU", board: "acara", name: "Australian Curriculum",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "years7-10", tier: "junior", name: "Years 7–10", stages: [0, 3], difficulty: 0.5 },
    { id: "senior", tier: "higher", name: "Senior secondary", stages: [0, 4], difficulty: 0.7 },
  ],
};

const CA: Specification = {
  id: "ca-provincial", country: "CA", board: "canadian", name: "Provincial curriculum (Canada)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "intermediate", tier: "junior", name: "Grades 7–8", stages: [0, 2], difficulty: 0.4 },
    { id: "senior", tier: "higher", name: "Grades 9–12", stages: [0, 4], difficulty: 0.65 },
  ],
};

const IE: Specification = {
  id: "ie-junior", country: "IE", board: "state", name: "Junior / Senior Cycle (Ireland)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "junior", tier: "junior", name: "Junior Cycle", stages: [0, 2], difficulty: 0.45 },
    { id: "senior", tier: "higher", name: "Senior Cycle", stages: [0, 4], difficulty: 0.7 },
  ],
};

const IN_CBSE: Specification = {
  id: "in-cbse", country: "IN", board: "cbse", name: "CBSE",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 4], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "class8-9", tier: "junior", name: "Class 8–9", stages: [0, 2], difficulty: 0.4 },
    // CBSE Class 10 trigonometry is ratios and identities; the sine and cosine
    // rules arrive at Class 11.
    { id: "class10", tier: "foundation", name: "Class 10", stages: [0, 3], difficulty: 0.55, exclude: ["trig-rule"] },
    { id: "class11-12", tier: "advanced", name: "Class 11–12", stages: [0, 5], difficulty: 0.85 },
  ],
};

const IN_ICSE: Specification = {
  id: "in-icse", country: "IN", board: "icse", name: "ICSE / ISC",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 4], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "class8-9", tier: "junior", name: "Class 8–9", stages: [0, 2], difficulty: 0.42 },
    { id: "class10", tier: "foundation", name: "Class 10", stages: [0, 4], difficulty: 0.6, exclude: ["calculus-diff", "calculus-int"] },
    { id: "isc", tier: "advanced", name: "ISC 11–12", stages: [0, 5], difficulty: 0.85 },
  ],
};

const PK: Specification = {
  id: "pk-matric", country: "PK", board: "matric", name: "Matric / Intermediate (Pakistan)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "class6-8", tier: "junior", name: "Class 6–8", stages: [0, 1], difficulty: 0.35 },
    { id: "matric", tier: "foundation", name: "Class 9–10 (Matric)", stages: [0, 3], difficulty: 0.55 },
    { id: "inter", tier: "advanced", name: "Class 11–12 (Inter)", stages: [0, 4], difficulty: 0.75 },
  ],
};

const BD: Specification = {
  id: "bd-ssc", country: "BD", board: "bangladeshi", name: "SSC / HSC (Bangladesh)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "jsc", tier: "junior", name: "Class 6–8 (JSC)", stages: [0, 2], difficulty: 0.4 },
    { id: "ssc", tier: "foundation", name: "Class 9–10 (SSC)", stages: [0, 3], difficulty: 0.55 },
    { id: "hsc", tier: "advanced", name: "Class 11–12 (HSC)", stages: [0, 4], difficulty: 0.78 },
  ],
};

const KE: Specification = {
  id: "ke-kcse", country: "KE", board: "kenyan", name: "KCSE (Kenya)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "junior", tier: "junior", name: "Grade 7–9", stages: [0, 2], difficulty: 0.4 },
    { id: "form3", tier: "foundation", name: "Form 3", stages: [0, 3], difficulty: 0.55 },
    { id: "form4", tier: "higher", name: "Form 4 (KCSE)", stages: [0, 4], difficulty: 0.7, include: ["trig-rule", "completing-square", "surds"] },
  ],
};

const TZ: Specification = {
  id: "tz-csee", country: "TZ", board: "kenyan", name: "CSEE (Tanzania)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 2] },
  levels: [
    { id: "form1-2", tier: "junior", name: "Form 1–2", stages: [0, 2], difficulty: 0.4 },
    { id: "form4", tier: "higher", name: "Form 4 (CSEE)", stages: [0, 4], difficulty: 0.65 },
  ],
};

const UG: Specification = {
  id: "ug-uce", country: "UG", board: "kenyan", name: "UCE (Uganda)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 2] },
  levels: [
    { id: "s1-2", tier: "junior", name: "S1–S2", stages: [0, 2], difficulty: 0.4 },
    { id: "s4", tier: "higher", name: "S4 (UCE)", stages: [0, 4], difficulty: 0.65 },
  ],
};

const NG: Specification = {
  id: "ng-waec", country: "NG", board: "nigerian", name: "WAEC / NECO (Nigeria)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "jss", tier: "junior", name: "JSS 1–3 (BECE)", stages: [0, 2], difficulty: 0.42 },
    { id: "sss", tier: "higher", name: "SSS 1–3 (WAEC)", stages: [0, 4], difficulty: 0.7, include: ["trig-rule", "surds", "completing-square"] },
  ],
};

const GH: Specification = {
  id: "gh-wassce", country: "GH", board: "state", name: "WASSCE (Ghana)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "jhs", tier: "junior", name: "JHS 1–3 (BECE)", stages: [0, 2], difficulty: 0.42 },
    { id: "shs", tier: "higher", name: "SHS 1–3 (WASSCE)", stages: [0, 4], difficulty: 0.68 },
  ],
};

const PH: Specification = {
  id: "ph-deped", country: "PH", board: "philippine", name: "DepEd K-12 (Philippines)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "jhs", tier: "junior", name: "Junior High", stages: [0, 2], difficulty: 0.42 },
    { id: "shs", tier: "higher", name: "Senior High", stages: [0, 4], difficulty: 0.68 },
  ],
};

const ID: Specification = {
  id: "id-merdeka", country: "ID", board: "indonesian", name: "Kurikulum Merdeka (Indonesia)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "smp", tier: "junior", name: "SMP 7–9", stages: [0, 2], difficulty: 0.42 },
    { id: "sma", tier: "higher", name: "SMA 10–12", stages: [0, 4], difficulty: 0.68 },
  ],
};

const BR: Specification = {
  id: "br-enem", country: "BR", board: "brazilian", name: "ENEM / BNCC (Brazil)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "fundamental", tier: "junior", name: "Fundamental II", stages: [0, 2], difficulty: 0.42 },
    { id: "medio", tier: "higher", name: "Médio (ENEM)", stages: [0, 4], difficulty: 0.7 },
  ],
};

const MX: Specification = {
  id: "mx-sep", country: "MX", board: "mexican", name: "SEP (Mexico)",
  coverage: { maths: [0, 4], physics: [1, 3], chemistry: [0, 3], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "secundaria", tier: "junior", name: "Secundaria", stages: [0, 2], difficulty: 0.42 },
    { id: "prepa", tier: "higher", name: "Preparatoria", stages: [0, 4], difficulty: 0.7 },
  ],
};

const INDEPENDENT: Specification = {
  id: "any-independent", country: "XX", board: "state", name: "Independent · skills pathway",
  coverage: { maths: [0, 5], physics: [1, 3], chemistry: [0, 4], biology: [0, 3], computing: [0, 3] },
  levels: [
    { id: "foundations", tier: "primary", name: "Foundations", stages: [0, 1], difficulty: 0.35 },
    { id: "core", tier: "foundation", name: "Core", stages: [0, 3], difficulty: 0.55 },
    { id: "advanced", tier: "advanced", name: "Advanced", stages: [0, 5], difficulty: 0.8 },
  ],
};

export const SPECIFICATIONS: Specification[] = [
  UK, UK_ALEVEL, IGCSE, IB, US_CORE, SAT, US_AP, CA, ZA, AU, IE,
  IN_CBSE, IN_ICSE, PK, BD, KE, TZ, UG, NG, GH, PH, ID, BR, MX, INDEPENDENT,
];

/** Teaching-language settings a specification can recommend (§4): the terms a
 *  student's own curriculum uses. Empty means "use the genome's English
 *  vocabulary", which is the honest default. */
const BOARD_TERMS: Partial<Record<BoardId, TermProfile>> = {
  aqa: "uk", edexcel: "uk", ocr: "uk", wjec: "uk",
  cambridge: "uk", igcse: "uk", ib: "uk",
  commoncore: "us", collegeboard: "us",
  cbse: "india", icse: "india", matric: "india", "state": "common",
  kenyan: "africa", nigerian: "africa",
  bangladeshi: "india",
  philippine: "us", indonesian: "common", brazilian: "common", mexican: "common",
  caps: "uk", acara: "uk", canadian: "uk",
};

export type TermProfile = "uk" | "us" | "india" | "africa" | "common";

// Canonical (genome English) term → that curriculum's word. Only terms that
// actually occur in the genome or generated questions belong here — a mapping
// that never matches anything would be decoration, so the engine suite asserts
// every key below occurs in real content.
const TERMS: Record<TermProfile, Record<string, string>> = {
  uk: {}, // the genome is authored in UK English — nothing to substitute
  us: {
    "gradient": "slope",
    "simultaneous equations": "system of equations",
    "standard form": "scientific notation",
    "BIDMAS": "PEMDAS",
    "indices": "exponents",
    "index laws": "exponent rules",
    "factorise": "factor",
  },
  india: {
    // "gradient" → "slope" only. Substituting a phrase ("slope of the line")
    // produced "the slope of the line of the line" in real stems, because the
    // source already continues "... of the line". The engine suite now guards
    // against a replacement whose tail word repeats what follows the match.
    "BIDMAS": "BODMAS",
    "gradient": "slope",
  },
  africa: {
    "BIDMAS": "BODMAS",
  },
  common: {},
};

export function termProfileFor(board: BoardId | undefined): TermProfile {
  return (board && BOARD_TERMS[board]) || "common";
}

/** Every canonical → local substitution for a board (used by the UI to show
 *  the student which words their curriculum will use). */
export function termsFor(board: BoardId | undefined): Array<{ from: string; to: string }> {
  const profile = termProfileFor(board);
  return Object.entries(TERMS[profile]).map(([from, to]) => ({ from, to }));
}

/** Render text in the student's curriculum vocabulary. Word-boundary,
 *  case-insensitive on the first letter only, so "Gradient" becomes "Slope"
 *  and "gradient" becomes "slope" without touching identifiers. */
export function applyTerminology(text: string, board: BoardId | undefined): string {
  const profile = termProfileFor(board);
  const terms = TERMS[profile];
  if (!text || Object.keys(terms).length === 0) return text;
  let out = text;
  for (const [from, to] of Object.entries(terms)) {
    if (from === to) continue;
    const re = new RegExp(`\\b${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    out = out.replace(re, (hit) =>
      hit[0] === hit[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to);
  }
  return out;
}

// ── Lookups ─────────────────────────────────────────────────────────────────

export function specById(id: string | undefined): Specification | null {
  if (!id) return null;
  return SPECIFICATIONS.find((s) => s.id === id) ?? null;
}

export function specsFor(country: string): Specification[] {
  const direct = SPECIFICATIONS.filter((s) => s.country === country);
  if (direct.length > 0) return direct;
  // No national entry: international qualifications are still available, and
  // the independent pathway always is. Never leave a country with no route.
  return SPECIFICATIONS.filter((s) => s.country === "INT").concat(INDEPENDENT);
}

export function levelOf(spec: Specification, levelId: string | undefined): SpecLevel | null {
  if (!levelId) return null;
  return spec.levels.find((l) => l.id === levelId) ?? null;
}

/** Match a stored grade ("Form 4", "Class 10") to the level that teaches it. */
export function levelForGrade(spec: Specification, grade: string | undefined): SpecLevel | null {
  if (!grade) return null;
  const g = grade.toLowerCase();
  return spec.levels.find((l) => l.name.toLowerCase().includes(g) || g.includes(l.name.toLowerCase())) ?? null;
}

export interface ActiveSpec { spec: Specification; level: SpecLevel }

// ── ONE SUBJECT, ONE COURSE ──────────────────────────────────────────────────
//
// A learner does not sit one qualification. GCSE Maths (Foundation) alongside
// A-Level Physics is an ordinary combination, and a profile with a single flat
// course cannot express it — worse, one flat difficulty band pitches one of the
// two subjects at the wrong depth, and one flat board applies the wrong
// vocabulary to the other.
//
// So a course is per subject. These three functions are the only place the
// merge and the completeness rule live, so the enrolment flow, the API that
// backs it, every route that serves a question and every surface that states a
// learner's course answer it identically.

/** The subset of a profile that chooses a course. Anything carrying these
 *  fields — a ProfileState, a plain StudentProfile, a request body — resolves. */
export interface CourseFields {
  country?: string;
  board?: BoardId;
  exam?: string;
  grade?: string;
  spec?: string;
  specLevel?: string;
  examDate?: string;
  subjectCourses?: Partial<Record<SubjectId, SubjectCourse>>;
}

/**
 * The course in force for ONE subject.
 *
 * A per-subject entry wins FIELD BY FIELD, so an entry naming only a tier
 * inherits the country and board rather than losing them; no entry at all means
 * the learner's flat course, which is what every profile enrolled before
 * per-subject courses existed has.
 *
 * Callers with a subject in hand must pass it. `specForProfile(profile)` with no
 * subject is the single-course answer — correct for a reader that genuinely has
 * one course (a countdown, a headline) and wrong for anything pedagogical. */
export function courseForSubject(profile: CourseFields, subject?: SubjectId): CourseFields {
  if (!subject) return profile;
  const per = profile.subjectCourses?.[subject];
  if (per) return { ...profile, ...per };
  // No entry for this subject. The flat fields are this learner's course ONLY
  // when they never configured a per-subject course at all — a profile enrolled
  // before per-subject courses existed. Once one subject has its own course,
  // silence about another subject means NOT CHOSEN, not "the same as the first":
  // falling back there would hand Biology the Maths qualification, which is the
  // one-course-for-everything defect per-subject courses exist to remove. The
  // cleared fields make `courseGaps` name the subject, so a surface can ask
  // rather than plan work against a course nobody picked.
  const perSubject = profile.subjectCourses && Object.keys(profile.subjectCourses).length > 0;
  if (!perSubject) return profile;
  return {
    ...profile,
    spec: undefined,
    specLevel: undefined,
    board: undefined,
    exam: undefined,
    examDate: undefined,
  };
}

/** Does this qualification contain this subject at all?
 *
 *  The one question that stops a single selection from becoming a curriculum
 *  for every subject: the Digital SAT covers mathematics and nothing else, so a
 *  learner who picked it for Maths has not thereby chosen a Biology course.
 *  Everything that offers a choice (onboarding, /curriculum) and everything that
 *  resolves one (specForProfile, courseGaps) reads this. */
export function coversSubject(spec: Specification, subject: SubjectId): boolean {
  return Boolean(spec.coverage[subject]);
}

/** The qualifications a country offers THAT CONTAIN THIS SUBJECT, in the order
 *  the country lists them. Used by every picker, so a surface can never offer a
 *  course it would then have to refuse. The independent pathway covers every
 *  STEM subject, so this is never empty. */
export function specOptionsFor(country: string, subject: SubjectId): Specification[] {
  const eligible = specsFor(country).filter((s) => coversSubject(s, subject));
  return eligible.length > 0 ? eligible : [INDEPENDENT];
}

/** The specification a profile is following FOR ONE SUBJECT: an explicit choice
 *  first, then a board + exam + grade match, then the country's first
 *  specification at its lowest tier. Deterministic — same profile and subject
 *  always yield the same path. */
export function specForProfile(profile: CourseFields, subject?: SubjectId): ActiveSpec {
  const p = courseForSubject(profile, subject);
  const candidates = specsFor(p.country ?? "XX");
  const explicit = specById(p.spec);
  // An explicit choice is honoured only for a subject it actually contains. A
  // learner who named a maths-only qualification and also declared Biology has
  // not chosen a Biology course, and believing the maths one here is exactly how
  // one selection quietly becomes a curriculum for every subject — biology work
  // would then be planned against a coverage set with no biology in it.
  if (explicit && (!subject || coversSubject(explicit, subject))) {
    const lvl = levelOf(explicit, p.specLevel) ?? levelForGrade(explicit, p.grade) ?? explicit.levels[0];
    return { spec: explicit, level: lvl };
  }
  // With a subject in hand, only qualifications that teach it are candidates —
  // otherwise the country's first listing (often a maths paper) becomes the
  // fallback course for every other subject.
  const eligible = subject ? candidates.filter((s) => coversSubject(s, subject)) : candidates;
  const pool = eligible.length > 0 ? eligible : candidates;
  const byBoard = p.board ? pool.filter((s) => s.board === p.board) : [];
  const byExam = p.exam
    ? pool.filter((s) => s.board === p.board || s.id.includes(p.exam!.toLowerCase()))
    : [];
  const spec = byBoard[0] ?? byExam[0] ?? pool[0] ?? INDEPENDENT;
  const level = levelForGrade(spec, p.grade) ?? spec.levels[0];
  return { spec, level };
}

/** A course decision the engine genuinely cannot make without. */
export type CourseField = "country" | "grade" | "spec" | "specLevel";

/**
 * What one subject's course still has NOT decided, named field by field.
 *
 * The list is deliberately short, and it is the whole of the requirement: where
 * the learner studies (a mapped country, or the explicit independent route),
 * what year they are in, which qualification and tier they sit (or an explicit
 * independent course). Anything beyond that would be configuration for its own
 * sake.
 *
 * An empty `spec` is only honest where the learner's country offered no
 * qualifications to choose from. Where options existed, silence is not
 * "independent" — it is the silent default `specForProfile` used to fall back
 * to, and refusing it is the point: a recommendation must never rest on a
 * course the learner did not choose.
 */
export function courseGaps(profile: CourseFields, subject: SubjectId): CourseField[] {
  const c = courseForSubject(profile, subject);
  const route = c.country ? curriculumFor(c.country) ?? (c.country === "XX" ? INDEPENDENT_ROUTE : null) : null;
  const out: CourseField[] = [];
  if (!route) out.push("country");
  if (route && !route.grades.includes(c.grade ?? "")) out.push("grade");
  const spec = specById(c.spec);
  if (!spec) out.push("spec");
  else {
    // A qualification that does not contain the subject is not this subject's
    // course, whatever else it gets right.
    if (!spec.coverage[subject]) out.push("spec");
    if (!spec.levels.some((l) => l.id === c.specLevel)) out.push("specLevel");
  }
  return out;
}

/** Every DECLARED subject whose course is not yet complete, with the fields
 *  still missing. This is the gate enrolment (and the API behind it) uses, so a
 *  learner can never reach personalised work on a course nobody finished
 *  choosing. A learner who declared no subjects has nothing to configure. */
export function incompleteSubjects(
  profile: CourseFields & { subjects?: SubjectId[] },
): Array<{ subject: SubjectId; missing: CourseField[] }> {
  return (profile.subjects ?? [])
    .map((subject) => ({ subject, missing: courseGaps(profile, subject) }))
    .filter((x) => x.missing.length > 0);
}

/** The difficulty band practice should target for a profile (0–1). Consumed by
 *  generateQuestionAt, so a Foundation student and an A-Level student work the
 *  same concept at different depths. */
export function difficultyFor(active: ActiveSpec): number {
  return active.level.difficulty;
}

// ── Coverage ────────────────────────────────────────────────────────────────

function windowFor(spec: Specification, level: SpecLevel, subject: SubjectId): StageWindow | null {
  const specWin = spec.coverage[subject];
  if (!specWin) return null;
  const narrowed = level.narrow?.[subject] ?? level.stages;
  const min = Math.max(specWin[0], narrowed[0]) as StageId;
  const max = Math.min(specWin[1], narrowed[1]) as StageId;
  if (max < min) return null; // tier narrows the subject away entirely
  return [min, max];
}

/** Genome concepts this specification contains at this level. Resolution is
 *  against the real genome, so an id that does not exist cannot be claimed. */
export function coverageOf(active: ActiveSpec): Concept[] {
  const { spec, level } = active;
  const include = new Set(level.include ?? []);
  const exclude = new Set(level.exclude ?? []);
  const out: Concept[] = [];
  for (const subject of Object.keys(spec.coverage) as SubjectId[]) {
    const win = windowFor(spec, level, subject);
    if (!win) continue;
    for (const c of bySubject(subject)) {
      const inWindow = c.stage >= win[0] && c.stage <= win[1];
      if ((inWindow || include.has(c.id)) && !exclude.has(c.id)) out.push(c);
    }
  }
  // Preserve genome order (subject groups, then stage) rather than lookup order.
  const order = new Map(CONCEPTS.map((c, i) => [c.id, i]));
  return out.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export interface CoverageReport {
  covered: number;
  genomeTotal: number;
  bySubject: Record<string, number>;
  /** Concepts in the genome that this specification does not contain. Shown to
   *  the student so the platform never implies their course is the whole map. */
  outside: Concept[];
}

export function coverageReport(active: ActiveSpec): CoverageReport {
  const covered = coverageOf(active);
  const ids = new Set(covered.map((c) => c.id));
  const bySubject: Record<string, number> = {};
  for (const c of covered) bySubject[c.subject] = (bySubject[c.subject] ?? 0) + 1;
  return {
    covered: covered.length,
    genomeTotal: CONCEPTS.length,
    bySubject,
    outside: CONCEPTS.filter((c) => !ids.has(c.id)),
  };
}

/** Is this concept part of the student's specification? The next-step engine
 *  prefers in-specification work but never hides out-of-specification evidence
 *  (a misconception found in any concept still gets remediated). */
export function inSpecification(active: ActiveSpec, conceptId: string): boolean {
  const c = CONCEPTS.find((x) => x.id === conceptId);
  if (!c) return false;
  const win = windowFor(active.spec, active.level, c.subject);
  if (!win) return false;
  if (active.level.exclude?.includes(conceptId)) return false;
  return (c.stage >= win[0] && c.stage <= win[1]) || (active.level.include?.includes(conceptId) ?? false);
}

/** Grade options a student can pick for their country, for the enrolment UI. */
export function levelsOf(spec: Specification): SpecLevel[] {
  return spec.levels;
}
