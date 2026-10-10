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
import { isDeviceReported, orderEvents, projectLearner } from "../evidence";
// The proof vocabulary, asked for rather than restated: what one answer
// PROVED, what a concept's work proved, and the state of its delayed recall
// are one rule each (lib/proof.ts), shared with the learner's own screens and
// with the assignment monitor.
import { isRetentionEvidence, proofVerdict, retentionState, strongestProof } from "../proof";
// WHICH answers are "the recent ones" is a rule too, and it already exists
// (lib/evidence-view.ts) — the same one the learner's own timeline reads, so a
// teacher and a child cannot be shown different "last answers".
import { recentAnswers } from "../evidence-view";
// What a class may be measured against: the curriculum it DECLARED, narrowed to
// concepts the bank can serve. Never a default subject, and never a curriculum
// the class never named.
import { assignableConcepts } from "./assignment-view";
import { readEvidence } from "./evidence";
import type { ClassRoster, ClassMemberLive, ClassMemberEvidence, ProfileState } from "../types";

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

/** How many answers the detail lists, and how many curriculum concepts it is
 *  willing to NAME as unmeasured. The cap is a cap on DISPLAY, not on the
 *  derivation: a teacher reading "24 of them" knows the record holds more, and
 *  nothing is claimed about the ones left off the end. */
const RECENT_CAP = 15;
const UNMEASURED_CAP = 24;

/**
 * ONE member's evidence in detail — the answer to "what can this student
 * actually demonstrate?", derived from their ledger the same way every other
 * number about them is (nothing stored, nothing accepted from a client).
 *
 * WHAT IT ADDS OVER THE ROSTER'S ROW. The row is a rate. This says what the
 * work PROVED (a hint-free transfer and a hinted right answer are not the same
 * outcome), HOW each recent answer was done, and — the part a teacher cannot
 * get anywhere else — which concepts of the class's own curriculum have never
 * been asked at all, so a gap in the record is not read as a gap in the child.
 *
 * TWO RULES IT DOES NOT INVENT:
 *   · the INDEPENDENT slice is reported separately and is exactly what the
 *     roster's mastery column shows, so the drawer and the table cannot
 *     disagree about one learner;
 *   · retention is a STATE, asked of lib/proof.ts#retentionState, and it is
 *     `unmeasured` until a due review happened. A ratio cannot say whether a
 *     learner who once held something still holds it, and absence is never
 *     read as forgetting.
 *
 * A misconception is never presented as a fact about the learner: the tags on
 * a wrong answer say the item was BUILT to probe that rule. They are returned
 * as hypotheses, with the count that supports each and the concepts they were
 * seen on, so a teacher can check the claim instead of being told to believe
 * it.
 */
