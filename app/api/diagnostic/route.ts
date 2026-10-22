import { NextResponse } from "next/server";
// The learner transaction, through the port-facing door (lib/server/transaction.ts):
// a sitting's model write and the ledger events it rests on are ONE unit.
import { withLearnerState } from "@/lib/server/transaction";
import { buildResult, certaintyTally, currentConcept, gradeAnswer, markObservedConcepts, newDiagnosticSession, nextQuestion, plannedQuestions } from "@/lib/diagnostic";
import { serveView } from "@/lib/questions";
import { applyTerminology, specForProfile } from "@/lib/specifications";
import { EVIDENCE_SCHEMA_VERSION, answerEvidence, newEvidenceId, type Certainty, type EvidenceEvent } from "@/lib/evidence";
import { commitAndProjectIn } from "@/lib/server/projection";
// A store that cannot keep this write answers 503 with its reason — never a 500.
import { storeWriteRefusal } from "@/lib/server/write-refusal";
import { authorisedProfile } from "@/lib/server/auth";
import { checkPresentedSecret, classroomSessionFor } from "@/lib/server/capability";
import { learnerLimitKey, pace } from "@/lib/server/limits";
import { DIAGNOSTIC_PER_LEARNER } from "@/lib/server/rate-limit";
import type { ProfileState, Question, SubjectId } from "@/lib/types";

/** The request's subject, checked against the same list the router validates
 *  against — so an unknown value reaches the ledger as null rather than as a
 *  subject id nobody can interpret later. */
function subjectOf(raw: unknown): SubjectId | null {
  return typeof raw === "string" && VALID_SUBJECTS.includes(raw) ? (raw as SubjectId) : null;
}

