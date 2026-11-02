// ─────────────────────────────────────────────────────────────────────────────
// THE CAPABILITY MATRIX, MEASURED.
//
// The strategy asks for a matrix that does not mistake a registered website for
// discoverable, rights-cleared content. This file derives every row from the
// modules that would actually serve a learner: the genome, authored lesson
// plans, content-platform documents, response contracts and resource records.
//
// It is a report, not a promise. A row that says "1 lesson" is a count of
// documents, not a claim that a subject is covered.
// ─────────────────────────────────────────────────────────────────────────────
import { CONCEPTS, getConcept } from "../genome";
import { LESSON_PLANS } from "../lesson-plans";
import { SUBJECT_IDS, subjectLabel } from "../subjects";
import type { SubjectId } from "../types";
import { allLessonDocuments } from "./flagships";
import { RESOURCE_RECORDS, decideResource, resourceCoverage } from "./resources";
import type { LessonBlock } from "./types";

export interface SubjectCapability {
  subject: SubjectId;
  label: string;
  concepts: number;
  authoredPlans: number;
  richLessons: number;
  blockKinds: string[];
  responseKinds: string[];
  resourceRecords: number;
  usableResources: number;
  linkedResources: number;
  reviewResources: number;
  approvedLessons: number;
}

const blockKinds = (blocks: LessonBlock[]): string[] =>
  [...new Set(blocks.map((b) => b.kind))].sort();

export function capabilityMatrix(): SubjectCapability[] {
  return SUBJECT_IDS.map((subject) => {
    const plans = Object.values(LESSON_PLANS).filter((p) => getConcept(p.conceptId)?.subject === subject);
    const docs = allLessonDocuments().filter((d) => d.subject === subject);
    const resources = RESOURCE_RECORDS.filter((r) => r.subject === subject);
    const decisions = resources.map(decideResource);
    return {
      subject,
      label: subjectLabel(subject),
      concepts: CONCEPTS.filter((c) => c.subject === subject).length,
      authoredPlans: plans.length,
      richLessons: docs.length,
      blockKinds: [...new Set(docs.flatMap((d) => blockKinds(d.blocks)))].sort(),
      responseKinds: [...new Set(docs.flatMap((d) => d.assessments.map((a) => a.kind)))].sort(),
      resourceRecords: resources.length,
      usableResources: decisions.filter((d) => d.outcome === "ingest" || d.outcome === "adapt").length,
      linkedResources: decisions.filter((d) => d.outcome === "link").length,
      reviewResources: decisions.filter((d) => d.outcome === "review").length,
      approvedLessons: docs.filter((d) => d.review.state === "approved").length,
    };
  });
}

export function contentPlatformSummary(): {
  subjects: number;
  concepts: number;
  authoredPlans: number;
  richLessons: number;
  assessments: number;
  resourceRecords: number;
  resourceCoverage: ReturnType<typeof resourceCoverage>;
  approvedLessons: number;
  sourceBackedLessons: number;
} {
  const docs = allLessonDocuments();
  return {
    subjects: SUBJECT_IDS.length,
    concepts: CONCEPTS.length,
    authoredPlans: Object.keys(LESSON_PLANS).length,
    richLessons: docs.length,
    assessments: docs.reduce((n, d) => n + d.assessments.length, 0),
    resourceRecords: RESOURCE_RECORDS.length,
    resourceCoverage: resourceCoverage(),
    approvedLessons: docs.filter((d) => d.review.state === "approved").length,
    sourceBackedLessons: docs.filter((d) => d.sources.some((s) => s.use === "authored" || s.use === "ingested" || s.use === "adapted")).length,
  };
}

/** The honest blockers a reader should see beside the matrix. */
export function contentPlatformBlockers(overrides: { approvedLessons?: number } = {}): string[] {
  const summary = contentPlatformSummary();
  const rows = capabilityMatrix();
  const approvedLessons = overrides.approvedLessons ?? summary.approvedLessons;
  const out: string[] = [];
  out.push(`${summary.authoredPlans} of ${summary.concepts} concepts have an authored lesson plan; ${summary.richLessons} have a content-platform lesson document.`);
  const uncovered = rows.filter((r) => r.richLessons === 0);
  if (uncovered.length > 0) out.push(`No content-platform lesson document yet for: ${uncovered.map((r) => r.label).join(", ")}.`);
  if (summary.resourceCoverage.review > 0) out.push(`${summary.resourceCoverage.review} resource record(s) are held for rights review; none may be ingested from that state.`);
  if (summary.resourceCoverage.link > 0) out.push(`${summary.resourceCoverage.link} resource record(s) are link-only by decision.`);
  out.push(`${approvedLessons} lesson document(s) carry an educator approval; ${summary.richLessons - approvedLessons} remain draft.`);
  return out;
}
