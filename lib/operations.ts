// ─────────────────────────────────────────────────────────────────────────────
// THE DOOR'S DECISIONS, WITHOUT A TRANSPORT AND WITHOUT A DISK.
//
// OpenMind answers a serve in two places: the Next route handler (a server, an
// fs store, an HTTP response) and the published static build (a browser, a
// localStorage ledger, no server at all). Both must make the SAME educational
// decision, because the decision is the product: which item, at which depth,
// why. The route used to hold it and the static page used to hold a copy, and
// the copy had already drifted — the page derived the tier from the concept's
// own subject while the route used the profile's first subject, so a learner
// sitting two courses could be served the wrong depth depending on which of the
// two products answered them.
//
// So the decision lives here: pure functions over a `ProfileState`, with the
// staging written into the state the caller already holds. Nothing here reads a
// file, opens a socket or decides an HTTP status. `lib/ledger.ts` did this for
// the WRITE path (append and project, storage injected); this does it for the
// serve.
//
// TWO CALLERS, AND THE GATE HOLDS THEM TOGETHER:
//   · app/api/progress/route.ts — the server, wrapping this in auth + JSON;
//   · docs/app.js — the static build, calling it through the engine bundle.
// `scripts/verify-engines.mjs` asserts that neither one re-derives the aim, and
// that both reach the draw through `servePractice`.
//
// WHY THE DRAW NEEDS ITS OWN BOOKKEEPING: `generateQuestionNear` picks the draw
// NEAREST an aim, deterministically. For a concept whose generator makes only a
// handful of items that means the same item again and again — measured at 44
// concepts — so a serve must know what it has already handed out. That ledger
// (`servedPractice`) is part of THIS decision, which is exactly why it cannot
// live in one caller and be forgotten by the other.
// ─────────────────────────────────────────────────────────────────────────────

import { answerKey } from "./answer";
import { getConcept } from "./genome";
import { practiceTarget, type PracticeTarget } from "./question-bank";
import { generateQuestionNear } from "./questions";
import { isRetentionDue } from "./retention";
import { difficultyFor, specForProfile } from "./specifications";
import { serveTransfer, canTransfer, type Surface } from "./transfer";
import type { ProfileState, Question } from "./types";

/** How many draws a practice serve searches for an item in the aimed band.
 *  Band-first selection makes the tier decide which band the learner is served;
 *  the budget is what turns that from "usually" into "for any band the bank can
 *  produce at all". The draws are pure generator calls — microseconds — and the
 *  search is only spent in full when a band is genuinely unreachable, where no
 *  number of draws could find one and the honest nearest fallback takes over. */
export const PRACTICE_DRAW_ATTEMPTS = 40;

/** How many served item keys a concept remembers. Bounded because a session's
 *  practice on one concept must not grow the stored state without limit — and
 *  after this many the learner has long since seen everything the generator
 *  makes. The list is OLDEST FIRST, so a repeat still rotates to the back. */
export const SERVED_KEEP = 12;

/** The part of a learner's state a serve writes: what is staged, what has been
 *  handed out, and what the staged item will earn when it is answered. A
 *  `ProfileState` carries these optionally — they only exist once a serve has
 *  happened — so this is the shape of the state AFTER one, not a different kind
 *  of state. */
export interface ServeState extends ProfileState {
  /** The item currently staged for grading, per concept. */
  practice?: Record<string, { q: Question }>;
  /** Item keys already served for each concept this sitting, so a concept whose
   *  generator can produce only a handful of items is not handed back to the
   *  learner over and over. */
  servedPractice?: Record<string, string[]>;
  /** Staged transfer requests: the serve declares the intent, the state
   *  remembers it. Nothing a client asserts later can buy transfer credit. */
  transferStage?: Record<string, { questionId: string }>;
  /** The surface each staged transfer actually used. Credit is only given for
   *  a genuinely different surface, never for a same-surface re-draw. */
  transferSurface?: Record<string, Surface>;
  /** A concept the scheduler had due is served as a REVIEW, and this is how the
   *  answer that follows is recorded with `source: "retrieval"`. Deliberately
   *  not client-declarable: a learner cannot ask for retention credit, only
   *  earn it by recalling aged work. */
  retrievalStage?: Record<string, { questionId: string }>;
  /** How much help was HANDED OUT for each served question. This is the ledger
   *  independence is derived from, so it is written where the hint is given —
   *  never reported by the surface that asked for it. */
  hintsByQ?: Record<string, number>;
}

