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
function memberHandle(state: ProfileState, fallback: string): string {
  return (state.profile.handle ?? "").trim() || fallback;
}

/**
 * IS THIS PROFILE A MEMBER OF THIS CLASS? IDENTITY, AND ONLY IDENTITY.
 *
 * This used to fall back to the DISPLAY HANDLE — "does this class have a row
 * with my name on it?" — as legacy support for rosters written before member
 * ids existed. A name is not an identity, and the fallback failed at exactly
 * what membership is for: a freshly created account that happened to share a
 * name with a real member was treated as a member of a class it had never
 * joined. It could read that class, appear in the teacher's roster, be handed
 * work and have its evidence read beside real students — and when two learners
 * shared a name, the monitor's numbers belonged to neither reliably.
 *
 * So the rule is now the id the join recorded, in either of the two shapes the
 * write path produces: the `members` list, or a handle bound to that id in
 * `membersById`. Rosters written before those fields existed are reconciled
 * ONCE, by {@link bindLegacyHandles} — see it for why matching a name once, to
 * persist an identity, is not the same as matching a name forever.
 */
export function isMemberOf(cls: ClassRoster, state: ProfileState): boolean {
  const id = state.profile.id;
  if (cls.members?.includes(id)) return true;
  return Object.values(cls.membersById ?? {}).includes(id);
}

/** The handle this learner's own row carries in this class, by identity: the
 *  one the roster bound to them. Null when they have no row. Used wherever a
 *  member's own row must be named, so the label travels with the row rather
 *  than being re-derived from the profile (which, after a collision was
 *  resolved, is not what the roster calls them). */
export function handleOf(cls: ClassRoster, learnerId: string): string | null {
  for (const [handle, id] of Object.entries(cls.membersById ?? {})) {
    if (id === learnerId) return handle;
  }
  return null;
}

/** Does the roster hold a row for this learner? The identity answer, asked by
 *  the reconciliation and by nothing else: a member with no row is still a
 *  member (their id was recorded), it is only the teacher's table that cannot
 *  see them. */
export function hasRow(cls: ClassRoster, learnerId: string): boolean {
  return handleOf(cls, learnerId) !== null;
}

/**
 * THE ONE RULE FOR "WHAT ROW DOES THIS LEARNER GET?"
 *
 * Their own name when the roster is free to use it, else the first numbered
 * variant nobody holds. A handle already bound to ANOTHER learner is never
 * taken over — that is the whole defect this file exists to prevent: the join
 * used to write the caller's id onto whichever handle they named, so two
 * learners called Alex took turns owning one row and the teacher's table showed
 * one student's evidence under the other's name. A handle held by an UNBOUND
 * row (a roster written before ids) is also not free: it belongs to whoever
 * that row turns out to be, and {@link bindLegacyHandles} settles it.
 *
 * Used by the join path and by the migration, so "who gets called what" cannot
 * differ between joining a class and being repaired into one.
 */
export function freeHandle(cls: ClassRoster, base: string, learnerId: string): string {
  cls.membersById ??= {};
  const unowned = (h: string): boolean => !Object.prototype.hasOwnProperty.call(cls.students ?? {}, h) && !cls.membersById?.[h];
  const mine = (h: string): boolean => cls.membersById?.[h] === learnerId;
  const start = base.slice(0, 24) || "student";
  let h = start;
  for (let n = 2; !unowned(h) && !mine(h); n++) h = `${start} ${n}`.slice(0, 24);
  return h;
}

/**
 * ONE-SHOT RECONCILIATION for rosters written before member ids existed.
 *
 * Such a roster holds `students: { handle: … }` and nothing that says WHO those
 * handles are. Two ways to keep them working: match the name on every read
 * (what the product did, and what let a stranger into a class), or work out the
 * identity once and write it down. This is the second, and it refuses to guess:
 * a handle is bound only when exactly ONE profile in the whole store carries it.
 * Ambiguous handles stay UNBOUND — an unowned row, which grants no membership
 * and reads no evidence — rather than being handed to whichever profile the
 * store happened to iterate last.
 *
 * Returns true when it changed anything, so the caller persists once and every
 * later read is identity-only. It is safe to call repeatedly: a bound handle is
 * skipped, and an ambiguous one is simply tried again (it binds the moment the
 * name is unambiguous, which is the only time a guess is not a guess).
 */
