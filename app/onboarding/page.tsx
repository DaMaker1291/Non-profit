"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  claimGuestProfile, createProfile, currentGuestClaim, loadLocalProfileId, returnTarget, saveProfilePatch,
  signIn, signOut, signUp, useAccount, useI18n,
} from "@/lib/client";
import { COUNTRIES, LANGS } from "@/lib/i18n";
import { curriculumFor, INDEPENDENT_ROUTE } from "@/lib/curriculum";
import { SUBJECT_IDS, SUBJECT_LABELS } from "@/lib/subjects";
import { incompleteSubjects, levelForGrade, specOptionsFor } from "@/lib/specifications";
import { isBoardId, type ProfileState, type SubjectCourse, type SubjectId } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Real enrolment. The old page was a single form that minted an anonymous
// profile id and jumped to /dashboard — no account, nothing to sign back into,
// and nothing recorded about the course. This is the flow a student actually
// needs: an account (or an honest "not yet"), who they are, what they sit, what
// they study, and how they want to be taught.
//
// Every step writes to the real learner profile — the same ProfileState the
// question engine, the diagnostic and the Mind map read.
// ─────────────────────────────────────────────────────────────────────────────

type Mode = "signup" | "signin" | "guest";

const ERROR_KEYS: Record<string, string> = {
  email_taken: "onb.errTaken",
  bad_email: "onb.errEmail",
  weak_password: "onb.errPassword",
  long_password: "onb.errPassword",
  bad_credentials: "onb.errCreds",
  bad_name: "onb.errName",
  signup_failed: "onb.errCreate",
  login_failed: "onb.errCreds",
};

/**
 * The page shell.
 *
 * `useSearchParams` — which carries `?mode=signin` and the return-to target —
 * must be read inside a Suspense boundary. Without one Next cannot prerender
 * this route at all and `next build` fails outright, which is what it did; the
 * fix is to tell React where the boundary is, not to drop the query.
 *
 * The fallback is the page's own loading line, in the learner's language, so a
 * slow hydration looks exactly like the state this component already has.
 */
export default function Onboarding() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingFlow />
    </Suspense>
  );
}

function OnboardingLoading() {
  const { t } = useI18n();
  return (
    <main className="container narrow" style={{ paddingTop: 44 }}>
      <p className="lead">{t("common.loading")}</p>
    </main>
  );
}

