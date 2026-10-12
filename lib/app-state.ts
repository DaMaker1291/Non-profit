// ─────────────────────────────────────────────────────────────────────────────
// OpenMind as a STATEFUL application, not a set of pages.
//
// The lifecycle is: landing → account → onboarding → baseline diagnostic →
// personal plan → Home → session → result → model updated → new next step.
// Routing is derived from state here, in one pure function, so every surface
// agrees about where a learner actually is — instead of each page guessing and
// a brand-new learner being dropped on a mastery dashboard showing 0%.
//
// Pure and dependency-free: the client derives it for navigation, and the same
// function can gate a server route without a second implementation.
// ─────────────────────────────────────────────────────────────────────────────

import type { ProfileState } from "./types";

export type AppStage = "welcome" | "onboarding" | "diagnostic" | "home";

export interface AppStateInput {
  /** Is there an authenticated account on this device? */
  signedIn: boolean;
  /** The learner profile, or null when there is none yet. */
  profile: ProfileState | null;
  /**
   * Is the SESSION's account a teacher (or a school)? A teacher account owns a
   * learner profile like everybody else — but that profile is not who they came
   * here as. Without this input an enrolled teacher with no diagnostic resolved
   * to `stage: "diagnostic"`, `route: "/diagnostic/maths"`: the landing page's
   * resume card offered them a baseline sitting in a subject they may not teach,
   * and every surface that reads the stage treated them as a learner waiting to
   * be measured. See the teacher branch in `deriveAppState`.
   */
  isTeacher?: boolean;
}

export interface AppState {
  stage: AppStage;
  /** Where the learner should be sent next. */
  route: string;
  /** i18n key naming the transition — the screen says WHY it moved you. */
  reasonKey: string;
  /** Enrolment finished (country, course, subjects, language recorded). */
  onboarded: boolean;
  /** At least one diagnostic has been recorded against this profile. */
  diagnosed: boolean;
  /** Subject the baseline diagnostic should be sat in. */
  diagnosticSubject: string;
  /** Questions this learner has answered — evidence of a real history. */
  attempts: number;
}

const SUBJECTS = ["maths", "physics", "chemistry", "biology", "computing"];

/**
 * WHICH SUBJECTS THIS LEARNER HAS BEEN DIAGNOSED IN — one entry per subject,
 * however many times they have sat it.
 *
 * A diagnostic's key is `subject:startedAt` (lib/types.ts#diagnostics), so the
 * record is a set of RUNS, not a set of subjects. A surface that reads the keys
 * and prints each one's subject part therefore prints one word per run, and a
 * learner who re-sits the diagnostic — which the product invites — read
 * "Diagnostic · Mathematics · Mathematics · Mathematics · Mathematics" on Home:
 * four identical words and no information. The claim the record supports is
 * WHICH SUBJECTS have been measured; how many runs there were is the progress
 * page's number, shown beside the gain each run measured.
 *
 * Order is first appearance in the record, so a learner's own list is stable
 * rather than dependent on the key order of a map.
 */
export function diagnosedSubjects(state: ProfileState | null | undefined): string[] {
  const out: string[] = [];
  for (const key of Object.keys(state?.diagnostics ?? {})) {
    const subject = key.split(":")[0];
    if (subject && !out.includes(subject)) out.push(subject);
  }
  return out;
}

/**
 * The single source of truth for "where is this learner in the lifecycle".
 *
 * Note the deliberate strictness: enrolment counts as done only when the
 * profile carries `onboardedAt`. A profile that merely exists (created lazily
 * by the wedge) is *not* enrolled, so it is sent through onboarding once —
 * which is what makes the course, tier and board real for the paper engine.
 */
