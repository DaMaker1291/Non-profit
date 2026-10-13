// ─────────────────────────────────────────────────────────────────────────────
// THE CURRICULUM REGISTRY (§1, §7, §17) — country → education system → years →
// qualifications → specifications.
//
// WHY THIS EXISTS. Every layer below asked one part of "what does this learner's
// school look like?" and the COUNTRY was the only key any of them had:
// lib/curriculum.ts mapped a country code to ONE year list and ONE board list,
// and lib/specifications.ts mapped a country code to a flat list of
// qualifications. That is right while a country has exactly one general
// secondary system, and it is wrong the moment one does not.
//
// Cameroon is the reference case, and it is why this is a data model rather than
// an exception. Its Ministry of Secondary Education runs two systems side by
// side: an Anglophone system (five years of first cycle to the GCE Ordinary
// Level, two more to the GCE Advanced Level) and a Francophone system (four
// years to the BEPC, then the Probatoire and the Baccalauréat). A learner there
// does not "follow Cameroon" — they follow one of two systems, and a single
// country → route record cannot say which. Measured before this file existed:
// `curriculumFor("CM")` was null, so a Cameroonian learner was shown the
// INDEPENDENT route's band names (Foundations / Core / Advanced) as if they were
// school classes, and `specsFor("CM")` fell back to Cambridge IGCSE and the IB —
// the international qualifications that exist as ALTERNATIVES, handed over as
// the automatic answer.
//
// THE RULE THIS FILE ENCODES: **the country decides which pathways are
// available; the pathway decides which years, qualifications and specifications
// the learner is actually offered.** Cambridge IGCSE and the IB stay available
// to everybody, and stop being the fallback for everybody.
//
// WHAT IS DELIBERATELY *NOT* CLAIMED, and which field keeps each claim honest:
//
//   · `recordReview` — how far the STRUCTURAL record (years, qualifications,
//     boards, languages, sources) has been checked. "mapped" means the record
//     exists because the country already had a route in production, and its
//     citations have not been collected yet. The gate refuses to let such a
//     record claim "researched".
//   · `mappingReview` — how far the CONCEPT MAPPING (`specificationIds`) has
//     been checked. Nothing here is above "mapped": OpenMind mapping a
//     qualification onto the genome is not the same claim as a subject
//     specialist having read the mapping, and "verified" is not available
//     until a human has.
//   · No equivalence between qualifications is asserted anywhere. A Cameroon GCE
//     grade is not converted into a GCSE grade, and no pathway claims the two
//     share a syllabus. The generic tier on a specification level is OpenMind's
//     INTERNAL depth band — it chooses the difficulty target and whether stage-0
//     arithmetic is in scope — and it is not an examination comparison.
//
// The country's DISPLAY NAME is not duplicated here: lib/i18n.ts#COUNTRIES owns
// the picker's names, and a second copy in this file would be a second owner of
// one string. The gate joins the two on the code instead.
//
// ADDING A COUNTRY is a DATA change to this file plus the specifications it
// lists — never a conditional in a page. The gate (scripts/curriculum-gate.mjs)
// is what makes that safe: it fails the build on a pathway with no source, a
// specification no pathway reaches, a year list with a hole, or a national route
// that silently resolves to Cambridge IGCSE.
// ─────────────────────────────────────────────────────────────────────────────
import type { BoardId } from "../types";

export type { BoardId };

export interface BoardRef { id: BoardId; name: string; exams: string[] }

/**
 * HOW FAR A RECORD HAS BEEN CHECKED. Ordered weakest → strongest; the gate
 * compares by this order, so a weaker label can never be read as a stronger one.
 *
 *   unmapped   — no national pathway is recorded. International and independent
 *                pathways are still available and are what the learner is
 *                offered, with the limitation stated.
 *   mapped     — the record exists (years, qualifications, specifications) and
 *                is in production, but its structural citations are not on file.
 *                Every route that predates this registry is here, including the
 *                19 national ones: they were authored from the systems
 *                themselves, and nobody has collected the references.
 *   researched — the structure has at least one authoritative source URL on
 *                file. It does NOT say the concept mapping has been reviewed.
 *   reviewed   — a subject specialist has read the mapping onto the genome.
 *   verified   — reviewed, released, and carrying a learner-facing statement of
 *                what is covered.
 */
