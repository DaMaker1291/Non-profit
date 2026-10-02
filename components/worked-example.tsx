"use client";

// ─────────────────────────────────────────────────────────────────────────────
// A WORKED EXAMPLE of the decision engine, for a reader who wants to SEE that a
// recommendation is traceable rather than take it on faith.
//
// WHY IT IS NOT ON THE LANDING PAGE. It used to be, and that was the fault this
// component was extracted to fix. The block presents a decision composed over a
// real ledger (lib/example-decision.ts) — but a ledger belonging to NOBODY the
// reader is. On the front door it read as telemetry about a real student: "6
// answers, 3 right, 3 needed help", beside an internal item id. A visitor
// arriving at a free learning app is not asking for our sample record; they are
// asking whether this will work for them. So it lives on /about, where a
// teacher, reviewer or funder is actually looking for evidence, and the landing
// page is a map of the product rather than a demonstration of it.
//
// The engineering markers went with it: the `§` section glyph is gone (it was
// an editorial convention that read as a spec document to a student), and the
// raw item id no longer crosses this boundary at all — see `decider` in
// lib/example-decision.ts.
//
// It renders nothing at all when the engine cannot compose a decision. A
// stand-in card would be the one thing this component may not do: the whole
// point is that the card was not written by hand.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo } from "react";
import { useI18n } from "@/lib/client";
import { fill } from "@/lib/i18n";
import { exampleDecision, type ExampleFactId } from "@/lib/example-decision";

const FACT_KEY: Record<ExampleFactId, string> = {
  attempts: "home.fAttempts",
  correct: "home.fCorrect",
  helped: "home.fHelped",
  slip: "home.fSlip",
};

export default function WorkedExample() {
  const { t, lang } = useI18n();
  // Composed by the real engine over the real ledger, not written here. Pure
  // and memoised: identical for identical arguments, so a re-render cannot
  // quietly produce a different card than the one a reader was shown before.
  const example = useMemo(() => exampleDecision(lang, t), [lang, t]);
  if (!example) return null;

  return (
    <div className="worked-grid">
      <div className="margin-facts">
        <p className="ledger-h">{t("home.record")}</p>
        {example.facts.map((f) => (
          <div className="fact" key={f.id}>
            <span className="fact-n">{f.value}</span>{" "}
            <span className="fact-k">{t(FACT_KEY[f.id])}</span>
          </div>
        ))}
        {example.decider && (
          <div className="decider">
            <span className="decider-k">{t("home.decider")}</span>
            <span className="decider-v">{example.decider.slip}</span>
          </div>
        )}
      </div>

      {/* The card: the same six fields Home shows a learner, from the same
          engine — kind, duration, title, reason, evidence, why. */}
      <div className="card">
        <p className="courseline">
          → {t("next.eyebrow")} · ~{example.minutes} {t("next.ev.min")}
        </p>
        <h3 className="h2">{example.title}</h3>
        <p style={{ margin: "0 0 10px", fontSize: 15.5 }}>{example.reason}</p>
        <p className="mono small muted" style={{ margin: "0 0 10px" }}>{example.evidence}</p>
        <p className="small muted" style={{ margin: 0 }}>{example.why}</p>
        <p
          className="small muted"
          style={{ margin: "12px 0 0", paddingTop: 10, borderTop: "1px dashed var(--line)" }}
        >
          {fill(t("home.cited"), { n: example.cited })}
        </p>
      </div>
    </div>
  );
}