export function bindLegacyHandles(cls: ClassRoster, states: readonly ProfileState[]): boolean {
  const byHandle = new Map<string, string[]>();
  for (const s of states) {
    const h = memberHandle(s, "");
    if (!h) continue;
    const ids = byHandle.get(h) ?? [];
    if (!ids.includes(s.profile.id)) ids.push(s.profile.id);
    byHandle.set(h, ids);
  }
  let changed = false;
  const bind = (handle: string): void => {
    const ids = byHandle.get(handle);
    if (!ids || ids.length !== 1) return;
    cls.membersById ??= {};
    if (cls.membersById[handle] === ids[0]) return;
    cls.membersById[handle] = ids[0];
    cls.members ??= [];
    if (!cls.members.includes(ids[0])) cls.members.push(ids[0]);
    changed = true;
  };
  // Whose class this is, read BEFORE anything is bound: the owner already
  // recorded, else the first member the old write path recorded, else the first
  // row it wrote (which was always the creator's). Computed up front because
  // binding a handle fills `members`, and a rule that asks "is this roster
  // empty?" after that would call every legacy class ownerless.
  const creator = cls.ownerId ?? cls.members?.[0] ?? Object.keys(cls.students)[0] ?? null;
  for (const handle of Object.keys(cls.students)) bind(handle);
  // A MEMBER WITH NO ROW IS STILL A MEMBER, and the teacher's table could not
  // see them. This is the residue of the same defect: the old join rebound a
  // handle rather than adding a row, so a learner who joined under a name
  // somebody else then took kept their id in `members` and lost their row —
  // a member by identity, invisible on the monitor, and (once the roster is
  // read by identity, as it now is) not counted at all. Reconciliation gives
  // them the row they should have had, under a handle nobody else holds.
  const byProfileId = new Map(states.map((s) => [s.profile.id, s]));
  for (const id of cls.members ?? []) {
    if (hasRow(cls, id)) continue;
    const state = byProfileId.get(id);
    if (!state) continue; // a profile that no longer exists has no row to write
    const h = freeHandle(cls, memberHandle(state, "student"), id);
    cls.students[h] = cls.students[h] ?? {};
    cls.membersById ??= {};
    cls.membersById[h] = id;
    changed = true;
  }
  // The creator is the teacher only once their row HAS an identity: a class
  // whose teacher cannot be identified stays owned by nobody, which is the
  // documented answer, rather than a guess from a name.
  if (!cls.ownerId && creator) {
    const bound = cls.membersById?.[creator];
    if (bound) {
      cls.ownerId = bound;
      changed = true;
    }
  }
  return changed;
}

/** The learner id of the class's teacher, by the one rule: the owner recorded
 *  when it was created, or the first member for rosters that predate `ownerId`
 *  (which is the profile that created them). Asked by every question about who
 *  teaches a class, so the identity half of the rule is written once. */
function ownerIdOf(cls: ClassRoster): string | null {
  return cls.ownerId ?? cls.members?.[0] ?? null;
}

/**
 * MAY THIS PROFILE SET WORK FOR, OR READ THE MONITOR OF, THIS CLASS?
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
  const owner = ownerIdOf(cls);
  return owner !== null && owner === state.profile.id;
}

/**
 * IS THIS PROFILE ONE OF THE CLASS'S STUDENTS?
 *
 * Membership and studenthood are different questions, and only the second may
 * be counted. A class's creator is a MEMBER — that is how they read their own
 * roster, and it is why creating a class does not lock the maker out of it —
 * but they are its TEACHER: the authority that sets its work, not a learner who
 * owes it. Counting them as a student made every class in the product one
 * student larger than it was ("2 students" for a class a single child had
 * joined), put the teacher in their own student table, and — worst — listed
 * them in "needs attention" as `not_started` on every assignment they set.
 *
 * This is the one place that rule is written, so the roster, the assignment
 * monitor and the printed plan cannot answer it differently.
 */
export function isStudentOf(cls: ClassRoster, state: ProfileState): boolean {
  return isMemberOf(cls, state) && !isTeacherOf(cls, state);
}

/** The handle the class's teacher appears under in the stored roster, when the
 *  roster can name one. Null for a class whose creator never joined under a
 *  handle — the roster then holds no teacher to leave out. */
export function teacherHandle(cls: ClassRoster): string | null {
  const owner = ownerIdOf(cls);
  return owner ? handleOf(cls, owner) : null;
}
