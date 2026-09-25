"use client";

import Link from "next/link";
import { useState } from "react";
import { decideOne, decisionContextFrom } from "@/lib/decision";
import { incompleteSubjects } from "@/lib/specifications";
import { getConcept } from "@/lib/genome";
import CourseFirst from "@/components/course-first";
import { ctitle } from "@/lib/content-i18n";
import { useI18n } from "@/lib/client";
import type { ProfileState } from "@/lib/types";
import type { EvidenceEvent, LearnerProjection } from "@/lib/evidence";
import EvidenceDrawer from "@/components/evidence-drawer";

/** THE NEXT STEP — the one primary decision on Home.
 *
 *  Exactly one dominant CTA. The engine's remaining actions are the plan
 *  queue, rendered quiet below — never a competing row of buttons.
 *
 *  The "why" is the ENGINE's, not React's: the card passes the action's reason,
 *  why-now, expected outcome and evidenceIds straight to the drawer, and when
 *  the learner's ledger is supplied the drawer expands those ids into the real
 *  recorded answers. Where the ledger is absent the action's own evidence line
 *  still shows — the model state, not a slogan — but no citations are invented.
 *
 *  A ledger still in flight is NOT an empty ledger: `decisionContextFrom` gives
 *  that action the basis `unknown`, so the learner is never told their history
 *  does not exist while the fetch is pending (or after one fails).
 */
export default function NextStep({
  state,
  ledger,
}: {
  state: ProfileState;
  ledger?: { events: EvidenceEvent[]; projection: LearnerProjection } | null;
}) {
  const { t, lang } = useI18n();
  // Through the ONE door (lib/decision): the model AND the ledger it was
  // projected from. Concept names resolve through the content layer, because
  // the recommendation is the most-read text in the product and must not be
  // half English.
  const top = decideOne(decisionContextFrom(state, ledger), {
    tt: t,
    title: (id) => ctitle(lang, id),
  });
  const [open, setOpen] = useState(false);
  if (!top) return null;

  // A RECOMMENDATION MUST REST ON A COURSE THE LEARNER CHOSE. Where a subject's
  // qualification or tier was never picked, specForProfile falls back to the
  // country's first listing — a silent default, and building the day's work on
  // it is the "personalised from static defaults" the platform must not do. The
  // card asks for the missing choice instead, naming the subject, rather than
  // presenting a plan derived from an answer nobody gave.
  const gap = top.conceptId
    ? incompleteSubjects(state.profile).find((g) => g.subject === getConcept(top.conceptId as string)?.subject)
    : undefined;
  if (gap) return <CourseFirst subject={gap.subject} />;

  if (top.kind === "REST") {
    return (
      <section className="card" style={{ borderLeft: "4px solid var(--tick-green)" }}>
        <p className="eyebrow" style={{ margin: 0 }}><span className="no">✓</span> {t("next.title.caughtUp")}</p>
        <p className="small muted" style={{ margin: "8px 0 0" }}>{top.reason}</p>
      </section>
    );
  }
  return (
    <section className="card" style={{ borderLeft: "4px solid var(--margin-red)" }} aria-label={t("next.aria")}>
      {/* No raw `kind` badge: it is an English enum (EXPLAIN, REMEDIATE) that no
          dictionary can translate, and the title already opens with the
          translated verb — "Learn:", "Practise:", "Fix:". */}
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">→</span> {t("next.eyebrow")}</p>
      <p style={{ margin: "10px 0 6px", fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>
        <Link href={top.href}>{top.title}</Link>
      </p>
      <p className="small" style={{ margin: "0 0 14px" }}>{top.reason}</p>

      {/* The single primary action. `next.ctaStart` names the verb AND its
          object — "Start this session" — because the card sits inside a page
          of links, and a CTA that could belong to any card belongs to none. */}
      <Link href={top.href} className="btn" style={{ fontSize: 17, padding: "13px 26px" }}>
        {t("next.ctaStart")} →
      </Link>

      {/* Evidence, subordinate by default. The drawer opens on demand: it
          answers questions a learner asks occasionally, not every visit. */}
      <p className="small muted" style={{ margin: "12px 0 0" }}>
        <button
          type="button"
          className="chip"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          style={{ cursor: "pointer" }}
        >
          {t("next.why")} {open ? "▴" : "▾"}
        </button>
      </p>
      {open && (
        // Nothing to cite is a STATE, not an empty citation list, and the
        // engine's own line is already the honest sentence for it — a drawer of
        // nothing would dress that up as a justification. `no_evidence` (nothing
        // measured yet) and `unrecorded` (work that predates the evidence
        // record) are the two such states; a drawer is drawn for neither.
        // Asked of the DECISION, never inferred from a missing ledger — a
        // learner with a full ledger and an unattributed action still gets the
        // drawer below.
        top.basis === "no_evidence" || top.basis === "unrecorded" ? (
          <div style={{ marginTop: 8, borderTop: "1px dashed var(--line)", paddingTop: 8 }}>
            <p className="small muted" style={{ margin: "0 0 4px" }}>{top.evidence}</p>
            {top.why && <p className="small muted" style={{ margin: "0 0 4px" }}>{top.why}</p>}
          </div>
        ) : ledger ? (
          <div style={{ marginTop: 8 }}>
            <EvidenceDrawer
              reason={top.reason}
              why={top.why}
              expectedOutcome={top.expectedOutcome}
              conceptId={top.conceptId}
              evidenceIds={top.evidenceIds}
              events={ledger.events}
              projection={ledger.projection}
              titleFor={(id) => ctitle(lang, id)}
            />
          </div>
        ) : (
          <div style={{ marginTop: 8, borderTop: "1px dashed var(--line)", paddingTop: 8 }}>
            <p className="small muted" style={{ margin: "0 0 4px" }}>{top.evidence}</p>
            {top.why && <p className="small muted" style={{ margin: "0 0 4px" }}>{top.why}</p>}
            {top.plan.length > 0 && (
              <p className="small muted" style={{ margin: 0 }}>
                <strong className="mono">{t("next.howTitle")}</strong>{" "}
                {top.plan.map((p) => `${p.count} ${t(`plan.${p.kind}`)}`).join(" → ")}
                {" · "}{t("next.oneThing")}
              </p>
            )}
          </div>
        )
      )}

      {/* The remaining ranked actions render as the plan queue on Home
          (PlanQueue in app/dashboard) — this card presents the decision,
          not a second menu. */}
    </section>
  );
}
