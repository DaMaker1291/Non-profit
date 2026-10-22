// ─────────────────────────────────────────────────────────────────────────────
// WHO MAY ADMINISTER A CLASS — AND WHY A PROFILE CAPABILITY IS NOT AN ANSWER.
//
// THE DEFECT THIS EXISTS FOR, MEASURED (audit, then re-measured over HTTP on a
// scratch store): a learner's id and secret created a class `POST /api/classes
// {action:"create"}` answered 200 with a join code, from a request that carried
// nothing but an ordinary learner's capability. Every class door then asked
// `isTeacherOf(cls, state)` — "is this profile the owner's profile?" — and a
// capability IS that profile, so the same two strings could set work, read every
// member's evidence, export the roster and erase records. There was no role in
// the decision at all.
//
// On a personal phone that was merely permissive. On a shared classroom handset
// it is the whole security model: the device roster stores up to eight
// capabilities in cleartext, so "the class's teacher" was whoever last used the
// phone. A PIN screen or a hidden button cannot repair that, because the server
// still says yes.
//
// SO THE RULE IS SEPARATION, NOT A BIGGER SECRET:
//
//   learner identity   a profile id + its capability (or a short-lived classroom
//                      session token) — proves WHO is asking.
//   teacher authority  a signed-in ACCOUNT whose role is teacher/org, that owns
//                      the class — proves WHAT THEY MAY ADMINISTER.
//
// Possessing a learner's profile credentials therefore grants learner actions
// and nothing else. Teacher-only doors call `teacherOfClass`, which reads the
// session cookie; a capability presented in an `id`/`secret` body is irrelevant
// to it, by construction rather than by remembering to check.
//
// LEGACY CLASSES are those created before `teacherAccountId` was recorded. Their
// authority is resolved once from the profile that created them
// (`accountOwningProfile`), which is the account that was always the real
// teacher. A class whose creator has no account has NO administrable teacher and
// answers `class_has_no_teacher_account` — the honest answer, because inventing
// an owner is how the capability became authority in the first place.
import { accountFromRequest } from "./auth";
import { accountOwningProfile, getProfile } from "./store";
import type { Account, ClassRoster, ProfileState } from "../types";

/** A refusal a route can return verbatim. The names are kept stable because the
 *  UI (and the regression suite) tell these apart: "sign in as a teacher" is a
 *  different instruction from "this is not your class". */
export interface Denial {
  ok: false;
  status: number;
  error: string;
}

export type TeacherCaller = {
  ok: true;
  account: Account;
  /** The teacher's own learner profile — what a class roster records as owner. */
  profile: ProfileState;
  profileId: string;
};

/** Roles that may administer a class. `org` is a school account: it sets work
 *  too, and its own path is not built, so it is on the teaching side of the line
 *  (the same rule lib/client.tsx already uses to send teachers to their console). */
const TEACHING_ROLES = new Set(["teacher", "org"]);

export function isTeachingRole(role: string | undefined | null): boolean {
  return Boolean(role && TEACHING_ROLES.has(role));
}

/** THE ONE DOOR FOR "IS THERE A TEACHER HERE?", and it is answered by the
 *  ACCOUNT, never by a capability. No cookie is a 401 that names its own fix. */
export async function teacherCaller(req: Request): Promise<TeacherCaller | Denial> {
  const account = await accountFromRequest(req);
  if (!account) return { ok: false, status: 401, error: "teacher_account_required" };
  if (!isTeachingRole(account.role)) return { ok: false, status: 403, error: "teacher_role_required" };
  if (!account.profileId) return { ok: false, status: 409, error: "teacher_profile_missing" };
  const profile = await getProfile(account.profileId);
  if (!profile) return { ok: false, status: 409, error: "teacher_profile_missing" };
  return { ok: true, account, profile, profileId: account.profileId };
}

/** The account that may administer this class. Recorded at creation; resolved
 *  from the creator's profile for a roster written before that field existed.
 *  Null means nobody can — see the header on why that is not guessed. */
export async function teacherAccountIdOf(cls: ClassRoster): Promise<string | null> {
  if (cls.teacherAccountId) return cls.teacherAccountId;
  if (!cls.ownerId) return null;
  const account = await accountOwningProfile(cls.ownerId);
  return account?.id ?? null;
}

/**
 * MAY THIS REQUEST ADMINISTER THIS CLASS?
 *
 * Three answers, and each exists because a screen has to say something different:
 *   401/`teacher_account_required`       no session — "sign in as a teacher"
 *   403/`teacher_role_required`          a learner's account — "not a teacher"
 *   403/`not_the_teacher`                a teacher, but not this class's
 *   409/`class_has_no_teacher_account`   a legacy class nobody can administer
 */
export async function teacherOfClass(req: Request, cls: ClassRoster): Promise<TeacherCaller | Denial> {
  const who = await teacherCaller(req);
  if (!who.ok) return who;
  const owner = await teacherAccountIdOf(cls);
  if (!owner) return { ok: false, status: 409, error: "class_has_no_teacher_account" };
  if (owner !== who.account.id) return { ok: false, status: 403, error: "not_the_teacher" };
  return who;
}

/** The same question for a listing, where the caller may be a teacher of SOME
 *  classes. Resolved once, so a page can render `canAdminister` per row without
 *  one account lookup per class. Null when the session cannot administer
 *  anything (no session, or a learner's account). */
export async function teachingAccountOf(req: Request): Promise<{ id: string; profile: ProfileState } | null> {
  const account = await accountFromRequest(req);
  if (!account || !isTeachingRole(account.role) || !account.profileId) return null;
  const profile = await getProfile(account.profileId);
  if (!profile) return null;
  return { id: account.id, profile };
}

/** May this teaching account administer this class? The listing's form of
 *  `teacherOfClass` — same rule, one account lookup hoisted by the caller. */
export async function canAdminister(cls: ClassRoster, teachingAccountId: string | null): Promise<boolean> {
  if (!teachingAccountId) return false;
  return (await teacherAccountIdOf(cls)) === teachingAccountId;
}