/** What the record says about this concept right now, before a draw exists. */
export interface PracticeAim {
  /** The band this learner's own course sits at, for THIS concept's subject. */
  band: number;
  /** The scheduler's verdict: this concept's recall has aged enough to be
   *  worth checking. A due check is served at the band, never above it. */
  due: boolean;
  /** What the record wants: the rung the aim moved to, and why. */
  target: PracticeTarget;
  /** What the draw should actually aim at, after the exemptions. */
  aim: number;
}

/**
 * The aim for one concept, from the learner's own record.
 *
 * `band` is read from the concept's OWN subject course, not the profile's first
 * one. A learner sitting GCSE maths and A-level physics was served physics at
 * the maths band when the door answered, and at the physics band when the
 * static build answered — one learner, two difficulties, depending on which
 * product they happened to use. A course is chosen per subject (`one course per
 * subject`), so the depth has to be read per subject too.
 */
export function practiceAim(state: ProfileState, conceptId: string): PracticeAim {
  const subject = getConcept(conceptId)?.subject;
  const band = difficultyFor(specForProfile(state.profile, subject));
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
  // ── THE TWO EXEMPTIONS, AND WHY THEY ARE EXEMPT ────────────────────────
  // A delayed-recall check is served at the concept's own band: "I remembered
  // it" must not be able to mean "I was asked an easier question". A transfer
  // request carries its own deliberate floor BELOW (`max(0.5, band)`) — it has
  // to be harder by construction or it is not transfer.
  return { band, due, target, aim: due ? band : target.difficulty };
}

/** One serve, decided. `question` is the FULL item (the caller strips it for
 *  the wire); `target` is null for a check or a transfer, because neither is a
 *  claim that the record moved the rung. */
export interface ServedPractice {
  question: Question;
  /** The band the SERVED item actually falls in, never the one aimed at. */
  aim: PracticeAim;
  /** True when this serve was a transfer request that really achieved a second
   *  surface. A concept whose items cannot be re-framed gets a harder direct
   *  draw — deeper work on the same form, which is not transfer. */
  reframed: boolean;
  /** Whether a second surface is possible for this concept AT ALL. A fact about
   *  the concept, not a claim about this draw. */
  transferable: boolean;
  isTransfer: boolean;
}

export type ServeResult =
  | { ok: true; served: ServedPractice }
  | { ok: false; error: "unsupported_concept" | "no_question" };

export interface ServeInput {
  /** The learner's state. The staging below is written INTO it — the caller
   *  owns persisting it, and must not save a state it then throws away. */
  state: ServeState;
  conceptId: string;
  /** `"transfer"` asks for a re-framed harder item. */
  intent?: "transfer";
  /** The language a transfer re-framing is written in. */
  lang?: string;
  /** Override the draw's randomness. Only a test passes one: the seed is what
   *  makes two serves on one concept different draws, so a caller that pins it
   *  has asked for a repeat. */
  seed?: string;
}

/**
 * The hint ledger's one rule: asking for help on a served question counts once
 * more than it did, and never more than the ladder has rungs.
 *
 * WHY THIS IS AN OPERATION AND NOT A LINE IN EACH CALLER. Independence is
 * deduced from what was actually handed out, so the count has to be written by
 * whoever hands it out — and read by whoever grades the answer. Two callers
 * writing it two ways is two different answers to "did this learner need
 * help?". The static page used to keep a counter in the practice view (a
 * number the surface itself owned) while the server kept this ledger; the
 * learner-visible consequence is that one product could report work it helped
 * with as independent.
 */
export function noteHint(state: ServeState, questionId: string): number {
  state.hintsByQ ??= {};
  state.hintsByQ[questionId] = Math.min(4, (state.hintsByQ[questionId] ?? 0) + 1);
  return state.hintsByQ[questionId];
}

/** What one answer is allowed to have demonstrated, and under which source it
 *  is recorded. Every field is read from what the serve STAGED, never from what
 *  the surface says about itself. */
export interface AnswerDisposition {
  /** `guided` when help was taken, `transfer` when this was a staged re-framing
   *  that really achieved a second surface, `independent` otherwise. */
  mode: "guided" | "independent" | "transfer";
  /** The evidence source: a staged delayed recall is `retrieval`, a staged
   *  re-framing is `transfer`, everything else is `practice`. */
  source: "practice" | "transfer" | "retrieval";
  /** How much help the ledger recorded before this answer. */
  hints: number;
  /** Was this the item the serve staged as a transfer for this concept? */
  wasTransfer: boolean;
  /** Was this the item the serve staged as a due review? */
  wasRetrieval: boolean;
  /** The re-framed surface the staged transfer used, when it used one. */
  surface: Surface | undefined;
}

