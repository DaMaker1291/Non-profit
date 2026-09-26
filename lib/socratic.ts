// ─────────────────────────────────────────────────────────────────────────────
// The Socratic tutor — in the learner's language.
//
// Strategy unchanged: never hand over the answer. Pick a guiding question
// tailored to the concept and any known misconception, give ONE structural
// hint, end with a question. Deterministic, offline, works on 2G.
//
// Language behaviour: every fixed reply segment resolves through the
// dictionary (soc.* keys). The concept line reuses the content tier (ctitle),
// the misconception coaching line likewise (mcCoaching) — both fall back to
// the authored English for languages without that content yet. Visible,
// honest, never a raw key.
// ─────────────────────────────────────────────────────────────────────────────

import { getConcept } from "./genome";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import { generateQuestion, hashSeed } from "./questions";
import { translator } from "./i18n";
import { ctitle, mcCoaching, mcName } from "./content-i18n";
import { classifyIntent } from "./local-model";

/** Resolves a key through the dictionary; null when the key is missing. */
function seg(lang: string, key: string): string | null {
  const v = translator(lang)(key);
  return v === key ? null : v;
}

/** First-choice lookup: the learner's language, then authored English. */
function line(lang: string, key: string, fallback: string): string {
  return seg(lang, key) ?? seg("en", key) ?? fallback;
}

function joinSentences(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([.?!؟。！？])/, "$1")
    .replace(/ {2,}/g, " ");
}

/** Intent detection across the languages OpenMind serves: the keyword lists
 *  cover the dictionary languages' common phrasings for "give me the answer"
 *  and "I'm stuck". Unknown languages still get the default guiding reply. */
function wantsAnswer(lower: string): boolean {
  return ["answer", "tell me", "just give", "respuesta", "réponse", "resposta",
    "jawab", "jawaban", "sagot", "antwort", "答え", "答案", "جواب", "উত্তর", "जवाब",
  ].some((w) => lower.includes(w));
}

function isStuck(lower: string): boolean {
  return ["stuck", "help", "don't understand", "dont understand", "confus",
    "ayuda", "aide", "hilfe", "aiuto", "ajuda", "bantuan", "tulong",
    "帮助", "助けて", "مدد", "मदद", "सहायता", "madad", "সাহায্য", "msaada", "مساعدة",
  ].some((w) => lower.includes(w));
}

function isWhy(lower: string): boolean {
  return ["why", "为什么", "為什麼", "なぜ", "pourquoi", "por qué", "porque",
    "warum", "kenapa", "bakit", "چرا", "क्यों", "kyun", "kwenye", "kwa nini", "لماذا",
  ].some((w) => lower.includes(w));
}

/**
 * What is this student asking for?
 *
 * Keyword lists FIRST, on purpose. They are high-precision and their behaviour
 * must not change, so a fitted model is only consulted when no keyword matched
 * — which makes this purely additive: it can find intent in a phrasing the
 * lists miss (a language they do not cover, a student who never says "stuck"),
 * and it can never override a rule that already decided. A misread "I'm stuck"
 * is worse than a neutral question, so the model's own confidence floor and
 * margin check apply (lib/local-model.ts).
 */
function intentOf(message: string, lower: string): "answer" | "stuck" | "why" | "check" | null {
  if (wantsAnswer(lower)) return "answer";
  if (isWhy(lower)) return "why";
  if (isStuck(lower)) return "stuck";
  const r = classifyIntent(message);
  if (!r) return null;
  const label = r.label;
  return label === "answer" || label === "stuck" || label === "why" || label === "check" ? label : null;
}

/**
 * Is there anything to be Socratic ABOUT?
 *
 * A message with no words in it — "xx", "?", "z z" — has no subject, no step
 * and no claim to question. Answering it with concept coaching is what made the
 * tutor look canned: the learner typed three different nothings and read the
 * same paragraph three times, none of which was about anything they had said.
 * Saying what is needed is the honest reply; the word-repetition test is
 * deliberately crude, because it only has to separate "nothing to work with"
 * from "something to work with", and everything else falls through to the
 * ordinary Socratic move.
 */
function hasWords(message: string): boolean {
  return message
    .toLowerCase()
    .split(/\s+/)
    .some((w) => {
      const letters = w.replace(/[^\p{L}]/gu, "");
      return letters.length >= 3 && !/^(..?)\1+$/.test(letters);
    });
}

