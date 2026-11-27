"use client";

// THE FRAME EVERY MODEL SITS IN: what am I trying to be able to do, what do I
// expect, what did the model show, what can it not show — in the same place on
// every lesson.
//
// THE PREDICTION GATES THE MODEL. An earlier version left the controls live under
// the question, which produced a drawing pressed before any belief existed and a
// reveal that arrived after the answer was already on screen. The slot now stays
// shut until a commitment is made and carries `data-model-slot="locked" | "open"`,
// so a test or a teacher can see the state without reading pixels.
//
// TWO SHAPES, because one does not fit every subject: a CHOICE where the model
// refutes one named belief, and a DESCRIBE box where the answer is a relationship
// the learner has to put into words. A description is not marked — prose cannot be
// scored (`lib/peer-review.ts`) — so it commits on length alone, the screen says so,
// and the model's reveal does the teaching. Both shapes end in the same place: the
// model opens and the learner uses it.
//
// CONFIDENCE IS ASKED, USED, AND NOT STORED: it changes only the calibration
// sentence, and a feeling filed as data would be evidence this project is not
// entitled to call evidence.
//
// The content lives in `lib/model-teaching.ts` (per concept) and
// `lib/model-assumptions.ts` (per model); this file only draws it.

import { useId, useState } from "react";
import {
  calibrationSentence,
  CONFIDENCE_OPTIONS,
  describeCommitted,
  predictionVerdict,
  teachingForConcept,
  type ConfidenceId,
  type ModelPrediction,
  type PredictionVerdict,
} from "@/lib/model-teaching";
import { assumptionsFor } from "@/lib/model-assumptions";
import type { InteractiveModelId } from "@/lib/interactive-models";

/** The sentence under the prediction, in one place. Three nested ternaries in the
 *  markup is where a wrong branch hides: the choice branch withholds the reveal
 *  until a choice exists, and the describe branch says in as many words that
 *  nothing is marked. */
function predictionNote(predict: ModelPrediction, described: boolean, verdict: PredictionVerdict | null): string {
  if (predict.kind === "choice") {
    return verdict ? verdict.sentence : "Commit to one answer, then try the model and see whether it holds.";
  }
  return described
    ? `Your description is not marked — the model is what answers it. ${predict.reveal}`
    : "Write what you expect, then commit it: the model opens once you have said what you think will happen.";
}

