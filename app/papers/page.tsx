"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ctitle, mcName } from "@/lib/content-i18n";
import { boardName } from "@/lib/curriculum";
import { loadLocalProfileId, loadLocalProfileSecret, useI18n } from "@/lib/client";
import * as api from "@/lib/api/client";
import { fill } from "@/lib/i18n";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import PaperAnalysisPanel, { type PaperAnalysisShape } from "@/components/paper-analysis";
import OwnPaper, { type OwnPaperConcept } from "@/components/own-paper";
import { coverageOf, specForProfile } from "@/lib/specifications";
import type { BoardId, ProfileState, SubjectId } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Exam papers. Pick the paper your board actually sets, sit it under its own
// time limit and mark rules, then read the mark scheme and your grade estimate.
//
// During a paper there are no statistics, no recommendations and no side
// panels — and, since this is an exam, not a worksheet, the paper is not one
// long scroll either. You see ONE question, you always know which question of
// how many you are on, what it is worth, and you can flag one to come back to
// and jump anywhere in the paper through the grid. Finish is always in reach.
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
  board: BoardId;
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
    /** The misconceptions this question probes, from the answer key. */
    tags: string[];
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
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [current, setCurrent] = useState(0);
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

  /** Who the paper is FOR. Papers are recorded as independent evidence, so the
   *  sitting has to be attributable to a real learner — but only the IDENTIFIER
   *  is named here: the capability is not the page's to build, and the operation
   *  attaches it (lib/api/transport.ts).
   *
   *  The language belongs in every paper request, including the list: a
   *  specification-built paper is NAMED in the learner's language, and the list
   *  is where that name is first read. */
  const authQuery = useCallback((): { id?: string; lang: string } => {
    const id = loadLocalProfileId();
    return { ...(id ? { id } : {}), lang };
  }, [lang]);

  useEffect(() => {
    api.paperList(authQuery())
      .then((d) => {
        setList(d.papers ?? []);
        setQualification(d.qualification ?? "");
        setLevel(d.level ?? "");
        if (d.ai) setAi(d.ai as AiStatusShape);
      })
      .catch(() => setErr(t("common.error")));

    const id = loadLocalProfileId();
    if (id) {
      // A device that predates capability secrets has an id but no token; this
      // read BINDS one to it. That is the only place a read still mints by
      // hand, and it is why it happens before the operation rather than inside
      // it — see the policy note on lib/api/transport.ts#LEARNER_DOORS.
      loadLocalProfileSecret();
      api.readProfile(id)
        .then((s) => setProfile(s as ProfileState))
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
      const data = await api.paperFor({
        ...authQuery(),
        templateId,
        subject,
        seed: `${Date.now().toString(36)}`,
        ...(withAi && ai.enabled ? { ai: 1 } : {}),
      });
      setPaper(data.paper);
      setSource({ source: data.source, aiQuestions: data.aiQuestions, engineQuestions: data.engineQuestions });
      setAnswers({});
      setFlagged({});
      setCurrent(0);
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
      // With an id, the marking is RECORDED as evidence; without one, the paper
      // is still marked and nothing is stored. The learner id is named here
      // because only the page knows whether there is a learner; the capability
      // travels with the operation.
      const id = loadLocalProfileId();
      const data = await api.markPaper({ paperId: paper.id, answers, lang, ...(id ? { id } : {}) });
      setResult(data.result);
      setAnalysis((data.analysis as PaperAnalysisShape | null) ?? null);
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

  /** The whole paper in sitting order. The sitting shows ONE question, but the
   *  counter, the grid and the flags all work over the flat list. */
  const flat = useMemo(
    () => (paper ? paper.sections.flatMap((s) => s.questions.map((q) => ({ ...q, section: s.name }))) : []),
    [paper],
  );

  const answeredCount = Object.keys(answers).length;
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  /** A grade band is a symbol (A*, 7, 500) or a word. Only "Pass" is a word. */
  const gradeLabel = (g: string | null) => (g === "Pass" ? t("pp.gradePass") : g ?? "—");
  /** The awarding body's own name plus the qualification and tier — the header
   *  a learner would read at the top of the real paper. */
  const examHead = (p: Paper) =>
    [boardName(p.board), p.qualification, p.level].filter(Boolean).join(" · ");

  const toggleFlag = (id: string) => setFlagged((f) => ({ ...f, [id]: !f[id] }));

  return (
    <main className="container narrow" style={{ paddingTop: 32, maxWidth: 800 }}>
      {/* The page's own chrome belongs to the picker, not to the exam: once a
          paper is under way there is nothing on screen but the paper. */}
      {!paper && (
        <>
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
        </>
      )}

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

      {/* ── The sitting — one question, as in an exam ─────────────────────── */}
      {paper && !result && flat.length > 0 && (() => {
        const idx = Math.min(current, flat.length - 1);
        const q = flat[idx];
        const num = idx + 1;
        const total = flat.length;
        const chosen = answers[q.id];
        const isFlagged = !!flagged[q.id];
        return (
          <>
            {/* Exam header: the board, qualification and tier, then the paper
                name, then where you are in it and the clock. Sticky, because
                during a paper the clock must never leave the screen. */}
            <header
              data-exam-head
              style={{
                position: "sticky", top: 0, zIndex: 3,
                background: "var(--surface, #fff)",
                borderBottom: "1px solid var(--rule, #e5e7eb)",
                padding: "12px 0 10px", marginBottom: 4,
              }}
            >
              <p className="eyebrow" style={{ margin: 0 }}>{examHead(paper)}</p>
              <div className="rowline" style={{ marginTop: 2 }}>
                <strong className="grow">{paper.name}</strong>
                <span className="small muted" style={{ fontVariantNumeric: "tabular-nums" }} data-question-of>
                  {fill(t("pp.questionOf"), { n: num, m: total })}
                </span>
                <span className="small" style={{ fontVariantNumeric: "tabular-nums" }}>⏱ {clock}</span>
              </div>
            </header>

            {source && (
              <p className="small muted" style={{ marginTop: 8 }}>
                {source.source === "ai" ? t("ai.written") : source.source === "mixed" ? `${t("ai.written")} (${source.aiQuestions}/${source.aiQuestions + source.engineQuestions})` : t("ai.engine")}
              </p>
            )}

            {/* The grid: every question in the paper, one press away — with the
                flagged ones marked, exactly as a candidate circles them. */}
            <nav aria-label={t("pp.grid")} data-question-grid style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {flat.map((qq, i) => {
                const done = typeof answers[qq.id] === "number";
                const fl = !!flagged[qq.id];
                const on = i === current;
                return (
                  <button
                    key={qq.id}
                    type="button"
                    aria-current={on ? "true" : undefined}
                    aria-label={`${t("pp.q")} ${i + 1}${fl ? ` · ${t("pp.flagged")}` : ""}`}
                    data-answered={done ? "1" : "0"}
                    data-flagged={fl ? "1" : "0"}
                    onClick={() => setCurrent(i)}
                    className={on ? "btn small" : "btn ghost small"}
                    style={{
                      minWidth: 34, padding: "4px 6px", fontVariantNumeric: "tabular-nums",
                      borderBottom: fl ? "3px solid var(--mark-caution)" : undefined,
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </nav>

            <section style={{ marginTop: 20 }}>
              <div className="rowline">
                <span className="small muted grow">
                  {t("pp.q")} {num} · {q.marks} {t("pp.marks")} · {ctitle(lang, q.conceptId)}
                </span>
                <button
                  type="button"
                  className="btn ghost small"
                  aria-pressed={isFlagged}
                  data-flag-control
                  onClick={() => toggleFlag(q.id)}
                >
                  {isFlagged ? `⚑ ${t("pp.flagged")}` : `⚐ ${t("pp.flag")}`}
                </button>
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.5, marginTop: 10 }}>{q.view.prompt}</p>
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
            </section>

            <div style={{ display: "flex", gap: 10, marginTop: 24, alignItems: "center", flexWrap: "wrap" }}>
              <button
                className="btn ghost"
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current <= 0}
              >
                {t("pp.prev")}
              </button>
              <button
                className="btn ghost"
                onClick={() => setCurrent((c) => Math.min(flat.length - 1, c + 1))}
                disabled={current >= flat.length - 1}
              >
                {t("pp.next")}
              </button>
              <button className="btn" onClick={submit} disabled={busy}>
                {busy ? t("onb.settingUp") : t("pp.submit")}
              </button>
              <span className="small muted" style={{ marginLeft: "auto" }}>
                {answeredCount}/{flat.length}
                {answeredCount < flat.length ? ` · ${t("pp.allAnswered")}` : ""}
              </span>
            </div>
          </>
        );
      })()}

      {/* ── Exam evidence ────────────────────────────────────────────────── */}
      {paper && result && (() => {
        const correct = result.perQuestion.filter((q) => q.correct === true).length;
        const wrong = result.perQuestion.filter((q) => q.correct === false).length;
        const blank = result.perQuestion.filter((q) => q.correct === null).length;
        return (
          <>
            <div className="exercise" style={{ marginTop: 20 }}>
              <p className="eyebrow" style={{ margin: 0 }}>{examHead(paper)}</p>
              <h2 style={{ marginTop: 4 }}>{t("pp.result")}</h2>
              <p style={{ fontSize: 28, margin: "6px 0" }}>
                {result.raw}/{result.total} · {Math.round(result.pct * 100)}%
              </p>
              <p>
                {t("pp.grade")}: <strong>{gradeLabel(result.grade)}</strong>{" "}
                <span className="small muted">({t("pp.estimate")})</span>
              </p>
              {/* What the paper itself says, before any score: how many you
                  answered correctly, how many you got wrong, how many you left. */}
              <div className="rowline" style={{ marginTop: 8, gap: 16, flexWrap: "wrap" }}>
                <span className="small">
                  <span className="mark good">✓</span> {correct} {t("pp.correct")}
                </span>
                <span className="small">
                  <span className="mark bad">✗</span> {wrong} {t("pp.incorrect")}
                </span>
                <span className="small muted">
                  <span className="mark">○</span> {blank} {t("pp.blank")}
                </span>
              </div>
              <p className="small muted" style={{ marginTop: 8 }}>{t("pp.recorded")}</p>

              <h3>{t("pp.boundary")}</h3>
              <div className="small muted">
                {paper.boundaries.map((b) => `${gradeLabel(b.grade)}: ${Math.round(b.pct * 100)}%`).join(" · ")}
              </div>
            </div>

            {/* What the paper actually measured, and what to do next. */}
            {analysis && <PaperAnalysisPanel analysis={analysis} />}

            <h3 style={{ marginTop: 24 }}>{t("pp.mark")}</h3>
            {result.perQuestion.map((q, i) => {
              const mark = q.correct === true ? "✓" : q.correct === null ? "○" : "✗";
              const markClass = q.correct === true ? "good" : q.correct === null ? "" : "bad";
              const label = q.correct === true ? t("pp.correct") : q.correct === null ? t("pp.blank") : t("pp.incorrect");
              // The idea to check is only claimed for a WRONG answer: a question
              // nobody answered says nothing about what the learner believes.
              const tag = q.correct === false ? (q.tags ?? []).find((x) => MISCONCEPTIONS_BY_ID[x]) : undefined;
              return (
                <div key={q.id} style={{ marginTop: 14, padding: "12px 14px", border: "1px solid var(--rule, #e5e7eb)", borderRadius: 12 }}>
                  <p className="small muted" style={{ margin: 0 }}>
                    {t("pp.q")} {i + 1} · {q.awarded}/{q.marks} · {ctitle(lang, q.conceptId)}
                  </p>
                  <p className="small" style={{ margin: "6px 0" }}>
                    <span className={`mark ${markClass}`} style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{mark}</span> {label}
                  </p>
                  {tag && (
                    <p className="small" style={{ margin: "4px 0 0" }}>
                      <b className="tag">{`△ ${t("pp.checkIdea")}: ${mcName(lang, tag, MISCONCEPTIONS_BY_ID[tag].name)}`}</b>
                    </p>
                  )}
                  <p className="small" style={{ margin: "6px 0 0" }}>{q.explanation}</p>
                </div>
              );
            })}

            {conceptsTested.length > 0 && (
              <>
                <h3 style={{ marginTop: 24 }}>{t("pp.tested")}</h3>
                <p className="small muted">{conceptsTested.map((c) => ctitle(lang, c.id)).join(" · ")}</p>
              </>
            )}

            <button className="btn" style={{ marginTop: 20 }} onClick={() => { setPaper(null); setResult(null); setSource(null); setAnalysis(null); setFlagged({}); setCurrent(0); }}>
              {t("pp.another")}
            </button>
          </>
        );
      })()}
    </main>
  );
}