export function deriveAppState({ signedIn, profile, isTeacher }: AppStateInput): AppState {
  const attempts = profile
    ? Object.values(profile.progress).reduce((s, p) => s + (p.attempts ?? 0), 0)
    : 0;
  const subject = profile?.profile.subjects.find((s) => SUBJECTS.includes(s)) ?? "maths";

  if (!profile) {
    return {
      stage: "welcome",
      route: "/onboarding",
      reasonKey: signedIn ? "state.noProfile" : "state.newLearner",
      onboarded: false,
      diagnosed: false,
      diagnosticSubject: subject,
      attempts: 0,
    };
  }

  const onboarded = typeof profile.profile.onboardedAt === "number";
  if (!onboarded) {
    return {
      stage: "onboarding",
      route: "/onboarding",
      reasonKey: "state.needsOnboarding",
      onboarded,
      diagnosed: false,
      diagnosticSubject: subject,
      attempts,
    };
  }

  const diagnosed = Object.keys(profile.diagnostics ?? {}).length > 0;
  // A TEACHER'S HOME IS THE WORK THEY SET, AND THEY ARE NOT WAITING TO BE
  // MEASURED. An account that teaches is enrolled and holds a profile; it may
  // never carry a diagnostic, and that is not a step it skipped — it is a
  // measurement it was never for (`teach.entryBody`, in all 15 languages: "You
  // are not put through a learner's setup or a baseline diagnostic").
  //
  // Read AFTER the enrolment check (a teacher still finishes the wizard) and
  // BEFORE the diagnostic check, which is the branch that used to hand them a
  // maths sitting, in a subject they may not teach, for somebody who came here
  // to teach it. "home" then means the same thing for both people: you are where
  // you belong.
  if (isTeacher) {
    return {
      stage: "home",
      route: TEACHER_HOME,
      reasonKey: "state.ready",
      onboarded,
      diagnosed,
      diagnosticSubject: subject,
      attempts,
    };
  }
  if (!diagnosed) {
    return {
      stage: "diagnostic",
      route: `/diagnostic/${subject}`,
      reasonKey: "state.needsDiagnostic",
      onboarded,
      diagnosed,
      diagnosticSubject: subject,
      attempts,
    };
  }

  return {
    stage: "home",
    route: "/dashboard",
    reasonKey: "state.ready",
    onboarded,
    diagnosed,
    diagnosticSubject: subject,
    attempts,
  };
}

/** A teacher's own platform — the class list they set work from. */
export const TEACHER_HOME = "/teacher";

/**
 * WHERE THIS PERSON'S OWN HOME IS — one question, one owner.
 *
 * `deriveAppState` already answers it for both (the teacher branch above puts an
 * account that teaches on `TEACHER_HOME`, a learner on `/dashboard`). This names
 * the same rule as a function because the NAVIGATION has to ask it as well, and a
 * nav that re-derived it would be the second implementation of a one-line rule —
 * exactly the shape that lets a teacher's Home item point at a learner's
 * dashboard while the lifecycle says otherwise.
 */
export function homeRouteFor(lifecycle: Pick<Lifecycle, "isTeacher">): string {
  return lifecycle.isTeacher ? TEACHER_HOME : "/dashboard";
}

/** Is a stage one we should actively move the learner out of? */
export function isBlockingStage(stage: AppStage): boolean {
  return stage === "onboarding" || stage === "diagnostic";
}

// ─────────────────────────────────────────────────────────────────────────────
// THE EXPLICIT LIFECYCLE (P0). `deriveAppState` answers "where does this learner
// belong" — but it takes answers it cannot verify. Both of its inputs are
// nullable in practice: the session probe is in flight, and the profile is
// being fetched. `null` therefore meant several different things at once, and a
// page that treated "no profile yet" as "no learner" bounced a signed-in
// learner back to sign-up. This block makes the difference representable.
//
// The rule this encodes: NOTHING may be concluded about a learner while the
// session is still being probed. Boot is a state, not an absence.
// ─────────────────────────────────────────────────────────────────────────────

/** Where the session probe is. `booting` is the state that must never be
 *  mistaken for `signed_out`. */
export type AuthStatus = "booting" | "signed_out" | "signed_in";

/** Where the profile fetch is. `loading` is a wait, `missing` is a fact. */
export type ProfileStatus = "loading" | "missing" | "incomplete" | "complete";