/**
 * Which opener, deterministically.
 *
 * The opener used to be chosen with Math.random(), which made the reply
 * impossible to compare with itself: two identical calls returned different
 * text, so every equality-based proof of the tutor's behaviour had to be
 * weakened to survive it — and the deeper problem is that randomness is not
 * what a learner wants here. What they want is that DIFFERENT questions get
 * different openings while the SAME question, asked twice, is answered the same
 * way. So the index comes from the concept and the message: varied across
 * messages, reproducible for one.
 */
function pickOpener(ops: string[], conceptId: string, message: string): string {
  if (!ops.length) return "";
  return ops[hashSeed(`${conceptId}:${message.trim().toLowerCase()}`) % ops.length];
}

/** The three-move scaffold for "I'm stuck". */
function stuckShape(lang: string, conceptLine: string): string {
  return joinSentences([
    line(lang, "soc.stuckLead", "Break it into three moves."),
    conceptLine,
    line(lang, "soc.given", "Try this: write down exactly what is GIVEN and what is ASKED."),
    line(lang, "soc.givenQ", "What is the given here?"),
  ]);
}

/** ── WHAT THE OFFLINE TUTOR IS TOLD ────────────────────────────────────────
 *
 *  `socraticReply(conceptId, message)` knew the concept but nothing else about
 *  the moment: not the question on the screen, not why OpenMind had served it,
 *  not which belief patterns THIS learner's own answers had triggered. So the
 *  fallback — the mode most learners on most deployments actually get — was the
 *  least grounded voice in the product, while the AI path (which may not even
 *  be configured) got the full packet.
 *
 *  `GroundedContext` is that packet, in the form the offline engine can use.
 *  Everything in it is optional so existing callers keep working, and
 *  everything in it is READ, never invented: the caller passes what the
 *  surfaces are actually showing, the same facts the AI path is handed.
 *
 *    question   — the served prompt's text (the concept's generic coaching is
 *                 the fallback when absent)
 *    serveReason— the practice target's own reason (fresh / steady / repair /
 *                 stretch) — WHY this question is on screen; a repair turn that
 *                 does not mention repairing is indistinguishable from a random
 *                 one
 *    hitIds     — the misconception ids this learner's OWN recorded answers on
 *                 this concept triggered (a tutor that recites the concept's
 *                 whole catalogue is guessing about this learner)
 */
export interface GroundedContext {
  question?: string;
  serveReason?: string | null;
  hitIds?: string[];
}

/** One or two grounded sentences, deterministic in content and order. Both are
 *  optional so every existing call site keeps its shape; a caller with no
 *  context gets exactly the concept-grounded replies it always did. */
function groundedLines(lang: string, g: GroundedContext): string[] {
  const parts: string[] = [];
  const q = (g.question ?? "").trim();
  if (q) parts.push(`${line(lang, "soc.onScreen", "Look at the question on your screen")}: ${q}`);
  const reason = (g.serveReason ?? "").trim();
  if (reason) parts.push(line(lang, "soc.serveWhy", "OpenMind served this one to") + " " + reason + ".");
  const hitIds = (g.hitIds ?? []).filter((id) => !!MISCONCEPTIONS_BY_ID[id]).slice(0, 2);
  if (hitIds.length) {
    const names = hitIds.map((id) => mcName(lang, id, MISCONCEPTIONS_BY_ID[id].name));
    const coaching = mcCoaching(lang, hitIds[0], MISCONCEPTIONS_BY_ID[hitIds[0]].coaching ?? "");
    parts.push(
      joinSentences([
        `${line(lang, "soc.ownSlips", "Your recorded answers here triggered")}: ${names.join(", ")}.`,
        coaching,
      ]),
    );
  }
  return parts;
}

/**
 * Offline Socratic reply in the learner's language.
 * `lang` is optional so existing callers keep working; new callers pass the
 * interface/teaching language.
 *
 * `ctx` carries what the surfaces are showing — the served question, the
 * practice target's reason, the misconception patterns this learner's own
 * answers triggered. With it, the fallback speaks about THIS question and THIS
 * learner; without it, the reply is the concept-grounded scaffold it always
 * was (rooms and concept-only turns still call it that way).
 */
