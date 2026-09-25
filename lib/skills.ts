// ─────────────────────────────────────────────────────────────────────────────
// THE DEMAND LADDER — the five levels a serious diagnostic discriminates
// between, and the ONE definition of which difficulty belongs to which.
//
// It lives on its own, importing nothing, because two very different modules
// need it and neither may own the other:
//
//   · the QUESTION SERVE (lib/questions.ts) aims an item at a demand level, and
//   · the DIAGNOSTIC REPORT (lib/diagnostic.ts) buckets every answer it served
//     back into a demand level.
//
// Those two disagreeing is not a cosmetic bug: a ladder stage that means
// "application" would serve an item the report files under "recall", the
// sitting would end with a band the course CAN express reported as unmeasured,
// and a learner would be shown a gap that is an artefact of the serve. The
// numbers below are therefore read by both, never restated.
//
// ── This is not the same table as `difficultyBandFor` ──────────────────────
// `difficultyBandFor` (lib/questions.ts) cuts the same range into five RUNG
// bands for tiers, practice targeting and payload labels. The demand ladder cuts
// it into five COGNITIVE levels. They are deliberately different questions —
// "one rung harder than the easiest" is not "demands application" — and the two
// boundaries must never be used interchangeably: a 0.31 item is rung band 2 and
// still asks for recall.
// ─────────────────────────────────────────────────────────────────────────────

export type SkillId =
  | "recall" | "application" | "multi_step" | "data_interpretation" | "extended_response";

export const SKILL_LADDER: SkillId[] = [
  "recall", "application", "multi_step", "data_interpretation", "extended_response",
];

/** The difficulty at which each demand level begins. The ONE definition of the
 *  mapping; `skillForDifficulty` reads it rather than repeating the numbers. */
export const SKILL_MIN_DIFFICULTY: Record<SkillId, number> = {
  recall: 0,
  application: 0.35,
  multi_step: 0.55,
  data_interpretation: 0.75,
  // Never reached by difficulty: an extended written answer is not a harder
  // multiple-choice item, it is a different instrument.
  extended_response: 1.01,
};

/** Demand levels this bank can actually produce.
 *
 *  Not a wish list, and not a wish list that has stopped moving. It used to be
 *  three bands: no question in the bank declared a difficulty at or above
 *  `data_interpretation`'s floor, and only three concepts reached multi-step at
 *  all. The depth layer (lib/questions-deep.ts) changed what the bank can
 *  actually serve — 29 concepts now express multi-step and 8 express
 *  data-and-graphs — so the declaration moves WITH reality rather than ahead of
 *  it. `npm run verify` sweeps every generator and fails if the two disagree in
 *  either direction: a band claimed but unreachable, or a band reached while the
 *  declaration denies it. The day someone authors a deeper generator, the test
 *  tells them to move the band in, instead of the claim quietly rotting. */
export const SKILLS_IN_BANK: SkillId[] = ["recall", "application", "multi_step", "data_interpretation"];

export const SKILLS_NOT_IN_BANK: SkillId[] = SKILL_LADDER.filter((s) => !SKILLS_IN_BANK.includes(s));

/** Can a concept whose generator reaches `depth` express this demand level?
 *
 *  A NECESSARY condition, not a sufficient one: it asks whether the ceiling
 *  clears the floor. A concept whose items are all hard (`0.79–0.85`) clears
 *  the application floor and still cannot serve an application item, which is
 *  why `conceptSkills` exists and why the diagnostic report asks THAT question
 *  about the concepts it actually sampled. */
export function bandReachable(skill: SkillId, depth: number): boolean {
  return depth >= SKILL_MIN_DIFFICULTY[skill];
}

/** The target skill mix of a diagnostic (§2). 20/30/20/20 of producible
 *  items; the missing 10% is the extended response the bank cannot write, and
 *  it is spread across the rest rather than renormalised away silently. */
export const SKILL_MIX: Record<SkillId, number> = {
  recall: 0.2, application: 0.3, multi_step: 0.2, data_interpretation: 0.2, extended_response: 0.1,
};

/** Difficulty → demanded skill level. Documented, monotone, and the only place
 *  the mapping lives. */
export function skillForDifficulty(d: number): SkillId {
  if (d < SKILL_MIN_DIFFICULTY.application) return "recall";
  if (d < SKILL_MIN_DIFFICULTY.multi_step) return "application";
  if (d < SKILL_MIN_DIFFICULTY.data_interpretation) return "multi_step";
  return "data_interpretation";
}

/** Ladder position, so "above" and "below" mean the same thing to the serve as
 *  they do to the report. */
export function skillRank(skill: SkillId): number {
  return SKILL_LADDER.indexOf(skill);
}
