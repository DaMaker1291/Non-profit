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
import { memberHandle } from "./class-membership";
// Relative specifiers: this module is in the compile mirror, which is built
// with `tsc <files> ...` and no tsconfig, where `@/...` does not resolve.
import { projectLearner } from "../evidence";
import { readEvidence } from "./evidence";
import type { ClassRoster, ClassMemberLive, ProfileState } from "../types";

/**
 * The members of a class with their profile states resolved: identity first
 * (the learner id the join recorded), then the handle the roster actually
 * holds. One learner may appear under two handles — only the first is kept, so
 * a member is counted once.
 *
 * Shared by the live roster and the assignment monitor so the two can never
 * disagree about WHO is in the class. A handle with no profile behind it
 * (joined before signing in) is simply absent: the stored roster still names
 * them, but there is no ledger to read.
 */
export async function resolveMembers(cls: ClassRoster): Promise<Array<{ handle: string; state: ProfileState }>> {
  const states = await listProfileStates();
  const byId = new Map(states.map((s) => [s.profile.id, s]));
  const byHandle = new Map(
    states.filter((s) => memberHandle(s, "")).map((s) => [memberHandle(s, ""), s]),
  );
  const out: Array<{ handle: string; state: ProfileState }> = [];
  const used = new Set<string>();
  for (const handle of Object.keys(cls.students)) {
    const state = byId.get(cls.membersById?.[handle] ?? "") ?? byHandle.get(handle);
    if (!state || used.has(state.profile.id)) continue;
    used.add(state.profile.id);
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
 *  stored roster still names them, so the teacher sees who joined. */
export async function liveRoster(cls: ClassRoster): Promise<ClassRoster> {
  const members = await resolveMembers(cls);
  const live: Record<string, ClassMemberLive> = {};
  for (const { handle, state } of members) {
    live[handle] = deriveLive(state.profile.id, handle, readEvidence(state.profile.id));
  }
  return { ...cls, live };
}
