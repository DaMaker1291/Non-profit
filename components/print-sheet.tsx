import { LessonFigure } from "./lesson-figure";
import type { LessonDiagramShape } from "@/lib/lesson-contract";
import type { KeyEntry, PrintAnswerKey, PrintWorksheet, WorksheetAssessment } from "@/lib/lesson-print";

/** A ruled answer area. Lines are printed as borders, not underlined text, so
 *  they survive a photocopier and use no images. */
function AnswerLines({ count, label = "Answer" }: { count: number; label?: string }) {
  return (
    <div className="print-answer" aria-label={label}>
      {Array.from({ length: count }, (_, i) => <div className="print-rule" key={i} />)}
    </div>
  );
}

function Diagram({ item }: { item: Extract<WorksheetAssessment, { kind: "diagram" }> }) {
  const shape = (s: LessonDiagramShape, i: number) => {
    switch (s.kind) {
      case "rect":
        return <rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx ?? 0} fill={s.filled ? "#e7ece9" : "none"} stroke="#1d2a24" strokeWidth={1.5} />;
      case "circle":
        return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.filled ? "#e7ece9" : "none"} stroke="#1d2a24" strokeWidth={1.5} />;
      case "line":
        return <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#1d2a24" strokeWidth={1.2} strokeDasharray={s.dash} />;
      case "text":
        return <text key={i} x={s.x} y={s.y} fontSize={s.size ?? 13} fill="#1d2a24">{s.text}</text>;
    }
  };
  return (
    <figure className="print-figure">
      <svg viewBox={`0 0 ${item.width} ${item.height}`} width="100%" role="img" aria-label={item.caption}>
        {item.shapes.map(shape)}
        {item.targets.map((t, i) => (
          <g key={t.id}>
            <circle cx={t.x} cy={t.y} r={12} fill="#fff" stroke="#1d2a24" strokeWidth={1.4} />
            <text x={t.x} y={t.y + 4.5} fontSize={12} textAnchor="middle" fill="#1d2a24">{i + 1}</text>
          </g>
        ))}
      </svg>
      <figcaption>{item.caption}</figcaption>
    </figure>
  );
}

function CoordinateGrid({ grid }: { grid: { xMin: number; xMax: number; yMin: number; yMax: number } }) {
  const W = 430;
  const H = 320;
  const pad = 26;
  const x = (v: number) => pad + ((v - grid.xMin) / (grid.xMax - grid.xMin)) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - grid.yMin) / (grid.yMax - grid.yMin)) * (H - pad * 2);
  const xStep = (grid.xMax - grid.xMin) / 8;
  const yStep = (grid.yMax - grid.yMin) / 8;
  return (
    <svg className="print-grid" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Blank coordinate grid for your answer">
      {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={pad + i * ((W - pad * 2) / 8)} y1={pad} x2={pad + i * ((W - pad * 2) / 8)} y2={H - pad} stroke="#b9c1bb" strokeWidth={1} />)}
      {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1={pad} y1={pad + i * ((H - pad * 2) / 8)} x2={W - pad} y2={pad + i * ((H - pad * 2) / 8)} stroke="#b9c1bb" strokeWidth={1} />)}
      {grid.xMin <= 0 && grid.xMax >= 0 ? <line x1={x(0)} y1={pad} x2={x(0)} y2={H - pad} stroke="#1d2a24" strokeWidth={1.6} /> : null}
      {grid.yMin <= 0 && grid.yMax >= 0 ? <line x1={pad} y1={y(0)} x2={W - pad} y2={y(0)} stroke="#1d2a24" strokeWidth={1.6} /> : null}
      <text x={W - pad} y={y(0) - 5} fontSize={10} textAnchor="end">x</text>
      <text x={x(0) + 5} y={pad + 8} fontSize={10}>y</text>
      {[0, 4, 8].map((i) => (
        <g key={i}>
          <text x={pad + i * ((W - pad * 2) / 8)} y={H - 8} fontSize={9} textAnchor="middle">{Number((grid.xMin + i * xStep).toFixed(1))}</text>
          <text x={4} y={H - pad - i * ((H - pad * 2) / 8) + 3} fontSize={9}>{Number((grid.yMin + i * yStep).toFixed(1))}</text>
        </g>
      ))}
    </svg>
  );
}

