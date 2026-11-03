// ── WHO MAY SEE OR CONTROL A LIVE CLASS ────────────────────────────────────
//
// One rule for the JSON door and the SSE door, so the stream cannot become a
// less-guarded copy of the session:
//
//   · the class's OWNING TEACHER ACCOUNT may control it;
//   · a co-teacher may read it but may not control this room (two teachers
//     must not be able to race the same lesson);
//   · a class MEMBER may read it and submit to it, but the view shows only
//     their own participant row.
import { authorisedProfile } from "./auth";
import { canAdminister, teacherAccountIdOf, teacherCaller } from "./authority";
import { handleOf, isMemberOf } from "./class-membership";
import { getClass } from "./store";
import type { ClassRoster, ProfileState } from "../types";

export type ClassroomAccess =
  | {
    ok: true;
    cls: ClassRoster;
    canControl: boolean;
    canRead: boolean;
    learner: ProfileState | null;
    handle: string | null;
    accountId: string | null;
  }
  | { ok: false; status: number; error: string };

export async function resolveClassroomAccess(
  req: Request,
  clsId: string | null,
  me: string | null,
  secret: string | null,
): Promise<ClassroomAccess> {
  if (!clsId) return { ok: false, status: 400, error: "missing class" };
  const cls = await getClass(clsId);
  if (!cls) return { ok: false, status: 404, error: "not found" };

  // The cookie is the teacher credential. A learner's capability is not, and
  // `teacherCaller` refuses a student account even if it owns a profile.
  const teacher = await teacherCaller(req);
  if (teacher.ok) {
    const owner = await teacherAccountIdOf(cls);
    const canControl = owner === teacher.account.id;
    const canRead = canControl || await canAdminister(cls, teacher.account.id);
    if (!canRead) return { ok: false, status: 403, error: "not_the_teacher" };
    return {
      ok: true, cls, canControl, canRead,
      learner: teacher.profile,
      handle: handleOf(cls, teacher.profile.profile.id) ?? cls.teacher ?? null,
      accountId: teacher.account.id,
    };
  }

  const learner = await authorisedProfile(req, me, secret);
  if (!learner) return { ok: false, status: 401, error: "unauthorized" };
  if (!isMemberOf(cls, learner)) return { ok: false, status: 403, error: "not a member" };
  return {
    ok: true, cls, canControl: false, canRead: true,
    learner,
    handle: handleOf(cls, learner.profile.id) ?? learner.profile.handle ?? "student",
    accountId: null,
  };
}
