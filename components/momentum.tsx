"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MOMENTUM, AS A ROW ON HOME — a run of days and the next thing to aim at.
//
// This is the one deliberately motivating surface in the product, and it is
// shaped to stay a fact rather than a game:
//
//   · The big number is DAYS IN A ROW WITH A RECORDED ANSWER (lib/momentum). It
//     is not a login streak and there is no way to buy it back.
//   · The week strip shows the last seven days as they actually are — filled
//     where the record holds an answer, hollow where it does not. Today is the
//     outlined one, so "one answer today keeps it" is visible rather than read.
//   · The next milestone is shown with its own counted progress ("2 of 5"), and
//     earned ones carry the DATE THE RECORD CROSSED THE THRESHOLD — never the
//     day the page happened to be opened.
//   · NOTHING IS AWARDED FOR SHOWING UP. Opening this page does not extend the
//     run, and a learner whose record is empty is told the first milestone is
//     one answer away rather than being shown a zero.
// ─────────────────────────────────────────────────────────────────────────────
import { useI18n } from "@/lib/client";
import { fill, localeFor } from "@/lib/i18n";
import { momentumOf, weekdayOf } from "@/lib/momentum";
import type { EvidenceEvent } from "@/lib/evidence";

/** The weekday initial for a day index, in the learner's own language. */
function dayLetter(day: number, locale: string): string {
  const name = new Date(day * 86_400_000).toLocaleDateString(locale, { weekday: "narrow", timeZone: "UTC" });
  return name.slice(0, 2);
}

/** A short date for an earned milestone. `localeFor` is the one mapping from a
 *  dictionary code to a locale — a bare "en" formats American month-first. */
function shortDate(at: number, locale: string): string {
  return new Date(at).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export default function Momentum({ events }: { events: readonly EvidenceEvent[] | null }) {
  const { t, lang } = useI18n();
  // A ledger still in flight is not an empty one: while it has not arrived the
  // panel keeps its heading and says nothing it cannot back up.
  if (events === null) {
    return (
      <section className="card soft home-panel momentum" aria-label={t("mom.title")}>
        <p className="eyebrow flush"><span className="no" aria-hidden="true">✦</span> {t("mom.title")}</p>
        <p className="small muted flush">{t("mom.loading")}</p>
      </section>
    );
  }

  const { momentum, milestones, next } = momentumOf(events);
  const locale = localeFor(lang);
  const begun = momentum.answers > 0;
  const earned = milestones.filter((m) => m.earnedAt !== null);

  return (
    <section className="card soft home-panel momentum" aria-label={t("mom.title")}>
      <p className="eyebrow flush"><span className="no" aria-hidden="true">✦</span> {t("mom.title")}</p>

      {/* THE WEEK, as seven marks. Today last, so the row reads left-to-right
          into the present rather than out of it. */}
      <ol className="momentum-week" aria-hidden="true">
        {momentum.week.map((d) => (
          <li key={d.day} className={`momentum-day${d.today ? " today" : ""}`}>
            <span className={`momentum-dot${d.worked ? " on" : ""}`} />
            <span className="momentum-letter">{dayLetter(d.day, locale)}</span>
          </li>
        ))}
      </ol>

      <p className="momentum-line">
        {momentum.streak > 0 ? (
          <strong>{fill(t("mom.streak"), { n: momentum.streak })}</strong>
        ) : (
          <strong>{t("mom.none")}</strong>
        )}
        <span className="muted small">
          {" · "}
          {fill(t("mom.weekLine"), { n: momentum.week.filter((d) => d.worked).length })}
        </span>
      </p>

      {/* TODAY'S TARGET — the one line a learner can act on right now.

          A run of days is history; "3 of 5 today" is a decision. It is the
          mechanic every habit-forming study app converges on (Duolingo's daily
          goal, RemNote's streak goal, Anki's daily limit), and it is the
          difference between "study some maths", which is not a task, and a
          target with an edge you can see. The bar is the SHARED one and it is
          filled from recorded answers only: it cannot move because a page was
          opened. */}
      <div className="momentum-goal">
        <p className="small flush">
          <span className="muted">{t("mom.goal")}</span>{" "}
          <strong className="mono">{Math.min(momentum.today, momentum.target)}/{momentum.target}</strong>
        </p>
        <div
          className="coverage-bar momentum-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={momentum.target}
          aria-valuenow={Math.min(momentum.today, momentum.target)}
          aria-label={t("mom.goal")}
        >
          <span style={{ width: `${Math.round(Math.min(1, momentum.today / momentum.target) * 100)}%` }} />
        </div>
      </div>

      {/* The sentence, and the case that matters most: a learner coming back
          after a break. Their run is gone and a product that says "no run yet"
          has thrown away something true. The best run is a fact, and "today
          starts a new one" is the only line that invites the return. */}
      <p className="small muted momentum-nudge">
        {momentum.streak === 0 && momentum.best > 0 && momentum.today === 0
          ? `${fill(t("mom.best"), { n: momentum.best })} ${t("mom.back")}`
          : !begun
            ? t("mom.startLine")
            : momentum.atRisk
              ? t("mom.keepLine")
              : momentum.met
                ? t("mom.goalDone")
                : fill(t("mom.goalLeft"), { n: momentum.toGo })}
      </p>

      {/* THE NEXT ONE. A single row rather than the seven: a shelf of unearned
          badges is a list of things you have not done, and the next step is the
          one that can be acted on. Its progress is TEXT, not a second bar — the
          bar above is today, and two bars in one panel make neither look like
          the thing to do next. */}
      {next ? (
        <p className="small flush momentum-next">
          <span className="muted">{t("mom.next")}</span>{" "}
          <strong>{t(next.key)}</strong>
          <span className="mono small muted"> · {fill(t("mom.of"), { n: next.progress, total: next.target })}</span>
        </p>
      ) : null}

      {/* WHAT HAS LANDED, and when. An empty shelf is one honest line rather
          than seven greyed-out rows. */}
      <div className="momentum-earned">
        {earned.length === 0 ? (
          <p className="small muted flush">{t("mom.noneYet")}</p>
        ) : (
          earned.map((m) => (
            <span className="chip good momentum-chip" key={m.id} title={shortDate(m.earnedAt as number, locale)}>
              ✓ {t(m.key)}
              <span className="momentum-date mono">{shortDate(m.earnedAt as number, locale)}</span>
            </span>
          ))
        )}
      </div>

      {/* The honesty line that keeps the motivation from becoming a claim: these
          are days with recorded work and counted thresholds, not ability. */}
      <p className="small muted momentum-foot">{t("mom.foot")}</p>
    </section>
  );
}
