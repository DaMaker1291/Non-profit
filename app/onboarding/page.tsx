"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  claimGuestProfile, clearSession, createProfile, currentGuestClaim, loadLocalProfileId, recoverAccount, returnTarget, saveProfilePatch,
  signIn, signOut, signUp, storeDurability, useAccount, useI18n, useProfile,
} from "@/lib/client";
import { courseIsReady, settlementTarget } from "@/lib/app-state";
import { COUNTRIES, LANGS } from "@/lib/i18n";
import { SUBJECT_IDS, SUBJECT_LABELS } from "@/lib/subjects";
import { type ProfileState, type SubjectId } from "@/lib/types";
import { Loading } from "@/components/states";

// ─────────────────────────────────────────────────────────────────────────────
// Real enrolment, in THREE screens: an account (or an honest "not yet"), where
// the learner is and the language they read, and what they study. The course,
// the exam date, the daily budget, the goal and the teaching/terminology choices
// are asked later, where they can be answered with something to go on
// (`/curriculum` and `/access`), because a sign-up is the worst moment to ask a
// tired learner to pick a tier they have not been taught yet.
//
// Every step writes to the real learner profile — the same ProfileState the
// question engine, the diagnostic and the Mind map read.
// ─────────────────────────────────────────────────────────────────────────────

type Mode = "signup" | "signin" | "guest";

const ERROR_KEYS: Record<string, string> = {
  // THE ONE OUTCOME THAT IS ABOUT THE NETWORK. `lib/client.tsx#reasonOf` says
  // `unreachable` only when the call never reached the server, so this sentence
  // — the one this form used to print for EVERY failure, including a 401 — is
  // now printed for exactly the case it describes.
  unreachable: "onb.errCreate",
  email_taken: "onb.errTaken",
  bad_email: "onb.errEmail",
  weak_password: "onb.errPassword",
  long_password: "onb.errPassword",
  bad_credentials: "onb.errCreds",
  bad_name: "onb.errName",
  signup_failed: "onb.errCreate",
  login_failed: "onb.errCreds",
  // The one refusal the limiter makes, and it is about the NETWORK rather than
  // the account (a source address that has spent its budget). Saying "could not
  // create your profile" here would blame the learner's connection for an
  // attempt count, and saying "wrong password" would be a lie about their own
  // account — so it has its own sentence, in every dictionary.
  too_many_attempts: "onb.errTooMany",
  // The deployment's ingress did not prove this request came through it. The
  // learner cannot fix that by retrying, so the message names who can.
  untrusted_ingress: "onb.errIngress",
};

/** THE THREE OUTCOMES, KEPT APART BECAUSE THEY NEED DIFFERENT ACTIONS.
 *
 *  This form used to print one sentence — "check your connection" — for all
 *  three. Measured: a 401 from the server rendered exactly that, so a learner
 *  with working internet was sent to fix the one thing that was working.
 *
 *    unreachable  nobody answered. The connection sentence is TRUE here, and it
 *                 is the only code that earns it (lib/client.tsx#reasonOf).
 *    known        a refusal this form already has a sentence for (a taken
 *                 email, a weak password) — no code shown, the sentence says it.
 *    unauthorized the device's stored id+secret does not own that record. There
 *                 is nothing to retry, so it gets its own sentence, its code,
 *                 and the one action that can work (onb.freshStart).
 *
 *  Anything else is the server saying no for a reason no screen knows: say so,
 *  in a sentence that does not blame the connection, and print the code beside
 *  it for whoever has to act on it. A code is never a sentence.
 */
