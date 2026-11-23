"use client";

import { useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api/client";

interface LessonOption { conceptId: string; title: string; subject: string; version: string; review: string }
interface ClassOption {
  id: string;
  name: string;
  subject?: string;
  members?: string[];
  membersById?: Record<string, string>;
}
interface MarkItem { id: string; prompt: string; kind: string; max: number; section: string }

export function PaperMarkEntry({ lessons, meId }: { lessons: LessonOption[]; meId: string }) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [clsId, setClsId] = useState("");
  const [learnerId, setLearnerId] = useState("");
  const [conceptId, setConceptId] = useState("");
  const [items, setItems] = useState<MarkItem[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [rubric, setRubric] = useState("");
  const [observed, setObserved] = useState(true);
  const [groupId, setGroupId] = useState("");
  const [quality, setQuality] = useState<"high" | "medium" | "low">("medium");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.classes(meId)
      .then((data) => setClasses((data.classes ?? []) as unknown as ClassOption[]))
      .catch(() => setError("Could not load classes."));
  }, [meId]);

  const cls = classes.find((c) => c.id === clsId);
  const learners = useMemo(() => {
    if (!cls) return [] as { id: string; handle: string }[];
    return Object.entries(cls.membersById ?? {}).map(([handle, id]) => ({ id, handle }));
  }, [cls]);

  const lesson = lessons.find((l) => l.conceptId === conceptId);

  useEffect(() => {
    setLearnerId("");
  }, [clsId]);

  useEffect(() => {
    setItems([]);
    setMarks({});
    setMessage("");
    if (!conceptId) return;
    api.authoredLessonPaperItems(conceptId)
      .then((data) => setItems((data.items ?? []) as MarkItem[]))
      .catch(() => setError("Could not load this lesson's questions."));
  }, [conceptId]);

  const entered = items.filter((i) => marks[i.id] !== undefined && marks[i.id] !== "");

  async function submit() {
    setError("");
    setMessage("");
    if (!clsId || !learnerId || !conceptId || !lesson) { setError("Choose a class, learner and lesson."); return; }
    if (!rubric.trim()) { setError("Write the marking rubric you used. It is part of the evidence."); return; }
    if (entered.length === 0) { setError("Enter at least one mark."); return; }
    if (!observed && !groupId.trim()) { setError("Name the group when the work was not individually observed."); return; }
    setBusy(true);
    try {
      const data = await api.recordPaperMarks({
        clsId, learnerId, conceptId,
        assessmentVersion: lesson.version,
        rubric,
        observed,
        evidenceQuality: quality,
        groupId: observed ? null : groupId,
        items: entered.map((i) => ({
          questionId: i.id,
          awarded: Number(marks[i.id]),
          max: i.max,
        })),
      });
      setMessage(`${data.accepted ?? 0} mark(s) recorded. ${data.note ?? ""}`);
      if (!data.duplicates) setMarks({});
    } catch (err) {
      setError(err instanceof api.ApiError ? err.code : "Network error. The marks were not recorded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="paper-entry">
      <section className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow">1 · Who and what</p>
        <div className="paper-grid">
          <label>Class
            <select value={clsId} onChange={(e) => setClsId(e.target.value)}>
              <option value="">Choose a class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Learner
            <select value={learnerId} onChange={(e) => setLearnerId(e.target.value)} disabled={!cls}>
              <option value="">Choose a learner</option>
              {learners.map((l) => <option key={l.id} value={l.id}>{l.handle}</option>)}
            </select>
          </label>
          <label>Lesson
            <select value={conceptId} onChange={(e) => setConceptId(e.target.value)}>
              <option value="">Choose a lesson</option>
              {lessons.map((l) => <option key={l.conceptId} value={l.conceptId}>{l.subject} · {l.title} (v{l.version})</option>)}
            </select>
          </label>
        </div>
        {lesson ? (
          <p className="small muted" style={{ marginTop: 8 }}>
            Recording against lesson version <strong>{lesson.version}</strong> ({lesson.review.replace(/_/g, " ")}).
            {lesson.subject ? <> <a href={`/print/${lesson.subject}/${lesson.conceptId}`}>Open the worksheet</a>.</> : null}
          </p>
        ) : null}
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow">2 · How the work was done</p>
        <label className="paper-check">
          <input type="checkbox" checked={observed} onChange={(e) => setObserved(e.target.checked)} />
          I observed this learner&apos;s individual work
        </label>
        <p className="small muted">
          If this was group work or you did not see the individual doing it, leave this unticked. The mark is still
          recorded, but it is excluded from individual mastery.
        </p>
        {!observed ? (
          <label>Group name or id
            <input value={groupId} onChange={(e) => setGroupId(e.target.value)} maxLength={60} placeholder="e.g. Group 3" />
          </label>
        ) : null}
        <label>Evidence quality
          <select value={quality} onChange={(e) => setQuality(e.target.value as "high" | "medium" | "low")}>
            <option value="high">High — full working, marked against the rubric</option>
            <option value="medium">Medium — answer clear, some working missing</option>
            <option value="low">Low — partial or uncertain record</option>
          </select>
        </label>
        <label>Marking rubric used
          <textarea
            value={rubric}
            onChange={(e) => setRubric(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Paste or write the criteria you marked against, e.g. 1 mark for the method, 1 for the answer with unit."
          />
        </label>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow">3 · Marks from the paper</p>
        {!conceptId ? <p className="small muted">Choose a lesson to load its questions.</p> : null}
        {items.length > 0 ? (
          <div className="paper-marks">
            {items.map((item) => (
              <div key={item.id} className="paper-mark-row">
                <div>
                  <span className={`chip ${item.section}`}>{item.section}</span>
                  <p style={{ margin: "5px 0 0" }}>{item.prompt}</p>
                </div>
                <label className="paper-score">
                  <input
                    type="number"
                    min={0}
                    max={item.max}
                    step={1}
                    value={marks[item.id] ?? ""}
                    onChange={(e) => setMarks((m) => ({ ...m, [item.id]: e.target.value }))}
                    aria-label={`Marks awarded for ${item.id}`}
                  />
                  <span>/ {item.max}</span>
                </label>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn primary" onClick={submit} disabled={busy || !lesson || entered.length === 0}>
          {busy ? "Recording…" : `Record ${entered.length || ""} paper mark${entered.length === 1 ? "" : "s"}`}
        </button>
        <span className="small muted">Saved as teacher-entered evidence, not auto-marked.</span>
      </div>
      {error ? <p className="notice bad" role="alert" style={{ marginTop: 12 }}>{error}</p> : null}
      {message ? <p className="notice good" role="status" style={{ marginTop: 12 }}>{message}</p> : null}
    </div>
  );
}
