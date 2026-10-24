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
import { authorisedProfile } from "@/lib/server/auth";
import { canAdminister, isTeachingRole, teacherCaller, teacherOfClass, teachingAccountOf } from "@/lib/server/authority";
import { accountOwningProfile } from "@/lib/server/store";
import { storeWriteRefusal } from "@/lib/server/write-refusal";
import { freeHandle, isMemberOf, isTeacherOf } from "@/lib/server/class-membership";
import {
  deleteKioskSessionsFor, kioskPinHash, makeSalt, mintKioskPin, mintUnshownSecret, newProfileState, saveProfile,
} from "@/lib/server/store";
import { liveRoster, memberEvidence, memberRoster, resolveMembers } from "@/lib/server/class-view";
import { SUBJECT_IDS } from "@/lib/subjects";
import { courseRefusal, specById } from "@/lib/specifications";
import type { ClassRoster, ProfileState, SubjectId } from "@/lib/types";

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
  // `authorisedProfile` accepts the capability OR a signed-in session that owns
  // the profile — a teacher's console reads its roster with the cookie alone,
  // which is the credential that also carries its authority.
  const me = await authorisedProfile(req, searchParams.get("me"), searchParams.get("secret"));
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // TEACHER AUTHORITY IS THE ACCOUNT'S, resolved ONCE for the whole request (a
  // listing asks about every class it returns). A learner's capability — even the
  // owner's own — is not an administration credential: see lib/server/authority.
  const teaching = await teachingAccountOf(req);

  const id = searchParams.get("id");
  if (id) {
    const cls = await getClass(id);
    if (!cls) return NextResponse.json({ error: "not found" }, { status: 404 });
    // MEMBERSHIP OR ADMINISTRATION — the same pair the listing uses. A class no
    // longer carries its teacher as a member (the creator is its OWNER), so a
    // membership-only door would refuse the one person entitled to read every
    // row of it: the teacher opening a student's evidence, or their own class by
    // id. A learner's membership still buys exactly what it bought before —
    // their own row, and never a peer's.
    if (!isMemberOf(cls, me) && !(await canAdminister(cls, teaching?.id ?? null))) {
      return NextResponse.json({ error: "not a member" }, { status: 403 });
    }
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
      if (!(await canAdminister(cls, teaching?.id ?? null))) {
        return NextResponse.json({ error: "not_the_teacher" }, { status: 403 });
      }
      // Membership through the ONE resolver, which is also what excludes the
      // teacher from their own class's student list — so a teacher cannot ask
      // for a row that is not a student's.
      const members = await resolveMembers(cls);
      const m = members.find((x) => x.state.profile.id === learner);
      if (!m) return NextResponse.json({ error: "not a member" }, { status: 404 });
      return NextResponse.json({ member: await memberEvidence(cls, m.handle, m.state) });
    }
    // ── THE ROSTER IS THE TEACHER'S; A MEMBER GETS THEIR OWN ROW ────────────
    //
    // Membership used to be the whole requirement here, so a student who had
    // joined a class was handed the SAME response as the teacher who owns it:
    // the join code they could pass on, every classmate's measured rates, and
    // the work set for the class. The live view is a teacher's instrument — it
    // exists so somebody can decide who needs help — and the rule that decides
    // who may read it is the same rule that decides who may set the class's
    // work (lib/server/class-membership#isTeacherOf). A member still reads the
    // class itself, sanitised to their own row (class-view#memberRoster).
    return NextResponse.json({ cls: (await canAdminister(cls, teaching?.id ?? null)) ? await liveRoster(cls) : await memberRoster(cls, me) });
  }
  // The listing shows only classes the caller belongs to. WHAT THEY ARE TO THE
  // CLASS decides how much of each one they receive, and the same decision is
  // made per class rather than per page — a teacher who also joined a colleague's
  // class reads the class they TEACH in full and the one they merely attend
  // sanitised. `teaching` is the answer to "is there a console here at all?",
  // which the teacher page needs before it renders one.
  const all = await listClasses();
  // A TEACHER ADMINISTERS CLASSES THEY MAY NOT BE A MEMBER OF (a class is a
  // roster of learners; the teacher's own profile is not required in it). The
  // listing therefore includes administrable classes as well as joined ones, and
  // each row says which it is — `canAdminister` is the same rule the write doors
  // apply, so a console cannot offer an action the server would refuse.
  const mine = all.filter((cls) => isMemberOf(cls, me));
  const administered = all.filter((cls) => !isMemberOf(cls, me));
  // The shape stays a LIST OF ROSTERS, with one derived flag added: a client that
  // renders `cls.students` keeps working, and the console can show "you administer
  // this" from the same response that carries the roster. `canAdminister` is
  // computed here and never stored — it is a property of the REQUEST, not of the
  // class, and writing it down would make it stale the moment a teacher changes.
  const rows: (ClassRoster & { canAdminister?: boolean })[] = [];
  for (const cls of mine) {
    const administer = await canAdminister(cls, teaching?.id ?? null);
    rows.push({ ...(administer ? await liveRoster(cls) : await memberRoster(cls, me)), canAdminister: administer });
  }
  for (const cls of administered) {
    if (await canAdminister(cls, teaching?.id ?? null)) rows.push({ ...(await liveRoster(cls)), canAdminister: true });
  }
  return NextResponse.json({ classes: rows, teaching: rows.some((r) => r.canAdminister) });
}

