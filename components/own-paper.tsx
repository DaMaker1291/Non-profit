"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BRING YOUR OWN PAPER.
//
// The learner sits a paper OpenMind is not allowed to host — their own board's,
// with no licence — and hands OpenMind the WORKSPACE instead of the paper:
// which question, how many marks it was worth, how many they got, and which
// idea it tested.
//
// The form is deliberately incapable of accepting question text. There is no
// "paste your paper here" box, because pasting is exactly how a copyrighted
// document ends up in a database that may not hold it. The UI says what it
// keeps, in the learner's own language, next to the fields that keep it.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { loadLocalProfileSecret, loadLocalProfileId, useI18n } from "@/lib/client";
import { ctitle } from "@/lib/content-i18n";
import PaperAnalysisPanel, { type PaperAnalysisShape } from "@/components/paper-analysis";
import type { BoardId, SubjectId } from "@/lib/types";

export interface OwnPaperConcept {
  id: string;
  subject: SubjectId;
}

interface Row {
  number: string;
  marks: string;
  awarded: string;
  conceptId: string;
}

interface SavedPaper {
  id: string;
  title: string;
  year?: string;
  questionCount: number;
}

const emptyRow = (n: number): Row => ({ number: String(n), marks: "1", awarded: "0", conceptId: "" });