const VALID_SUBJECTS = ["maths", "physics", "chemistry", "biology", "computing"];
const VALID_KINDS = ["baseline", "retest", "probe"];

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
      /** The learner's own statement about their knowing, made before they saw
       *  any verdict ("sure" = I think I know, "unsure" = I'm unsure). Omitted
       *  by any caller that does not ask, and null is never implied to be a
       *  confident answer. "I don't know" is NOT a value here — it is the
       *  `skip` action, a refusal to answer rather than an answer. */
      certainty?: string;
    };
    if (!body?.id || !body?.action || typeof body.subject !== "string" || !VALID_SUBJECTS.includes(body.subject)) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    // A sitting is cheap per action but long overall, and every action rewrites
    // the learner's record. The ladder bounds what an honest client can ask for;
    // this bounds a client that ignores the ladder. Keyed on the learner the
    // caller proves, so it can never be another learner's budget.
    const sitter = await authorisedProfile(req, body.id, body.secret ?? null);
    if (!sitter) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    // WHICH KIND of credential this is, resolved once on the request thread: a
    // classroom session belongs to the learner it was minted for and to nobody
    // else, and it is never bound as their capability (lib/server/capability.ts
    // #checkPresentedSecret). Without this a provisioned learner was let into the
    // route and then refused by every mutator inside it.
    const kioskFor = await classroomSessionFor(body.id, body.secret ?? null);
    const diagnosticGate = await pace(learnerLimitKey("diagnostic", sitter.profile.id), DIAGNOSTIC_PER_LEARNER);
    if (diagnosticGate) return diagnosticGate;
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
      const upd = await withLearnerState(body.id, (_ctx, state: ProfileState) => {
        checkPresentedSecret(state, body.secret, kioskFor);
        // Test-hook reveal for the E2E suite (non-production only).
        const reveal = body.reveal === true && process.env.NODE_ENV !== "production";

        // RESUME, DO NOT REPLACE. The live sitting is already persisted at
        // `${subject}:session`, and this action used to overwrite it
        // unconditionally — so every mount of the page started a NEW sitting.
        // The page mounts on every reload, and a reload is the most ordinary
        // thing a learner does on a phone. Measured: two answers deep, a reload
        // served a DIFFERENT question 01 and the adaptive path chosen for the
        // learner was thrown away and re-decided, with no word to either of
        // them. The answers were not lost (they were already on the ledger) but
        // the learner's time and the very thing an adaptive diagnostic exists to
        // decide were.
        //
        // KIND-AWARE, because a start is not always a resume. `scripts/e2e-api`
        // deliberately sits `baseline` then `retest` against one profile and
        // measures each independently; a blanket "always resume" would hand the
        // second sitting the first one's answers. So the live session is resumed
        // only when it is the SAME KIND of sitting. An unspecified kind adopts
        // whatever is already running rather than defaulting to `probe` and
        // silently starting a third kind of thing.
        const live = (state as unknown as Record<string, unknown>)[sessionKey] as
          | DiagnosticSession
          | undefined;
        const wantedKind = (startKind as DiagnosticSession["kind"] | undefined) ?? live?.kind ?? "probe";
        if (live && live.kind === wantedKind) {
          // Re-serve the question the learner was last looking at. NOT `spend`
          // again: the exposure was already recorded when it was first served,
          // and spending it twice would make one question look like two probes.
          const q = live.lastQ ?? nextQuestion(live);
          return {
            resumed: true,
            // `log` is the session's own record of every probe answered, in
            // order — the only honest answer to "how far along is this". Summing
            // the per-concept `asked` counters would not work: those reset each
            // stage, so a resumed sitting could be labelled "01" at question
            // nine.
            asked: live.log?.length ?? 0,
            // How long the whole sitting will be, so the counter can say "of
            // about N" instead of a bare number that reads as infinite. The
            // same estimate on a resume is the ABSOLUTE total (asked + what is
            // left), so the denominator does not jump when a learner reloads.
            estimate: plannedQuestions(live),
            question: q ? (reveal ? q : serveView(q, body.lang, state.profile.board)) : null,
            conceptId: currentConcept(live)?.conceptId ?? null,
          };
        }

        const session = newDiagnosticSession(
          body.subject,
          wantedKind,
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
        return {
          resumed: false,
          estimate: plannedQuestions(session),
          question: q ? (reveal ? q : serveView(q, body.lang, state.profile.board)) : null,
          conceptId: currentConcept(session)?.conceptId ?? null,
        };
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json({ sessionKey, ...upd.result });
    }

    const isAnswer = body.action === "answer";
    const isSkip = body.action === "skip";
    const isFinish = body.action === "finish";

    // Evidence collected during this request, appended to the ledger INSIDE the
    // learner transaction (`ctx.appendEvents` below) rather than after the
    // response: the event belongs to the same unit as the sitting it is detail
    // for, and a ledger write resolved from the port would open a second
    // connection beside the one holding this learner's lock (§14.1 of
    // docs/STORAGE_SPEC.md). A diagnostic answer is MEASUREMENT, which is why
    // its source is "diagnostic": the learner model may teach from practice,
    // but only measurement can show change.
    //
    // The FINISH action is different and no longer uses this list: the sitting
    // folds into the model as one event, so its event is written and
    // confirmed inside the transaction, before the projection (see below).
    const pending: EvidenceEvent[] = [];

    const upd = await withLearnerState(body.id, async (ctx, state: ProfileState) => {
      checkPresentedSecret(state, body.secret, kioskFor);
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
          // What the learner said about their own knowing, stated BEFORE any
          // verdict. Carried whole on the sitting so the report does not have to
          // re-derive it from the answer stream — and so the sitting makes one
          // durable statement even though its per-answer detail is deliberately
          // not folded into the model (lib/replay.ts).
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
          certainty: certaintyTally(session),
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
          await commitAndProjectIn(ctx, state, [sitting]);
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
        // Only a real statement travels: an absent field or anything malformed
        // is recorded as "not asked" rather than being promoted to a "sure".
        const certainty: Certainty | null =
          body.certainty === "sure" || body.certainty === "unsure" ? body.certainty : null;
        const graded = gradeAnswer(session, q.conceptId, q, body.chosen as number, certainty);
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
          certainty,
        }));
        // The answer's own event, on the TRANSACTION's connection. A failure is
        // tolerated exactly as it was when this append lived after the response:
        // the sitting is recorded in the profile either way, and `reconcile()`
        // reports the gap rather than the sitting being lost to it.
        try {
          await ctx.appendEvents(pending);
        } catch { /* the sitting stands; the ledger gap is reported, not hidden */ }
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
    return NextResponse.json(r);
  } catch (e) {
    const refusal = storeWriteRefusal(e);
    if (refusal) return refusal;
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

export type { ProfileState };
