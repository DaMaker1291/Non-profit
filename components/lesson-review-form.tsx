"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "@/lib/client";
import { ApiError, submitLessonReview } from "@/lib/api/client";
import {
  REVIEW_CRITERIA,
  REVIEW_ROLES,
  type ReviewCriterionId,
  type ReviewDecision,
  type ReviewFinding,
  type ReviewRole,
} from "@/lib/validation/types";

function blankChecks(): Record<ReviewCriterionId, boolean> {
  return Object.fromEntries(REVIEW_CRITERIA.map((criterion) => [criterion.id, false])) as Record<ReviewCriterionId, boolean>;
}

const blankFinding = (index: number): ReviewFinding => ({
  id: `f${index + 1}`,
  location: "",
  problem: "",
  educationalConsequence: "",
  recommendation: "",
  severity: "major",
  blockPublication: false,
});

const ROLE_LABEL: Record<ReviewRole, string> = {
  "subject-teacher": "Subject teacher",
  "curriculum-lead": "Curriculum lead",
  "accessibility-reviewer": "Accessibility reviewer",
};

export default function LessonReviewForm({
  lessonId,
  title,
  lessonVersion,
  contentHash,
}: {
  lessonId: string;
  title: string;
  lessonVersion: string;
  contentHash: string;
}) {
  const router = useRouter();
  const { session, status } = useAccount();
  const teaching = Boolean(session.account && session.account.role !== "student");
  const [checks, setChecks] = useState<Record<ReviewCriterionId, boolean>>(blankChecks);
  const [reviewRole, setReviewRole] = useState<ReviewRole>("subject-teacher");
  const [qualifications, setQualifications] = useState("");
  const [scope, setScope] = useState("");
  const [decision, setDecision] = useState<ReviewDecision | "">("");
  const [findings, setFindings] = useState<ReviewFinding[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const allChecked = REVIEW_CRITERIA.every((criterion) => checks[criterion.id]);
  const blocking = findings.some((finding) => finding.blockPublication);
  const canSubmit =
    teaching &&
    qualifications.trim().length >= 8 &&
    scope.trim().length >= 8 &&
    notes.trim().length >= 10 &&
    decision !== "" &&
    (decision !== "approved" || (allChecked && !blocking)) &&
    !busy;

  function updateFinding(index: number, patch: Partial<ReviewFinding>) {
    setFindings((current) => current.map((finding, i) => (i === index ? { ...finding, ...patch } : finding)));
    setNotice("");
  }

  async function submit() {
    if (decision === "") return;
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload = await submitLessonReview({
        lessonId,
        lessonVersion,
        contentHash,
        reviewRole,
        qualifications,
        scope,
        criteria: checks,
        decision,
        findings,
        notes,
      });
      setNotice(
        payload.state === "approved"
          ? "Review recorded for this exact version and hash. Any edit changes the hash and needs a new review."
          : "Changes requested and recorded. The findings are now in the improvement queue.",
      );
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          e.code === "review_stale"
            ? "This lesson changed after you opened it. Reopen the current version and review that."
            : e.code === "review_invalid"
              ? "The server refused this review because a required check, finding detail or note is missing. Nothing was recorded."
              : e.code === "review_not_saved"
                ? "The review could not be saved. Nothing was recorded; check the deployment's storage and try again."
                : e.code || `HTTP ${e.status}`,
        );
      } else {
        setError("The review could not be sent. Check the connection and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (status === "booting") {
    return <div className="card soft"><p className="small muted" style={{ margin: 0 }}>Checking your account…</p></div>;
  }

  if (!teaching) {
    return (
      <section className="card soft" data-lesson-review-form>
        <p className="eyebrow" style={{ margin: 0 }}>Educator review</p>
        <p style={{ margin: "8px 0 12px" }}>
          A review is recorded against a signed-in teacher account. A learner profile cannot approve a lesson.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" href="/onboarding?role=teacher&mode=signin">Sign in as a teacher</Link>
          <Link className="btn ghost" href="/teacher">Teacher console</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card" data-lesson-review-form style={{ marginBottom: 20 }}>
      <p className="eyebrow" style={{ margin: 0 }}>Educator review · {lessonId}</p>
      <h2 style={{ margin: "6px 0" }}>{title}</h2>
      <p className="small muted" style={{ marginTop: 0 }}>
        Signed in as <strong>{session.account?.name}</strong>. The server records your account, not a name supplied by this form.
        Version <code>{lessonVersion}</code> · hash <code>{contentHash.slice(0, 16)}</code>.
      </p>

      <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
        <legend className="small" style={{ fontWeight: 700, marginBottom: 8 }}>Who is reviewing?</legend>
        <label className="small" style={{ display: "block", fontWeight: 700, marginBottom: 4 }} htmlFor="lesson-review-role">Review role</label>
        <select
          id="lesson-review-role"
          value={reviewRole}
          onChange={(event) => setReviewRole(event.target.value as ReviewRole)}
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line, #d8ddd8)", marginBottom: 8 }}
        >
          {REVIEW_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}
        </select>
        <label className="small" style={{ display: "block", fontWeight: 700, marginBottom: 4 }} htmlFor="lesson-review-qualifications">
          Qualifications or relevant experience
        </label>
        <input
          id="lesson-review-qualifications"
          value={qualifications}
          onChange={(event) => setQualifications(event.target.value)}
          placeholder="e.g. PGCE Mathematics, 8 years teaching GCSE Higher"
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line, #d8ddd8)", marginBottom: 8 }}
        />
        <label className="small" style={{ display: "block", fontWeight: 700, marginBottom: 4 }} htmlFor="lesson-review-scope">
          Review scope
        </label>
        <input
          id="lesson-review-scope"
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          placeholder="e.g. whole lesson, GCSE Foundation and Higher, English"
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line, #d8ddd8)" }}
        />
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
        <legend className="small" style={{ fontWeight: 700, marginBottom: 8 }}>What did you check?</legend>
        {REVIEW_CRITERIA.map((criterion) => (
          <label key={criterion.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={checks[criterion.id]}
              onChange={(event) => { setChecks((current) => ({ ...current, [criterion.id]: event.target.checked })); setNotice(""); }}
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
        <legend className="small" style={{ fontWeight: 700, marginBottom: 8 }}>Findings</legend>
        {findings.length === 0 && <p className="small muted" style={{ marginTop: 0 }}>No findings added. Add one for every specific problem; a blocking finding makes approval impossible.</p>}
        {findings.map((finding, index) => (
          <div key={finding.id} className="card soft" style={{ marginBottom: 10, padding: 12 }}>
            <p className="small" style={{ margin: "0 0 8px", fontWeight: 700 }}>Finding {index + 1}</p>
            <label className="small" htmlFor={`finding-location-${index}`} style={{ display: "block", marginBottom: 4 }}>Location</label>
            <input
              id={`finding-location-${index}`}
              value={finding.location}
              onChange={(event) => updateFinding(index, { location: event.target.value })}
              placeholder="Section, block or assessment id"
              style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line, #d8ddd8)", marginBottom: 8 }}
            />
            <label className="small" htmlFor={`finding-problem-${index}`} style={{ display: "block", marginBottom: 4 }}>Problem</label>
            <textarea
              id={`finding-problem-${index}`}
              value={finding.problem}
              onChange={(event) => updateFinding(index, { problem: event.target.value })}
              rows={2}
              style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line, #d8ddd8)", marginBottom: 8 }}
            />
            <label className="small" htmlFor={`finding-consequence-${index}`} style={{ display: "block", marginBottom: 4 }}>Educational consequence</label>
            <textarea
              id={`finding-consequence-${index}`}
              value={finding.educationalConsequence}
              onChange={(event) => updateFinding(index, { educationalConsequence: event.target.value })}
              rows={2}
              style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line, #d8ddd8)", marginBottom: 8 }}
            />
            <label className="small" htmlFor={`finding-recommendation-${index}`} style={{ display: "block", marginBottom: 4 }}>Recommended correction</label>
            <textarea
              id={`finding-recommendation-${index}`}
              value={finding.recommendation}
              onChange={(event) => updateFinding(index, { recommendation: event.target.value })}
              rows={2}
              style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line, #d8ddd8)", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <label className="small" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                Severity
                <select
                  value={finding.severity}
                  onChange={(event) => updateFinding(index, { severity: event.target.value as ReviewFinding["severity"] })}
                  style={{ padding: 6, borderRadius: 8, border: "1px solid var(--line, #d8ddd8)" }}
                >
                  <option value="blocking">Blocking</option>
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                </select>
              </label>
              <label className="small" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={finding.blockPublication}
                  onChange={(event) => updateFinding(index, { blockPublication: event.target.checked })}
                />
                Blocks publication
              </label>
              <button type="button" className="btn ghost" onClick={() => setFindings((current) => current.filter((_, i) => i !== index))}>
                Remove finding
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn ghost"
          onClick={() => setFindings((current) => [...current, blankFinding(current.length)])}
        >
          Add finding
        </button>
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
        <legend className="small" style={{ fontWeight: 700, marginBottom: 8 }}>Decision</legend>
        <label style={{ display: "inline-flex", gap: 6, marginRight: 18 }}>
          <input type="radio" name="lesson-review-decision" checked={decision === "changes-requested"} onChange={() => setDecision("changes-requested")} />
          <span className="small">Request changes</span>
        </label>
        <label style={{ display: "inline-flex", gap: 6 }}>
          <input type="radio" name="lesson-review-decision" checked={decision === "approved"} onChange={() => setDecision("approved")} />
          <span className="small">Approve this exact version</span>
        </label>
      </fieldset>

      <label className="small" htmlFor="lesson-review-notes" style={{ display: "block", fontWeight: 700, marginBottom: 4 }}>
        Review notes
      </label>
      <textarea
        id="lesson-review-notes"
        rows={5}
        value={notes}
        onChange={(event) => { setNotes(event.target.value); setNotice(""); }}
        placeholder="What did you verify, what should the next reviewer know, and what must change?"
        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line, #d8ddd8)", font: "inherit" }}
      />
      <p className="small muted" style={{ margin: "4px 0 10px" }}>
        Approval requires all six checks, no blocking finding, and at least 20 characters of notes. The record is bound to the version and hash above.
      </p>

      {error && <p className="small" role="alert" style={{ color: "var(--bad, #a12a2a)" }}>{error}</p>}
      {notice && <p className="small" role="status">{notice}</p>}
      <button type="button" className="btn" onClick={submit} disabled={!canSubmit}>
        {busy ? "Recording…" : "Record human review"}
      </button>
    </section>
  );
}