interface Body {
  action: "create" | "join" | "report" | "update" | "provision" | "revoke";
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
  /** provision: the learners this teacher is enrolling in the class, by name.
   *  Each gets a profile, a PIN (returned ONCE) and a credential row on the
   *  class; nothing is printed twice and nothing is stored in the clear.
   *
   *  An entry that names an EXISTING classroom `id` re-issues that learner's PIN
   *  instead of enrolling a new one — "I forgot my PIN" must not create a second
   *  record, which is what revoke-then-provision would do. */
  learners?: { handle?: string; id?: string }[];
  /** revoke: whose classroom credential to destroy. */
  learnerId?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Body;
    // Same explicit repair as the read door, for the same reason and at the same
    // level: a JOIN is a membership decision, and a roster that still carries
    // pre-identity rows would decide it against a table that cannot name its own
    // members. Best-effort, as on the read path.
    await reconcileClassIdentities().catch(() => {});
    // WHICH CREDENTIAL THIS ACTION NEEDS DEPENDS ON WHAT IT IS.
    //
    //   learner actions (join, report)  the caller's own capability — as before.
    //   teacher actions (create, update, provision, revoke)
    //                                  a signed-in teaching ACCOUNT, and NO
    //                                  learner capability at all. This is the fix
    //                                  for the measured defect: the capability
    //                                  check used to run for every action, and
    //                                  `create` then treated the caller's profile
    //                                  as the teacher. Asking for a capability here
    //                                  would reintroduce exactly that.
    const TEACHER_ACTIONS = new Set(["create", "update", "provision", "revoke"]);
    let caller: ProfileState | null = null;
    if (!TEACHER_ACTIONS.has(body.action)) {
      const auth = await authorizeLearner(typeof body.id === "string" ? body.id : null, body.secret);
      if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
      caller = auth.state;
    }
    switch (body.action) {
      case "create": {
        // ── A CLASS IS CREATED BY A TEACHER ACCOUNT, AND NOTHING ELSE ────────
        //
        // MEASURED DEFECT (shared-device audit): this branch used to accept any
        // profile capability, so a learner's own id+secret created a class and
        // became its "teacher". Every later door asked `isTeacherOf`, which
        // compares PROFILE ids — and a capability is that profile — so the same
        // two strings could then set work, read every classmate's answers and
        // export the roster. No role was consulted anywhere.
        //
        // The fix is not a bigger secret or a hidden button: the authority is a
        // DIFFERENT KIND of credential. A signed-in account with a teaching role
        // owns the class; the profile capability only ever says who is asking.
        const teacher = await teacherCaller(req);
        if (!teacher.ok) return NextResponse.json({ error: teacher.error }, { status: teacher.status });
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
        const cls: ClassRoster = await createClass((joinCode) => ({
          id: newId("cls"),
          name: (body.name ?? "Untitled class").slice(0, 60),
          teacher: "teacher",
          joinCode,
          language: body.language ?? "en",
          conceptIds: (body.conceptIds ?? []).slice(0, 12),
          subject: body.subject as SubjectId | undefined,
          specificationId: course,
          // ── THE TEACHER IS NOT A MEMBER OF THEIR OWN CLASS ──────────────
          //
          // They used to be enrolled as the first student, which made one
          // person both the roster's owner and a row on it. The live view hid
          // the row again (class-view#resolveMembers) so the table looked
          // right, but the RECORD said the teacher was a learner in their own
          // class: `isMemberOf` answered yes, the listing counted them as a
          // member before adding them as an administrator, and their evidence
          // was read as a pupil's. A class is a roster of learners; the person
          // who owns it is named by `ownerId`/`teacherAccountId`, which is a
          // different fact and is where it belongs.
          students: {},
          members: [],
          createdAt: Date.now(),
          // WHOSE PROFILE the class belongs to (a display fact and the storage
          // key), and SEPARATELY the ACCOUNT that may administer it. Two fields
          // because they are two facts: `ownerId` travels with a capability,
          // `teacherAccountId` is the one a teacher-only door accepts.
          ownerId: teacher.profileId,
          teacherAccountId: teacher.account.id,
        }));
        return NextResponse.json({ cls });
      }
      case "join": {
        // The branch above only skips the capability check for teacher actions;
        // this one needs the caller's identity, and says so rather than asserting.
        if (!caller) return NextResponse.json({ error: "missing id" }, { status: 400 });
        // ── ONE PERSON, ONE SIDE OF THE DESK ────────────────────────────────
        //
        // A teaching ACCOUNT may not join a class. The console used to offer
        // both boxes side by side — "create a class" and "join a class" — for
        // the same person, and the server took either: a teacher's own learner
        // profile could join their colleague's class (or their own, by code), so
        // one identity was simultaneously a class's administrator and a pupil on
        // a roster. Every screen then had to answer "which one is this?" from a
        // flat profile, and the product's answer to a person was "both".
        //
        // The rule is the ACCOUNT'S ROLE, not the shape of the request: a
        // teaching account administers classes, a student account joins them.
        // The refusal is named so an API client hears the reason rather than a
        // generic 403 — and it is checked HERE rather than in the console, so a
        // hidden button is not what enforces it.
        const owner = await accountOwningProfile(caller.profile.id);
        if (owner && isTeachingRole(owner.role)) {
          return NextResponse.json({ error: "teacher_account_cannot_join" }, { status: 403 });
        }
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
        // The JOIN ANSWER IS A READ OF THE CLASS, and it was the same leak as
        // the roster door: a learner who joined was handed every classmate's
        // row in the reply. A joiner is not the class's teacher (a teacher
        // joining their own class by code already is), so what they get back is
        // their own row — the fact they need is that the join worked.
        return NextResponse.json({
          cls: isTeacherOf(upd.cls, caller) ? upd.cls : await memberRoster(upd.cls, caller),
        });
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
        const existing = await getClass(body.clsId);
        if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
        // The class's ADMINISTRATOR, on the account — not the caller's profile.
        const teacher = await teacherOfClass(req, existing);
        if (!teacher.ok) return NextResponse.json({ error: teacher.error }, { status: teacher.status });
        const upd = await updateClassById(body.clsId, (cls) => {
          if (!isTeacherOf(cls, teacher.profile)) return { error: "not_the_teacher" as const, status: 403 as const };
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
        if (!caller) return NextResponse.json({ error: "missing id" }, { status: 400 });
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
      case "provision": {
        // ── THE TEACHER ISSUES THE CREDENTIALS ─────────────────────────────
        //
        // This is the kiosk model's first half: forty learners on three handsets
        // cannot hold forty permanent capabilities (that is the shared-device
        // audit's finding, and the reason the household roster is not the
        // classroom's identity system). The teacher creates the learners HERE,
        // the server mints a PIN for each, and the PIN is returned exactly once
        // — it is stored as a scrypt hash on the class and is never readable
        // again. A PIN is not a secret anyone can reuse off the device: it is
        // exchanged at /api/kiosk/login for a session the server can end.
        if (!body.clsId) return NextResponse.json({ error: "missing class" }, { status: 400 });
        const existing = await getClass(body.clsId);
        if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
        const teacher = await teacherOfClass(req, existing);
        if (!teacher.ok) return NextResponse.json({ error: teacher.error }, { status: teacher.status });
        const named = Array.isArray(body.learners)
          ? body.learners.map((l) => ({
              handle: typeof l?.handle === "string" ? l.handle.trim().slice(0, 24) : "",
              id: typeof l?.id === "string" ? l.id : "",
            }))
          : [];
        if (named.length === 0) return NextResponse.json({ error: "no learners named" }, { status: 400 });
        if (named.length > 200) return NextResponse.json({ error: "too many learners" }, { status: 400 });
        if (named.some((l) => !l.id && !l.handle)) return NextResponse.json({ error: "no learners named" }, { status: 400 });
        // A re-issue names a learner who ALREADY has a classroom credential on
        // THIS class. Anything else is refused rather than guessed at: minting a
        // PIN for an id the class does not carry would hand a teacher a key to a
        // record that is not on their roster.
        for (const l of named) {
          if (l.id && !existing.kiosk?.[l.id]) {
            return NextResponse.json({ error: "not_a_classroom_learner" }, { status: 404 });
          }
        }
        const handleOf = (id: string): string =>
          Object.entries(existing.membersById ?? {}).find(([, v]) => v === id)?.[0] ?? "";

        const issued: { id: string; handle: string; pin: string; reissued: boolean }[] = [];
        for (const { id: existingId, handle: namedHandle } of named) {
          // THE SAME CREDENTIAL ROW, A NEW PIN. An existing learner keeps their
          // record, their handle and their work; only the secret that opens it
          // changes (and their live sessions are ended below).
          if (existingId) {
            issued.push({ id: existingId, handle: handleOf(existingId) || namedHandle, pin: mintKioskPin(), reissued: true });
            continue;
          }
          const handle = namedHandle;
          const id = newId("prof");
          const state = newProfileState(id, {
            handle,
            country: teacher.profile.profile.country ?? "XX",
            language: existing.language || "en",
            subjects: existing.subject ? [existing.subject] : teacher.profile.profile.subjects,
            // A teacher-provisioned learner is enrolled, not mid-wizard: the
            // class declared their subject and the school declared the language,
            // so the guard must not send them back through onboarding.
            onboardedAt: Date.now(),
          });
          // The permanent capability exists because every learner record has one
          // (an empty secret is a record the first writer could claim) and is
          // NEVER DISCLOSED: this learner's only usable credential is the session
          // its PIN buys, which the server ends at hand-back.
          state.secret = mintUnshownSecret();
          if (existing.specificationId) {
            const spec = specById(existing.specificationId);
            if (spec) {
              state.profile.spec = spec.id;
              state.profile.specLevel = spec.levels[0].id;
            }
          }
          // The record is written BEFORE the roster row, so a refused store
          // cannot leave a member the teacher can see and nobody can sign in as.
          await saveProfile(state);
          issued.push({ id, handle, pin: mintKioskPin(), reissued: false });
        }
        const upd = await updateClassById(existing.id, (cls) => {
          cls.kiosk ??= {};
          for (const l of issued) {
            const salt = makeSalt();
            cls.kiosk[l.id] = { salt, hash: kioskPinHash(l.pin, salt), issuedAt: Date.now() };
            // A learner already on the roster keeps their row: `freeHandle` is
            // for a NEW member, and running it for an existing one would bind a
            // second handle to the same record (the collision this roster was
            // repaired for in the first place).
            if (!(cls.members ?? []).includes(l.id)) {
              const h = freeHandle(cls, l.handle, l.id);
              cls.students[h] = cls.students[h] ?? {};
              cls.membersById ??= {};
              cls.membersById[h] = l.id;
              cls.members ??= [];
              cls.members.push(l.id);
            }
          }
          return { provisioned: issued.length };
        });
        if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
        // A RE-ISSUED PIN KILLS THE SESSIONS THE OLD ONE BOUGHT. Without this, a
        // handset still holding the old token would keep working until expiry,
        // and the re-issue would be a courtesy rather than a revocation.
        for (const l of issued) if (l.reissued) await deleteKioskSessionsFor(l.id);
        // THE ONLY TIME THE PINS LEAVE THIS FUNCTION. A caller that loses them
        // re-issues (see `revoke`), which is deliberate: a credential the server
        // can show twice is a credential that lives in a log.
        return NextResponse.json({ learners: issued, cls: upd.cls });
      }
      case "revoke": {
        // DESTROYING a credential. "I forgot my PIN" is answered by `provision`
        // with the learner's `id` (a new PIN on the SAME record); this action is
        // for a learner who should no longer have a way in at all — a phone
        // handed on, a class removed from the timetable. Sessions for that
        // learner are ended here too, or a handset still holding one would keep
        // working past its revocation.
        if (!body.clsId) return NextResponse.json({ error: "missing class" }, { status: 400 });
        if (typeof body.learnerId !== "string" || !body.learnerId) {
          return NextResponse.json({ error: "missing learner" }, { status: 400 });
        }
        const existing = await getClass(body.clsId);
        if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
        const teacher = await teacherOfClass(req, existing);
        if (!teacher.ok) return NextResponse.json({ error: teacher.error }, { status: teacher.status });
        const upd = await updateClassById(existing.id, (cls) => {
          if (!cls.kiosk?.[body.learnerId as string]) return { error: "not a classroom learner" as const, status: 404 as const };
          delete cls.kiosk[body.learnerId as string];
          return { revoked: body.learnerId as string };
        });
        if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
        const r = upd.result as { error?: string; status?: number; revoked?: string };
        if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 400 });
        await deleteKioskSessionsFor(body.learnerId);
        return NextResponse.json({ revoked: r.revoked });
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