export type ReviewStatus = "unmapped" | "mapped" | "researched" | "reviewed" | "verified";

export const REVIEW_ORDER: ReviewStatus[] = ["unmapped", "mapped", "researched", "reviewed", "verified"];

export function reviewAtLeast(status: ReviewStatus, min: ReviewStatus): boolean {
  return REVIEW_ORDER.indexOf(status) >= REVIEW_ORDER.indexOf(min);
}

/** `national` is the country's own system; `international` is a programme a
 *  learner may follow anywhere (Cambridge, IB); `independent` is the skills
 *  pathway, which is deliberately not a school system and says so. */
export type PathwayType = "national" | "international" | "independent";

/** One year of a system, in the system's OWN name — "Form 5", "3e",
 *  "Year 8". These are the strings the learner declares, so they are data and
 *  never translated: a Cameroonian class is called "Form 5" in every language. */
export interface SchoolYear {
  id: string;
  label: string;
  /** Position in the pathway, 1-based and contiguous — the gate asserts it. */
  sequence: number;
}

/** An examination or award a pathway leads to, and the specifications that map
 *  it onto the genome. `stage` names the point in the pathway where it is sat,
 *  in the system's own words. */
export interface PathwayQualification {
  id: string;
  name: string;
  stage: string;
  /** Specification ids (lib/specifications.ts). At least one, and every id must
   *  exist — the gate refuses a pathway that names a course nobody can be
   *  enrolled in. */
  specIds: string[];
}

export interface CurriculumPathway {
  id: string;
  /** The country the pathway belongs to, or "INT" for a programme that is
   *  available in every country. */
  countryCode: string;
  /** Display name. A hybrid on purpose: the proper nouns ("Cambridge IGCSE",
   *  "Baccalauréat") are data, exactly like a specification's own name, and the
   *  surrounding words are kept short enough to read in any of the 15
   *  interface languages. It is never a school year and never a translated tier
   *  label. */
  name: string;
  pathwayType: PathwayType;
  /** The language this system teaches in, when the system itself implies one
   *  (Cameroon's Francophone system). Absent = the pathway does not imply a
   *  teaching language, and the learner's own choices stand. */
  language?: string;
  schoolYears: SchoolYear[];
  qualifications: PathwayQualification[];
  /** Every specification this pathway can lead to. Reachability is asserted:
   *  a specification no pathway lists is a course nobody can choose. */
  specificationIds: string[];
  /** The awarding bodies this pathway offers. Empty for a pathway with no
   *  examination board of its own (the independent skills pathway). */
  boards: BoardRef[];
  /** Authoritative references for the STRUCTURE above. Required by the gate for
   *  `recordReview >= "researched"`, and never required to be non-empty for a
   *  legacy "mapped" record — the honest position is to say they are missing. */
  sourceUrls: string[];
  recordReview: ReviewStatus;
  mappingReview: ReviewStatus;
  /** Concepts this course enters the genome through. Recorded for the record;
   *  readers today derive entry from coverage, so nothing reads it yet. */
  entryConcepts?: string[];
  notes?: string;
}

export interface CountryCurriculum {
  countryCode: string;
  /** The country's own systems. Two or more means the learner MUST choose — a
   *  country with two systems and no default can answer no question about years
   *  or qualifications until they have. */
  nationalPathways: CurriculumPathway[];
  /** Programmes offered in this country that are not its national curriculum. */
  internationalPathwayIds: string[];
  /** The pathway a learner is placed on WITHOUT choosing one, or null when no
   *  defensible default exists (a country with two national systems: choosing
   *  one for the learner is the defect this file exists to remove). */
  defaultPathwayId: string | null;
  notes?: string;
}

