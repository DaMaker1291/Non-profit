import { NextResponse } from "next/server";
import { listClasses, newId, updateClassById } from "@/lib/server/store";
import { authorizeLearner } from "@/lib/server/capability";
import { isMemberOf, isTeacherOf } from "@/lib/server/class-membership";
import { resolveMembers } from "@/lib/server/class-view";
import { assignableConcepts, deriveAssignmentProgress, monitorFor } from "@/lib/server/assignment-view";
import { readEvidence } from "@/lib/server/evidence";
import { SUBJECT_IDS } from "@/lib/subjects";
import type {
  Assignment,
  AssignmentMemberProgress,
  AssignmentMonitor,
  SubjectId,
} from "@/lib/types";

// ── SET WORK, AND READ WHAT IT PRODUCED ─────────────────────────────────────
//
// The one door for teacher assignments. Two questions, and they are different:
//
//   "is this person IN the class?"      → they may read their OWN work.
//   "is this person THE TEACHER?"       → they may set work, remove it, and
//                                          read what every member produced.
//
// A class carries every member's measured work, so the second question is the
// only one that licenses a monitor. Both rules live in lib/server/class-
// membership so this door and the roster door cannot answer them differently.
//
// A READ IS SCOPED, AND THAT IS THE WHOLE DESIGN: a student receives exactly
// one row — their own — and a teacher receives the rows of the class they own.
// There is no "get the class's assignments" shape that hands everybody
// everybody else's progress, because that shape is the leak, not the feature.
//
// NOTHING HERE IS STORED AS A PROGRESS NUMBER. The assignment record itself is
// concepts + a deadline on the class (a real state transition); completion,
// accuracy, weaknesses and misconceptions are projections of each member's own
// evidence ledger over the window the assignment opened
// (lib/server/assignment-view). A stored counter would be a second copy of the
// record, and a second copy is the one that drifts.

const ASSIGNMENT_MAX_CONCEPTS = 12;
const DUE_MAX_MS = 400 * 24 * 60 * 60 * 1000;

/** What one student sees: their own row for a piece of work set for them. */
interface AssignedWork {
  assignment: Assignment;
  className: string;
  /** The curriculum the work was set from (the class's, as declared when the
   *  assignment was made) — what a surface needs to link the learner to the
   *  right concept page. */
  subject: SubjectId;
  mine: AssignmentMemberProgress;
}

