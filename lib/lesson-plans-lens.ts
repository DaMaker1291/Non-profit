/** The extra teaching a supplemental plan adds to a concept's authored genome
 *  note. One per concept that has no full pilot plan.
 *
 *  This is deliberately not a template: `intuition`, `move` and `check` are
 *  written for the concept, and `trap` names a wrong move a learner actually
 *  makes. The builder adds the concept's own genome lesson and its named
 *  misconceptions, so the resulting plan is a sequence rather than a relabelled
 *  paragraph — while still being honestly marked `unreviewed`.
 */
export interface LessonLens {
  /** A concrete situation, before the terminology. */
  readonly intuition: string;
  /** The method in one or two sentences. */
  readonly move: string;
  /** A check the learner can run without asking anyone. */
  readonly check: string;
  /** One wrong move and why it fails. The builder adds the named misconception
   *  from the catalogue, plus a subject-level check, so every plan has at least
   *  three traps. */
  readonly trap: readonly [string, string];
}