function WorksheetAssessmentItem({ item }: { item: WorksheetAssessment }) {
  return (
    <article className="print-item">
      <div className="print-item-head">
        <strong>{item.prompt}</strong>
        <span className="print-marks">{item.scored ? `${item.marks} mark${item.marks === 1 ? "" : "s"}` : "Not scored"}</span>
      </div>
      {item.kind === "short-answer" || item.kind === "constructed-response" ? (
        <AnswerLines count={item.lines} />
      ) : null}
      {item.kind === "structured" ? (
        <div className="print-parts">
          {item.parts.map((p) => (
            <div key={p.id} className="print-part">
              <p><strong>({p.id})</strong> {p.prompt} <span className="print-marks">[{p.marks}]</span></p>
              {p.table ? (
                <table className="print-table">
                  <thead><tr><th />{p.table.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                  <tbody>
                    {p.table.rows.map((row, ri) => (
                      <tr key={ri}>
                        <th>{row.label ?? ""}</th>
                        {row.cells.map((c, ci) => <td key={ci}>{c ?? ""}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              {p.grid ? <CoordinateGrid grid={p.grid} /> : null}
              {p.readOff ? <p className="print-small">Use the graph you drew in part ({p.readOff.from}) at x = {p.readOff.at}.</p> : null}
              {p.methodPrompt ? <p className="print-small">Working: {p.methodPrompt}</p> : null}
              <AnswerLines count={Math.max(3, p.marks + 2)} label={`Working for part ${p.id}`} />
              {p.unit ? <p className="print-small">Unit: {p.unit}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {item.kind === "code" ? (
        <div>
          <pre className="print-code">{item.starterCode}</pre>
          <p className="print-small">Checks: {item.testNames.join("; ") || "Write the program described above."}</p>
          <table className="print-table">
            <thead><tr><th>Line / step</th><th>Value or output</th></tr></thead>
            <tbody>{Array.from({ length: item.traceRows }, (_, i) => <tr key={i}><td>{i + 1}</td><td /></tr>)}</tbody>
          </table>
        </div>
      ) : null}
      {item.kind === "gap-fill" ? (
        <div>
          <p className="print-template">{item.template}</p>
          {item.labels.length > 0 ? <ol className="print-bank">{item.labels.map((l) => <li key={l}>{l}</li>)}</ol> : null}
          {item.wordBank.length > 0 ? (
            <p className="print-small"><strong>Word bank:</strong> {item.wordBank.join(" · ")}</p>
          ) : null}
        </div>
      ) : null}
      {item.kind === "matching" ? (
        <table className="print-table print-matching">
          <thead><tr><th>{item.leftHeading}</th><th>Answer letter</th><th>{item.rightHeading}</th></tr></thead>
          <tbody>
            {item.left.map((l, i) => (
              <tr key={l.id}>
                <td>{i + 1}. {l.text}</td>
                <td className="print-blank-cell" />
                <td>{String.fromCharCode(65 + i)}. {item.right[i]?.text ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {item.kind === "ordering" ? (
        <ol className="print-bank">
          {item.items.map((x) => <li key={x.id}>{x.text} <span className="print-order-box">order ____</span></li>)}
        </ol>
      ) : null}
      {item.kind === "diagram" ? (
        <div>
          <Diagram item={item} />
          <p className="print-small"><strong>Labels:</strong> {item.labels.map((l, i) => `${String.fromCharCode(65 + i)}. ${l.text}`).join(" · ")}</p>
          <p className="print-small">Write the letter of the correct label beside each numbered position.</p>
          <div className="print-label-grid">
            {item.targets.map((t, i) => <span key={t.id}>{i + 1}. ____________</span>)}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function WorksheetSheet({ sheet, keyHref }: { sheet: PrintWorksheet; keyHref: string }) {
  return (
    <div className="print-sheet">
      <header className="print-header">
        <p className="print-kicker">OpenMind · printable lesson</p>
        <h1>{sheet.title}</h1>
        <p className="print-meta">
          {sheet.subject} · {sheet.curriculum.reference} · {sheet.curriculum.level} · version {sheet.version} · {sheet.review.replace(/_/g, " ")}
        </p>
        <div className="print-namebar">
          <span>Name: ______________________________</span>
          <span>Class: ______________</span>
          <span>Date: ______________</span>
        </div>
      </header>

      <section>
        <h2>Learning objectives</h2>
        <ul>{sheet.objectives.map((o, i) => <li key={i}><strong>{o.statement}</strong><br /><span className="print-small">You will show this by: {o.evidence}</span></li>)}</ul>
      </section>

      {sheet.priorKnowledge.length > 0 ? (
        <section className="print-break-avoid">
          <h2>Before you start</h2>
          {sheet.priorKnowledge.map((q) => (
            <div key={q.id} className="print-item">
              <p>{q.question}</p>
              <AnswerLines count={2} label="Prior knowledge answer" />
            </div>
          ))}
        </section>
      ) : null}

      <section>
        <h2>Why this matters</h2>
        <p>{sheet.introduction.hook}</p>
        <p>{sheet.introduction.why}</p>
      </section>

      <section>
        <h2>The explanation</h2>
        {sheet.explanation.map((e, i) => (
          <div key={i} className="print-block">
            <h3>{e.heading}</h3>
            {e.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
          </div>
        ))}
      </section>

      {sheet.representations.length > 0 ? (
        <section>
          <h2>Diagrams and representations</h2>
          {sheet.representations.map((r) => (
            <div key={r.id} className="print-block print-break-avoid">
              {r.figure ? <LessonFigure spec={r.figure.spec} caption={r.figure.caption} /> : null}
              <p>{r.body}</p>
              {r.notation ? <pre className="print-notation">{r.notation}</pre> : null}
              {r.caption ? <p className="print-small">{r.caption}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      <section>
        <h2>Worked examples</h2>
        {sheet.workedExamples.map((w) => (
          <article key={w.id} className="print-block print-break-avoid">
            <p><strong>{w.prompt}</strong></p>
            <ol className="print-steps">
              {w.steps.map((s, i) => <li key={i}><strong>{s.move}</strong><br /><span className="print-small">Why: {s.why}</span></li>)}
            </ol>
            <p className="print-answer-line"><strong>Answer:</strong> {w.answer}</p>
          </article>
        ))}
      </section>

      {sheet.misconceptions.length > 0 ? (
        <section>
          <h2>Common mistakes — and why they fail</h2>
          {sheet.misconceptions.map((m) => (
            <article key={m.id} className="print-block print-break-avoid">
              <p><strong>Wrong belief:</strong> {m.belief}</p>
              <p><strong>Why it fails:</strong> {m.whyItFails}</p>
              <p><strong>Correct reasoning:</strong> {m.correction}</p>
              <p className="print-small">Wrong: {m.contrast.wrong} · Right: {m.contrast.right}</p>
            </article>
          ))}
        </section>
      ) : null}

      {sheet.guidedPractice.length > 0 ? (
        <section>
          <h2>Guided practice</h2>
          {sheet.guidedPractice.map((g) => (
            <article key={g.id} className="print-item">
              <p><strong>{g.prompt}</strong></p>
              <p className="print-small">Hint: {g.hint}</p>
              <AnswerLines count={4} label="Guided practice answer" />
            </article>
          ))}
        </section>
      ) : null}

      {sheet.assessment.length > 0 ? (
        <section className="print-page-break">
          <h2>Assessment</h2>
          <p className="print-small">Answer every question. Show working where it earns marks. Total: {sheet.assessment.reduce((n, a) => n + a.marks, 0)} marks.</p>
          {sheet.assessment.map((a) => <WorksheetAssessmentItem key={a.id} item={a} />)}
        </section>
      ) : null}

      {sheet.transfer.length > 0 ? (
        <section>
          <h2>Use it in a new situation</h2>
          {sheet.transfer.map((t) => (
            <article key={t.id} className="print-item">
              <p><strong>{t.prompt}</strong></p>
              <p className="print-small">{t.whyItTransfers}</p>
              <AnswerLines count={6} label="Transfer answer" />
            </article>
          ))}
        </section>
      ) : null}

      {sheet.retrieval.length > 0 ? (
        <section className="print-break-avoid">
          <h2>Remember it later</h2>
          <p className="print-small">These questions are for a later lesson, not today.</p>
          <ol>{sheet.retrieval.map((r) => <li key={r.id}>{r.prompt} <span className="print-small">({r.when.replace("-", " ")})</span></li>)}</ol>
        </section>
      ) : null}

      {sheet.summary.length > 0 ? (
        <section className="print-break-avoid">
          <h2>Summary</h2>
          <ul>{sheet.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>
      ) : null}

      <footer className="print-footer">
        <p>{sheet.provenanceNote}</p>
        <p className="print-small">Teacher marking guidance: <a href={keyHref}>open the separate answer key</a> (teacher sign-in required).</p>
      </footer>
    </div>
  );
}

function KeyEntries({ heading, entries }: { heading: string; entries: (KeyEntry & { details?: string[] })[] }) {
  if (entries.length === 0) return null;
  return (
    <section>
      <h2>{heading}</h2>
      {entries.map((e) => (
        <article key={e.id} className="print-item print-break-avoid">
          <p><strong>{e.label}</strong></p>
          <p><strong>Model answer:</strong> {e.answer}</p>
          {e.details && e.details.length > 0 ? <ul>{e.details.map((d, i) => <li key={i}>{d}</li>)}</ul> : null}
          {e.marking.length > 0 ? <p className="print-small"><strong>Marking guidance:</strong> {e.marking.join(" · ")}</p> : null}
        </article>
      ))}
    </section>
  );
}

export function AnswerKeySheet({ answerKey }: { answerKey: PrintAnswerKey }) {
  return (
    <div className="print-sheet print-key">
      <header className="print-header">
        <p className="print-kicker">OpenMind · teacher answer key · not for pupils</p>
        <h1>{answerKey.title}</h1>
        <p className="print-meta">Version {answerKey.version} · review state: {answerKey.review.replace(/_/g, " ")}</p>
      </header>
      <p className="print-small">This key is generated from the same authored lesson as the pupil worksheet. It may be printed or saved as a PDF; it is not part of the pupil handout.</p>
      <KeyEntries heading="Prior knowledge" entries={answerKey.priorKnowledge} />
      <KeyEntries heading="Guided practice" entries={answerKey.guidedPractice} />
      <KeyEntries heading="Assessment" entries={answerKey.assessment} />
      <KeyEntries heading="Transfer challenge" entries={answerKey.transfer} />
      <KeyEntries heading="Retrieval" entries={answerKey.retrieval} />
      <footer className="print-footer"><p>OpenMind-authored. Marking criteria are the same criteria the digital assessment uses.</p></footer>
    </div>
  );
}
