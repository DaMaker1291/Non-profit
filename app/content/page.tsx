import type { Metadata } from "next";
import Link from "next/link";
import LessonView from "@/components/content-platform/lesson-view";
import { allLessonDocuments } from "@/lib/content-platform/flagships";
import { resolveLessonReview } from "@/lib/content-platform/review";
import {
  capabilityMatrix,
  contentPlatformBlockers,
  contentPlatformSummary,
} from "@/lib/content-platform/capability";
import { listContentReviews } from "@/lib/server/content-review-store";

export const metadata: Metadata = {
  title: "Content Platform 1.0 — OpenMind",
  description:
    "The typed lesson contract, rights-aware resource records, capability matrix and three lesson drafts built for the OpenMind content platform.",
};

// The page reads the append-only review records, so it must be rendered per
// request rather than baked at build time. A status page that showed a cached
// draft after a teacher approved it would be worse than no status page.
export const dynamic = "force-dynamic";

export default async function ContentPlatformPage() {
  const records = await listContentReviews();
  const docs = allLessonDocuments().map((doc) => resolveLessonReview(doc, records));
  const summary = contentPlatformSummary();
  const approved = docs.filter((d) => d.review.state === "approved").length;
  const rows = capabilityMatrix().map((row) => ({
    ...row,
    approvedLessons: docs.filter((d) => d.subject === row.subject && d.review.state === "approved").length,
  }));
  const blockers = contentPlatformBlockers({ approvedLessons: approved });

  return (
    <main className="container page" style={{ paddingTop: 40 }}>
      <p className="eyebrow">Content Platform 1.0 · review surface</p>
      <h1>From resources to reviewed lessons</h1>
      <p className="lead">
        A typed lesson contract, a rights-aware resource layer, and three end-to-end
        subject slices. Everything here is a draft unless it says otherwise. A schema
        check is not a teacher&apos;s approval.
      </p>

      <section className="card soft" style={{ padding: 20, marginBottom: 18 }}>
        <p className="eyebrow" style={{ margin: 0 }}>Measured coverage</p>
        <p className="stat" style={{ margin: "8px 0 2px" }}>
          {summary.richLessons} <span className="small muted">lesson documents</span>{" "}
          · {summary.assessments} <span className="small muted">assessment contracts</span>{" "}
          · {approved} <span className="small muted">approved</span>
        </p>
        <p className="small muted" style={{ margin: 0 }}>
          {summary.authoredPlans} of {summary.concepts} genome concepts have an authored
          lesson plan. Resource records: {summary.resourceCoverage.ingest} ingest,{" "}
          {summary.resourceCoverage.adapt} adapt, {summary.resourceCoverage.link} link-only,{" "}
          {summary.resourceCoverage.review} rights review, {summary.resourceCoverage.reject} reject.
        </p>
      </section>

      <section className="card" style={{ padding: 0, overflowX: "auto", marginBottom: 18 }}>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 10 }}>Subject</th>
              <th style={{ textAlign: "right", padding: 10 }}>Concepts</th>
              <th style={{ textAlign: "right", padding: 10 }}>Plans</th>
              <th style={{ textAlign: "right", padding: 10 }}>Rich lessons</th>
              <th style={{ textAlign: "left", padding: 10 }}>Response contracts</th>
              <th style={{ textAlign: "left", padding: 10 }}>Resources</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.subject} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: 10 }}><strong>{r.label}</strong></td>
                <td style={{ padding: 10, textAlign: "right" }}>{r.concepts}</td>
                <td style={{ padding: 10, textAlign: "right" }}>{r.authoredPlans}</td>
                <td style={{ padding: 10, textAlign: "right" }}>{r.richLessons}</td>
                <td style={{ padding: 10 }} className="small">{r.responseKinds.join(", ") || "—"}</td>
                <td style={{ padding: 10 }} className="small">
                  {r.usableResources} usable / {r.linkedResources} link / {r.reviewResources} review
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card soft" style={{ padding: 20, marginBottom: 24 }}>
        <p className="eyebrow" style={{ margin: 0 }}>What is deliberately not claimed</p>
        <ul className="small" style={{ margin: "8px 0 0 18px" }}>
          {blockers.map((b) => <li key={b} style={{ marginBottom: 4 }}>{b}</li>)}
          <li>No external textbook or simulation is copied. OpenStax and PhET are links or rights-review records, not ingested content.</li>
          <li>The Python lab runs in a sandboxed browser iframe, not on the application server. It has not been validated against an adversarial code corpus here.</li>
          <li>Review records are append-only. A teacher&apos;s approval is bound to the lesson fingerprint and stops applying when the lesson changes.</li>
        </ul>
      </section>

      <h2>Three complete slices</h2>
      <p className="small muted">
        Each document is rendered by the same block renderer. Physics adds a calculation
        and a formula response; Biology adds a labelling activity; Computing adds a
        runnable Python lab. The learner pages are at the links under each title.
      </p>

      {docs.map((doc) => (
        <article key={doc.id} style={{ marginBottom: 30 }} data-document={doc.id}>
          <div className="page-title-row" style={{ alignItems: "baseline" }}>
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>{doc.subject} · {doc.curriculum.specId}</p>
              <h2 style={{ margin: "4px 0" }}>{doc.title}</h2>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link className="btn ghost small" href={`/learn/${doc.subject}/${doc.conceptId}`}>
                Open learner route →
              </Link>
              <Link className="btn small" href={`/content/review/${doc.id}`}>
                Review this version →
              </Link>
            </div>
          </div>
          <p className="small muted" style={{ margin: "0 0 12px" }}>
            {doc.curriculum.objective} · {doc.estimatedMinutes} minutes · {doc.blocks.length} blocks ·{" "}
            {doc.assessments.length} assessments
          </p>
          <LessonView doc={doc} />
        </article>
      ))}
    </main>
  );
}
