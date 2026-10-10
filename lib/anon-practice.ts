"use client";

// ─────────────────────────────────────────────────────────────────────────────
// The anonymous-first practice session, shared by the /solve wedge and /try
// learning links. A profile is created lazily — only when the student actually
// engages — and never demands a name, email or account. Every answer still
// flows through the server-graded practice API, so the learner model starts
// recording from the very first question without any onboarding.
//
// NO ROUTE STRINGS AND NO fetch HERE ANY MORE. This module used to spell out
// seven URLs, its own query strings and its own error handling, which is how
// the anonymous path and the signed-in path came to differ about what an answer
// meant. It now names OPERATIONS (lib/api/client.ts) — the same ones the
// concept page uses — so the two front ends cannot disagree, and the capability
// travels where the operation says it does rather than from a `secret=` string
// rebuilt at each call site.
// ─────────────────────────────────────────────────────────────────────────────

import { loadProfileId, writeProfileId } from "@/lib/api/identity";
import * as api from "@/lib/api/client";
import type { FlarePayload, MicroDiagStatus } from "@/lib/microdiag";
import type { FigureSpec } from "@/lib/types";
import type { StarterReveal, StarterView } from "@/lib/starter";

export type { FlarePayload };

export interface AnonPracticeQ {
  id: string;
  conceptId: string;
  prompt: string;
  choices: string[];
  /** The diagram this item needs, when it needs one — the anonymous wedge shows
   *  the same questions as the signed-in practice surface, so it draws the same
   *  figures (components/question-figure.tsx). */
  figure?: FigureSpec;
  /** "numeric" = the learner TYPED. The box is keyed off this, so the surface
   *  never has to infer the response kind from what happens to be in the
   *  payload. */
  responseKind?: "choice" | "numeric";
  /** The unit the answer is in, for the box to show. `answerValue` is stripped
   *  server-side, so what the box carries is deliberately the shape only. */
  tolerance?: { unit?: string };
  difficulty: number;
}

export interface AnonGrade {
  correct: boolean;
  answerIndex: number | null;
  explanation: string;
  misconceptionId: string | null;
  /** WHAT THE ANSWER DEMONSTRATED, in the server's own attribution: the mode
   *  it was done under, the server's hint count, the evidence source and whether
   *  a delayed recall held. The server has always sent this with the grade; the
   *  anonymous path dropped it, so a stranger's answer was never told what it
   *  proved while the same answer on /learn was. `verdictForGrade`
   *  (lib/proof.ts) turns it into the one verdict word every surface uses. */
  demonstrated: { mode?: string; hints?: number; source?: string; retained?: boolean } | null;
  /** Present when the misconception ledger flared (§4–5): the named pattern,
   *  coaching line, and — when due — a one-question micro-diagnostic. */
  flare: FlarePayload | null;
  /** The server recognised this submission as one it had already recorded (a
   *  replayed offline answer). There is no fresh verdict to show, and the
   *  surface says so rather than inventing one. */
  duplicate?: boolean;
}

/**
 * What happened to an answer. Three real outcomes, no fourth:
 *
 *   graded   the server graded it (possibly recognising a replay)
 *   offline  held on this device and replayed when the connection returns —
 *            the learner is told, because "we will mark it later" is a
 *            different sentence from "you were wrong"
 *   error    the server refused it in a way retrying cannot fix
 */
export type AnonAnswerOutcome =
  | { kind: "graded"; grade: AnonGrade }
  | { kind: "offline" }
  | { kind: "error"; status: number };

/** Single-flight guard: concurrent callers (StrictMode double-effects, rapid
 *  clicks) share one creation instead of minting rival anonymous profiles. */
let pendingAnon: Promise<string | null> | null = null;

/** Return the local profile id, creating an anonymous one if none exists.
 *  Self-healing: if the stored id no longer exists on the server (a wiped
 *  store, a moved deployment), a fresh anonymous profile is created instead
 *  of dead-ending the returning visitor. Returns null only if unreachable. */
export async function ensureAnonProfile(language: string): Promise<string | null> {
  const existing = loadProfileId();
  // "unknown" (unreachable) keeps the profile we already have. Creating a new
  // one would need the network anyway, and would abandon the learner's history.
  if (existing && (await api.learnerExists(existing)) !== false) return existing;
  pendingAnon ??= createAnonProfile(language).finally(() => { pendingAnon = null; });
  return pendingAnon;
}