/** GET /api/assignments?me=...&secret=... — a learner's work, scoped to them.
 *  `assigned` is their own rows for classes they are a member of; `monitor` is
 *  the per-member view for classes they OWN. A teacher is a member of their own
 *  class, so the two are split by ownership rather than by role string. */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const auth = await authorizeLearner(searchParams.get("me"), searchParams.get("secret"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const me = auth.state;

  const mineClasses = (await listClasses()).filter((cls) => isMemberOf(cls, me));
  const assigned: AssignedWork[] = [];
  const monitor: AssignmentMonitor[] = [];
  let ownLedger: ReturnType<typeof readEvidence> | null = null;

  // What each class the caller OWNS may be set work on. The candidate list is
  // computed HERE, from the class's declared curriculum, so a surface renders
  // the one rule rather than rebuilding it (and a picker cannot offer a concept
  // the door would refuse). A class that has declared no subject offers
  // nothing and says so — no default curriculum is substituted.
  const owned = mineClasses
    .filter((cls) => isTeacherOf(cls, me))
    .map((cls) => ({
      id: cls.id,
      name: cls.name,
      subject: cls.subject ?? null,
      specificationId: cls.specificationId ?? null,
      assignable: cls.subject ? assignableConcepts(cls.subject, cls.specificationId ?? null) : [],
    }));

  for (const cls of mineClasses) {
    const work = cls.assignments ?? [];
    if (work.length === 0) continue;
    const teacher = isTeacherOf(cls, me);
    // A teacher reads every member's row; a member reads only their own. The
    // resolution is the same one the roster uses, so the two cannot disagree
    // about who is in the class. Each member's ledger is read ONCE and reused
    // across the class's assignments.
    const memberStates = teacher ? await resolveMembers(cls) : [];
    const ledgers = new Map<string, ReturnType<typeof readEvidence>>();
    if (teacher) for (const m of memberStates) ledgers.set(m.handle, readEvidence(m.state.profile.id));
    for (const a of work) {
      if (teacher) {
        const memberRows = memberStates.map((m) =>
          deriveAssignmentProgress(a, m.handle, m.state.profile.id, ledgers.get(m.handle) ?? []),
        );
        monitor.push(monitorFor(a, cls.name, memberRows));
      } else {
        ownLedger ??= readEvidence(me.profile.id);
        const handle = me.profile.handle ?? Object.keys(cls.students)[0] ?? "student";
        assigned.push({
          assignment: a,
          className: cls.name,
          // The curriculum the work was set from, recorded on the work itself
          // when it was set — so a surface links the learner to the right
          // concept page even if the class's declaration later changes.
          subject: a.subject,
          mine: deriveAssignmentProgress(a, handle, me.profile.id, ownLedger),
        });
      }
    }
  }

  return NextResponse.json({ assigned, monitor, classes: owned });
}

interface Body {
  action: "create" | "remove";
  /** The calling profile — a capability, as on every other door. */
  id?: string;
  secret?: string;
  /** The class the work belongs to. */
  clsId?: string;
  /** create: the concepts to set, drawn from the class's declared curriculum. */
  conceptIds?: string[];
  /** create: the deadline (epoch ms). Must be in the future. */
  dueAt?: number;
  /** create: an optional label; empty is fine and the surface composes one. */
  title?: string;
  /** create: the subject to declare for a class that has not declared one.
   *  Ignored when the class already declares its own curriculum. */
  subject?: string;
  /** remove: which piece of work. */
  assignmentId?: string;
}

/** POST /api/assignments — set work, or remove it. Teacher-only, by identity. */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Body;
    const auth = await authorizeLearner(typeof body.id === "string" ? body.id : null, body.secret);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const caller = auth.state;

    if (typeof body.clsId !== "string" || !body.clsId) {
      return NextResponse.json({ error: "missing class" }, { status: 400 });
    }

    if (body.action === "create") {
      const conceptIds = Array.isArray(body.conceptIds)
        ? body.conceptIds.filter((c): c is string => typeof c === "string" && c.length > 0)
        : [];
      if (conceptIds.length === 0 || conceptIds.length > ASSIGNMENT_MAX_CONCEPTS) {
        return NextResponse.json({ error: "choose between 1 and 12 concepts" }, { status: 400 });
      }
      if (typeof body.dueAt !== "number" || !Number.isFinite(body.dueAt) || body.dueAt <= Date.now()) {
        return NextResponse.json({ error: "due date must be in the future" }, { status: 400 });
      }
      if (body.dueAt > Date.now() + DUE_MAX_MS) {
        return NextResponse.json({ error: "due date too far ahead" }, { status: 400 });
      }
      const title = typeof body.title === "string" ? body.title.trim().slice(0, 80) : "";
      if (body.subject !== undefined && !(SUBJECT_IDS as string[]).includes(body.subject)) {
        return NextResponse.json({ error: "unknown subject" }, { status: 400 });
      }

      const upd = await updateClassById(body.clsId, (cls) => {
        if (!isTeacherOf(cls, caller)) return { error: "not the teacher" as const, status: 403 as const };
        // The curriculum the class actually declared — never a default. A class
        // that declared none may have one declared here (a legacy roster), and
        // a class whose declared course covers none of its subject can be set
        // nothing: both are told, rather than handed a curriculum that was
        // never declared.
        const declared = cls.subject ?? (body.subject as SubjectId | undefined);
        if (!declared) return { error: "declare this class's subject first" as const, status: 400 as const };
        const subject: SubjectId = declared;
        const allowed = assignableConcepts(subject, cls.specificationId ?? null);
        const unknown = conceptIds.filter((c) => !allowed.includes(c));
        if (unknown.length > 0) {
          return { error: `not in this class's curriculum: ${unknown.join(", ")}` as const, status: 400 as const };
        }
        const a: Assignment = {
          id: newId("asg"),
          clsId: cls.id,
          createdBy: caller.profile.id,
          title,
          subject,
          specificationId: cls.specificationId ?? null,
          conceptIds: [...new Set(conceptIds)],
          createdAt: Date.now(),
          dueAt: body.dueAt as number,
        };
        cls.assignments ??= [];
        cls.assignments.push(a);
        // A class that never declared a subject gets one recorded the moment it
        // is set work, so the record says what curriculum the work came from.
        cls.subject ??= subject;
        return { assignment: a };
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      const r = upd.result as { error?: string; status?: number; assignment?: Assignment };
      if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 400 });
      return NextResponse.json({ assignment: r.assignment });
    }

    if (body.action === "remove") {
      if (typeof body.assignmentId !== "string" || !body.assignmentId) {
        return NextResponse.json({ error: "missing assignment" }, { status: 400 });
      }
      const upd = await updateClassById(body.clsId, (cls) => {
        if (!isTeacherOf(cls, caller)) return { error: "not the teacher" as const, status: 403 as const };
        const before = (cls.assignments ?? []).length;
        cls.assignments = (cls.assignments ?? []).filter((a) => a.id !== body.assignmentId);
        if (cls.assignments.length === before) return { error: "not found" as const, status: 404 as const };
        return { removed: body.assignmentId };
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      const r = upd.result as { error?: string; status?: number; removed?: string };
      if (r.error) return NextResponse.json({ error: r.error }, { status: r.status ?? 400 });
      return NextResponse.json({ removed: r.removed });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
