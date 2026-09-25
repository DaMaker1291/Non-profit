"use client";

import { useI18n } from "@/lib/client";
import { citationsFor, basedOn, type Citation, type Dimension } from "@/lib/evidence-view";
import type { EvidenceEvent } from "@/lib/evidence";

/**
 * WHY THIS? — the drawer under the primary recommendation.
 *
 * Three sections, each answering one question a learner actually asks:
 *   BECAUSE   → the engine's own reason, passed through VERBATIM. React adds
 *               no logic here: if a sentence needs to change, it changes in
 *               the engine, for every surface at once.
 *   BASED ON  → what the model has actually measured about the target concept,
 *               with everything unmeasured listed as unmeasured — the "unknown
 *               ≠ zero" philosophy made visible to the learner.
 *   THE EVIDENCE → the specific recorded answers behind the decision, expanded
 *               from the engine's evidenceIds. Raw event fields (schema
 *               versions, provenance flags, ids) never reach this screen;
 *               they become "18 Sep · Diagnostic · 2/5".
 */
export default function EvidenceDrawer({
  reason,
  why,
  expectedOutcome,
  conceptId,
  evidenceIds,
  events,
  projection,
  titleFor,
}: {
  reason: string;
  why: string;
  expectedOutcome: string;
  conceptId: string | null;
  evidenceIds: readonly string[];
  events: readonly EvidenceEvent[];
  projection: import("@/lib/evidence").LearnerProjection;
  titleFor: (conceptId: string) => string;
}) {
  const { t, lang } = useI18n();
  const dims = basedOn(projection, conceptId, t);
  const cites: Citation[] = citationsFor(evidenceIds, events, {
    titleFor, t,
    locale: lang === "en" ? undefined : lang,
  });
  const dimRow = (d: Dimension) => (
    <div key={d.key} className="small" style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
      <span style={{ flex: "none", width: 110 }}>{d.label}</span>
      {d.rate ? (
        <>
          <span className={`chip ${d.band === "strong" ? "good" : ""}`}>{t(`mm.${d.band}`)}</span>
          <span className="mono small muted">{d.rate.correct}/{d.rate.asked}</span>
        </>
      ) : (
        <span className="small muted">{t("evv.unmeasured")}</span>
      )}
    </div>
  );
  return (
    <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 10, display: "grid", gap: 10 }}>
      <div>
        <p className="small" style={{ margin: 0 }}><strong>{t("evv.because")}</strong> {reason}</p>
        <p className="small muted" style={{ margin: "2px 0 0" }}><strong>{t("evv.whyNow")}</strong> {why}</p>
        <p className="small muted" style={{ margin: "2px 0 0" }}><strong>{t("evv.after")}</strong> {expectedOutcome}</p>
      </div>

      <div>
        <p className="small muted" style={{ margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("evv.basedOn")}</p>
        {dims.dimensions.map(dimRow)}
        {dims.unmeasured.length > 0 && (
          <p className="small muted" style={{ margin: "4px 0 0" }}>
            {t("evv.notYet")} {dims.unmeasured.join(" · ")}
          </p>
        )}
      </div>

      {cites.length > 0 ? (
        <div>
          <p className="small muted" style={{ margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("evv.theEvidence")}</p>
          {cites.map((c) => (
            <p key={c.id} className="small" style={{ margin: "0 0 2px" }}>
              <span className="mono small muted">{c.when}</span>
              {" · "}{c.concept}{" · "}{c.kind}{" — "}
              {c.score
                ? <span className="mono">{c.score.awarded}/{c.score.max}</span>
                : c.correct
                  ? <span style={{ color: "var(--tick-green)" }}>✓</span>
                  : <span style={{ color: "var(--margin-red)" }}>✗</span>}
              {c.offline && <span className="small muted"> · {t("evv.offline")}</span>}
            </p>
          ))}
        </div>
      ) : (
        <p className="small muted" style={{ margin: 0 }}>{t("evv.noCitations")}</p>
      )}

      <p className="small" style={{ margin: 0 }}>
        <a href="/progress">{t("evv.timeline")} →</a>
      </p>
    </div>
  );
}
