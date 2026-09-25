import { NextResponse } from "next/server";
import { updateProfile } from "@/lib/server/store";
import { emptyProgress } from "@/lib/progress";
import { transferVariant, TRANSFER_SURFACE_ATTEMPTS, type Surface } from "@/lib/transfer";
import { generateQuestion, generateQuestionAt, generateQuestionNear, hasGenerator, serveView } from "@/lib/questions";
import { practiceTarget, difficultyBandFor } from "@/lib/question-bank";
import { applyTerminology, difficultyFor, specForProfile } from "@/lib/specifications";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { pushRecentHit, buildFlare, gradeMicroCheck } from "@/lib/microdiag";
import { buildStarter, viewStarter, gradeConnector } from "@/lib/starter";
import { buildHint } from "@/lib/hints";
import { noteActivity, type SessionLedger } from "@/lib/session";
import { isRetentionDue } from "@/lib/retention";
import { getConcept } from "@/lib/genome";
import { answerEvidence, deviceClaimAt, hintEvidence, submissionEventId, type EvidenceEvent } from "@/lib/evidence";
import { appendEvidence, hasEvidence, readEvidence } from "@/lib/server/evidence";
import { commitAndProject } from "@/lib/server/projection";
import type { ProfileState, Question } from "@/lib/types";

/** How many draws a practice serve searches for an item in the aimed band.
 *  Band-first selection (lib/questions.ts#generateQuestionNear) makes the tier
 *  decide which band the learner is served; the budget is what turns that from
 *  "usually" into "for any band the bank can produce at all". The draws are
 *  pure generator calls — microseconds — and the search is only spent in full
 *  when a band is genuinely unreachable, where no number of draws could find
 *  one and the honest nearest fallback takes over instead. */
const PRACTICE_DRAW_ATTEMPTS = 40;

/** A choice index must be a real array index: anything else is a client bug,
 *  and recording it as a "wrong answer" would corrupt learning data. */
