"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/client";
import { workedExample } from "@/lib/api/client";
import { mcName, mcCoaching } from "@/lib/content-i18n";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
// The split lives in lib so it can be MEASURED (scripts/verify-engines.mjs
// drives real bank explanations through it): a fade that cuts a decimal in half
// is a working example that is simply wrong.
import { firstMoveOf } from "@/lib/lesson-plans";
import PromptText from "@/components/prompt-text";
import MathText from "@/components/math-text";
import type { WorkedExampleView } from "@/lib/types";

/**
 * THE LESSON'S WORKED EXAMPLE — "I do", and then "we do".
 *
 * NOT components/worked-example.tsx, which is a different thing entirely: that
 * one shows a reader of /about a decision the real engine composed over a sample
 * ledger. This one shows a LEARNER an item of their own concept solved. The two
 * names are close enough that the second file was first written over the first;
 * they are separate on purpose, and this one is named for the lesson.
 *
 * A lesson that is one paragraph and a button is a reference, not a lesson. The
 * order a learner needs is the one a maths classroom uses: watch one done
 * properly, then do one with help, then do one alone. The page already had the
 * last two (the hint ladder beside the question, then independent practice) and
 * it was missing the first — so the lesson's only content was prose, and the
 * first item a learner met was also the first they had to do unaided.
 *
 * TWO MODES, AND THE SECOND IS THE FADE.
 *
 *   `worked`  — the whole method shown in full. Watch one.
 *   `guided`  — only the FIRST STEP is shown. The learner supplies the rest in
 *               their head or on paper, then checks. That gap is the point:
 *               seeing a full solution teaches recognition, and starting one
 *               teaches the method. It is also why the guided item is drawn
 *               slightly deeper (0.45) than the worked one (0.35) — by then the
 *               learner has seen the shape of it once.
 *
 * This renders a REAL item from the concept's own generator. Nothing is recorded
 * and nothing is graded: it is deliberately not a question, so it cannot count as
 * evidence, cannot be wrong, and cannot be mistaken for practice. The route that
 * serves it is profile-less for the same reason — see
 * app/api/worked-example/route.ts, including why it takes no seed.
 *
 * REVEAL ON A PRESS, NOT ON LOAD. A solved item that appears already solved is
 * read in two seconds; one that opens at "Show me how" at least lets the learner
 * try it in their head first, which is the only thing that makes a worked
 * example work.
 */

/** THE FADE'S ONE DEPENDENCY: which sentence of the working is the first move.
 *  It lives in `lib/lesson-plans.ts#firstMoveOf` so the verification suite can
 *  drive real bank explanations through it — a fade that cuts a decimal in half
 *  is a worked example that is simply wrong. */
