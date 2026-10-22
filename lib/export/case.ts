// ─────────────────────────────────────────────────────────────────────────────
// CASE 1.1 (JSON) — the curriculum itself, as a machine-readable framework.
//
// 1EdTech CASE is how a ministry publishes what a qualification *is*: a set of
// items (standards/competencies) with stable identifiers, nested by association,
// so any platform can say "this question teaches item X" and any other system can
// understand it. It is the missing half of interoperability: QTI moves the items,
// OneRoster moves the people, and CASE moves the curriculum — without it, a
// receiving platform has our questions and no idea which of its own outcomes they
// belong to.
//
// WHAT IS EXPORTED. The genome's concepts become CFItems, each with the concept id
// as its `humanCodingScheme` (the identifier a ministry can quote in a syllabus
// mapping), the title as the `fullStatement`, and the stage as an education level.
// Prerequisites become `isChildOf` associations — the direction CASE defines:
// the ORIGIN is the child, the DESTINATION is what it belongs under. That is
// exactly this project's prerequisite graph, so nothing is invented to fit a
// schema.
//
// DETERMINISM. `lastChangeDateTime` is a fixed build constant, not `Date.now()`.
// A framework rebuilt from the same genome must be byte-identical, or a reviewer
// cannot diff two exports to see what content actually changed — and a spurious
// timestamp is the reason "nothing changed" reviews stop being believed.
//
// WHAT THIS IS NOT: a claim of ministry alignment. The framework says what THIS
// bank teaches; mapping it to a national syllabus is a human review, and
// audit/status.json records that none has been done yet for any pathway.
// ─────────────────────────────────────────────────────────────────────────────
import type { Concept, StageId } from "../types";
// `Specification` is the COURSE's shape and lives with the specifications, not in
// lib/types.ts — the compiler caught this rather than a runtime `undefined`.
import type { Specification } from "../specifications";

/** 2026-01-01T00:00:00Z. A fixed stamp: see the header's determinism note. */
const CASE_BUILT = "2026-01-01T00:00:00.000Z";

/** The URI stem for every node. Stable, resolvable in principle, and namespaced
 *  by the product rather than by a deployment so exports from two servers agree. */
const NODE_BASE = "https://openmind.local/case";

export interface CaseNodeRef {
  identifier: string;
  uri: string;
  title: string;
  targetType: "CFItem" | "CFConcept";
}

export interface CaseItem {
  identifier: string;
  uri: string;
  humanCodingScheme: string;
  fullStatement: string;
  /** CASE calls this a "type" — what kind of node this is, not its name. The
   *  concept's own name is `fullStatement`; putting it here instead would make the
   *  field meaningless to an importer that groups by type. */
  CFItemType: "Concept";
  educationLevel: string[];
  subject: string[];
  lastChangeDateTime: string;
}

export interface CaseAssociation {
  identifier: string;
  associationType: "isChildOf";
  originNodeURI: CaseNodeRef;
  destinationNodeURI: CaseNodeRef;
  sequenceNumber: number;
  lastChangeDateTime: string;
}

export interface CaseConcept {
  identifier: string;
  uri: string;
  title: string;
  lastChangeDateTime: string;
}

export interface CasePackage {
  CFPackage: {
    CFDocument: {
      identifier: string;
      uri: string;
      creator: string;
      title: string;
      lastChangeDateTime: string;
      version: "1.1";
    };
    CFItems: CaseItem[];
    CFAssociations: CaseAssociation[];
    CFConcepts: CaseConcept[];
  };
}

const itemId = (conceptId: string): string => `om-concept-${conceptId}`;
const itemUri = (conceptId: string): string => `${NODE_BASE}/item/${conceptId}`;

/** Stage → the education-level string an importer displays. The genome's stage is
 *  a depth band, not a grade, so the label says band and not "Grade 3" — a false
 *  grade would be worse than a coarse band, because a receiving system would file
 *  the content under an age it was never written for. */
function educationLevel(stage: StageId): string[] {
  return [`OpenMind stage ${stage}`];
}

/**
 * The framework for one qualification.
 *
 * `concepts` is the resolved set the caller computed from the specification
 * (`courseConceptIds`), so this function is pure and a test can assert its shape
 * without loading the whole genome.
 */
export function caseFramework(input: { spec: Specification; concepts: readonly Concept[] }): CasePackage {
  const { spec, concepts } = input;

  // Associations may point at a prerequisite OUTSIDE the exported set (a course
  // covers a stage window, not the whole graph). Those are dropped rather than
  // inventing a stub node: an association to a node the package does not contain
  // is a dangling reference, and the destination's absence is information
  // ("this course assumes knowledge taught elsewhere") that a stub would hide.
  const included = new Set(concepts.map((c) => c.id));

  const items: CaseItem[] = concepts.map((concept) => ({
    identifier: itemId(concept.id),
    uri: itemUri(concept.id),
    humanCodingScheme: concept.id,
    fullStatement: concept.title,
    CFItemType: "Concept",
    educationLevel: educationLevel(concept.stage),
    subject: [concept.subject],
    lastChangeDateTime: CASE_BUILT,
  }));

  const associations: CaseAssociation[] = [];
  for (const concept of concepts) {
    concept.prereqs.forEach((prereqId, index) => {
      if (!included.has(prereqId)) return;
      associations.push({
        identifier: `om-assoc-${concept.id}-${prereqId}`,
        associationType: "isChildOf",
        originNodeURI: {
          identifier: itemId(concept.id),
          uri: itemUri(concept.id),
          title: concept.title,
          targetType: "CFItem",
        },
        destinationNodeURI: {
          identifier: itemId(prereqId),
          uri: itemUri(prereqId),
          title: prereqId,
          targetType: "CFItem",
        },
        sequenceNumber: index + 1,
        lastChangeDateTime: CASE_BUILT,
      });
    });
  }

  return {
    CFPackage: {
      CFDocument: {
        identifier: `om-case-${spec.id}`,
        uri: `${NODE_BASE}/framework/${spec.id}`,
        creator: "OpenMind",
        title: `${spec.name} (${spec.country}) — OpenMind curriculum framework`,
        lastChangeDateTime: CASE_BUILT,
        version: "1.1",
      },
      CFItems: items,
      CFAssociations: associations,
      CFConcepts: concepts.map((concept) => ({
        identifier: `om-concept-name-${concept.id}`,
        uri: `${NODE_BASE}/concept/${concept.id}`,
        title: concept.title,
        lastChangeDateTime: CASE_BUILT,
      })),
    },
  };
}
