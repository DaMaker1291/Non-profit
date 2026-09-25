import { NextResponse } from "next/server";
import {
  getClass,
  joinCode,
  listClasses,
  newId,
  saveClass,
  updateClassByCode,
} from "@/lib/server/store";
import { authorizeLearner } from "@/lib/server/capability";
import { isMemberOf } from "@/lib/server/class-membership";
import { liveRoster } from "@/lib/server/class-view";
import { SUBJECT_IDS } from "@/lib/subjects";
import type { ClassRoster, SubjectId } from "@/lib/types";

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
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
    return NextResponse.json({ cls: await liveRoster(cls) });
  }
  // The listing shows only classes the caller belongs to.
  const all = await listClasses();
  const mine = all.filter((cls) => isMemberOf(cls, me));
  return NextResponse.json({ classes: await Promise.all(mine.map(liveRoster)) });
}

interface Body {
  action: "create" | "join" | "report";
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
  /** Optional course (specification) for the class. */
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
        const cls: ClassRoster = {
          id: newId("cls"),
          name: (body.name ?? "Untitled class").slice(0, 60),
          teacher: "teacher",
          joinCode: joinCode(),
          language: body.language ?? "en",
          conceptIds: (body.conceptIds ?? []).slice(0, 12),
          subject: body.subject as SubjectId | undefined,
          specificationId: body.specificationId ?? null,
          students: {},
          createdAt: Date.now(),
        };
        // The creator is the class's first member: they will read their own
        // roster, and the plan engine needs their evidence like anyone's.
        const h = (caller.profile.handle ?? "teacher").slice(0, 24);
        cls.students[h] = {};
        cls.membersById = { [h]: caller.profile.id };
        cls.members = [caller.profile.id];
        // The creator is the class's TEACHER — the one authority that may set
        // its work and read its monitor. Recorded as the learner id, never the
        // role label (which every class carries) or a joiner-chosen handle.
        cls.ownerId = caller.profile.id;
        await saveClass(cls);
        return NextResponse.json({ cls });
      }
      case "join": {
        const upd = await updateClassByCode(body.joinCode ?? "", (cls) => {
          const h = (body.handle ?? caller.profile.handle ?? "student").slice(0, 24);
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
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
