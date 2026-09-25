// ── CLASS MEMBERSHIP, IN ONE PLACE ──────────────────────────────────────────
//
// A class carries its learners' handles, their measured mastery and its join
// code. Two routes answer with that material — the roster door and the offline
// pack (which includes the week's answer key) — and both must apply the SAME
// membership rule, or the rule has two copies and one of them will drift.
// This is the one place the rule lives.
import type { ClassRoster, ProfileState } from "../types";

/** The handle a member goes by in the roster: the profile's own, falling back
 *  to whatever the caller presented when they joined. */
export function memberHandle(state: ProfileState, fallback: string): string {
  return (state.profile.handle ?? "").trim() || fallback;
}

/** Is this profile a member of this class? Identity first (the learner id the
 *  join recorded), then the handle the roster actually holds — the second
 *  check is what lets rosters created before `members` existed keep working. */
export function isMemberOf(cls: ClassRoster, state: ProfileState): boolean {
  if (cls.members?.includes(state.profile.id)) return true;
  const h = memberHandle(state, state.profile.handle ?? "");
  return Boolean(h) && Object.keys(cls.students).includes(h);
}

/**
 * May this profile SET work for, or read the monitor of, this class?
 *
 * Membership is not enough: a class carries every member's measured work, so
 * "is in the class" and "is the teacher of the class" are different questions
 * and only the second may create or remove an assignment. This is the one
 * place that rule is written, so the roster door, the assignment door and any
 * future one answer it the same way.
 *
 * Identity, not handle: `teacher` on a roster is a role label (every class has
 * it), and a handle is chosen by the joiner, so neither can be the authority.
 * Rosters created before `ownerId` existed fall back to the first member
 * recorded — which is the profile that created them. A class with neither is
 * owned by nobody, and answers 403 rather than guessing.
 */
export function isTeacherOf(cls: ClassRoster, state: ProfileState): boolean {
  if (cls.ownerId) return cls.ownerId === state.profile.id;
  return cls.members?.[0] === state.profile.id;
}