export default function OwnPaper({ concepts, board }: { concepts: OwnPaperConcept[]; board?: BoardId }) {
  const { t, lang } = useI18n();
  const id = loadLocalProfileId();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow(1)]);
  const [saved, setSaved] = useState<SavedPaper[]>([]);
  const [analysis, setAnalysis] = useState<PaperAnalysisShape | null>(null);
  const [recorded, setRecorded] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const bySubject = new Map<SubjectId, OwnPaperConcept[]>();
  for (const c of concepts) {
    const list = bySubject.get(c.subject) ?? [];
    list.push(c);
    bySubject.set(c.subject, list);
  }

  const load = useCallback(async () => {
    if (!id) return;
    const secret = loadLocalProfileSecret();
    const res = await fetch(`/api/my-paper?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret ?? "")}`);
    if (!res.ok) return;
    const body = await res.json();
    setSaved(body.papers ?? []);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  function setRow(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  async function save() {
    if (busy || !id) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/my-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          id,
          secret: loadLocalProfileSecret(),
          title,
          year: year || undefined,
          board,
          questions: rows.map((r) => ({
            number: r.number,
            marks: Number(r.marks),
            awarded: Number(r.awarded),
            conceptId: r.conceptId,
          })),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        // Server rejections are named ("bad_marks", "content_not_accepted") so
        // the learner is told what was refused, not just "invalid input".
        const known = ["bad_marks", "bad_concept", "empty", "duplicate_question", "bad_title", "too_many_questions", "content_not_accepted"];
        setErr(known.includes(body.error) ? t(`own.err.${body.error}`) : (body.error ?? t("common.error")));
        return;
      }
      setAnalysis(body.analysis ?? null);
      setRecorded(typeof body.recorded === "number" ? body.recorded : null);
      setTitle("");
      setRows([emptyRow(1)]);
      void load();
    } catch {
      setErr(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function reopen(paperId: string) {
    if (!id) return;
    const res = await fetch("/api/my-paper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark", id, secret: loadLocalProfileSecret(), paperId }),
    });
    const body = await res.json();
    if (res.ok) { setAnalysis(body.analysis ?? null); setRecorded(null); }
  }

  const input = { padding: "8px 10px", border: "1px solid var(--rule, #e5e7eb)", borderRadius: 8, fontSize: 14 } as const;

  return (
    <section className="exercise" style={{ marginTop: 20 }} aria-label={t("own.title")}>
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">✎</span> {t("own.title")}</p>
      <p className="small muted" style={{ marginTop: 6 }}>{t("own.lead")}</p>

      {/* Where content may come from — the rights model, said out loud, because
          a learner deserves to know why one thing is here and another is not. */}
      <div style={{ marginTop: 12, borderTop: "1px solid var(--rule, #e5e7eb)" }}>
        <p className="small" style={{ margin: "10px 0 4px", fontWeight: 600 }}>{t("own.sources")}</p>
        {(["openmind_authored", "user_provided", "external_link", "licensed_official"] as const).map((origin) => (
          <div key={origin} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "6px 0", borderTop: "1px solid var(--rule, #f1f1f1)" }}>
            <span className="small" style={{ flex: "0 0 38%" }}>{t(`rights.origin.${origin}`)}</span>
            <span className="small muted" style={{ flex: 1 }}>{t(`rights.note.${origin}`)}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="small" style={{ display: "block" }}>
          {t("own.paperTitle")}
          <input style={{ ...input, width: "100%", marginTop: 4 }} value={title} placeholder={t("own.paperTitlePh")} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="small" style={{ display: "block", marginTop: 8 }}>
          {t("own.year")}
          <input style={{ ...input, width: 160, display: "block", marginTop: 4 }} value={year} onChange={(e) => setYear(e.target.value)} />
        </label>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="small muted" style={{ display: "flex", gap: 8 }}>
          <span style={{ flex: "0 0 70px" }}>{t("own.q")}</span>
          <span style={{ flex: "0 0 70px" }}>{t("own.marks")}</span>
          <span style={{ flex: "0 0 70px" }}>{t("own.awarded")}</span>
          <span style={{ flex: 1 }}>{t("own.concept")}</span>
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <input aria-label={t("own.q")} style={{ ...input, flex: "0 0 70px" }} value={row.number} onChange={(e) => setRow(i, { number: e.target.value })} />
            <input aria-label={t("own.marks")} style={{ ...input, flex: "0 0 70px" }} inputMode="numeric" value={row.marks} onChange={(e) => setRow(i, { marks: e.target.value })} />
            <input aria-label={t("own.awarded")} style={{ ...input, flex: "0 0 70px" }} inputMode="numeric" value={row.awarded} onChange={(e) => setRow(i, { awarded: e.target.value })} />
            <select
              aria-label={t("own.concept")}
              style={{ ...input, flex: 1, minWidth: 0 }}
              value={row.conceptId}
              onChange={(e) => setRow(i, { conceptId: e.target.value })}
            >
              <option value="">—</option>
              {[...bySubject.entries()].map(([subject, list]) => (
                <optgroup key={subject} label={t(`subj.${subject}`)}>
                  {list.map((c) => (
                    <option key={c.id} value={c.id}>{ctitle(lang, c.id)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {rows.length > 1 && (
              <button className="btn small ghost" onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))} aria-label={t("own.remove")}>✕</button>
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn small ghost" onClick={() => setRows((r) => [...r, emptyRow(r.length + 1)])}>{t("own.addRow")}</button>
          <button className="btn small" disabled={busy || !title} onClick={() => void save()}>{t("own.save")}</button>
        </div>
      </div>

      <p className="small muted" style={{ marginTop: 12, borderLeft: "2px solid var(--rule, #ddd)", paddingLeft: 10 }}>
        <strong>{t("own.storedTitle")}</strong> {t("own.stored")}
      </p>

      {err && <p className="marking bad" style={{ padding: "10px 14px" }}><span className="mark" aria-hidden="true">✗</span> {err}</p>}
      {recorded !== null && !err && (
        <p className="small" style={{ marginTop: 10 }}>
          {/* No plural machinery exists, so one needs its own key — otherwise
              the first thing a learner ever sees here reads "1 answers". */}
          <span className="mark good" aria-hidden="true">✓</span>{" "}
          {t(recorded === 1 ? "own.savedOne" : "own.saved").replace("{n}", String(recorded))}
        </p>
      )}

      {analysis && <PaperAnalysisPanel analysis={analysis} />}

      {saved.length > 0 && (
        <div style={{ marginTop: 18, borderTop: "1px solid var(--rule, #e5e7eb)", paddingTop: 10 }}>
          <p className="small" style={{ margin: 0, fontWeight: 600 }}>{t("own.mine")}</p>
          {saved.map((p) => (
            <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "6px 0", borderTop: "1px solid var(--rule, #f1f1f1)" }}>
              <span className="small" style={{ flex: 1 }}>{p.title}{p.year ? ` · ${p.year}` : ""}</span>
              <span className="mono small muted">{p.questionCount} {t("pp.q")}</span>
              <button className="btn small ghost" onClick={() => void reopen(p.id)}>{t("own.open")}</button>
            </div>
          ))}
        </div>
      )}

      <p className="small muted" style={{ marginTop: 14 }}>
        <Link href="/dashboard">{t("nav.home")}</Link>
      </p>
    </section>
  );
}