export default function LessonWorkedExample({
  conceptId,
  mode = "worked",
}: {
  conceptId: string;
  /** `worked` = watch one whole (default) · `guided` = first step shown, rest yours. */
  mode?: "worked" | "guided";
}) {
  const { t, lang } = useI18n();
  const [item, setItem] = useState<WorkedExampleView | null>(null);
  /** How far this item has been revealed. For `worked` it is closed → whole
   *  solution; for `guided` there is a middle state: the first move, then the
   *  rest. A number rather than two booleans because the two modes are two
   *  lengths of the same staircase. */
  const [reveal, setReveal] = useState<0 | 1 | 2>(0);
  const [failed, setFailed] = useState(false);
  /** HOW DEEP THIS EXAMPLE SITS. One worked example teaches a method; a second
   *  and third at rising depth are what turn watching into attempting — the
   *  learner has to predict more of each one before pressing the button. It
   *  starts below the practice target (so the first is copyable) and stops well
   *  below the hardest item the concept can make, because a stretch item belongs
   *  in the practice, not in the lesson. The guided item starts a step higher:
   *  it comes after the worked one, and it is meant to be attempted. */
  const [target, setTarget] = useState(mode === "guided" ? 0.45 : 0.35);

  const load = useCallback(() => {
    let live = true;
    setFailed(false);
    setItem(null);
    setReveal(0);
    workedExample(conceptId, lang, target)
      .then((body) => { if (live) setItem(body); })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [conceptId, lang, target]);

  useEffect(() => load(), [load]);

  const guided = mode === "guided";
  const split = item ? firstMoveOf(item.explanation) : { first: "", rest: "" };
  /** In guided mode the answer row is marked only once the learner has seen the
   *  whole working — before that, the point is that they supply it. */
  const answerShown = guided ? reveal === 2 : reveal >= 1;
  const eyebrow = guided ? t("plan.together") : t("worked.eyebrow");
  const lead = guided ? t("plan.guidedLead") : t("worked.lead");

  return (
    <section className="card" style={{ marginBottom: 18 }} aria-label={eyebrow}>
      <p className="eyebrow" style={{ margin: 0 }}>{eyebrow}</p>
      <p className="small muted" style={{ marginTop: 4 }}>{lead}</p>

      {failed && (
        <p className="small" style={{ marginTop: 8 }} role="status">
          {t("worked.err")}{" "}
          <button type="button" className="linkish" onClick={() => load()}>{t("common.retry")}</button>
        </p>
      )}
      {!failed && !item && <p className="small muted" style={{ marginTop: 8 }}>{t("common.loading")}</p>}

      {item && (
        <>
          <div className="qprompt" style={{ marginTop: 10 }}>
            <PromptText text={item.prompt} figure={item.figure} />
          </div>
          {/* THE OPTIONS ARE A LIST, NOT BUTTONS. Nothing here can be pressed to
              answer: this is the item being narrated, and a control that looks
              like practice but records nothing is how a learner learns to
              distrust the real one. */}
          <ol className="worked-choices">
            {item.choices.map((choice, i) => {
              const correct = i === item.answerIndex;
              return (
                <li key={i} className={answerShown && correct ? "worked-correct" : ""}>
                  <span className="mark" data-idx={String.fromCharCode(65 + i)} />
                  <span><MathText text={choice} /></span>
                  {answerShown && correct && <span className="small"> — {t("worked.answer")}</span>}
                </li>
              );
            })}
          </ol>

          {/* ── WORKED: one press shows the whole method. ─────────────────── */}
          {!guided && (
            reveal === 0 ? (
              <button className="btn small" onClick={() => setReveal(1)}>{t("worked.show")} →</button>
            ) : (
              <div className="note" style={{ marginTop: 4 }}>
                <strong>{t("learn.explain")}</strong>
                <span><MathText text={item.explanation} /></span>
                {item.misconceptionId && MISCONCEPTIONS_BY_ID[item.misconceptionId] && (
                  <p className="small muted" style={{ margin: "8px 0 0" }}>
                    <span className="tag">
                      {mcName(lang, item.misconceptionId, MISCONCEPTIONS_BY_ID[item.misconceptionId].name)}
                    </span>{" "}
                    {mcCoaching(lang, item.misconceptionId, MISCONCEPTIONS_BY_ID[item.misconceptionId].coaching)}
                  </p>
                )}
                {/* THE NEXT STEP ONLY APPEARS ONCE THIS ONE IS READ. Offering
                    "another, harder" beside a solved item nobody has looked at yet
                    is a button that invites skipping the teaching. */}
                <p style={{ margin: "12px 0 0" }}>
                  <button
                    className="btn ghost small"
                    onClick={() => setTarget((v) => Math.min(0.85, Math.round((v + 0.15) * 100) / 100))}
                  >
                    {t("worked.another")} →
                  </button>
                </p>
              </div>
            )
          )}

          {/* ── GUIDED: first move, then the rest. ────────────────────────── */}
          {guided && (
            reveal === 0 ? (
              <button className="btn small" onClick={() => setReveal(1)}>{t("plan.firstStep")} →</button>
            ) : (
              <div className="note" style={{ marginTop: 4 }}>
                <strong>{t("plan.firstStep")}</strong>
                <span><MathText text={split.first} /></span>
                {reveal === 1 && split.rest && (
                  <>
                    <p className="small muted" style={{ margin: "10px 0 0" }}>{t("plan.finishIt")}</p>
                    <p style={{ margin: "10px 0 0" }}>
                      <button className="btn small" onClick={() => setReveal(2)}>{t("plan.rest")} →</button>
                    </p>
                  </>
                )}
                {reveal === 2 && (
                  <>
                    {split.rest && (
                      <p style={{ margin: "10px 0 0" }}><MathText text={split.rest} /></p>
                    )}
                    {item.misconceptionId && MISCONCEPTIONS_BY_ID[item.misconceptionId] && (
                      <p className="small muted" style={{ margin: "8px 0 0" }}>
                        <span className="tag">
                          {mcName(lang, item.misconceptionId, MISCONCEPTIONS_BY_ID[item.misconceptionId].name)}
                        </span>{" "}
                        {mcCoaching(lang, item.misconceptionId, MISCONCEPTIONS_BY_ID[item.misconceptionId].coaching)}
                      </p>
                    )}
                  </>
                )}
              </div>
            )
          )}
        </>
      )}
    </section>
  );
}
