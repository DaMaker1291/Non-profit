import { NextResponse } from "next/server";
import { updateProfile } from "@/lib/server/store";
import { emptyProgress, isRetentionEvidence } from "@/lib/progress";
// ── THE SERVE'S DECISION LIVES IN lib/operations.ts, NOT HERE ──────────────
// Which band, whether the recall is due, which draw, which served keys are
// excluded and what gets staged: one operation, because the published static
// build answers a serve too — with no server and no disk — and the two must not
// be able to disagree about the same learner. This route keeps what is
// genuinely its own: the capability, the persistence of the staging, and what
// crosses the wire.
import { answerDisposition, noteHint, servePractice, type ServeState } from "@/lib/operations";
import { generateQuestion, hasGenerator, serveView } from "@/lib/questions";
import { gradeChoice, gradeNumeric, parseNumericInput } from "@/lib/answer";
import { difficultyBandFor } from "@/lib/question-bank";
import { applyTerminology } from "@/lib/specifications";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { pushRecentHit, buildFlare, gradeMicroCheck } from "@/lib/microdiag";
import { buildStarter, viewStarter, gradeConnector } from "@/lib/starter";
import { buildHint } from "@/lib/hints";
import { noteActivity, type SessionLedger } from "@/lib/session";
import { getConcept } from "@/lib/genome";
import { answerEvidence, deviceClaimAt, hintEvidence, submissionEventId, type EvidenceEvent } from "@/lib/evidence";
import { appendEvidence, hasEvidence, readEvidence } from "@/lib/server/evidence";
import { commitAndProject } from "@/lib/server/projection";
import type { ProfileState, Question } from "@/lib/types";

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

type Session = ServeState & {
  starter?: Record<string, { q: Question; s: ReturnType<typeof buildStarter> }>;
  /** Interface language: localizes served question stems (q.* keys). */
  lang?: string;
  /** Hint ledger, per served question id. Independence (hint-free proof) is
   *  a server-side fact, not a client-declared number (audit §29). */
  hintsByQ?: Record<string, number>;
  /** The open learning session (lib/session.ts). Activity is incremented here,
   *  where the grading actually happens, so the session's "asked/correct"
   *  counters cannot be inflated by the client. */
  learnSession?: SessionLedger;
};