export function socraticReply(
  conceptId: string,
  message: string,
  lang = "en",
  ctx: GroundedContext = {},
): string {
  const c = getConcept(conceptId);

  const conceptTitle = ctitle(lang, conceptId);
  const lessonSentence = c ? c.lesson.split(". ").slice(0, 2).join(". ") : "";
  const conceptLine = lessonSentence
    ? `${conceptTitle}: ${lessonSentence}`
    : line(lang, "soc.start", "Let's start from what you know.");

  const mids = c?.misconceptions ?? [];
  const coaching = mids.length
    ? mcCoaching(lang, mids[0], MISCONCEPTIONS_BY_ID[mids[0]]?.coaching ?? "")
    : "";

  const lower = message.toLowerCase();
  const openerKeys = ["soc.opener1", "soc.opener2", "soc.opener3", "soc.opener4", "soc.opener5"];
  const ops = openerKeys
    .map((k) => seg(lang, k) ?? seg("en", k))
    .filter((s): s is string => !!s);
  const opener = pickOpener(ops, conceptId, message);

  const intent = intentOf(message, lower);
  const grounded = groundedLines(lang, ctx);
  // Nothing to question: say what is needed instead of teaching a concept the
  // learner never mentioned. Checked AFTER intent, so a keyword that decided
  // still decides ("help" stays the stuck scaffold even on its own).
  if (!intent && !hasWords(message)) {
    return joinSentences([
      line(lang, "soc.askQuestion", "Tell me the question, or the step you are on, and I will ask you the right thing."),
      ...grounded,
    ]);
  }
  if (intent === "answer") {
    return joinSentences([
      line(lang, "soc.refuse", "I won't hand over the answer — but I'll walk you to it."),
      ...grounded,
      conceptLine,
      line(lang, "soc.sure", "Which part of that do you already feel sure about?"),
    ]);
  }
  if (intent === "why") {
    return joinSentences([
      opener,
      ...grounded,
      coaching || conceptLine,
      line(lang, "soc.whyQ", "Here's a question: if you changed ONE number in your working, which change would make everything click?"),
    ]);
  }
  if (intent === "check") {
    // "Is this right?" is the one request a Socratic tutor must answer with a
    // method rather than a verdict: checking is the skill, and doing it for
    // them removes the practice.
    return joinSentences([
      line(lang, "soc.check", "Then check it yourself, one line at a time — and say the rule you used at each step."),
      ...grounded,
      conceptLine,
      line(lang, "soc.checkQ", "Which line of your working are you least sure about?"),
    ]);
  }
  if (intent === "stuck") {
    return joinSentences([stuckShape(lang, conceptLine), ...grounded]);
  }
  return joinSentences([
    opener,
    ...grounded,
    coaching || conceptLine,
    line(lang, "soc.restate", "Now — can you restate the question in your own words?"),
  ]);
}

/** Rich context pack for the optional LLM layer (llm.ts). */
export function tutorPromptPack(conceptId: string, message: string, lang = "en"): string {
  const c = getConcept(conceptId);
  const misconceptions = (c?.misconceptions ?? [])
    .map((m) => MISCONCEPTIONS_BY_ID[m])
    .filter(Boolean)
    .map((m) => `- ${m.name}: ${m.pattern} → coach with: ${m.coaching}`)
    .join("\n");
  return [
    `CONCEPT: ${ctitle(lang, conceptId)} (${c?.subject ?? "general"})`,
    `LESSON: ${c?.lesson ?? "n/a"}`,
    misconceptions ? `KNOWN MISCONCEPTIONS:\n${misconceptions}` : "",
    `STUDENT MESSAGE: ${message}`,
    `Reply in this language if possible: ${lang}`,
    "Ask ONE guiding question. Do NOT give the final answer.",
  ].filter(Boolean).join("\n\n");
}

/** One worked example generated live for the lesson page. */
export function workedExample(conceptId: string, lang = "en"): { prompt: string; steps: string[] } | null {
  const q = generateQuestion(conceptId, `ex-${Math.floor(Math.random() * 1e9)}`);
  if (!q) return null;
  return {
    prompt: q.prompt,
    steps: [
      line(lang, "soc.step1", "Step 1 — Write down what is given and what is asked."),
      line(lang, "soc.step2", "Step 2 — Which idea from the lesson connects given to asked?"),
      `${line(lang, "soc.step3", "Step 3 — Reasoning:")}: ${q.explanation}`,
      // The check line APPENDS the choice instead of being wholly replaced by
      // its key. As a key alone it silently dropped the answer in fourteen
      // languages — "Check: the correct choice was" and then nothing — because
      // the English inline default was the only version that interpolated it.
      `${line(lang, "soc.step4", "Check: the correct choice was")} "${q.choices[q.answer]}".`,
    ],
  };
}