export function ModelShell({
  conceptId,
  model,
  children,
}: {
  conceptId: string;
  model: InteractiveModelId;
  children: React.ReactNode;
}) {
  const teaching = teachingForConcept(conceptId);
  const limits = assumptionsFor(model);
  const [choice, setChoice] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [described, setDescribed] = useState(false);
  const [confidence, setConfidence] = useState<ConfidenceId | null>(null);
  const id = useId();

  // A MODEL WITH NO AUTHORED FRAME IS NOT DRESSED UP AS ONE. The coverage
  // register would already report that as a defect; inventing an objective here
  // would hide it behind a heading that looks authored.
  if (!teaching) return <>{children}</>;

  const predict = teaching.predict;
  const isChoice = predict.kind === "choice";
  const modelName = teaching.model.replace(/-model$/, "").replace(/-/g, " ");
  // NO BRANCH PER SHAPE: `predictionVerdict` returns null for a description, so a
  // describe frame simply has no verdict to show.
  const verdict = choice ? predictionVerdict(teaching, choice) : null;
  // ONCE OPEN, STAYS OPEN. A description can be edited after committing and a
  // choice can be changed: revising a prediction is the point, and sending a
  // learner back behind the gate would punish exactly the behaviour the model is for.
  const committed = isChoice ? choice !== null : described;
  // One value for the DOM, used by both attributes below: "described" is committed
  // but unmarked, which is the honest report for a prose prediction.
  const predicted = isChoice
    ? verdict
      ? verdict.correct
        ? "correct"
        : "not-yet"
      : "unanswered"
    : described
      ? "described"
      : "unanswered";
  const calibration = calibrationSentence(confidence, verdict ? verdict.correct : null);

  return (
    <section
      className="model-shell"
      data-model-shell={model}
      data-model-concept={conceptId}
      data-model-predict-kind={predict.kind}
      data-model-predicted={predicted}
      data-model-confidence={confidence ?? "none"}
      aria-labelledby={`${id}-h`}
    >
      <p className="eyebrow" style={{ margin: 0 }}>
        <span className="no">◐</span> Interactive model · {modelName}
      </p>
      <h2 id={`${id}-h`} className="model-objective">
        {teaching.objective}
      </h2>

      <div className="model-predict" data-model-predict>
        <p className="model-predict-q">
          <b>Predict first.</b> {predict.question}
        </p>

        {predict.kind === "choice" ? (
          <div className="model-predict-options" role="group" aria-label="Your prediction">
            {predict.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`btn small ghost${choice === option.id ? " is-on" : ""}`}
                aria-pressed={choice === option.id}
                onClick={() => setChoice(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="model-describe">
            <label className="small" htmlFor={`${id}-d`}>
              Your prediction — in your own words
            </label>
            {/* THE PROMPT IS TEXT, NOT A PLACEHOLDER. A placeholder is announced by
                some screen readers and not others, and it disappears the moment the
                learner types — so "what to write" has to be a described-by paragraph
                that stays on screen. */}
            <p className="small muted" id={`${id}-p`} style={{ margin: 0 }}>
              {predict.prompt}
            </p>
            <textarea
              id={`${id}-d`}
              className="model-describe-box"
              rows={3}
              value={text}
              aria-describedby={`${id}-p ${id}-u`}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="model-describe-row">
              <button
                type="button"
                className="btn small"
                disabled={described || !describeCommitted(text)}
                aria-describedby={`${id}-u`}
                onClick={() => setDescribed(true)}
              >
                {described ? "Prediction committed" : "Commit my prediction"}
              </button>
              <span className="small muted" id={`${id}-u`}>
                Nothing here is marked or saved.
              </span>
            </div>
          </div>
        )}

        {/* OPTIONAL, AND ASKED BESIDE THE PREDICTION RATHER THAN AFTER IT: the
            point is to know how the learner felt when they committed. */}
        <div className="model-confidence" role="group" aria-label="How confident are you? (optional)">
          <span className="small muted">Optional — how sure are you?</span>
          {CONFIDENCE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`btn small ghost${confidence === option.id ? " is-on" : ""}`}
              aria-pressed={confidence === option.id}
              onClick={() => setConfidence((c) => (c === option.id ? null : option.id))}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p
          className="small model-predict-verdict"
          aria-live="polite"
          data-model-predict-verdict={predicted}
        >
          {predictionNote(predict, described, verdict)}
        </p>

        {/* THE IDEAS THE MODEL WILL SHOW, so a learner can check their own sentence
            against the model rather than against a mark. */}
        {predict.kind === "describe" && described && (
          <ul className="small model-lookfor" data-model-lookfor>
            {predict.lookFor.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}

        {/* NOT A LIVE REGION. It appears with the verdict, which is already
            announced; two polite regions firing together speak over each other. */}
        {calibration && (
          <p className="small model-calibration" data-model-calibration>
            {calibration}
          </p>
        )}
      </div>

      <div className="model-slot" data-model-slot={committed ? "open" : "locked"}>
        {committed ? (
          children
        ) : (
          <div className="model-gate" data-model-gate>
            <p className="small" style={{ margin: 0 }}>
              <b>The model opens once you commit.</b>{" "}
              {isChoice ? "Choose one of the answers above" : "Write a sentence above and commit it"} — it is
              not marked, not saved, and you can change it after the drawing appears. Reading the question
              without {isChoice ? "choosing" : "committing"} is the one thing this model will not let you do.
            </p>
          </div>
        )}
      </div>

      <p className="small model-apply">
        <b>Now use it:</b> {teaching.apply}
      </p>

      {limits && (
        <details className="model-limits" data-model-limits>
          <summary className="small">What this model can and cannot show</summary>
          <div className="small muted">
            <p style={{ margin: "8px 0 4px" }}><b>Written for:</b> {limits.level}</p>
            <p style={{ margin: "8px 0 2px" }}><b>It assumes:</b></p>
            <ul className="lesson-list" style={{ margin: 0 }}>
              {limits.assumptions.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <p style={{ margin: "8px 0 2px" }}><b>It cannot show:</b></p>
            <ul className="lesson-list" style={{ margin: 0 }}>
              {limits.limitations.map((l) => <li key={l}>{l}</li>)}
            </ul>
            <p style={{ margin: "8px 0 2px" }}><b>Where the picture could mislead:</b></p>
            <ul className="lesson-list" style={{ margin: 0 }}>
              {limits.couldIntroduce.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
        </details>
      )}
    </section>
  );
}
