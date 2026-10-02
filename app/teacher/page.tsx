"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MasteryBar, useI18n, useProfile, loadLocalProfileId, loadLocalProfileSecret, withCapability } from "@/lib/client";
import { getConcept } from "@/lib/genome";
import { ctitle } from "@/lib/content-i18n";
import { dueLabel, fill } from "@/lib/i18n";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { buildWeeklyPlan, classSubject } from "@/lib/teacher-plan";
import { SUBJECT_IDS, SUBJECT_LABELS } from "@/lib/subjects";
import { specOptionsFor } from "@/lib/specifications";
import HubStatus from "@/components/hub-status";
import { ErrorState, Loading } from "@/components/states";
import type { AssignmentMonitor, ClassRoster, SubjectId } from "@/lib/types";
// The same four words the learner reads under their own mark: a teacher's
// "Independent" and a learner's "Independent" are one claim about one rule.
import { proofLabelKey } from "@/lib/proof";

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
  // `loading` is the profile still being read, which is not the same thing as a
  // teacher with no classes — and the difference is the whole of §24. Without
  // it, every load began by rendering an empty class list and "No work set
  // yet." to a teacher who has both: the mirror image of the failed read that
  // used to render as success. The hook already exposes the state; this page
  // just never asked for it.
  const { state, loading } = useProfile();

  const [classes, setClasses] = useState<ClassRoster[]>([]);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<SubjectId | "">("");
  // The qualification/board the new class sits, beside the subject it declares.
  // Optional: "whole subject" is the ordinary case for a class that is not
  // teaching towards one paper.
  const [course, setCourse] = useState<string>("");
  const [joinCode, setJoinCode] = useState("");
  const [notice, setNotice] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  // Assignments: what each owned class may be set (server-computed), and the
  // monitor rows — every number in them a projection of a member's own ledger.
  const [owned, setOwned] = useState<OwnedClass[]>([]);
  const [monitor, setMonitor] = useState<AssignmentMonitor[]>([]);
  // §24. A READ THAT FAILED IS NOT AN EMPTY CLASS.
  //
  // Both reads below used to `return` on a bad response, so a teacher whose
  // session had expired, or whose server answered 500, saw an empty roster and
  // "No work set yet." — a failed request dressed as good news, on the screen
  // whose whole job is to say who needs help. The failure has a state now, and
  // the retry is the product's own error state (components/states.tsx) rather
  // than a second one built here. The two doors report separately so a class
  // list that loaded is not thrown away because the monitor did not.
  const [readErr, setReadErr] = useState({ classes: "", work: "" });

  // Every class read and write presents the CALLER's capability: a class
  // carries its learners' handles, their mastery and its join code, so the
  // class door answers authenticated profiles only (it used to answer anyone).
  const capability = useCallback(() => ({
    id: state?.profile.id ?? loadLocalProfileId() ?? "",
    secret: loadLocalProfileSecret() ?? "",
  }), [state]);

  const refresh = useCallback(async () => {
    const { id, secret } = capability();
    // No capability yet is LOADING, not failure: the profile has not landed.
    if (!id || !secret) return;
    const res = await fetch(withCapability(`/api/classes?me=${encodeURIComponent(id)}`));
    if (!res.ok) {
      setReadErr((e) => ({ ...e, classes: `HTTP ${res.status}` }));
      return;
    }
    const j = (await res.json()) as { classes: ClassRoster[] };
    setReadErr((e) => ({ ...e, classes: "" }));
    setClasses(j.classes ?? []);
  }, [capability]);

  const refreshWork = useCallback(async () => {
    const { id, secret } = capability();
    if (!id || !secret) return;
    const res = await fetch(withCapability(`/api/assignments?me=${encodeURIComponent(id)}`));
    if (!res.ok) {
      setReadErr((e) => ({ ...e, work: `HTTP ${res.status}` }));
      return;
    }
    const j = (await res.json()) as { monitor?: AssignmentMonitor[]; classes?: OwnedClass[] };
    setReadErr((e) => ({ ...e, work: "" }));
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
      body: JSON.stringify({ ...capability(), action: "create", name: name.trim(), subject, specificationId: course || null, handle: state?.profile.handle ?? "teacher" }),
    });
    const j = await res.json();
    if (!res.ok) { setErr(courseErrText(j.error, res.status)); return; }
    setName("");
    setSubject("");
    setCourse("");
    setNotice(`${t("teach.invite")}: ${j.cls.joinCode}`);
    void refresh();
    void refreshWork();
  }

  /** Which refusal the server gave, in the reader's language, with the code.
   *  `course_without_subject` and an unknown id are different mistakes and are
   *  told apart; the subject one is the ordinary typo. */
  function courseErrText(code: unknown, status: number): string {
    const known = typeof code === "string" && code !== "" && !code.startsWith("HTTP");
    return `${t("teach.errCourse")}${known ? ` (${code})` : ` (HTTP ${status})`}`;
  }

  /** THE CLASS'S COURSE, SET WHERE THE CLASS IS. The assignment door has always
   *  accepted a class-level qualification and no screen sent one, so two classes
   *  of the same subject at different qualifications were the same class twice.
   *  This is the one write: only the class's own teacher may make it, and the
   *  server refuses by name a qualification the subject is not part of. */
  async function declareCourse(clsId: string, specificationId: string | null) {
    setErr("");
    const res = await fetch("/api/classes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...capability(), action: "update", clsId, specificationId }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(courseErrText(j.error, res.status)); return; }
    await refresh();
    // What the class may be set changed with its curriculum, so the picker is
    // re-read from the server rather than patched in place.
    await refreshWork();
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
      <p className="eyebrow">{t("teach.title")}</p>
      <h1 className="visually-small">{t("teach.title")}</h1>
      <p className="lead">{t("teach.sub")}</p>

      <div style={{ marginTop: 16 }}>
        <HubStatus />
        <p className="small muted"><Link href="/hub">{t("teach.hubView")} →</Link></p>
      </div>

      {notice && <div className="alert" style={{ marginTop: 16 }}>{t("teach.invite")}: <b className="mono">{notice.split(": ").pop()}</b></div>}
      {err && <div className="feedback no" style={{ marginTop: 16 }}><span className="verdict">✗</span>{err}</div>}
      {(readErr.classes || readErr.work) && (
        <div style={{ marginTop: 16 }}>
          <ErrorState
            body={`${t("teach.readFailed")} (${readErr.classes || readErr.work})`}
            onRetry={() => { void refresh(); void refreshWork(); }}
          />
        </div>
      )}

      <div className="grid cols2" style={{ marginTop: 22, marginBottom: 22 }}>
        <div className="card">
          <p className="eyebrow"><span className="no">＋</span> {t("teach.createClass")}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input type="text" placeholder={t("teach.name")} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} />
            {/* The subject is a real choice, not a default: work is assigned
                from the curriculum the class declares, so the declaration is
                made where the class is made. */}
            <select value={subject} onChange={(e) => { setSubject(e.target.value as SubjectId | ""); setCourse(""); }} aria-label={t("teach.pickSubject")}>
              <option value="">{t("teach.pickSubject")}</option>
              {SUBJECT_IDS.map((s) => <option key={s} value={s}>{t(SUBJECT_LABELS[s])}</option>)}
            </select>
            {/* The qualification sits BESIDE the subject, not instead of it: a
                class is one subject taught towards one paper, or towards none. */}
            <CoursePicker
              country={state?.profile.country ?? ""}
              subject={subject || null}
              value={course}
              onChange={setCourse}
              label={t("teach.pickCourse")}
            />
            <button className="btn" onClick={create} disabled={!name.trim() || !subject}>{t("teach.createClass")}</button>
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            {t("teach.createHint")}
          </p>
        </div>
        <div className="card">
          {/* The heading names the ACTION, not the result. It used to read
              "Class roster" over a code-entry box, which is what a teacher
              would take as "my class list" — and the list is the table below,
              where the label now sits. */}
          <p className="eyebrow"><span className="no">→</span> {t("acct.class")}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <input type="text" placeholder="ABC123" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} className="mono" />
            <button className="btn ghost" onClick={join}>{t("rooms.join")}</button>
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            {t("teach.joinHint")}
          </p>
        </div>
      </div>

      {/* MY CLASSES: the index first (§teacher home). A teacher with five
          classes needs to see all five and their size before reading any one of
          them in detail, so the list is a row of cards that jump to the class
          below — not a second copy of the dashboard. Rendered only when there
          is more than one class to choose between. */}
      {loading ? (
        <div style={{ marginBottom: "var(--s3)" }}>
          <Loading lines={3} />
        </div>
      ) : null}

      {!loading && classes.length > 1 && (
        <section style={{ marginBottom: "var(--s3)" }} aria-label={t("teach.title")}>
          <p className="eyebrow"><span className="no">≡</span> {t("teach.title")}</p>
          <div className="grid cols3">
            {classes.map((cls) => (
              <a key={cls.id} href={`#class-${cls.id}`} className="class-card">
                <b>{cls.name}</b>
                <span className="class-sub">{Object.keys(cls.students).length} {t(Object.keys(cls.students).length === 1 ? "teach.studentsOne" : "teach.students")}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {!loading && classes.map((cls) => {
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
          <div key={cls.id} id={`class-${cls.id}`} className="card" style={{ marginBottom: 16, scrollMarginTop: "var(--topbar-h)" }}>
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
              {/* One student is not "1 students": the singular has its own key
                  (15 languages — see scripts/i18n-teacher-one.mjs). */}
              {students.length} {t(students.length === 1 ? "teach.studentsOne" : "teach.students")}
              {avg !== null && <> · {t("teach.avg")}: <span className="mono">{Math.round(avg * 100)}%</span></>}
              {measured.length > 0 && measured.length < students.length && <> · {measured.length}/{students.length} {t("teach.measured")}</>}
            </p>
            {/* THE CLASS'S OWN CURRICULUM, AND THE SCHOOL IT BELONGS TO.
                Two classes of one subject at different qualifications differ
                here first — and what may be set for the class (the picker in
                the work panel) and what the week teaches are both drawn from
                this one declaration. The school comes from the teacher's own
                profile: it is one school, however many classes are held in it. */}
            <p className="small muted" style={{ margin: "2px 0 10px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {state?.profile.school ? <span>{state.profile.school} ·</span> : null}
              <span>{t("teach.course")}:</span>
              <CoursePicker
                country={state?.profile.country ?? ""}
                subject={classSubject(cls)}
                value={cls.specificationId ?? ""}
                onChange={(v) => void declareCourse(cls.id, v)}
                label={t("teach.pickCourse")}
              />
              <span>· {t("teach.prov")}</span>
            </p>
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
              {/* The class list is what "Class roster" means, and the heading
                  now labels it rather than the code box above. */}
              <p className="eyebrow">{t("teach.roster")}</p>
              <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>{t("onb.handle")}</th><th>{t("dash.mastery")}</th><th>{t("teach.focus")}</th><th>{t("teach.evidenceCol")}</th></tr>
                </thead>
                <tbody>
                  {students.map((h) => {
                    const m = live[h];
                    const vals = Object.entries(m?.concepts ?? {}).sort((a, b) => a[1].rate - b[1].rate);
                    const weakest = vals[0];
                    // The subject to link under: the concept's OWN, then the
                    // class's declared one, then no link at all. Never a
                    // default — that is the fallback literal this pass removed.
                    const focusSubject = weakest ? getConcept(weakest[0])?.subject ?? classSubject(cls) : null;
                    const mean = vals.length ? vals.reduce((s, [, c]) => s + c.rate, 0) / vals.length : null;
                    return (
                      <tr key={h}>
                        <td style={{ fontWeight: 700 }}>{h}</td>
                        <td style={{ minWidth: 160 }}>
                          {mean !== null ? <MasteryBar value={mean} /> : <span className="small muted">{t("teach.unmeasured")}</span>}
                        </td>
                        <td className="small">
                          {weakest
                            // The concept's OWN subject, not a subject this page
                            // assumes: a physics class's weakest concept used to
                            // link into the maths tree.
                            ? <>{focusSubject
                              ? <Link href={`/learn/${focusSubject}/${weakest[0]}`}>{ctitle(lang, weakest[0])}</Link>
                              : ctitle(lang, weakest[0])}{" "}(<span className="mono">{Math.round(weakest[1].rate * 100)}%</span> · {weakest[1].correct}/{weakest[1].asked})</>
                            : "—"}
                        </td>
                        {/* A handle with no ledger behind it has answered
                            nothing — and "nothing recorded" is not "0". */}
                        <td className="small mono">{m ? m.answers : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
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
 * THE CLASS'S COURSE — one control, in the two places a class's curriculum is
 * decided: where the class is created, and on the class itself afterwards.
 *
 * The options are the qualifications the teacher's own country offers FOR THIS
 * SUBJECT (lib/specifications#specOptionsFor — the same source the learner's
 * course picker reads), plus the empty choice, which means "the whole subject":
 * a class teaching no single paper is a real class, not an incomplete one. A
 * class with no subject has no course to sit, so the control renders nothing
 * until the subject is declared. */
function CoursePicker({
  country,
  subject,
  value,
  onChange,
  label,
}: {
  country: string;
  subject: SubjectId | null;
  value: string;
  onChange: (specificationId: string) => void;
  label: string;
}) {
  const { t } = useI18n();
  if (!subject) return null;
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{t("teach.wholeSubject")}</option>
      {specOptionsFor(country, subject).map((s) => (
        // The board travels with the name: "GCSE · aqa" is the qualification a
        // teacher recognises, and two boards in one country share a name.
        <option key={s.id} value={s.id}>{s.name}{s.board ? ` · ${s.board}` : ""}</option>
      ))}
    </select>
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
            {/* "Concepts assigned" belongs on the assigned work, which is
                here — it used to head the class table's focus column above. */}
            <p className="small muted" style={{ margin: "2px 0 6px" }}>
              {t("teach.concepts")}: {m.assignment.conceptIds.map((id) => ctitle(lang, id)).join(" · ")}
            </p>
            <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>{t("onb.handle")}</th><th>{t("teach.progress")}</th><th>{t("teach.accuracy")}</th><th>{t("teach.proved")}</th><th>{t("teach.needsAttention")}</th></tr>
              </thead>
              <tbody>
                {m.members.map((r) => {
                  const total = m.assignment.conceptIds.length;
                  const done = total - r.outstanding.length;
                  const rates = Object.values(r.concepts);
                  const mean = rates.length ? rates.reduce((s, c) => s + c.rate, 0) / rates.length : null;
                  const reasons = m.interventions.filter((i) => i.handle === r.handle);
                  // HOW the work was done, concept by concept: the strongest
                  // claim each measured concept's window earned. 80% with hints
                  // and 80% unaided are different outcomes, and until now the
                  // monitor could only show the number.
                  const provedRows = Object.entries(r.concepts)
                    .filter(([, c]) => c.proof !== null)
                    .map(([cid, c]) => `${ctitle(lang, cid)}: ${t(proofLabelKey(c.proof!))}`);
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
                        {provedRows.length === 0
                          ? "—"
                          : `${provedRows.slice(0, 2).join(" · ")}${provedRows.length > 2 ? ` +${provedRows.length - 2}` : ""}`}
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
  // A class that has declared no subject has no week to show. The words are the
  // ones the set-work picker below already uses for the same absence — and the
  // subject can be declared right there, so this is a step, not a dead end.
  if (!plan) return <p className="muted small" style={{ marginTop: 16 }}>{t("teach.needSubject")}</p>;

  return (
    <div style={{ marginTop: 16 }}>
      <p className="eyebrow">{t("plan.title")}</p>
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

      {/* BOTH LINKS PRESENT THE CALLER'S CAPABILITY. The pack carries the
          week's question bank WITH its answer key, so the door answers a member
          of the class and nobody else — and these links used to open it bare,
          which put `{"error":"missing id"}` in a new tab in front of a teacher
          who pressed Print. `me` names the member; the capability rides beside
          it, exactly as the roster fetch above does it. */}
      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <a className="btn ghost small" href={withCapability(`/api/pack-export?id=${encodeURIComponent(cls.id)}&me=${encodeURIComponent(loadLocalProfileId() ?? "")}&format=html`)} target="_blank" rel="noreferrer">
          🖨 {t("plan.print")}
        </a>
        <a className="btn ghost small" href={withCapability(`/api/pack-export?id=${encodeURIComponent(cls.id)}&me=${encodeURIComponent(loadLocalProfileId() ?? "")}&format=json`)} target="_blank" rel="noreferrer">
          ⤓ {t("plan.export")}
        </a>
      </div>
      <p className="muted small" style={{ marginBottom: 0 }}>
        {t("pack.offlineNote")}
      </p>
    </div>
  );
}
