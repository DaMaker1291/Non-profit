// ─────────────────────────────────────────────────────────────────────────────
// STARTER MODE (§6 / §15): "I understand the question but don't know how to
// start." The biggest learning bottleneck isn't execution — it's initiation.
// This engine never solves anything. It walks the student through the four
// moves an expert makes before any algebra happens:
//
//   1. What is the question actually asking you to find?   (the goal)
//   2. What do you know from the question?                 (the givens)
//   3. Which idea connects what you know to what you need? (the bridge)
//   4. Here's the first move. The rest is yours.           (from the hint ladder)
//
// Step 3 is the diagnostic heart: the choices are the correct concept plus a
// same-family sibling and a concept from a known misconception's confusion
// set — so *which* wrong bridge a student picks is itself learner-model data.
// Deterministic and offline, like every engine in this project.
// ─────────────────────────────────────────────────────────────────────────────

import type { Question } from "./types";
import { CONCEPTS, ancestorsOf } from "./genome";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import { buildHint } from "./hints";
import { Rng, hashSeed } from "./questions";

export interface StarterState {
  conceptId: string;
  /** Server-side only: index of the correct connector in `choices`. */
  answerIndex: number;
  /** Internal flow marker (3 = bridge pending); the client-side walk is
   *  1 goal → 2 givens → 3 connector and never sees this field. */
  asked: 1 | 2 | 3;
  /** Step-3 connector titles, shuffled deterministically. */
  choices: string[];
  /** True when the flow completed (either pick) — the reveal rides in the response. */
  done: boolean;
  /** The student's own goal/givens wording — kept so a future coaching layer
   *  can reflect their words back. Never shown to other users. */
  goal: string;
  givens: string;
}

export interface StarterView {
  /** 1 = open at the goal question · 4 = skip straight to the reveal. */
  step: 1 | 4;
  /** Connector titles, staged for the client's step 3. */
  choices?: string[];
}

export interface StarterReveal {
  done: true;
  correct: boolean;
  /** Title of the concept that actually bridges givens → goal. */
  connectorTitle: string;
  connectorBlurb: string;
  /** The ladder's level-3 first move for this exact question. */
  firstMoveKey?: string;
  firstMoveText?: string;
}

/** Step-3 distractor candidates are derived inline in `buildStarter` so the
 *  misconception trap and sibling fill share one deterministic RNG. */

/** The misconception confusion trap: another concept the same misconception
 *  attaches to — a concept students demonstrably mix up with this one. */
function confusionCandidate(conceptId: string, r: Rng): string | null {
  const c = CONCEPTS.find((x) => x.id === conceptId);
  if (!c) return null;
  const anc = new Set(ancestorsOf(conceptId));
  for (const mid of c.misconceptions ?? []) {
    const m = MISCONCEPTIONS_BY_ID[mid];
    if (!m) continue;
    const others = m.concepts.filter((id) => id !== conceptId && !anc.has(id));
    if (others.length > 0) return r.pick(others);
  }
  return null;
}

/** Build the starter flow for a served question. Pure and deterministic. */
export function buildStarter(conceptId: string, q: Question): StarterState {
  const correctTitle = CONCEPTS.find((x) => x.id === conceptId)?.title ?? conceptId;
  const r = new Rng(hashSeed(`starter:${conceptId}:${q.id}`));

  // Distractors: two same-family concepts — one misconception confusion trap
  // (a concept a known misconception links to this one), the rest true
  // siblings under a shared prerequisite. Titles must be unique so a pick can
  // only ever mean one concept.
  const anc = new Set(ancestorsOf(conceptId));
  const sameFamily = CONCEPTS.filter(
    (x) => x.subject === CONCEPTS.find((x) => x.id === conceptId)?.subject && x.id !== conceptId && !anc.has(x.id),
  );
  // "Siblings" = concepts met at the same stage of the same subject — the
  // peers a student is likely to have half-learned at the same time. (Direct
  // prereq-sharing is narrower and misses stage-0 concepts, which have none.)
  const stage = CONCEPTS.find((x) => x.id === conceptId)?.stage;
  const siblings = sameFamily.filter((x) => x.stage === stage);
  const trapIds = new Set<string>();
  const confusion = confusionCandidate(conceptId, r);
  if (confusion) trapIds.add(confusion);
  for (const id of r.shuffle(siblings.map((x) => x.id))) {
    if (trapIds.size >= 2) break;
    trapIds.add(id);
  }

  const distractors = [...trapIds]
    .map((id) => CONCEPTS.find((x) => x.id === id)?.title)
    .filter((t): t is string => Boolean(t) && t !== correctTitle)
    .slice(0, 2);

  // Fewer than two connectors means step 3 can't discriminate — skip it and
  // go straight to the reveal after the givens step.
  if (distractors.length < 2) {
    return { conceptId, answerIndex: 0, asked: 3, choices: [], done: true, goal: "", givens: "" };
  }

  const choices = r.shuffle([correctTitle, ...distractors]);
  return {
    conceptId,
    answerIndex: choices.indexOf(correctTitle),
    asked: 3,
    choices,
    done: false,
    goal: "",
    givens: "",
  };
}

/** What the client may see: never the answer index. The flow always OPENS at
 *  step 1 (the goal question) — the connector choices ride along staged, and
 *  the client walks 1 → 2 → 3 before revealing them. Skipping straight to the
 *  bridge would defeat the reflection the first two steps exist to force. */
export function viewStarter(s: StarterState): StarterView {
  if (s.done) return { step: 4 };
  return { step: 1, choices: s.choices };
}

/** Grade the connector pick and produce the honest reveal. Teaching, not
 *  gating: a wrong pick still completes the flow — with the real bridge
 *  named and the first move handed over. */
export function gradeConnector(conceptId: string, s: StarterState, choiceIndex: number, q: Question): StarterReveal {
  const c = CONCEPTS.find((x) => x.id === conceptId);
  const correct = choiceIndex === s.answerIndex;
  const hint = buildHint(q, 3);
  return {
    done: true,
    correct,
    connectorTitle: c?.title ?? conceptId,
    connectorBlurb: c?.blurb ?? "",
    firstMoveKey: hint.key,
    firstMoveText: hint.text,
  };
}

/** Record-keeping counters for the learner model. */
export interface StarterTally {
  started: number;
  done: number;
}
