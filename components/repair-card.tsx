"use client";

import { useI18n } from "@/lib/client";
import MathText from "@/components/math-text";
import type { RepairPlan } from "@/lib/repair";

/**
 * THE REPAIR CARD — what a learner sees after a SPECIFIC wrong move.
 *
 * It replaces one line the concept page used to print: the misconception's name,
 * a dash, and the first sentence of a coaching paragraph written for every
 * learner at once. Two learners who broke different ideas read the same words,
 * and both read a sentence that had been cut in half.
 *
 * The shape here is the intervention, not the label:
 *
 *   what the move reveals   → the learner recognises the MOVE, not a verdict
 *   the contrast pair       → the same move, twice: once right, once wrong, with
 *                             the single difference that decides the case named
 *                             between them
 *   the move                → one instruction they can carry out
 *   the check               → how to prove it without help, which is the only
 *                             thing that turns a repair into evidence
 *
 * The contrast pair is the part that teaches: a rule can be memorised without
 * being understood, but a pair of cases that differ in exactly one respect is
 * read by the learner as a decision they have to make.
 *
 * NOTHING IS GRADED HERE. The card is feedback on an answer already marked; it
 * holds no state, writes nothing, and the practice door that follows it is what
 * produces the independent evidence.
 */
export default function RepairCard({ plan }: { plan: RepairPlan }) {
  const { t } = useI18n();
  return (
    <div className="repair" role="note" aria-label={t("repair.title")}>
      <p className="eyebrow" style={{ margin: 0 }}>{t("repair.title")}</p>
      <p className="reading lesson-text" style={{ margin: "8px 0 0", fontSize: "1.0625rem" }}>
        {plan.reveals}
      </p>

      {/* THE CONTRAST PAIRS — one per distinct move behind the slip. Side by
          side on a wide screen, stacked on a phone: the pair has to be readable
          as a pair, so it is never allowed to become a column of two unrelated
          paragraphs. A slip with two moves (subtracting a negative AND
          multiplying two negatives) shows both, because a learner answered a
          multiplication item with a subtraction explanation is a learner told
          the wrong thing confidently. */}
      {plan.contrasts.map((c, i) => (
        <div key={i}>
          <div className="repair-pair">
            <div className="repair-side ok">
              <p className="eyebrow" style={{ margin: 0 }}>{t("repair.works")}</p>
              <p className="repair-item"><MathText text={c.works} /></p>
              <p className="small muted" style={{ margin: "4px 0 0" }}>{c.worksNote}</p>
            </div>
            <div className="repair-side no">
              <p className="eyebrow" style={{ margin: 0 }}>{t("repair.fails")}</p>
              <p className="repair-item"><MathText text={c.fails} /></p>
              <p className="small muted" style={{ margin: "4px 0 0" }}>{c.failsNote}</p>
            </div>
          </div>
          <p style={{ margin: "10px 0 0" }}>
            <b>{t("repair.diff")}</b> {c.difference}
          </p>
          {/* THE CORRECTED STEP BELONGS TO THE MOVE, not to the slip: a slip with
              two moves needs two instructions, and one written for the other
              move is wrong advice delivered confidently. */}
          <p style={{ margin: "8px 0 0" }}>
            <b>{t("repair.move")}</b> {c.move}
          </p>
        </div>
      ))}
      <p className="small muted" style={{ margin: "10px 0 0" }}>
        {plan.check}{" "}
        <span className="tag">
          {t(plan.review === "subject-reviewed" ? "plan.reviewed" : "plan.unreviewed")}
        </span>
      </p>
    </div>
  );
}