export interface LifecycleInput {
  auth: AuthStatus;
  profileStatus: ProfileStatus;
  profile: ProfileState | null;
  /**
   * Is the SESSION's account a teacher (or a school)? A teacher account owns a
   * learner profile like everybody else, but it is not a learner to be measured
   * — `teach.entryBody` says so in all 15 languages: "You are not put through a
   * learner's setup or a baseline diagnostic". The guard did not know, so a
   * teacher who clicked Home was refused `/dashboard` and moved to
   * `/diagnostic/maths?return=/dashboard`, in a subject they may not teach.
   */
  isTeacher?: boolean;
}

/** The learner's position, with no null that carries two meanings. */
export interface Lifecycle extends Omit<AppState, "stage"> {
  stage: AppStage;
  /** True until the session probe has answered. Nothing about the learner is
   *  knowable yet, and no surface may act on the rest of these fields. */
  booting: boolean;
  auth: AuthStatus;
  profileStatus: ProfileStatus;
  /** The learner identity in force, once one exists. */
  profileId: string | null;
  /** Set only when the learner exists but the diagnostic has not been sat. */
  diagnosticSubject: string;
  /** The session's account is a teacher/school: never sent to be measured. */
  isTeacher: boolean;
}

export function profileStatusOf(profile: ProfileState | null): ProfileStatus {
  if (!profile) return "missing";
  return typeof profile.profile.onboardedAt === "number" ? "complete" : "incomplete";
}

/**
 * The single derivation every surface reads. `deriveAppState` is still the
 * decision function — this only makes its two unknowable inputs explicit, so a
 * caller can tell "we do not know yet" apart from "we know: no learner".
 */
export function deriveLifecycle({ auth, profileStatus, profile, isTeacher }: LifecycleInput): Lifecycle {
  const teacher = isTeacher === true;
  const booting = auth === "booting" || profileStatus === "loading";
  if (booting) {
    return {
      booting: true,
      auth,
      profileStatus,
      isTeacher: teacher,
      stage: "welcome",
      route: "",
      reasonKey: "state.booting",
      onboarded: false,
      diagnosed: false,
      diagnosticSubject: "maths",
      attempts: 0,
      profileId: null,
    };
  }
  const base = deriveAppState({ signedIn: auth === "signed_in", profile, isTeacher: teacher });
  return {
    ...base,
    booting: false,
    auth,
    profileStatus: profileStatusOf(profile),
    profileId: profile?.profile.id ?? null,
    isTeacher: teacher,
  };
}

// ── The route access contract ────────────────────────────────────────────────
// One vocabulary for "what does this route require", so no page has to invent
// its own `if (!signedIn)`. Longest matching prefix wins, and the DEFAULT for an
// unknown path is `public`: a page we have not classified is better off
// rendering than redirecting, because a wrong redirect is a lost learner while
// a missing gate is only a missing gate. New pages should be classified
// deliberately — see ROUTE_ACCESS.

export type AccessRequirement = "public" | "authenticated" | "onboarded" | "diagnosed";

const ACCESS: Record<string, AccessRequirement> = {
  // Public: usable with no learner at all. The wedge (`/solve`, `/try`) is
  // anonymous-first BY DESIGN — gating it would destroy the whole point.
  "/": "public",
  "/about": "public",
  "/help": "public",
  "/solve": "public",
  "/try": "public",
  "/tutor": "public",
  "/access": "public",
  "/offline": "public",
  "/genome": "public",
  "/curriculum": "public",
  "/rooms": "public",
  "/hub": "public",
  "/teacher": "public",
  // Onboarding is where signed-out and un-enrolled learners are SENT, so it
  // can never require anything — otherwise every redirect would loop.
  "/onboarding": "public",

  // Needs an account (or a profile) but no enrolment: the account screen and
  // the diagnostic itself (which needs to exist before enrolment is "done").
  "/account": "authenticated",
  "/diagnostic": "authenticated",

  // Needs a course recorded, because the surface is meaningless without one.
  "/learn": "onboarded",
  // The Mind pages speak about the learner's OWN evidence, so they need both a
  // course and a record — the same gate as the evidence page they extend.
  "/mind": "onboarded",
  "/papers": "onboarded",
  "/progress": "onboarded",
  "/projects": "onboarded",
  "/mistakes": "onboarded",

  // Home is for a learner the system has MEASURED. A mastery dashboard of
  // zeros for someone who has never been diagnosed is the exact failure this
  // contract exists to prevent.
  "/dashboard": "diagnosed",
};

