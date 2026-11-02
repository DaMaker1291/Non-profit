"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "@/lib/client";
import { ApiError, submitContentReview } from "@/lib/api/client";
import type { ReviewCriterionId, ReviewDecision } from "@/lib/content-platform/types";
import { REVIEW_CRITERIA } from "@/lib/content-platform/types";

function blankChecks(): Record<ReviewCriterionId, boolean> {
  return Object.fromEntries(REVIEW_CRITERIA.map((c) => [c.id, false])) as Record<ReviewCriterionId, boolean>;
}

export default function ReviewForm({
  documentId,
  title,
  current,
  currentApplies,
}: {
  documentId: string;
  title: string;
  current?: {
    decision: ReviewDecision;
    reviewerName: string;
    createdAt: number;
    notes: string;
  } | null;
  currentApplies?: boolean;
}) {
  const router = useRouter();
  const { session, status } = useAccount();
  const teaching = Boolean(session.account && session.account.role !== "student");
  const [checks, setChecks] = useState<Record<ReviewCriterionId, boolean>>(blankChecks);
  const [decision, setDecision] = useState<ReviewDecision | "">("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const allChecked = REVIEW_CRITERIA.every((c) => checks[c.id]);
  const canSubmit =
    teaching &&
    notes.trim().length >= 10 &&
    (decision !== "approved" || allChecked) &&
    !busy;

  async function submit() {
    if (!canSubmit || decision === "") return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload = await submitContentReview({ documentId, decision, criteria: checks, notes });
      setNotice(
        payload.state === "approved"
          ? "Review recorded. The lesson is approved for this exact version; editing it will invalidate the approval."
          : "Changes requested. The lesson stays in draft until a later review approves it.",
      );
      router.refresh();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.code === "review_invalid"
            ? "A required check or note is missing. The server refused the review, so nothing was recorded."
            : e.code || `HTTP ${e.status}`
          : "The review could not be sent. Check the connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (status === "booting") {
    return <div className="card soft"><p className="small muted" style={{ margin: 0 }}>Checking your account…</p></div>;
  }

  if (!teaching) {
    return (
      <section className="card soft" data-content-review-form>
        <p className="eyebrow" style={{ margin: 0 }}>Educator review</p>
        <p style={{ margin: "8px 0 12px" }}>
          A review is recorded against a signed-in teacher account. A learner profile, even one with the lesson open, cannot approve it.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" href="/onboarding?role=teacher&mode=signin">Sign in as a teacher</Link>
          <Link className="btn ghost" href="/teacher">Teacher console</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card" data-content-review-form style={{ marginBottom: 20 }}>
      <p className="eyebrow" style={{ margin: 0 }}>Educator review · {documentId}</p>
      <h2 style={{ margin: "6px 0" }}>{title}</h2>
      <p className="small muted" style={{ marginTop: 0 }}>
        Signed in as <strong>{session.account?.name}</strong>. Your account is the reviewer; it cannot be supplied by this form.
      </p>

      {current && (
        <p className="small" style={{ margin: "8px 0 14px", padding: "8px 10px", background: "var(--surface-sunken, #f4f6f4)", borderRadius: 8 }}>
          Latest record: <strong>{current.decision === "approved" ? "approved" : "changes requested"}</strong> by {current.reviewerName} on{" "}
          {new Date(current.createdAt).toLocaleString()}.{" "}
          {currentApplies === false ? "It no longer applies to the current lesson content." : "It applies to this version."}
        </p>
      )}

      <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
        <legend className="small" style={{ fontWeight: 700, marginBottom: 8 }}>What did you check?</legend>
        {REVIEW_CRITERIA.map((criterion) => (
          <label key={criterion.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={checks[criterion.id]}
              onChange={(e) => { setChecks((prev) => ({ ...prev, [criterion.id]: e.target.checked })); setNotice(""); }}
              style={{ marginTop: 3 }}
            />
            <span>
              <strong className="small">{criterion.label}</strong>
              <span className="small muted" style={{ display: "block" }}>{criterion.help}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
        <legend className="small" style={{ fontWeight: 700, marginBottom: 8 }}>Decision</legend>
        <label style={{ display: "inline-flex", gap: 6, marginRight: 18 }}>
          <input type="radio" name="review-decision" checked={decision === "changes-requested"} onChange={() => setDecision("changes-requested")} />
          <span className="small">Request changes</span>
        </label>
        <label style={{ display: "inline-flex", gap: 6 }}>
          <input type="radio" name="review-decision" checked={decision === "approved"} onChange={() => setDecision("approved")} />
          <span className="small">Approve this version</span>
        </label>
      </fieldset>

      <label className="small" htmlFor="content-review-notes" style={{ display: "block", fontWeight: 700, marginBottom: 4 }}>
        Review notes
      </label>
      <textarea
        id="content-review-notes"
        rows={5}
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setNotice(""); }}
        placeholder="What did you verify, what changed, and what should the next reviewer know?"
        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line, #d8ddd8)", font: "inherit" }}
      />
      <p className="small muted" style={{ margin: "4px 0 10px" }}>
        An approval requires all four checks and at least 20 characters of notes. Editing the lesson later invalidates the approval.
      </p>

      {error && <p className="small" role="alert" style={{ color: "var(--bad, #a12a2a)" }}>{error}</p>}
      {notice && <p className="small" role="status">{notice}</p>}
      <button type="button" className="btn" onClick={submit} disabled={!canSubmit || decision === ""}>
        {busy ? "Recording…" : "Record review"}
      </button>
    </section>
  );
}
