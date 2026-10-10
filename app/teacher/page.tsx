"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MasteryBar, useI18n, useProfile, loadLocalProfileId } from "@/lib/client";
import * as api from "@/lib/api/client";
import { ApiError, classPackUrl } from "@/lib/api/client";
import { getConcept } from "@/lib/genome";
import { ctitle } from "@/lib/content-i18n";
import { dueLabel, fill } from "@/lib/i18n";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { buildWeeklyPlan, classSubject } from "@/lib/teacher-plan";
import { SUBJECT_IDS, SUBJECT_LABELS } from "@/lib/subjects";
import { specOptionsFor } from "@/lib/specifications";
import HubStatus from "@/components/hub-status";
// The four dimensions and their meter, rendered by the SAME component the
// learner's own screens use (components/dims.tsx): a teacher reading "Strong"
// and a child reading "Strong" must be reading one claim about one rule, and
// the "not yet measured" dash is that component's own honesty guarantee.
import { Dims } from "@/components/dims";
import { ErrorState, Loading } from "@/components/states";
import NeedsPanel, { type NeedLaunch } from "@/components/needs-panel";
import { dimensionFor, type KnowledgeRow } from "@/lib/evidence-view";
import type { AssignmentIntervention, AssignmentMonitor, ClassMemberEvidence, ClassRoster, SubjectId } from "@/lib/types";
// The same four words the learner reads under their own mark: a teacher's
// "Independent" and a learner's "Independent" are one claim about one rule.
import { proofLabelKey, retentionLabelKey } from "@/lib/proof";

/** What the assignment door says a class the caller owns may be set work on.
 *  Computed SERVER-SIDE from the class's declared curriculum, so the picker
 *  cannot offer a concept the door would refuse. The shape is the DOOR's
 *  (lib/api/client.ts#AssignableClass); this names it locally only so the
 *  component below reads well. */
type OwnedClass = api.AssignableClass;

/** A failed read, in a form a teacher can see and a developer can act on: the
 *  server's own reason when it gave one, else the status. "We could not read
 *  this" must never render as "you have nothing". */
