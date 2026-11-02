import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LessonView from "@/components/content-platform/lesson-view";
import ReviewForm from "@/components/content-platform/review-form";
import { allLessonDocuments } from "@/lib/content-platform/flagships";
import { latestReviewFor, resolveLessonReview, reviewRecordProblems } from "@/lib/content-platform/review";
import { listContentReviews } from "@/lib/server/content-review-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Educator review — OpenMind",
  description: "Review a content-platform lesson against subject accuracy, curriculum alignment, assessment validity and rights.",
};

export default async function ContentReviewPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const doc = allLessonDocuments().find((d) => d.id === documentId);
  if (!doc) notFound();

  const records = await listContentReviews();
  const current = latestReviewFor(records, doc.id);
  const currentApplies = current ? reviewRecordProblems(current, doc).length === 0 : undefined;
  const resolved = resolveLessonReview(doc, records);

  return (
    <main className="container page" style={{ paddingTop: 36 }}>
      <Link className="small" href="/content">← Content platform</Link>
      <p className="eyebrow" style={{ margin: "18px 0 0" }}>Educator review · Content Platform 1.0</p>
      <h1 style={{ margin: "6px 0" }}>{doc.title}</h1>
      <p className="small muted" style={{ margin: "0 0 16px" }}>
        {doc.subject} · {doc.curriculum.specId}
        {doc.curriculum.levelId ? ` · ${doc.curriculum.levelId}` : ""} · {doc.review.state}
      </p>

      <div className="card soft" style={{ marginBottom: 18 }}>
        <p className="eyebrow" style={{ margin: 0 }}>What this page does</p>
        <p className="small" style={{ margin: "8px 0 0" }}>
          It records a teacher&apos;s four-part judgement against the exact lesson you see below.
          It does not change the source document, and it does not make an approval survive an edit:
          the record is bound to a fingerprint of the content.
        </p>
        {resolved.review.state === "approved" && (
          <p className="small" style={{ margin: "8px 0 0" }}>
            This version currently resolves as <strong>approved</strong> by {resolved.review.reviewedBy}.
          </p>
        )}
      </div>

      <ReviewForm
        documentId={doc.id}
        title={doc.title}
        current={current ? {
          decision: current.decision,
          reviewerName: current.reviewer.name,
          createdAt: current.createdAt,
          notes: current.notes,
        } : null}
        currentApplies={currentApplies}
      />

      <h2>What the reviewer sees</h2>
      <p className="small muted" style={{ marginTop: 0 }}>
        The same block renderer the learner uses. This is the version the decision above is about.
      </p>
      <LessonView doc={resolved} />
    </main>
  );
}
