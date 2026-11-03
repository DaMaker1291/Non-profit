"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getConcept } from "@/lib/genome";
import { classroom, classroomAction, classroomStreamUrl } from "@/lib/api/client";
import type { ClassroomSessionView } from "@/lib/types";

interface Data {
  session: ClassroomSessionView | null;
  availableConcepts: { id: string; title: string }[];
  reviewGate: string | null;
}

type Action =
  | "start" | "join" | "publish" | "pause" | "resume" | "end" | "submit";

function newSubmissionId(): string {
  const rnd = globalThis.crypto?.randomUUID?.().replace(/-/g, "")
    ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `live_${rnd}`;
}

/**
 * One live classroom surface. The teacher gets the controls and the class's
 * participation table; a pupil gets their own question and their own result.
 * Both read the SAME server snapshot.
 *
 * The stream is an EventSource of persisted versions. There is no client
 * mutation of the room: publish, pause and end all POST, and the resulting
 * version is what every connected browser sees.
 */
export default function LiveClassroom({ clsId, teacher = false }: { clsId: string; teacher?: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [conceptId, setConceptId] = useState("");
  const [choice, setChoice] = useState<number | null>(null);

  const load = useCallback(async () => {
    const j = await classroom(clsId);
    setData(j as Data);
    return j as Data;
  }, [clsId]);

  useEffect(() => {
    let alive = true;
    load().catch((e) => { if (alive) setError(e instanceof Error ? e.message : "Could not read the live class"); });
    const es = new EventSource(classroomStreamUrl(clsId));
    const onSession = (ev: MessageEvent) => {
      try {
        const next = JSON.parse(ev.data) as ClassroomSessionView;
        setData((prev) => prev ? { ...prev, session: next } : prev);
        setError("");
      } catch { /* a malformed event is ignored; the next version may be fine */ }
    };
    const onAbsent = () => setData((prev) => prev ? { ...prev, session: null } : prev);
    es.addEventListener("session", onSession as EventListener);
    es.addEventListener("absent", onAbsent as EventListener);
    es.onerror = () => { /* EventSource reconnects by itself */ };
    return () => { alive = false; es.close(); };
  }, [clsId, load]);

  const act = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const j = await classroomAction(clsId, body);
      if (j.session !== undefined) {
        setData((prev) => prev ? { ...prev, session: j.session ?? null } : prev);
      }
      if (j.error) {
        setError(j.error === "submissions_paused"
          ? "Submissions are paused."
          : String(j.error).replace(/_/g, " "));
      }
      return j;
    } catch (e) {
      setError(e instanceof Error ? e.message : "The action did not complete");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const session = data?.session ?? null;
  const activity = session?.activity ?? null;
  const mine = session?.me.submission ?? null;
  const canControl = !!session?.canControl;

  const statusLine = useMemo(() => {
    if (!session) return teacher ? "No live class is running." : "Your teacher has not started a live class yet.";
    if (session.status === "ended") return "This live class has ended. The work is recorded.";
    if (session.status === "paused") return "Paused — submissions are closed.";
    return activity ? "Live — answer on your device." : "Live — waiting for the teacher to publish an activity.";
  }, [session, activity, teacher]);

  if (!data && error) {
    return <p className="small" style={{ color: "var(--margin-red)" }}>Live class: {error}</p>;
  }
  if (!data) return <p className="small muted">Loading the live class…</p>;

  return (
    <section className="card" style={{ padding: 16 }} aria-label="Live classroom" data-live-classroom>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
        <p className="eyebrow" style={{ margin: 0 }}>Live classroom</p>
        <span className="chip">{statusLine}</span>
      </div>

      {error && <p className="small" role="alert" style={{ color: "var(--margin-red)" }}>{error}</p>}

      {!session && teacher && (
        <div style={{ marginTop: 12 }}>
          <p className="small muted">Start a room, then publish an approved lesson activity. Pupils in this class join from their own devices.</p>
          <button className="btn" disabled={busy} onClick={() => void act({ action: "start" })}>
            {busy ? "Starting…" : "Start live class"}
          </button>
          {data.reviewGate && <p className="small muted" style={{ marginTop: 8 }}>{data.reviewGate}</p>}
        </div>
      )}

      {session && (
        <>
          <p className="small muted" style={{ margin: "8px 0" }}>
            {session.counts.participants} joined · {session.counts.submitted} submitted · {session.counts.correct} correct
          </p>

          {/* JOINING IS A PROPERTY OF THE ROOM, NOT OF AN ACTIVITY. It used to
              live inside the activity branch, so a pupil could not take their
              place until the teacher had already published — which made "the
              pupils are in the room before the question arrives" impossible. */}
          {!teacher && !session.me.joined && session.status !== "ended" && (
            <button className="btn" disabled={busy} onClick={() => void act({ action: "join", sessionId: session.id })}>
              Join live activity
            </button>
          )}

          {teacher && session.status !== "ended" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: "10px 0" }}>
              {activity == null && (
                <>
                  <select value={conceptId} onChange={(e) => setConceptId(e.target.value)} aria-label="Activity lesson">
                    <option value="">Choose a reviewed lesson…</option>
                    {data.availableConcepts.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <button
                    className="btn small"
                    disabled={busy || !conceptId}
                    onClick={() => void act({ action: "publish", sessionId: session.id, conceptId })}
                  >Publish activity</button>
                </>
              )}
              {activity && (
                <button className="btn small" disabled={busy} onClick={() => void act({ action: "publish", sessionId: session.id, conceptId: activity.conceptId })}>
                  Publish another
                </button>
              )}
              {session.status === "live"
                ? <button className="btn ghost small" disabled={busy} onClick={() => void act({ action: "pause", sessionId: session.id })}>Pause submissions</button>
                : <button className="btn ghost small" disabled={busy} onClick={() => void act({ action: "resume", sessionId: session.id })}>Resume</button>}
              <button className="btn ghost small" disabled={busy} onClick={() => void act({ action: "end", sessionId: session.id })}>End class</button>
            </div>
          )}

          {activity ? (
            <div data-live-activity style={{ marginTop: 12 }}>
              <p className="eyebrow" style={{ margin: 0 }}>{activity.conceptTitle}</p>
              <p style={{ fontSize: 20, fontWeight: 650, margin: "6px 0 10px" }}>{activity.prompt}</p>
              {activity.figure && (
                <p className="small muted">This activity includes a diagram on the pupil’s screen.</p>
              )}
              {teacher ? (
                <>
                  <p className="small"><b>Correct option:</b> {activity.choices[session.answerIndex ?? -1] ?? "—"}</p>
                  {session.explanation && <p className="small muted">{session.explanation}</p>}
                  <div className="tbl-wrap" style={{ marginTop: 10 }}>
                    <table className="tbl">
                      <thead><tr><th>Pupil</th><th>Submitted</th><th>Result</th></tr></thead>
                      <tbody>
                        {session.participants.length === 0
                          ? <tr><td colSpan={3} className="small muted">No pupil has joined yet.</td></tr>
                          : session.participants.map((p) => (
                            <tr key={p.handle}>
                              <td>{p.handle}</td>
                              <td>{p.submitted ? "Yes" : "Waiting"}</td>
                              <td>{p.submitted ? (p.correct ? "Correct" : "Not yet") : "—"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  {!session.me.joined ? (
                    <p className="note">Join the room above to answer this activity.</p>
                  ) : mine ? (
                    <p className="note" role="status">
                      {mine.correct ? "✓ Correct — recorded." : "Not yet — recorded. Your teacher can see that you submitted."}
                    </p>
                  ) : session.status !== "live" || !activity.submissionsOpen ? (
                    <p className="note">Submissions are closed for this activity.</p>
                  ) : (
                    <div>
                      <div style={{ display: "grid", gap: 6 }}>
                        {activity.choices.map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`btn ghost ${choice === i ? "warn" : ""}`}
                            aria-pressed={choice === i}
                            onClick={() => setChoice(i)}
                          >{c}</button>
                        ))}
                      </div>
                      <button
                        className="btn"
                        style={{ marginTop: 10 }}
                        disabled={busy || choice === null}
                        onClick={async () => {
                          if (choice === null) return;
                          await act({
                            action: "submit",
                            sessionId: session.id,
                            questionId: activity.questionId,
                            choiceIndex: choice,
                            submissionId: newSubmissionId(),
                          });
                          setChoice(null);
                        }}
                      >Submit answer</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="small muted" style={{ marginTop: 12 }}>
              {teacher ? "Publish a reviewed lesson above to put a question on every pupil’s screen." : "Waiting for the teacher to publish an activity."}
            </p>
          )}

          {teacher && <p className="small muted" style={{ marginTop: 10 }}>
            The room is version {session.version}. Every pupil screen follows that version automatically.
          </p>}
        </>
      )}
    </section>
  );
}

/** A small convenience for the pupil page: the label a concept id should use. */
export function liveConceptTitle(id: string): string {
  return getConcept(id)?.title ?? id;
}
