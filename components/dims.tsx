"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DIMENSIONS: what we know, as four facts and a meter.
//
// Every dimension the learner model actually keeps — recall, application,
// transfer, retention — rendered the same way on every surface that shows one,
// so "Strong" means the same thing on a concept page, in Mind and in the
// evidence record. The rows come from the LEDGER projection, so a dimension is
// only ever claimed from recorded answers.
//
// The dash is the important half of this component. A dimension with no
// observations is rendered as an em-dash and the words "not yet measured", and
// never as an empty meter: an empty five-step meter reads as "you scored
// nothing", which is a claim about the learner made from the absence of data —
// the one thing this product is built not to do (§1 "unknown ≠ zero").
// ─────────────────────────────────────────────────────────────────────────────
import { useI18n } from "@/lib/client";
import { retentionLabelKey } from "@/lib/proof";
import type { KnowledgeRow } from "@/lib/evidence-view";

/** The five-step meter. Takes a RATE (0–1) or null for "not measured". */
export function Meter({ rate, label }: { rate: number | null; label?: string }) {
  if (rate === null) {
    return <span className="meter empty" aria-hidden="true">—</span>;
  }
  const steps = Math.max(0, Math.min(5, Math.round(rate * 5)));
  return (
    <span className="meter" role="img" aria-label={label ?? `${Math.round(rate * 100)}%`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= steps ? "on" : ""} />
      ))}
    </span>
  );
}

/** The band a rate falls in, in the vocabulary the whole product uses. */
export function bandKey(band: KnowledgeRow["band"]): string {
  return `mm.${band ?? "learning"}`;
}

/**
 * The rows themselves.
 *
 * `showRate` adds the exact fraction beside the meter for the surfaces where a
 * learner is inspecting their own record (the evidence page) and leaves it off
 * where the meter is a glance (a concept page, the Mind map) — the number is
 * always available one tap away, and repeating it everywhere turns a knowledge
 * map back into a dashboard.
 */
export function Dims({ rows, showRate = false }: { rows: KnowledgeRow[]; showRate?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="dims">
      {rows.map((r) => (
        <div className="dim" key={`${r.from}-${r.key}`}>
          <span className="dim-k">{r.label}</span>
          <Meter rate={r.rate ? r.rate.correct / r.rate.asked : null} />
          {/**
           * WHICH WORD. "Not yet measured" for an absence; for retention, the
           * STATE the record is in (retained / forgotten) rather than a band,
           * because "Developing" cannot tell a learner who has just lost
           * something from one who is partway there. Both words come from one
           * rule apiece — lib/proof.ts, and the mark actually earned.
           */}
          <span className={`dim-v ${r.unmeasured ? "empty" : ""}`}>
            {r.unmeasured ? t("teach.unmeasured") : r.state ? t(retentionLabelKey(r.state)) : t(bandKey(r.band))}
            {showRate && r.rate && !r.unmeasured && (
              <span className="mono muted small"> · {r.rate.correct}/{r.rate.asked}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
