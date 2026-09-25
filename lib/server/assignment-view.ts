// ── THE ASSIGNMENT, DERIVED FROM THE LEDGER ─────────────────────────────────
//
// An assignment stores CONCEPTS AND A DEADLINE, and nothing else. Whether a
// member has done it, how accurately, which assigned concept is their weakness
// and which misconceptions their wrong answers carried are all PROJECTIONS of
// that member's own evidence ledger, over the window that opens when the
// assignment is set. There is deliberately no stored completion flag and no
// stored accuracy counter anywhere in this file's callers: a counter is a
// second copy of the record, and a second copy is the one that drifts.
//
// The window is the whole rule. Evidence counted for an assignment is an
// `answer_submitted` event on one of its concepts whose SERVER clock (`at`)
// is at or after `createdAt`. That clock is the server's, never a client's
// (lib/evidence.ts#deviceAt is a claim and is never read here), because a
// device that could backdate its answers could claim work it never did.
//
// Source is deliberately NOT filtered: guided practice, a due retrieval, a
// transfer, a paper, a diagnostic answer on the concept — all of it is real
// evidence on the assigned concept and all of it counts, because the
// alternative is a rule the learner cannot see that says some of their work
// "does not count". What was already on the concept BEFORE the window opened
// is reported separately (`prior`), so a teacher can always tell work done for
// the assignment from work done before it.
//
// Pure and dependency-light apart from the genome/bank lookups: the route reads
// the ledgers and hands the events here, so the arithmetic is testable without
// a server.
//
// Note on the curriculum: what a teacher may SET is drawn from the class's
// declared subject (and course, when it names one) — see `assignableConcepts`.
// Nothing here falls back to a default subject: a class that declares nothing
// assignable is told so rather than quietly being given a maths curriculum.
// Relative specifiers deliberately, like every other module in the compile
// mirror (scripts/compile-engines.mjs): the mirror is compiled with `tsc <files>
// ...` and no tsconfig, so `@/...` does not resolve there.
import { bySubject } from "../genome";
import { hasGenerator } from "../questions";
import { coverageOf, specById } from "../specifications";
import { PROJECTION_VERSION, type EvidenceEvent } from "../evidence";
import type {
  Assignment,
  AssignmentIntervention,
  AssignmentMemberProgress,
  AssignmentMonitor,
  SubjectId,
} from "../types";

/** Below this accuracy on a measured assigned concept, the monitor names it a
 *  weakness worth intervening on. One threshold, one place. */
export const ASSIGNMENT_WEAK_RATE = 0.6;

/**
 * The concepts a class may be set work on: its declared subject's curriculum,
 * narrowed to the course it names when it names one, and always to concepts the
 * bank can actually serve (an assignment nobody can complete is not work).
 *
 * A class whose declared course does not cover its subject gets NO candidates —
 * an empty list is the honest answer, and the door refuses to create an
 * assignment from it rather than substituting a curriculum the class never
 * declared.
 */
export function assignableConcepts(subject: SubjectId, specificationId?: string | null): string[] {
  const servable = bySubject(subject).filter((c) => hasGenerator(c.id));
  if (!specificationId) return servable.map((c) => c.id);
  const spec = specById(specificationId);
  if (!spec) return servable.map((c) => c.id);
  const inCourse = new Set(
    spec.levels.flatMap((level) => coverageOf({ spec, level })).map((c) => c.id),
  );
  return servable.filter((c) => inCourse.has(c.id)).map((c) => c.id);
}

/**
 * One member's row for one assignment, projected from their own ledger.
 *
 * `events` is that member's whole ledger in append order. Everything returned
 * is a function of those events and the assignment's window; nothing is read
 * from the roster's stored `students` (the self-report channel) and nothing is
 * read from any counter.
 */
export function deriveAssignmentProgress(
  a: Assignment,
  handle: string,
  learnerId: string,
  events: readonly EvidenceEvent[],
): AssignmentMemberProgress {
  const assigned = new Set(a.conceptIds);
  const concepts: AssignmentMemberProgress["concepts"] = {};
  const misconceptions: AssignmentMemberProgress["misconceptions"] = {};
  const prior: Record<string, number> = {};
  let answers = 0;

  for (const e of events) {
    if (e.type !== "answer_submitted" || !e.conceptId || !assigned.has(e.conceptId)) continue;
    // The window's one rule, and the reason `at` and not `deviceAt` is read.
    if (e.at < a.createdAt) {
      prior[e.conceptId] = (prior[e.conceptId] ?? 0) + 1;
      continue;
    }
    answers += 1;
    const c = (concepts[e.conceptId] ??= { asked: 0, correct: 0, rate: 0 });
    c.asked += 1;
    if (e.correct) c.correct += 1;
    if (!e.correct) {
      for (const tag of e.tags ?? []) {
        const m = (misconceptions[tag] ??= { hits: 0, conceptId: e.conceptId });
        m.hits += 1;
      }
    }
  }
  for (const c of Object.values(concepts)) c.rate = Math.round((c.correct / c.asked) * 100) / 100;

  const outstanding = a.conceptIds.filter((id) => !concepts[id]);
  const weakestEntry = Object.entries(concepts).sort(
    (x, y) => x[1].rate - y[1].rate || (x[0] < y[0] ? -1 : 1),
  )[0];

  return {
    handle,
    learnerId,
    answers,
    concepts,
    outstanding,
    complete: outstanding.length === 0,
    weakest: weakestEntry ? { conceptId: weakestEntry[0], rate: weakestEntry[1].rate } : null,
    misconceptions,
    prior,
    projectionVersion: PROJECTION_VERSION,
  };
}

/**
 * The named reasons to step in, derived from the rows — so the reason is on
 * screen rather than left for a teacher to infer from a number. In order:
 * unwritten work, then measured weakness, then a misunderstanding the ledger
 * actually recorded.
 */
export function interventionsFor(rows: readonly AssignmentMemberProgress[]): AssignmentIntervention[] {
  const out: AssignmentIntervention[] = [];
  for (const r of rows) {
    for (const conceptId of r.outstanding) {
      out.push({ handle: r.handle, conceptId, rate: null, reason: "not_started" });
    }
    for (const [conceptId, c] of Object.entries(r.concepts)) {
      if (c.rate < ASSIGNMENT_WEAK_RATE) {
        out.push({ handle: r.handle, conceptId, rate: c.rate, reason: "weak" });
      }
    }
    const mis = Object.entries(r.misconceptions)
      .sort((x, y) => y[1].hits - x[1].hits || x[0].localeCompare(y[0]))
      .slice(0, 3);
    for (const [mid, { conceptId }] of mis) {
      out.push({
        handle: r.handle,
        conceptId,
        rate: r.concepts[conceptId]?.rate ?? null,
        reason: "misconception",
        misconceptionId: mid,
      });
    }
  }
  return out;
}

/** Assemble one assignment's monitor from member rows (handles sorted, so the
 *  table has a stable order). */
export function monitorFor(
  a: Assignment,
  className: string,
  rows: readonly AssignmentMemberProgress[],
): AssignmentMonitor {
  const members = [...rows].sort((x, y) => x.handle.localeCompare(y.handle));
  return { assignment: a, className, members, interventions: interventionsFor(members) };
}