async function createAnonProfile(language: string): Promise<string | null> {
  try {
    // Only what an anonymous learner needs: a name is never required, and the
    // profile is born with its own capability so the very first recorded answer
    // is attributable to it.
    const state = await api.createProfile({ handle: "anon", country: "XX", language });
    const id = state.profile?.id;
    if (!id) return null;
    // `createProfile` already adopts the identity; this makes the ordering
    // explicit for the caller that stores the id, not redundant.
    writeProfileId(id);
    return id;
  } catch {
    return null;
  }
}

/** Serve one practice question for a concept, recording against the (possibly
 *  newly created) anonymous profile. */
export async function anonServe(conceptId: string, language: string): Promise<AnonPracticeQ | null> {
  const id = await ensureAnonProfile(language);
  if (!id) return null;
  try {
    const body = await api.serveQuestion(id, conceptId, { lang: language });
    return body.question ?? null;
  } catch {
    return null;
  }
}

/** Serve a *transfer* question: the serve request declares the intent, the
 *  server stages it (harder question, transfer attribution on grading) and
 *  the client cannot claim transfer credit for an ordinary practice draw. */
export async function anonServeTransfer(conceptId: string, language: string): Promise<AnonPracticeQ | null> {
  const id = await ensureAnonProfile(language);
  if (!id) return null;
  try {
    const body = await api.serveQuestion(id, conceptId, { intent: "transfer", lang: language });
    return body.question ?? null;
  } catch {
    return null;
  }
}

/** Grade a picked choice through the server; the client never decides
 *  correctness — and never declares mode or hint count. The server knows
 *  both: the serve intent staged transfer, and its hint ledger counted the
 *  scaffolding actually handed out (audit P0-B / §29).
 *
 *  The answer goes through the SAME operation either way; what changes offline
 *  is only whether it can be delivered yet. It names its own submission, so a
 *  replay after a dropped response is recorded once. */
export async function anonAnswer(
  conceptId: string, questionId: string, given: { choiceIndex: number } | { numericAnswer: string }, language: string,
  meta?: { ms?: number },
): Promise<AnonAnswerOutcome> {
  const id = await ensureAnonProfile(language);
  if (!id) return { kind: "error", status: 0 };
  const outcome = await api.answerQuestion({
    id, conceptId, questionId, ...given, lang: language, ms: meta?.ms,
  });
  if (outcome.kind === "offline") return { kind: "offline" };
  if (outcome.kind === "error") return { kind: "error", status: outcome.status };
  const v = outcome.verdict;
  if (v.duplicate) {
    // The ledger already holds this submission. Show what it recorded, and
    // nothing it did not: a replayed answer has no fresh explanation to give.
    return {
      kind: "graded",
      grade: {
        correct: v.correct, answerIndex: null, explanation: "", misconceptionId: null,
        // No fresh attribution either: this submission was already on the
        // ledger, and the record's verdict is not this answer's to re-make.
        demonstrated: null, flare: null, duplicate: true,
      },
    };
  }
  return {
    kind: "graded",
    grade: {
      correct: v.correct,
      answerIndex: v.answerIndex,
      explanation: v.explanation,
      misconceptionId: v.misconceptionId,
      demonstrated: v.demonstrated ?? null,
      flare: v.flare ?? null,
    },
  };
}

/** Grade a submitted micro-diagnostic check (§5). Returns the honest
 *  classification: conceptual (missed it), procedural (passed it — the
 *  failure is in execution), or null when no flare was standing. */
export async function anonMicroCheck(
  conceptId: string,
  misconceptionId: string,
  questionId: string,
  choiceIndex: number,
  language: string,
): Promise<{ status: MicroDiagStatus; correct: boolean; explanation: string } | null> {
  const id = await ensureAnonProfile(language);
  if (!id) return null;
  try {
    return await api.microCheck(id, conceptId, misconceptionId, questionId, choiceIndex);
  } catch {
    return null;
  }
}

/** Open the Starter Mode flow (§6/§15) for a served question: the four-step
 *  scaffold that teaches problem initiation. The student's goal/givens text
 *  is scratch space in the UI only — never uploaded, never stored. */
export async function anonStarter(conceptId: string, questionId: string, language: string): Promise<StarterView | null> {
  const id = await ensureAnonProfile(language);
  if (!id) return null;
  try {
    return await api.starterView(id, conceptId, questionId);
  } catch {
    return null;
  }
}

/** Grade the bridge pick; the reveal names the real connector and hands over
 *  the first move. A wrong pick still completes the flow — teaching, not gating. */
export async function anonStarterPick(
  conceptId: string,
  questionId: string,
  choiceIndex: number,
  language: string,
): Promise<StarterReveal | null> {
  const id = await ensureAnonProfile(language);
  if (!id) return null;
  try {
    return await api.starterPick(id, conceptId, questionId, choiceIndex);
  } catch {
    return null;
  }
}
