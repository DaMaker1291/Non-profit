"use client";

// ─────────────────────────────────────────────────────────────────────────────
// The anonymous-first practice session, shared by the /solve wedge and /try
// learning links. A profile is created lazily — only when the student actually
// engages — and never demands a name, email or account. Every answer still
// flows through the server-graded practice API, so the learner model starts
// recording from the very first question without any onboarding.
// ─────────────────────────────────────────────────────────────────────────────

import { loadLocalProfileId, storeLocalProfileId, ensureProfileSecret } from "@/lib/client";
import { newSubmissionId, postAnswer } from "@/lib/sync-queue";
import type { FlarePayload, MicroDiagStatus } from "@/lib/microdiag";
import type { StarterReveal, StarterView } from "@/lib/starter";

export type { FlarePayload };

export interface AnonPracticeQ {
  id: string;
  conceptId: string;
  prompt: string;
  choices: string[];
  difficulty: number;
}

export interface AnonGrade {
  correct: boolean;
  answerIndex: number | null;
  explanation: string;
  misconceptionId: string | null;
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
  | { kind: "error"; status: number };/** Single-flight guard: concurrent callers (StrictMode double-effects, rapid
 *  clicks) share one creation instead of minting rival anonymous profiles. */
let pendingAnon: Promise<string | null> | null = null;

/** Return the local profile id, creating an anonymous one if none exists.
 *  Self-healing: if the stored id no longer exists on the server (a wiped
 *  store, a moved deployment), a fresh anonymous profile is created instead
 *  of dead-ending the returning visitor. Returns null only if unreachable. */
export async function ensureAnonProfile(language: string): Promise<string | null> {
  const existing = loadLocalProfileId();
  // "unknown" (unreachable) keeps the profile we already have. Creating a new
  // one would need the network anyway, and would abandon the learner's history.
  if (existing && (await profileExists(existing)) !== false) return existing;
  pendingAnon ??= createAnonProfile(language).finally(() => { pendingAnon = null; });
  return pendingAnon;
}

/** Does this profile still exist on the server?
 *
 *  THREE answers, not two — and the third is the one that matters offline. An
 *  unreachable server (a network error, a 5xx) is NOT the same fact as a 404:
 *  treating it as "gone" mints a brand-new profile on every flaky connection,
 *  which loses the learner the very model the answer was supposed to update.
 *  "unknown" keeps the id we have and lets the answer queue instead. */
async function profileExists(id: string): Promise<boolean | "unknown"> {
  try {
    const res = await fetch(`/api/progress?id=${encodeURIComponent(id)}&subject=maths&secret=${encodeURIComponent(ensureProfileSecret())}`);
    if (res.status === 404) return false;
    if (res.ok) return true;
    return res.status >= 500 ? "unknown" : false;
  } catch {
    return "unknown";
  }
}

async function createAnonProfile(language: string): Promise<string | null> {
  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: "anon", country: "XX", language }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const id = j?.profile?.id as string | undefined;
    if (!id) return null;
    storeLocalProfileId(id);
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
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "serve", id, conceptId, lang: language, secret: ensureProfileSecret() }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return (j.question as AnonPracticeQ) ?? null;
}

/** Serve a *transfer* question: the serve request declares the intent, the
 *  server stages it (harder question, transfer attribution on grading) and
 *  the client cannot claim transfer credit for an ordinary practice draw. */
export async function anonServeTransfer(conceptId: string, language: string): Promise<AnonPracticeQ | null> {
  const id = await ensureAnonProfile(language);
  if (!id) return null;
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "serve", id, conceptId, intent: "transfer", lang: language, secret: ensureProfileSecret() }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return (j.question as AnonPracticeQ) ?? null;
}

/** Grade a picked choice through the server; the client never decides
 *  correctness — and never declares mode or hint count. The server knows
 *  both: the serve intent staged transfer, and its hint ledger counted the
 *  scaffolding actually handed out (audit P0-B / §29).
 *
 *  The answer goes through the SAME route either way; what changes offline is
 *  only whether it can be delivered yet. It names its own submission, so a
 *  replay after a dropped response is recorded once. */
export async function anonAnswer(
  conceptId: string, questionId: string, choiceIndex: number, language: string,
  meta?: { ms?: number },
): Promise<AnonAnswerOutcome> {
  const id = await ensureAnonProfile(language);
  if (!id) return { kind: "error", status: 0 };
  const outcome = await postAnswer("/api/progress", {
    submissionId: newSubmissionId(),
    deviceAt: Date.now(),
    body: {
      action: "answer", id, conceptId, questionId, choiceIndex, lang: language,
      ms: meta?.ms, secret: ensureProfileSecret(),
    },
  });
  if (outcome.kind === "held") return { kind: "offline" };
  if (outcome.kind === "refused") return { kind: "error", status: outcome.status };
  let j: Record<string, unknown>;
  try {
    j = (await outcome.res.json()) as Record<string, unknown>;
  } catch {
    return { kind: "error", status: outcome.res.status };
  }
  if (j.duplicate === true) {
    // The ledger already holds this submission. Show what it recorded, and
    // nothing it did not: a replayed answer has no fresh explanation to give.
    return {
      kind: "graded",
      grade: {
        correct: j.correct === true,
        answerIndex: null,
        explanation: "",
        misconceptionId: null,
        flare: null,
        duplicate: true,
      },
    };
  }
  return {
    kind: "graded",
    grade: {
      correct: !!j.correct,
      answerIndex: typeof j.answerIndex === "number" ? j.answerIndex : null,
      explanation: typeof j.explanation === "string" ? j.explanation : "",
      misconceptionId: typeof j.misconceptionId === "string" ? j.misconceptionId : null,
      flare: (j.flare as FlarePayload | null) ?? null,
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
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "micro", id, conceptId, misconceptionId, questionId, choiceIndex, secret: ensureProfileSecret() }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return { status: j.status, correct: !!j.correct, explanation: typeof j.explanation === "string" ? j.explanation : "" };
}

/** Open the Starter Mode flow (§6/§15) for a served question: the four-step
 *  scaffold that teaches problem initiation. The student's goal/givens text
 *  is scratch space in the UI only — never uploaded, never stored. */
export async function anonStarter(conceptId: string, questionId: string, language: string): Promise<StarterView | null> {
  const id = await ensureAnonProfile(language);
  if (!id) return null;
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "starter", id, conceptId, questionId, secret: ensureProfileSecret() }),
  });
  if (!res.ok) return null;
  return (await res.json()) as StarterView;
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
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "starterPick", id, conceptId, questionId, choiceIndex, secret: ensureProfileSecret() }),
  });
  if (!res.ok) return null;
  return (await res.json()) as StarterReveal;
}
