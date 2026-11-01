import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CBSE_X_PILOT, lessonStatus, pilotConcept } from "@/lib/pilot";
import { pilotMappingFor } from "@/lib/pilot-mappings";
import { pilotRightsFor } from "@/lib/pilot-rights";
import { FigureGraphic } from "@/components/question-figure";

export async function generateMetadata({ params }: { params: Promise<{ concept: string }> }): Promise<Metadata> {
  const { concept } = await params;
  const c = pilotConcept(concept);
  return {
    title: c ? `${c.title} — pilot review — OpenMind` : "Pilot lesson — OpenMind",
    description: c ? `Teacher preview of the ${c.title} lesson in the CBSE Class 10 pilot candidate.` : undefined,
  };
}

export default async function PilotLessonPage({ params }: { params: Promise<{ concept: string }> }) {
  const { concept } = await params;
  const c = pilotConcept(concept);
  if (!c) notFound();
  const status = lessonStatus(c.id, CBSE_X_PILOT.language);
  const plan = status.plan;
  if (!plan) notFound();
  const mapping = pilotMappingFor(c.id);
  const rights = pilotRightsFor(c.id);

  return (
    <main className="container page" style={{ paddingTop: 40 }}>
      <p className="eyebrow">Teacher preview · not a learner assignment</p>
      <h1>{c.title}</h1>
      <p className="lead">{c.blurb}</p>

      <section className="card" data-content-state={status.state} style={{ marginBottom: 18 }} lang="en">
        <p className="eyebrow" style={{ margin: 0 }}>Review state</p>
        <p style={{ margin: "8px 0 4px", fontWeight: 700 }}>
          {status.state === "approved-for-pilot" ? "Approved for this pilot" : "Not yet approved for this pilot"}
        </p>
        <p className="small muted" style={{ margin: 0 }}>{status.reasons[0]}</p>
        <p className="small muted" style={{ margin: "8px 0 0" }}>
          Version {status.version} · {CBSE_X_PILOT.curriculumEdition} · {CBSE_X_PILOT.levelId} · English medium.
          This page is a review artefact: it writes no learner record and asks no question.
        </p>
      </section>

      <section className="card soft" style={{ marginBottom: 18 }}>
        <p className="eyebrow">Curriculum provenance</p>
        {mapping ? (
          <>
            <p style={{ margin: "6px 0 2px" }}><strong>{mapping.ref}</strong></p>
            <p className="small muted" style={{ margin: 0 }}>{mapping.statement}</p>
            <p className="small muted" style={{ margin: "8px 0 0" }}>
              {mapping.source.title} · {mapping.source.publisher} · {mapping.source.published} ·{" "}
              <a href={mapping.source.url} rel="noreferrer" target="_blank">official source</a>
              {" "}· status: {mapping.status} · reviewer: {mapping.reviewer ?? "none"}.
            </p>
          </>
        ) : (
          <p className="small">No mapping is on file for this concept. Do not review it as though one existed.</p>
        )}
      </section>

      <section className="card soft" data-rights-status={rights?.status ?? "missing"} style={{ marginBottom: 18 }}>
        <p className="eyebrow">Content rights</p>
        {rights ? (
          <>
            <p style={{ margin: "6px 0 2px" }}>
              <strong>{rights.status === "clear" ? "Rights-clear for this pilot" : "Rights check blocked"}</strong>
            </p>
            <p className="small muted" style={{ margin: 0 }}>
              Teaching and figures: <strong>OpenMind-authored</strong> ({rights.teaching?.id ?? "missing"};{" "}
              {rights.figures?.id ?? "missing"}). No NCERT, CBSE, DIKSHA or other third-party teaching text or
              image is embedded. External assets: {rights.externalAssets.length === 0 ? "none" : rights.externalAssets.join(", ")}.
            </p>
            <p className="small muted" style={{ margin: "6px 0 0" }}>
              Curriculum reference: {rights.curriculum?.title ?? "missing"} ({rights.curriculum?.publisher ?? "—"}) ·
              source id <code>{rights.curriculum?.id ?? "missing"}</code> · use: <strong>{rights.curriculumLink.status}</strong>.
              It is cited, not copied.
            </p>
            {rights.problems.length > 0 && (
              <p className="small" style={{ color: "var(--margin-red)", margin: "8px 0 0" }}>
                {rights.problems.join("; ")}
              </p>
            )}
            {rights.obligations.length > 0 && (
              <p className="small muted" style={{ margin: "6px 0 0" }}>{rights.obligations.join(" ")}</p>
            )}
          </>
        ) : (
          <p className="small">No rights record exists for this lesson. Do not approve it.</p>
        )}
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <p className="eyebrow">By the end, the learner can</p>
        <p className="reading lesson-lead" style={{ margin: 0 }}>{plan.objective}</p>
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <p className="eyebrow">Start here</p>
        <p className="reading lesson-text" style={{ marginTop: 8 }}>{plan.intuition}</p>
      </section>

      {plan.figure && (
        <figure className="lesson-figure" data-figure={plan.figure.spec.kind}>
          <FigureGraphic spec={plan.figure.spec} />
          <figcaption className="small muted reading">{plan.figure.caption}</figcaption>
        </figure>
      )}

      <section className="card" style={{ marginBottom: 18 }}>
        <p className="eyebrow">The idea</p>
        <p className="reading lesson-lead">{plan.idea[0]}</p>
        {plan.idea.slice(1).map((p, i) => <p key={i} className="reading lesson-text">{p}</p>)}
      </section>

      {plan.terms && plan.terms.length > 0 && (
        <section className="card soft" style={{ marginBottom: 18 }}>
          <p className="eyebrow">Terms</p>
          <dl className="lesson-terms">
            {plan.terms.map((term) => (
              <div key={term.term}>
                <dt>{term.term}</dt>
                <dd className="small muted">{term.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {plan.workedExamples?.map((ex, i) => (
        <section className="card" style={{ marginBottom: 18 }} key={i}>
          <p className="eyebrow">Worked example {i + 1}</p>
          <p style={{ margin: 0, fontWeight: 650 }}>{ex.prompt}</p>
          <ol className="small" style={{ margin: "8px 0 0 18px" }}>
            {ex.steps.map((step, j) => <li key={j} style={{ marginBottom: 4 }}>{step}</li>)}
          </ol>
          <p className="small" style={{ margin: "8px 0 0" }}><strong>Answer:</strong> {ex.answer}</p>
        </section>
      ))}

      {plan.traps.length > 0 && (
        <section className="card soft" style={{ marginBottom: 18 }}>
          <p className="eyebrow">Where this goes wrong</p>
          {plan.traps.map((trap, i) => (
            <div key={i} style={{ marginTop: 10 }}>
              <p style={{ margin: 0 }}><strong>{trap.move}</strong></p>
              <p className="small muted" style={{ margin: "2px 0 0" }}>{trap.why}</p>
            </div>
          ))}
        </section>
      )}

      {plan.recap && plan.recap.length > 0 && (
        <section className="card soft" style={{ marginBottom: 18 }}>
          <p className="eyebrow">Recap</p>
          <ul className="lesson-list">{plan.recap.map((line, i) => <li key={i}>{line}</li>)}</ul>
        </section>
      )}

      <section className="card soft" style={{ marginBottom: 18 }}>
        <p className="eyebrow">Where it is used next</p>
        <p className="reading" style={{ margin: 0 }}>{plan.usedFor}</p>
        <p className="small muted" style={{ margin: "8px 0 0" }}>
          Prerequisites: {c.prereqs.length ? c.prereqs.join(", ") : "none named in the genome"}.
        </p>
      </section>

      <p className="small muted">
        This is a teacher review page. It deliberately does not include the practice session, because a
        preview that started an unreviewed session would write learner evidence for content nobody has
        signed off.
      </p>
      <div className="actions" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/pilot" className="btn ghost small">← Pilot readiness</Link>
        <Link href={`/learn/${c.subject}/${c.id}`} className="btn ghost small">Learner view (with its status banner)</Link>
      </div>
    </main>
  );
}