/** Longest-prefix match, with `/` exact. Returns `public` for anything unknown. */
export function accessFor(path: string): AccessRequirement {
  const clean = normalizePath(path);
  if (ACCESS[clean]) return ACCESS[clean];
  let best: { prefix: string; requirement: AccessRequirement } | null = null;
  for (const [prefix, requirement] of Object.entries(ACCESS)) {
    if (prefix === "/") continue;
    if (clean === prefix || clean.startsWith(prefix + "/")) {
      if (!best || prefix.length > best.prefix.length) best = { prefix, requirement };
    }
  }
  return best?.requirement ?? "public";
}

/** The paths the contract knows about — used by the harness to prove loop
 *  freedom across the whole table rather than on examples we happened to pick. */
export const ACCESS_RULES: { path: string; requirement: AccessRequirement }[] =
  Object.entries(ACCESS).map(([path, requirement]) => ({ path, requirement }));

function normalizePath(path: string): string {
  const noQuery = path.split("?")[0].split("#")[0];
  if (noQuery.length > 1 && noQuery.endsWith("/")) return noQuery.slice(0, -1);
  return noQuery || "/";
}

/**
 * A return target that came from the URL is untrusted input. This keeps only
 * a same-origin absolute path — `//evil.com` and `https://…` are dropped,
 * because a redirect we perform is a redirect we are responsible for.
 */
export function safeReturnPath(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (typeof raw !== "string" || !raw) return fallback;
  const v = raw.trim();
  if (!v.startsWith("/")) return fallback;
  if (v.startsWith("//") || v.startsWith("/\\")) return fallback;
  if (v.includes("://")) return fallback;
  return v;
}

/** Build the redirect target, keeping the learner's intent. */
export function withReturn(to: string, path: string): string {
  const clean = normalizePath(path);
  if (clean === "/" || clean === "") return to;
  const sep = to.includes("?") ? "&" : "?";
  return `${to}${sep}return=${encodeURIComponent(clean)}`;
}

/** Where a learner with no account and no profile begins.
 *
 * The enrolment page carries the sign-in form, so signing in and enrolling share
 * one screen — but they are NOT the same destination, and this constant used to
 * conflate them. A learner who has never had an account was sent to
 * `/onboarding?mode=signin`, which asks them for credentials they do not have;
 * and because the enrolment page reads `mode=signin` as "start on the sign-in
 * form", the redirect also silently replaced whatever they had already chosen
 * (including "continue without an account") and dropped them back at step 1.
 * The sign-in form is still reachable the way it always was — the landing
 * page's own Sign in link — which is a deliberate choice, not a bounce. */
export const SETUP_ROUTE = "/onboarding";

export interface RouteDecision {
  action: "allow" | "boot" | "redirect";
  /** Where to send them when `action === "redirect"`. */
  to?: string;
  /** i18n key explaining WHY they moved — the screen never moves silently. */
  reasonKey: string;
  requirement: AccessRequirement;
}

const MET: Record<AccessRequirement, (l: Lifecycle) => boolean> = {
  public: () => true,
  authenticated: (l) => l.auth === "signed_in" || l.profileStatus === "complete" || l.profileStatus === "incomplete",
  onboarded: (l) => l.onboarded,
  // A teacher is not a learner waiting to be measured. `/dashboard` was gated on
  // evidence so that nobody is shown a mastery board of zeros for work they have
  // never been asked to do — which is exactly the argument for NOT sending a
  // teacher to the diagnostic the gate redirects to. Their own platform is
  // `/teacher`, and their learner Home is theirs to open if they want it.
  diagnosed: (l) => l.diagnosed || l.isTeacher,
};

/**
 * The whole routing decision, pure and testable: given where the learner is in
 * the lifecycle and the path they asked for, allow them, wait, or redirect.
 *
 * Two invariants hold by construction, and the harness asserts them over the
 * entire table rather than on examples:
 *   1. a redirect target is never itself blocked (no redirect loop), and
 *   2. a PUBLIC path is never redirected, whatever the lifecycle says — which
 *      is what makes the wedge and the landing page immune to this system.
 */