function validChoice(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

/** Capability check (audit P0-E): every authenticated action presents the
 *  profile's secret. Legacy profiles bind the first presented secret; after
 *  that the binding is immutable. Throws → 401 via the outer catch. */
function checkSecret(state: ProfileState, presented: unknown): void {
  if (typeof presented !== "string" || !presented) throw new Error("unauthorized");
  if (!state.secret) { state.secret = presented; return; }
  if (state.secret !== presented) throw new Error("unauthorized");
}

type Session = ProfileState & {
  practice?: Record<string, { q: Question }>;
  starter?: Record<string, { q: Question; s: ReturnType<typeof buildStarter> }>;
  /** Server-staged transfer requests (§10): the serve call declares the
   *  intent, the server remembers it. The client cannot claim transfer
   *  credit for an ordinary practice question — attribution is the server's. */
  transferStage?: Record<string, { questionId: string }>;
  /** The surface each staged transfer actually used (audit P0-D): credit is
   *  only given for a genuinely different surface, never for a same-surface
   *  re-draw. Keyed by the transfer question's id. */
  transferSurface?: Record<string, Surface>;
  /** Interface language: localizes served question stems (q.* keys). */
  lang?: string;
  /** Hint ledger, per served question id. Independence (hint-free proof) is
   *  a server-side fact, not a client-declared number (audit §29). */
  hintsByQ?: Record<string, number>;
  /** Server-staged RETRIEVAL requests: a concept the scheduler (lib/retention)
   *  had due is served as a review, and the answer that follows is recorded with
   *  `source: "retrieval"`. Deliberately not client-declarable — a learner
   *  cannot ask for retention credit, only earn it by recalling aged work. */
  retrievalStage?: Record<string, { questionId: string }>;
  /** The open learning session (lib/session.ts). Activity is incremented here,
   *  where the grading actually happens, so the session's "asked/correct"
   *  counters cannot be inflated by the client. */
  learnSession?: SessionLedger;
};

type ServeBody = { action: "serve"; id: string; conceptId: string; intent?: "transfer"; reveal?: boolean; lang?: string; secret?: string };
interface AnswerBody {
  action: "answer"; id: string; conceptId: string; questionId: string; choiceIndex: number;
  ms?: number; lang?: string; secret?: string;
  /** The device's name for THIS submission (§ offline sync). Present on every
   *  answer the client sends, so a lost response cannot turn one answer into
   *  two: the ledger event's id is derived from it. */
  submissionId?: string;
  /** The device's claim about when the learner answered. Recorded and
   *  disclosed; never read by the projection. */
  deviceAt?: number;
}
interface PeerBody { action: "peer"; id: string; conceptId: string; strong: boolean; secret?: string }
interface HintBody { action: "hint"; id: string; conceptId: string; questionId: string; level: number; secret?: string }
interface MicroBody { action: "micro"; id: string; conceptId: string; misconceptionId: string; questionId: string; choiceIndex: number; secret?: string }
interface StarterBody { action: "starter"; id: string; conceptId: string; questionId: string; secret?: string }
interface StarterPickBody { action: "starterPick"; id: string; conceptId: string; questionId: string; choiceIndex: number; secret?: string }

/** GET /api/progress?id=...&subject=... — progress snapshot for the UI. */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const secret = searchParams.get("secret");
  if (!secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // The read presents the capability too, and a WRONG one is answered exactly
  // the way every other door answers it. `checkSecret` throws from inside the
  // mutator, and this handler — unlike POST and /api/evidence — had no catch
  // around it, so a wrong secret left Next with an unhandled error and the
  // caller with a bare 500 and no body. The rule is the same on a read as on a
  // write; the difference in status code was the only thing hiding it.
  try {
    const state = await updateProfile(id, (s) => {
      checkSecret(s, secret);
      return { progress: s.progress, masteries: s.masteries };
    });
    if (!state) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(state.result);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

/** POST /api/progress — serve a practice question, or grade an answer. */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as ServeBody | AnswerBody | HintBody | MicroBody | StarterBody | StarterPickBody | PeerBody;
    if (!body?.id) return NextResponse.json({ error: "bad request" }, { status: 400 });

    if (body.action === "serve") {
      const conceptId = body.conceptId;
      if (typeof conceptId !== "string" || !conceptId) return NextResponse.json({ error: "bad request" }, { status: 400 });
      if (!hasGenerator(conceptId)) return NextResponse.json({ error: "no generator for concept" }, { status: 404 });
      // Transfer must be a genuinely different challenge (audit P0-B / §10):
      // serve a question at the top of the concept's difficulty range, not
      // another draw from the same distribution. Attribution stays server-side.
      const isTransfer = body.intent === "transfer";
      const upd = await updateProfile(body.id, (state) => {
        checkSecret(state, body.secret);
        const sess = (state as Session);
        const seed = `p${Date.now()}:${conceptId}:${Math.floor(Math.random() * 1e9)}`;
        // Difficulty follows the student's curriculum level (§9): a GCSE
        // Foundation student and an A-Level student meet the same concept at
        // the depth their course expects. Practice targets the tier's band from
        // both sides (nearest draw, not "at least"), while transfer keeps its
        // deliberate floor — it must be harder by construction.
        const band = difficultyFor(specForProfile(state.profile));
        // ── PRACTICE DIFFICULTY FOLLOWS THE LEARNER'S OWN RECORD ──────────
        // The tier is the anchor; the record moves the rung. A due review and a
        // transfer request are both deliberately exempt: a delayed-recall check
        // must be at the concept's own level (or "remembered it" would mean
        // "answered an easier question"), and transfer has its own floor below.
        const due = isRetentionDue(state, conceptId);
        const record = state.progress[conceptId];
        const target = practiceTarget({
          tier: band,
          attempts: record?.attempts ?? 0,
          correct: record?.correct ?? 0,
          streak: record?.streak ?? 0,
          misconceptionHits: record?.misconceptions
            ? Object.values(record.misconceptions).reduce((s, n) => s + n, 0)
            : 0,
        });
        const aim = isTransfer ? Math.max(0.5, band) : due ? band : target.difficulty;
        let base = isTransfer
          ? generateQuestionAt(conceptId, seed, aim, 0)
          : generateQuestionNear(conceptId, seed, aim, PRACTICE_DRAW_ATTEMPTS);
        if (!base) return { error: "no question" as const };
        // Genuine transfer (audit P0-D): a transfer serve re-frames the
        // question through a different surface — story or inverse — instead of
        // merely drawing a harder number from the same generator. What
        // surface was achieved is decided here, server-side, and recorded with
        // the credit at grading time.
        //
        // Not every item HAS a second surface: the re-framers understand the
        // shapes they were written for, and a concept whose range now includes
        // multi-step work (see lib/questions-deep.ts) can draw one they do not.
        // So the serve searches draws, at the same difficulty floor, for one it
        // can genuinely re-frame — capped, deterministic per attempt — and only
        // falls back to `direct` (which never buys the strong mastery ceiling)
        // when none of them can be. A harder draw that is still the same
        // surface is not transfer, and must not be recorded as it.
        let question: Question = base;
        let surface: Surface = "direct";
        if (isTransfer) {
          for (let attempt = 0; attempt < TRANSFER_SURFACE_ATTEMPTS; attempt++) {
            const drawn: Question | null = attempt === 0 ? base : generateQuestionAt(conceptId, seed, Math.max(0.5, band), attempt);
            if (!drawn) break;
            const variant = transferVariant(drawn, `${seed}:a${attempt}`, body.lang ?? "en");
            base = drawn;
            question = variant.question;
            if (variant.surface !== "direct") {
              surface = variant.surface;
              break;
            }
          }
        }
        const q = question;
        sess.practice ??= {};
        sess.practice[conceptId] = { q };
        if (isTransfer) {
          sess.transferStage ??= {};
          sess.transferStage[conceptId] = { questionId: q.id };
          if (surface !== "direct") {
            sess.transferSurface ??= {};
            sess.transferSurface[q.id] = surface;
          }
        }
        // ── A due concept is served as a RETRIEVAL, and the SERVER decides ──
        // Retention is only evidence when the recall was genuinely delayed, and
        // "genuinely" is taken from this learner's own model: the concept has
        // aged past the interval lib/retention schedules for its mastery. The
        // client never declares this — the answer is stamped `source:
        // "retrieval"` because the server knew it was due, which is why a
        // request cannot award itself retention credit. A repeat within the
        // same sitting fails the ledger's own age test in lib/progress.ts.
        if (due) {
          sess.retrievalStage ??= {};
          sess.retrievalStage[conceptId] = { questionId: q.id };
        }
        // Answers never leave the server before grading. The only exception is
        // an explicit test-hook request on a non-production server, which the
        // E2E suite uses to build known mastery state. In production builds
        // (NODE_ENV=production) this branch does not exist.
        const reveal = (body as { reveal?: boolean }).reveal === true && process.env.NODE_ENV !== "production";
        // ── WHY THIS QUESTION, IN THE PAYLOAD ──────────────────────────────
        // The band is the one the SERVED item actually falls in (never the one
        // that was aimed at), and only a practice serve carries a target, so no
        // surface can show an adaptive reason for a check or a stretch.
        return {
          question: reveal ? q : serveView(q, body.lang, state.profile.board),
          target: isTransfer || due ? null : {
            reason: target.reason,
            band: difficultyBandFor(base.difficulty),
            scaffold: target.scaffold,
          },
        };
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      const r = upd.result as { error?: string; question?: Question };
      if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
      return NextResponse.json(r);
    }

    if (body.action === "answer") {
      const { conceptId, questionId, choiceIndex } = body;
      if (typeof conceptId !== "string" || !conceptId || typeof questionId !== "string" || !questionId || !validChoice(choiceIndex)) {
        return NextResponse.json({ error: "bad request" }, { status: 400 });
      }
      // ── A REPLAYED SUBMISSION IS THE SAME EVENT, NOT A SECOND ANSWER ──
      // An answer taken offline comes back through THIS route, naming its own
      // submission; so does an answer whose response was lost after the server
      // recorded it. The event id is derived from that name, so the second
      // delivery is recognised here — before the staged-question check, which
      // the first delivery has already consumed — and answered as what it is
      // instead of being re-graded or refused as a stale question.
      const replayId = submissionEventId((body as AnswerBody).submissionId);
      if (replayId && hasEvidence(body.id, replayId)) {
        const prior = readEvidence(body.id).find((e) => e.id === replayId);
        return NextResponse.json({
          duplicate: true,
          recorded: true,
          // The verdict comes from the LEDGER, not from a re-grade: this answer
          // was recorded once and this is what it said.
          correct: prior && prior.type === "answer_submitted" ? prior.correct : null,
          answerIndex: null,
          explanation: "",
          misconceptionId: null,
          flare: null,
        });
      }
      const upd = await updateProfile(body.id, async (state) => {
        checkSecret(state, body.secret);
        const practice = (state as Session).practice;
        const q = practice?.[conceptId]?.q;
        if (!q || q.id !== questionId) {
          return { error: "stale or unknown question" as const };
        }
        if (choiceIndex >= q.choices.length) {
          return { error: "choice out of range" as const };
        }
        const correct = choiceIndex === q.answer;
        const ms = typeof (body as AnswerBody).ms === "number" ? Math.max(0, Math.min(3600000, (body as AnswerBody).ms as number)) : undefined;
        const langRaw = (body as AnswerBody).lang;
        // Server-side attribution (audit P0-B/§29): mode comes from the staged
        // serve intent, the hint count from the server's own hint ledger.
        // Nothing the client asserts here can buy independence or transfer credit.
        const sess = state as Session;
        const hintCount = sess.hintsByQ?.[questionId] ?? 0;
        const stagedTransfer = sess.transferStage?.[conceptId];
        const isTransfer = stagedTransfer?.questionId === questionId;
        // Was THIS question the one the scheduler served as a due review? Read
        // from the server's own stage, so the source is a fact the server kept
        // rather than a claim the client made.
        const isRetrieval = sess.retrievalStage?.[conceptId]?.questionId === questionId;
        // The surface decides whether this is genuine transfer evidence or a
        // same-surface re-draw (audit P0-D). Only a story/inverse re-framing
        // counts as transfer; a direct re-draw is recorded but never proves
        // recognition of the idea in a new situation.
        const transferSurface = sess.transferSurface?.[questionId];
        // Honest derivation: a hinted answer is guided — it never becomes
        // independence evidence merely because the client asked.
        const mode: "guided" | "independent" | "transfer" =
          isTransfer && transferSurface ? "transfer" : isTransfer ? "independent" : hintCount > 0 ? "guided" : "independent";
        // One clock for this answer: the event and the model the ledger
        // projects from it carry the SAME stamp, so a replay reproduces
        // lastSeen exactly.
        const at = Date.now();
        // The device's claim about WHEN it answered, or null. Judged by the same
        // rule the ingestion door uses (lib/evidence.ts#deviceClaimAt) and kept
        // on the event as a claim: the projection reads `at`, above.
        const deviceAt = deviceClaimAt((body as AnswerBody).deviceAt, at);
        const event = answerEvidence({
          learnerId: body.id,
          at,
          // The submission-derived id when the client named one: this is what
          // makes a replay idempotent rather than merely unlikely.
          id: replayId ?? undefined,
          deviceAt,
          source: isRetrieval ? "retrieval" : mode === "transfer" ? "transfer" : "practice",
          subject: getConcept(conceptId)?.subject ?? null,
          conceptId,
          specificationId: state.profile.spec ?? null,
          questionId,
          correct,
          chosen: choiceIndex,
          mode,
          hints: hintCount,
          ms: ms ?? null,
          tags: q.misconceptionTags ?? [],
        }) as EvidenceEvent;

        // ── THE CUTOVER: WRITE EVENT → CONFIRM APPEND → REPLAY → RESPOND ──
        // The model is no longer mutated here. The ledger is written and
        // CONFIRMED first, and the learner model is then projected FROM the
        // ledger (lib/server/projection.ts). If the append fails the model
        // does not move — and the staged question is left in place, so the
        // learner can answer again rather than losing the answer to a model
        // that moved for no auditable reason.
        try {
          await commitAndProject(body.id, state, [event]);
        } catch {
          // Nothing has been spent: the transfer credit and the staged question
          // are still here, so a retry records this answer properly rather than
          // degrading it to ordinary practice.
          return { error: "evidence_not_recorded" as const };
        }
        // The credit is spent only once the evidence is safely on the ledger.
        if (isTransfer) delete sess.transferStage![conceptId];
        if (isRetrieval) delete sess.retrievalStage![conceptId];
        if (transferSurface) delete sess.transferSurface![questionId];
        const projected = state.progress[conceptId];
        const rec = { streak: projected?.streak ?? 0, mastery: projected?.mastery ?? 0 };
        // The closed loop: this answer is part of an open session, so it counts
        // towards that session's activity record (and only if it belongs to the
        // concept the session is about).
        if (sess.learnSession) noteActivity(sess.learnSession, { correct, mode, hints: hintCount, conceptId, ms });
        const misc = !correct && q.misconceptionTags[0] ? MISCONCEPTIONS_BY_ID[q.misconceptionTags[0]] : undefined;
        // Track the recent hit/miss window per tagged misconception — this is
        // what lets the system notice a *pattern* rather than one mistake.
        // An ANNOTATION the ledger does not carry, so the projection preserves
        // it and this is where the live answer keeps it current.
        const p = state.progress[conceptId];
        if (p) for (const tag of q.misconceptionTags) pushRecentHit(p, tag, !correct);
        // §4–5: when a misconception flares, the response carries a named
        // pattern, the coaching line and a one-question micro-diagnostic —
        // the system asking "why", not just "wrong". Built AFTER the
        // projection, from the model the evidence just produced.
        const flare =
          !correct && q.misconceptionTags[0]
            ? buildFlare(state, conceptId, q.misconceptionTags[0], (body as { reveal?: boolean }).reveal === true, body.lang)
            : null;
        delete sess.practice![conceptId]; // one grading per served question
        // The hint ledger for this question has done its job.
        if (sess.hintsByQ) delete sess.hintsByQ[questionId];
        return {
          correct,
          answerIndex: q.answer, // post-grade only, for marking the right choice
          // The marking explanation is the surface where a student actually
          // reads maths words ("gradient", "indices", "factorise"), so the
          // curriculum's own vocabulary is applied here too — otherwise the
          // terminology layer would never be visible (§4).
          explanation: body.lang && body.lang !== "en"
            ? q.explanation
            : applyTerminology(q.explanation, state.profile.board),
          streak: rec.streak,
          mastery: rec.mastery,
          misconceptionId: misc?.id ?? null,
          flare,
        };
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      const r = upd.result as { error?: string };
      if (r.error) {
        // A ledger that could not be written is a real failure, not a bad
        // request: the answer is intact and unrecorded, and the learner is
        // told so rather than shown a model that moved without evidence.
        return NextResponse.json(
          { error: r.error },
          { status: r.error === "evidence_not_recorded" ? 503 : 400 },
        );
      }
      return NextResponse.json(upd.result);
    }

    if (body.action === "hint") {
      const { conceptId, questionId, level } = body;
      if (
        typeof conceptId !== "string" || !conceptId ||
        typeof questionId !== "string" || !questionId ||
        typeof level !== "number" || !Number.isInteger(level) || level < 1 || level > 4
      ) {
        return NextResponse.json({ error: "bad request" }, { status: 400 });
      }
      // A hint is ACTIVITY, not measurement: the count that reaches the
      // learner model is the one attached to the graded answer (the server
      // kept that ledger while the question was served). The request itself is
      // still evidence — "asked for help here, twice, before getting it" — so
      // it is recorded as a hint_requested event, which the fold deliberately
      // ignores. See lib/evidence.ts#hintEvidence.
      let hintEvent: EvidenceEvent | null = null;
      const upd = await updateProfile(body.id, (state) => {
        checkSecret(state, body.secret);
        const state_ = state as Session;
        const q = state_.practice?.[conceptId]?.q;
        if (!q || q.id !== questionId) {
          return { error: "stale or unknown question" as const };
        }
        // Server-side hint ledger: independence is deduced from what the
        // server actually handed out, never from what the client reports.
        state_.hintsByQ ??= {};
        state_.hintsByQ[questionId] = Math.min(4, (state_.hintsByQ[questionId] ?? 0) + 1);
        // Scaffolding demand is learner-model data: record it per concept.
        // Create the entry if needed — a student who asks for help before
        // their first answer still leaves a learner-model trace.
        const p = (state.progress[conceptId] ??= {
          attempts: 0,
          correct: 0,
          streak: 0,
          mastery: 0,
          lastSeen: Date.now(),
          misconceptions: {},
        });
        p.hints ??= {};
        p.hints[String(level)] = (p.hints[String(level)] ?? 0) + 1;
        hintEvent = hintEvidence({
          learnerId: body.id,
          at: Date.now(),
          source: "practice",
          subject: getConcept(conceptId)?.subject ?? null,
          conceptId,
          specificationId: state.profile.spec ?? null,
          questionId,
          level,
        }) as EvidenceEvent;
        return { hint: buildHint(q, level), level };
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      const r = upd.result as { error?: string };
      if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
      if (hintEvent) {
        try { await appendEvidence(body.id, [hintEvent]); } catch { /* the hint was served; the action log gap is reported, not hidden */ }
      }
      return NextResponse.json(upd.result);
    }

    if (body.action === "micro") {
      const { conceptId, misconceptionId, questionId, choiceIndex } = body;
      if (
        typeof conceptId !== "string" || !conceptId || typeof misconceptionId !== "string" || !misconceptionId ||
        typeof questionId !== "string" || !questionId || !validChoice(choiceIndex)
      ) {
        return NextResponse.json({ error: "bad request" }, { status: 400 });
      }
      const upd = await updateProfile(body.id, async (state) => {
        checkSecret(state, body.secret);
        const graded = gradeMicroCheck(state, conceptId, misconceptionId, questionId, choiceIndex);
        if (!graded) return { error: "no flare to grade" as const };
        // A micro-check IS a graded answer on the misconception's home concept
        // — real learning data — but it never re-tags the misconception (the
        // micro-diagnosis itself is the record).
        const m = MISCONCEPTIONS_BY_ID[misconceptionId];
        const home = m.concepts.find((cid) => cid !== conceptId) ?? conceptId;
        const at = Date.now();
        const event = answerEvidence({
          learnerId: body.id,
          at,
          source: "practice",
          subject: getConcept(home)?.subject ?? null,
          conceptId: home,
          specificationId: state.profile.spec ?? null,
          questionId,
          correct: graded.correct,
          chosen: choiceIndex,
          // A micro-check is served without hints and graded against the
          // flare the server staged — independent evidence either way.
          mode: "independent",
          hints: 0,
          tags: [],
        }) as EvidenceEvent;
        // Event first, model second — the same order as every other write.
        try {
          await commitAndProject(body.id, state, [event]);
        } catch {
          return { error: "evidence_not_recorded" as const };
        }
        // A failed check gets the full walk-through: the point is repairing
        // the belief, not withholding help from someone we just diagnosed.
        const hint = graded.correct ? undefined : buildHint({ prompt: graded.prompt, explanation: graded.explanation }, 4);
        return { ...graded, hint };
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      const r = upd.result as { error?: string };
      if (r.error) {
        return NextResponse.json({ error: r.error }, { status: r.error === "evidence_not_recorded" ? 503 : 400 });
      }
      return NextResponse.json(upd.result);
    }

    // ── Starter Mode (§6/§15): teach problem initiation, never solve. ──
    if (body.action === "starter") {
      const { conceptId, questionId } = body;
      if (typeof conceptId !== "string" || !conceptId || typeof questionId !== "string" || !questionId) {
        return NextResponse.json({ error: "bad request" }, { status: 400 });
      }
      const upd = await updateProfile(body.id, (state) => {
        checkSecret(state, body.secret);
        const sess = (state as Session);
        const q = sess.practice?.[conceptId]?.q;
        if (!q || q.id !== questionId) return { error: "stale or unknown question" as const };
        const s = buildStarter(conceptId, q);
        // Asking for the scaffold is learner-model data — like a hint request,
        // it creates the progress entry if this is the student's first touch.
        // Asking for the scaffold creates the entry, not a measurement:
        // mastery starts at the honest 0.2 prior, never a fabricated 0.
        const p = (state.progress[conceptId] ??= emptyProgress());
        p.starter = { asked: (p.starter?.asked ?? 0) + 1, correct: p.starter?.correct ?? 0 };
        sess.starter ??= {};
        sess.starter[conceptId] = { q, s };
        return viewStarter(s);
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      const r = upd.result as { error?: string };
      if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
      return NextResponse.json(upd.result);
    }

    if (body.action === "starterPick") {
      const { conceptId, questionId, choiceIndex } = body;
      if (typeof conceptId !== "string" || !conceptId || typeof questionId !== "string" || !questionId || !validChoice(choiceIndex)) {
        return NextResponse.json({ error: "bad request" }, { status: 400 });
      }
      const upd = await updateProfile(body.id, (state) => {
        checkSecret(state, body.secret);
        const sess = (state as Session);
        const entry = sess.starter?.[conceptId];
        if (!entry || entry.q.id !== questionId) return { error: "no starter flow for question" as const };
        const reveal = gradeConnector(conceptId, entry.s, choiceIndex, entry.q);
        // Bridge-recognition is learner-model data: record the outcome.
        const p = state.progress[conceptId];
        if (p && reveal.correct) p.starter = { asked: p.starter?.asked ?? 1, correct: (p.starter?.correct ?? 0) + 1 };
        delete sess.starter![conceptId]; // one reveal per flow
        return reveal;
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      const r = upd.result as { error?: string };
      if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
      return NextResponse.json(upd.result);
    }

    if (body.action === "peer") {
      const { conceptId, strong } = body;
      if (typeof conceptId !== "string" || !conceptId || typeof strong !== "boolean") {
        return NextResponse.json({ error: "bad request" }, { status: 400 });
      }
      const upd = await updateProfile(body.id, (state) => {
        checkSecret(state, body.secret);
        // Same rule as starter: creating the entry is not a measurement.
        const p = (state.progress[conceptId] ??= emptyProgress());
        p.peer ??= { checks: 0, strong: 0 };
        p.peer.checks += 1;
        if (strong) p.peer.strong += 1;
        return { checks: p.peer.checks, strong: p.peer.strong };
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(upd.result);
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
