"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MasteryBar, useI18n, useProfile, loadLocalProfileId, loadLocalProfileSecret, withCapability } from "@/lib/client";
import { getConcept } from "@/lib/genome";
import { ctitle } from "@/lib/content-i18n";
import { dueLabel, fill } from "@/lib/i18n";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { buildWeeklyPlan } from "@/lib/teacher-plan";
import { SUBJECT_IDS, SUBJECT_LABELS } from "@/lib/subjects";
import HubStatus from "@/components/hub-status";
import type { AssignmentMonitor, ClassRoster, SubjectId } from "@/lib/types";

/** What the assignment door says a class the caller owns may be set work on.
 *  Computed SERVER-SIDE from the class's declared curriculum, so the picker
 *  cannot offer a concept the door would refuse. */
interface OwnedClass {
  id: string;
  name: string;
  subject: SubjectId | null;
  specificationId: string | null;
  assignable: string[];
}

export default function TeacherPage() {
  const { t, lang } = useI18n();
  const { state } = useProfile();

  const [classes, setClasses] = useState<ClassRoster[]>([]);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<SubjectId | "">("");
  const [joinCode, setJoinCode] = useState("");
  const [notice, setNotice] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  // Assignments: what each owned class may be set (server-computed), and the
  // monitor rows — every number in them a projection of a member's own ledger.
  const [owned, setOwned] = useState<OwnedClass[]>([]);
  const [monitor, setMonitor] = useState<AssignmentMonitor[]>([]);

  // Every class read and write presents the CALLER's capability: a class
  // carries its learners' handles, their mastery and its join code, so the
  // class door answers authenticated profiles only (it used to answer anyone).
  const capability = useCallback(() => ({
    id: state?.profile.id ?? loadLocalProfileId() ?? "",
    secret: loadLocalProfileSecret() ?? "",
  }), [state]);

  const refresh = useCallback(async () => {
    const { id, secret } = capability();
    if (!id || !secret) return;
    const res = await fetch(withCapability(`/api/classes?me=${encodeURIComponent(id)}`));
    if (!res.ok) return;
    const j = (await res.json()) as { classes: ClassRoster[] };
    setClasses(j.classes ?? []);
  }, [capability]);

  const refreshWork = useCallback(async () => {
    const { id, secret } = capability();
    if (!id || !secret) return;
    const res = await fetch(withCapability(`/api/assignments?me=${encodeURIComponent(id)}`));
    if (!res.ok) return;
    const j = (await res.json()) as { monitor?: AssignmentMonitor[]; classes?: OwnedClass[] };
    setMonitor(j.monitor ?? []);
    setOwned(j.classes ?? []);
  }, [capability]);

  // Keyed on the profile, not on mount: the capability does not exist until
  // the learner profile has landed, and a class list fetched before that would
  // be empty for the wrong reason.
  useEffect(() => { void refresh(); void refreshWork(); }, [refresh, refreshWork]);

  async function create() {
    if (!name.trim() || !subject) return;
    setErr("");
    const res = await fetch("/api/classes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      // The class declares the curriculum it is taught. Assigned work is drawn
      // from that declaration, never from a default subject.
      body: JSON.stringify({ ...capability(), action: "create", name: name.trim(), subject, handle: state?.profile.handle ?? "teacher" }),
    });
    const j = await res.json();
    if (!res.ok) { setErr(j.error ?? `HTTP ${res.status}`); return; }
    setName("");
    setSubject("");
    setNotice(`${t("teach.invite")}: ${j.cls.joinCode}`);
    void refresh();
    void refreshWork();
  }

  /** SET WORK: a real state transition on the class, drawn only from the
   *  curriculum the class declared. The concept list comes from the server's
   *  own candidate list, so the picker cannot offer what the door refuses. */
  async function setWork(clsId: string, body: { conceptIds: string[]; dueAt: number; title: string; subject?: SubjectId }) {
    const res = await fetch("/api/assignments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...capability(), action: "create", clsId, ...body }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
    await refreshWork();
  }

  async function removeWork(clsId: string, assignmentId: string) {
    const res = await fetch("/api/assignments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...capability(), action: "remove", clsId, assignmentId }),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); setErr(j.error ?? `HTTP ${res.status}`); return; }
    await refreshWork();
  }

  async function join() {
    setErr("");
    setNotice("");
    const res = await fetch("/api/classes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...capability(), action: "join", joinCode, handle: state?.profile.handle }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? (joinCode ? `${joinCode} — ${t("common.error").toLowerCase()}` : t("common.error")));
      return;
    }
    // report current mastery snapshot for the roster
    if (state) {
      const mastery: Record<string, number> = {};
      for (const [cid, p] of Object.entries(state.progress)) mastery[cid] = p.mastery;
      await fetch("/api/classes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...capability(), action: "report", joinCode, handle: state.profile.handle, conceptMastery: mastery }),
      });
    }
    setNotice(`${joinCode.toUpperCase()} ✓`);
    void refresh();
  }

  return (
    <main className="container" style={{ paddingTop: 36 }}>
      <p className="eyebrow"><span className="no">§</span> {t("teach.title")}</p>
      <h1 className="visually-small">{t("teach.title")}</h1>
      <p className="lead">{t("teach.sub")}</p>

      <div style={{ marginTop: 16 }}>
        <HubStatus />
        <p className="small muted"><Link href="/hub">{t("teach.hubView")} →</Link></p>
      </div>

      {notice && <div className="alert" style={{ marginTop: 16 }}>{t("teach.invite")}: <b className="mono">{notice.split(": ").pop()}</b></div>}
      {err && <div className="feedback no" style={{ marginTop: 16 }}><span className="verdict">✗</span>{err}</div>}

      <div className="grid cols2" style={{ marginTop: 22, marginBottom: 22 }}>
        <div className="card">
          <p className="eyebrow"><span className="no">＋</span> {t("teach.createClass")}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input type="text" placeholder={t("teach.name")} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} />
            {/* The subject is a real choice, not a default: work is assigned
                from the curriculum the class declares, so the declaration is
                made where the class is made. */}
            <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectId | "")} aria-label={t("teach.pickSubject")}>
              <option value="">{t("teach.pickSubject")}</option>
              {SUBJECT_IDS.map((s) => <option key={s} value={s}>{t(SUBJECT_LABELS[s])}</option>)}
            </select>
            <button className="btn" onClick={create} disabled={!name.trim() || !subject}>{t("teach.createClass")}</button>
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            {t("teach.createHint")}
          </p>
        </div>
        <div className="card">
          <p className="eyebrow"><span className="no">→</span> {t("teach.roster")}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <input type="text" placeholder="ABC123" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} className="mono" />
            <button className="btn ghost" onClick={join}>{t("rooms.join")}</button>
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            {t("teach.joinHint")}
          </p>
        </div>
      </div>

      {classes.map((cls) => {
        // The LIVE view is the ledger talking: each member's independent-work
        // rates, derived server-side from their own evidence. The stored
        // `students` map is only a last self-report and is deliberately not
        // what the table reads.
        const live = cls.live ?? {};
        const measured = Object.entries(live).filter(([, m]) => Object.keys(m.concepts).length > 0);
        const students = Object.keys(cls.students);
        const avg = measured.length
          ? measured.reduce((s, [, m]) => {
              const vals = Object.values(m.concepts);
              return s + vals.reduce((x, c) => x + c.rate, 0) / vals.length;
            }, 0) / measured.length
          : null;
        // Class-wide misconception intelligence: aggregate what the LEDGER
        // recorded, show what % of the measured class carries each.
        const agg = new Map<string, { hits: number; carriers: number }>();
        for (const m of Object.values(live)) {
          for (const [mid, hits] of Object.entries(m.misconceptions)) {
            const a = agg.get(mid) ?? { hits: 0, carriers: 0 };
            a.hits += hits;
            a.carriers += 1;
            agg.set(mid, a);
          }
        }
        const top = [...agg.entries()].sort((x, y) => y[1].carriers - x[1].carriers || y[1].hits - x[1].hits).slice(0, 5);
        return (
          <div key={cls.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "baseline" }}>
              <h2 className="section" style={{ margin: 0 }}>{cls.name}</h2>
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <span className="chip red">{t("teach.invite")}: <span className="mono">{cls.joinCode}</span></span>
                <button
                  className="btn ghost small"
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(cls.joinCode); setCopied(cls.id); setTimeout(() => setCopied(null), 1500); } catch { /* clipboard unavailable — the code is readable beside it */ }
                  }}
                >{copied === cls.id ? t("teach.copied") : t("teach.copy")}</button>
              </span>
            </div>
            <p className="muted small">
              {students.length} {t("teach.students")}
              {avg !== null && <> · {t("teach.avg")}: <span className="mono">{Math.round(avg * 100)}%</span></>}
              {measured.length > 0 && measured.length < students.length && <> · {measured.length}/{students.length} {t("teach.measured")}</>}
            </p>
            <p className="small muted" style={{ margin: "2px 0 10px" }}>· {t("teach.prov")}</p>
            {measured.length === 0 && students.length > 0 && (
              <p className="note" style={{ marginBottom: 10 }}>{t("teach.noEvidence")}</p>
            )}
            {students.length === 0 ? (
              <p className="muted small">{t("teach.empty")}</p>
            ) : (
              <>
              {top.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p className="eyebrow"><span className="no">!</span> {t("teach.misconceptions")}</p>
                  {top.map(([mid, { hits, carriers }]) => {
                    const m = MISCONCEPTIONS_BY_ID[mid];
                    const pct = Math.round((carriers * 100) / measured.length);
                    return (
                      <div key={mid} className="note">
                        <strong>
                          {m?.name ?? mid}{" "}
                          <span className="chip warn" style={{ marginLeft: 6 }}>{pct}%</span>
                          <span className="chip" style={{ marginLeft: 4 }}>×{hits}</span>
                        </strong>
                        {m && <span className="small">{m.coaching.split(".")[0]}.</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              <table className="tbl">
                <thead>
                  <tr><th>{t("onb.handle")}</th><th>{t("dash.mastery")}</th><th>{t("teach.concepts")}</th><th>{t("teach.evidenceCol")}</th></tr>
                </thead>
                <tbody>
                  {students.map((h) => {
                    const m = live[h];
                    const vals = Object.entries(m?.concepts ?? {}).sort((a, b) => a[1].rate - b[1].rate);
                    const weakest = vals[0];
                    const mean = vals.length ? vals.reduce((s, [, c]) => s + c.rate, 0) / vals.length : null;
                    return (
                      <tr key={h}>
                        <td style={{ fontWeight: 700 }}>{h}</td>
                        <td style={{ minWidth: 160 }}>
                          {mean !== null ? <MasteryBar value={mean} /> : <span className="small muted">{t("teach.unmeasured")}</span>}
                        </td>
                        <td className="small">
                          {weakest
                            ? <>{t("teach.focus")}: <Link href={`/learn/maths/${weakest[0]}`}>{ctitle(lang, weakest[0])}</Link> (<span className="mono">{Math.round(weakest[1].rate * 100)}%</span> · {weakest[1].correct}/{weakest[1].asked})</>
                            : "—"}
                        </td>
                        <td className="small mono">{m ? m.answers : 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </>
            )}
            <WeeklyPlanPanel cls={cls} />
            <WorkPanel
              cls={cls}
              owned={owned.find((o) => o.id === cls.id)}
              monitors={monitor.filter((m) => m.assignment.clsId === cls.id)}
              onSet={(body) => setWork(cls.id, body)}
              onRemove={(assignmentId) => removeWork(cls.id, assignmentId)}
            />
          </div>
        );
      })}
      <div style={{ height: 36 }} />
    </main>
  );
}

/**
 * SET WORK, AND READ WHAT IT PRODUCED.
 *
 * Two halves of one loop, and neither stores a progress number. Setting work
 * is a real state transition on the class: the concepts are drawn from the
 * server's own candidate list for the class's declared curriculum, and a
 * deadline is required. The monitor below is derived from each member's ledger
 * over the window the assignment opened — completion, accuracy, weaknesses and
 * misconceptions are projections of recorded answers, so the table cannot
 * drift from what the class actually did.
 *
 * A class that has declared no subject is asked for one here (which DECLARES
 * it on the class) rather than being handed a default curriculum.
 */
function WorkPanel({
  cls,
  owned,
  monitors,
  onSet,
  onRemove,
}: {
  cls: ClassRoster;
  owned?: OwnedClass;
  monitors: AssignmentMonitor[];
  onSet: (body: { conceptIds: string[]; dueAt: number; title: string; subject?: SubjectId }) => Promise<void>;
  onRemove: (assignmentId: string) => Promise<void>;
}) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [due, setDue] = useState("");
  const [label, setLabel] = useState("");
  const [declare, setDeclare] = useState<SubjectId | "">("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const declared = owned?.subject ?? null;
  const assignable = owned?.assignable ?? [];
  const hasCurriculum = Boolean(declared || declare);

  async function submit() {
    setErr("");
    const dueAt = due ? new Date(`${due}T23:59:59`).getTime() : NaN;
    if (!Number.isFinite(dueAt) || picked.length === 0) return;
    setBusy(true);
    try {
      await onSet({
        conceptIds: picked,
        dueAt,
        title: label.trim(),
        ...(declared ? {} : { subject: declare as SubjectId }),
      });
      setOpen(false);
      setPicked([]);
      setDue("");
      setLabel("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <p className="eyebrow" style={{ margin: 0 }}><span className="no">✎</span> {t("teach.monitor")}</p>
        <button className="btn ghost small" onClick={() => setOpen((v) => !v)}>{t("teach.setWork")}</button>
      </div>
      <p className="muted small" style={{ margin: "2px 0 0" }}>{t("teach.setWorkHint")}</p>

      {open && (
        <div style={{ marginTop: 10 }}>
          {!declared && (
            <>
              <p className="small muted" style={{ marginBottom: 6 }}>{t("teach.needSubject")}</p>
              <select value={declare} onChange={(e) => setDeclare(e.target.value as SubjectId | "")} aria-label={t("teach.pickSubject")} style={{ marginBottom: 8 }}>
                <option value="">{t("teach.pickSubject")}</option>
                {SUBJECT_IDS.map((s) => <option key={s} value={s}>{t(SUBJECT_LABELS[s])}</option>)}
              </select>
            </>
          )}
          {hasCurriculum && (
            <>
              <p className="small" style={{ margin: "6px 0 4px", fontWeight: 600 }}>{t("teach.pickIdeas")}</p>
              <div style={{ maxHeight: 200, overflow: "auto", marginBottom: 8 }}>
                {assignable.length === 0 ? (
                  <p className="small muted">{t("teach.noIdeas")}</p>
                ) : (
                  assignable.map((id) => (
                    <label key={id} className="small" style={{ display: "block" }}>
                      <input
                        type="checkbox"
                        checked={picked.includes(id)}
                        disabled={!picked.includes(id) && picked.length >= 12}
                        onChange={(e) => setPicked((p) => (e.target.checked ? [...p, id] : p.filter((x) => x !== id)))}
                      />{" "}
                      {ctitle(lang, id)}
                    </label>
                  ))
                )}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <label className="small">{t("teach.pickDue")} <input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></label>
                <input type="text" placeholder={t("teach.pickLabel")} value={label} onChange={(e) => setLabel(e.target.value)} />
                <button className="btn small" disabled={busy || picked.length === 0 || !due} onClick={() => void submit()}>
                  {t("teach.setSubmit")}
                </button>
              </div>
            </>
          )}
          {err && <p className="small" style={{ color: "var(--margin-red)" }}>{err}</p>}
        </div>
      )}

      {monitors.length === 0 ? (
        <p className="muted small">{t("teach.noAssignments")}</p>
      ) : (
        monitors.map((m) => (
          <div key={m.assignment.id} style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
              <strong>{m.assignment.title || ctitle(lang, m.assignment.conceptIds[0])}</strong>
              <span className="small muted">
                {fill(t("teach.dueOn"), { date: dueLabel(lang, m.assignment.dueAt) })}{" "}
                <button className="btn ghost small" onClick={() => void onRemove(m.assignment.id)}>{t("teach.remove")}</button>
              </span>
            </div>
            <p className="small muted" style={{ margin: "2px 0 6px" }}>
              {m.assignment.conceptIds.map((id) => ctitle(lang, id)).join(" · ")}
            </p>
            <table className="tbl">
              <thead>
                <tr><th>{t("onb.handle")}</th><th>{t("teach.progress")}</th><th>{t("teach.accuracy")}</th><th>{t("teach.needsAttention")}</th></tr>
              </thead>
              <tbody>
                {m.members.map((r) => {
                  const total = m.assignment.conceptIds.length;
                  const done = total - r.outstanding.length;
                  const rates = Object.values(r.concepts);
                  const mean = rates.length ? rates.reduce((s, c) => s + c.rate, 0) / rates.length : null;
                  const reasons = m.interventions.filter((i) => i.handle === r.handle);
                  return (
                    <tr key={r.handle}>
                      <td style={{ fontWeight: 700 }}>{r.handle}</td>
                      <td className="small">
                        {r.complete ? `✓ ${t("asg.done")}` : fill(t("teach.doneOf"), { done, total })}
                      </td>
                      <td className="small mono">
                        {mean === null ? t("teach.unmeasured") : `${Math.round(mean * 100)}%`}
                      </td>
                      <td className="small">
                        {reasons.length === 0 ? "—" : reasons.slice(0, 3).map((i, k) => (
                          <span key={`${i.conceptId}-${i.reason}-${k}`} style={{ marginRight: 8 }}>
                            {i.reason === "not_started"
                              ? `${t("teach.notStarted")}: ${ctitle(lang, i.conceptId)}`
                              : i.reason === "weak"
                                ? `${t("teach.reasonWeak")}: ${ctitle(lang, i.conceptId)}${i.rate !== null ? ` (${Math.round(i.rate * 100)}%)` : ""}`
                                : `${t("teach.reasonMisconception")}: ${MISCONCEPTIONS_BY_ID[i.misconceptionId ?? ""]?.name ?? i.misconceptionId}`}
                          </span>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

/** The week, derived on the spot from the same engine the offline pack uses —
 *  printed plan and screen plan can never disagree. */
function WeeklyPlanPanel({ cls }: { cls: ClassRoster }) {
  const { t, lang } = useI18n();
  const plan = buildWeeklyPlan(cls);
  const dayName = (d: number) => t(`pack.day${d}`);

  return (
    <div style={{ marginTop: 16 }}>
      <p className="eyebrow"><span className="no">§</span> {t("plan.title")}</p>
      {plan.days.map((d) => (
        <div key={d.day} className="note">
          <strong>{dayName(d.day)}</strong> — {t(`pack.${d.kind}`)}: {ctitle(lang, d.conceptId)} <span className="chip" style={{ marginLeft: 6 }}>{d.minutes}′</span>
        </div>
      ))}
      {plan.fromCurriculum && <p className="muted small">{t("pack.noData")}</p>}

      {plan.groups.length > 1 && (
        <>
          <p className="eyebrow" style={{ marginTop: 10 }}><span className="no">⇄</span> {t("plan.groups")}</p>
          {plan.groups.map((g) => (
            <p key={g.name} className="small" style={{ margin: "4px 0" }}>
              <b>{t("plan.group")} {g.name}</b> ({g.members.length}): {g.members.join(", ")} → {ctitle(lang, g.conceptId)}
            </p>
          ))}
        </>
      )}
      {plan.scaffolds.length > 0 && (
        <>
          <p className="eyebrow" style={{ marginTop: 10 }}><span className="no">↓</span> {t("plan.scaffold")}</p>
          {plan.scaffolds.slice(0, 8).map((s, i) => (
            <p key={i} className="small" style={{ margin: "4px 0" }}>
              <b>{s.who}</b> → {ctitle(lang, s.conceptId)}
            </p>
          ))}
        </>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <a className="btn ghost small" href={`/api/pack-export?id=${cls.id}&format=html`} target="_blank" rel="noreferrer">
          🖨 {t("plan.print")}
        </a>
        <a className="btn ghost small" href={`/api/pack-export?id=${cls.id}&format=json`} target="_blank" rel="noreferrer">
          ⤓ {t("plan.export")}
        </a>
      </div>
      <p className="muted small" style={{ marginBottom: 0 }}>
        {t("pack.offlineNote")}
      </p>
    </div>
  );
}
