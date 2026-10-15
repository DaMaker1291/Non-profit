import { NextResponse } from "next/server";
import {
  createClass,
  getClass,
  listClasses,
  newId,
  reconcileClassIdentities,
  updateClassByCode,
  updateClassById,
} from "@/lib/server/store";
import { authorizeLearner } from "@/lib/server/capability";
import { storeWriteRefusal } from "@/lib/server/write-refusal";
import { freeHandle, isMemberOf, isTeacherOf } from "@/lib/server/class-membership";
import { liveRoster, memberEvidence, resolveMembers } from "@/lib/server/class-view";
import { SUBJECT_IDS } from "@/lib/subjects";
import { courseRefusal } from "@/lib/specifications";
import type { ClassRoster, SubjectId } from "@/lib/types";

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  // THE LEGACY-ROSTER REPAIR, NAMED AT THE CALL SITE THAT WANTS IT (F-3).
  //
  // A roster written before member ids existed has to be reconciled ONCE, and it
  // used to happen silently inside `getClass`: a READ took `profiles.json`, rewrote
  // `classes.json`, and swallowed a failure — so a teacher's table could quietly be
  // missing rows with no error anywhere. It is now an explicit, idempotent call,
  // and the two read functions it used to hide in are pure.
  //
  // Best-effort HERE on purpose, and this is the one place the decision is made: a
  // roster read must not fail because the repair could not be written (a deployment
  // that has refused learner-data writes still serves reads), the repair is
  // idempotent so the next read tries again, and it is not silent — the call names
  // what it is doing. An operator who wants it to be strict runs
  // `npm run data:repair-classes`.
  await reconcileClassIdentities().catch(() => {});
  // `me` is the profile asking; `id` (when present) is the CLASS being read.
  // Membership is the rule: a class carries its learners' handles, mastery and
  // join code, so it answers only a profile that is IN the class. (Two holes
  // closed here: this door used to hand join codes to anonymous callers, and
  // later it authenticated the caller without ever checking they belonged to
  // the class they named.)
  const auth = await authorizeLearner(searchParams.get("me"), searchParams.get("secret"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const me = auth.state;

  const id = searchParams.get("id");
  if (id) {
    const cls = await getClass(id);
    if (!cls) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (!isMemberOf(cls, me)) return NextResponse.json({ error: "not a member" }, { status: 403 });
    // ── ONE MEMBER'S EVIDENCE IS THE TEACHER'S TO READ, AND ONLY THEIRS ──────
    //
    // The roster is the class's own material: a member reads it, which is how
    // a learner sees where they stand. The DETAIL behind another named learner
    // is a different question, and it is the one the analysis's individual
    // report needs — so it is asked separately and answered only to the class's
    // teacher (`isTeacherOf`, the same authority that sets its work and reads
    // its monitor). Two 403s with distinct codes: not a member, and a member
    // who is not the teacher. A student's own membership is deliberately not
    // enough to read a peer's answers, and the learner is named by ID — never
    // by handle, which a class can hold two of.
    const learner = searchParams.get("learner");
    if (learner) {
      if (!isTeacherOf(cls, me)) return NextResponse.json({ error: "not the teacher" }, { status: 403 });
      // Membership through the ONE resolver, which is also what excludes the
      // teacher from their own class's student list — so a teacher cannot ask
      // for a row that is not a student's.
      const members = await resolveMembers(cls);
      const m = members.find((x) => x.state.profile.id === learner);
      if (!m) return NextResponse.json({ error: "not a member" }, { status: 404 });
      return NextResponse.json({ member: await memberEvidence(cls, m.handle, m.state) });
    }
    return NextResponse.json({ cls: await liveRoster(cls) });
  }
  // The listing shows only classes the caller belongs to.
  const all = await listClasses();
  const mine = all.filter((cls) => isMemberOf(cls, me));
  return NextResponse.json({ classes: await Promise.all(mine.map(liveRoster)) });
}

interface Body {
  action: "create" | "join" | "report" | "update";
  /** The class an "update" edits. */
  clsId?: string;
  /** The calling profile. Every action is authenticated by its capability, so
   *  a class cannot be created, joined or edited anonymously. */
  id?: string;
  secret?: string;
  name?: string;
  language?: string;
  conceptIds?: string[];
  /** The curriculum the class is taught, declared at creation. Assigned work
   *  is drawn from it (POST /api/assignments), so it is validated against the
   *  real subject list — a typo must not become a silent maths class. */
  subject?: string;
  /** Optional course (specification) for the class: the qualification or board
   *  it is taught. Validated against the class's subject (lib/specifications#
   *  courseRefusal), so a course the subject is not part of is refused by name. */
  specificationId?: string | null;
  joinCode?: string;
  handle?: string;
  conceptMastery?: Record<string, number>;
  /** misconceptionId -> hit count, reported by the joining student. */
  misconceptionHits?: Record<string, number>;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Body;
    // Same explicit repair as the read door, for the same reason and at the same
    // level: a JOIN is a membership decision, and a roster that still carries
    // pre-identity rows would decide it against a table that cannot name its own
    // members. Best-effort, as on the read path.
    await reconcileClassIdentities().catch(() => {});
    const auth = await authorizeLearner(typeof body.id === "string" ? body.id : null, body.secret);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const caller = auth.state;
    switch (body.action) {
      case "create": {
        // A class declares the curriculum it is taught (and, optionally, the
        // course). Work is assigned from that declaration, so a typo is
        // rejected here rather than becoming a class that silently cannot be
        // set work. A caller that names no subject gets no declared subject
        // (legacy shape, subject inferred from the concepts it carries).
        if (body.subject !== undefined && !(SUBJECT_IDS as string[]).includes(body.subject)) {
          return NextResponse.json({ error: "unknown subject" }, { status: 400 });
        }
        // The course is part of the same declaration, and follows the learner's
        // rule: it needs a subject to be a course OF, and the subject must be
        // part of it. Both refusals are named, never a silent drop — a class
        // stored on a course its teacher did not choose would be taught, and
        // set work from, a curriculum nobody declared.
        const course = body.specificationId ?? null;
        if (course !== null) {
          if (!body.subject) {
            return NextResponse.json({ error: "course_without_subject" }, { status: 400 });
          }
          const refusal = courseRefusal(body.subject as SubjectId, course);
          if (refusal) return NextResponse.json({ error: refusal }, { status: 400 });
        }
        // The join code is chosen AND inserted inside one lock, by the store
        // (`createClass`), so two teachers creating a class at the same moment
        // cannot end up with the same code on the board — the check-then-insert
        // shape this used to have. The database's own protection is the
        // `classes_join_code_live_key` unique index, and the same loop is where
        // that index's answer is honoured. See `newId`/`createClass` in
        // lib/server/store.ts, and F-4 of docs/STORAGE_SPEC.md §13.
        const h = (caller.profile.handle ?? "teacher").slice(0, 24);
        const cls: ClassRoster = await createClass((joinCode) => ({
          id: newId("cls"),
          name: (body.name ?? "Untitled class").slice(0, 60),
          teacher: "teacher",
          joinCode,
          language: body.language ?? "en",
          conceptIds: (body.conceptIds ?? []).slice(0, 12),
          subject: body.subject as SubjectId | undefined,
          specificationId: course,
          // The creator is the class's first member: they will read their own
          // roster, and the plan engine needs their evidence like anyone's.
          students: { [h]: {} },
          membersById: { [h]: caller.profile.id },
          members: [caller.profile.id],
          createdAt: Date.now(),
          // The creator is the class's TEACHER — the one authority that may set
          // its work and read its monitor. Recorded as the learner id, never the
          // role label (which every class carries) or a joiner-chosen handle.
          ownerId: caller.profile.id,
        }));
        return NextResponse.json({ cls });
      }
      case "join": {
        const upd = await updateClassByCode(body.joinCode ?? "", (cls) => {
          // A HANDLE IS A LABEL, NOT A KEY INTO SOMEONE ELSE'S ROW.
          // This used to write `membersById[h] = caller` unconditionally, so two
          // learners who chose the same display name took turns owning one row:
          // the second join silently rebound the first learner's handle, and the
          // teacher's table then showed whichever of them the binding pointed at
          // — one student's evidence under the other's name. A handle already
          // bound to another learner is theirs; a joiner gets their own row.
          // Handles already held by an UNBOUND row (a roster written before ids,
          // or a device's self-report) are claimed only by that row's own
          // reconciliation (lib/server/class-membership#bindLegacyHandles), never
          // as a side effect of somebody else signing up under the same name.
          // Which handle that is, exactly, is one rule — the same one the
          // migration uses to repair a roster that lost a row.
          const h = freeHandle(cls, body.handle ?? caller.profile.handle ?? "student", caller.profile.id);
          cls.students[h] = cls.students[h] ?? {};
          // Remember WHICH learner this handle is, so the live view can find
          // their ledger by id rather than trusting a handle collision.
          cls.membersById ??= {};
          cls.membersById[h] = caller.profile.id;
          cls.members ??= [];
          if (!cls.members.includes(caller.profile.id)) cls.members.push(caller.profile.id);
          return { joined: h };
        });
        if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json({ cls: upd.cls });
      }
      case "update": {
        // A CLASS'S CURRICULUM IS DECLARED WHERE THE CLASS ALREADY IS.
        // The assignment door has always accepted a class-level course and no
        // screen ever sent one, so a teacher with two classes of the same
        // subject at different qualifications could not tell them apart — they
        // were the same class twice. Only the class's OWN teacher may declare
        // it (the same authority that sets its work), and the course is refused
        // by name when the subject is not part of it, so a class can never end
        // up taught a qualification it does not sit.
        if (!body.clsId) return NextResponse.json({ error: "missing class" }, { status: 400 });
        const upd = await updateClassById(body.clsId, (cls) => {
          if (!isTeacherOf(cls, caller)) return { error: "not the teacher" as const, status: 403 as const };
          if (body.subject !== undefined && !(SUBJECT_IDS as string[]).includes(body.subject as string)) {
            return { error: "unknown subject" as const, status: 400 as const };
          }
          const subject = (body.subject as SubjectId | undefined) ?? cls.subject;
          if (body.specificationId !== undefined && body.specificationId !== null) {
            if (!subject) return { error: "course_without_subject" as const, status: 400 as const };
            const refusal = courseRefusal(subject, body.specificationId);
            if (refusal) return { error: refusal as string, status: 400 as const };
          }
          if (body.subject !== undefined) cls.subject = subject;
          if (body.specificationId !== undefined) cls.specificationId = body.specificationId;
          return { updated: true as const };
        });
        if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
        const r = upd.result as { error?: string; status?: number };
        if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 400 });
        return NextResponse.json({ cls: upd.cls });
      }
      case "report": {
        // Self-report remains, deliberately, as the FALLBACK channel: a device
        // with no profile can still attach numbers to a handle. But the live
        // view — the teacher's table and the plan's data — is derived from the
        // ledger either way, so a client can flatter itself in `students`
        // without ever changing what the teacher sees.
        const upd = await updateClassByCode(body.joinCode ?? "", (cls) => {
          const h = (body.handle ?? caller.profile.handle ?? "student").slice(0, 24);
          cls.students[h] = { ...(cls.students[h] ?? {}), ...(body.conceptMastery ?? {}) };
          if (body.misconceptionHits && Object.keys(body.misconceptionHits).length > 0) {
            cls.misconceptions ??= {};
            cls.misconceptions[h] = { ...(cls.misconceptions[h] ?? {}), ...body.misconceptionHits };
          }
          return { reported: h };
        });
        if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json({ cls: upd.cls });
      }
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    // A class, a join or a self-report is learner data: a store that cannot keep
    // the write answers 503 with its reason rather than a blanket 400.
    const refusal = storeWriteRefusal(e);
    if (refusal) return refusal;
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
