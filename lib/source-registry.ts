// ─────────────────────────────────────────────────────────────────────────────
// THE SOURCE AND RIGHTS REGISTRY — what OpenMind may reuse, and what it may
// only cite.
//
// This is deliberately separate from lib/content-rights.ts. That module answers
// "may this QUESTION BANK item be hosted/displayed?" for an origin. This one
// answers the harder question the curriculum/OER strategy raises: for a
// specific external SOURCE — a syllabus, a textbook, an OER provider, a
// platform — what is the licence, is the proof on file, and may its expression
// be ingested into a hosted lesson?
//
// THE RULE THAT MATTERS: an unknown licence blocks ingestion. A public
// download, a free login, or a ministry logo is not a reuse licence. A source
// with a known Creative Commons basis but no primary proof on file is also
// blocked for ingestion — the registry records the research, not a permission
// it has not seen.
//
// The 12 pilot lessons are OpenMind-authored. Their curriculum references are
// official syllabus documents used for citation only; no NCERT/CBSE/DIKSHA
// expression is copied. That is why the pilot is clear while every external
// provider below is link-only or blocked.
// ─────────────────────────────────────────────────────────────────────────────

export type SourceKind =
  | "authored"
  | "curriculum"
  | "official_textbook"
  | "oer"
  | "platform"
  | "metadata";

/** The rights basis, not a claim that OpenMind has the proof in hand. */
export type RightsBasis =
  | "openmind-authored"
  | "public-domain"
  | "cc0"
  | "cc-by"
  | "cc-by-sa"
  | "cc-by-nc"
  | "cc-by-nc-sa"
  | "cc-by-nd"
  | "cc-by-nc-nd"
  | "all-rights-reserved"
  | "official-reference"
  | "unknown";

export type UseAction =
  | "link"
  | "display"
  | "host"
  | "adapt"
  | "translate"
  | "offline"
  | "redistribute"
  | "trainAI";

export type RightsDecision =
  | "allowed"
  | "allowed-with-obligations"
  | "link-only"
  | "blocked";

export interface RightsRecord {
  readonly basis: RightsBasis;
  readonly licenceUri: string | null;
  readonly rightsHolder: string;
  /** `recorded` means the primary licence text/record is on file. The strategy
   *  research alone is `secondary-research`; it never opens ingestion. */
  readonly proof: "recorded" | "secondary-research" | "not-recorded";
  readonly note?: string;
}

export interface SourceRecord {
  readonly id: string;
  readonly kind: SourceKind;
  readonly title: string;
  readonly publisher: string;
  /** Country/board code, `INT` for a multi-country source, or `GLOBAL` for
   *  OpenMind's own material. */
  readonly jurisdiction: string;
  /** Resource provenance tracking
   *  - creator: person or organisation that created the original resource
   *  - version: version number or identifier of the source material
   *  - licence: the legal licence under which the resource is provided
   *  - permissions: specific reuse/adapter rights granted
   *  - adaptationRights: whether derivative works are permitted and under what conditions
   */
  readonly creator?: string;
  readonly version?: string;
  readonly licence?: string;
  readonly permissions?: string;
  readonly adaptationRights?: string;
  /** null for OpenMind-authored material, which has no external landing page. */
  readonly url: string | null;
  readonly retrievedAt: string;
  readonly edition?: string;
  readonly language?: string;
  readonly rights: RightsRecord;
  readonly verification: "document" | "portal" | "metadata" | "unverified";
  readonly note: string;
}

export interface UseDecision {
  readonly status: RightsDecision;
  readonly reasons: readonly string[];
  readonly obligations: readonly string[];
}

const ATTRIBUTION = "Preserve the creator, source URL and licence notice.";
const SHARE_ALIKE = "Distribute any adaptation under the same licence.";
const NONCOMMERCIAL = "Use only in a non-commercial deployment.";
const NO_DERIVATIVES = "Do not adapt or translate the expression.";

/** The one rights rule. `link` is not ingestion: a public page can be linked
 *  even when its expression cannot be copied. Every other action needs a basis
 *  AND primary proof. */
