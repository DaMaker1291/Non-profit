import { NextResponse } from "next/server";
import { getClass, listClasses, newId, updateClassById } from "@/lib/server/store";
import { authorizeLearner } from "@/lib/server/capability";
import { isMemberOf, isTeacherOf } from "@/lib/server/class-membership";
import { resolveMembers } from "@/lib/server/class-view";
import { assignableConcepts, deriveAssignmentProgress, monitorFor } from "@/lib/server/assignment-view";
import { readEvidence } from "@/lib/server/evidence";
import {
  deriveClassNeeds,
  derivePrerequisiteGaps,
  memberOutcome,
  outcomeVerdict,
  type MemberOutcome,
} from "@/lib/server/needs";
import {
  findOpen,
  getRecord,
  INTERVENTION_VERSION,
  listForClass,
  saveRecord,
  withNeed,
} from "@/lib/server/interventions";
import { getConcept } from "@/lib/genome";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import type {
  Assignment,
  ClassNeed,
  DecisionKind,
  FindingKind,
  InterventionRecord,
  SubjectId,
} from "@/lib/types";

// ── THE NEEDS DOOR (§8): evidence → teacher review → recorded action ────────
//
// The teacher is the ONLY caller. Everything an intervening surface shows —
// the findings, the population counts, the evidence links, the proposal, the
// outcome — is derived from the members' own ledgers on THIS door's side, and
// a member of the class can never read it: a learner who asked for "the
// class's learning needs" is exactly the leak this door must refuse, and it
// answers with the same two refusals the class door uses.
//
// ACTIONS:
//   GET  ?cls=…   → the class's open needs, derived now + its intervention
//                    records
//   GET  (no cls) → the strongest needs across every class the caller OWNS
//                    (Teacher Home's cross-class view, one read)
//   POST propose  → freeze a finding into a record awaiting review
//                    (idempotent: one OPEN record per (cls, concept, kind))
//   POST assign   → create the assignment THROUGH THE ONE CREATION PATH'S
//                    OWN RULES (same validation, same record shape) and
//                    stamp the baseline instant
//   POST decline  → the teacher reviewed it and chose not to act — recorded
//   POST read     → the outcome: who demonstrated unaided, who needs review
//   POST decide   → the teacher's next step, recorded on the record
//
// Nothing here mints evidence: the loop READS the ledger, records its review
// in interventions.json, and the ledger itself is only ever written by the
// ordinary answer paths. An intervention cannot succeed itself — the only
// thing that can move its outcome is new recorded work by the students.

/** Assemble the class's findings, from the ledgers alone. `members` are the
 *  STUDENTS with their full ledgers (resolveMembers excludes the teacher);
 *  the curriculum is the class's own declared one, never a default. */
async function deriveNeeds(
  cls: NonNullable<Awaited<ReturnType<typeof getClass>>>,
  subjects: SubjectId[] | null,
): Promise<{ needs: ClassNeed[]; curriculum: string[] }> {
  if (!cls.subject) return { needs: [], curriculum: [] };
  const curriculum = assignableConcepts(cls.subject, cls.specificationId ?? null);
  const members = (await resolveMembers(cls)).map((m) => ({
    handle: m.handle,
    learnerId: m.state.profile.id,
    events: readEvidence(m.state.profile.id),
  }));
  const nowMs = Date.now();
  const main = deriveClassNeeds({ members, curriculum, nowMs });
  const gaps = derivePrerequisiteGaps({
    members,
    curriculum,
    // The genome's own prerequisite graph — the same links the learner's
    // pages read, not a second list.
    prereqsOf: (cid) => getConcept(cid)?.prereqs ?? [],
    nowMs,
  }).filter((n) => !main.some((m) => m.id === n.id));
  return { needs: [...main, ...gaps], curriculum };
}