// ── The pathways that are available in every country ────────────────────────
//
// ONE definition each, referenced by every country record, so "available
// internationally" is a fact about the programme rather than 70 copies of it.

const years = (...labels: string[]): SchoolYear[] =>
  labels.map((label, i) => ({ id: slug(label), label, sequence: i + 1 }));

/** A stable id from a label: "Form 1" → "form-1", "3e" → "3e". Accents and
 *  punctuation are dropped rather than transliterated, so ids stay ASCII. */
function slug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const INTERNATIONAL_PATHWAY: CurriculumPathway = {
  id: "int-international",
  countryCode: "INT",
  name: "International · Cambridge / IB",
  pathwayType: "international",
  schoolYears: years("Year 10", "Year 11", "Year 12", "Year 13"),
  qualifications: [
    { id: "igcse", name: "Cambridge IGCSE", stage: "Years 10–11", specIds: ["int-igcse"] },
    { id: "ib", name: "International Baccalaureate", stage: "Years 12–13", specIds: ["int-ib"] },
  ],
  specificationIds: ["int-igcse", "int-ib"],
  boards: [
    { id: "cambridge", name: "Cambridge Assessment International Education", exams: ["IGCSE", "AS/A Level"] },
    { id: "ib", name: "International Baccalaureate", exams: ["MYP", "Diploma Programme"] },
  ],
  // Cambridge's and the IB's own published programme pages would be the sources
  // here; they are not on file, so the record says "mapped" rather than
  // pretending otherwise. One line to fix, and the gate makes it visible.
  sourceUrls: [],
  recordReview: "mapped",
  mappingReview: "mapped",
  entryConcepts: ["fractions", "algebra-expressions", "linear-equations"],
};

export const INDEPENDENT_PATHWAY: CurriculumPathway = {
  id: "int-independent",
  countryCode: "XX",
  name: "Independent · skills pathway",
  pathwayType: "independent",
  schoolYears: years("Foundations", "Core", "Advanced"),
  qualifications: [
    { id: "skills", name: "Independent skills pathway", stage: "Any stage", specIds: ["any-independent"] },
  ],
  specificationIds: ["any-independent"],
  boards: [],
  sourceUrls: [],
  recordReview: "mapped",
  mappingReview: "mapped",
  entryConcepts: ["place-value", "fractions", "linear-equations"],
  notes:
    "Not a school system and never presented as one: its years are bands, not " +
    "classes. It is the pathway for a learner whose country has no mapped " +
    "national route and who has not chosen an international programme, and it " +
    "is the only pathway whose years are OpenMind's own vocabulary.",
};

export const SHARED_PATHWAYS: CurriculumPathway[] = [INTERNATIONAL_PATHWAY, INDEPENDENT_PATHWAY];

// ── Cameroon: the reference case ────────────────────────────────────────────
//
// Two systems, one country. Both are GENERAL secondary education; the technical
// and vocational routes exist in Cameroon as well and are NOT modelled here —
// which is stated rather than implied, because a learner looking for them should
// find the limit named.
//
// The sources are MINESEC's own descriptions of each subsystem. They establish
// the STRUCTURE this record encodes (the years of each cycle and the
// examinations that end them). They do not establish the concept mapping: which
// genome concept a Cameroonian syllabus examines, and how deeply, is OpenMind's
// own mapping and is marked "mapped" — awaiting a subject specialist.

const CAMEROON_SOURCES = {
  anglophone:
    "https://www.minesec.gov.cm/web/index.php/en/systeme-educatif-en/offre-de-formation-en/sous-systeme-anglophone-en",
  francophone:
    "https://www.minesec.gov.cm/web/index.php/fr/systeme-educatif/offre-de-formation/sous-systeme-francophone",
};

