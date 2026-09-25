"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RECENT ANSWERS — the learner's own record, newest first.
//
// This was rendered inline on /progress and nowhere else, so Home either
// omitted the evidence or grew a second, drifting copy of it. It is one
// component now, and the rule it enforces is the rule every evidence surface
// here follows:
//
//   `ledger === null`  → we have NOT READ the record. Render nothing. A learner
//                        whose fetch is in flight or refused does not have an
//                        empty history, and saying so would be a lie about them.
//   `events.length === 0` → the record was read and IS empty. That is a state,
//                        and it gets its own honest sentence.
//
// Each row is a real recorded answer: what it was about, what kind of evidence
// it is, whether it was correct, and — disclosed, never hidden — whether a
// device recorded it offline. Nothing here is derived from the model's counts,
// because a count cannot be read back as "the answers behind this".
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { useI18n } from "@/lib/client";
import { ctitle } from "@/lib/content-i18n";
import { citationsFor, recentAnswers, type LedgerFetch } from "@/lib/evidence-view";
import { getConcept } from "@/lib/genome";

export default function RecentAnswers({
  ledger,
  limit = 4,
  /** The section heading. Callers pass a key from their own dictionary. */
  titleKey = "prog.recent",
}: {
  ledger: LedgerFetch | null;
  limit?: number;
  titleKey?: string;
}) {
  const { t, lang } = useI18n();
  // Not read ≠ empty. Nothing is shown for a record we do not have.
  if (!ledger) return null;

  const recents = recentAnswers(ledger.events, limit);
  const cites = citationsFor(
    recents.map((a) => a.id),
    ledger.events,
    { titleFor: (id) => ctitle(lang, id), t, locale: lang === "en" ? undefined : lang },
  );

  return (
    <>
      {recents.length === 0 ? (
        <p className="small muted" style={{ margin: 0 }}>{t("prog.empty")}</p>
      ) : (
        cites.map((c, i) => {
          const conceptId = recents[i]?.conceptId ?? null;
          const subject = conceptId ? getConcept(conceptId)?.subject : undefined;
          const href = conceptId && subject ? `/learn/${subject}/${conceptId}` : null;
          return (
            <div key={c.id} className="rowline">
              <span className={`mark ${c.correct ? "good" : c.correct === false ? "bad" : ""}`} aria-hidden="true">
                {c.correct ? "✓" : c.correct === false ? "✗" : "·"}
              </span>
              <span className="grow small">
                {href ? <Link href={href}>{c.concept}</Link> : c.concept}
                {" "}<span className="muted">· {c.kind}</span>
                {c.offline && <span className="muted"> · {t("evv.offline")}</span>}
              </span>
              {c.score && <span className="mono small">{`${c.score.awarded}/${c.score.max}`}</span>}
              <span className="mono small muted" style={{ width: 52, textAlign: "end" }}>{c.when}</span>
            </div>
          );
        })
      )}
    </>
  );
}