type ServeBody = { action: "serve"; id: string; conceptId: string; intent?: "transfer"; reveal?: boolean; lang?: string; secret?: string };
interface AnswerBody {
  action: "answer"; id: string; conceptId: string; questionId: string;
  /** Multiple-choice: the picked option's index. Exactly one of this and
   *  `numericAnswer` is present, and which one is decided by the question the
   *  SERVER staged — the client cannot pick the grading rule. */
  choiceIndex?: number;
  /** Numeric entry: the learner's typed text, graded against the item's own
   *  tolerance. Sent as text rather than a parsed number so the server, not the
   *  browser, decides whether it was a number at all. */
  numericAnswer?: string;
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
        const served = servePractice({
          state: sess,
          conceptId,
          intent: isTransfer ? "transfer" : undefined,
          lang: body.lang,
        });
        if (!served.ok) return { error: "no question" as const };
        const { question: q, aim, reframed, transferable } = served.served;
        const due = aim.due;
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
          // Did the transfer serve actually achieve a SECOND SURFACE? The
          // learner is about to be told what this stage is, and the honest
          // answer is decided by the OPERATION, not by the client's intent: a
          // concept whose questions cannot be re-framed gets a harder direct
          // draw, which is deeper work on the same form — not transfer.
          reframed: isTransfer ? reframed : undefined,
          // Is a SECOND SURFACE possible for this concept at all? A fact about
          // the concept, not a claim about this draw — so the page can label the
          // stage from the first question instead of promising "Transfer" until
          // the serve contradicts it. Asked of the re-framer itself.
          transferable,
          target: isTransfer || due ? null : {
            reason: aim.target.reason,
            band: difficultyBandFor(q.difficulty),
            scaffold: aim.target.scaffold,
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
      // A TYPED (numeric) ANSWER NAMES NO OPTION. Requiring a valid `choiceIndex`
      // here refused every numeric submission with "bad request" before the
      // staged question could decide how it is marked — so no `responseKind:
      // "numeric"` item could be answered at all. The presence check accepts
      // EITHER form; which one is legal is still decided by the question the
      // SERVER staged (see `q.responseKind` below), never by the client.
      const hasChoice = validChoice(choiceIndex);
      const hasNumeric = typeof (body as AnswerBody).numericAnswer === "string";
      if (typeof conceptId !== "string" || !conceptId || typeof questionId !== "string" || !questionId || (!hasChoice && !hasNumeric)) {
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
        // ── THE STAGED QUESTION DECIDES HOW IT IS MARKED ────────────────────
        // Not the client, and not a guess from which field happens to be
        // present. A numeric item is graded against its own declared tolerance
        // by lib/answer.ts; a choice item by the shared value rule, which reads
        // a numeric item's options as the same numbers so the two ways of
        // answering it agree. An unparseable typed answer is REFUSED rather
        // than recorded as wrong — a keystroke is not evidence about a
        // learner's mathematics, and marking it would write a false fact into
        // the ledger.
        let correct: boolean;
        // What the learner actually gave, in the form the ledger records it:
        // a picked option is its index, a typed answer its canonical NUMBER.
        let givenValue: number | null = null;
        if (q.responseKind === "numeric") {
          // A NUMERIC ITEM CAN BE ANSWERED EITHER WAY, and the two ways must
          // agree (lib/answer.ts rule 3). Its four options carry the same
          // numbers the typed form names, so a learner who TAPS "0.75" instead
          // of typing it has done the same mathematics. Requiring the typed
          // field alone refused every picked numeric item with "not a number"
          // — even though the option the learner touched names exactly the
          // number `gradeChoice` would mark it against. Only the TYPED form can
          // be unparseable; a picked option names a value the server itself
          // computed from the item's own choice strings.
          if (typeof (body as AnswerBody).numericAnswer === "string") {
            const parsed = parseNumericInput(
              (body as AnswerBody).numericAnswer as string,
              q.tolerance?.unit,
            );
            if (parsed === null) return { error: "not a number" as const };
            givenValue = parsed;
            correct = gradeNumeric(parsed, q.answerValue ?? NaN, q.tolerance);
          } else {
            if (!validChoice(choiceIndex) || choiceIndex >= q.choices.length) {
              return { error: "choice out of range" as const };
            }
            // The option's own value, read from the numbers the item built it
            // from. A filler option that names no number (one could survive
            // into a padded set) is never the answer — the correct option
            // always reads back as `answerValue` — but it IS the pick the
            // learner made, so it is recorded as wrong, not refused.
            const picked = Array.isArray(q.choiceValues) ? q.choiceValues[choiceIndex] : undefined;
            givenValue = typeof picked === "number" && Number.isFinite(picked) ? picked : null;
            correct = gradeChoice(q, choiceIndex);
          }
        } else {
          if (!validChoice(choiceIndex) || choiceIndex >= q.choices.length) {
            return { error: "choice out of range" as const };
          }
          correct = gradeChoice(q, choiceIndex);
        }
        const ms = typeof (body as AnswerBody).ms === "number" ? Math.max(0, Math.min(3600000, (body as AnswerBody).ms as number)) : undefined;
        const langRaw = (body as AnswerBody).lang;
        // ── ATTRIBUTION IS NOT DECIDED HERE EITHER ──────────────────────
        // What an answer demonstrated — guided, independent or transfer, and
        // under which source — is read from what the SERVE staged (the hint
        // ledger, the transfer stage, the retrieval stage), never from what a
        // client says about itself. That rule is one operation now
        // (lib/operations.ts#answerDisposition), because the published static
        // page grades its own answers and used to derive this from a counter in
        // its own view: two products, two answers to "did this learner need
        // help?" for the same answer.
        const sess = state as Session;
        const disposition = answerDisposition(sess, conceptId, questionId);
        const { hints: hintCount, mode, source } = disposition;
        const isTransfer = disposition.wasTransfer;
        const isRetrieval = disposition.wasRetrieval;
        const transferSurface = disposition.surface;
        // One clock for this answer: the event and the model the ledger
        // projects from it carry the SAME stamp, so a replay reproduces
        // lastSeen exactly.
        const at = Date.now();
        // The device's claim about WHEN it answered, or null. Judged by the same
        // rule the ingestion door uses (lib/evidence.ts#deviceClaimAt) and kept
        // on the event as a claim: the projection reads `at`, above.
        const deviceAt = deviceClaimAt((body as AnswerBody).deviceAt, at);
        // `source` — the name this answer is recorded under — came back from the
        // disposition above, derived from the same staged facts that decided the
        // mode, so the event and the grade's own explanation cannot disagree
        // about what the answer WAS.
        // Was this answer delayed recall? Read from the model BEFORE the answer
        // moves it, through the ONE retention rule (lib/progress.ts) shared with
        // the live model and the ledger projection — so the sentence the learner
        // is shown is the same claim the ledger will go on to record.
        const priorRecord = state.progress[conceptId];
        const hadPriorEvidence = (priorRecord?.attempts ?? 0) > 0;
        // ── DELAYED RECALL IS NOT THE SAME QUESTION AS RECALL THAT HELD ─────
        // `isRetentionEvidence` answers the first: this answer was a delayed,
        // unaided recall ATTEMPT, because the scheduler had the concept due.
        // The ledger counts it either way — a failed delayed recall is retention
        // ASKED but not correct (lib/progress.ts), because forgetting is the
        // measurement that dimension exists for. The disposition the learner is
        // shown must answer the SECOND question, and reporting the first as the
        // second told a learner who had just failed a due review that their
        // delayed recall was retained. The acceptance battery's fail branch
        // measured `retained: true` on a wrong answer; this is that fix.
        const wasDelayedRecall = isRetentionEvidence({
          source,
          hints: hintCount,
          sinceLast: hadPriorEvidence ? at - (priorRecord?.lastSeen ?? at) : null,
        });
        const retained = wasDelayedRecall && correct;
        const event = answerEvidence({
          learnerId: body.id,
          at,
          // The submission-derived id when the client named one: this is what
          // makes a replay idempotent rather than merely unlikely.
          id: replayId ?? undefined,
          deviceAt,
          source,
          subject: getConcept(conceptId)?.subject ?? null,
          conceptId,
          specificationId: state.profile.spec ?? null,
          questionId,
          correct,
          // −1 marks "the learner typed their answer": there is no option to
          // have chosen, and 0 is a real index so it cannot double as a marker.
          chosen: q.responseKind === "numeric" ? -1 : (choiceIndex as number),
          givenValue,
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
        // WHAT THE ANSWER DEMONSTRATED, in the server's own words (§10).
        // The verdict above says whether the answer was right; these three facts
        // say what it PROVED — and every one of them is attributed server-side
        // (the staged serve, the server's hint ledger, the model before this
        // answer moved it), never asserted by the client. A learner therefore
        // reads "that was independent" only when the server watched it happen,
        // and a hinted answer can never be told it demonstrates autonomy.
        //
        // Deliberately NOT named `evidence`: the ledger EVENT's shape must never
        // cross the wire, because a client that can read the shape a graded
        // answer takes can author one (asserted in the e2e suite). This block is
        // four scalars about one answer — no id, no clock, no provenance.
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
          demonstrated: { mode, hints: hintCount, source, retained },
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
        // Server-side hint ledger: independence is deduced from what the server
        // actually handed out, never from what the client reports. The rule is
        // the operation's (lib/operations.ts#noteHint) because the static build
        // hands hints out too, and one of the two writing its own count is one
        // of the two being wrong about the same learner.
        noteHint(state_, questionId);
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
