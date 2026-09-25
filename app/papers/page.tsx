"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ctitle } from "@/lib/content-i18n";
import { ensureProfileSecret, loadLocalProfileId, useI18n } from "@/lib/client";
import PaperAnalysisPanel, { type PaperAnalysisShape } from "@/components/paper-analysis";
import OwnPaper, { type OwnPaperConcept } from "@/components/own-paper";
import { coverageOf, specForProfile } from "@/lib/specifications";
import type { ProfileState, SubjectId } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Exam papers. Pick the paper your board actually sets, sit it under its own
// time limit and mark rules, then read the mark scheme and your grade estimate.
//
// The page is narrow on purpose and shows one thing at a time: during a paper
// there are no statistics, no recommendations and no side panels — the learner
// is in an exam, not in a dashboard.
// ─────────────────────────────────────────────────────────────────────────────

interface PaperQuestionView {
  id: string;
  conceptId: string;
  seed: string;
  marks: number;
  difficulty: number;
  view: { prompt: string; choices: string[] };
}

interface PaperSection {
  name: string;
  marksEach: number;
  questions: PaperQuestionView[];
}

interface Paper {
  id: string;
  name: string;
  qualification: string;
  level: string;
  subject: SubjectId;
  minutes: number;
  marks: number;
  calculator: boolean;
  boundaries: Array<{ grade: string; pct: number }>;
  sections: PaperSection[];
  questionCount: number;
}

interface PaperListEntry {
  id: string;
  name: string;
  subject: SubjectId;
  minutes: number;
  marks: number;
  calculator: boolean;
  authored: boolean;
}

interface MarkResult {
  raw: number;
  total: number;
  pct: number;
  grade: string | null;
  perQuestion: Array<{
    id: string; conceptId: string; marks: number; awarded: number;
    correct: boolean | null; chosen: number | null; answer: number; explanation: string;
  }>;
}

interface AiStatusShape { enabled: boolean; provider: string | null; model: string | null }