function errorFor(code: string, t: (key: string) => string): { message: string; code: string; fresh: boolean } {
  if (code === "unauthorized") {
    return { message: t("onb.errNotYours"), code, fresh: true };
  }
  const known = ERROR_KEYS[code];
  if (known) return { message: t(known), code: "", fresh: false };
  return { message: t("onb.errRefused"), code: code || "unknown", fresh: false };
}

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
  // ── The recovery code, and the two ways to use one ──────────────────────
  //
  // WHY IT IS HELD HERE rather than shown inside the account step: a sign-up
  // finishes with a redirect, so a code rendered in the form would be unmounted
  // before it could be read. `recoveryCode` therefore takes over the page for one
  // screen, between "account created" and "where you are going", and the learner
  // cannot leave without either printing it or saying they saved it — a code that
  // can be skipped is a code that will be skipped.
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryFresh, setRecoveryFresh] = useState(false);
  const [pendingTarget, setPendingTarget] = useState("");
  // The recovery form itself: a lost password, a code, and the new one.
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recoverCode, setRecoverCode] = useState("");
  const [recoverNew, setRecoverNew] = useState("");
  const [recoverErr, setRecoverErr] = useState("");
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
    setErrCode("");
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
    // WHO IS THIS is a real parameter, not only a radio on the first screen:
    // /teacher sends somebody here as a TEACHER (`?role=teacher`), and the
    // answer steers the whole wizard — the role is chosen by the door they came
    // through rather than re-asked, and the steps below follow it. An explicit
    // value wins over the default either way.
    const forcedRole = params.get("role");
    if (forcedRole === "teacher" || forcedRole === "student") setRole(forcedRole);
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
  /** DOES THIS DEPLOYMENT KEEP WHAT IT IS ABOUT TO BE GIVEN?
   *
   *  An instance that declared `OPENMIND_ALLOW_EPHEMERAL_STORE` is permitted to
   *  write a learner's record, and it is expected to lose every one of them when
   *  it restarts — Render's free tier sleeps after fifteen idle minutes and
   *  comes back with an empty /tmp, so an account made at nine in the morning is
   *  gone by lunchtime. The learner is the one who pays for that, and until this
   *  probe existed nobody told them: the failure they saw was "my email and
   *  password are not recognised", which is indistinguishable from a bug in the
   *  sign-in form.
   *
   *  Read from /api/health because that is the cheap, public, already-documented
   *  statement of the durability judgement (lib/env.ts owns the rule). A failed
   *  probe leaves the notice off rather than guessing — it is a disclosure, not
   *  a gate, and it must never be the reason the form does not work. */
  const [ephemeralStore, setEphemeralStore] = useState(false);
  useEffect(() => {
    let live = true;
    storeDurability().then((word) => {
      if (live && word === "ephemeral") setEphemeralStore(true);
    });
    return () => { live = false; };
  }, []);

  // THREE THINGS, AND NOTHING ELSE. Country (which decides the curriculum),
  // language (which decides how every screen after this one speaks), and the
  // subject list (which decides the diagnostic). The course, the exam date, the
  // daily budget, the goal and the teaching/answer/terminology choices are all
  // asked later, on `/curriculum` and `/access`, where the learner has seen what
  // a plan looks like and can answer them with something to go on.
  const [country, setCountry] = useState("XX");
  const [subjects, setSubjects] = useState<SubjectId[]>(["maths"]);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  /** The server's own refusal code, when the failure had one. Rendered beside the
   *  sentence — never instead of it — so a learner can read the message and the
   *  person helping them can act on the name. */
  const [errCode, setErrCode] = useState("");
  /** True when the device holds a record it cannot write to (the 401 case), so
   *  the one useful action — start over here, without touching the server's
   *  copy — is offered instead of a retry that cannot work. */
  const [canFreshStart, setCanFreshStart] = useState(false);
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
  // Captured ONCE, before any sign-in can overwrite localStorage. Reading it at
  // submit time would name the account's fresh profile and claim nothing.
  const guestClaim = useMemo(() => currentGuestClaim(), []);
  const guestHere = guestClaim !== null;
  const signedIn = Boolean(session.account);

  // ── THREE SCREENS, AND NOTHING THAT CAN BE ASKED LATER ──────────────────
  //
  // The wizard used to be six: account, about, subjects, course, goals, teach.
  // Every one was optional except the first three, and the three that are gone
  // each had a better home — the course is a card on Home (`CourseFirst`) that
  // sends the learner to /curriculum with the field it is missing named, the
  // goal and the exam date belong to a plan the learner can shape once they have
  // seen one, and the teaching/answer languages default to the language this
  // screen is being read in. What is left is the information without which no
  // 
  // screen after this can do anything: who the account is, where they are (which
  // decides the curriculum), and what they study (which decides the diagnostic).
  //
  // FEWEST TAPS IS ALSO A CURRICULUM RULE, not only a courtesy: an unchosen
  // course is "not chosen" and is reported by `courseGaps`, whereas a course
  // picked by a tired learner at the end of a sign-up is the Foundation tier the
  // old wizard used to seed for them. Deferring it keeps that choice explicit.
  const learnerSteps = signedIn
    ? ["about", "subjects"]
    : ["account", "about", "subjects"];
  // A TEACHER'S SETUP IS NOT A LEARNER'S (see app/teacher/page.tsx, which sends
  // them here). "What are you studying?", "which tier do you sit?" and "what is
  // your goal?" are questions about the person being TAUGHT — and the course
  // step's gate then holds `Next` until a paper has been chosen, so a teacher
  // had to enrol themselves in a qualification they would never sit before they
  // were allowed to make a class. Their setup is the account, who they are, and
  // the languages their school works in; the curriculum is declared per CLASS,
  // where one teacher can teach Year 10 Maths and Year 12 Physics at once.
  // A teacher's setup is the account, where they are (it scopes the classes they
  // declare), and — for a new account — the screen that creates it. Their school
  // language defaults to the one they are reading; the curriculum is declared per
  // CLASS, where a teacher may teach two year groups in one day.
  const steps = isTeacherAccount
    ? (signedIn ? ["about"] : ["account", "about"])
    : learnerSteps;
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
  }

  /** Everything the enrolment collected, in the shape /api/profile accepts. */
  function enrolment() {
    return {
      handle: handle.trim() || undefined,
      country,
      language: lang,
      // The three taught/answered/school languages follow the one the learner
      // just chose, because the screens that could have differed are deferred and
      // a profile left at the server's "en" would explain a French sign-up in
      // English. `/access` changes each of them independently later.
      teachingLang: lang,
      answerLang: lang,
      schoolLang: lang,
      // A teacher's own subject list is not a course they sit, and the step that
      // would have collected it is not shown to them — sending the form's
      // DEFAULT here (["maths"]) would enrol a physics teacher in mathematics.
      // An EMPTY list is the true statement and the server reads it that way:
      // `if (Array.isArray(body.subjects) && body.subjects.length)` leaves the
      // stored list alone, so "I did not say" cannot be mistaken for "I study
      // nothing", and a sign-up falls back to the same default as before.
      subjects: isTeacherAccount ? [] : subjects,
      // The learner's own words for why they are here are asked later, on
      // `/access`; the field is part of the create payload, so it is stated as
      // empty rather than implied.
      goal: "",
      onboarded: true,
    };
  }

  /** The button's handler. A thin wrapper so the enrolment body below can be
   *  re-entered with a recovery code WITHOUT an `onClick` event becoming that
   *  argument — `onClick={finish}` passes a MouseEvent, and a truthy object in a
   *  `string` slot is exactly the kind of mistake that renders "[object Object]"
   *  as somebody's recovery code. */
  async function finish() {
    await finishWithRecovery("");
  }

  async function finishWithRecovery(recoveredCode: string) {
    setBusy(true);
    setErr("");
    setErrCode("");
    try {
      // The recovery code this pass produced: minted by a sign-up, or carried in
      // from a successful recovery (whose old code is now dead). Held here rather
      // than in state because the redirect below is decided in this same pass, and
      // a state update made mid-function is not visible to the branch that decides
      // to skip it.
      let minted = recoveredCode;
      if (!signedIn) {
        if (mode === "signup") {
          const created = await signUp({
            email, password, name: handle.trim(), country, language: lang,
            subjects, claimCurrent: claim && guestHere, role,
          });
          minted = created.recoveryCode ?? "";
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
      // WHAT THIS CONDITION USED TO BE, AND WHY IT WAS THE BUG. It required
      // `!wanted` — and the ticket is almost never absent: the guard attaches
      // `?return=`, and the landing page's "Go to your dashboard" is a ticket
      // into a diagnosed-gated page. So a signed-in teacher who followed either
      // fell through to the learner path below, whose only outcomes are
      // `/dashboard` or a BASELINE DIAGNOSTIC, and arrived at question 01 of a
      // maths diagnostic they never asked for, in a subject they may not teach.
      // That is precisely the measurement the comment above refuses to take.
      //
      // A teacher's own platform is therefore the default, and a ticket to it is
      // honoured. A ticket to a page they can genuinely open (their own learner
      // Home — the guard now lets a teacher in there, see lib/app-state.ts#MET)
      // is honoured too, by falling through to the learner path with the
      // measurement requirement subtracted below. A teacher is never sent to be
      // measured; they may still choose to be.
      // ONE OWNER FOR WHERE THIS ENDS: `settlementTarget` is pure and swept in
      // `npm run verify` over the cases that broke — a teacher with a learner
      // ticket and a teacher without one. Re-deriving the branch here by hand is
      // exactly how a teacher got a maths diagnostic.
      // THE DESTINATION IS DECIDED HERE, ONCE. The recovery screen is a detour on
      // the way there, not a second decision — so the target is computed now and
      // pushed when the learner has acknowledged the code. Re-deriving it after the
      // detour would be a second copy of the rule that sends a teacher to their
      // platform instead of a diagnostic (the bug `settlementTarget` exists for).
      const target = settlementTarget({
        isTeacher: isTeacherAccount,
        guest: mode === "guest",
        wanted,
        already,
        subject,
        // The course is chosen on /curriculum, not here: a new learner always
        // answers NO to this and is sent there next, because the baseline
        // diagnostic samples a course and would otherwise measure a fallback
        // syllabus. A returning learner who merely patched a subject keeps the
        // course they already had and is not sent back through it.
        courseComplete: saved ? courseIsReady(saved) : false,
      });
      if (minted) {
        setRecoveryCode(minted);
        setRecoveryFresh(false);
        setPendingTarget(target);
        setBusy(false);
        return;
      }
      router.push(target);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      // A REFUSAL IS NOT AN OUTAGE — see `errorFor`, which is where the three
      // outcomes (unreachable / known refusal / everything else) are kept apart.
      const shown = errorFor(code, t);
      setErr(shown.message);
      setErrCode(shown.code);
      setCanFreshStart(shown.fresh);
      // Send the learner back to the step that owns the failure.
      if (code === "email_taken" || code === "bad_email" || code === "weak_password" || code === "bad_credentials") {
        setStep(0);
      }
      setBusy(false);
    }
  }

  /** THE WAY OUT OF A RECORD THIS DEVICE CANNOT WRITE.
   *
   *  A 401 on save means the stored id+secret pair does not own a record the
   *  server still has — a second account claimed it, the store was restored from
   *  another copy, or the two halves were paired wrongly once. Retrying cannot
   *  fix that, and until this button existed the learner's only escape was
   *  clearing site data by hand, so the form offered the one thing that could
   *  never work while telling them to try it again.
   *
   *  This drops the identity — and the account session, if the device is signed
   *  in, because a session that cannot write to the record it names is no use
   *  here — and re-enters `finish`. With no id left, the form CREATES a profile
   *  instead of patching one. Nothing on the server is erased: the old record
   *  stays exactly where it is, reachable by whoever owns it.
   */
  async function startFreshProfile() {
    setErr("");
    setErrCode("");
    setCanFreshStart(false);
    if (signedIn) {
      try {
        await signOut();
      } catch {
        // The identity is cleared below either way; a failed sign-out only
        // leaves a cookie the next request will be refused by, not data lost.
      }
    }
    clearSession();
    await finishWithRecovery("");
  }

  /**
   * Get back in with a recovery code, then finish enrolment normally.
   *
   * The password field above holds the password the learner has FORGOTTEN — that
   * is what put them here — so this asks for a new one rather than reusing it. On
   * success the server has already revoked every old session and rotated the code,
   * and `finish`'s own second half runs against the recovered learner: the profile
   * patch, the shell refresh, and the destination.
   */
  async function useRecovery() {
    setBusy(true);
    setErr("");
    setErrCode("");
    setRecoverErr("");
    try {
      const recovered = await recoverAccount({
        // Empty is meaningful: a teacher's grant carries its own lookup key, so the
        // learner who cannot remember which address they typed can still get in.
        email: email.trim() || undefined,
        code: recoverCode,
        newPassword: recoverNew,
      });
      // The recovered session is adopted by `recoverAccount`, so the enrolment
      // half runs against the recovered learner. The NEW code is passed in: the old
      // one is dead the moment this succeeded, and a recovery that ends without
      // showing the replacement leaves the learner one forgotten password away from
      // losing the record again. `finishWithRecovery` shows it before navigating.
      setBusy(false);
      setRecoverOpen(false);
      await finishWithRecovery(recovered.recoveryCode ?? "");
    } catch {
      setRecoverErr(t("rec.err"));
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
      // A NAME IS NOT REQUIRED TO START. `handle` is optional end-to-end, and
      // asking for it at the door is one more field between a learner and their
      // first question; the "about" screen asks for it once, prefilled from here
      // when they did type one. The field stays on this screen because it is the
      // one place an account can set it before the profile exists.
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
    // At least one subject, because the next screen is a diagnostic IN one. The
    // sentence beside the button is the same one the screen's lead prints when
    // the list is empty, so the gate and its explanation cannot disagree.
    if (current === "subjects") return subjects.length > 0;
    return true;
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

  // ── THE RECOVERY CODE, ON ITS OWN SCREEN ──────────────────────────────────
  //
  // PRINTED, not merely displayed. The learner's next device may not be this one,
  // and a code that exists only until the tab closes is not a recovery code —
  // which is also why there is no way past this screen except print or "I have
  // saved it". A dismissal button here would be used, and the learner who used it
  // is the one who needed the code.
  //
  // It takes over the page rather than sitting inside the wizard because a
  // successful sign-up is followed by a redirect: anything rendered inside the
  // account step is unmounted before it can be read or written down.
  if (recoveryCode) {
    return (
      <main className="container narrow page">
        <p className="eyebrow">{t("rec.title")}</p>
        <h1>{t(recoveryFresh ? "rec.new" : "rec.title")}</h1>
        <p className="lead">{t("rec.lead")}</p>
        <div className="card" style={{ marginTop: 16, textAlign: "center" }}>
          <p className="mono" style={{ fontSize: 26, letterSpacing: 2, margin: "10px 0" }} aria-live="polite">
            {recoveryCode}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="btn ghost" type="button" onClick={() => window.print()} style={{ flex: 1 }}>
            {t("rec.print")}
          </button>
          <button
            className="btn primary"
            type="button"
            // `pendingTarget` is always set by `finishWithRecovery`, which is the
            // only thing that puts this screen on the page. Disabling rather than
            // substituting a default route is deliberate: a recovery screen that
            // guessed where to go would be a second owner of the destination the
            // access contract already decides.
            disabled={!pendingTarget}
            onClick={() => {
              const target = pendingTarget;
              setRecoveryCode("");
              setPendingTarget("");
              if (target) router.push(target);
            }}
            style={{ flex: 1 }}
          >
            {t("rec.saved")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container narrow page">
      <p className="eyebrow">
        {t(isTeacherAccount ? "teach.entryTitle" : "onb.title")}
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
        <p className="small muted" style={{ margin: "0 0 4px" }}> {t("state.newLearner")}</p>
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
            {/* A RADIO GROUP IS A GROUP. These three are one choice about how to
                start, so they carry a group name of their own — otherwise a
                screen reader reads three loose radios under the role cards
                above them, which is a different question. */}
            <div className="checks" role="radiogroup" aria-label={t("onb.setup")} style={{ flexWrap: "wrap", marginBottom: 16 }}>
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

            {/* THE DISCLOSURE SITS WHERE THE ACCOUNT IS MADE. A demo instance is
                allowed to keep nothing — that is what its operator declared —
                but it may not be QUIET about it while a learner types a
                password it will forget. */}
            {ephemeralStore && mode !== "guest" && (
              <p className="alert small" style={{ marginTop: 12 }}>⚠ {t("onb.ephemeral")}</p>
            )}

            <p className="small muted" style={{ marginTop: 12 }}>
              {mode === "guest" ? t("onb.guestNote") : t("onb.verifyNote")}
            </p>

            {/* ── LOCKED OUT ─────────────────────────────────────────────────

                A sign-in form with no way back is how a learner loses their
                record, and this deployment has no mail service to send a reset
                link — so the way back is a code they were given at sign-up, or a
                short-lived one their teacher reads out. Both are accepted here,
                and the email may be left empty for the teacher's code because it
                carries its own account lookup key.

                Shown only in sign-in mode: offering "forgotten your password?" to
                somebody creating an account is a distraction from the step they
                came to do. */}
            {mode === "signin" && (
              <div style={{ marginTop: 12 }}>
                {!recoverOpen ? (
                  <button
                    className="btn ghost small"
                    type="button"
                    onClick={() => { setRecoverOpen(true); setRecoverErr(""); }}
                  >
                    {t("rec.forgot")}
                  </button>
                ) : (
                  <div className="exercise">
                    <label className="field">
                      <span>{t("rec.emailHint")}</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </label>
                    <label className="field">
                      <span>{t("rec.title")}</span>
                      <input
                        type="text"
                        value={recoverCode}
                        onChange={(e) => setRecoverCode(e.target.value)}
                        autoComplete="one-time-code"
                        inputMode="text"
                        spellCheck={false}
                        placeholder="ABCD-EFGH-JKMN-PQRS"
                      />
                    </label>
                    <label className="field">
                      <span>{t("acct.newPw")}</span>
                      <input
                        type="password"
                        value={recoverNew}
                        onChange={(e) => setRecoverNew(e.target.value)}
                        autoComplete="new-password"
                      />
                    </label>
                    {recoverErr && <p className="small" role="alert">{recoverErr}</p>}
                    <button className="btn primary" type="button" onClick={useRecovery} disabled={busy}>
                      {t("rec.use")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {current === "about" && (
        <>
          <h1>{t("onb.about")}</h1>
          {/* A TEACHER'S LEAD IS THE TEACHER'S (teach.entryBody, authored in all
              15 dictionaries): "a teacher account holds your classes, not your
              learning … you are not put through a learner's setup or a baseline
              diagnostic". The learner's lead promised the opposite — that
              OpenMind would adapt "teaching language, examples, difficulty and
              your learning path" — to somebody who is here to teach. */}
          <p className="lead">{isTeacherAccount ? t("teach.entryBody") : t("onb.lead")}</p>
          <div className="exercise" style={{ marginTop: 20 }}>
            <label className="field">
              <span>{t("onb.name")}</span>
              <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="amina_k" maxLength={24} />
            </label>
            {/* WHERE THEY ARE AND WHAT THEY READ. Country decides the
                curriculum, the grades and the boards this learner will be
                offered LATER on /curriculum; language is the one the product
                speaks to them in from the next screen on. Two selects, both
                with a true default, so the screen can be passed without a tap
                if neither is wrong. */}
            <div className="grid cols2">
              <label className="field">
                <span>{t("onb.where")}</span>
                <select value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>{t("onb.language")}</span>
                <select value={lang} onChange={(e) => setLang(e.target.value)}>
                  {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native} — {l.name}</option>)}
                </select>
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
          </div>
        </>
      )}

      {err && (
        <div className="marking bad" style={{ padding: "10px 14px" }} role="alert">
          <p><span className="mark" aria-hidden="true">✗</span> {err}</p>
          {errCode && (
            <p className="small" style={{ marginTop: 6 }}>
              code: <code>{errCode}</code>
            </p>
          )}
          {canFreshStart && (
            <p style={{ marginTop: 10 }}>
              <button className="btn" onClick={startFreshProfile} disabled={busy}>
                {t("onb.freshStart")}
              </button>
            </p>
          )}
        </div>
      )}
      {notice && <p className="marking" style={{ padding: "10px 14px" }}>{notice}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {step > 0 && (
          <button className="btn" onClick={() => { setStep((s) => s - 1); setErr(""); setErrCode(""); }} disabled={busy}>
            ← {t("onb.back")}
          </button>
        )}
        {step < steps.length - 1 ? (
          <button className="btn" onClick={advance} disabled={!canAdvance() || busy || advancing} style={{ flex: 1 }}>
            {t("common.next")} →
          </button>
        ) : (
          <button className="btn" onClick={finish} disabled={busy} style={{ flex: 1 }}>
            {/* The button names where it goes. "Start learning" over a teacher's
                last step is the learner's word for it, and it was the last thing
                a teacher read before arriving somewhere they had not been
                promised — their class list. The destination is the same one the
                eyebrow and the landing page name (`teach.title`). */}
            {busy ? t("onb.settingUp") : `${isTeacherAccount ? t("teach.title") : t("onb.start")} →`}
          </button>
        )}
      </div>

      {/* Said once, where it is true: on the account step this reassures a
          first-time visitor that they do not have to configure everything now.
          On the subjects step the same sentence is already the lead (so it was
          printed twice), and on the steps after it the sentence is stale — it
          names Mathematics while the learner has just chosen two subjects. */}
      {current === "account" && (
        <p className="small muted" style={{ marginTop: 12 }}>{t("onb.subjectsNote")}</p>
      )}
    </main>
  );
}
