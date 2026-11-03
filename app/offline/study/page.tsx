"use client";

// ── AN OFFLINE LESSON A LEARNER CAN ACTUALLY USE ────────────────────────────
//
// The pack is downloaded while online and kept in this browser under the
// learner's own id. With the network gone, the page reads the LOCAL pack model
// and marks each answer locally; the answer is then queued as a device event
// and sent through /api/evidence when the connection returns.
//
// The three status sentences are the contract: local-only work is never called
// synced; a queued answer is never called recorded; and only a server response
// that accepted (or de-duplicated) the event earns the synced state.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { loadLocalProfileId, loadLocalProfileSecret } from "@/lib/client";
import { EVIDENCE_DOOR, offlinePack, offlinePackList } from "@/lib/api/client";
import {
  clearOfflineLearner,
  loadOfflineDraft,
  loadOfflinePack,
  localOfflinePacks,
  newOfflineSubmissionId,
  offlineEvent,
  saveOfflineDraft,
  saveOfflinePack,
  type OfflineAnswer,
  type OfflineDraft,
  type OfflinePack,
} from "@/lib/offline-pack";
import { enqueueAnswer, flushQueue, postAnswer, queueSummary, setSyncScope } from "@/lib/sync-queue";
import type { Question } from "@/lib/types";

interface ListedConcept { id: string; title: string; subject: string | null; review: string }

