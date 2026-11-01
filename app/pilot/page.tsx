import Link from "next/link";
import type { Metadata } from "next";
import { CBSE_X_PILOT, PILOT_APPROVALS, PILOT_LESSON_VERSION, lessonStatus, pilotCoverage } from "@/lib/pilot";
import { mappingCoverage, pilotMappings } from "@/lib/pilot-mappings";
import { pilotRightsCoverage } from "@/lib/pilot-rights";

export const metadata: Metadata = {
  title: "Pilot readiness — OpenMind",
  description: "The 12-lesson CBSE Class 10 mathematics and science pilot candidate, its review state, and what is still blocked.",
};

const STATE_LABEL: Record<string, string> = {
  "approved-for-pilot": "Approved for this pilot",
  "needs-educator-review": "Needs educator review",
  draft: "Draft — structurally incomplete",
  "unavailable-for-pilot": "Not available as a lesson",
};

export default function PilotPage() {
  const coverage = pilotCoverage();
  const mappings = pilotMappings();
  const mapping = mappingCoverage();
  const rights = pilotRightsCoverage();
  const rows = CBSE_X_PILOT.subjects.flatMap((subject) =>
    [...new Set(pilotMappings().filter((m) => m.subject === subject).map((m) => m.conceptId))].map((id) => ({
      id,
      subject,
      status: lessonStatus(id, CBSE_X_PILOT.language),
      mapping: mappings.find((m) => m.conceptId === id) ?? null,
    })),
  );

  return (
    <main className="container page" style={{ paddingTop: 40 }}>
      <p className="eyebrow">Pilot readiness · teacher view</p>
      <h1>CBSE Class 10 pilot candidate</h1>
      <p className="lead">
        A bounded, English-medium pack of twelve lessons: eight mathematics concepts already in the
        published CBSE Class X mapping, and four science lessons authored for this pack. It is a
        <strong> review candidate</strong>, not an approved course and not a school partnership.
      </p>

      <section className="card" style={{ marginBottom: 18 }} data-pilot-status={CBSE_X_PILOT.status}>
        <p className="eyebrow" style={{ margin: 0 }}>Pilot status</p>
        <p style={{ margin: "8px 0 4px", fontWeight: 700 }}>
          {coverage.approved === 0 ? "Not open — no lesson has been approved by a subject teacher." : `${coverage.approved} lesson${coverage.approved === 1 ? "" : "s"} approved.`}
        </p>
        <p className="small muted" style={{ margin: 0 }}>
          {coverage.needsReview} of {coverage.total} candidates are complete and waiting for review;
          {" "}{coverage.draft} are structurally incomplete; {coverage.unavailable} have no lesson.
          {" "}The approved learner path is intentionally empty until a real reviewer signs a lesson for
          this exact curriculum, level and language.
        </p>
        <p className="small muted" style={{ margin: "8px 0 0" }}>
          Lesson version {PILOT_LESSON_VERSION} · approvals on file: {PILOT_APPROVALS.length} · mappings on file: {mapping.mapped}/{mapping.total} · reviewed mappings: {mapping.reviewed}
        </p>
        <p className="small muted" style={{ margin: "8px 0 0" }}>
          Rights gate: {rights.clear}/{rights.total} lessons clear; {rights.blocked} blocked;{" "}
          {rights.withExternalAssets} with external assets. Every lesson is OpenMind-authored; curriculum sources are
          cited link-only and are not reproduced.
        </p>
      </section>

      <section className="card soft" style={{ marginBottom: 18 }}>
        <p className="eyebrow">The scope, stated exactly</p>
        <ul className="lesson-list">
          <li><strong>Country / board:</strong> {CBSE_X_PILOT.country} · {CBSE_X_PILOT.board}</li>
          <li><strong>Course / level:</strong> {CBSE_X_PILOT.specId} · {CBSE_X_PILOT.levelId}</li>
          <li><strong>Edition:</strong> {CBSE_X_PILOT.curriculumEdition}</li>
          <li><strong>Language:</strong> English medium only</li>
          <li><strong>Explicitly excluded:</strong> {CBSE_X_PILOT.excludes.join("; ")}.</li>
        </ul>
      </section>

      <h2>What a reviewer will see</h2>
      <p className="small muted">
        Each link opens the complete teaching material and its curriculum provenance. Nothing on these
        pages writes learner data or starts a practice session.
      </p>
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 10 }}>Lesson</th>
              <th style={{ textAlign: "left", padding: 10 }}>Subject</th>
              <th style={{ textAlign: "left", padding: 10 }}>State</th>
              <th style={{ textAlign: "left", padding: 10 }}>CBSE reference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: 10 }}>
                  <Link href={`/pilot/${row.id}`}>{row.status.plan?.conceptId === row.id ? row.id : row.id}</Link>
                </td>
                <td style={{ padding: 10 }}>{row.subject}</td>
                <td style={{ padding: 10 }}>{STATE_LABEL[row.status.state]}</td>
                <td style={{ padding: 10 }} className="small muted">{row.mapping?.ref ?? "missing mapping"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card soft" style={{ marginTop: 18 }}>
        <p className="eyebrow">How approval works</p>
        <p className="small">
          A lesson becomes <strong>approved-for-pilot</strong> only when a qualified teacher has reviewed
          the version on this page for this curriculum, level and language, and recorded their own name,
          role and date against every checklist item. Editing the lesson changes its version and
          invalidates the approval. The product does not generate reviewers, dates or approval.
        </p>
        <p className="small muted">
          The learner-facing gate is stricter than this page: a concept with no complete lesson renders a
          “not available” card and a background note, never a fallback paragraph dressed as teaching.
        </p>
      </section>
    </main>
  );
}