export const CM_ANGLOPHONE: CurriculumPathway = {
  id: "cm-anglophone-general-secondary",
  countryCode: "CM",
  name: "Cameroon · Anglophone system (GCE)",
  pathwayType: "national",
  language: "en",
  // Five years of first cycle to the GCE Ordinary Level, then two years to the
  // GCE Advanced Level. Every year of both cycles is offered: a Form 2 learner
  // is working towards the O Level and must be able to say so.
  schoolYears: years("Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Lower Sixth", "Upper Sixth"),
  qualifications: [
    { id: "gce-o", name: "GCE Ordinary Level", stage: "End of Form 5", specIds: ["cm-gce-o"] },
    { id: "gce-a", name: "GCE Advanced Level", stage: "End of Upper Sixth", specIds: ["cm-gce-a"] },
  ],
  specificationIds: ["cm-gce-o", "cm-gce-a"],
  boards: [
    { id: "gce", name: "Cameroon GCE Board (MINESEC)", exams: ["GCE O Level", "GCE A Level"] },
  ],
  sourceUrls: [CAMEROON_SOURCES.anglophone],
  recordReview: "researched",
  mappingReview: "mapped",
  entryConcepts: ["fractions", "linear-equations", "quadratics"],
};

export const CM_FRANCOPHONE: CurriculumPathway = {
  id: "cm-francophone-general-secondary",
  countryCode: "CM",
  name: "Cameroun · système francophone (BEPC · Probatoire · Baccalauréat)",
  pathwayType: "national",
  language: "fr",
  // Four years of premier cycle to the BEPC, then three years of second cycle
  // through the Probatoire to the Baccalauréat.
  schoolYears: years("6e", "5e", "4e", "3e", "2nde", "1re", "Terminale"),
  qualifications: [
    { id: "bepc", name: "BEPC", stage: "End of 3e", specIds: ["cm-bepc"] },
    { id: "probatoire", name: "Probatoire", stage: "End of 1re", specIds: ["cm-probatoire"] },
    { id: "bac", name: "Baccalauréat", stage: "End of Terminale", specIds: ["cm-bac"] },
  ],
  specificationIds: ["cm-bepc", "cm-probatoire", "cm-bac"],
  boards: [
    { id: "minesec", name: "MINESEC (Cameroon) — Francophone system", exams: ["BEPC", "Probatoire", "Baccalauréat"] },
  ],
  sourceUrls: [CAMEROON_SOURCES.francophone],
  recordReview: "researched",
  mappingReview: "mapped",
  entryConcepts: ["fractions", "algebra-expressions", "linear-equations"],
};

// ── The countries already in production ─────────────────────────────────────
//
// ONE national pathway each, carrying the year list and the awarding bodies the
// product already served. Nothing here is research: it is the record that
// existed, moved into the one registry that now owns it, and marked "mapped"
// because its citations have not been collected. The gate reports that gap
// rather than hiding it, and the year sequences are asserted exactly as before.
//
// ORDER IS LOAD-BEARING for `boardName`: a board id is not globally unique
// ("state" is India's, Ghana's, Ireland's and Pakistan's; "kenyan" is Kenya's,
// Tanzania's and Uganda's), so the first binding wins and must stay first. The
// order below is the order the route table was written in.

interface NationalRoute {
  code: string;
  system: string;
  grades: string[];
  boards: BoardRef[];
  specs: string[];
  entry: string[];
  /** Where the system's structure was read from, where a reference is on file.
   *  Empty for the routes that predate the registry. */
  sources?: string[];
  recordReview?: ReviewStatus;
}

