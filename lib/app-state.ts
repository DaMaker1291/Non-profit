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
 * The single source of truth for "where is this learner in the lifecycle".
 *
 * Note the deliberate strictness: enrolment counts as done only when the
 * profile carries `onboardedAt`. A profile that merely exists (created lazily
 * by the wedge) is *not* enrolled, so it is sent through onboarding once —
 * which is what makes the course, tier and board real for the paper engine.
 */
export function deriveAppState({ signedIn, profile }: AppStateInput): AppState {
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
export function deriveLifecycle({ auth, profileStatus, profile }: LifecycleInput): Lifecycle {
  const booting = auth === "booting" || profileStatus === "loading";
  if (booting) {
    return {
      booting: true,
      auth,
      profileStatus,
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
  const base = deriveAppState({ signedIn: auth === "signed_in", profile });
  return {
    ...base,
    booting: false,
    auth,
    profileStatus: profileStatusOf(profile),
    profileId: profile?.profile.id ?? null,
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

/** Where a learner is sent to sign in. There is no `/signin` route: the
 *  enrolment page carries the sign-in form, so signing in and enrolling share
 *  one screen and one navigation target. */
export const SIGNIN_ROUTE = "/onboarding?mode=signin";

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
  diagnosed: (l) => l.diagnosed,
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
    return { action: "redirect", to: withReturn(SIGNIN_ROUTE, path), reasonKey: "state.newLearner", requirement };
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