export function decideUse(source: SourceRecord, action: UseAction): UseDecision {
  if (action === "link") {
    return source.url
      ? { status: "link-only", reasons: [`${source.id}: linking to the publisher is the only permitted use.`], obligations: [] }
      : { status: "blocked", reasons: [`${source.id}: no publisher URL is recorded.`], obligations: [] };
  }

  const basis = source.rights.basis;
  if (basis === "unknown") {
    return { status: "blocked", reasons: [`${source.id}: licence is unknown; unknown rights block ingestion.`], obligations: [] };
  }
  if (basis === "official-reference" || basis === "all-rights-reserved") {
    return { status: "blocked", reasons: [`${source.id}: ${basis} permits citation/linking, not reuse of its expression.`], obligations: [] };
  }
  if (basis !== "openmind-authored" && basis !== "public-domain" && basis !== "cc0" && source.rights.proof !== "recorded") {
    return {
      status: "blocked",
      reasons: [`${source.id}: the licence basis is known only from secondary research; primary rights proof is not on file.`],
      obligations: [],
    };
  }

  const obligations: string[] = [];
  if (basis === "cc-by" || basis === "cc-by-sa" || basis === "cc-by-nc" || basis === "cc-by-nc-sa" || basis === "cc-by-nd" || basis === "cc-by-nc-nd") {
    obligations.push(ATTRIBUTION);
  }
  if (basis === "cc-by-sa" || basis === "cc-by-nc-sa") obligations.push(SHARE_ALIKE);
  if (basis === "cc-by-nc" || basis === "cc-by-nc-sa" || basis === "cc-by-nc-nd") obligations.push(NONCOMMERCIAL);
  if (basis === "cc-by-nd" || basis === "cc-by-nc-nd") obligations.push(NO_DERIVATIVES);

  if ((basis === "cc-by-nd" || basis === "cc-by-nc-nd") && (action === "adapt" || action === "translate")) {
    return { status: "blocked", reasons: [`${source.id}: ${basis} forbids adaptation and translation.`], obligations };
  }
  if (action === "trainAI") {
    return { status: "blocked", reasons: [`${source.id}: OpenMind's policy does not use external teaching content for model training.`], obligations };
  }

  return {
    status: obligations.length > 0 ? "allowed-with-obligations" : "allowed",
    reasons: [`${source.id}: ${basis} permits ${action}.`],
    obligations,
  };
}

/** Ingestion is hosting/adapting expression in OpenMind. Linking is not. */
export function ingestible(source: SourceRecord): boolean {
  const d = decideUse(source, "host");
  return d.status === "allowed" || d.status === "allowed-with-obligations";
}

const AUTHORED_RIGHTS: RightsRecord = {
  basis: "openmind-authored",
  licenceUri: null,
  rightsHolder: "OpenMind contributors",
  proof: "recorded",
  note: "Original teaching text and questions written for this pilot.",
};

const AUTHORED_FIGURES: RightsRecord = {
  basis: "openmind-authored",
  licenceUri: null,
  rightsHolder: "OpenMind contributors",
  proof: "recorded",
  note: "Figures are generated from OpenMind FigureSpecs; no copied image or third-party asset is embedded.",
};

const OFFICIAL = (holder: string, note: string): RightsRecord => ({
  basis: "official-reference",
  licenceUri: null,
  rightsHolder: holder,
  proof: "recorded",
  note,
});

const UNKNOWN = (note: string): RightsRecord => ({
  basis: "unknown",
  licenceUri: null,
  rightsHolder: "Not established",
  proof: "not-recorded",
  note,
});

const SECONDARY = (basis: RightsBasis, licenceUri: string, holder: string, note: string): RightsRecord => ({
  basis,
  licenceUri,
  rightsHolder: holder,
  proof: "secondary-research",
  note,
});

