// ─────────────────────────────────────────────────────────────────────────────
// THE RESOURCE LAYER — a source is not a licence, and a licence is not a
// permission to ingest.
//
// lib/source-registry.ts already answers the hard question for a SOURCE. This
// module adds the missing middle: an individual RESOURCE (a book, a simulation,
// a lesson, an asset) records what it is, which objective it can support, what
// use OpenMind wants, and the decision that follows. A provider registration
// never becomes an ingestion permission by itself.
//
// The four outcomes the strategy asks for are represented literally:
//   ingest  — copy/adapt is allowed with proof on file
//   adapt   — transformation is allowed under the recorded obligations
//   link    — display the publisher's page; never mirror or embed it
//   review  — rights or quality are uncertain; a human must resolve it
//   reject  — the recorded basis forbids reuse
//
// A resource whose licence is known only from secondary research is REVIEW,
// not ingest. That is the same standard the source registry already applies.
// ─────────────────────────────────────────────────────────────────────────────
import type { SubjectId } from "../types";
import {
  decideUse,
  sourceRecord,
  type RightsBasis,
  type SourceRecord,
} from "../source-registry";

export type ResourceKind =
  | "textbook"
  | "explanation"
  | "simulation"
  | "exercise"
  | "dataset"
  | "diagram"
  | "code-project"
  | "authored-lesson";

export type ResourceRequest = "ingest" | "adapt" | "link";
export type ResourceOutcome = "ingest" | "adapt" | "link" | "review" | "reject";

export interface ResourceRecord {
  id: string;
  sourceId: string;
  title: string;
  publisher: string;
  url: string | null;
  kind: ResourceKind;
  subject: SubjectId;
  /** Genome concepts this resource can support. */
  conceptIds: string[];
  /** Objective ids in the content platform's curriculum records. */
  objectiveIds: string[];
  language: string;
  edition?: string;
  retrievedAt: string;
  lastCheckedAt: string;
  licenceEvidenceUrl?: string;
  requestedUse: ResourceRequest;
  /** The exact pieces a lesson would use, when they are known. Empty means
   *  "the resource is catalogued, not extracted". */
  assets: string[];
  attribution?: string;
  note?: string;
}

export interface ResourceDecision {
  outcome: ResourceOutcome;
  reasons: string[];
  obligations: string[];
}

export interface ResourceCoverage {
  conceptId: string;
  subject: SubjectId;
  total: number;
  usable: number;
  linked: number;
  review: number;
  rejected: number;
  status: "well-supported" | "linked-only" | "rights-review" | "no-resource";
  resources: Array<{ record: ResourceRecord; decision: ResourceDecision }>;
}

const AUTHORED_SOURCE = "openmind-authored-pilot-12";
const FIGURE_SOURCE = "openmind-generated-figures";

/**
 * The catalogue is deliberately small and explicit. These are RESOURCE-level
 * records, not claims that a chapter has been cleared for copying:
 *
 *   · OpenStax and PhET are recorded as link/review candidates. Their licences
 *     are known from their own public pages, but the registry has only secondary
 *     research on file, so ingestion is blocked.
 *   · The OpenMind-authored records are ours and are ingestible.
 *
 * Adding a provider is a data change here plus a source record; it is not a
 * new code path that can quietly bypass `decideUse`.
 */
