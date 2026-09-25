// ─────────────────────────────────────────────────────────────────────────────
// THE PROFILE'S OWN SHAPE, WITHOUT A FILESYSTEM.
//
// Two facts about a learner profile are pure arithmetic and two callers need
// them: what a brand-new learner state looks like, and what must be stripped
// before a profile crosses a wire. They used to live in lib/server/store.ts,
// which imports `fs` — so the static build (the one published to GitHub Pages,
// which has no server at all) would have had to write its own copy of both, and
// a copy of a default is a divergence waiting to happen: a profile born with
// `subjects: []` instead of `["maths"]` decides differently from the server's
// on the very first action.
//
// So the shape lives here, the store re-exports it, and both builds call the
// same two functions.
// ─────────────────────────────────────────────────────────────────────────────

import type { ProfileState, StudentProfile } from "./types";

/** A brand-new learner state. Used by the anonymous path (POST /api/profile),
 *  account sign-up and the static build, so a learner is born with a real,
 *  empty profile rather than a dangling id. */
export function newProfileState(id: string, init: Partial<StudentProfile> = {}): ProfileState {
  return {
    profile: {
      id,
      handle: "student",
      country: "XX",
      birthYear: null,
      language: "en",
      teachingLang: "en",
      answerLang: "en",
      schoolLang: "en",
      goal: "",
      intent: "",
      subjects: ["maths"],
      createdAt: Date.now(),
      ...init,
    },
    progress: {},
    diagnostics: {},
    masteries: {},
    secret: "",
  };
}

/* * Strip transient server-only state before a profile crosses the wire: live
 *  diagnostic sessions (keys containing ":session"), pending practice
 *  questions, whose answer keys must never reach the client, and the open
 *  learning session's ledger — which holds the baseline the result is compared
 *  against, so a client that could read or edit it could fake adaptation.
 *
 * `projectionBase` (lib/server/projection.ts) is stripped for a different
 * reason: it is not secret, but it is server-side bookkeeping — a duplicate of
 * `progress` as it stood at cutover, plus the note of what the ledger could
 * not rebuild. It is the server's account of its own architecture, not the
 * learner's state, and nothing in the UI has a use for it. */
export function publicProfileState(state: ProfileState): ProfileState {
  const out: Record<string, unknown> = { ...state };
  for (const k of Object.keys(out)) {
    if (k.includes(":session") || k === "practice" || k === "learnSession" || k === "projectionBase") delete out[k];
  }
  return out as unknown as ProfileState;
}
