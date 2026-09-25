import { NextResponse } from "next/server";
import { updateProfile } from "@/lib/server/store";
import { buildResult, currentConcept, gradeAnswer, markObservedConcepts, newDiagnosticSession, nextQuestion } from "@/lib/diagnostic";
import { serveView } from "@/lib/questions";
import { applyTerminology, specForProfile } from "@/lib/specifications";
import { EVIDENCE_SCHEMA_VERSION, answerEvidence, newEvidenceId, type EvidenceEvent } from "@/lib/evidence";
import { appendEvidence } from "@/lib/server/evidence";
import { commitAndProject } from "@/lib/server/projection";
import type { ProfileState, Question, SubjectId } from "@/lib/types";

/** The request's subject, checked against the same list the router validates
 *  against — so an unknown value reaches the ledger as null rather than as a
 *  subject id nobody can interpret later. */
function subjectOf(raw: unknown): SubjectId | null {
  return typeof raw === "string" && VALID_SUBJECTS.includes(raw) ? (raw as SubjectId) : null;
}

const VALID_SUBJECTS = ["maths", "physics", "chemistry", "biology", "computing"];
const VALID_KINDS = ["baseline", "retest", "probe"];

/** Capability check (audit P0-E): every authenticated action presents the
 *  profile's secret. Legacy profiles (created before secrets) bind the first
 *  presented secret; after that the binding is immutable. Throws so the
 *  outer catch turns a wrong token into a 400 rather than a silent write. */
function checkSecret(state: ProfileState, presented: unknown): void {
  if (typeof presented !== "string" || !presented) throw new Error("unauthorized");
  if (!state.secret) { state.secret = presented; return; }
  if (state.secret !== presented) throw new Error("unauthorized");
}

// Diagnostic sessions live on the profile under `${subject}:session` (one live
// session per subject); completed runs land in state.diagnostics under
// `${subject}:${sessionStartedAt}` — one bucket per run, so retaking a
// diagnostic the same day builds learning-gains evidence instead of erasing it.
// The server stores the last served question and grades against it — the client
// never tells the server whether an answer was right. Every action runs inside
// the profile's file lock, so racing requests are strictly serialised.
interface StartBody { id: string; subject: SubjectId }