export default function OfflineStudyPage() {
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [conceptId, setConceptId] = useState("");
  const [pack, setPack] = useState<OfflinePack | null>(null);
  const [draft, setDraft] = useState<OfflineDraft | null>(null);
  const [concepts, setConcepts] = useState<ListedConcept[]>([]);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [refused, setRefused] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const answered = useMemo(() => Object.values(draft?.answers ?? {}), [draft]);
  const allSynced = answered.length > 0 && answered.every((a) => a.status === "synced");
  const anyQueued = answered.some((a) => a.status === "queued");

  const refreshQueue = useCallback(() => {
    const q = queueSummary();
    setPending(q.pending);
    setRefused(q.refused);
    return q;
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    setBusy(true);
    try {
      const r = await flushQueue();
      refreshQueue();
      if (r.pending === 0 && r.refused === 0) {
        setDraft((d) => {
          if (!d) return d;
          const answers = Object.fromEntries(Object.entries(d.answers).map(([k, a]) => [
            k, a.status === "queued" ? { ...a, status: "synced" as const } : a,
          ]));
          const next = { ...d, answers };
          if (learnerId) saveOfflineDraft(learnerId, next);
          return next;
        });
      }
    } finally {
      setBusy(false);
    }
  }, [learnerId, refreshQueue]);

  useEffect(() => {
    const id = loadLocalProfileId();
    const s = loadLocalProfileSecret();
    // The shell may not have loaded the profile yet when this page is opened
    // offline. Bind the queue here too, or a reloaded page would look at a
    // different (unscoped) queue and believe the learner had no saved work.
    setSyncScope(id);
    setLearnerId(id);
    setSecret(s);
    setOnline(navigator.onLine);
    setPending(queueSummary().pending);
    setRefused(queueSummary().refused);
    const q = new URLSearchParams(window.location.search).get("concept") ?? "";
    setConceptId(q);
    if (!id) return;
    setPack(q ? loadOfflinePack(id, q) : null);
    setDraft(q ? loadOfflineDraft(id, q) : null);
    if (q && !loadOfflinePack(id, q)) {
      // A pack the learner downloaded earlier may be in the list; selecting it
      // is the same path as a direct link.
      const local = localOfflinePacks(id).find((p) => p.conceptId === q);
      if (local) setPack(local);
    }
    void offlinePackList(id, s)
      .then((j) => { if (Array.isArray(j.concepts)) setConcepts(j.concepts); })
      .catch(() => { /* offline: local packs still work */ });
    const on = () => { setOnline(true); void sync(); };
    const off = () => { setOnline(false); refreshQueue(); };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    if (navigator.onLine) void sync();
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [refreshQueue, sync]);

  const download = async (id: string) => {
    if (!learnerId) return;
    setBusy(true);
    setError("");
    try {
      const j = await offlinePack(learnerId, secret, id);
      if (!saveOfflinePack(learnerId, j as unknown as OfflinePack)) throw new Error("This browser could not store the lesson.");
      setPack(j as unknown as OfflinePack);
      setConceptId(id);
      setDraft(loadOfflineDraft(learnerId, id));
      setMessage("Lesson downloaded. It will open from this device with no connection.");
      window.history.replaceState(null, "", `/offline/study?concept=${encodeURIComponent(id)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download the lesson");
    } finally {
      setBusy(false);
    }
  };

  const answer = async (q: Question, choiceIndex: number) => {
    if (!learnerId || !secret || !pack || !draft) return;
    if (draft.answers[q.id]) return;
    const submissionId = newOfflineSubmissionId();
    const at = Date.now();
    const correct = choiceIndex === q.answer;
    const event = offlineEvent(learnerId, pack, q, choiceIndex, at, submissionId);
    const first: OfflineDraft = {
      ...draft,
      answers: {
        ...draft.answers,
        [q.id]: {
          questionId: q.id,
          choiceIndex,
          correct,
          at,
          submissionId,
          eventId: event.id,
          status: "queued",
        },
      },
      updatedAt: at,
    };
    setDraft(first);
    saveOfflineDraft(learnerId, first);
    setMessage(navigator.onLine ? "Submitting your answer…" : "Saved on this device. It has not reached OpenMind's server.");

    if (!navigator.onLine) {
      enqueueAnswer({
        submissionId,
        url: EVIDENCE_DOOR,
        body: { id: learnerId, secret, events: [event] },
        deviceAt: at,
        queuedAt: at,
      });
      refreshQueue();
      return;
    }

    const out = await postAnswer(EVIDENCE_DOOR, {
      submissionId,
      body: { id: learnerId, secret, events: [event] },
      deviceAt: at,
    });
    const sent = out.kind === "sent" ? await out.res.json().catch(() => null) : null;
    const status: OfflineAnswer["status"] = out.kind === "sent"
      ? ((sent?.accepted ?? 0) > 0 || (sent?.duplicates ?? 0) > 0 ? "synced" : "refused")
      : out.kind === "refused" ? "refused" : "queued";
    const final = { ...first, answers: { ...first.answers, [q.id]: { ...first.answers[q.id], status } } };
    setDraft(final);
    saveOfflineDraft(learnerId, final);
    refreshQueue();
    if (status === "synced") setMessage("Synced — this answer has been received and recorded.");
    else if (status === "refused") setError("The server refused this answer. It was not recorded.");
    else setMessage("Not yet synced. Your answer is saved on this device and will retry.");
  };

  if (!learnerId) {
    return (
      <main className="container narrow page" style={{ paddingTop: 40 }}>
        <h1>Offline lesson</h1>
        <p className="lead">Sign in first, then download a lesson for offline use.</p>
        <Link href="/onboarding?mode=signin" className="btn">Sign in →</Link>
      </main>
    );
  }

  if (!pack) {
    return (
      <main className="container narrow page" style={{ paddingTop: 40 }}>
        <p className="eyebrow">Offline learning</p>
        <h1>Download a lesson</h1>
        <p className="lead">
          These are OpenMind-authored pilot lessons. The pack includes the teaching and three questions;
          this device can mark them without a connection and send the evidence when it reconnects.
        </p>
        {!online && <p className="note">You are offline. Lessons already downloaded on this device are listed below.</p>}
        {error && <p className="small" role="alert" style={{ color: "var(--margin-red)" }}>{error}</p>}
        {message && <p className="small" role="status">{message}</p>}
        <div className="card soft">
          <label htmlFor="offline-concept" className="eyebrow">Lesson</label>
          <select id="offline-concept" value={conceptId} onChange={(e) => setConceptId(e.target.value)} style={{ width: "100%", margin: "6px 0 10px" }}>
            <option value="">Choose a lesson…</option>
            {concepts.map((c) => <option key={c.id} value={c.id}>{c.title} · {c.review.replace(/-/g, " ")}</option>)}
          </select>
          <button className="btn" disabled={busy || !conceptId || !online} onClick={() => void download(conceptId)}>
            {busy ? "Downloading…" : "Download lesson"}
          </button>
        </div>
        {localOfflinePacks(learnerId).length > 0 && (
          <section style={{ marginTop: 18 }}>
            <p className="eyebrow">Already on this device</p>
            {localOfflinePacks(learnerId).map((p) => (
              <p key={p.conceptId} style={{ margin: "6px 0" }}>
                <Link className="btn ghost small" href={`/offline/study?concept=${encodeURIComponent(p.conceptId)}`}>{p.title} →</Link>
              </p>
            ))}
          </section>
        )}
        <p className="small muted" style={{ marginTop: 18 }}><Link href="/offline">← Offline plan</Link></p>
      </main>
    );
  }

  return (
    <main className="container narrow page" style={{ paddingTop: 36 }} data-offline-study>
      <p className="eyebrow">Offline lesson · {pack.title}</p>
      <h1>{pack.title}</h1>
      <p className="small muted">{pack.review.replace(/-/g, " ")} · {pack.rights.basis} ({pack.rights.licence})</p>

      {/* THE STATUS IS A SCREEN, NOT A PROMISE. Each state names what has
          actually happened to the learner's work. */}
      {!online && (
        <div className="note" role="status" data-offline-status="working">
          <b>Working offline</b>
          <p className="small" style={{ margin: "4px 0 0" }}>
            Local only. Your answer has been saved on this device. It has not yet reached OpenMind's server.
          </p>
        </div>
      )}
      {online && pending > 0 && (
        <div className="note" role="status" data-offline-status="syncing">
          <b>Synchronising</b>
          <p className="small" style={{ margin: "4px 0 0" }}>Your saved work is being submitted.</p>
        </div>
      )}
      {online && pending === 0 && allSynced && (
        <div className="note" role="status" data-offline-status="synced">
          <b>Synced</b>
          <p className="small" style={{ margin: "4px 0 0" }}>Your work has been received and recorded.</p>
        </div>
      )}
      {online && pending === 0 && anyQueued && refused === 0 && (
        <p className="small note">There is saved work still to send. It will retry when the connection is available.</p>
      )}
      {refused > 0 && <p className="small" role="alert" style={{ color: "var(--margin-red)" }}>{refused} saved answer(s) were refused by the server and were not recorded.</p>}
      {message && <p className="small" role="status">{message}</p>}
      {error && <p className="small" role="alert" style={{ color: "var(--margin-red)" }}>{error}</p>}

      <section className="card" style={{ marginTop: 16 }}>
        <p className="eyebrow">What this builds</p>
        <p><b>{pack.plan.objective}</b></p>
        <p>{pack.plan.intuition}</p>
        {pack.plan.idea.map((p, i) => <p key={i}>{p}</p>)}
        {pack.plan.figure && <p className="small muted">{pack.plan.figure.caption}</p>}
        {pack.plan.traps.map((t, i) => (
          <p key={i} className="small"><b>{t.move}</b> — {t.why}</p>
        ))}
      </section>

      <section style={{ marginTop: 20 }}>
        <p className="eyebrow">Your turn</p>
        {pack.questions.map((q, qi) => {
          const a = draft?.answers[q.id];
          return (
            <div key={q.id} className="card soft" style={{ marginBottom: 12 }} data-offline-question={q.id}>
              <p style={{ fontWeight: 650 }}>{qi + 1}. {q.prompt}</p>
              <div style={{ display: "grid", gap: 6 }}>
                {q.choices.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`btn ghost ${a?.choiceIndex === i ? "warn" : ""}`}
                    disabled={!!a || busy}
                    aria-pressed={a?.choiceIndex === i}
                    onClick={() => void answer(q, i)}
                  >{c}</button>
                ))}
              </div>
              {a && (
                <div className="note" style={{ marginTop: 8 }} data-offline-answer-status={a.status}>
                  <b>{a.correct ? "✓ Correct" : "Not yet"}</b>{" "}
                  <span className="small">
                    {a.status === "synced" ? "Synced — recorded on the server." : a.status === "refused" ? "Refused by the server; not recorded." : "Local only — saved on this device, not yet confirmed by the server."}
                  </span>
                  {!a.correct && <p className="small" style={{ margin: "4px 0 0" }}>{q.explanation}</p>}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        {online && (pending > 0 || anyQueued) && (
          <button className="btn" disabled={busy} onClick={() => void sync()}>Sync now</button>
        )}
        <button
          className="btn ghost small"
          onClick={() => {
            clearOfflineLearner(learnerId);
            setPack(null);
            setDraft(null);
            setMessage("This learner's downloaded packs and drafts were removed from this device.");
          }}
        >Remove this lesson from this device</button>
        <Link href="/offline" className="btn ghost small">← Offline plan</Link>
      </div>
    </main>
  );
}