export const SOURCE_RECORDS: readonly SourceRecord[] = [
  {
    id: "openmind-authored-pilot-12",
    kind: "authored",
    title: "OpenMind pilot teaching and questions",
    publisher: "OpenMind contributors",
    jurisdiction: "GLOBAL",
    url: null,
    retrievedAt: "2026-11-01",
    language: "en",
    rights: AUTHORED_RIGHTS,
    verification: "document",
    note: "Twelve original lessons; no NCERT, CBSE, DIKSHA or other third-party teaching text is reproduced.",
  },
  {
    id: "openmind-generated-figures",
    kind: "authored",
    title: "OpenMind generated figures",
    publisher: "OpenMind contributors",
    jurisdiction: "GLOBAL",
    url: null,
    retrievedAt: "2026-11-01",
    rights: AUTHORED_FIGURES,
    verification: "document",
    note: "Generated from the same FigureSpec the marker and the lesson text use.",
  },
  {
    id: "cbse-10-maths-2025-26",
    kind: "curriculum",
    title: "Mathematics (Subject Code 041 & 241), Classes IX–X — syllabus",
    publisher: "Central Board of Secondary Education (India), Academic Unit",
    jurisdiction: "IN",
    url: "https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf",
    retrievedAt: "2026-11-01",
    edition: "2025-26",
    language: "en",
    rights: OFFICIAL("CBSE", "Official syllabus used as a citation; no syllabus expression is copied into a lesson."),
    verification: "portal",
    note: "The PDF was not machine-read here; headings must be checked by a subject teacher.",
  },
  {
    id: "cbse-10-science-2025-26",
    kind: "curriculum",
    title: "Science (Subject Code 086), Class X — syllabus",
    publisher: "Central Board of Secondary Education (India), Academic Unit",
    jurisdiction: "IN",
    url: "https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Science_Sec_2025-26.pdf",
    retrievedAt: "2026-11-01",
    edition: "2025-26",
    language: "en",
    rights: OFFICIAL("CBSE", "Official syllabus used as a citation; no syllabus expression is copied into a lesson."),
    verification: "portal",
    note: "The PDF was not machine-read here; headings must be checked by a subject teacher.",
  },
  {
    id: "cbse-9-science-2025-26",
    kind: "curriculum",
    title: "Science (Subject Code 086), Class IX — syllabus",
    publisher: "Central Board of Secondary Education (India), Academic Unit",
    jurisdiction: "IN",
    url: "https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Science_Sec_2025-26.pdf",
    retrievedAt: "2026-11-01",
    edition: "2025-26",
    language: "en",
    rights: OFFICIAL("CBSE", "Official Class IX prerequisite reference for the cells lesson; not copied."),
    verification: "portal",
    note: "Class 9 prerequisite, explicitly outside the Class 10 syllabus claim.",
  },
  {
    id: "ncert-textbooks",
    kind: "official_textbook",
    title: "NCERT textbooks, Classes I–XII",
    publisher: "National Council of Educational Research and Training (India)",
    jurisdiction: "IN",
    url: "https://ncert.nic.in/textbook.php",
    retrievedAt: "2026-11-01",
    language: "en",
    rights: {
      basis: "all-rights-reserved",
      licenceUri: null,
      rightsHolder: "NCERT",
      proof: "recorded",
      note: "NCERT's published notice prohibits republication, redistribution, hosting and use in third-party digital packages without permission.",
    },
    verification: "portal",
    note: "Reference only. Do not download into OpenMind or treat the textbook as OER.",
  },
  {
    id: "diksha",
    kind: "platform",
    title: "DIKSHA",
    publisher: "Ministry of Education, Government of India",
    jurisdiction: "IN",
    url: "https://diksha.gov.in/",
    retrievedAt: "2026-11-01",
    language: "en",
    rights: UNKNOWN("Rights are item-specific; the platform aggregates NCERT, CBSE, state and other contributors. No item licence has been checked."),
    verification: "metadata",
    note: "Discovery only. Every item needs its own publisher, grade, medium and licence check.",
  },
  {
    id: "nctb-bangladesh",
    kind: "curriculum",
    title: "NCTB curriculum and textbook materials",
    publisher: "National Curriculum and Textbook Board (Bangladesh)",
    jurisdiction: "BD",
    url: "https://nctb.gov.bd/",
    retrievedAt: "2026-11-01",
    rights: OFFICIAL("NCTB", "Official source reference; a public PDF is not an open licence."),
    verification: "portal",
    note: "No reuse permission is recorded; not ingested.",
  },
  {
    id: "ncc-pakistan",
    kind: "curriculum",
    title: "National Curriculum Council curriculum documents",
    publisher: "National Curriculum Council (Pakistan)",
    jurisdiction: "PK",
    url: "https://ncc.gov.pk/",
    retrievedAt: "2026-11-01",
    rights: OFFICIAL("NCC", "Official source reference only."),
    verification: "portal",
    note: "Federal and provincial pathways must remain separate; no equivalence is asserted.",
  },
  {
    id: "elearn-punjab",
    kind: "platform",
    title: "eLearn Punjab",
    publisher: "School Education Department, Punjab",
    jurisdiction: "PK",
    url: "https://www.elearn.gov.pk/",
    retrievedAt: "2026-11-01",
    rights: UNKNOWN("Free access is not a reuse licence; no item-level licence has been checked."),
    verification: "metadata",
    note: "Reference for enriched textbook presentation, not an ingestible OER source.",
  },
  {
    id: "nepal-cdc",
    kind: "curriculum",
    title: "Curriculum Development Centre materials",
    publisher: "Curriculum Development Centre (Nepal)",
    jurisdiction: "NP",
    url: "https://moecdc.gov.np/",
    retrievedAt: "2026-11-01",
    rights: OFFICIAL("CDC Nepal", "Official source reference only."),
    verification: "portal",
    note: "Grade and edition must be confirmed with a local partner.",
  },
  {
    id: "sri-lanka-moe",
    kind: "curriculum",
    title: "Ministry of Education curriculum documents",
    publisher: "Ministry of Education (Sri Lanka)",
    jurisdiction: "LK",
    url: "https://moe.gov.lk/",
    retrievedAt: "2026-11-01",
    rights: OFFICIAL("Ministry of Education, Sri Lanka", "Official source reference only."),
    verification: "portal",
    note: "Phased rollout means one edition must not be applied to every grade.",
  },
  {
    id: "sri-lanka-nie",
    kind: "curriculum",
    title: "National Institute of Education materials",
    publisher: "National Institute of Education (Sri Lanka)",
    jurisdiction: "LK",
    url: "https://www.nie.lk/",
    retrievedAt: "2026-11-01",
    rights: OFFICIAL("NIE Sri Lanka", "Official source reference only."),
    verification: "portal",
    note: "Sinhala, Tamil and English are separate support requirements.",
  },
  {
    id: "roc",
    kind: "metadata",
    title: "Repository of Organized Curriculums (ROC)",
    publisher: "ROC",
    jurisdiction: "INT",
    url: "https://rocdata.global/",
    retrievedAt: "2026-11-01",
    rights: UNKNOWN("Prototype discovery index; its data terms and individual records have not been checked."),
    verification: "metadata",
    note: "Use to find standards and crosswalks; never as proof of complete coverage.",
  },
  {
    id: "unesco-ibe",
    kind: "metadata",
    title: "UNESCO-IBE Documentation Centre",
    publisher: "UNESCO International Bureau of Education",
    jurisdiction: "INT",
    url: "https://www.ibe.unesco.org/en/ibe-documentation-centre",
    retrievedAt: "2026-11-01",
    rights: UNKNOWN("Discovery index; linked national documents retain their own rights."),
    verification: "metadata",
    note: "A starting point for country dossiers, not a machine-readable world curriculum.",
  },
  {
    id: "oer-commons",
    kind: "platform",
    title: "OER Commons",
    publisher: "OER Commons",
    jurisdiction: "INT",
    url: "https://oercommons.org/",
    retrievedAt: "2026-11-01",
    rights: UNKNOWN("Item-level licences vary; metadata/tagging is not a quality or rights determination."),
    verification: "metadata",
    note: "Search only after a rights allowlist exists; no bulk ingestion.",
  },
  {
    id: "open-textbook-library",
    kind: "platform",
    title: "Open Textbook Library",
    publisher: "University of Minnesota",
    jurisdiction: "INT",
    url: "https://open.umn.edu/opentextbooks/",
    retrievedAt: "2026-11-01",
    rights: UNKNOWN("The library screens for open licensing, but each book and embedded asset needs its own check."),
    verification: "metadata",
    note: "Stronger for higher education; not a school-curriculum substitute.",
  },
  {
    id: "kolibri",
    kind: "platform",
    title: "Learning Equality / Kolibri",
    publisher: "Learning Equality",
    jurisdiction: "INT",
    url: "https://learningequality.org/",
    retrievedAt: "2026-11-01",
    rights: UNKNOWN("A platform is not a blanket licence for its channels; each channel/item must be checked."),
    verification: "metadata",
    note: "Offline-first delivery model, not an ingestible content licence.",
  },
  {
    id: "openstax",
    kind: "oer",
    title: "OpenStax textbooks",
    publisher: "Rice University",
    jurisdiction: "INT",
    url: "https://openstax.org/",
    retrievedAt: "2026-11-01",
    rights: SECONDARY("cc-by-nc-sa", "https://help.openstax.org/s/article/Licensing-information-of-OpenStax-textbooks", "OpenStax / Rice University", "Generally CC BY-NC-SA 4.0; non-commercial and ShareAlike obligations apply. Not used in this pilot."),
    verification: "metadata",
    note: "Blocked for ingestion until the exact book and primary licence page are on file.",
  },
  {
    id: "phet",
    kind: "oer",
    title: "PhET Interactive Simulations",
    publisher: "University of Colorado Boulder",
    jurisdiction: "INT",
    url: "https://phet.colorado.edu/",
    retrievedAt: "2026-11-01",
    rights: SECONDARY("cc-by-nc", "https://phet.colorado.edu/en/licensing", "PhET / University of Colorado Boulder", "Regular HTML simulations are stated as CC BY-NC 4.0; attribution and non-commercial limits apply. Not embedded."),
    verification: "metadata",
    note: "Blocked for ingestion/embedding until written clarification and primary proof are on file.",
  },
  {
    id: "ck12",
    kind: "oer",
    title: "CK-12",
    publisher: "CK-12 Foundation",
    jurisdiction: "INT",
    url: "https://www.ck12.org/",
    retrievedAt: "2026-11-01",
    rights: UNKNOWN("Its Curriculum Materials License is narrower than a blanket OER licence and restricts aggregator distribution and automated derivative generation."),
    verification: "metadata",
    note: "Do not ingest without explicit permission.",
  },
  {
    id: "siyavula",
    kind: "oer",
    title: "Siyavula textbooks",
    publisher: "Siyavula",
    jurisdiction: "ZA",
    url: "https://www.siyavula.com/read",
    retrievedAt: "2026-11-01",
    rights: UNKNOWN("Branded versions commonly use CC BY-ND and unbranded versions may use CC BY; rights vary by download and subject."),
    verification: "metadata",
    note: "Check the exact download's licence before any adaptation.",
  },
  {
    id: "geogebra",
    kind: "platform",
    title: "GeoGebra",
    publisher: "GeoGebra",
    jurisdiction: "INT",
    url: "https://www.geogebra.org/",
    retrievedAt: "2026-11-01",
    rights: UNKNOWN("Software, platform materials, language files and user activities do not share one licence; the service carries non-commercial restrictions."),
    verification: "metadata",
    note: "No GeoGebra asset is embedded.",
  },
  {
    id: "khan-academy",
    kind: "platform",
    title: "Khan Academy",
    publisher: "Khan Academy",
    jurisdiction: "INT",
    url: "https://www.khanacademy.org/",
    retrievedAt: "2026-11-01",
    rights: {
      basis: "all-rights-reserved",
      licenceUri: "https://www.khanacademy.org/about/tos",
      rightsHolder: "Khan Academy",
      proof: "secondary-research",
      note: "Use as a reference; link only unless a specific alternate licence says otherwise.",
    },
    verification: "metadata",
    note: "Not ingested.",
  },
  {
    id: "mit-ocw",
    kind: "oer",
    title: "MIT OpenCourseWare",
    publisher: "Massachusetts Institute of Technology",
    jurisdiction: "INT",
    url: "https://ocw.mit.edu/",
    retrievedAt: "2026-11-01",
    rights: SECONDARY("cc-by-nc-sa", "https://support.learn.mit.edu/hc/en-us/articles/42907400228635-What-are-the-requirements-of-use-for-MIT-OpenCourseWare", "MIT", "CC BY-NC-SA terms; much content is advanced and not school-grade aligned. Not used."),
    verification: "metadata",
    note: "Blocked for ingestion until exact course and primary licence proof are on file.",
  },
];

const BY_ID = new Map(SOURCE_RECORDS.map((s) => [s.id, s]));

export function sourceRecord(id: string | null | undefined): SourceRecord | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

export function sourceCoverage(): { total: number; authored: number; linkOnly: number; ingestible: number } {
  return {
    total: SOURCE_RECORDS.length,
    authored: SOURCE_RECORDS.filter((s) => s.kind === "authored").length,
    linkOnly: SOURCE_RECORDS.filter((s) => !ingestible(s) && Boolean(s.url)).length,
    ingestible: SOURCE_RECORDS.filter((s) => ingestible(s)).length,
  };
}
