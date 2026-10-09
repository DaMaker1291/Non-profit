"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  claimGuestProfile, createProfile, currentGuestClaim, loadLocalProfileId, returnTarget, saveProfilePatch,
  signIn, signOut, signUp, useAccount, useI18n, useProfile,
} from "@/lib/client";
import { accessFor, withReturn } from "@/lib/app-state";
import { COUNTRIES, fill, LANGS } from "@/lib/i18n";
import { levelLabel } from "@/lib/content-i18n";
import { FIELD_LABEL } from "@/components/course-first";
import { curriculumFor, INDEPENDENT_ROUTE } from "@/lib/curriculum";
import { SUBJECT_IDS, SUBJECT_LABELS } from "@/lib/subjects";
import { incompleteSubjects, levelForGrade, specOptionsFor } from "@/lib/specifications";
// The culture vocabulary has ONE owner (lib/culture.ts) because the concept
// page reads the same ids back through `exampleFor` when it picks the case a
// worked example is set in. This form used to carry its own list — ids
// `farm`/`market`/`city` that the owner does not know, two of them labelled with
// the same string — so the choice was inert: the learner picked "Farming" and
// got the neutral example, and the two authored cultures this file never offered
// (coast, sport) were unreachable. Rendering from CULTURES is what makes the
// choice do what it says.
import { CULTURES, cultureLabel } from "@/lib/culture";
import { isBoardId, type ProfileState, type SubjectCourse, type SubjectId } from "@/lib/types";
import { Loading } from "@/components/states";

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
  /** The shell's own learner state — the state the route guard reads. Enrolment
   *  CHANGES it (it creates the profile, or completes one), and a guard that
   *  still holds the pre-enrolment copy will refuse the destination this form
   *  is about to send the learner to. See `finish`. */
  const { set: setLearner } = useProfile();

  const [mode, setMode] = useState<Mode>("signup");
  /** The account choice is a PREFERENCE as well as an answer. A learner who chose
   *  "continue without an account" should not be handed the create-account form
   *  again because a link in the shell brought them back here; it is remembered
   *  the way the language is (`openmind:lang`), because it describes how this
   *  person wants to use this device. An explicit `?mode=` still wins: that is a
   *  deliberate link, not a bounce. */
  const MODE_KEY = "openmind:acctMode";
  const pickMode = (m: Mode) => {
    setMode(m);
    setErr("");
    try { window.localStorage.setItem(MODE_KEY, m); } catch { /* private mode */ }
  };
  // WHO IS THIS (§2: the first branch in the global flow). An account can be a
  // student's or a teacher's; the platform's two halves hang off this one
  // choice, so it is asked here rather than left to a settings page nobody
  // opens. It rides the account (server-validated), not the profile.
  const [role, setRole] = useState<"student" | "teacher">("student");
  // Whose Home this is. Read from the ACCOUNT when there is one (see `finish`),
  // because the form's own answer only exists for an account being created.
  const accountRole = session.account?.role;
  const isTeacherAccount = accountRole ? accountRole !== "student" : role === "teacher";

  // `/onboarding?mode=signin` (the landing page's Sign in tile) starts on the
  // sign-in form rather than showing the create-account form first; otherwise
  // the form opens on whatever this device last chose.
  useEffect(() => {
    const forced = params.get("mode");
    if (forced === "signin" || forced === "signup" || forced === "guest") { setMode(forced); return; }
    try {
      const stored = window.localStorage.getItem(MODE_KEY);
      if (stored === "signin" || stored === "signup" || stored === "guest") setMode(stored);
    } catch { /* private mode */ }
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
  // WHY they are learning (§3: goals belong to the plan). `intent` is the
  // coarse motivation the dashboard reads; `goal` is the learner's own words —
  // the sentence Home quotes back with the progress line under it.
  const [intent, setIntent] = useState<"" | "exams" | "understand" | "project" | "code" | "competition" | "life">("");
  const [goal, setGoal] = useState("");
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
  /** ONE STEP PER PRESS, ALWAYS. `setStep((s) => s + 1)` fired three times in one
   *  tick moves three steps, and a triple-click on "Next" is not an exotic act —
   *  it is what a phone double-tap does. The step went 1 → 4 and the learner was
   *  moved past "About you" and "What are you studying?" without ever seeing
   *  either. Their answers survived (the state is the same state), so nothing
   *  broke — which is exactly why it is worth fixing: it looked like progress
   *  and silently skipped two screens of it.
   *
   *  A lock released when the step changes, NOT a timer: a timer would still let
   *  a slow deliberate double-click through, and the point is that the button
   *  cannot be pressed twice for the step currently on screen. */
  const [advancing, setAdvancing] = useState(false);
  /** The latch itself is a REF, and that is not incidental. A state latch is
   *  read from the render closure, so three clicks arriving in ONE tick all read
   *  the same stale `false` and all three advance — which is precisely the
   *  failure, so the first version of this fix did nothing and the playtest
   *  caught it. A ref is written synchronously, so the second and third clicks
   *  are refused before React has rendered anything. */
  const advanceLock = useRef(false);
  const advance = () => {
    if (advanceLock.current) return;
    advanceLock.current = true;
    setAdvancing(true);
    setStep((s) => s + 1);
  };
  useEffect(() => {
    advanceLock.current = false;
    setAdvancing(false);
  }, [step]);

  // Where the shell says the learner was heading when it sent them here. Read
  // once, for the reason line below — `finish` reads it again to keep the
  // promise it makes.
  const pending = returnTarget(params, "");
  // The same fallback `courseGaps` applies, for the same reason: a country this
  // product does not model still has the independent pathway, and it still has
  // real grades to choose from. Left as `?? (country === "XX" ? … : null)` this
  // matched the gate's old dead end — the step required a grade from
  // `route.grades` while offering an empty list, so the control that fixed the
  // gap could not be used.
  const route = curriculumFor(country) ?? INDEPENDENT_ROUTE;
  const boards = route?.boards ?? [];
  // Captured ONCE, before any sign-in can overwrite localStorage. Reading it at
  // submit time would name the account's fresh profile and claim nothing.
  const guestClaim = useMemo(() => currentGuestClaim(), []);
  const guestHere = guestClaim !== null;
  const signedIn = Boolean(session.account);

  // Signed-in learners skip the account step entirely: they are already here.
  const steps = signedIn
    ? ["about", "subjects", "course", "goals", "teach"]
    : ["account", "about", "subjects", "course", "goals", "teach"];
  const current = steps[Math.min(step, steps.length - 1)];

  /** A STEP CHANGE IS A PAGE CHANGE, and it behaved like neither.
   *
   *  Measured on a phone: advancing left the new step wherever the last one had
   *  been scrolled to — the step counter 102px ABOVE the viewport and the
   *  heading 57px above it — so the learner landed in the middle of a form with
   *  nothing on screen naming it. Focus also stayed on <body>, because the
   *  `Next` button they clicked was gone: a keyboard or screen-reader user was
   *  told nothing and had to tab from the top of the page again.
   *
   *  So a new step opens at its top, with focus on its own heading — the single
   *  element that names the screen. Skipped on first mount, so arriving at the
   *  wizard does not steal focus from the page. */
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    const heading = document.querySelector<HTMLHeadingElement>("main h1");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }, [step]);

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
      intent: intent || "",
      goal: goal.trim(),
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
            subjects, claimCurrent: claim && guestHere, role,
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
        // THE SAME PACKAGE THE OTHER BRANCH SENDS, not a second list of fields.
        // This payload used to re-list all fifteen by hand, and it had drifted:
        // `termsMode` — the terminology choice the step before this one collects —
        // was missing, so a learner who enrolled WITHOUT an account chose "Local
        // terms only" and the server never heard it, while a signed-in learner's
        // identical choice was saved. One owner for "what enrolment collected"
        // is what makes that class of drift impossible rather than unlikely.
        saved = await createProfile({ ...enrolment(), birthYear: null });
      } else {
        saved = await saveProfilePatch(enrolment());
      }
      // THE SHELL HAS TO LEARN WHAT ENROLMENT JUST WROTE, BEFORE WE NAVIGATE.
      //
      // This is the redirect loop, and it is not a guess: walking a brand-new
      // learner through all six steps recorded
      //
      //   push("/dashboard")  →  39ms later  →  replace("/diagnostic/maths?return=%2Fdashboard")
      //
      // `AppProvider` fetches the profile once per `generation` and only
      // re-probes on a session event or a FULL page load — a client-side
      // `push` refreshes nothing. So the guard was still holding the
      // pre-enrolment learner (no profile / not onboarded / not diagnosed) and
      // refused the page this form had just finished sending them to, bouncing
      // them back to step 1 of onboarding with the `return` ticket still
      // attached. The diagnostic page already had to do exactly this for
      // exactly this reason, and its comment says so; enrolment is where the
      // profile is CREATED, so its stale window is the widest of all — and the
      // harness pinned the diagnostic's fix without pinning this one.
      if (saved) setLearner(saved);
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
      // A TEACHER's destination is their own platform (§2: create class →
      // invite → assign): routing them into a baseline diagnostic in a subject
      // they do not teach would be measuring the wrong person.
      //
      // THE ACCOUNT'S ROLE, not this form's. A signed-in learner never sees the
      // role cards (the account step is skipped), so this form's `role` is
      // still its "student" default for exactly the people this branch exists
      // for — every teacher who signed back in went to the student's Home, and
      // no screen offered them a way to correct it. An `org` account (a school)
      // sets work too, so it belongs on the same platform; its own path is not
      // built yet. The form's value is the fallback, and there it is right: an
      // account being created this second has no role to read.
      if (!wanted && isTeacherAccount && mode !== "guest") {
        router.push("/teacher");
        return;
      }
      // A DESTINATION THE GUARD WILL IMMEDIATELY REFUSE IS NOT A DESTINATION.
      //
      // Enrolment makes a learner `onboarded`, never `diagnosed`, so a return
      // ticket pointing at a `diagnosed`-gated page cannot be honoured yet —
      // and `/dashboard` is the most ordinary thing a new learner asks for
      // (the nav's Home, the landing page's "Go to your dashboard"). Pushing it
      // anyway guarantees a bounce, and the bounce re-attaches the same ticket,
      // so every attempt starts the loop over. `accessFor` is the one owner of
      // that vocabulary, so this asks the contract rather than restating it.
      const unreachable = wanted ? accessFor(wanted) === "diagnosed" : false;
      if (wanted && (already || !unreachable)) {
        router.push(wanted);
      } else {
        // Carry the ticket forward, so the diagnostic returns the learner to
        // what they actually asked for instead of stranding them at a default.
        router.push(
          already ? withReturn("/dashboard", wanted) : withReturn(`/diagnostic/${subject}`, wanted),
        );
      }
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

  /** Why the account step cannot continue, and what to say about it.
   *
   *  ONE owner for that gate: `canAdvance` reads this, and the form prints its
   *  message beside the field at fault, so the button and the explanation cannot
   *  disagree. The rules are unchanged — a malformed address, a short password,
   *  a missing name. What changed is that they are SAID: filling in all three
   *  boxes and getting a dead button with no reason is how a first run loses
   *  someone (measured: email "abc", an 8-character password and a name left
   *  `Next` disabled and silent, above a password hint that read "At least 8
   *  characters." — which the learner had already satisfied).
   *
   *  `key: null` means blocked but not worth a sentence (a field is simply
   *  empty, and it is the only box left). A message appears where it helps: the
   *  address waits until something has been typed, the password keeps its
   *  neutral hint until then, and the name is mentioned last, once the rest is
   *  done. All three strings already existed — reachable only when the SERVER
   *  refused, which a learner only reached by pressing a button that was off. */
  const acctIssue: { field: "email" | "password" | "name"; key: string | null } | null =
    mode === "guest" ? null
      : !email.includes("@") ? { field: "email", key: email.length > 0 ? "onb.errEmail" : null }
      : mode === "signin" ? (password.length > 0 ? null : { field: "password", key: null })
      : password.length < 8 ? { field: "password", key: password.length > 0 ? "onb.errPassword" : null }
      : handle.trim().length === 0 ? { field: "name", key: "onb.errName" }
      : null;
  /** The issue only when it is worth saying out loud. Both the message and the
   *  `aria-invalid` flag read this one value, so a field can never be marked
   *  wrong without saying why. */
  const acctSaid = acctIssue && acctIssue.key ? { field: acctIssue.field, key: acctIssue.key } : null;
  const issueFor = (f: "email" | "password" | "name") =>
    acctSaid && acctSaid.field === f ? <p className="field-error" role="status">{t(acctSaid.key)}</p> : null;
  const invalid = (f: "email" | "password" | "name") => (acctSaid?.field === f ? true : undefined);

  const canAdvance = (): boolean => {
    if (current === "account") return mode === "guest" ? true : acctIssue === null;
    if (current === "subjects") return subjects.length > 0;
    // No learner reaches personalised work on a course nobody finished choosing:
    // the same requirement /api/profile stores, read from the same function.
    if (current === "course") return courseMissing.length === 0;
    return true;
  };

  /** WHAT `Next` IS WAITING FOR, said where the button is.
   *
   *  A disabled `Next` with no sentence beside it is the wall a first run dies
   *  on — and the course step had exactly that. Its only signal was a `muted`
   *  line above the form reading "needs: Your grade level · Qualification",
   *  which the eye takes for a label rather than an instruction, in the
   *  product's own vocabulary rather than the learner's. This says the same
   *  thing in the imperative, next to the control it is about, and it is DERIVED
   *  from the one gate `canAdvance` reads — so the sentence and the button
   *  cannot disagree, and the requirement is never invented here. */
  const needText = (): string | null => {
    if (current !== "course" || canAdvance()) return null;
    const fields = [...new Set(courseMissing.flatMap((m) => m.missing))];
    if (fields.length === 0) return null;
    return fill(t("onb.needFields"), {
      fields: fields
        .map((f) => (FIELD_LABEL[f] ? t(FIELD_LABEL[f] as Parameters<typeof t>[0]) : f))
        .join(" · "),
    });
  };

  if (!ready) {
    // A skeleton, not a claim: while the session probe is in flight we do not
    // know whether this is a new learner, a returning one, or somebody who
    // already has an account — and the form below is different for each.
    return (
      <main className="container narrow page">
        <Loading lines={4} />
      </main>
    );
  }

  return (
    <main className="container narrow page">
      <p className="eyebrow">
        <span className="no">◉</span> {t("onb.title")}
      </p>
      {/* Where am I, and how much is left. A learner part-way through setup
          needs both, and needs them before they start reading the form —
          "how many more screens is this" is the question that decides whether
          they finish. */}
      <div className="wizard-progress">
        <span className="mono small" style={{ flex: "none" }}>
          {t("onb.step")} {Math.min(step + 1, steps.length)}/{steps.length}
        </span>
        <span
          className="dots"
          role="progressbar"
          aria-label={t("onb.step")}
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
        >
          {steps.map((s, i) => (
            <i key={s} className={i < step ? "done" : i === step ? "on" : ""} aria-hidden="true" />
          ))}
        </span>
      </div>

      {/* WHY THIS SCREEN. A learner who clicks a destination in the shell —
          "Learn", "My evidence" — is sent back here while their setup is
          unfinished. That is a real move and it used to happen in silence
          (the URL changed, everything else looked the same). The sentence the
          route contract already carries for this case says what the screen is
          and what happens next; standing here unexplained is how a first run
          loses someone. */}
      {pending && (
        <p className="small muted" style={{ margin: "0 0 4px" }}>💬 {t("state.newLearner")}</p>
      )}

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
          {/* The heading states what the learner is actually doing: it read
              "Create your account" while they were signing in, or explicitly
              skipping an account. All three strings already exist. */}
          <h1>{t(mode === "signin" ? "onb.signIn" : mode === "guest" ? "onb.guest" : "onb.acctTitle")}</h1>
          <p className="lead">{t("onb.acctLead")}</p>
          <div className="exercise" style={{ marginTop: 20 }}>
            {/* WHO IS THIS (§2). Two cards, each carrying what the choice
                MEANS for the person making it — not a pair of radio labels
                the learner has to interpret. The choice steers the whole
                product (a teacher's Home is a class list, a student's is
                today's task), so it is a real field on the account and it is
                asked here, in the open. */}
            <div className="pick" role="radiogroup" aria-label={t("onb.roleStudent")} style={{ marginBottom: 16 }}>
              {([
                ["student", "onb.roleStudent", "home.studentSub"],
                ["teacher", "onb.roleTeacher", "home.teacherSub"],
              ] as Array<["student" | "teacher", string, string]>).map(([r, key, sub]) => (
                <label key={r} className={role === r ? "on" : ""}>
                  <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} />
                  <span style={{ marginTop: 0 }}>
                    <b style={{ display: "block", fontSize: 16 }}>{t(key)}</b>
                    <span>{t(sub)}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="checks" style={{ flexWrap: "wrap", marginBottom: 16 }}>
              {([["signup", "onb.createAcct"], ["signin", "onb.signIn"], ["guest", "onb.guest"]] as Array<[Mode, string]>).map(([m, key]) => (
                <label key={m} className={mode === m ? "on" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <input type="radio" name="mode" checked={mode === m} onChange={() => pickMode(m)} />
                  {t(key)}
                </label>
              ))}
            </div>

            {mode !== "guest" && (
              <>
                <label className="field">
                  <span>{t("onb.email")}</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amina@example.org"
                    required
                    aria-required="true"
                    aria-invalid={invalid("email")}
                  />
                </label>
                {issueFor("email")}
                <label className="field">
                  <span>{t("onb.password")}</span>
                  <input
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-required="true"
                    aria-invalid={invalid("password")}
                  />
                </label>
                {issueFor("password")}
                {/* The neutral hint steps aside for the error rather than sitting
                    beside it saying the same thing twice. */}
                {acctSaid?.field !== "password" && <p className="small muted">{t("onb.pwNote")}</p>}
                {mode === "signup" && (
                  <label className="field">
                    <span>{t("onb.name")}</span>
                    <input
                      type="text"
                      autoComplete="name"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="amina_k"
                      maxLength={24}
                      required
                      aria-required="true"
                      aria-invalid={invalid("name")}
                    />
                  </label>
                )}
                {issueFor("name")}
              </>
            )}

            {/* Only offered when it can actually be honoured. A device that is
                already signed in holds SOMEONE'S learner — offering to "bring
                this device's progress" there means adopting another account's
                record (the server now refuses it), so the choice is not shown.
                A signed-out device keeps the offer: that profile may genuinely
                be anonymous work, and the server is the one that decides. */}
            {guestHere && !signedIn && mode !== "guest" && (
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

      {current === "goals" && (
        <>
          <h1>{t("onb.goalStep")}</h1>
          <p className="lead">{t("onb.goalLead")}</p>
          <div className="exercise" style={{ marginTop: 20 }}>
            {/* WHY they are here. Coarse motivation first — it is a click, and
                the plan reads it — then the learner's own words, which Home
                quotes back with the progress toward it. Both optional: a
                learner without a stated goal still gets the engine's plan. */}
            <label className="field">
              <span>{t("onb.intentLabel")}</span>
              <select value={intent} onChange={(e) => setIntent(e.target.value as typeof intent)}>
                <option value="">{t("onb.goalSkip")}</option>
                {([["exams", "intent.exams"], ["understand", "intent.understand"], ["project", "intent.project"], ["code", "intent.code"], ["competition", "intent.competition"], ["life", "intent.life"]] as Array<[typeof intent & string, string]>).map(([v, key]) => (
                  <option key={v} value={v}>{t(key)}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t("onb.goalLabel")}</span>
              <input
                type="text"
                value={goal}
                maxLength={200}
                placeholder={t("onb.goalPh")}
                onChange={(e) => setGoal(e.target.value)}
              />
            </label>
            <p className="small muted">{t("onb.goalNote")}</p>
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
                {CULTURES.map((c) => (
                  <option key={c.id} value={c.id}>{t(cultureLabel(c.id))}</option>
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
            {/* THE STEP CAN NOW SATISFY THE YEAR GROUP IT DEMANDS.

                A course has four parts (`CourseField`) and this step offered
                two of them — qualification and tier — while the gate it enforces
                wants all four. So a learner who left the year group alone on step
                2 (its default is the placeholder, so that is every learner who
                did not go looking) saw "Mathematics · needs a course", chose a
                qualification and a tier, and `Next` stayed dead with nothing
                left on the screen to change: measured live. Back was the only
                way out, and the label pointed at a field that was already set.

                The year group is asked for HERE, where it is required, and it
                is a disabled placeholder — on this route "I'm learning
                independently" is not a year group, so offering it would keep the
                learner in the same loop.

                THE COUNTRY GAP IS GONE, and the wall it made with it. This
                comment used to record a Back-only exit: `courseGaps` reported
                `country` missing for every country with no national route — 53
                of the 70 the picker offers — so on this screen `Next` could
                never enable and a learner who picked France, Germany, Japan or
                any of the other unmodelled countries was stuck on step 4 of 6
                for ever, with an account already created. That read as "sign-
                up is broken". The fix belongs to the gate and now lives in
                `courseGaps` (see the note there): an independent route IS a
                course, so an unmodelled country falls back to it instead of
                being refused, and the step offers that route's real grades and
                tiers. */}
            {courseMissing.some((m) => m.missing.includes("grade")) && (
              <label className="field">
                <span>{t("onb.grade")}</span>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  required
                  aria-required="true"
                >
                  {/* The prompt, not the label. This select's placeholder text
                      used to be `onb.grade` — the very words of its own <span>
                      — so a learner read the same phrase twice and concluded
                      there was nothing left to answer. */}
                  <option value="" disabled>{t("onb.pickGrade")}</option>
                  {(route?.grades ?? []).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
            )}
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
                    {/* WHICH part of the course is missing, not just "a course".
                        The step reports the gap per subject (`incompleteSubjects`
                        returns it) and used to throw it away for a phrase that
                        named no field — the same mistake the Home card made
                        before it named the field, and the one that turned this
                        step into a loop. */}
                    {missing.length > 0 && (
                      <span className="small muted">
                        {" · "}
                        {fill(t("next.courseMissing"), {
                          fields: missing.map((f) => t(FIELD_LABEL[f] as Parameters<typeof t>[0])).join(" · "),
                        })}
                      </span>
                    )}
                  </p>
                  <div className="grid cols2">
                    <label className="field">
                      <span>{t("onb.spec")}</span>
                      <select
                        value={chosen}
                        required
                        aria-required="true"
                        onChange={(e) => {
                          const pick = options.find((x) => x.id === e.target.value);
                          // THE TIER IS THE LEARNER'S OWN CHOICE. It used to be
                          // seeded to `pick.levels[0]` whenever the year group
                          // named no tier — and `levels[0]` is Foundation for the
                          // GCSE, so a learner who chose "GCSE" (and nothing
                          // else) was quietly enrolled at the easier tier, served
                          // at its difficulty and taught at its depth. That is
                          // the "the questions are too easy" complaint with a
                          // cause. Silence is not a choice: a qualification with
                          // a real tier choice now leaves it EMPTY, the step
                          // names the tier as the field it is waiting for (the
                          // gap line below), and `Next` waits for it. The year
                          // group still seeds a tier when it genuinely names one,
                          // and a course with a single tier has nothing to
                          // choose.
                          const level = pick
                            ? levelForGrade(pick, grade) ?? (pick.levels.length === 1 ? pick.levels[0] : null)
                            : null;
                          setCourses((prev) => ({ ...prev, [s]: { ...prev[s], spec: pick?.id, specLevel: level?.id } }));
                          // The flat fields follow the FIRST subject, which is
                          // what any single-course reader will see.
                          if (s === subjects[0]) {
                            setSpec(pick?.id ?? "");
                            setSpecLevel(level?.id ?? "");
                          }
                        }}
                      >
                        <option value="" disabled>{t("onb.pickSpec")}</option>
                        {options.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </select>
                    </label>
                    {/* Only a course with tiers has a level to choose, and a
                        control whose only option is a placeholder is a dead end
                        on the one step a learner cannot pass without answering:
                        it looks required, it cannot be answered, and the word in
                        it belonged to the field beside it. */}
                    {levels.length > 0 && (
                      <label className="field">
                        <span>{t("onb.level")}</span>
                        <select
                          value={courses[s]?.specLevel ?? ""}
                          required
                          aria-required="true"
                          onChange={(e) => {
                            setCourses((prev) => ({ ...prev, [s]: { ...prev[s], specLevel: e.target.value } }));
                            if (s === subjects[0]) setSpecLevel(e.target.value);
                          }}
                        >
                          {/* An unchosen tier says so. Without this the browser
                              paints the first tier as selected while the stored
                              value is empty, so the learner reads a choice they
                              never made. */}
                          <option value="" disabled>{t("onb.pickLevel")}</option>
                          {levels.map((l) => (
                            <option key={l.id} value={l.id}>{levelLabel(lang, l.tier, l.name)}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
            {boards.length > 0 && (
              <div className="field" role="radiogroup" aria-label={t("onb.board")}>
                <span>{t("onb.board")}</span>
                <div className="checks" style={{ flexWrap: "wrap" }}>
                  {boards.map((b) => (
                    <label key={b.id} className={board === b.id ? "on" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <input type="radio" name="board" checked={board === b.id} onChange={() => setBoard(b.id === board ? "" : b.id)} />
                      {b.name}
                    </label>
                  ))}
                </div>
              </div>
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
          {/* The lead is the screen's guidance, so it has to be TRUE of the
              screen: it used to promise "Subjects: Mathematics" while
              Mathematics was unchecked, above a `Next` that was disabled with no
              reason given. When nothing is chosen, the same line states the
              requirement instead. */}
          <p className="lead">
            {subjects.length === 0 ? t("onb.needSubject") : t("onb.subjectsNote")}
          </p>
          <div className="exercise" style={{ marginTop: 20 }}>
            <div className="checks" style={{ flexWrap: "wrap" }}>
              {SUBJECT_IDS.map((s) => (
                <label key={s} className={subjects.includes(s) ? "on" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={subjects.includes(s)} onChange={() => toggleSubject(s)} />
                  {t(SUBJECT_LABELS[s])}
                </label>
              ))}
            </div>
            {/* A radio GROUP is not a label. Wrapping the legend and every
                option in one <label> made the first option's accessible name the
                whole group — "MINUTES A DAY 10 min 20 min 30 min 45 min 60 min"
                — so a screen reader user could not hear the choices. The group
                is named as a group and each option names itself, which is the
                pattern the role picker above already uses. */}
            <div className="field" role="radiogroup" aria-label={t("onb.timePerDay")} style={{ marginTop: 16 }}>
              <span>{t("onb.timePerDay")}</span>
              <div className="checks" style={{ flexWrap: "wrap" }}>
                {[10, 20, 30, 45, 60].map((m) => (
                  <label key={m} className={timePerDay === m ? "on" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <input type="radio" name="time" checked={timePerDay === m} onChange={() => setTimePerDay(m)} />
                    {m} min
                  </label>
                ))}
              </div>
            </div>
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
            <div className="field" role="radiogroup" aria-label={t("acc.language")}>
              <span>{t("acc.language")}</span>
              <div className="checks" style={{ flexWrap: "wrap" }}>
                {(["mixed", "local"] as const).map((m) => (
                  <label key={m} className={termsMode === m ? "on" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <input type="radio" name="terms" checked={termsMode === m} onChange={() => setTermsMode(m)} />
                    {t(m === "mixed" ? "acc.termsMixed" : "acc.termsLocal")}
                  </label>
                ))}
              </div>
            </div>
            <p className="small muted">{t("lq.teachNote")}</p>
          </div>
        </>
      )}

      {err && <p className="marking bad" style={{ padding: "10px 14px" }}><span className="mark" aria-hidden="true">✗</span> {err}</p>}
      {notice && <p className="marking" style={{ padding: "10px 14px" }}>{notice}</p>}

      {/* The dead button, explained — beside it, in the learner's words, and
          read from the same gate that disabled it. */}
      {needText() && (
        <p className="field-error wizard-need" role="status">⚠ {needText()}</p>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {step > 0 && (
          <button className="btn" onClick={() => { setStep((s) => s - 1); setErr(""); }} disabled={busy}>
            ← {t("onb.back")}
          </button>
        )}
        {step < steps.length - 1 ? (
          <button className="btn" onClick={advance} disabled={!canAdvance() || busy || advancing} style={{ flex: 1 }}>
            {t("common.next")} →
          </button>
        ) : (
          <button className="btn" onClick={finish} disabled={busy} style={{ flex: 1 }}>
            {busy ? t("onb.settingUp") : `${t("onb.start")} →`}
          </button>
        )}
      </div>

      {/* Said once, where it is true: on the account step this reassures a
          first-time visitor that they do not have to configure everything now.
          On the subjects step the same sentence is already the lead (so it was
          printed twice), and on the steps after it the sentence is stale — it
          names Mathematics while the learner has just chosen two subjects. */}
      {current === "account" && (
        <p className="small muted" style={{ marginTop: 12 }}>
          🎓 {t("onb.subjectsNote")}
        </p>
      )}
    </main>
  );
}