const NATIONAL_ROUTES: NationalRoute[] = [
  { code: "KE", system: "Kenya · Secondary", grades: ["Form 1", "Form 2", "Form 3", "Form 4"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["ke-kcse"], boards: [{ id: "kenyan", name: "Kenya National Examinations (KNEC)", exams: ["KCPE", "KCSE Form 4"] }] },
  { code: "IN", system: "India · Secondary", grades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"], entry: ["fractions", "linear-equations", "triangles"], specs: ["in-cbse", "in-icse"], boards: [
    { id: "cbse", name: "Central Board of Secondary Education (CBSE)", exams: ["AISSE Class 10", "AISSCE Class 12"] },
    { id: "icse", name: "Indian Certificate of Secondary Education (ICSE)", exams: ["ICSE Class 10", "ISC Class 12"] },
    { id: "state", name: "State board", exams: ["SSC / HSC"] },
  ]},
  { code: "PH", system: "Philippines · JHS/SHS", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "integers", "linear-equations"], specs: ["ph-deped"], boards: [{ id: "philippine", name: "DepEd K-12", exams: ["DepEd National Assessments"] }] },
  { code: "BD", system: "Bangladesh · Secondary", grades: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"], entry: ["fractions", "percentages", "linear-equations"], specs: ["bd-ssc"], boards: [
    { id: "bangladeshi", name: "Board of Intermediate and Secondary Education", exams: ["JSC", "SSC"] },
  ]},
  { code: "NG", system: "Nigeria · JSS/SSS", grades: ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"], entry: ["fractions", "percentages", "linear-equations"], specs: ["ng-waec"], boards: [{ id: "nigerian", name: "West African Examinations Council (WAEC) / NECO", exams: ["BECE", "WAEC / NECO SSSCE"] }] },
  { code: "GH", system: "Ghana · JHS/SHS", grades: ["JHS 1", "JHS 2", "JHS 3", "SHS 1", "SHS 2", "SHS 3"], entry: ["fractions", "integers", "linear-equations"], specs: ["gh-wassce"], boards: [{ id: "state", name: "Ghana Education Service", exams: ["BECE", "WASSCE"] }] },
  { code: "TZ", system: "Tanzania · Secondary", grades: ["Form 1", "Form 2", "Form 3", "Form 4"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["tz-csee"], boards: [{ id: "kenyan", name: "Tanzania National Examinations (NECTA)", exams: ["PSLE", "CSEE"] }] },
  { code: "UG", system: "Uganda · Secondary", grades: ["S1", "S2", "S3", "S4"], entry: ["fractions", "linear-equations", "triangles"], specs: ["ug-uce"], boards: [{ id: "kenyan", name: "Uganda National Examinations Board (UNEB)", exams: ["PLE", "UCE", "UACE"] }] },
  { code: "PK", system: "Pakistan · Secondary", grades: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"], entry: ["fractions", "percentages", "linear-equations"], specs: ["pk-matric"], boards: [
    { id: "matric", name: "Matriculation (Punjab/Sindh/Balochistan)", exams: ["Matric"] },
    { id: "state", name: "Federal Board / Cambridge", exams: ["O/A Levels"] },
  ]},
  { code: "ID", system: "Indonesia · SMP/SMA", grades: ["SMP 7", "SMP 8", "SMP 9", "SMA 10", "SMA 11", "SMA 12"], entry: ["fractions", "integers", "linear-equations"], specs: ["id-merdeka"], boards: [{ id: "indonesian", name: "Kurikulum Merdeka", exams: ["US SMP", "US SMA"] }] },
  { code: "BR", system: "Brazil · Fundamental/Médio", grades: ["6º ano", "7º ano", "8º ano", "9º ano", "1º médio", "2º médio", "3º médio"], entry: ["fractions", "percentages", "linear-equations"], specs: ["br-enem"], boards: [{ id: "brazilian", name: "INEP / ENEM", exams: ["BNCC", "ENEM"] }] },
  { code: "MX", system: "Mexico · Secundaria", grades: ["1º", "2º", "3º"], entry: ["fractions", "integers", "linear-equations"], specs: ["mx-sep"], boards: [{ id: "mexican", name: "SEP / ENP", exams: ["ENP"] }] },
  { code: "GB", system: "United Kingdom · Secondary", grades: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["uk-gcse", "uk-alevel"], boards: [
    { id: "aqa", name: "AQA", exams: ["GCSE", "A-Level"] },
    { id: "edexcel", name: "Pearson Edexcel", exams: ["GCSE", "A-Level"] },
    { id: "ocr", name: "OCR", exams: ["GCSE", "A-Level"] },
    { id: "wjec", name: "WJEC / Eduqas", exams: ["GCSE", "A-Level"] },
  ]},
  { code: "IE", system: "Ireland · Junior/Senior Cycle", grades: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["ie-junior"], boards: [{ id: "state", name: "NCCA (Junior Cycle / Leaving Certificate)", exams: ["Junior Cycle", "Leaving Certificate"] }] },
  { code: "US", system: "United States · Middle/High School", grades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["us-core", "us-sat", "us-ap"], boards: [
    { id: "commoncore", name: "Common Core State Standards", exams: ["State assessments"] },
    { id: "collegeboard", name: "College Board", exams: ["SAT", "AP"] },
  ]},
  { code: "CA", system: "Canada · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["ca-provincial"], boards: [{ id: "canadian", name: "Provincial curriculum", exams: ["Provincial diploma exams"] }] },
  { code: "AU", system: "Australia · Secondary", grades: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["au-acara"], boards: [{ id: "acara", name: "Australian Curriculum (ACARA)", exams: ["NAPLAN", "ATAR"] }] },
  { code: "ZA", system: "South Africa · Senior/FET", grades: ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["za-nsc"], boards: [{ id: "caps", name: "CAPS / National Senior Certificate", exams: ["NSC (Matric)"] }] },
];

function pathwayFromRoute(route: NationalRoute): CurriculumPathway {
  return {
    id: `${route.code.toLowerCase()}-national`,
    countryCode: route.code,
    name: route.system,
    pathwayType: "national",
    schoolYears: years(...route.grades),
    // EMPTY ON PURPOSE. The learner-facing name of a qualification is owned by
    // the specification itself (lib/specifications.ts), and copying it here
    // would be a second owner of one string. A pathway that has actually been
    // researched (Cameroon's) names its own examinations and the point in the
    // system they end; the gate demands that of a "researched" record and not of
    // an inherited one, which is how the report tells the two apart.
    qualifications: [],
    specificationIds: route.specs,
    boards: route.boards,
    sourceUrls: route.sources ?? [],
    recordReview: route.recordReview ?? "mapped",
    mappingReview: "mapped",
    entryConcepts: route.entry,
    notes:
      "Record inherited from the route table this registry replaces: the years and " +
      "awarding bodies were already in production, and the structural citations have " +
      "not been collected. The qualification NAMES live on the specifications " +
      "themselves (lib/specifications.ts), which is what a learner is shown.",
  };
}

/** A country the picker offers with NO national pathway recorded. Listing them
 *  explicitly (rather than inferring "anything unlisted is unmapped") is what
 *  lets the gate tell "we have not researched this yet" apart from "somebody
 *  forgot to add it at all", which is the difference the report has to show. */
const UNRESEARCHED_COUNTRIES: string[] = [
  // Africa
  "ET", "EG", "MA", "RW", "ZM", "ZW", "MW", "ML", "SN", "CI", "NE", "BF", "SO", "SD",
  // Asia & Middle East
  "VN", "CN", "JP", "KR", "TR", "IR", "AF", "YE", "IQ", "SY", "JO", "LB", "NP", "LK",
  "MM", "KH", "LA", "MN", "KZ", "UZ", "AE", "SA", "MY", "TH", "SG",
  // Europe
  "ES", "FR", "DE", "IT", "PL", "UA", "NL", "SE", "NO", "DK", "FI", "GR", "RO", "HU", "CZ", "CH",
  // Americas
  "CO", "AR", "PE", "HT", "BO", "EC", "GT", "HN", "NI", "SV", "DO", "CL",
];

const CURRICULA: Record<string, CountryCurriculum> = {
  ...Object.fromEntries(
    NATIONAL_ROUTES.map((r) => [
      r.code,
      {
        countryCode: r.code,
        nationalPathways: [pathwayFromRoute(r)],
        internationalPathwayIds: ["int-international", "int-independent"],
        defaultPathwayId: `${r.code.toLowerCase()}-national`,
      } satisfies CountryCurriculum,
    ]),
  ),
  // Cameroon: TWO national systems and NO default. This is the one record for
  // which "which pathway?" is a question the learner must answer before the
  // years and the qualifications mean anything.
  CM: {
    countryCode: "CM",
    nationalPathways: [CM_ANGLOPHONE, CM_FRANCOPHONE],
    internationalPathwayIds: ["int-international", "int-independent"],
    defaultPathwayId: null,
    notes:
      "Two general secondary systems run side by side, and neither is a fallback " +
      "for the other: the Anglophone system ends in GCE O/A Level, the " +
      "Francophone system in the BEPC, Probatoire and Baccalauréat. Technical and " +
      "vocational routes are not modelled here.",
  },
  // International: the programme is the route. `defaultPathwayId` is the
  // international pathway so this code keeps meaning what it always did.
  INT: {
    countryCode: "INT",
    nationalPathways: [],
    internationalPathwayIds: ["int-international", "int-independent"],
    defaultPathwayId: "int-international",
  },
  // "Prefer not to say": no national pathway, no default — the same state an
  // unlisted country is in, and for the same reason (the learner has not told us
  // where they study, so nothing may be assumed about it).
  XX: {
    countryCode: "XX",
    nationalPathways: [],
    internationalPathwayIds: ["int-international", "int-independent"],
    defaultPathwayId: null,
  },
};

/** Every country code the registry can answer for, plus the "no national
 *  route" list. Read by the audit report, never by a page. */
export const RESEARCHED_CODES: string[] = Object.keys(CURRICULA);
export const UNRESEARCHED_CODES: string[] = [...UNRESEARCHED_COUNTRIES];
export const SHARED_PATHWAY_IDS: string[] = SHARED_PATHWAYS.map((p) => p.id);

const ALL_PATHWAYS: CurriculumPathway[] = [
  ...Object.values(CURRICULA).flatMap((c) => c.nationalPathways),
  ...SHARED_PATHWAYS,
];

export function pathwayById(id: string | undefined | null): CurriculumPathway | null {
  if (!id) return null;
  return ALL_PATHWAYS.find((p) => p.id === id) ?? null;
}

export function allPathways(): CurriculumPathway[] {
  return ALL_PATHWAYS;
}

/** The country record, or null when the country is not in the registry at all.
 *  A null here is NOT "no pathway available" — it is "no record", and the
 *  difference is exactly what the report prints. */
export function countryRecord(code: string | undefined | null): CountryCurriculum | null {
  if (!code) return null;
  return CURRICULA[code] ?? null;
}

/** Every pathway a learner in this country may choose, in the order a picker
 *  should offer them: the country's own systems first, then the international
 *  programmes, then the independent pathway. A country with no record still gets
 *  the last three — never an empty list, because `specsFor` must never leave a
 *  learner with no course. */
export function pathwayChoices(code: string | undefined | null): CurriculumPathway[] {
  const rec = countryRecord(code);
  const ints = (rec?.internationalPathwayIds ?? ["int-international", "int-independent"])
    .map((id) => pathwayById(id))
    .filter((p): p is CurriculumPathway => Boolean(p));
  if (!rec) return ints.length ? ints : [INDEPENDENT_PATHWAY];
  const shared = ints.filter((p) => p.countryCode !== rec.countryCode);
  return [...rec.nationalPathways, ...shared.filter((p) => p.pathwayType === "international"),
    ...shared.filter((p) => p.pathwayType === "independent")];
}

/** The pathway a learner is placed on WITHOUT choosing one. Null means the
 *  choice is real and must be made: two national systems, or a country with no
 *  national route and no default to pretend to. */
export function defaultPathwayFor(code: string | undefined | null): CurriculumPathway | null {
  const rec = countryRecord(code);
  if (!rec) return pathwayById("int-independent");
  if (rec.defaultPathwayId) return pathwayById(rec.defaultPathwayId);
  if (rec.nationalPathways.length === 1) return rec.nationalPathways[0];
  return null;
}

/** Countries whose own education system is recorded. The one owner of the
 *  number the learner-facing coverage sentence prints. */
export function nationalRouteCodes(): string[] {
  return Object.values(CURRICULA)
    .filter((c) => c.nationalPathways.length > 0)
    .map((c) => c.countryCode);
}

/** Does this choice genuinely need to be asked for? True when the country has
 *  two or more national systems (Cameroon), and false when one system settles it
 *  or when the international/independent pathways are the honest default. */
export function pathwayChoiceRequired(code: string | undefined | null): boolean {
  const rec = countryRecord(code);
  return Boolean(rec && rec.nationalPathways.length > 1);
}

/** Should a learner in this country be ASKED which education system they follow?
 *  True where the answer is not already settled by the country — none recorded,
 *  or more than one for the country to run. A country with exactly one recorded
 *  national system is not asked: a screen offering a UK learner the choice of
 *  "the UK system" is a question with one answer, and the international
 *  programmes stay reachable from /curriculum (the screen whose job is changing
 *  a course) rather than being a step in every enrolment. */
export function pathwayQuestionNeeded(code: string | undefined | null): boolean {
  const rec = countryRecord(code);
  if (!rec) return true; // unresearched: the honest offer is the explicit choice
  return rec.nationalPathways.length !== 1;
}

/** The pathway a select should be SHOWING before the learner touches it.
 *
 *  The country's own system when it has exactly one — so the field is filled and
 *  `Next` is not waiting on a question nobody asked. NOTHING when the country
 *  has more than one (that is the question) and nothing when it has none: for an
 *  unresearched country the international and independent courses are ALL
 *  offered, and preselecting the skills pathway there would narrow a learner's
 *  choices to one before they had said anything. */
export function initialPathwayFor(code: string | undefined | null): string {
  const rec = countryRecord(code);
  if (!rec || rec.nationalPathways.length !== 1) return "";
  return rec.defaultPathwayId ?? "";
}

/** A country's own systems. Empty for an unresearched country, which is how a
 *  surface tells "we have no national route for you" apart from "choose one of
 *  ours" without a second list. */
export function nationalPathwaysFor(code: string | undefined | null): CurriculumPathway[] {
  return countryRecord(code)?.nationalPathways ?? [];
}

/** THE SENTENCE A SURFACE SHOWS ABOUT HOW FAR THIS MAPPING HAS BEEN CHECKED,
 *  as a dictionary key — never as a literal in a component, so the label cannot
 *  drift from the record.
 *
 *  This exists because "there is a route for your country" and "a specialist has
 *  read our mapping of it" are different claims, and the difference is invisible
 *  to a learner unless a surface says it. Before this, every one of the 20
 *  pathways rendered as an ordinary course while 20 of them had no source on
 *  file and none had a reviewed mapping — the same defect as answering a French
 *  learner with Cambridge IGCSE, one layer quieter. */
export function mappingReviewKey(pathway: CurriculumPathway | null | undefined): string {
  if (!pathway) return "";
  if (reviewAtLeast(pathway.mappingReview, "reviewed")) {
    return pathway.mappingReview === "verified" ? "course.mapVerified" : "course.mapReviewed";
  }
  return "course.mapPending";
}

/** The pathway a profile holds, if it is a real pathway AND one this country
 *  offers. A pathway from another country is not "chosen" — it is stale, and
 *  treating it as chosen is how a GCSE ends up scoping a Cameroonian course. */
export function pathwayForCountry(
  code: string | undefined | null,
  pathwayId: string | undefined | null,
): CurriculumPathway | null {
  const pw = pathwayById(pathwayId);
  if (!pw) return null;
  if (pw.pathwayType !== "national") return pw;
  return pw.countryCode === code ? pw : null;
}