/**
 * WHERE ENROLMENT SENDS THE LEARNER — the second half of the guard, and the
 * branch that used to hand a TEACHER a baseline diagnostic.
 *
 * `resolveRoute` answers "may you open this page"; this answers "where does
 * finishing setup put you". They are separate decisions because enrolment
 * happens BEFORE the shell has re-read the profile, so the guard cannot be
 * asked — the page has to know its own destination.
 *
 * It was inline in `finish()`, and it had grown three jobs: a teacher's own
 * platform, a ticket that points at a page the guard will REFUSE (a new learner
 * is `onboarded`, never `diagnosed`, so pushing `/dashboard` guarantees a bounce
 * that re-attaches the ticket — the redirect loop), and the baseline diagnostic
 * a never-measured learner is actually for. The teacher case was wrong in the
 * way that is hardest to notice: it required the ticket to be ABSENT, and the
 * ticket is almost never absent (the guard attaches `?return=`, and the landing
 * page's "Go to your dashboard" is itself a ticket into a diagnosed-gated
 * page). So a signed-in teacher who followed either fell through to the learner
 * path, whose only outcomes are `/dashboard` or a baseline diagnostic, and
 * arrived at question 01 of a maths sitting in a subject they may not teach.
 *
 * Pure, and therefore sweepable over the cases that matter — a teacher with a
 * ticket, a teacher without one, a teacher asking for their own learner Home,
 * and a learner at both ends of `already`. A teacher is never SENT to be
 * measured; a learner the system has not measured is.
 */
export interface SettlementInput {
  /** The SESSION's account is a teacher/school, not this form's role picker. */
  isTeacher: boolean;
  /** Enrolling without an account: there is no role to read, never a teacher. */
  guest: boolean;
  /** The sanitised `?return=` ticket, or `""` when there is none. */
  wanted: string;
  /** The learner's fresh profile already carries a diagnostic. */
  already: boolean;
  /** Subject the baseline diagnostic should be sat in. */
  subject: string;
}

export function settlementTarget({ isTeacher, guest, wanted, already, subject }: SettlementInput): string {
  // A teacher's platform is the default, and a ticket to it is honoured.
  const teacherHome = isTeacher && !guest;
  if (teacherHome && !(wanted && !wanted.startsWith("/teacher"))) return "/teacher";
  // A destination the guard would immediately refuse is not a destination.
  // `accessFor` is a static contract and cannot see the account's role, so the
  // teacher case is subtracted here exactly as `MET.diagnosed` subtracts it.
  const unreachable = wanted && !teacherHome ? accessFor(wanted) === "diagnosed" : false;
  if (wanted && (already || !unreachable)) return wanted;
  // Carry the ticket forward, so the diagnostic returns the learner to what they
  // actually asked for instead of stranding them at a default.
  return already ? withReturn("/dashboard", wanted) : withReturn(`/diagnostic/${subject}`, wanted);
}

export function resolveRoute(lifecycle: Lifecycle, path: string): RouteDecision {
  const requirement = accessFor(path);
  // Public content renders immediately — it never waits on the probe, because
  // there is nothing to decide.
  if (requirement === "public") return { action: "allow", reasonKey: "state.ready", requirement };
  // Everything below here is a decision, and no decision may be made on
  // unknown state. Boot is not "signed out".
  if (lifecycle.booting) return { action: "boot", reasonKey: "state.booting", requirement };
  if (MET[requirement](lifecycle)) return { action: "allow", reasonKey: "state.ready", requirement };
  if (lifecycle.auth !== "signed_in" && lifecycle.profileStatus === "missing") {
    // "New here?" — so begin setup; do not ask a stranger to sign in.
    return { action: "redirect", to: withReturn(SETUP_ROUTE, path), reasonKey: "state.newLearner", requirement };
  }
  if (!lifecycle.onboarded) {
    return { action: "redirect", to: withReturn("/onboarding", path), reasonKey: "state.needsOnboarding", requirement };
  }
  return {
    action: "redirect",
    to: withReturn(`/diagnostic/${lifecycle.diagnosticSubject}`, path),
    reasonKey: "state.needsDiagnostic",
    requirement,
  };
}
