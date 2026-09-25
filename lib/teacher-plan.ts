// ─────────────────────────────────────────────────────────────────────────────
// The teacher plan engine — the "AI turns into education" layer.
//
// A teacher says: "I teach 45 students. Most struggle with algebra."
// This engine reads what the class's students have actually done on OpenMind
// and produces a concrete weekly structure: what to explain Monday, what to
// diagnose Tuesday, who works on what, who needs scaffolding, and a Friday
// mastery test. Fully deterministic — same roster, same plan — so the printed
// offline pack and the on-screen plan can never disagree, and so it runs with
// no AI service at all.
//
// Its data source is the class's LIVE view when the door provides one (the
// server-derived projection in `cls.live` — measurements, not claims) and the
// member's last self-report otherwise. A plan built on live data and a plan
// built on reports can differ only because the evidence moved on — never
// because a client flattered itself.
// ─────────────────────────────────────────────────────────────────────────────

import { ancestorsOf, bySubject, getConcept } from "./genome";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import type { ClassRoster, SubjectId } from "./types";

export type DayKind = "explain" | "diagnose" | "practice" | "activity" | "mastery";

export interface PlanDay {
  /** 0 = Monday … 4 = Friday. */
  day: number;
  kind: DayKind;
  conceptId: string;
  /** Suggested minutes inside one lesson period. */
  minutes: number;
  /** Deterministic question seeds — the pack regenerates exactly these. */
  seeds: string[];
  /** Coaching notes attached to the concept's known misconceptions. */
  coaching: string[];
}

export interface PlanGroup {
  name: string;
  members: string[];
  /** The concept this group should work on (its weakest member's weakest). */
  conceptId: string;
}

export interface PlanScaffold {
  who: string;
  /** The prerequisite concept to shore up first. */
  conceptId: string;
  because: string;
}

export interface WeeklyPlan {
  subject: SubjectId;
  /** Concepts in teach order (foundations first). */
  focus: string[];
  days: PlanDay[];
  groups: PlanGroup[];
  scaffolds: PlanScaffold[];
  /** True when the plan fell back to curriculum order (no student data yet). */
  fromCurriculum: boolean;
  generatedAt: number;
}

const DAY_PLAN: Array<{ kind: DayKind; minutes: number; count: number }> = [
  { kind: "explain", minutes: 20, count: 3 },
  { kind: "diagnose", minutes: 25, count: 6 },
  { kind: "practice", minutes: 30, count: 8 },
  { kind: "activity", minutes: 30, count: 4 },
  { kind: "mastery", minutes: 30, count: 8 },
];

/** Concepts of `subject` in canonical (stage) order. */
function curriculum(subject: SubjectId): string[] {
  return bySubject(subject).map((c) => c.id);
}

/** The per-member mastery map the plan reads: the LIVE projection view when
 *  the door attached one, the stored self-report otherwise. Same shape either
 *  way (handle -> conceptId -> 0..1), so every consumer below is indifferent
 *  to which one fed it. */
function memberMaps(cls: ClassRoster): Record<string, Record<string, number>> {
  if (cls.live && Object.keys(cls.live).length > 0) {
    const out: Record<string, Record<string, number>> = {};
    for (const [handle, m] of Object.entries(cls.live)) {
      out[handle] = Object.fromEntries(Object.entries(m.concepts).map(([cid, c]) => [cid, c.rate]));
    }
    return out;
  }
  return cls.students;
}

/** The subject a roster actually covers, inferred from its concepts. */
export function classSubject(cls: ClassRoster): SubjectId {
  for (const id of cls.conceptIds) {
    const c = getConcept(id);
    if (c) return c.subject;
  }
  return "maths";
}

/**
 * Rank candidate concepts by class weakness: students-below-mastery first,
 * then by mean mastery. Deterministic; ties broken by curriculum order.
 */
function weakestConcepts(cls: ClassRoster, subject: SubjectId): Array<{ id: string; weak: number; mean: number }> {
  const students = Object.values(memberMaps(cls)).filter((m) => Object.keys(m).length > 0);
  const candidates = (cls.conceptIds.length ? cls.conceptIds : curriculum(subject)).filter((id) => getConcept(id));
  return candidates
    .map((id) => {
      const vals = students.map((m) => m[id]).filter((v): v is number => typeof v === "number");
      const mean = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      const weak = vals.filter((v) => v < 0.8).length;
      return { id, weak, mean, n: vals.length };
    })
    // Unreported concepts are not weaknesses — absence of data must not
    // masquerade as a struggling class, or the honest fallback never fires.
    .filter((c) => c.n > 0 && (c.weak > 0 || c.mean < 0.8))
    .sort((a, b) => b.weak - a.weak || a.mean - b.mean || a.id.localeCompare(b.id));
}

