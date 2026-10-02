// ─────────────────────────────────────────────────────────────────────────────
// WHAT A COURSE'S PRACTICE CAN ACTUALLY REACH.
//
// A qualification declares the demand it really examines — A-Level A2 is 0.90,
// IB Diploma HL is 0.90, AP is 0.85. That is a fact about the qualification. It
// is NOT a fact about what OpenMind is able to ask, and the two were being used
// as though they were the same number: `difficultyFor` handed the declared value
// straight to the serve, the serve could not honour it, and nothing anywhere
// said so. Measured over each course's own concepts through the production
// serve path: the practice route calls generateQuestionNear with 40 attempts.
//
//   · A2      (0.90 declared) — mean item served 0.65;  87/87 maths concepts
//                                 have a bank ceiling BELOW the declared target
//   · IB HL   (0.90 declared) — mean item served 0.61; 131/131 below target
//   · AP      (0.85 declared) — mean item served 0.65;  86/87 below target
//   · all 16 advanced tiers  — mean served 0.61 against a mean target of 0.77;
//                              74% of concepts cannot reach their own course's
//                              target; 20% of what an advanced learner is served
//                              is in the recall band.
//
// So the question bank's ceiling, not the curriculum, has been setting the level
// all along: served difficulty spans 0.30–0.65 across the entire curriculum while
// declared targets span 0.35–0.90. A learner who chose A2 was told 0.90 and got
// roughly GCSE-Higher work.
//
// WHY A NEW MODULE. This measurement needs `conceptDepth` (lib/questions.ts) and
// `coverageOf` (lib/specifications.ts), and lib/questions.ts ALREADY imports
// lib/specifications.ts. Putting this in either of them closes a cycle, which is
// exactly the kind of structural damage that is invisible until a harness
// resolves a module in an unlucky order. A third module that imports both keeps
// the graph a DAG.
//
// WHY IT DOES NOT LOWER ANYTHING. The declared number stays exactly as the
// qualification states it. Practice a learner receives is unchanged, because the
// serve already falls back to the nearest available draw when the target is out
// of reach. What changes is that the deployment can now STATE the truth about
// the gap instead of implying that choosing an advanced tier bought exam-level
// work. Silently rewriting the target to whatever the bank happens to hold would
// make every measurement look correct while the learner got the same questions —
// that would disguise missing content as a curriculum decision, which is the one
// thing this file exists to prevent.
//
// Measured by drawing seeds, never declared, so a deeper generator widens the
// ceiling with no edit here. Memoised per (spec, level, subject).
import { conceptDepth, difficultyBandFor, hasGenerator } from "./questions";
import { coverageOf, difficultyFor, type ActiveSpec } from "./specifications";
import type { SubjectId } from "./types";

const CACHE = new Map<string, ContentProfile>();

/** What this course can actually serve for this subject — a DISTRIBUTION, not a
 *  number, and deliberately not the maximum.
 *
 *  The first version of this file reported `max(conceptDepth)` and it flattered
 *  the product badly: every course contains at least one deep concept, so every
 *  course reported a ceiling of 0.86 and only 2 of 16 advanced tiers appeared to
 *  fall short. That is an extremum wearing a capability claim. A learner does not
 *  get the deepest concept in their course, they get a spread of them, and the
 *  share that cannot reach the declared target is the honest headline: 74% of
 *  concepts across the advanced tiers, 87 of 87 for A2, 131 of 131 for IB HL.
 *
 *  So the profile carries the median (the typical experience), the max (the best
 *  this course can offer anywhere), and the share below target (the truth about
 *  coverage). `contentBandFor` reads the MEDIAN, because that is the band a
 *  learner actually meets. */
export interface ContentProfile {
  /** Deepest difficulty reachable, across the course's concepts. */
  max: number;
  /** Median across the course's concepts — the typical item, not the best one. */
  median: number;
  /** Shallowest, so a course that tops out early cannot hide behind its average. */
  min: number;
  /** Concepts in this course+subject that have a generator. */
  concepts: number;
  /** How many of them cannot reach the course's own declared target. */
  belowTarget: number;
  /** `belowTarget / concepts`, 0–1. */
  shareBelowTarget: number;
  /** The declared target, for reference. Never modified. */
  declared: number;
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/** Measure this course's content for this subject. Memoised per
 *  (spec, level, subject) because it draws every concept in the course. */
export function contentProfileFor(active: ActiveSpec, subject: SubjectId): ContentProfile {
  const key = `${active.spec.id}|${active.level.id}|${subject}`;
  const hit = CACHE.get(key);
  if (hit !== undefined) return hit;
  const depths = coverageOf(active)
    .filter((c) => c.subject === subject && hasGenerator(c.id))
    .map((c) => conceptDepth(c.id))
    .sort((a, b) => a - b);
  const declared = difficultyFor(active);
  const below = depths.filter((d) => d < declared - 1e-9).length;
  const profile: ContentProfile = {
    max: depths.length ? depths[depths.length - 1] : 0,
    median: quantile(depths, 0.5),
    min: depths.length ? depths[0] : 0,
    concepts: depths.length,
    belowTarget: below,
    shareBelowTarget: depths.length ? below / depths.length : 0,
    declared,
  };
  CACHE.set(key, profile);
  return profile;
}

/** The deepest difficulty this course can serve for this subject anywhere.
 *  Kept for callers that genuinely want the best case; surfaces about what a
 *  learner will MEET should use `contentProfileFor` / `contentBandFor`. */
export function contentCeilingFor(active: ActiveSpec, subject: SubjectId): number {
  return contentProfileFor(active, subject).median;
}

/** The band 1–5 a learner in this course actually meets — the MEDIAN, not the
 *  maximum. One deep concept does not make a course deep. */
export function contentBandFor(active: ActiveSpec, subject: SubjectId): 1 | 2 | 3 | 4 | 5 {
  return difficultyBandFor(contentProfileFor(active, subject).median);
}

/** How far short of its own declared target this course's content falls, 0–1,
 *  measured on the median concept a learner would be served. */
export function contentShortfallFor(active: ActiveSpec, subject: SubjectId): number {
  const p = contentProfileFor(active, subject);
  if (p.declared <= 0) return 0;
  return Math.max(0, Math.min(1, (p.declared - p.median) / p.declared));
}

/** Does this course declare a demand its own content cannot reach? The one
 *  question a surface should ask before implying a tier bought harder work.
 *  True on the MEDIAN, so a course is not excused by one deep corner. */
export function contentFallsShort(active: ActiveSpec, subject: SubjectId): boolean {
  return contentShortfallFor(active, subject) > 0.01;
}