export const RESOURCE_RECORDS: readonly ResourceRecord[] = [
  {
    id: "openstax-college-physics-2e",
    sourceId: "openstax",
    title: "College Physics 2e",
    publisher: "OpenStax, Rice University",
    url: "https://openstax.org/details/books/college-physics-2e",
    kind: "textbook",
    subject: "physics",
    conceptIds: ["electricity-circuits"],
    objectiveIds: ["in-cbse:class10:electricity-circuits"],
    language: "en",
    edition: "2e",
    retrievedAt: "2026-11-02",
    lastCheckedAt: "2026-11-02",
    licenceEvidenceUrl:
      "https://help.openstax.org/s/article/Licensing-information-of-OpenStax-textbooks",
    requestedUse: "adapt",
    assets: ["chapter-level explanation", "worked examples"],
    attribution: "OpenStax, College Physics 2e",
    note: "CC BY-NC-SA generally; exact book and primary licence record still need verification before any ingestion.",
  },
  {
    id: "phet-circuit-construction-kit-dc",
    sourceId: "phet",
    title: "Circuit Construction Kit: DC",
    publisher: "PhET Interactive Simulations, University of Colorado Boulder",
    url: "https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc",
    kind: "simulation",
    subject: "physics",
    conceptIds: ["electricity-circuits"],
    objectiveIds: ["in-cbse:class10:electricity-circuits"],
    language: "en",
    retrievedAt: "2026-11-02",
    lastCheckedAt: "2026-11-02",
    licenceEvidenceUrl: "https://phet.colorado.edu/en/licensing",
    requestedUse: "link",
    assets: [],
    attribution: "PhET Interactive Simulations, University of Colorado Boulder",
    note: "Link only. No simulation asset is copied or embedded into OpenMind.",
  },
  {
    id: "openstax-biology-2e",
    sourceId: "openstax",
    title: "Biology 2e",
    publisher: "OpenStax, Rice University",
    url: "https://openstax.org/details/books/biology-2e",
    kind: "textbook",
    subject: "biology",
    conceptIds: ["cells"],
    objectiveIds: ["in-cbse:class8-9:cells"],
    language: "en",
    edition: "2e",
    retrievedAt: "2026-11-02",
    lastCheckedAt: "2026-11-02",
    licenceEvidenceUrl:
      "https://help.openstax.org/s/article/Licensing-information-of-OpenStax-textbooks",
    requestedUse: "adapt",
    assets: ["cell structure explanation", "organelle diagrams (not extracted)"],
    attribution: "OpenStax, Biology 2e",
    note: "Rights review is required before any text or diagram is ingested.",
  },
  {
    id: "openstax-chemistry-2e",
    sourceId: "openstax",
    title: "Chemistry 2e",
    publisher: "OpenStax, Rice University",
    url: "https://openstax.org/details/books/chemistry-2e",
    kind: "textbook",
    subject: "chemistry",
    conceptIds: ["equations-stoich"],
    objectiveIds: ["in-cbse:class10:equations-stoich"],
    language: "en",
    edition: "2e",
    retrievedAt: "2026-11-02",
    lastCheckedAt: "2026-11-02",
    licenceEvidenceUrl:
      "https://help.openstax.org/s/article/Licensing-information-of-OpenStax-textbooks",
    requestedUse: "adapt",
    assets: ["balancing explanation", "worked examples"],
    attribution: "OpenStax, Chemistry 2e",
    note: "Rights review is required before any text or worked example is ingested.",
  },
  {
    id: "openmind-electricity-circuits",
    sourceId: AUTHORED_SOURCE,
    title: "OpenMind circuits lesson",
    publisher: "OpenMind contributors",
    url: null,
    kind: "authored-lesson",
    subject: "physics",
    conceptIds: ["electricity-circuits"],
    objectiveIds: ["in-cbse:class10:electricity-circuits"],
    language: "en",
    retrievedAt: "2026-11-02",
    lastCheckedAt: "2026-11-02",
    requestedUse: "ingest",
    assets: ["explanation", "worked example", "calculation activity"],
    attribution: "OpenMind contributors",
  },
  {
    id: "openmind-cells",
    sourceId: AUTHORED_SOURCE,
    title: "OpenMind cells lesson",
    publisher: "OpenMind contributors",
    url: null,
    kind: "authored-lesson",
    subject: "biology",
    conceptIds: ["cells"],
    objectiveIds: ["in-cbse:class8-9:cells"],
    language: "en",
    retrievedAt: "2026-11-02",
    lastCheckedAt: "2026-11-02",
    requestedUse: "ingest",
    assets: ["explanation", "cell labelling activity"],
    attribution: "OpenMind contributors",
  },
  {
    id: "openmind-cells-diagram",
    sourceId: FIGURE_SOURCE,
    title: "OpenMind authored cell schematic",
    publisher: "OpenMind contributors",
    url: null,
    kind: "diagram",
    subject: "biology",
    conceptIds: ["cells"],
    objectiveIds: ["in-cbse:class8-9:cells"],
    language: "en",
    retrievedAt: "2026-11-02",
    lastCheckedAt: "2026-11-02",
    requestedUse: "ingest",
    assets: ["schematic cell drawing"],
    attribution: "OpenMind contributors",
  },
  {
    id: "openmind-what-is-code",
    sourceId: AUTHORED_SOURCE,
    title: "OpenMind first-program lesson",
    publisher: "OpenMind contributors",
    url: null,
    kind: "authored-lesson",
    subject: "computing",
    conceptIds: ["what-is-code"],
    objectiveIds: ["uk-gcse:foundation:what-is-code"],
    language: "en",
    retrievedAt: "2026-11-02",
    lastCheckedAt: "2026-11-02",
    requestedUse: "ingest",
    assets: ["explanation", "debugging code lab"],
    attribution: "OpenMind contributors",
  },
];