function failureText(e: unknown): string {
  return e instanceof ApiError ? e.code || `HTTP ${e.status}` : "HTTP ?";
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
  // WHICH STUDENT'S EVIDENCE IS OPEN, per class (learner id, or absent for
  // none). One at a time, deliberately: the drawer is an answer to "what can
  // this child demonstrate?", and two of them open at once is a dashboard
  // again — the thing this page was reorganised out of.
  const [openStudent, setOpenStudent] = useState<Record<string, string | null>>({});

  // A NEED HANDED TO THE BUILDER (§8). A finding the teacher chose to act on
  // opens the class's own work panel — the SAME four steps, pre-populated with
  // the finding's concept, learners and a title naming the rule. There is one
  // assignment-creation path and it stays one: the intervention changes what
  // the teacher STARTS with, never how the work is set.
  const [launch, setLaunch] = useState<Record<string, NeedLaunch | null>>({});
  // A REVIEW WAS SET WORK FROM (§8): the panel that showed the finding is told
  // to re-read, so its status line moves from "proposed" to "work set" without
  // a full page reload.
  const [needsTick, setNeedsTick] = useState<Record<string, number>>({});

  // Every class read and write is about the CALLER: a class carries its
  // learners' handles, their mastery and its join code, so the class door
  // answers authenticated profiles only. WHAT the caller is, this page still
  // has to say — but the capability itself is attached by the operation
  // (lib/api/transport.ts knows which doors carry it and how), so this is a
  // question about identity, not about tokens.
  const meId = useCallback(() => state?.profile.id ?? loadLocalProfileId() ?? "", [state]);

  const refresh = useCallback(async () => {
    const id = meId();
    // No capability yet is LOADING, not failure: the profile has not landed.
    if (!id) return;
    try {
      const j = await api.classes(id);
      setReadErr((e) => ({ ...e, classes: "" }));
      setClasses(j.classes ?? []);
    } catch (e) {
      setReadErr((prev) => ({ ...prev, classes: failureText(e) }));
    }
  }, [meId]);

  const refreshWork = useCallback(async () => {
    const id = meId();
    if (!id) return;
    try {
      const j = await api.assignments(id);
      setReadErr((e) => ({ ...e, work: "" }));
      setMonitor(j.monitor ?? []);
      setOwned(j.classes ?? []);
    } catch (e) {
      setReadErr((prev) => ({ ...prev, work: failureText(e) }));
    }
  }, [meId]);

  // Keyed on the profile, not on mount: the capability does not exist until
  // the learner profile has landed, and a class list fetched before that would
  // be empty for the wrong reason.
  useEffect(() => { void refresh(); void refreshWork(); }, [refresh, refreshWork]);

  async function create() {
    if (!name.trim() || !subject) return;
    setErr("");
    try {
      // The class declares the curriculum it is taught. Assigned work is drawn
      // from that declaration, never from a default subject.
      const j = await api.classAction({
        action: "create", id: meId(), name: name.trim(), subject,
        specificationId: course || null, handle: state?.profile.handle ?? "teacher",
      });
      setName("");
      setSubject("");
      setCourse("");
      setNotice(`${t("teach.invite")}: ${(j.cls as ClassRoster).joinCode}`);
    } catch (e) {
      setErr(e instanceof ApiError ? courseErrText(e.code, e.status) : t("common.error"));
      return;
    }
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
    try {
      await api.classAction({ action: "update", id: meId(), clsId, specificationId });
    } catch (e) {
      setErr(e instanceof ApiError ? courseErrText(e.code, e.status) : t("common.error"));
      return;
    }
    await refresh();
    // What the class may be set changed with its curriculum, so the picker is
    // re-read from the server rather than patched in place.
    await refreshWork();
  }

  /** SET WORK: a real state transition on the class, drawn only from the
   *  curriculum the class declared. The concept list comes from the server's
   *  own candidate list, so the picker cannot offer what the door refuses.
   *
   *  ONE CREATION PATH, TWO DOORS. Work born from a review goes through the
   *  needs door's `assign`: it creates the assignment by the same rules (the
   *  same curriculum check, the same target validation, the same record shape)
   *  AND stamps the record's baseline — the instant the outcome is later split
   *  at. Ordinary work, with no review behind it, still goes to the assignment
   *  door exactly as before. */
  async function setWork(clsId: string, body: { conceptIds: string[]; dueAt: number; title: string; subject?: SubjectId; targetHandles?: string[]; needId?: string }) {
    const { needId, ...plan } = body;
    try {
      if (needId) await api.needAction({ action: "assign", id: meId(), clsId, needId, ...plan });
      else await api.assignmentAction({ action: "create", id: meId(), clsId, ...plan });
    } catch (e) {
      throw new Error(failureText(e));
    }
    await refreshWork();
    // The review the work was set under now has a record with a baseline, so
    // the panel that showed the finding re-reads itself.
    if (needId) setNeedsTick((n) => ({ ...n, [clsId]: (n[clsId] ?? 0) + 1 }));
  }

  async function removeWork(clsId: string, assignmentId: string) {
    try {
      await api.assignmentAction({ action: "remove", id: meId(), clsId, assignmentId });
    } catch (e) {
      setErr(failureText(e));
      return;
    }
    await refreshWork();
  }

  async function join() {
    setErr("");
    setNotice("");
    try {
      await api.classAction({ action: "join", id: meId(), joinCode, handle: state?.profile.handle });
    } catch (e) {
      setErr(e instanceof ApiError && e.code
        ? e.code
        : (joinCode ? `${joinCode} — ${t("common.error").toLowerCase()}` : t("common.error")));
      return;
    }
    // report current mastery snapshot for the roster
    if (state) {
      const mastery: Record<string, number> = {};
      for (const [cid, p] of Object.entries(state.progress)) mastery[cid] = p.mastery;
      await api.classAction({
        action: "report", id: meId(), joinCode,
        handle: state.profile.handle, conceptMastery: mastery,
      }).catch(() => { /* the roster report is a bonus; joining already happened */ });
    }
    setNotice(`${joinCode.toUpperCase()} ✓`);
    void refresh();
  }

  // ── A TEACHER WITH NO PROFILE GETS A DOOR, NOT A PAGE OF DEAD CONTROLS ──
  //
  // The landing page's second door is "I'm a teacher" and it leads HERE — to a
  // page of class tools, every one of which needs a profile to do anything at
  // all. A teacher with no account pressed Create class and NOTHING happened:
  // no error, no form, no way to make the account the page assumes exists. The
  // only account creation in the product was the learner's, so the route to
  // being a teacher ran through a six-step enrolment that asks which tier YOU
  // sit, which subjects YOU study, and then books you a baseline diagnostic in
  // one of them — measuring the wrong person, in a subject they came here to
  // teach.
  //
  // Their setup is its own door and it says so: the account, who they are, and
  // the languages their school works in. The curriculum is declared per CLASS,
  // on the class itself (the panels below), which is the only place it can be
  // true — one teacher teaches Year 10 Maths and Year 12 Physics.
  if (!loading && !state) {
    return (
      <main className="container" style={{ paddingTop: 36 }}>
        <p className="eyebrow">{t("teach.title")}</p>
        <h1 className="visually-small">{t("teach.title")}</h1>
        <p className="lead">{t("teach.sub")}</p>
        <div className="exercise" style={{ marginTop: 20, maxWidth: 620 }}>
          <h2 className="section" style={{ marginTop: 0 }}>{t("teach.entryTitle")}</h2>
          <p style={{ margin: "6px 0 16px" }}>{t("teach.entryBody")}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" href="/onboarding?role=teacher&mode=signup">{t("teach.entryCreate")}</Link>
            <Link className="btn ghost" href="/onboarding?role=teacher&mode=signin">{t("onb.signIn")}</Link>
          </div>
          <p className="small muted" style={{ marginTop: 16, marginBottom: 0 }}>
            {t("teach.entryStudent")} <Link href="/onboarding">{t("home.start")}</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 36 }}>
      <p className="eyebrow">{t("teach.title")}</p>
      <h1 className="visually-small">{t("teach.title")}</h1>
      <p className="lead">{t("teach.sub")}</p>

      {/* ── TODAY, BEFORE THE TOOLS THAT ACT ON IT (§teacher home) ─────────

          The page opened on a control panel: create a class, join a class, then
          every class read in full. A teacher arriving with one question — what
          needs me? — had to read all of it to find out. This answers that
          question first and points at the panel that fixes it.

          RENDERED ONLY ON A GOOD READ. A failed read has its own state below
          (components/states.tsx, with Retry), and an action centre that said
          "nothing is waiting" because the class list did not load would be a
          failed request dressed as good news — on the one screen whose job is
          to say who needs help. When it cannot be read, it is absent and the
          error says why. */}
      {!loading && !readErr.classes && !readErr.work && (
        <TeacherHome classes={classes} monitors={monitor} />
      )}

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
        // The one student whose evidence is open in this class, found by ID —
        // never by handle, which a roster can hold two of.
        const openId = openStudent[cls.id] ?? null;
        const openEntry = openId ? Object.entries(live).find(([, m]) => m.learnerId === openId) : undefined;
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
                  <tr><th>{t("onb.handle")}</th><th>{t("dash.mastery")}</th><th>{t("teach.focus")}</th><th>{t("teach.evidenceCol")}</th><th /></tr>
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
                        {/* THE EVIDENCE BEHIND THE RATE, one student at a time.
                            Only offered for a row with a ledger behind it: a
                            handle nobody has bound has nothing to read, and a
                            button that opened an empty panel would suggest it
                            did. `aria-expanded` because this is a disclosure,
                            not a navigation. */}
                        <td style={{ textAlign: "end" }}>
                          {m ? (
                            <button
                              type="button"
                              className="btn ghost small"
                              aria-expanded={openId === m.learnerId}
                              onClick={() => setOpenStudent((s) => ({
                                ...s,
                                [cls.id]: s[cls.id] === m.learnerId ? null : m.learnerId,
                              }))}
                            >{t("tl.open")}</button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
              </>
            )}
            {/* The drawer opens UNDER the table it came from, so the teacher
                keeps the class in view while reading one student. It fetches
                its own detail — the roster row is a rate, and this is the
                evidence — and it is the ONLY place a member's answers are read
                by somebody other than themselves (`isTeacherOf` on the door). */}
            {openEntry && openId && (
              <StudentEvidence
                me={meId()}
                clsId={cls.id}
                handle={openEntry[0]}
                learnerId={openId}
                onClose={() => setOpenStudent((s) => ({ ...s, [cls.id]: null }))}
              />
            )}
            {/* LEARNING NEEDS (§8): the panel between the class's evidence and
                its work. Setting work on a finding still goes through the
                WorkPanel's own four steps below — the launch state only
                pre-populates them. */}
            <NeedsPanel
              me={meId()}
              clsId={cls.id}
              tick={needsTick[cls.id] ?? 0}
              onLaunch={(n) => {
                // One launch at a time per class; the panel itself opens below.
                setLaunch((l) => ({ ...l, [cls.id]: n }));
                setOpenStudent((s) => ({ ...s, [openStudentKey(cls.id)]: null }));
              }}
            />
            <WeeklyPlanPanel cls={cls} />
            <WorkPanel
              cls={cls}
              owned={owned.find((o) => o.id === cls.id)}
              monitors={monitor.filter((m) => m.assignment.clsId === cls.id)}
              onSet={(body) => setWork(cls.id, body)}
              onRemove={(assignmentId) => removeWork(cls.id, assignmentId)}
              launch={launch[cls.id] ?? null}
              onLaunchConsumed={() => setLaunch((l) => ({ ...l, [cls.id]: null }))}
            />
          </div>
        );
      })}
      <div style={{ height: 36 }} />
    </main>
  );
}

