import { getConcept } from "./genome";
import { planFor } from "./lesson-plans";
import { coverageOf, type ActiveSpec } from "./specifications";
import type { Concept, SubjectId } from "./types";

/**
 * THE SUBJECT PAGE'S START IS A PROMISE ABOUT ONE COURSE.
 *
 * The page used to ask the global decision engine for a concept and then fall
 * back to `firstTaught(all)`. On a Chemistry page the decision can name a
 * Mathematics idea, and the fallback could reach across every subject, so a
 * Chemistry learner was offered `fractions`. That is not a bad label on a
 * button: it is the product claiming work belongs to a course it is not in.
 *
 * This module is deliberately pure and small. It answers one question — which
 * concept in THIS subject, THIS course and THIS tier may a Start button open —
 * and every answer is checked against `coverageOf(active)`, the same list the
 * page renders. There is no "any subject" fallback to remove later.
 */

export type SubjectStartReason =
  /** The decision engine named a concept that is actually in this course. */
  | "current"
  /** The named concept is untaught, so we move to its nearest taught course prerequisite. */
  | "prerequisite"
  /** No usable candidate was named: open the earliest ready lesson in the course. */
  | "first"
  /** The chosen course has no complete lesson that is safe to start. */
  | "none";

export interface SubjectStart {
  conceptId: string | null;
  reason: SubjectStartReason;
}

/** A concept has a complete lesson only when `planFor` has one. Plans may be
 *  unreviewed, but they are still whole lessons — review is a separate claim
 *  printed on the lesson page, not a reason to hide a usable starting point. */
export function lessonAvailable(conceptId: string): boolean {
  return Boolean(planFor(conceptId));
}

/** The concepts this course actually contains for this subject, in genome
 *  order. `coverageOf` already resolves the qualified course; filtering here
 *  keeps the page and the chooser on exactly the same set. */
export function subjectCourseConcepts(active: ActiveSpec, subject: SubjectId): Concept[] {
  return coverageOf(active).filter((c) => c.subject === subject);
}

/**
 * Is `id` a lesson a learner can start without stepping over an untaught
 * in-course prerequisite? Prerequisites outside the course are ignored: they
 * are not required progression in this qualification, and refusing a start
 * because of one would strand a learner in a course that never teaches it.
 */
function lessonReady(
  id: string,
  allowed: Set<string>,
  subject: SubjectId,
  stack: Set<string> = new Set(),
): boolean {
  if (stack.has(id)) return false;
  const concept = getConcept(id);
  if (!concept || concept.subject !== subject || !allowed.has(id) || !lessonAvailable(id)) return false;
  const next = new Set(stack);
  next.add(id);
  return (concept.prereqs ?? []).every((pid) => {
    if (!allowed.has(pid)) return true;
    const prereq = getConcept(pid);
    if (!prereq || prereq.subject !== subject) return true;
    return lessonReady(pid, allowed, subject, next);
  });
}

/** The nearest taught, ready prerequisite of an untaught concept, in the
 *  canonical order the genome declares. */
function taughtPrerequisite(
  id: string,
  allowed: Set<string>,
  subject: SubjectId,
  stack: Set<string> = new Set(),
): string | null {
  if (stack.has(id)) return null;
  const next = new Set(stack);
  next.add(id);
  for (const pid of getConcept(id)?.prereqs ?? []) {
    if (!allowed.has(pid)) continue;
    const prereq = getConcept(pid);
    if (!prereq || prereq.subject !== subject) continue;
    if (lessonReady(pid, allowed, subject, next)) return pid;
    const deeper = taughtPrerequisite(pid, allowed, subject, next);
    if (deeper) return deeper;
  }
  return null;
}

/**
 * Choose the concept the subject page may offer as Start.
 *
 * `preferredId` is the global decision engine's choice. It is only a hint: if
 * it is from another subject, outside this course, or has no complete lesson,
 * it is discarded rather than rendered. When nothing in the course can be
 * started, the answer is null and the page prints the honest unavailable state.
 */
export function chooseSubjectStart(
  subject: SubjectId,
  active: ActiveSpec | null,
  preferredId: string | null = null,
): SubjectStart {
  if (!active) return { conceptId: null, reason: "none" };

  const course = subjectCourseConcepts(active, subject);
  const allowed = new Set(course.map((c) => c.id));
  const preferred = preferredId ? getConcept(preferredId) : null;

  // A preferred concept is only usable when it belongs to this course and its
  // subject. The decision engine's ranking does not get to cross either line.
  if (
    preferred &&
    preferred.subject === subject &&
    allowed.has(preferred.id) &&
    lessonAvailable(preferred.id)
  ) {
    return { conceptId: preferred.id, reason: "current" };
  }

  if (preferred && preferred.subject === subject && allowed.has(preferred.id)) {
    const prerequisite = taughtPrerequisite(preferred.id, allowed, subject);
    if (prerequisite) return { conceptId: prerequisite, reason: "prerequisite" };
  }

  // No safe hint: take the earliest lesson in canonical order whose in-course
  // prerequisites are themselves available. `coverageOf` preserves genome
  // order, so this is the course's own beginning, not an arbitrary first hit.
  const first = course.find((c) => lessonReady(c.id, allowed, subject));
  return first ? { conceptId: first.id, reason: "first" } : { conceptId: null, reason: "none" };
}
