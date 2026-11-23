"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LessonFigure } from "./lesson-figure";
import type { ClassroomSession } from "@/lib/classroom-session";

/** A projector-first presenter. Deliberately no scoreboard, no learner login and
 *  no evidence writes: a whole-class answer is not one pupil's mastery. */
export function ClassroomPresenter({ session, worksheetHref, keyHref, guideHref }: { session: ClassroomSession; worksheetHref: string; keyHref: string; guideHref: string }) {
  const pathname = usePathname();
  const [index, setIndex] = useState(0);
  const [groupMode, setGroupMode] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const slide = session.slides[index];
  const last = session.slides.length - 1;

  const go = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(last, next)));
    setShowAnswer(false);
  }, [last]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") { event.preventDefault(); go(index + 1); }
      if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); go(index - 1); }
      if (event.key === "g" || event.key === "G") setGroupMode((v) => !v);
      if (event.key === "n" || event.key === "N") setShowNotes((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  return (
    <div className={`presenter ${groupMode ? "presenter-group" : ""}`}>
      <header className="presenter-bar">
        <div>
          <p className="presenter-kicker">{session.subject} · {session.title}</p>
          <p className="presenter-count">Slide {index + 1} of {session.slides.length} · v{session.version} · {session.review.replace(/_/g, " ")}</p>
        </div>
        <div className="presenter-controls">
          <label className="presenter-context-select">
            <span>Classroom</span>
            <select
              value={session.context.id}
              onChange={(event) => window.location.assign(`${pathname}?context=${event.target.value}`)}
            >
              {session.contexts.map((context) => (
                <option key={context.id} value={context.id}>{context.label}</option>
              ))}
            </select>
          </label>
          <button type="button" className="btn secondary" onClick={() => setGroupMode((v) => !v)} aria-pressed={groupMode}>
            {groupMode ? "Group mode" : "Whole class"}
          </button>
          <button type="button" className="btn ghost" onClick={() => setShowNotes((v) => !v)} aria-pressed={showNotes}>Notes</button>
          <button type="button" className="btn ghost" onClick={() => go(index - 1)} disabled={index === 0}>Back</button>
          <button type="button" className="btn primary" onClick={() => go(index + 1)} disabled={index === last}>Next</button>
        </div>
      </header>

      <section className="presenter-contextbar" aria-label="Classroom conditions">
        <strong>{session.context.label}.</strong>{" "}
        <span>{session.context.summary}</span>{" "}
        <span className="presenter-small">{session.context.assumptions[0]}</span>
      </section>

      {groupMode ? (
        <section className="presenter-groupbar" aria-label="Group routine">
          <strong>One device per group.</strong>
          <span>{session.groupRoutine.join(" · ")}</span>
        </section>
      ) : null}

      <main className="presenter-stage">
        <p className="presenter-eyebrow">{slide.eyebrow}</p>
        <h1>{slide.heading}</h1>
        {slide.paragraphs.map((p, i) => <p key={i} className="presenter-paragraph">{p}</p>)}
        {slide.bullets.length > 0 ? (
          <ul className="presenter-bullets">{slide.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
        ) : null}
        {slide.figure ? <LessonFigure spec={slide.figure.spec} caption={slide.figure.caption} /> : null}

        {groupMode && slide.groupPrompt ? (
          <aside className="presenter-grouptask"><strong>Group task:</strong> {slide.groupPrompt}</aside>
        ) : null}

        {showAnswer && slide.answer ? (
          <aside className="presenter-answer"><strong>Teacher answer:</strong> {slide.answer}</aside>
        ) : null}
      </main>

      {showNotes ? (
        <aside className="presenter-notes">
          <p><strong>Teacher note.</strong> {slide.teacherPrompt}</p>
          <p className="presenter-small">{session.evidenceNote}</p>
          <div className="presenter-links">
            <Link href={worksheetHref}>Printable worksheet</Link>
            <Link href={guideHref}>Teacher guide</Link>
            <Link href={keyHref}>Teacher answer key</Link>
            <Link href={`/learn/${session.subject}/${session.conceptId}`}>Digital lesson</Link>
          </div>
        </aside>
      ) : null}

      <footer className="presenter-foot">
        <span>Arrow keys move · G group mode · N teacher notes</span>
        <div className="presenter-dots" aria-hidden="true">
          {session.slides.map((s, i) => (
            <button key={s.id} type="button" className={i === index ? "on" : ""} onClick={() => go(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
        {slide.answer ? (
          <button type="button" className="btn ghost" onClick={() => setShowAnswer((v) => !v)}>
            {showAnswer ? "Hide answer" : "Reveal answer"}
          </button>
        ) : <span />}
      </footer>
    </div>
  );
}