/**
 * TODAY — THE PAGE'S OPENING ANSWER.
 *
 * The same data the panels below hold, in the order a teacher asks for it. It
 * INVENTS NOTHING: every row is an `AssignmentIntervention` that the SERVER
 * derived from one member's own evidence ledger (lib/server/assignment-view.ts),
 * so "needs your attention" is a fact about recorded work rather than a
 * heuristic score — and each row is a LINK to the class it came from, because
 * the panel that shows the evidence is already on this page.
 *
 * WHAT IT DELIBERATELY DOES NOT SAY. It never claims a class is doing well: the
 * strongest true thing an empty list licenses is that nothing is waiting on the
 * teacher. A class whose learners have recorded nothing has not been MEASURED,
 * so it is named as unmeasured rather than reported as fine — the same
 * `null`-is-not-zero rule that governs every other number in this product.
 *
 * The three reasons are ranked by what it costs to ignore: a logged
 * misconception is a wrong RULE, which will keep producing wrong answers; then
 * repeated weakness; then work that has not been started. Within a rank, the
 * weakest measured rate comes first.
 */
function TeacherHome({ classes, monitors }: { classes: ClassRoster[]; monitors: AssignmentMonitor[] }) {
  const { t, lang } = useI18n();

  const learners = classes.reduce((n, c) => n + Object.keys(c.students).length, 0);
  const recorded = classes.reduce((n, c) => n + Object.values(c.live ?? {}).reduce((s, m) => s + m.answers, 0), 0);
  const measured = classes.reduce((n, c) => n + Object.values(c.live ?? {}).filter((m) => Object.keys(m.concepts).length > 0).length, 0);

  const rank: Record<AssignmentIntervention["reason"], number> = { misconception: 0, weak: 1, not_started: 2 };
  const attention = monitors
    .flatMap((m) => m.interventions.map((i) => ({ ...i, className: m.className, clsId: m.assignment.clsId })))
    .sort((a, b) => rank[a.reason] - rank[b.reason] || (a.rate ?? 0) - (b.rate ?? 0));

  // A class with members and not one measured concept. Named, not scored.
  const unmeasured = classes.filter(
    (c) => Object.keys(c.students).length > 0 && !Object.values(c.live ?? {}).some((m) => Object.keys(m.concepts).length > 0),
  );

  const reasonWords = (i: { reason: AssignmentIntervention["reason"]; conceptId: string; rate: number | null; misconceptionId?: string }) =>
    i.reason === "not_started"
      ? `${t("teach.notStarted")}: ${ctitle(lang, i.conceptId)}`
      : i.reason === "weak"
        ? `${t("teach.reasonWeak")}: ${ctitle(lang, i.conceptId)}${i.rate !== null ? ` (${Math.round(i.rate * 100)}%)` : ""}`
        : `${t("teach.reasonMisconception")}: ${MISCONCEPTIONS_BY_ID[i.misconceptionId ?? ""]?.name ?? i.misconceptionId}`;

  if (classes.length === 0) {
    return (
      <div className="card soft" style={{ marginTop: 20 }}>
        <p className="eyebrow" style={{ marginBottom: 4 }}><span className="no">◔</span> {t("teach.today")}</p>
        <p style={{ margin: 0 }}>{t("teach.startHere")}</p>
      </div>
    );
  }

  return (
    <div className="card soft" style={{ marginTop: 20 }} aria-label={t("teach.today")}>
      <p className="eyebrow" style={{ marginBottom: 4 }}><span className="no">◔</span> {t("teach.today")}</p>
      <p className="small muted" style={{ margin: "0 0 4px" }}>
        {fill(t("teach.totals"), { learners, marked: recorded, assignments: monitors.length })}
      </p>

      {attention.length === 0 ? (
        <p className="small" style={{ margin: "6px 0 0" }}>{t("teach.nothingWaiting")}</p>
      ) : (
        <>
          <p className="eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>
            <span className="no">!</span> {t("teach.needsYou")}
            <span className="chip warn" style={{ marginLeft: 6 }}>{attention.length}</span>
          </p>
          <p className="small muted" style={{ margin: "0 0 6px" }}>{t("teach.attentionLead")}</p>
          {attention.slice(0, 6).map((i, k) => (
            <a key={`${i.clsId}-${i.handle}-${i.conceptId}-${i.reason}-${k}`} href={`#class-${i.clsId}`} className="content-row">
              <span className="grow">
                <b>{i.handle}</b>
                <span className="blurb">{reasonWords(i)}</span>
              </span>
              <span className="go">{i.className} →</span>
            </a>
          ))}
        </>
      )}

      {measured > 0 && (
        <p className="small muted" style={{ margin: "10px 0 0" }}>
          {measured}/{learners} {t("teach.measured")}
        </p>
      )}
      {unmeasured.length > 0 && (
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          {t("teach.unmeasured")}: {unmeasured.map((c) => c.name).join(" · ")}
        </p>
      )}
    </div>
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
  launch,
  onLaunchConsumed,
}: {
  cls: ClassRoster;
  owned?: OwnedClass;
  monitors: AssignmentMonitor[];
  onSet: (body: { conceptIds: string[]; dueAt: number; title: string; subject?: SubjectId; targetHandles?: string[]; needId?: string }) => Promise<void>;
  onRemove: (assignmentId: string) => Promise<void>;
  /** A finding handed over by the NeedsPanel (§8): pre-populates the four
   *  steps with the concept, learners and title it names. Everything stays
   *  editable — one creation path, a starting point inside it. */
  launch?: NeedLaunch | null;
  onLaunchConsumed?: () => void;
}) {
  const { t, lang } = useI18n();
  // ── A SEQUENCE, NOT AN EXPANDING FORM (§assignment builder) ─────────────
  // Setting work is four questions in the order a teacher asks them: WHO is
  // this for, WHAT should they learn, WHEN is it due, and SHOW ME what I am
  // about to set. The old form put a scroll of every concept in the course, a
  // date and a button in one panel — so "who is this for" was not a question at
  // all, and work went to the whole class because that was the only thing
  // expressible.
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [whole, setWhole] = useState(true);
  const [targets, setTargets] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  // The record a launched review is being assigned under. Kept in state beside
  // the launch's other values: the launch itself is consumed once (so it cannot
  // re-apply on every render), and the record id must outlive that.
  const [needId, setNeedId] = useState("");
  const [q, setQ] = useState("");
  const [due, setDue] = useState("");
  const [label, setLabel] = useState("");
  const [declare, setDeclare] = useState<SubjectId | "">("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // The confirmation, which names WHO can start — the one fact the teacher just
  // decided, and the one they may want to check before closing the class.
  const [done, setDone] = useState("");

  // ── THE FINDING'S LAUNCH (§8) ── When a learning need hands its concept,
  // learners and title over, the builder OPENS on them as starting values:
  // whole-class off (the finding names the learners), the concept pre-picked,
  // the label pre-filled. Still every teacher's edit at every step.
  const launchKey = launch ? `${launch.needId}|${launch.conceptId}|${launch.targetHandles.join(",")}|${launch.title}` : "";
  const consumedRef = useRef("");
  useEffect(() => {
    if (!launch || launchKey === consumedRef.current) return;
    consumedRef.current = launchKey;
    setOpen(true);
    setStep(0);
    setWhole(launch.targetHandles.length === 0);
    setTargets(launch.targetHandles);
    setPicked((p) => (p.includes(launch.conceptId) ? p : [...p, launch.conceptId]));
    setLabel((l) => (l ? l : launch.title));
    setNeedId(launch.needId);
    onLaunchConsumed?.();
  }, [launch, launchKey, onLaunchConsumed]);

  const declared = owned?.subject ?? null;
  const assignable = owned?.assignable ?? [];
  const hasCurriculum = Boolean(declared || declare);
  // The class's STUDENTS: `cls.students` as the live view serves it, which has
  // the teacher taken out (lib/server/class-view) — so the target list cannot
  // offer the class's own teacher as a student who owes it work.
  const students = Object.keys(cls.students);
  const CAP = 12;
  const needle = q.trim().toLowerCase();
  const shown = needle ? assignable.filter((id) => ctitle(lang, id).toLowerCase().includes(needle)) : assignable;
  const whoReady = whole || targets.length > 0;
  const ready = whoReady && picked.length > 0 && Boolean(due);

  /** Leave the builder as it was found — on a successful set, and on Close. A
   *  half-filled sequence reopened days later is worse than starting again. */
  function reset() {
    setOpen(false);
    setStep(0);
    setWhole(true);
    setTargets([]);
    setPicked([]);
    setQ("");
    setDue("");
    setLabel("");
    setNeedId("");
    setErr("");
    consumedRef.current = "";
  }

  async function submit() {
    setErr("");
    const dueAt = due ? new Date(`${due}T23:59:59`).getTime() : NaN;
    if (!ready || !Number.isFinite(dueAt)) {
      setErr(t("asgb.needPick"));
      return;
    }
    setBusy(true);
    try {
      await onSet({
        conceptIds: picked,
        dueAt,
        title: label.trim(),
        // A review behind this work: the needs door's `assign` stamps the
        // record's baseline with the instant the work was set.
        ...(needId ? { needId } : {}),
        ...(declared ? {} : { subject: declare as SubjectId }),
        // Absent for the whole class, so the record keeps its ordinary shape:
        // an empty list would say something the teacher did not.
        ...(whole ? {} : { targetHandles: targets }),
      });
      // The confirmation names WHO can start — the one fact the teacher just
      // decided. It carries no count on purpose: "1 learners can now start" is
      // the sentence a single-target assignment produced, and "the learners you
      // selected" is true for one and for thirty.
      setDone(whole ? t("asgb.created") : t("asgb.createdSome"));
      reset();
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
        {/* Offered only where setting work is POSSIBLE: a class the caller does
            not own has no candidate list (and the work read would have failed
            anyway), and a control whose only possible answer is 403 is not a
            control. `owned` is the server's own licence for this class. */}
        {owned && (
          <button
            className="btn ghost small"
            aria-expanded={open}
            onClick={() => { setDone(""); setStep(0); setOpen((v) => !v); }}
          >{open ? t("common.close") : t("teach.setWork")}</button>
        )}
      </div>
      <p className="muted small" style={{ margin: "2px 0 0" }}>{t("teach.setWorkHint")}</p>
      {done && <p className="note" style={{ margin: "8px 0 0" }}>{done}</p>}

      {open && (
        <div style={{ marginTop: 10 }} data-work-builder data-work-step={step}>
          {/* THE FOUR QUESTIONS, with where you are marked. Read as a sequence,
              not scrolled as a form. */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {[t("asgb.stepWho"), t("asgb.stepWhat"), t("asgb.stepWhen"), t("teach.setSubmit")].map((lb, i) => (
              <button
                key={lb}
                type="button"
                className={`chip ${i === step ? "warn" : ""}`}
                aria-current={i === step ? "step" : undefined}
                onClick={() => setStep(i)}
              >{i + 1}. {lb}</button>
            ))}
          </div>

          {/* ── 1 · WHO IS THIS FOR ────────────────────────────────────── */}
          {step === 0 && (
            <div>
              {students.length === 0 ? (
                <p className="small muted">{t("teach.empty")}</p>
              ) : (
                <>
                  <label className="small" style={{ display: "block" }}>
                    <input type="radio" name={`who-${cls.id}`} checked={whole} onChange={() => setWhole(true)} />{" "}
                    {t("asgb.whoAll")} <span className="muted">({students.length})</span>
                  </label>
                  <label className="small" style={{ display: "block" }}>
                    <input type="radio" name={`who-${cls.id}`} checked={!whole} onChange={() => setWhole(false)} />{" "}
                    {t("asgb.whoSome")}
                  </label>
                  {!whole && (
                    <div style={{ maxHeight: 160, overflow: "auto", margin: "6px 0 0", paddingLeft: 18 }}>
                      {students.map((h) => (
                        <label key={h} className="small" style={{ display: "block" }}>
                          <input
                            type="checkbox"
                            checked={targets.includes(h)}
                            onChange={(e) => setTargets((p) => (e.target.checked ? [...p, h] : p.filter((x) => x !== h)))}
                          />{" "}{h}
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── 2 · WHAT SHOULD THEY LEARN ─────────────────────────────── */}
          {step === 1 && (
            <div>
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
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                    <input type="search" placeholder={t("asgb.search")} value={q} onChange={(e) => setQ(e.target.value)} />
                    <span className="small muted">{fill(t("asgb.cap"), { n: CAP })} · {picked.length}/{CAP}</span>
                  </div>
                  <div style={{ maxHeight: 200, overflow: "auto", marginBottom: 8 }}>
                    {assignable.length === 0
                      ? <p className="small muted">{t("teach.noIdeas")}</p>
                      : shown.length === 0
                        ? <p className="small muted">{t("learn.notFound")}</p>
                        : shown.map((id) => (
                          <label key={id} className="small" style={{ display: "block" }}>
                            <input
                              type="checkbox"
                              checked={picked.includes(id)}
                              disabled={!picked.includes(id) && picked.length >= CAP}
                              onChange={(e) => setPicked((p) => (e.target.checked ? [...p, id] : p.filter((x) => x !== id)))}
                            />{" "}
                            {ctitle(lang, id)}
                          </label>
                        ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── 3 · WHEN IS IT DUE ─────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <label className="small">{t("teach.pickDue")} <input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></label>
              <input type="text" placeholder={t("teach.pickLabel")} value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
          )}

          {/* ── 4 · REVIEW AND ASSIGN ──────────────────────────────────── */}
          {step === 3 && (
            <div>
              <p className="small" style={{ margin: "0 0 4px" }}>
                <b>{cls.name}</b>
                {/* The course the work is drawn from. A class with no declared
                    course shows the one being declared in step 2, and nothing
                    else — never a default subject standing in for a choice
                    nobody made. */}
                {declared ? ` · ${t("teach.course")}: ${declared}` : declare ? ` · ${t(SUBJECT_LABELS[declare])}` : ""}
              </p>
              <p className="small" style={{ margin: "0 0 4px" }}>
                <b>{whole ? t("asgb.wholeClass") : t("asgb.whoSome")}</b>
                {" · "}{whole ? `${students.length}` : targets.join(", ")}
              </p>
              <p className="small" style={{ margin: "0 0 4px" }}>
                <b>{t("teach.concepts")}</b>{" · "}{picked.map((id) => ctitle(lang, id)).join(" · ")}
              </p>
              <p className="small" style={{ margin: "0 0 8px" }}>
                <b>{t("teach.pickDue")}</b>
                {" · "}{due ? dueLabel(lang, new Date(`${due}T23:59:59`).getTime()) : "—"}
              </p>
              {/* WHAT THE WORK WILL ACTUALLY BE — the modes and adaptivity the
                  analysis asks for, answered honestly. The serve targets each
                  learner's own level from their own evidence, so there is no
                  "same for everyone vs differentiated" switch to offer; and
                  exam conditions are a paper's, not an assignment's. Offering
                  either as a control would be a form that changes nothing. */}
              <p className="note" style={{ margin: "0 0 8px" }}>{t("asgb.adapted")}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
            {step > 0 && <button className="btn ghost small" onClick={() => setStep((s) => s - 1)}>{t("asgb.back")}</button>}
            {step < 3 && (
              <button
                className="btn small"
                disabled={step === 0 ? !whoReady : step === 1 ? picked.length === 0 : !due}
                onClick={() => setStep((s) => s + 1)}
              >{t("common.next")}</button>
            )}
            {step === 3 && (
              <button className="btn small" disabled={busy || !ready} onClick={() => void submit()}>{t("teach.setSubmit")}</button>
            )}
          </div>
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
            {/* WHO the work was set for. The rows below are already only the
                targeted members' (derived server-side), and naming the target
                is what stops "1 of 1 done" from reading like a whole class. */}
            <p className="small" style={{ margin: "0 0 6px" }}>
              <span className="chip">
                {(m.assignment.targetHandles?.length ?? 0) > 0
                  ? `${t("asgb.whoSome")}: ${(m.assignment.targetHandles ?? []).join(", ")}`
                  : t("asgb.wholeClass")}
              </span>
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

/**
 * ONE STUDENT'S EVIDENCE — the answer to "what can this child demonstrate?".
 *
 * The roster's row is a rate. This is the evidence behind it, and it is the
 * only surface in the product where one learner's answers are read by somebody
 * other than themselves: the door (`GET /api/classes?learner=`) answers the
 * class's TEACHER and nobody else, so a member of the class cannot read a
 * peer's record however they call it.
 *
 * WHAT IT CAN AND CANNOT SAY, and both halves matter:
 *
 *   · the four dimensions come from the member's ledger, banded by the ONE
 *     shared rule and rendered by the ONE shared component, so "Strong" here
 *     is the same word a learner reads about themselves;
 *   · a concept the record has never measured is NAMED as not-yet-measured (or
 *     listed under the course's unmeasured ideas), never drawn as 0%;
 *   · what the work PROVED and the state of its delayed recall are asked of
 *     lib/proof.ts, so a hinted right answer is never reported as independent;
 *   · a suspected misconception is a HYPOTHESIS with its supporting wrong
 *     answers counted beneath it, and the teacher is told plainly that the
 *     decision to act is theirs — the engine does not diagnose a child;
 *   · and the record's own limit is stated: it keeps the concept, the outcome
 *     and what it proved, never the item or the working.
 *
 * A failed read is a failure, not an empty learner: a response with no member
 * in it, or a refusal, renders the product's own error state with a retry. That
 * is the same rule the page applies to its class list, for the same reason —
 * the one screen a teacher uses to decide who needs help must never dress a
 * broken request as "nothing here".
 */
function StudentEvidence({
  me,
  clsId,
  handle,
  learnerId,
  onClose,
}: {
  me: string;
  clsId: string;
  handle: string;
  learnerId: string;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; m: ClassMemberEvidence }
    | { status: "failed"; code: string }
  >({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const j = await api.classMember(me, clsId, learnerId);
      if (!j.member) { setState({ status: "failed", code: "malformed" }); return; }
      setState({ status: "ready", m: j.member });
    } catch (e) {
      setState({ status: "failed", code: failureText(e) });
    }
  }, [me, clsId, learnerId]);
  useEffect(() => { void load(); }, [load]);

  const m = state.status === "ready" ? state.m : null;
  // The concept's OWN subject, never a subject this page assumes: a physics
  // class's row must not link into the maths tree.
  const link = (conceptId: string) => {
    const subject = getConcept(conceptId)?.subject;
    return subject ? `/learn/${subject}/${conceptId}` : null;
  };
  // Banded by the shared rule, labelled in the learner's language.
  const rows: KnowledgeRow[] = m ? [
    { ...dimensionFor("recalled", t("evv.dim.recalled"), m.dimensions.recalled), from: "all-answers", unmeasured: m.dimensions.recalled === null },
    { ...dimensionFor("applied", t("evv.dim.applied"), m.dimensions.applied), from: "independent", unmeasured: m.dimensions.applied === null },
    { ...dimensionFor("transferred", t("evv.dim.transferred"), m.dimensions.transferred), from: "transfer", unmeasured: m.dimensions.transferred === null },
    { ...dimensionFor("retained", t("evv.dim.retention"), m.dimensions.retained), from: "retention", unmeasured: m.dimensions.retained === null },
  ] : [];
  // `concepts` arrives weakest-first, so the first row with independent work is
  // the weakest measured idea — and a concept nobody has measured yet is the
  // honest alternative to it. Never a "weakness" invented from an absence.
  const weakest = m?.concepts.find((c) => c.independent.asked > 0) ?? null;
  const startConcept = weakest?.conceptId ?? m?.unmeasured[0] ?? null;

  return (
    <section className="card soft" style={{ marginTop: 12 }} aria-label={t("tl.profile")}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <p className="eyebrow" style={{ margin: 0 }}><span className="no">◧</span> {t("tl.profile")} — {handle}</p>
        <button type="button" className="btn ghost small" onClick={onClose}>{t("tl.close")}</button>
      </div>

      {state.status === "loading" && <div style={{ marginTop: 12 }}><Loading lines={3} /></div>}
      {state.status === "failed" && (
        <div style={{ marginTop: 12 }}>
          <ErrorState body={`${t("teach.readFailed")} (${state.code})`} onRetry={() => void load()} />
        </div>
      )}

      {m && (
        <>
          <p className="eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>{t("tl.picture")}</p>
          {m.answers === 0 ? (
            // The one case the dimensions cannot speak about: nothing has been
            // measured, so no rate is drawn and no 0% is implied.
            <p className="note" style={{ margin: 0 }}>{t("tl.noWork")}</p>
          ) : (
            <>
              <Dims rows={rows} />
              <p className="muted small" style={{ margin: "6px 0 0" }}>{t("tl.independentOnly")}</p>
              {m.concepts.map((c) => {
                const href = link(c.conceptId);
                return (
                  <div key={c.conceptId} className="rowline">
                    <span className="grow small">
                      {href ? <Link href={href}>{ctitle(lang, c.conceptId)}</Link> : ctitle(lang, c.conceptId)}
                      {c.independent.asked > 0 ? (
                        <>
                          {" "}<span className="mono">{c.independent.correct}/{c.independent.asked}</span>
                          {/* What the work proved, and the state of its delayed
                              recall — the two things a rate cannot say. The
                              state word is only shown once a due review has
                              actually happened. */}
                          {c.proof && <span className="muted"> · {t(proofLabelKey(c.proof))}</span>}
                          {c.retention !== "unmeasured" && <span className="muted"> · {t(retentionLabelKey(c.retention))}</span>}
                        </>
                      ) : (
                        // Recorded work exists, but none of it was independent:
                        // that is a fact about the WORK, not a score.
                        <span className="muted"> · {t("teach.unmeasured")}</span>
                      )}
                    </span>
                    <span className="mono small muted">{c.answers}</span>
                  </div>
                );
              })}
            </>
          )}

          {m.hypotheses.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>
                <span className="no">!</span> {t("tl.hypotheses")}
              </p>
              {m.hypotheses.slice(0, 4).map((h) => {
                const known = MISCONCEPTIONS_BY_ID[h.id];
                return (
                  <div key={h.id} className="note">
                    <strong>{known?.name ?? h.id}</strong>{" "}
                    <span className="chip warn">×{h.hits}</span>
                    <p className="small" style={{ margin: "2px 0 0" }}>
                      {fill(t("tl.hypothesisSupport"), { n: h.hits, concept: ctitle(lang, h.conceptIds[0] ?? "") })}
                      {known ? ` — ${known.coaching.split(".")[0]}.` : ""}
                    </p>
                  </div>
                );
              })}
              <p className="muted small" style={{ margin: "4px 0 0" }}>{t("tl.hypothesisNote")}</p>
            </>
          )}

          {m.unmeasured.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>
                {t("tl.notMeasuredHere")} <span className="chip">{m.unmeasured.length}</span>
              </p>
              <p className="small muted" style={{ margin: 0 }}>
                {m.unmeasured.slice(0, 12).map((id) => ctitle(lang, id)).join(" · ")}
                {m.unmeasured.length > 12 ? ` +${m.unmeasured.length - 12}` : ""}
              </p>
            </>
          )}

          {m.recent.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>{t("tl.recent")}</p>
              {m.recent.slice(0, 8).map((r, i) => {
                const href = link(r.conceptId);
                return (
                  <div key={`${r.at}-${i}`} className="rowline">
                    <span className={`mark ${r.correct ? "good" : "bad"}`} aria-hidden="true">{r.correct ? "✓" : "✗"}</span>
                    <span className="grow small">
                      {href ? <Link href={href}>{ctitle(lang, r.conceptId)}</Link> : ctitle(lang, r.conceptId)}
                      <span className="muted"> · {t(`evv.source.${r.source}`)}</span>
                      {r.proof && <span className="muted"> · {t(proofLabelKey(r.proof))}</span>}
                      {/* Disclosed, never hidden: a device-reported answer is
                          one the server did not watch happen. */}
                      {r.offline && <span className="muted"> · {t("evv.offline")}</span>}
                      {r.hypothesisIds.length > 0 && (
                        <span className="muted"> · △ {r.hypothesisIds.map((id) => MISCONCEPTIONS_BY_ID[id]?.name ?? id).join(", ")}</span>
                      )}
                    </span>
                    <span className="mono small muted" style={{ width: 62, textAlign: "end" }}>
                      {new Date(r.at).toLocaleDateString(lang === "en" ? undefined : lang, { day: "numeric", month: "short" })}
                    </span>
                  </div>
                );
              })}
              <p className="muted small" style={{ margin: "4px 0 0" }}>{t("tl.recordOnly")}</p>
            </>
          )}

          {startConcept && (
            <>
              <p className="eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>{t("tl.nextStep")}</p>
              <p className="small" style={{ margin: 0 }}>
                {weakest ? t("tl.nextWeakest") : t("tl.nextNone")}{" "}
                {(() => {
                  const href = link(startConcept);
                  return href
                    ? <Link href={href}>{ctitle(lang, startConcept)}</Link>
                    : ctitle(lang, startConcept);
                })()}
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}

/** The key the openStudent map uses per class — the §8 launch onboarding kept
 *  the map single-keyed per class, so the prefill for class c is keyed `c`:
 *  a finding never opens a student drawer, the drawer is independent. */
function openStudentKey(clsId: string): string {
  return clsId;
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
        <a className="btn ghost small" href={classPackUrl(cls.id, loadLocalProfileId() ?? "", "html")} target="_blank" rel="noreferrer">
          🖨 {t("plan.print")}
        </a>
        <a className="btn ghost small" href={classPackUrl(cls.id, loadLocalProfileId() ?? "", "json")} target="_blank" rel="noreferrer">
          ⤓ {t("plan.export")}
        </a>
      </div>
      <p className="muted small" style={{ marginBottom: 0 }}>
        {t("pack.offlineNote")}
      </p>
    </div>
  );
}