export default function PapersPage() {
  const { t, lang } = useI18n();
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [list, setList] = useState<PaperListEntry[]>([]);
  const [ai, setAi] = useState<AiStatusShape>({ enabled: false, provider: null, model: null });
  const [qualification, setQualification] = useState("");
  const [level, setLevel] = useState("");
  const [paper, setPaper] = useState<Paper | null>(null);
  const [source, setSource] = useState<{ source: string; aiQuestions: number; engineQuestions: number } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<MarkResult | null>(null);
  const [conceptsTested, setConceptsTested] = useState<Array<{ id: string; title: string; subject: string }>>([]);
  const [analysis, setAnalysis] = useState<PaperAnalysisShape | null>(null);
  const [busy, setBusy] = useState(false);
  const [withAi, setWithAi] = useState(false);
  const [left, setLeft] = useState(0);
  const [err, setErr] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const active = useMemo(
    () => specForProfile(profile?.profile ?? {}),
    [profile],
  );

  /** The learner's own profile + secret — papers are recorded as independent
   *  evidence, so the sitting has to be attributable to a real learner. */
  const authQuery = useCallback((): string => {
    const id = loadLocalProfileId();
    const secret = typeof window === "undefined" ? "" : (window.localStorage.getItem("openmind:profileSecret") ?? ensureProfileSecret());
    const q = new URLSearchParams();
    if (id) q.set("id", id);
    if (secret) q.set("secret", secret);
    // The language belongs in every paper request, including the list: a
    // specification-built paper is NAMED in the learner's language, and the
    // list is where that name is first read.
    if (lang) q.set("lang", lang);
    return q.toString();
  }, [lang]);

  useEffect(() => {
    const q = authQuery();
    fetch(`/api/paper?list=1${q ? `&${q}` : ""}`)
      .then((r) => r.json())
      .then((d: { papers?: PaperListEntry[]; qualification?: string; level?: string; ai?: AiStatusShape }) => {
        setList(d.papers ?? []);
        setQualification(d.qualification ?? "");
        setLevel(d.level ?? "");
        if (d.ai) setAi(d.ai);
      })
      .catch(() => setErr(t("common.error")));

    const id = loadLocalProfileId();
    if (id) {
      const secret = window.localStorage.getItem("openmind:profileSecret") ?? ensureProfileSecret();
      fetch(`/api/profile?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => s && setProfile(s as ProfileState))
        .catch(() => undefined);
    }
  }, [authQuery, t]);

  const stopTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stopTimer, [stopTimer]);

  async function startPaper(templateId: string, subject: SubjectId) {
    setBusy(true);
    setErr("");
    setResult(null);
    try {
      const q = new URLSearchParams(authQuery());
      q.set("templateId", templateId);
      q.set("subject", subject);
      q.set("lang", lang);
      q.set("seed", `${Date.now().toString(36)}`);
      if (withAi && ai.enabled) q.set("ai", "1");
      const res = await fetch(`/api/paper?${q.toString()}`);
      if (!res.ok) throw new Error("paper_failed");
      const data = (await res.json()) as { paper: Paper; source: string; aiQuestions: number; engineQuestions: number };
      setPaper(data.paper);
      setSource({ source: data.source, aiQuestions: data.aiQuestions, engineQuestions: data.engineQuestions });
      setAnswers({});
      setLeft(data.paper.minutes * 60);
      stopTimer();
      timer.current = setInterval(() => {
        setLeft((s) => {
          if (s <= 1) {
            stopTimer();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      setErr(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!paper) return;
    stopTimer();
    setBusy(true);
    setErr("");
    try {
      const body: Record<string, unknown> = { paperId: paper.id, answers, lang };
      const id = loadLocalProfileId();
      if (id) body.id = id;
      const secret = window.localStorage.getItem("openmind:profileSecret") ?? ensureProfileSecret();
      if (secret) body.secret = secret;
      const res = await fetch("/api/paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("mark_failed");
      const data = (await res.json()) as {
        result: MarkResult;
        analysis?: PaperAnalysisShape;
        conceptsTested: Array<{ id: string; title: string; subject: string }>;
      };
      setResult(data.result);
      setAnalysis(data.analysis ?? null);
      setConceptsTested(data.conceptsTested ?? []);
    } catch {
      setErr(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  // The concepts a learner may attribute their own paper's questions to: their
  // qualification's own coverage, which is the only taxonomy this codebase can
  // honestly offer (a board's named topics are not encoded anywhere).
  const ownConcepts: OwnPaperConcept[] = useMemo(() => {
    if (!profile) return [];
    try {
      return coverageOf(specForProfile(profile.profile)).map((c) => ({ id: c.id, subject: c.subject as SubjectId }));
    } catch {
      return [];
    }
  }, [profile]);

  const answeredCount = Object.keys(answers).length;
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  /** A grade band is a symbol (A*, 7, 500) or a word. Only "Pass" is a word. */
  const gradeLabel = (g: string | null) => (g === "Pass" ? t("pp.gradePass") : g ?? "—");

  return (
    <main className="container narrow" style={{ paddingTop: 32, maxWidth: 800 }}>
      <p className="eyebrow"><span className="no">◉</span> {t("pp.title")}</p>
      <h1>{qualification ? `${qualification}${level ? ` · ${level}` : ""}` : t("pp.title")}</h1>
      <p className="lead">{t("pp.lead")}</p>

      <p className="small muted" style={{ borderLeft: "2px solid var(--rule, #ddd)", paddingLeft: 10 }}>
        {t("pp.honest")}
      </p>

      <p className="small muted">
        {ai.enabled
          ? `${t("ai.on")} · ${ai.provider}${ai.model ? ` (${ai.model})` : ""}`
          : t("ai.off"        )}
        {!ai.enabled && <> — {t("ai.note")}</>}
        {" "}
        {ai.enabled && <span>{t("ai.note")}</span>}
      </p>

      {err && <p className="marking bad" style={{ padding: "10px 14px" }}><span className="mark" aria-hidden="true">✗</span> {err}</p>}

      {/* ── Paper picker ─────────────────────────────────────────────────── */}
      {!paper && !result && (
        <>
          <div className="exercise" style={{ marginTop: 20 }}>
            <h2 style={{ marginTop: 0 }}>{t("pp.pick")}</h2>
            <p className="small muted">{t("pp.pickLead")}</p>
            {list.length === 0 && <p className="muted">{t("pp.empty")}</p>}
            <div style={{ display: "grid", gap: 10 }}>
              {list.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid var(--rule, #e5e7eb)", borderRadius: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    {/* No subject here: an authored paper's name already carries
                        it, and a specification-built paper IS the subject. */}
                    <div className="small muted">
                      {p.marks} {t("pp.marks")} · {p.minutes} {t("pp.min")} · {p.calculator ? t("pp.calc") : t("pp.noCalc")}
                    </div>
                  </div>
                  <button className="btn small" disabled={busy} onClick={() => startPaper(p.id, p.subject)}>
                    {t("pp.start")}
                  </button>
                </div>
              ))}
            </div>
            {ai.enabled && (
              <label className="checks" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14 }}>
                <input type="checkbox" checked={withAi} onChange={(e) => setWithAi(e.target.checked)} />
                {t("pp.aiToggle")}
              </label>
            )}
          </div>

          {/* Not every paper can be hosted here, and refusing to help would be
              absurd: the learner brings their own, and OpenMind brings the
              workspace. Marks and ideas only — never the paper. */}
          <OwnPaper concepts={ownConcepts} board={profile?.profile.board} />

          <p className="small muted" style={{ marginTop: 20 }}>
            <Link href="/learn">{t("nav.learn")}</Link> · <Link href="/dashboard">{t("nav.home")}</Link>
          </p>
        </>
      )}

      {/* ── The sitting ──────────────────────────────────────────────────── */}
      {paper && !result && (
        <>
          <div style={{ position: "sticky", top: 0, background: "var(--surface, #fff)", padding: "10px 0", display: "flex", alignItems: "center", gap: 12, zIndex: 2 }}>
            <strong>{paper.name}</strong>
            <span className="muted small">{answeredCount}/{paper.questionCount}</span>
            <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>⏱ {clock}</span>
          </div>
          {source && (
            <p className="small muted">
              {source.source === "ai" ? t("ai.written") : source.source === "mixed" ? `${t("ai.written")} (${source.aiQuestions}/${source.aiQuestions + source.engineQuestions})` : t("ai.engine")}
            </p>
          )}

          {paper.sections.map((section) => (
            <section key={section.name} style={{ marginTop: 24 }}>
              <p className="eyebrow">{section.name} · {section.marksEach} {t("pp.marks")}</p>
              {section.questions.map((q) => {
                const chosen = answers[q.id];
                return (
                  <div key={q.id} style={{ marginTop: 18 }}>
                    <p className="small muted">
                      {t("pp.q")} {q.id.replace("q", "")} · {q.marks} {t("pp.marks")} · {ctitle(lang, q.conceptId)}
                    </p>
                    <p style={{ fontSize: 17, lineHeight: 1.5 }}>{q.view.prompt}</p>
                    <div style={{ display: "grid", gap: 8 }}>
                      {q.view.choices.map((c, ci) => (
                        <label
                          key={ci}
                          className={chosen === ci ? "on" : ""}
                          style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", border: "1px solid var(--rule, #e5e7eb)", borderRadius: 10, cursor: "pointer" }}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={chosen === ci}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: ci }))}
                          />
                          <span>{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}

          <div style={{ display: "flex", gap: 10, marginTop: 24, alignItems: "center" }}>
            <button className="btn" onClick={submit} disabled={busy}>
              {busy ? t("onb.settingUp") : t("pp.submit")}
            </button>
            <span className="small muted">
              {answeredCount < paper.questionCount ? t("pp.allAnswered") : ""}
            </span>
          </div>
        </>
      )}

      {/* ── Result ───────────────────────────────────────────────────────── */}
      {paper && result && (
        <>
          <div className="exercise" style={{ marginTop: 20 }}>
            <h2 style={{ marginTop: 0 }}>{t("pp.result")}</h2>
            <p style={{ fontSize: 28, margin: "6px 0" }}>
              {result.raw}/{result.total} · {Math.round(result.pct * 100)}%
            </p>
            <p>
              {t("pp.grade")}: <strong>{gradeLabel(result.grade)}</strong>{" "}
              <span className="small muted">({t("pp.estimate")})</span>
            </p>
            <p className="small muted">{t("pp.recorded")}</p>

            <h3>{t("pp.boundary")}</h3>
            <div className="small muted">
              {paper.boundaries.map((b) => `${gradeLabel(b.grade)}: ${Math.round(b.pct * 100)}%`).join(" · ")}
            </div>
          </div>

          {/* What the paper actually measured, and what to do next. */}
          {analysis && <PaperAnalysisPanel analysis={analysis} />}

          <h3 style={{ marginTop: 24 }}>{t("pp.mark")}</h3>
          {result.perQuestion.map((q) => (
            <div key={q.id} style={{ marginTop: 14, padding: "12px 14px", border: "1px solid var(--rule, #e5e7eb)", borderRadius: 12 }}>
              <p className="small muted" style={{ margin: 0 }}>
                {t("pp.q")} {q.id.replace("q", "")} · {q.awarded}/{q.marks} · {ctitle(lang, q.conceptId)}
              </p>
              <p style={{ margin: "6px 0" }}>
                {q.correct === true ? "✓" : q.correct === null ? "—" : "✗"}
              </p>
              <p className="small" style={{ margin: "6px 0 0" }}>{q.explanation}</p>
            </div>
          ))}

          {conceptsTested.length > 0 && (
            <>
              <h3 style={{ marginTop: 24 }}>{t("pp.tested")}</h3>
              <p className="small muted">{conceptsTested.map((c) => ctitle(lang, c.id)).join(" · ")}</p>
            </>
          )}

          <button className="btn" style={{ marginTop: 20 }} onClick={() => { setPaper(null); setResult(null); setSource(null); setAnalysis(null); }}>
            {t("pp.another")}
          </button>
        </>
      )}
    </main>
  );
}
