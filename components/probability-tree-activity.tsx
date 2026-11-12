"use client";

import { useState } from "react";
import * as api from "@/lib/api/client";
import { LessonFigure } from "@/components/lesson-figure";
import { PROBABILITY_TREE_ACTIVITY, type TreeActivitySpec } from "@/lib/probability-activities";

// COMPLETE THE TREE, THEN CHECK IT.
//
// The drawing shows the first and second branch probabilities but NOT the four
// path totals: those are the answers. The learner fills the three path values
// and says whether the draws are independent. The server compares each value,
// returns a line for every field, and records the attempt as evidence.
//
// The lesson's central error is multiplying 3/5 by 3/5 as if the bag were
// restored. This activity makes the second branch visible and asks the learner
// to say why it changes, so a wrong answer is diagnosable rather than just
// "wrong".

type Values = Record<string, string>;
type Verdict = api.ProbabilityActivityResult | null;

function emptyValues(spec: TreeActivitySpec): Values {
  return Object.fromEntries(spec.fields.map((field) => [field.key, ""]));
}

export function ProbabilityTreeActivity({
  learnerId,
  spec = PROBABILITY_TREE_ACTIVITY,
}: {
  learnerId: string | null;
  spec?: TreeActivitySpec;
}) {
  const [values, setValues] = useState<Values>(() => emptyValues(spec));
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = spec.fields.every((field) => (values[field.key] ?? "").trim() !== "");

  function setValue(key: string, next: string): void {
    setValues((current) => ({ ...current, [key]: next }));
    setVerdict(null);
  }

  async function submit(): Promise<void> {
    if (!learnerId || !complete) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.probabilityActivity({
        id: learnerId,
        conceptId: spec.conceptId,
        activityId: spec.activityId,
        response: values,
      });
      setVerdict(result);
    } catch {
      setError("The tree could not be marked just now. Your values are still above; compare them with the branches.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" data-probability-tree aria-label="Interactive probability tree" style={{ marginBottom: 18 }}>
      <p className="eyebrow" style={{ margin: 0 }}>Follow the branches</p>
      <h3 className="reading" style={{ margin: "6px 0 0" }}>{spec.title}</h3>
      <p className="reading lesson-text" style={{ marginTop: 8 }}>{spec.intro}</p>

      <LessonFigure
        spec={spec.tree}
        showPaths={false}
        caption={spec.caption}
      />

      <fieldset style={{ border: 0, padding: 0, margin: "14px 0 0" }}>
        <legend className="reading" style={{ fontWeight: 600 }}>Complete the values</legend>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginTop: 8 }}>
          {spec.fields.map((field) => (
            <label key={field.key} className="reading small" style={{ display: "grid", gap: 4 }}>
              {field.label}
              {field.kind === "choice" ? (
                <select
                  className="input"
                  data-tree-field={field.key}
                  value={values[field.key] ?? ""}
                  onChange={(event) => setValue(field.key, event.target.value)}
                  disabled={busy || !learnerId}
                >
                  <option value="">Choose…</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  data-tree-field={field.key}
                  value={values[field.key] ?? ""}
                  onChange={(event) => setValue(field.key, event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") void submit(); }}
                  disabled={busy || !learnerId}
                  placeholder="fraction, decimal or percentage"
                />
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        className="btn"
        data-tree-submit
        onClick={() => void submit()}
        disabled={!learnerId || !complete || busy}
        style={{ marginTop: 10 }}
      >
        {busy ? "Checking…" : "Check the tree"}
      </button>
      {!learnerId && (
        <p className="reading small muted" style={{ marginTop: 6 }}>
          Sign in to have this marked and recorded. You can still complete the values and compare
          them with the branches.
        </p>
      )}
      {error && <p className="reading small" role="status" style={{ marginTop: 10 }}>{error}</p>}

      {verdict && (
        <div
          className={`note ${verdict.correct ? "yes" : "no"}`}
          role="status"
          aria-live="polite"
          data-tree-verdict
          style={{ marginTop: 10 }}
        >
          <strong>{verdict.correct ? "Correct" : "Not yet"}</strong>
          <p className="reading small" style={{ marginTop: 4 }}>{verdict.feedback}</p>
          {verdict.fields && (
            <ul className="reading small" style={{ marginTop: 6 }}>
              {verdict.fields.map((field) => (
                <li key={field.key} className={field.correct ? "yes" : "no"}>
                  {field.correct
                    ? `${field.label}: correct`
                    : `${field.label}: not yet — ${field.modelAnswer}`}
                </li>
              ))}
            </ul>
          )}
          <p className="reading small muted" style={{ marginTop: 4 }}>
            Model answer: {verdict.modelAnswer}
          </p>
        </div>
      )}
    </section>
  );
}
