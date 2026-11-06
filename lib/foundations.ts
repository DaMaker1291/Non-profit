// ── THE LEARNER'S OWN CATCH-UP PATH ─────────────────────────────────────────
//
// A school year is not evidence. This module answers one question from recorded
// evidence alone: "the ideas I am working on — which of the earlier ideas they
// rest on have I not established?"
//
// Three deliberate differences from `unmetPrerequisites` in learner-model:
//
//  1. TRANSITIVE. That function reads one concept's DECLARED prereqs, which is
//     right for "why is this card blocked". A learner rebuilding after
//     interrupted schooling needs the ancestry: if fractions rest on place
//     value and place value rests on nothing, the path must name place value,
//     not stop one level down.
//  2. ORDERED FOUNDATIONS-FIRST, by how many prerequisite edges lie beneath a
//     concept. A path that lists a dependent idea before the idea it depends on
//     is a reading list, not a route.
//  3. IT SEPARATES UNMEASURED FROM WEAK. `attempts === 0` is "nobody has asked
//     you this yet"; a low mastery is "you have answered and it is not there".
//     Rendering both as 0% tells a learner they failed something they were
//     never asked, which is the one thing this product must never do.
//
// Nothing here writes, and nothing here is a diagnosis: a step is a statement
// about EVIDENCE and a DECLARED content relation, and the learner chooses
// whether to take it.
import { ancestorsOf, bySubject, getConcept } from "./genome";
import { ESTABLISHED_MASTERY, evidenceFor, prerequisiteMet } from "./learner-model";
import type { ProfileState } from "./types";

export interface CatchUpStep {
  conceptId: string;
  subject: string;
  /** `unmeasured`: no answer on record. `weak`: answered, below the bar. */
  state: "unmeasured" | "weak";
  mastery: number;
  attempts: number;
  /** Transitive prerequisite count — the ordering fact, stated in the data so
   *  a surface never has to re-derive why the order is what it is. */
  depth: number;
  /** The learner's targets whose ancestry includes this concept. */
  neededBy: string[];
}

export interface CatchUpPath {
  /** The next few foundations to rebuild, foundations first. */
  steps: CatchUpStep[];
  /** Every open foundation, including the ones beyond `steps`. */
  total: number;
  /** Targets considered — the learner's touched work, or a declared course. */
  considered: number;
}

/**
 * Derive the catch-up path for one learner.
 *
 * `targets` is what the learner is actually working on: a course's concept
 * list when the caller has one, and otherwise the concepts they have touched.
 * Passing the touched set is not a fallback for missing data — it is the more
 * honest question for a learner with no declared course, and it is why the path
 * exists at all: it never assumes a year group to find the foundation.
 *
 * Pure in (state, targets): the same record yields the same path, ties broken
 * by mastery then concept id, so two renders cannot disagree about the order.
 */
export function catchUpPath(
  state: ProfileState,
  opts: { targets?: readonly string[]; subjects?: readonly string[]; limit?: number } = {},
): CatchUpPath {
  // A learner who has ENROLLED and answered nothing is the case this exists for:
  // an adult returning to education, or a pupil resuming after months away, has
  // a course and no record yet. Their declared subjects are targets, so the path
  // can start before the first answer instead of waiting to be handed a gap.
  // Explicit targets still win — a caller that knows the course's concept list
  // is more precise than the subject's whole ancestry.
  const declared = opts.subjects?.length
    ? opts.subjects.flatMap((s) => bySubject(s as Parameters<typeof bySubject>[0]).map((c) => c.id))
    : [];
  const rawTargets = opts.targets && opts.targets.length > 0
    ? opts.targets
    : declared.length > 0
      ? declared
      : Object.keys(state.progress);
  const targets = [...new Set(rawTargets)].filter((id) => !!getConcept(id));

  // conceptId -> the targets whose ancestry includes it
  const neededBy = new Map<string, Set<string>>();
  for (const target of targets) {
    for (const ancestor of ancestorsOf(target)) {
      if (prerequisiteMet(evidenceFor(state, ancestor) ?? undefined)) continue;
      const set = neededBy.get(ancestor) ?? new Set<string>();
      set.add(target);
      neededBy.set(ancestor, set);
    }
  }

  const all: CatchUpStep[] = [];
  for (const [conceptId, from] of neededBy) {
    const concept = getConcept(conceptId);
    if (!concept) continue;
    const evidence = evidenceFor(state, conceptId);
    const attempts = evidence?.attempts ?? 0;
    all.push({
      conceptId,
      subject: concept.subject,
      state: attempts === 0 ? "unmeasured" : "weak",
      mastery: evidence?.mastery ?? 0,
      attempts,
      depth: ancestorsOf(conceptId).length,
      neededBy: [...from].sort(),
    });
  }

  all.sort((a, b) => a.depth - b.depth || a.mastery - b.mastery || a.conceptId.localeCompare(b.conceptId));
  const limit = Math.max(1, Math.min(12, opts.limit ?? 5));
  return { steps: all.slice(0, limit), total: all.length, considered: targets.length };
}

/** The bar a prerequisite must clear to count as established. Re-exported so a
 *  surface that explains the path cannot drift from the rule that built it. */
export const CATCH_UP_BAR = ESTABLISHED_MASTERY;