function OnboardingFlow() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const { session, ready } = useAccount();

  const [mode, setMode] = useState<Mode>("signup");

  // `/onboarding?mode=signin` (the landing page's Sign in tile) starts on the
  // sign-in form rather than showing the create-account form first.
  useEffect(() => {
    if (params.get("mode") === "signin") setMode("signin");
  }, [params]);
  const [claim, setClaim] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");

  const [country, setCountry] = useState("XX");
  const [grade, setGrade] = useState("");
  const [examples, setExamples] = useState("neutral");
  const [board, setBoard] = useState("");
  const [spec, setSpec] = useState("");
  const [specLevel, setSpecLevel] = useState("");
  const [exam, setExam] = useState("");
  const [examDate, setExamDate] = useState("");
  const [subjects, setSubjects] = useState<SubjectId[]>(["maths"]);
  // ONE COURSE PER SUBJECT (§1). GCSE Maths (Foundation) beside A-Level Physics
  // is an ordinary combination, and a single qualification for all subjects
  // either pitches one of them at the wrong depth or plans work against a
  // coverage set that does not contain the subject at all. Empty until the
  // course step opens, which seeds each subject from the learner's first choice.
  const [courses, setCourses] = useState<Partial<Record<SubjectId, SubjectCourse>>>({});
  const [timePerDay, setTimePerDay] = useState(20);
  const [teaching, setTeaching] = useState(lang);
  const [answer, setAnswer] = useState(lang);
  const [school, setSchool] = useState(lang);
  const [termsMode, setTermsMode] = useState<"mixed" | "local">("mixed");

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  const route = curriculumFor(country) ?? (country === "XX" ? INDEPENDENT_ROUTE : null);
  const boards = route?.boards ?? [];
  // Captured ONCE, before any sign-in can overwrite localStorage. Reading it at
  // submit time would name the account's fresh profile and claim nothing.
  const guestClaim = useMemo(() => currentGuestClaim(), []);
  const guestHere = guestClaim !== null;
  const signedIn = Boolean(session.account);

  // Signed-in learners skip the account step entirely: they are already here.
  const steps = signedIn
    ? ["about", "subjects", "course", "teach"]
    : ["account", "about", "subjects", "course", "teach"];
  const current = steps[Math.min(step, steps.length - 1)];

  function toggleSubject(id: SubjectId) {
    setSubjects((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    // A dropped subject takes its course with it: a course for work that is no
    // longer theirs is a stale record, not a preference.
    setCourses((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  /** Every subject's course, seeded from the learner's first choice so the
   *  common case ("the same for all of them") is a click, not four forms. */
  useEffect(() => {
    if (current !== "course") return;
    setCourses((prev) => {
      const next: Partial<Record<SubjectId, SubjectCourse>> = {};
      const lead = subjects[0];
      const seed: SubjectCourse = {
        spec: prev[lead]?.spec ?? spec ?? undefined,
        specLevel: prev[lead]?.specLevel ?? specLevel ?? undefined,
      };
      for (const s of subjects) {
        next[s] = prev[s] ?? (s === lead ? seed : { ...seed });
      }
      return next;
    });
    // Only when the step opens or the subject list changes — never on every
    // keystroke, which would fight the learner for control of the selects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, subjects.join(",")]);

  /** The course draft as the engine sees it — the same shape /api/profile stores,
   *  so the requirement the form enforces and the requirement the server enforces
   *  are one function, not two lists of field names. */
  function courseDraft() {
    return {
      country,
      grade,
      board: isBoardId(board) ? board : undefined,
      spec: spec || undefined,
      specLevel: specLevel || undefined,
      subjects,
      subjectCourses: courses,
    };
  }
  const courseMissing = incompleteSubjects(courseDraft());

  /** Everything the enrolment collected, in the shape /api/profile accepts. */
  function enrolment() {
    // The flat fields follow the learner's FIRST subject, so a reader that
    // genuinely has one course still gets a true one (see lib/types.ts).
    const lead = subjects[0] ? courses[subjects[0]] : undefined;
    return {
      handle: handle.trim() || undefined,
      country,
      language: lang,
      teachingLang: teaching,
      answerLang: answer,
      schoolLang: school,
      grade: grade || undefined,
      examples,
      board: board || undefined,
      spec: lead?.spec ?? (spec || undefined),
      specLevel: lead?.specLevel ?? (specLevel || undefined),
      subjectCourses: courses,
      exam: exam || undefined,
      examDate: examDate || undefined,
      subjects,
      termsMode,
      timePerDay,
      onboarded: true,
    };
  }

  async function finish() {
    setBusy(true);
    setErr("");
    try {
      if (!signedIn) {
        if (mode === "signup") {
          await signUp({
            email, password, name: handle.trim(), country, language: lang,
            subjects, claimCurrent: claim && guestHere,
          });
        } else if (mode === "signin") {
          await signIn(email, password);
          // Carry this device's anonymous work into the account if it can —
          // using the claim captured BEFORE sign-in replaced it.
          if (claim && guestHere) {
            try {
              await claimGuestProfile(guestClaim);
            } catch (e) {
              setNotice(e instanceof Error && e.message === "account_has_progress" ? t("onb.claimFailed") : "");
            }
          }
        }
      }
      let saved: ProfileState | null = null;
      if (mode === "guest" && !loadLocalProfileId()) {
        saved = await createProfile({
          // No minted `student-1234` handles: a fabricated identity in the
          // greeting makes the product feel like a database row. Undefined
          // falls back to "Welcome back" — neutral and true. Teacher flows
          // that need a handle take the one the learner actually chose.
          handle: handle.trim() || undefined,
          country, language: lang, teachingLang: teaching, answerLang: answer, schoolLang: school,
          grade: grade || undefined, examples, birthYear: null, goal: "", subjects,
          board: board || undefined,
          spec: subjects[0] ? courses[subjects[0]]?.spec ?? (spec || undefined) : spec || undefined,
          specLevel: subjects[0] ? courses[subjects[0]]?.specLevel ?? (specLevel || undefined) : specLevel || undefined,
          subjectCourses: courses,
          exam: exam || undefined, examDate: examDate || undefined, timePerDay, onboarded: true,
        });
      } else {
        saved = await saveProfilePatch(enrolment());
      }
      // Enrolment → baseline diagnostic → Home. A learner the system has never
      // measured is sent to be measured; only then does Home mean anything.
      //
      // Read the FRESH profile the server just returned, not the session this
      // form captured when it first rendered: a sign-in that claims this
      // device's work ends up owning a different learner, and the stale copy
      // would send someone who already has a diagnostic back to sit it again.
      const already = Object.keys(saved?.diagnostics ?? session.profile?.diagnostics ?? {}).length > 0;
      const subject = subjects[0] ?? "maths";
      // Intent first: a learner who was sent here from /papers goes back to
      // /papers, not to Home. Only an unsolicited visit follows the default
      // route, and even then the guard re-checks the next step for us.
      const wanted = returnTarget(params, "");
      router.push(wanted || (already ? "/dashboard" : `/diagnostic/${subject}`));
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setErr(t(ERROR_KEYS[code] ?? "onb.errCreate"));
      // Send the learner back to the step that owns the failure.
      if (code === "email_taken" || code === "bad_email" || code === "weak_password" || code === "bad_credentials") {
        setStep(0);
      }
      setBusy(false);
    }
  }

  const canAdvance = (): boolean => {
    if (current === "account") {
      if (mode === "guest") return true;
      if (mode === "signin") return email.includes("@") && password.length > 0;
      return email.includes("@") && password.length >= 8 && handle.trim().length > 0;
    }
    if (current === "subjects") return subjects.length > 0;
    // No learner reaches personalised work on a course nobody finished choosing:
    // the same requirement /api/profile stores, read from the same function.
    if (current === "course") return courseMissing.length === 0;
    return true;
  };

  if (!ready) {
    return (
      <main className="container narrow" style={{ paddingTop: 44 }}>
        <p className="lead">{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="container narrow" style={{ paddingTop: 44 }}>
      <p className="eyebrow">
        <span className="no">◉</span> {t("onb.title")} · {t("onb.step")} {Math.min(step + 1, steps.length)}/{steps.length}
      </p>
      <div className="bar thin" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={steps.length}>
        <i style={{ width: `${((Math.min(step, steps.length - 1) + 1) / steps.length) * 100}%` }} />
      </div>

      {signedIn && (
        <p className="small muted" style={{ marginTop: 14 }}>
          {t("onb.signedInAs")} <strong>{session.account?.email}</strong>{" "}
          <button className="btn small" onClick={async () => { await signOut(); router.refresh(); }}>
            {t("onb.signOut")}
          </button>
        </p>
      )}

      {current === "account" && (
        <>
          <h1>{t("onb.acctTitle")}</h1>
          <p className="lead">{t("onb.acctLead")}</p>
          <div className="exercise" style={{ marginTop: 20 }}>
            <div className="checks" style={{ flexWrap: "wrap", marginBottom: 16 }}>
              {([["signup", "onb.createAcct"], ["signin", "onb.signIn"], ["guest", "onb.guest"]] as Array<[Mode, string]>).map(([m, key]) => (
                <label key={m} className={mode === m ? "on" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <input type="radio" name="mode" checked={mode === m} onChange={() => { setMode(m); setErr(""); }} />
                  {t(key)}
                </label>
              ))}
            </div>

            {mode !== "guest" && (
              <>
                <label className="field">
                  <span>{t("onb.email")}</span>
                  <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="amina@example.org" />
                </label>
                <label className="field">
                  <span>{t("onb.password")}</span>
                  <input
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <p className="small muted">{t("onb.pwNote")}</p>
                {mode === "signup" && (
                  <label className="field">
                    <span>{t("onb.name")}</span>
                    <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="amina_k" maxLength={24} />
                  </label>
                )}
              </>
            )}

            {guestHere && mode !== "guest" && (
              <label className="checks" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <input type="checkbox" checked={claim} onChange={(e) => setClaim(e.target.checked)} />
                {t("onb.claim")}
              </label>
            )}

            <p className="small muted" style={{ marginTop: 12 }}>
              {mode === "guest" ? t("onb.guestNote") : t("onb.verifyNote")}
            </p>
          </div>
        </>
      )}

      {current === "about" && (
        <>
          <h1>{t("onb.about")}</h1>
          <p className="lead">{t("onb.lead")}</p>
          <div className="exercise" style={{ marginTop: 20 }}>
            <label className="field">
              <span>{t("onb.name")}</span>
              <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="amina_k" maxLength={24} />
            </label>
            <div className="grid cols2">
              <label className="field">
                <span>{t("onb.where")}</span>
                <select value={country} onChange={(e) => { setCountry(e.target.value); setBoard(""); setSpec(""); setSpecLevel(""); setGrade(""); }}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>{t("onb.grade")}</span>
                <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="">{t("onb.independent")}</option>
                  {(route?.grades ?? []).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
            </div>
            <label className="field">
              <span>{t("onb.examples")}</span>
              <select value={examples} onChange={(e) => setExamples(e.target.value)}>
                {[{ id: "neutral", key: "cult.neutral" }, { id: "farm", key: "cult.agriculture" }, { id: "market", key: "cult.urban" }, { id: "city", key: "cult.urban" }].map((c) => (
                  <option key={c.id} value={c.id}>{t(c.key)}</option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}

      {current === "course" && (
        <>
          <h1>{t("onb.currStep")}</h1>
          <p className="lead">{t("curr.sub")}</p>
          <div className="exercise" style={{ marginTop: 20 }}>
            {/* ONE COURSE PER SUBJECT. The choice list is narrowed to the
                qualifications that actually contain the subject, so a
                maths-only paper can never be offered (or saved) as a physics
                course. */}
            {subjects.map((s) => {
              const options = specOptionsFor(country, s);
              const chosen = courses[s]?.spec ?? "";
              const levels = options.find((x) => x.id === chosen)?.levels ?? [];
              const missing = courseMissing.find((m) => m.subject === s)?.missing ?? [];
              return (
                <div key={s} style={{ marginBottom: 14 }}>
                  <p className="small" style={{ margin: "0 0 6px" }}>
                    <strong>{t(SUBJECT_LABELS[s])}</strong>
                    {missing.length > 0 && <span className="small muted"> · {t("onb.courseNeed")}</span>}
                  </p>
                  <div className="grid cols2">
                    <label className="field">
                      <span>{t("onb.spec")}</span>
                      <select
                        value={chosen}
                        onChange={(e) => {
                          const pick = options.find((x) => x.id === e.target.value);
                          const level = pick ? levelForGrade(pick, grade) ?? pick.levels[0] : null;
                          setCourses((prev) => ({ ...prev, [s]: { ...prev[s], spec: pick?.id, specLevel: level?.id } }));
                          // The flat fields follow the FIRST subject, which is
                          // what any single-course reader will see.
                          if (s === subjects[0]) {
                            setSpec(pick?.id ?? "");
                            setSpecLevel(level?.id ?? "");
                          }
                        }}
                      >
                        <option value="">{t("onb.independent")}</option>
                        {options.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </select>
                    </label>
                    <label className="field">
                      <span>{t("onb.level")}</span>
                      <select
                        value={courses[s]?.specLevel ?? ""}
                        onChange={(e) => {
                          setCourses((prev) => ({ ...prev, [s]: { ...prev[s], specLevel: e.target.value } }));
                          if (s === subjects[0]) setSpecLevel(e.target.value);
                        }}
                      >
                        <option value="">{t("onb.independent")}</option>
                        {levels.map((l) => (
                          <option key={l.id} value={l.id}>{l.name || t(`lvl.${l.tier}`)}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              );
            })}
            {boards.length > 0 && (
              <label className="field">
                <span>{t("onb.board")}</span>
                <div className="checks" style={{ flexWrap: "wrap" }}>
                  {boards.map((b) => (
                    <label key={b.id} className={board === b.id ? "on" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <input type="radio" name="board" checked={board === b.id} onChange={() => setBoard(b.id === board ? "" : b.id)} />
                      {b.name}
                    </label>
                  ))}
                </div>
              </label>
            )}
            <div className="grid cols2">
              <label className="field">
                <span>{t("acc.examLabel")}</span>
                <input type="text" value={exam} onChange={(e) => setExam(e.target.value)} placeholder={t("acc.examPh")} maxLength={40} />
              </label>
              <label className="field">
                <span>{t("onb.examDate")}</span>
                <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              </label>
            </div>
          </div>
        </>
      )}

      {current === "subjects" && (
        <>
          <h1>{t("onb.pickSubjects")}</h1>
          <p className="lead">{t("onb.subjectsNote")}</p>
          <div className="exercise" style={{ marginTop: 20 }}>
            <div className="checks" style={{ flexWrap: "wrap" }}>
              {SUBJECT_IDS.map((s) => (
                <label key={s} className={subjects.includes(s) ? "on" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={subjects.includes(s)} onChange={() => toggleSubject(s)} />
                  {t(SUBJECT_LABELS[s])}
                </label>
              ))}
            </div>
            <label className="field" style={{ marginTop: 16 }}>
              <span>{t("onb.timePerDay")}</span>
              <div className="checks" style={{ flexWrap: "wrap" }}>
                {[10, 20, 30, 45, 60].map((m) => (
                  <label key={m} className={timePerDay === m ? "on" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <input type="radio" name="time" checked={timePerDay === m} onChange={() => setTimePerDay(m)} />
                    {m} min
                  </label>
                ))}
              </div>
            </label>
          </div>
        </>
      )}

      {current === "teach" && (
        <>
          <h1>{t("onb.langStep")}</h1>
          <p className="lead">{t("onb.langHint")}</p>
          <div className="exercise" style={{ marginTop: 20 }}>
            <label className="field">
              <span>{t("onb.language")}</span>
              <select value={lang} onChange={(e) => setLang(e.target.value)}>
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
              </select>
            </label>
            <div className="grid cols2">
              <label className="field">
                <span>{t("onb.teachingLang")}</span>
                <select value={teaching} onChange={(e) => setTeaching(e.target.value)}>
                  {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
                </select>
              </label>
              <label className="field">
                <span>{t("onb.answerLang")}</span>
                <select value={answer} onChange={(e) => setAnswer(e.target.value)}>
                  {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
                </select>
              </label>
            </div>
            <label className="field">
              <span>{t("onb.schoolLang")}</span>
              <select value={school} onChange={(e) => setSchool(e.target.value)}>
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
              </select>
            </label>
            <label className="field">
              <span>{t("acc.language")}</span>
              <div className="checks" style={{ flexWrap: "wrap" }}>
                {(["mixed", "local"] as const).map((m) => (
                  <label key={m} className={termsMode === m ? "on" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <input type="radio" name="terms" checked={termsMode === m} onChange={() => setTermsMode(m)} />
                    {t(m === "mixed" ? "acc.termsMixed" : "acc.termsLocal")}
                  </label>
                ))}
              </div>
            </label>
            <p className="small muted">{t("lq.teachNote")}</p>
          </div>
        </>
      )}

      {err && <p className="marking bad" style={{ padding: "10px 14px" }}><span className="mark" aria-hidden="true">✗</span> {err}</p>}
      {notice && <p className="marking" style={{ padding: "10px 14px" }}>{notice}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {step > 0 && (
          <button className="btn" onClick={() => { setStep((s) => s - 1); setErr(""); }} disabled={busy}>
            ← {t("onb.back")}
          </button>
        )}
        {step < steps.length - 1 ? (
          <button className="btn" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance() || busy} style={{ flex: 1 }}>
            {t("common.next")} →
          </button>
        ) : (
          <button className="btn" onClick={finish} disabled={busy} style={{ flex: 1 }}>
            {busy ? t("onb.settingUp") : `${t("onb.start")} →`}
          </button>
        )}
      </div>

      <p className="small muted" style={{ marginTop: 12 }}>
        🎓 {t("onb.subjectsNote")}
      </p>
    </main>
  );
}