export function memberEvidence(cls: ClassRoster, handle: string, state: ProfileState): ClassMemberEvidence {
  const events = readEvidence(state.profile.id);
  const p = projectLearner(events);

  // When each answer happened relative to the previous evidence on the SAME
  // concept — the third condition `isRetentionEvidence` asks for, and the one
  // fact a single answer does not carry. Built from the ledger's own order on
  // the SERVER's clock (`at`); a device's claim about when it answered
  // (`deviceAt`) is never read here, so a backdated batch cannot manufacture
  // memory evidence.
  const sinceLast = new Map<string, number | null>();
  const seenAt = new Map<string, number>();
  for (const e of orderEvents(events)) {
    if (e.type !== "answer_submitted" || !e.conceptId) continue;
    const prev = seenAt.get(e.conceptId);
    sinceLast.set(e.id, prev === undefined ? null : e.at - prev);
    seenAt.set(e.conceptId, e.at);
  }

  // The curriculum the CLASS declared. An entry can exist in `byConcept` with
  // no answer on it (a hint action alone creates one), so "measured" is
  // `attempts > 0` — never the mere presence of an entry.
  const curriculum = cls.subject ? assignableConcepts(cls.subject, cls.specificationId) : [];

  const concepts: ClassMemberEvidence["concepts"] = [];
  for (const [conceptId, c] of Object.entries(p.byConcept)) {
    if (c.attempts === 0) continue;
    concepts.push({
      conceptId,
      answers: c.attempts,
      correct: c.correct,
      independent: {
        asked: c.independent.asked,
        correct: c.independent.correct,
        rate: c.independent.asked > 0
          ? Math.round((c.independent.correct / c.independent.asked) * 100) / 100
          : 0,
      },
      // The same four counts the assignment monitor feeds this rule, so one
      // concept cannot "prove independence" on one screen and "support" on
      // another.
      proof: strongestProof({
        correct: c.correct,
        independentCorrect: c.independent.correct,
        transferCorrect: c.transfer.correct,
        retentionCorrect: c.retention.correct,
      }),
      retention: retentionState(c.retention),
      lastAt: c.lastAt,
    });
  }
  // Weakest measured first — what a teacher opens the drawer to find — and the
  // concepts with no INDEPENDENT work at all after them (Infinity sorts last
  // and is never shown as a rate).
  concepts.sort((x, y) => {
    const xr = x.independent.asked > 0 ? x.independent.rate : Infinity;
    const yr = y.independent.asked > 0 ? y.independent.rate : Infinity;
    return xr - yr || (x.conceptId < y.conceptId ? -1 : 1);
  });

  const asked = new Set(concepts.map((c) => c.conceptId));
  const unmeasured = curriculum.filter((id) => !asked.has(id)).slice(0, UNMEASURED_CAP);

  const recent = recentAnswers(events, RECENT_CAP).map((e) => {
    // The rule, asked for: a delayed unaided recall is what makes an answer
    // retention EVIDENCE, and `proofVerdict` refuses to name it on a miss.
    const retained = isRetentionEvidence({
      source: e.source,
      hints: e.hints,
      sinceLast: sinceLast.get(e.id) ?? null,
    });
    return {
      conceptId: e.conceptId ?? "",
      at: e.at,
      correct: e.correct,
      mode: e.mode,
      source: e.source,
      hints: e.hints,
      proof: proofVerdict({ correct: e.correct, mode: e.mode, source: e.source, hints: e.hints, retained }),
      // Tags ride on a WRONG answer only, which is also the only place the
      // ledger records them — a right answer cannot confirm a misconception.
      hypothesisIds: e.correct ? [] : [...(e.tags ?? [])],
      offline: isDeviceReported(e),
    };
  });

  // The support behind each hypothesis, aggregated over the whole record rather
  // than only the recent window: a signal that rests on an older answer is
  // still a signal, and a teacher checking it needs the count that exists.
  const hyp = new Map<string, { hits: number; conceptIds: Set<string> }>();
  for (const [conceptId, c] of Object.entries(p.byConcept)) {
    for (const [id, hits] of Object.entries(c.misconceptions)) {
      const a = hyp.get(id) ?? { hits: 0, conceptIds: new Set<string>() };
      a.hits += hits;
      a.conceptIds.add(conceptId);
      hyp.set(id, a);
    }
  }
  const hypotheses = [...hyp.entries()]
    .map(([id, a]) => ({ id, hits: a.hits, conceptIds: [...a.conceptIds].sort() }))
    .sort((x, y) => y.hits - x.hits || (x.id < y.id ? -1 : 1));

  return {
    handle,
    learnerId: state.profile.id,
    curriculumDeclared: Boolean(cls.subject),
    // The projection's own counters, not a second sum: the learner's evidence
    // view bands these same four per concept with one shared rule.
    dimensions: {
      recalled: p.totals.answers > 0 ? { asked: p.totals.answers, correct: p.totals.correct } : null,
      applied: p.totals.independent.asked > 0 ? { ...p.totals.independent } : null,
      transferred: p.totals.transfer.asked > 0 ? { ...p.totals.transfer } : null,
      retained: p.totals.retention.asked > 0
        ? { asked: p.totals.retention.asked, correct: p.totals.retention.correct }
        : null,
    },
    concepts,
    unmeasured,
    recent,
    hypotheses,
    answers: p.totals.answers,
    projectionVersion: p.projectionVersion,
  };
}