type DiagnosticSession = ReturnType<typeof newDiagnosticSession> & { lastQ?: Question | null };

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as StartBody & {
      action: "start" | "answer" | "skip" | "finish";
      questionId?: string;
      /** Interface language: localizes served question stems. */
      lang?: string;
      /** Capability token (audit P0-E). */
      secret?: string;
      /** Requested run kind (baseline = fixed anchors). */
      kind?: string;
      /** Test hook (non-production only): include answer fields for the E2E suite. */
      reveal?: boolean;
      chosen?: number;
    };
    if (!body?.id || !body?.action || typeof body.subject !== "string" || !VALID_SUBJECTS.includes(body.subject)) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    // Audit P0-B: only an explicitly-declared benchmark kind may use it. The
    // start action carries the requested kind; answer/skip/finish actions
    // reuse the kind already recorded on the live session.
    const isStart = body.action === "start";
    const startKind = (body as { kind?: string }).kind;
    if (isStart && startKind !== undefined && !VALID_KINDS.includes(startKind)) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    if (body.action === "answer" && (!Number.isInteger(body.chosen) || (body.chosen as number) < 0)) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const sessionKey = `${body.subject}:session`;

    /** Spend a probe on the learner's exposure ledger.
     *
     *  A measuring pool must never re-serve an item: if it did, a later
     *  "improvement" could be nothing but memory. Today's diagnostic draws from
     *  a GENERATOR, so items are fresh by construction and this ledger is
     *  mostly a record of what was probed. It exists because that stops being
     *  true the moment a fixed pool exists — a licensed past-paper bank is a
     *  finite set of items, and this is the mechanism that keeps it a
     *  measurement instead of a memorisation exercise. */
    const spend = (state: ProfileState, q: { id: string } | null | undefined): void => {
      if (!q) return;
      state.seenQuestions ??= {};
      if (!(q.id in state.seenQuestions)) state.seenQuestions[q.id] = Date.now();
    };

    if (body.action === "start") {
      const upd = await updateProfile(body.id, (state: ProfileState) => {
        checkSecret(state, body.secret);
        const session = newDiagnosticSession(
          body.subject,
          startKind as DiagnosticSession["kind"] | undefined ?? "probe",
          // The learner's qualification drives the sampling blueprint: coverage
          // across the spec's own stage bands instead of four fixed anchors.
          specForProfile(state.profile),
        ) as DiagnosticSession;
        const q = nextQuestion(session);
        session.lastQ = q;
        spend(state, q);
        // Never touch state.diagnostics here: an abandoned start must not
        // clobber the student's previous completed diagnostic.
        (state as unknown as Record<string, unknown>)[sessionKey] = session;
        // Test-hook reveal for the E2E suite (non-production only).
        const reveal = body.reveal === true && process.env.NODE_ENV !== "production";
        return { question: q ? (reveal ? q : serveView(q, body.lang, state.profile.board)) : null, conceptId: currentConcept(session)?.conceptId ?? null };
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json({ sessionKey, ...upd.result });
    }

    const isAnswer = body.action === "answer";
    const isSkip = body.action === "skip";
    const isFinish = body.action === "finish";

    // Evidence collected during this request, appended to the ledger after the
    // profile write resolves (outside the lock). A diagnostic answer is
    // MEASUREMENT, which is why its source is "diagnostic": the learner model
    // may teach from practice, but only measurement can show change.
    //
    // The FINISH action is different and no longer uses this list: the sitting
    // folds into the model as one event, so its event is written and
    // confirmed INSIDE the lock, before the projection (see below).
    const pending: EvidenceEvent[] = [];

    const upd = await updateProfile(body.id, async (state: ProfileState) => {
      checkSecret(state, body.secret);
      const session = (state as unknown as Record<string, unknown>)[sessionKey] as DiagnosticSession | undefined;

      // Each run owns its own timestamped bucket; nothing here can overwrite
      // a different session's completed result.
      if (!session) return { error: "no active session" as const };
      const resultKey = `${body.subject}:${session.startedAt}`;

      if (isFinish) {
        // One clock for the whole sitting: the event and the model the ledger
        // projects from it carry the SAME stamp, so a replay reproduces the fold.
        const at = Date.now();
        const result = buildResult(session);
        state.diagnostics[resultKey] = result;
        const sitting: EvidenceEvent = {
          type: "diagnostic_completed",
          id: newEvidenceId(),
          schemaVersion: EVIDENCE_SCHEMA_VERSION,
          learnerId: body.id,
          provenance: "server",
          at,
          source: "diagnostic",
          subject: subjectOf(body.subject),
          conceptId: null,
          specificationId: state.profile.spec ?? null,
          concepts: session.concepts.filter((c) => c.done).length,
          // The seeds the fold applied, carried ON the event: the projection
          // re-derives mastery with ladderMastery rather than trusting these
          // numbers, so an event can never hand the model a score.
          seeds: session.concepts
            .filter((c) => c.asked > 0)
            .map((c) => ({
              conceptId: c.conceptId,
              asked: c.asked,
              correct: c.correct,
              done: c.done,
              stage: c.stage,
              askedThisStage: c.askedThisStage,
              correctThisStage: c.correctThisStage,
              servedDifficulty: [...c.servedDifficulty],
            })),
        };
        // ── THE CUTOVER: WRITE EVENT → CONFIRM APPEND → REPLAY → RESPOND ──
        // The sitting is ONE event, and it is written and confirmed BEFORE the
        // model moves. Audit P0-A still holds — the diagnostic initializes the
        // learner model — but now the model is a projection of the ledger
        // rather than a fold the route performed for itself.
        //
        // The sitting's own per-answer events are already on the ledger as
        // DETAIL: they must not be folded here as well, or every diagnostic
        // answer would count twice. See lib/replay.ts's header.
        try {
          await commitAndProject(body.id, state, [sitting]);
        } catch {
          return { error: "evidence_not_recorded" as const };
        }
        // Observation is an exposure fact, not evidence content, so it is NOT
        // in the fold: a baseline sitting still has to record which concepts it
        // directly probed (audit P0-B).
        markObservedConcepts(state, session, at);
        delete (state as unknown as Record<string, unknown>)[sessionKey];
        return { result };
      }

      if (isSkip) {
        const cur = currentConcept(session);
        if (cur) cur.done = true;
        state.diagnostics[resultKey] = buildResult(session);
        const nextQ = nextQuestion(session);
        session.lastQ = nextQ;
        spend(state, nextQ);
        const reveal = body.reveal === true && process.env.NODE_ENV !== "production";
        return { next: nextQ ? (reveal ? nextQ : serveView(nextQ, body.lang)) : null, conceptId: currentConcept(session)?.conceptId ?? null, ladder: cur ? { ...cur } : null };
      }

      if (isAnswer) {
        if (!session) return { error: "no active session" as const };
        const q = session.lastQ;
        if (!q || !body.questionId || q.id !== body.questionId) {
          return { error: "stale or unknown question" as const };
        }
        if ((body.chosen as number) >= q.choices.length) {
          return { error: "choice out of range" as const };
        }
        const graded = gradeAnswer(session, q.conceptId, q, body.chosen as number);
        state.diagnostics[resultKey] = buildResult(session);
        // Hint-free by construction: the diagnostic has no hint action, so this
        // is independent evidence as well as measurement, and the ledger says
        // both rather than leaving an analyst to infer it later.
        pending.push(answerEvidence({
          learnerId: body.id,
          at: Date.now(),
          source: "diagnostic",
          subject: subjectOf(body.subject),
          conceptId: q.conceptId,
          specificationId: state.profile.spec ?? null,
          questionId: q.id,
          correct: graded.correct,
          chosen: body.chosen as number,
          mode: "independent",
          hints: 0,
        }));
        const nextQ = nextQuestion(session);
        session.lastQ = nextQ;
        spend(state, nextQ);
        const curSnap = session.concepts.find((c) => c.conceptId === q.conceptId);
        return {
          correct: graded.correct,
          answerIndex: q.answer, // post-grade only, for marking the right choice
          // Same rule as practice: the student's curriculum vocabulary, in the
          // language they actually read the marking in (§4).
          explanation: body.lang && body.lang !== "en"
            ? graded.explanation
            : applyTerminology(graded.explanation, state.profile.board),
          next: nextQ ? (body.reveal === true && process.env.NODE_ENV !== "production" ? nextQ : serveView(nextQ, body.lang, state.profile.board)) : null,
          conceptId: currentConcept(session)?.conceptId ?? null,
          ladder: curSnap ? { ...curSnap } : null,
        };
      }

      return { error: "unknown action" as const };
    });

    if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
    const r = upd.result as { error?: string } & Record<string, unknown>;
    if (r?.error) {
      // A ledger that could not be written is a failure, not a bad request:
      // the sitting is intact and unrecorded, and the learner is told so.
      return NextResponse.json(
        { error: r.error },
        { status: r.error === "evidence_not_recorded" ? 503 : 400 },
      );
    }
    // Only a successful, un-errored request contributes evidence. A rejected
    // request (stale question, bad choice, wrong secret) observed nothing.
    if (pending.length) {
      try {
        await appendEvidence(body.id, pending);
      } catch {
        // The answer is already recorded in the profile; a ledger failure must
        // not fail the sitting. reconcile() reports the gap.
      }
    }
    return NextResponse.json(r);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

export type { ProfileState };
