import { NextResponse } from "next/server";
import { teacherOfClass } from "@/lib/server/authority";
import { getClass, listProfileStates } from "@/lib/server/store";
import { isTeacherOf } from "@/lib/server/class-membership";
import { resolveMembers } from "@/lib/server/class-view";
import type { ProfileState } from "@/lib/types";
import { oneRosterFileName, oneRosterPackage } from "@/lib/export/oneroster";

export const dynamic = "force-dynamic";

/**
 * GET /api/export/oneroster?class=<id>[&me=<profileId>&secret=<capability>]
 *
 * THE ROSTER IS A TEACHER'S DOCUMENT, AND THIS IS THE SAME AUTHORITY THE CLASS'S
 * OWN DOOR USES. A roster carries every member's handle and enrolment, so
 * "signed in" is not enough and "is a member" is not enough either — a learner
 * could then export their classmates. The rule asked here is
 * `lib/server/class-membership#isTeacherOf`, the one place that decides who may
 * set a class's work and read its monitor, so this door cannot drift from the
 * others.
 *
 * ONE CREDENTIAL, AND IT IS THE ACCOUNT'S. This used to accept the teacher's
 * profile capability (`authorisedProfile`), which made the download work from a
 * device holding the secret — and, on a shared handset, made a roster entry
 * enough to export a class. A roster export is a teacher's act, so it asks the
 * teacher rule: a signed-in teaching account that owns the class
 * (lib/server/authority.ts#teacherOfClass). A capability is a learner credential
 * and no longer opens this door.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const classId = (searchParams.get("class") ?? "").trim();
  if (!classId) return NextResponse.json({ error: "class_required" }, { status: 400 });

  const cls = await getClass(classId);
  if (!cls) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const who = await teacherOfClass(req, cls);
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status });
  const state = who.profile;

  // Members are resolved by IDENTITY (`membersById`), which is the rule the live
  // roster uses: a handle is chosen by the joiner, so exporting by handle would
  // put a stranger's row in a teacher's file.
  const learners = (await resolveMembers(cls)).map((m) => ({
    id: m.state.profile.id,
    handle: m.handle,
    role: "student" as const,
  }));

  // THE TEACHERS TRAVEL WITH THE ROSTER, AND THAT IS A SEPARATE STEP BECAUSE
  // `resolveMembers` ANSWERS THE LEARNERS. It is the class monitor's member list
  // (a teacher looking at pupils), so it drops the teacher by design — and a
  // package built only from it describes a section with nobody teaching it. An
  // importing SIS would create the class and then have to be told, by hand, who
  // teaches it: precisely the chore an export exists to remove. The caller is one
  // of them (the authorisation above proved it), so they are named first and read
  // as the class's primary teacher; any co-teacher on the same roster follows.
  const teacherById = new Map<string, ProfileState>([[state.profile.id, state]]);
  for (const s of await listProfileStates()) {
    if (isTeacherOf(cls, s)) teacherById.set(s.profile.id, s);
  }
  const teachers = [...teacherById.values()].map((s) => ({
    id: s.profile.id,
    handle: s.profile.handle ?? cls.teacher,
    role: "teacher" as const,
  }));
  const members = [...teachers, ...learners];

  const body = new Uint8Array(oneRosterPackage({ cls, members }));
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${oneRosterFileName(cls)}"`,
      // A roster is personal data: it must not sit in a shared cache, and it must
      // not be re-served to a different teacher from one.
      "cache-control": "private, no-store",
    },
  });
}
