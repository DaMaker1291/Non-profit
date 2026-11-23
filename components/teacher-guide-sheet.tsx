import type { TeacherGuide } from "@/lib/teacher-guide";

/** The teacher's run sheet. Contains prompts and teaching notes, but no
 *  assessment model answers: those stay in the separate authenticated key. */
export function TeacherGuideSheet({ guide }: { guide: TeacherGuide }) {
  return (
    <div className="print-sheet teacher-guide">
      <header className="print-header">
        <p className="print-kicker">OpenMind · teacher guide · not for pupils</p>
        <h1>{guide.title}</h1>
        <p className="print-meta">
          {guide.subject} · {guide.curriculum.reference} · {guide.curriculum.level} · version {guide.version} · review state: {guide.review.replace(/_/g, " ")}
        </p>
        <p className="guide-context">
          <strong>Classroom condition: {guide.context.label}.</strong> {guide.context.summary}
        </p>
      </header>

      <section>
        <h2>At a glance</h2>
        <ul>{guide.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
        <p className="print-small">{guide.context.assumptions.join(" ")}</p>
      </section>

      <section>
        <h2>Before the lesson</h2>
        <ul>{guide.preparation.map((p, i) => <li key={i}>{p}</li>)}</ul>
      </section>

      <section>
        <h2>Board plan</h2>
        <ul>{guide.boardWork.map((b, i) => <li key={i}>{b}</li>)}</ul>
      </section>

      <section>
        <h2>Suggested run of show — 40 minutes</h2>
        <p className="print-small">Adapt the timings to the period you actually have. The order matters more than the minutes.</p>
        <table className="guide-table">
          <thead><tr><th>Min</th><th>Step</th><th>What the teacher does</th></tr></thead>
          <tbody>
            {guide.sequence.map((s, i) => (
              <tr key={i}><td>{s.minutes}</td><td><strong>{s.step}</strong></td><td>{s.detail}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Temporary groups for this lesson</h2>
        <p className="print-small">{guide.groupNote}</p>
        <table className="guide-table guide-groups">
          <thead><tr><th>Group</th><th>Focus</th><th>Task</th><th>What to check</th></tr></thead>
          <tbody>
            {guide.groups.map((g) => (
              <tr key={g.level}><td><strong>{g.level}</strong></td><td>{g.focus}</td><td>{g.task}</td><td>{g.check}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      {guide.priorKnowledge.length > 0 ? (
        <section>
          <h2>Prior-knowledge check</h2>
          {guide.priorKnowledge.map((q, i) => (
            <article key={i} className="print-item print-break-avoid">
              <p><strong>Ask:</strong> {q.question}</p>
              <p className="print-small"><strong>Expected answer:</strong> {q.answer}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section>
        <h2>Teacher explanation</h2>
        {guide.explanation.map((e, i) => (
          <div key={i} className="print-block print-break-avoid">
            <h3>{e.heading}</h3>
            {e.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
          </div>
        ))}
      </section>

      {guide.workedExample ? (
        <section>
          <h2>Worked example on the board</h2>
          <p><strong>{guide.workedExample.prompt}</strong></p>
          <ol className="print-steps">
            {guide.workedExample.steps.map((s, i) => (
              <li key={i}><strong>{s.move}</strong><br /><span className="print-small">Why: {s.why}</span></li>
            ))}
          </ol>
          <p className="print-answer-line"><strong>Answer:</strong> {guide.workedExample.answer}</p>
        </section>
      ) : null}

      {guide.misconceptions.length > 0 ? (
        <section>
          <h2>What to listen for</h2>
          {guide.misconceptions.map((m, i) => (
            <article key={i} className="print-item print-break-avoid">
              <p><strong>Likely wrong belief:</strong> {m.belief}</p>
              <p><strong>Why it fails:</strong> {m.whyItFails}</p>
              <p><strong>Say instead:</strong> {m.correction}</p>
              <p className="print-small">Wrong: {m.contrast.wrong} · Right: {m.contrast.right}</p>
            </article>
          ))}
        </section>
      ) : null}

      {guide.guidedPractice.length > 0 ? (
        <section>
          <h2>Let us do one together</h2>
          {guide.guidedPractice.map((g, i) => (
            <article key={i} className="print-item print-break-avoid">
              <p><strong>{g.prompt}</strong></p>
              <p className="print-small"><strong>Hint if stuck:</strong> {g.hint}</p>
              <p className="print-small"><strong>Expected answer:</strong> {g.answer}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section>
        <h2>Independent assessment · {guide.assessmentTotal} marks</h2>
        <p className="print-small">Pupils answer these independently on the worksheet. Mark with the separate answer key; a group answer is not individual evidence.</p>
        <ol>
          {guide.assessment.map((a, i) => (
            <li key={i}>
              {a.prompt} <span className="print-small">[{a.marks} mark{a.marks === 1 ? "" : "s"}]</span>
            </li>
          ))}
        </ol>
      </section>

      {guide.exitTicket ? (
        <section className="print-break-avoid">
          <h2>Exit ticket</h2>
          <p><strong>{guide.exitTicket.prompt}</strong></p>
          <p className="print-small">{guide.exitTicket.why}</p>
        </section>
      ) : null}

      {guide.followUp.length > 0 ? (
        <section>
          <h2>Follow-up later</h2>
          <ul>{guide.followUp.map((f, i) => <li key={i}>{f.prompt} <span className="print-small">({f.when.replace("-", " ")})</span></li>)}</ul>
        </section>
      ) : null}

      {guide.summary.length > 0 ? (
        <section className="print-break-avoid">
          <h2>Close the lesson</h2>
          <ul>{guide.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>
      ) : null}

      <footer className="print-footer">
        <p>Generated from the same authored lesson as the pupil worksheet and the digital lesson. Assessment answers are in the separate teacher answer key.</p>
        <p className="print-small">{guide.evidenceNote}</p>
      </footer>
    </div>
  );
}
