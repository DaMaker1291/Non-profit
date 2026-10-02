// ── THE LIVE CLASS VIEW, IN ONE PLACE ───────────────────────────────────────
//
// Two routes answer with a class's mastery material — the roster door
// (/api/classes) and the offline pack (/api/pack-export, whose weekly plan is
// built from what the class has actually measured). Both must derive their
// view the SAME way, or a teacher's table and a teacher's printed plan can
// disagree about the same students. This is the one derivation.
//
// THE RULE: a member's row is their evidence LEDGER's projection — the same
// `projectLearner` the learner's own pages read — never a number any client
// reported. A self-report may flatter `cls.students`; it can never move this.
// What the ledger has never measured is absent from the row: unknown, not 0.
import { listProfileStates } from "./store";
import { isTeacherOf, teacherHandle } from "./class-membership";
// Relative specifiers: this module is in the compile mirror, which is built
// with `tsc <files> ...` and no tsconfig, where `@/...` does not resolve.
import { projectLearner } from "../evidence";
import { readEvidence } from "./evidence";
import type { ClassRoster, ClassMemberLive, ProfileState } from "../types";

/**
 * The STUDENTS of a class with their profile states resolved: identity first
 * (the learner id the join recorded), then the handle the roster actually
 * holds. One learner may appear under two handles — only the first is kept, so
 * a member is counted once.
 *
 * Shared by the live roster and the assignment monitor so the two can never
 * disagree about WHO is in the class. A handle with no profile behind it
 * (joined before signing in) is simply absent: the stored roster still names
 * them, but there is no ledger to read.
 *
 * THE MEMBER IS THE ONE THE ROSTER BOUND TO THAT HANDLE (`membersById`), which
 * is identity. This used to fall back to "the profile whose display name is
 * this handle" — so a class whose real member was called Alex would read the
 * evidence of ANY other Alex in the store, and the teacher's table would show
 * a stranger's numbers beside real students' names. A handle with no binding is
 * now exactly what it says: a row nobody owns.
 *
 * THE TEACHER IS NOT ONE OF THEM. A class's creator is a member — that is how
 * they read their own roster — but they are its teacher, not a student who owes
 * it work, and counting them as one made every class one student larger than it
 * was and listed the teacher under "needs attention" on every assignment they
 * set. The rule is asked of lib/server/class-membership#isTeacherOf rather than
 * re-derived here.
 */
export async function resolveMembers(cls: ClassRoster): Promise<Array<{ handle: string; state: ProfileState }>> {
  const states = await listProfileStates();
  const byId = new Map(states.map((s) => [s.profile.id, s]));
  const out: Array<{ handle: string; state: ProfileState }> = [];
  const used = new Set<string>();
  for (const handle of Object.keys(cls.students)) {
    // Identity, or nothing. No name matching: see class-membership.ts.
    const state = byId.get(cls.membersById?.[handle] ?? "");
    if (!state || used.has(state.profile.id)) continue;
    used.add(state.profile.id);
    if (isTeacherOf(cls, state)) continue;
    out.push({ handle, state });
  }
  return out;
}

/** One member's live view, derived from their own ledger. Only independent
 *  work is shown per concept: guided practice measures the teaching, not the
 *  learner — a concept asked but never answered independently is unmeasured
 *  here, and the plan treats absence of data as exactly that. */
function deriveLive(learnerId: string, handle: string, events: ReturnType<typeof readEvidence>): ClassMemberLive {
  const p = projectLearner(events);
  const concepts: ClassMemberLive["concepts"] = {};
  for (const [conceptId, c] of Object.entries(p.byConcept)) {
    if (c.independent.asked > 0) {
      concepts[conceptId] = {
        asked: c.independent.asked,
        correct: c.independent.correct,
        rate: Math.round((c.independent.correct / c.independent.asked) * 100) / 100,
      };
    }
  }
  const weakestEntry = Object.entries(concepts).sort((a, b) => a[1].rate - b[1].rate || (a[0] < b[0] ? -1 : 1))[0];
  return {
    learnerId,
    concepts,
    weakest: weakestEntry ? { conceptId: weakestEntry[0], rate: weakestEntry[1].rate } : null,
    misconceptions: Object.fromEntries(
      Object.entries(p.byConcept)
        .flatMap(([, c]) => Object.entries(c.misconceptions))
        .reduce((acc, [mid, n]) => {
          acc.set(mid, (acc.get(mid) ?? 0) + n);
          return acc;
        }, new Map<string, number>()),
    ),
    answers: p.totals.answers,
    projectionVersion: p.projectionVersion,
  };
}

/** Attach the live, ledger-derived view to the stored roster. A handle with no
 *  profile behind it (joined before signing in) simply has no live entry — the
 *  stored roster still names them, so the teacher sees who joined.
 *
 *  `students` is the TEACHER'S view of the class, and it is the one every count
 *  on the teacher's own screen is taken from (members, "n students", the
 *  measured ratio, the table's rows). So the teacher is left out of it: a class
 *  of one child reads "1 student", not "2". The stored roster is untouched —
 *  membership is what lets the creator read their own class, and dropping them
 *  from it would lock them out of it. */
export async function liveRoster(cls: ClassRoster): Promise<ClassRoster> {
  const members = await resolveMembers(cls);
  const live: Record<string, ClassMemberLive> = {};
  for (const { handle, state } of members) {
    live[handle] = deriveLive(state.profile.id, handle, readEvidence(state.profile.id));
  }
  const teacher = teacherHandle(cls);
  const students: ClassRoster["students"] = {};
  for (const [handle, report] of Object.entries(cls.students)) {
    if (handle === teacher) continue;
    students[handle] = report;
  }
  return { ...cls, students, live };
}