/**
 * Attribute one answer from the staged state.
 *
 * HINTS ARE CHECKED FIRST, AND THAT ORDER IS THE WHOLE RULE. Written the other
 * way round (`isTransfer ? "independent" : hints > 0 ? …`), a transfer request
 * whose concept has no re-framed surface returned `mode: "independent"` for an
 * answer that had taken a hint: the ledger declined to credit independence
 * while the disposition the learner is SHOWN said "independent". The deep suite
 * found it on the hinted-transfer case, which is why the rule lives here once
 * rather than in each caller where one of them can get the order wrong.
 */
export function answerDisposition(
  state: ServeState,
  conceptId: string,
  questionId: string,
): AnswerDisposition {
  const hints = state.hintsByQ?.[questionId] ?? 0;
  const wasTransfer = state.transferStage?.[conceptId]?.questionId === questionId;
  const wasRetrieval = state.retrievalStage?.[conceptId]?.questionId === questionId;
  const surface = state.transferSurface?.[questionId];
  // Only a genuinely different surface earns transfer: a direct re-draw is
  // deeper work on the same form, and is recorded as what it is.
  const mode: AnswerDisposition["mode"] =
    hints > 0 ? "guided" : wasTransfer && surface ? "transfer" : "independent";
  const source: AnswerDisposition["source"] =
    wasRetrieval ? "retrieval" : mode === "transfer" ? "transfer" : "practice";
  return { mode, source, hints, wasTransfer, wasRetrieval, surface };
}

/**
 * Serve one practice question and STAGE it.
 *
 * The order matters and is the reason this is one function rather than three
 * helpers: the draw is made from the keys already served, the drawn item's key
 * is recorded, the item is staged for grading, and — for the two special
 * serves — the stage that will decide the ANSWER's attribution is written. A
 * caller that did these in a different order would stage an item whose key was
 * never recorded (served twice) or record a key whose item was never staged
 * (unanswerable).
 */
export function servePractice(input: ServeInput): ServeResult {
  const { state, conceptId } = input;
  const subject = getConcept(conceptId)?.subject;
  if (!subject) return { ok: false, error: "unsupported_concept" };
  const isTransfer = input.intent === "transfer";
  const seed = input.seed ?? `p${Date.now()}:${conceptId}:${Math.floor(Math.random() * 1e9)}`;
  const aim = practiceAim(state, conceptId);

  let question: Question;
  let surface: Surface = "direct";
  if (isTransfer) {
    // Genuine transfer is a re-framing the serve can really deliver, and what
    // counts as one — plus which draw delivers it — is decided in
    // lib/transfer.ts#serveTransfer, not here. A transfer with no second
    // surface available is a promise the product cannot keep, so it is an
    // error rather than a silent easier item.
    const served = serveTransfer(conceptId, seed, Math.max(0.5, aim.band), input.lang ?? "en");
    if (!served) return { ok: false, error: "no_question" };
    question = served.question;
    surface = served.surface;
  } else {
    const drawn = generateQuestionNear(
      conceptId,
      seed,
      aim.aim,
      PRACTICE_DRAW_ATTEMPTS,
      state.servedPractice?.[conceptId] ?? [],
    );
    if (!drawn) return { ok: false, error: "no_question" };
    question = drawn;
  }

  // Record the served item so the NEXT serve on this concept skips it. Always
  // appended, even a repeat: the list rotates, so the most recently served key
  // must move to the back.
  state.servedPractice ??= {};
  const list = state.servedPractice[conceptId] ?? [];
  list.push(answerKey(question));
  state.servedPractice[conceptId] = list.slice(-SERVED_KEEP);

  state.practice ??= {};
  state.practice[conceptId] = { q: question };

  if (isTransfer) {
    state.transferStage ??= {};
    state.transferStage[conceptId] = { questionId: question.id };
    if (surface !== "direct") {
      state.transferSurface ??= {};
      state.transferSurface[question.id] = surface;
    }
  }
  if (aim.due) {
    state.retrievalStage ??= {};
    state.retrievalStage[conceptId] = { questionId: question.id };
  }

  return {
    ok: true,
    served: {
      question,
      aim,
      reframed: isTransfer ? surface !== "direct" : false,
      transferable: canTransfer(conceptId),
      isTransfer,
    },
  };
}