/**
 * Build the week. With student data the focus is the class's weakest concepts
 * (teach-order); with no data yet it is an honest "start of curriculum" plan.
 */
export function buildWeeklyPlan(cls: ClassRoster, subject?: SubjectId): WeeklyPlan {
  const subj = subject ?? classSubject(cls);
  const now = Date.now();

  // ── Focus: weakest concepts, re-ordered foundations-first so the plan
  // never asks a class to learn quadratics before fractions.
  const ranked = weakestConcepts(cls, subj);
  const order = curriculum(subj);
  let focus = ranked
    .slice(0, 4)
    .map((c) => c.id)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  let fromCurriculum = false;
  if (focus.length === 0) {
    fromCurriculum = true;
    focus = order.filter((id) => getConcept(id)!.stage <= 2).slice(0, 4);
  }
  while (focus.length < 4 && focus.length < order.length) {
    const next = order.find((id) => !focus.includes(id) && getConcept(id));
    if (!next) break;
    focus.push(next);
  }
  focus = focus.slice(0, 4);

  const daySeeds = (i: number) =>
    Array.from({ length: DAY_PLAN[i].count }, (_, k) => `${cls.id}:d${i}:${k}`);

  const coachingFor = (conceptId: string): string[] => {
    const c = getConcept(conceptId);
    return (c?.misconceptions ?? [])
      .map((mid) => MISCONCEPTIONS_BY_ID[mid]?.coaching)
      .filter((s): s is string => Boolean(s));
  };

  const days: PlanDay[] = DAY_PLAN.map((d, i) => ({
    day: i,
    kind: d.kind,
    conceptId: focus[Math.min(i, focus.length - 1)] ?? order[0],
    minutes: d.minutes,
    seeds: daySeeds(i),
    coaching: coachingFor(focus[Math.min(i, focus.length - 1)] ?? order[0]),
  }));

  // ── Thursday groups: snake-draft mixed ability on the activity concept.
  const actConcept = days[3].conceptId;
  const roster = Object.entries(memberMaps(cls))
    .filter(([, m]) => Object.keys(m).length > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));
  const byAbility = roster
    .map(([h, m]) => ({ h, v: typeof m[actConcept] === "number" ? m[actConcept] : meanOf(m) }))
    .sort((a, b) => b.v - a.v);
  const groups: PlanGroup[] = [];
  if (byAbility.length >= 4) {
    const gCount = Math.min(6, Math.ceil(byAbility.length / 4));
    const buckets: PlanGroup[] = Array.from({ length: gCount }, (_, g) => ({
      name: String.fromCharCode(65 + g),
      members: [],
      conceptId: actConcept,
    }));
    byAbility.forEach((s, i) => {
      // snake draft: 0,1,2 then 4,3 — every group gets strong AND weak students
      const row = Math.floor(i / gCount);
      const col = row % 2 === 0 ? i % gCount : gCount - 1 - (i % gCount);
      buckets[col].members.push(s.h);
    });
    for (const g of buckets) {
      const weakest = g.members
        .map((h) => roster.find(([rh]) => rh === h)!)
        .map(([, m]) => focus.reduce((worst, cid) => ((m[cid] ?? 1) < (m[worst] ?? 1) ? cid : worst), focus[0] ?? actConcept));
      g.conceptId = focus.reduce(
        (worst, cid) => (weakest.filter((w) => w === cid).length > weakest.filter((w) => w === worst).length ? cid : worst),
        focus[0] ?? actConcept,
      );
    }
    groups.push(...buckets);
  } else if (roster.length > 0) {
    groups.push({ name: "A", members: roster.map(([h]) => h), conceptId: actConcept });
  }

  // ── Scaffolds: anyone far below the focus line gets their unmastered
  // prerequisite named — the plan repairs foundations, not symptoms. Only
  // *reported* data marks a student stuck: unreported concepts are the
  // Tuesday diagnostic's job to discover, not grounds for a verdict.
  const scaffolds: PlanScaffold[] = [];
  for (const [h, m] of roster) {
    const stuck = focus.find((cid) => typeof m[cid] === "number" && m[cid] < 0.45);
    if (!stuck) continue;
    const pre = ancestorsOf(stuck).find((pid) => (m[pid] ?? 0) < 0.6 && getConcept(pid));
    if (pre) scaffolds.push({ who: h, conceptId: pre, because: stuck });
  }

  return { subject: subj, focus, days, groups, scaffolds, fromCurriculum, generatedAt: now };
}

function meanOf(m: Record<string, number>): number {
  const vals = Object.values(m);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
}