/** The finding id a (kind, concept, misconception) describes — the ONE place
 *  the id a proposal must present is composed, so the door's own re-derivation
 *  can never be looking for a name the derivation does not use. (`weak_rate`
 *  derives as `weak:<concept>` and `hint_dependent` as `hint:<concept>`; a
 *  composer that echoed the kind verbatim made both unreviewable, which is how
 *  a teacher's "prepare targeted work" silently 404'd.)
 *
 *  DELIBERATELY NOT EXPORTED. A `route.ts` is a Next entry point, and Next
 *  generates a validator that requires the module to export HANDLERS and the
 *  documented config keys — nothing else (`Diff<Base, TEntry>` must reduce to
 *  `{ [x: string]: never }`). Exporting this one helper alongside `GET`/`POST`
 *  fails that validator, so `npm run typecheck` went red for anyone who ran it
 *  after a build. Nothing outside this file used either export, so they are
 *  module-local now: the id is still composed in exactly one place, which is
 *  what the comment above is about, and the module is a valid route again. */
function needIdFor(kind: FindingKind, conceptId: string, misconceptionId?: string): string {
  switch (kind) {
    case "misconception": return `mis:${misconceptionId ?? ""}:${conceptId}`;
    case "weak_rate": return `weak:${conceptId}`;
    case "hint_dependent": return `hint:${conceptId}`;
    // A prerequisite finding's id is the compound `prereq:<pre>:<target>` the
    // derivation mints; the concept it acts on is the PREREQUISITE.
    case "prereq_gap": return conceptId.startsWith("prereq:") ? conceptId : `prereq:?${conceptId}`;
    case "unmeasured": return `unmeasured:${conceptId}`;
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const auth = await authorizeLearner(searchParams.get("me"), searchParams.get("secret"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const me = auth.state;

  const clsId = searchParams.get("cls");
  if (clsId) {
    const cls = await getClass(clsId);
    if (!cls) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (!isMemberOf(cls, me)) return NextResponse.json({ error: "not a member" }, { status: 403 });
    if (!isTeacherOf(cls, me)) return NextResponse.json({ error: "not the teacher" }, { status: 403 });
    const { needs } = await deriveNeeds(cls, null);
    const records = (await listForClass(clsId))
      .filter((r) => r.status === "proposed" || r.status === "assigned" || r.status === "resolved");
    return NextResponse.json({ needs, records });
  }

  // No class named: the strongest needs across every class the caller OWNS.
  // Sorted by severity within each class, then capped — Teacher Home reads
  // this, and "too many to read" is the failure mode the cap exists for.
  const mine = (await listClasses()).filter((cls) => isTeacherOf(cls, me));
  const rows: Array<ClassNeed & { className: string; clsId2: string }> = [];
  for (const cls of mine) {
    const { needs } = await deriveNeeds(cls, null);
    for (const n of needs) rows.push({ ...n, className: cls.name, clsId2: cls.id });
  }
  const rank: Record<FindingKind, number> = { misconception: 0, weak_rate: 1, hint_dependent: 2, prereq_gap: 3, unmeasured: 4 };
  rows.sort((a, b) => rank[a.kind] - rank[b.kind] || b.showing - a.showing);
  return NextResponse.json({ needs: rows.slice(0, 12) });
}

interface Body {
  action: "propose" | "assign" | "decline" | "read" | "decide";
  /** The calling profile — a capability, as on every other door. */
  id?: string;
  secret?: string;
  clsId?: string;
  needId?: string;
  conceptId?: string;
  kind?: string;
  misconceptionId?: string;
  targetHandles?: string[];
  /** assign: the concepts the teacher actually chose — the proposal
   *  pre-populates one, and the builder may edit it before anything is set. */
  conceptIds?: string[];
  title?: string;
  dueAt?: number;
  decision?: string;
  note?: string;
}

/** The next-step choices a teacher reads after the outcome. THE LIST IS THIS
 *  FUNCTION'S RETURN so the UI cannot diverge from the door about what is
 *  selectable — and it is exactly the options the mission names, no more:
 *  each one is an action the product can actually take. Not exported, for the
 *  route-contract reason stated above `needIdFor`. */
const DECISION_KINDS: readonly DecisionKind[] = [
  "continue_concept",
  "repeat_practice",
  "address_prerequisite",
  "individual_support",
  "another_diagnostic",
  "collect_more_evidence",
];

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Body;
    const auth = await authorizeLearner(typeof body.id === "string" ? body.id : null, body.secret);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const caller = auth.state;

    if (typeof body.clsId !== "string" || !body.clsId) {
      return NextResponse.json({ error: "missing class" }, { status: 400 });
    }
    const cls = await getClass(body.clsId);
    if (!cls) return NextResponse.json({ error: "not found" }, { status: 404 });
    // Same two refusals the roster door uses: the class's material about its
    // students belongs to its teacher, and to nobody else.
    if (!isMemberOf(cls, caller)) return NextResponse.json({ error: "not a member" }, { status: 403 });
    if (!isTeacherOf(cls, caller)) return NextResponse.json({ error: "not the teacher" }, { status: 403 });

    const members = await resolveMembers(cls);
    const byHandle = new Set(members.map((m) => m.handle));

    switch (body.action) {
      // ── PROPOSE: freeze the finding the teacher is reviewing ─────────
      case "propose": {
        const kind = body.kind as FindingKind | undefined;
        const { conceptId } = body;
        if (!kind || typeof conceptId !== "string" || !conceptId) {
          return NextResponse.json({ error: "missing finding" }, { status: 400 });
        }
        // The described finding MUST re-derive from the class's own ledgers —
        // a client cannot mint an intervention from nothing. The id is
        // composed by the ONE composer, and a prerequisite finding is matched
        // on the concept it acts on (its own id is the compound
        // `prereq:<pre>:<target>`).
        const id = needIdFor(kind, conceptId, body.misconceptionId);
        const { needs } = await deriveNeeds(cls, null);
        const derived = kind === "prereq_gap"
          ? needs.find((n) => n.kind === "prereq_gap" && n.conceptId === conceptId)
          : needs.find((n) => n.id === id);
        if (!derived) {
          // Say WHAT was refused, never a bare 404: the window may have
          // closed (the evidence aged out), or the name may belong to
          // another class.
          return NextResponse.json({ error: "no such finding in this class's evidence" }, { status: 404 });
        }
        // ONE OPEN record per (class, concept, kind): a repeat proposal
        // returns the existing record rather than minting a duplicate —
        // two tabs must not stack two reviews of one finding (test 14).
        const existing = await findOpen(cls.id, derived.conceptId, derived.kind === "prereq_gap" ? "prereq_gap" : kind);
        if (existing) return NextResponse.json({ record: existing, existing: true });

        const rec: InterventionRecord = {
          id: newId("int"),
          clsId: cls.id,
          conceptId: derived.conceptId,
          kind: derived.kind,
          ...(derived.misconceptionId ? { misconceptionId: derived.misconceptionId } : {}),
          finding: derived,
          status: "proposed",
          version: INTERVENTION_VERSION,
          ownerId: caller.profile.id,
          createdAt: Date.now(),
          // Targets stay open for the teacher to edit at assign time; the
          // FROZEN thing is the finding, not the plan.
        };
        await saveRecord(rec);
        return NextResponse.json({ record: rec });
      }

      // ── ASSIGN: the approved proposal becomes targeted work ───────────
      case "assign": {
        if (typeof body.needId !== "string" || !body.needId) {
          return NextResponse.json({ error: "missing need" }, { status: 400 });
        }
        const dueAt = typeof body.dueAt === "number" ? body.dueAt : 0;
        if (!Number.isFinite(dueAt) || dueAt <= Date.now()) {
          return NextResponse.json({ error: "due date must be in the future" }, { status: 400 });
        }
        // WHO: validated EXACTLY as the assignment door validates targets —
        // the same resolver, the same refusal-by-name, and an absent/empty
        // list means the whole class (the semantics the record keeps).
        const targets = Array.isArray(body.targetHandles)
          ? [...new Set(body.targetHandles.filter((h): h is string => typeof h === "string" && h.length > 0).map((h) => h.slice(0, 24)))]
          : [];
        const unknown = targets.filter((h) => !byHandle.has(h));
        if (unknown.length > 0) {
          return NextResponse.json({ error: `not a learner in this class: ${unknown.join(", ")}` }, { status: 400 });
        }
        const rec0 = await getRecord(body.needId);
        if (!rec0 || rec0.clsId !== cls.id) return NextResponse.json({ error: "not found" }, { status: 404 });
        if (rec0.status !== "proposed") {
          return NextResponse.json({ error: "not open for assignment" }, { status: 409 });
        }
        // The concept must still be in the class's declared curriculum (the
        // same licence the manual builder works under), and the work is ONE
        // concept — the finding names one idea, and the record must not
        // quietly widen it.
        if (!cls.subject) return NextResponse.json({ error: "declare this class's subject first" }, { status: 400 });
        const allowed = assignableConcepts(cls.subject, cls.specificationId ?? null);
        // THE TEACHER'S EDIT IS HONOURED. The proposal pre-populates the
        // finding's concept and the builder may change it (or add practice
        // beside it) before anything is set — so the assignment carries what
        // the teacher chose, and the outcome is read against the finding's own
        // idea when it is still among the choices (else the first chosen one).
        const chosen = Array.isArray(body.conceptIds) && body.conceptIds.length > 0
          ? [...new Set(body.conceptIds.filter((c): c is string => typeof c === "string" && c.length > 0))].slice(0, 12)
          : [rec0.conceptId];
        const outside = chosen.filter((c) => !allowed.includes(c));
        if (outside.length > 0) {
          return NextResponse.json({ error: `not in this class's curriculum: ${outside.join(", ")}` }, { status: 400 });
        }
        const objective = chosen.includes(rec0.conceptId) ? rec0.conceptId : chosen[0];

        // THE ASSIGNMENT IS CREATED BY THE ONE CREATION PATH'S OWN RULES:
        // the same updateClassById transaction, the same curriculum check
        // and the same record shape (Assignment) — an assignment born from a
        // finding is indistinguishable from one set by hand, which is the
        // whole point (no second pathway with its own semantics).
        const title = (typeof body.title === "string" ? body.title.trim() : "")
          || (rec0.kind === "misconception"
            ? `${MISCONCEPTIONS_BY_ID[rec0.misconceptionId ?? ""]?.name ?? rec0.misconceptionId ?? "misconception"} — review`
            : "Intervention");
        const stamp = Date.now();
        const upd = await updateClassById(cls.id, (c) => {
          if (!isTeacherOf(c, caller)) return { error: "not the teacher" as const, status: 403 as const };
          const a: Assignment = {
            id: newId("asg"),
            clsId: c.id,
            createdBy: caller.profile.id,
            title: title.slice(0, 80),
            subject: cls.subject as SubjectId,
            specificationId: c.specificationId ?? null,
            conceptIds: chosen,
            ...(targets.length > 0 ? { targetHandles: targets } : {}),
            createdAt: stamp,
            dueAt,
          };
          c.assignments ??= [];
          c.assignments.push(a);
          return { assignment: a };
        });
        if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
        const r = upd.result as { error?: string; status?: number; assignment?: Assignment };
        if (r.error || !r.assignment) {
          return NextResponse.json({ error: r.error ?? "not created" }, { status: r.status ?? 400 });
        }
        const rec = await withNeed(rec0.id, cls.id, (n) => {
          n.status = "assigned";
          n.assignedAt = stamp;
          n.baseAt = stamp;               // the baseline instant
          n.assignmentId = r.assignment!.id;
          // STAMPED, not assumed: what the teacher actually set (the edited
          // concept list and the edited learners), and the idea the outcome is
          // read against. `conceptId` is deliberately NOT touched: it is the
          // record's stable identity, and the panel matches a review to a
          // finding by it — re-stamping it would make a review whose concept
          // the teacher replaced invisible on the very finding it came from.
          n.assignedConceptIds = chosen;
          n.objectiveId = objective;
          if (targets.length > 0) n.targetHandles = targets;
          else delete n.targetHandles;
          return n;
        });
        return NextResponse.json({ record: rec, assignment: r.assignment });
      }

      // ── DECLINE: the review happened; the choice was NOT to act ───────
      case "decline": {
        if (typeof body.needId !== "string" || !body.needId) {
          return NextResponse.json({ error: "missing need" }, { status: 400 });
        }
        const rec = await withNeed(body.needId, cls.id, (n) => {
          if (n.status !== "proposed") return null;
          n.status = "declined";
          n.declinedAt = Date.now();
          if (typeof body.note === "string" && body.note.trim()) n.note = body.note.trim().slice(0, 280);
          return n;
        });
        if (!rec) return NextResponse.json({ error: "not open for decline" }, { status: 409 });
        return NextResponse.json({ record: rec });
      }

      // ── READ: the outcome — who demonstrated, who still needs review ──
      case "read": {
        if (typeof body.needId !== "string" || !body.needId) {
          return NextResponse.json({ error: "missing need" }, { status: 400 });
        }
        const rec = await getRecord(body.needId);
        if (!rec || rec.clsId !== cls.id || rec.status !== "assigned") {
          return NextResponse.json({ error: "no assigned intervention to read" }, { status: 404 });
        }
        return NextResponse.json({ record: rec, outcome: await outcomeFor(cls, rec) });
      }

      // ── DECIDE: the teacher's next step, recorded on the record ───────
      case "decide": {
        if (typeof body.needId !== "string" || !body.needId) {
          return NextResponse.json({ error: "missing need" }, { status: 400 });
        }
        const kind = body.decision as DecisionKind | undefined;
        if (!kind || !DECISION_KINDS.includes(kind)) {
          return NextResponse.json({ error: "unknown decision" }, { status: 400 });
        }
        const rec = await withNeed(body.needId, cls.id, (n) => {
          if (n.status !== "assigned") return null;
          n.status = "resolved";
          n.resolvedAt = Date.now();
          n.decision = {
            kind,
            at: Date.now(),
            ...(typeof body.note === "string" && body.note.trim() ? { note: body.note.trim().slice(0, 280) } : {}),
          };
          return n;
        });
        if (!rec) return NextResponse.json({ error: "not open for a decision" }, { status: 409 });
        return NextResponse.json({ record: rec });
      }

      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

/** The outcome for one assigned intervention: EVERY targeted member's
 *  ledger split at the baseline instant, the verdict over the whole set, and
 *  the handles still unmeasured — the review the teacher decides from. A
 *  derived read on purpose, recomputed at each request: nothing can drift,
 *  and a change in the ledgers changes the verdict the way the evidence says. */
async function outcomeFor(
  cls: NonNullable<Awaited<ReturnType<typeof getClass>>>,
  rec: InterventionRecord,
) {
  const targets = rec.targetHandles ?? [];
  const memberRows = (await resolveMembers(cls)).filter((m) => targets.length === 0 || targets.includes(m.handle));
  // The idea the comparison is made on: the objective stamped at assign, else
  // the finding's own concept (records written before that field existed).
  const objective = rec.objectiveId ?? rec.conceptId;
  const outcomes: MemberOutcome[] = memberRows.map((m) =>
    memberOutcome(readEvidence(m.state.profile.id), objective, rec.baseAt ?? 0, m.handle, m.state.profile.id));
  return {
    verdict: outcomeVerdict(outcomes),
    objectiveId: objective,
    members: outcomes.map((o) => ({
      handle: o.handle,
      learnerId: o.learnerId,
      before: { asked: o.before.unaided.asked, correct: o.before.unaided.correct },
      after: {
        asked: o.after.answered,
        correct: o.after.correct,
        unaided: o.after.unaided,
        hinted: o.after.hinted,
      },
      untouchedAfter: o.untouchedAfter,
    })),
    unmeasured: outcomes.filter((o) => o.untouchedAfter).map((o) => o.handle),
    baseAt: rec.baseAt ?? 0,
  };
}