function rightsBasis(source: SourceRecord): RightsBasis {
  return source.rights.basis;
}

/**
 * The one resource decision. It never upgrades a link into an ingestion.
 */
export function decideResource(record: ResourceRecord): ResourceDecision {
  const source = sourceRecord(record.sourceId);
  if (!source) {
    return {
      outcome: "reject",
      reasons: [`${record.id}: source ${record.sourceId} is not in the source registry.`],
      obligations: [],
    };
  }

  if (record.requestedUse === "link") {
    if (!source.url || !record.url) {
      return {
        outcome: "reject",
        reasons: [`${record.id}: no publisher URL is recorded, so there is nothing to link to.`],
        obligations: [],
      };
    }
    return {
      outcome: "link",
      reasons: [`${record.id}: link-only use of ${source.id}; no expression is copied or embedded.`],
      obligations: source.rights.basis.startsWith("cc-by") ? ["Preserve attribution and the licence notice."] : [],
    };
  }

  const action = record.requestedUse === "adapt" ? "adapt" : "host";
  const decision = decideUse(source, action);
  if (decision.status === "allowed" || decision.status === "allowed-with-obligations") {
    return {
      outcome: record.requestedUse === "adapt" ? "adapt" : "ingest",
      reasons: [...decision.reasons],
      obligations: [...decision.obligations],
    };
  }

  // A public URL is not a permission. An all-rights-reserved or official
  // reference is a rejection for ingestion, not a review that might later pass
  // without a new licence.
  const basis = rightsBasis(source);
  if (basis === "all-rights-reserved" || basis === "official-reference") {
    return {
      outcome: "reject",
      reasons: [...decision.reasons, `${record.id}: ${basis} does not permit ingestion.`],
      obligations: [...decision.obligations],
    };
  }

  return {
    outcome: "review",
    reasons: [
      ...decision.reasons,
      `${record.id}: rights are uncertain, so extraction is held for a human rights review.`,
    ],
    obligations: [...decision.obligations],
  };
}

export function coverageForConcept(
  conceptId: string,
  subject?: SubjectId,
): ResourceCoverage {
  const records = RESOURCE_RECORDS.filter(
    (r) => r.conceptIds.includes(conceptId) && (!subject || r.subject === subject),
  );
  const resources = records.map((record) => ({ record, decision: decideResource(record) }));
  const usable = resources.filter((r) => r.decision.outcome === "ingest" || r.decision.outcome === "adapt").length;
  const linked = resources.filter((r) => r.decision.outcome === "link").length;
  const review = resources.filter((r) => r.decision.outcome === "review").length;
  const rejected = resources.filter((r) => r.decision.outcome === "reject").length;
  const status: ResourceCoverage["status"] =
    usable > 0 ? "well-supported" : linked > 0 ? "linked-only" : review > 0 ? "rights-review" : "no-resource";
  return {
    conceptId,
    subject: subject ?? records[0]?.subject ?? "maths",
    total: records.length,
    usable,
    linked,
    review,
    rejected,
    status,
    resources,
  };
}

export function resourceCoverage(): {
  total: number;
  ingest: number;
  adapt: number;
  link: number;
  review: number;
  reject: number;
  conceptsWithUsable: number;
} {
  const decisions = RESOURCE_RECORDS.map(decideResource);
  const concepts = new Set(
    RESOURCE_RECORDS.filter((r) => ["ingest", "adapt"].includes(decideResource(r).outcome)).flatMap((r) => r.conceptIds),
  );
  return {
    total: RESOURCE_RECORDS.length,
    ingest: decisions.filter((d) => d.outcome === "ingest").length,
    adapt: decisions.filter((d) => d.outcome === "adapt").length,
    link: decisions.filter((d) => d.outcome === "link").length,
    review: decisions.filter((d) => d.outcome === "review").length,
    reject: decisions.filter((d) => d.outcome === "reject").length,
    conceptsWithUsable: concepts.size,
  };
}
