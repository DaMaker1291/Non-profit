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

import { CONCEPTS, getConcept } from "./genome";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import { generateQuestion, hashSeed } from "./questions";
import { fill, translator } from "./i18n";
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

function isExplain(lower: string): boolean {
  return ["explain", "explícame", "explica", "explique", "erkläre", "erklär", "spiega",
    "explica-me", "açıkla", "説明して", "解释一下", "اشرح", "وضّح", "समझाओ", "समझाइए",
    "jelaskan", "ipaliwanag", "سمجھاؤ", "বুঝিয়ে দাও", "বুঝাও",
  ].some((w) => lower.includes(w));
}

/**
 * "Show me a worked example" is a REQUEST, not an unclear message.
 *
 * The product already generates a worked example for a concept
 * (`workedExample` below) and the no-model AI route already hands one to the
 * learner rather than apologising; the tutor did not recognise the ask, so
 * "show me a worked example" and "The capital of France is Paris." received
 * the IDENTICAL reply — measured by the product benchmark (8/10 distinct).
 * A learner asking to be shown how this is done was told to say which step
 * they are on, which is the opposite of an answer to what they asked.
 */
function isExample(lower: string): boolean {
  return ["worked example", "example", "for instance", "show me how", "show me an example",
    "ejemplo", "exemple", "beispiel", "esempio", "exemplo", "örnek", "例題", "举例",
    "مثال", "उदाहरण", "contoh", "halimbawa", "misali", "উদাহরণ",
  ].some((w) => lower.includes(w));
}

function isWhy(lower: string): boolean {
  return ["why", "为什么", "為什麼", "なぜ", "pourquoi", "por qué", "porque",
    "warum", "kenapa", "bakit", "چرا", "क्यों", "kyun", "kwenye", "kwa nini", "لماذا",
  ].some((w) => lower.includes(w));
}

/**
 * A request for a hint, which is a request the page behind the panel can
 * already answer.
 *
 * Asking for a hint is not the same message as "I don't understand it" and it
 * was being answered as one: the learner asked for the next step and got a
 * Socratic question back, which is the single most annoying possible reply to
 * "give me a hint". The product HAS a four-level hint ladder under the
 * question, and pointing at it is the correct, honest answer — it is help the
 * learner can act on in the same second.
 */
function isHint(lower: string): boolean {
  return ["hint", "clue", "pista", "indice", "índice", "hinweis", "dica",
    "petunjuk", "cabhitaan", "hiw", "sugerencia", "संकेत", "सुराग", "ヒント", "提示",
    "تلميح", "اشارہ", "راهنم", "ইঙ্গিত", "подсказ",
  ].some((w) => lower.includes(w));
}

/**
 * Words too common to prove that a message is about this screen.
 *
 * Without this list the overlap test was satisfied by the concept's own prose:
 * the lesson text contains "what", "the" and "is", so "What is the capital of
 * France?" counted as touching the screen — and the tutor answered a question
 * about France with place-value coaching. The words that carry meaning are the
 * only ones that can decide, in every language the dictionaries cover (the
 * lists are short on purpose: a stop word missed costs a request, never a wrong
 * claim, and a content word wrongly stopped would make a real question look
 * unrelated).
 */
const COMMON_WORDS = new Set([
  "what", "which", "why", "how", "who", "when", "where", "does", "did", "isn",
  "the", "this", "that", "these", "those", "there", "here", "and", "but", "not",
  "you", "your", "yours", "can", "could", "would", "should", "will", "shall",
  "for", "from", "with", "without", "about", "into", "onto", "than", "then",
  "are", "was", "were", "have", "has", "had", "been", "being", "its", "it's",
  "que", "qué", "como", "cómo", "por", "para", "con", "los", "las", "una", "uno",
  "der", "die", "das", "und", "ist", "was", "nicht", "ist", "wie", "ein", "eine",
  "le", "la", "les", "des", "une", "est", "que", "qui", "comment", "pour",
  "o", "a", "os", "as", "um", "uma", "que", "qual", "como", "para", "não",
]);

/**
 * Does the learner's message touch anything on this screen?
 *
 * Deliberately crude, and deliberately USED for one thing only: when a message
 * shares no word with the concept or with the question in front of them, the
 * tutor asks which step they are on instead of holding forth about an idea
 * they did not mention. That reply asserts nothing about the learner, so a
 * false positive costs a request, not a wrong claim — which is the whole
 * reason it is phrased as an offer rather than as "that is off-topic".
 *
 * Content words only: see COMMON_WORDS, which is what stopped "What is the
 * capital of France?" from counting as a question about place value.
 */
function touchesThisScreen(message: string, conceptId: string, ctx: GroundedContext): boolean {
  const c = getConcept(conceptId);
  const hay = [c?.title ?? "", c?.lesson ?? "", conceptId, ctx.question ?? ""].join(" ").toLowerCase();
  const words = message.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3 && !COMMON_WORDS.has(w));
  return words.some((w) => hay.includes(w));
}

/**
 * Does the message STATE something about the method, rather than ask?
 *
 * The tutor had two shapes for a learner's sentence: a request for the answer
 * ("I won't hand over the answer — but I'll walk you to it") and a request for
 * a next step ("can you restate the question in your own words?"). A learner
 * who says "I think you add the two numbers together" is doing neither — they
 * are offering a CLAIM, and the Socratic move is to have them test it. Treating
 * that as a request for the answer is what made a correct method and a wrong
 * one get the same reply (§11: the tutor must tell correct reasoning from a
 * misconception and from uncertainty).
 *
 * High precision on purpose, like the other detectors here: a missed claim
 * costs the ordinary guiding reply, while a false claim would put words in the
 * learner's mouth. Nothing about the correctness of the reasoning is claimed —
 * that is not knowable from free text, and the reply asks them to test it
 * rather than grading it.
 */
function statesClaim(lower: string): boolean {
  return ["i think", "i thought", "i did", "we did", "i added", "i multiplied",
    "i divided", "i subtracted", "so i", "then i", "i got", "i worked out",
    "because i", "isn't it", "isnt it", "my method", "my working", "you just",
    "you only", "you have to", "you always", "creo que", "je pense", "ich denke",
    "penso che", "eu acho", "misalnya", "akala ko", "مجھے لگتا ہے", "मुझे लगता है",
  ].some((w) => lower.includes(w));
}

/**
 * A DIFFERENT concept by name, or null.
 *
 * High precision on purpose: concept titles are canonical strings, so a learner
 * who says "can you explain quadratics instead" is provably asking about
 * another idea while this panel is anchored to the one on screen. Naming it and
 * saying where it lives is the honest reply; tutoring them on place value while
 * they ask about quadratics is the behaviour that makes a tutor feel deaf.
 */
function otherConceptNamed(conceptId: string, lang: string, message: string): string | null {
  const lower = message.toLowerCase();
  // The id as well as the title: a learner says "quadratics", the title says
  // "Quadratic equations", and matching only the title made the tutor answer a
  // question about another concept with this one's material — the exact failure
  // this function exists to stop. The hyphenated id also matches unhyphenated.
  const names = (c: { id: string }) => [
    ctitle(lang, c.id).toLowerCase(),
    c.id.toLowerCase(),
    c.id.replace(/-/g, " ").toLowerCase(),
  ];
  for (const c of CONCEPTS) {
    if (c.id === conceptId) continue;
    // Short names ("Area", "Mass") appear inside ordinary sentences; a false
    // match there would derail a real question.
    if (names(c).some((n) => n.length >= 6 && lower.includes(n))) return c.id;
  }
  return null;
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
function intentOf(message: string, lower: string): "answer" | "stuck" | "why" | "hint" | "check" | "explain" | "example" | null {
  // "WHY" IS CHECKED BEFORE "ANSWER", and the order is the rule: "why is my
  // answer wrong?" contains the word "answer", so checking for an answer
  // request first classified a learner asking for the REASONING as a learner
  // asking to be given the answer — and they were refused it, which is the
  // reply the acceptance battery recorded. A why-question is about the method
  // (and gets the `why` move); only a bare "what's the answer" is a request to
  // hand it over.
  if (isWhy(lower)) return "why";
  if (wantsAnswer(lower)) return "answer";
  // EXPLAIN and EXAMPLE sit between "give me the answer" and "give me a hint":
  // both are explicit asks for teaching, and both have real moves here — the
  // idea said once, and the engine's own generated worked example. Checked
  // before `isStuck` so "I don't understand, explain it" gets the explanation
  // the learner asked for rather than the stuck scaffold.
  if (isExplain(lower)) return "explain";
  if (isExample(lower)) return "example";
  if (isHint(lower)) return "hint";
  if (isStuck(lower)) return "stuck";
  const r = classifyIntent(message);
  if (!r) return null;    const label = r.label;
  return label === "answer" || label === "stuck" || label === "why" || label === "hint" || label === "check" ? label : null;
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

/**
 * A message that names ANOTHER concept gets one reply, from one owner.
 *
 * Factored out because two branches need it: the ordinary one (no intent
 * recognised) and the new teach-me moves — "can you explain quadratics to me
 * instead?" is an explain request whose SUBJECT is elsewhere, and answering it
 * with the current concept's definition is the reply a learner reads as "the
 * tutor is not listening". Null when the message names no other concept, so
 * the caller carries on with its own move.
 */
function otherConceptMove(conceptId: string, lang: string, message: string, conceptTitle: string): string | null {
  const other = otherConceptNamed(conceptId, lang, message);
  if (!other) return null;
  return joinSentences([
    fill(line(lang, "soc.otherConcept", "That is a different idea — {other} has its own page, and I can help with it there."), { other: ctitle(lang, other) }),
    fill(line(lang, "soc.hereInstead", "We are on {concept} here."), { concept: conceptTitle }),
    line(lang, "soc.askQuestion", "Tell me the question, or the step you are on, and I will ask you the right thing."),
  ]);
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
  const hitIds = (g.hitIds ?? []).filter((id) => !!MISCONCEPTIONS_BY_ID[id]).slice(0, 2);
  // ── THE REASON IS ALREADY ON SCREEN ────────────────────────────────────
  // The panel renders the decision's own reason UNDER every reply (it is the
  // payload's `grounding`, filled into tutor.whyThis), so speaking it as a
  // sentence as well put the same closing clause on all eight different
  // messages of the acceptance battery — "OpenMind served this one to stretch"
  // — which is precisely the canned repetition §11 forbids. Same rule as the
  // concept definition below: it survives where it is the only thing there is
  // to say (a room or concept-only caller, with no question on screen and no
  // patterns of this learner's own to name).
  if (reason && !q && hitIds.length === 0) parts.push(line(lang, "soc.serveWhy", "OpenMind served this one to") + " " + reason + ".");
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
  // ── GROUNDING IS NOT A LESSON ────────────────────────────────────────────
  // When the turn carries what is actually on the screen (the served
  // question, why it was served, the patterns this learner's own answers
  // triggered), the concept definition is NOT repeated: the learner is looking
  // at the lesson and the question, and pasting the definition into every reply
  // is what made the tutor read as canned text (§tutor: "do not repeatedly dump
  // the concept definition into every response"). The definition survives
  // exactly where it is the only thing there is to say — a concept-only turn
  // with no screen context, which is how rooms and the offline card call it.
  const contextLine = grounded.length > 0 ? "" : conceptLine;
  // Nothing to question: say what is needed instead of teaching a concept the
  // learner never mentioned. Checked AFTER intent, so a keyword that decided
  // still decides ("help" stays the stuck scaffold even on its own).
  if (!intent && !hasWords(message)) {
    return joinSentences([
      line(lang, "soc.askQuestion", "Tell me the question, or the step you are on, and I will ask you the right thing."),
      ...grounded,
    ]);
  }
  // Asking about a DIFFERENT idea, by name: say where it lives and stay on the
  // screen. Checked before the ordinary moves because it is provable — the
  // message names another concept's own title — and because answering it with
  // the current concept is the reply a learner reads as "the tutor is not
  // listening".
  // ── A CLAIM IS NOT A REQUEST ─────────────────────────────────────────────
  // Checked AFTER the actionable asks (stuck, hint, why — requests the learner
  // wants answered) and BEFORE the "does this touch the screen?" test, because
  // a stated method often shares no vocabulary with the question: "I think it
  // works because you -12" mentions neither the concept nor the prompt, and the
  // overlap test was swallowing it into the same reply as "What is this?" and
  // "What is the capital of France?". A sentence that states a method is
  // offering a hypothesis, and having the learner test it is the move that
  // teaches. The learner's own words are read back so the reply is provably
  // about what they said, and nothing is claimed about whether it is right —
  // that is not knowable from free text, and grading it would be exactly the
  // dishonest AI behaviour §11 forbids.
  if (intent !== "stuck" && intent !== "hint" && intent !== "why" && statesClaim(lower)) {
    const claim = message.trim().length <= 160 ? message.trim() : `${message.trim().slice(0, 157)}…`;
    return joinSentences([
      `${line(lang, "soc.claimLead", "You have given me a method — let's test it rather than trust it")}: ${claim}`,
      ...grounded,
      contextLine,
      line(lang, "soc.claimQ", "Which line of it would change if you put a small number in place of the letter — and would the answer still hold?"),
    ]);
  }
  if (!intent) {
    const elsewhere = otherConceptMove(conceptId, lang, message, conceptTitle);
    if (elsewhere) return elsewhere;
    // A message that touches nothing on THIS SCREEN: ask which step they are
    // on rather than holding forth. See `touchesThisScreen` — the reply is an
    // offer, never a claim that the learner is off-topic.
    //
    // Only when a screen is actually in front of them: the sentence says "this
    // question", and a concept-only caller (a room, the offline card) has none.
    // Without this guard the move also swallowed every ordinary message from
    // those callers and gave them all the SAME reply — which the variety
    // assertion caught (1 distinct reply in 40 turns) before it could ship.
    if (ctx.question && !touchesThisScreen(message, conceptId, ctx)) {
      return joinSentences([
        line(lang, "soc.unclear", "I can only follow this question with you, so tell me which step of it you are on."),
        ...grounded,
        line(lang, "soc.askQuestion", "Tell me the question, or the step you are on, and I will ask you the right thing."),
      ]);
    }
  }
  if (intent === "hint") {
    return joinSentences([
      line(lang, "soc.hintLead", "There are four levels of hint under the question — take level 1 first, then the next only if you are still stuck."),
      ...grounded,
      line(lang, "soc.hintQ", "Which step are you on when it stops making sense?"),
    ]);
  }
  if (intent === "answer") {
    return joinSentences([
      line(lang, "soc.refuse", "I won't hand over the answer — but I'll walk you to it."),
      ...grounded,
      contextLine,
      line(lang, "soc.sure", "Which part of that do you already feel sure about?"),
    ]);
  }
  if (intent === "explain") {
    // A NAMED OTHER CONCEPT WINS OVER THE MOVE. "Can you explain quadratics to
    // me instead?" is an explain request AND a request about a different idea,
    // and answering it with the idea of the concept the learner is trying to
    // leave is the "tutor is not listening" reply this branch exists to avoid.
    const elsewhere = otherConceptMove(conceptId, lang, message, conceptTitle);
    if (elsewhere) return elsewhere;
    // An explicit request for the idea is the ONE case where the definition is
    // not "dumping canned text": the learner asked for it (the every-reply
    // suppression above exists for the replies nobody asked to be taught in).
    return joinSentences([
      line(lang, "soc.explainLead", "Here is the idea, once — then we use it"),
      conceptLine,
      ...grounded,
      line(lang, "soc.explainQ", "Say it back in your own words, then we'll do one step together."),
    ]);
  }
  if (intent === "example") {
    const elsewhere = otherConceptMove(conceptId, lang, message, conceptTitle);
    if (elsewhere) return elsewhere;
    // The engine's OWN generator, on a different question from the one on
    // screen — the answer to that one stays withheld, and this is the same
    // material the no-model AI route already hands a learner rather than an
    // apology. No generator for this concept: say so and point at the lesson,
    // never invent a worked example.
    const ex = workedExample(conceptId, lang, `tutor:${conceptId}:${message.trim().toLowerCase()}`);
    if (ex) {
      return joinSentences([
        line(lang, "soc.exampleLead", "Here is a worked example of this idea — a different question from the one on your screen"),
        ex.prompt,
        ...ex.steps,
        ...grounded,
        line(lang, "soc.exampleQ", "Which step would you try first on your own question?"),
      ]);
    }
    return joinSentences([
      line(lang, "soc.exampleNone", "This concept has no generated example — the lesson above walks one through."),
      ...grounded,
      line(lang, "soc.exampleQ", "Which step would you try first on your own question?"),
    ]);
  }
  if (intent === "why") {
    // ── A WHY-QUESTION IS ABOUT THE LEARNER'S OWN WORDS ────────────────────
    // This branch varied only by `opener` — five fixed sentences chosen by a
    // hash of the message — so two different why-questions could receive
    // byte-identical replies, and did: "Why do I subtract 7?" and "What does
    // the 7 represent?" differed only in which of the five openers the hash
    // landed on, which is the canned text §11 forbids (the superiority test
    // caught the collision). The claim branch already reads the learner's own
    // words back; the one branch where the message's CONTENT *is* the question
    // did not. Reading it back makes the reply provably about what was asked,
    // and makes distinct inputs distinct by construction — the same shape, and
    // the same 160-character cap, as `soc.claimLead` above.
    // The learner's OWN triggered patterns are already in `grounded`; the
    // concept's catalogue is not, unless there is nothing else to say.
    const asked = message.trim().length <= 160 ? message.trim() : `${message.trim().slice(0, 157)}…`;
    return joinSentences([
      `${line(lang, "soc.whyLead", "You asked")}: ${asked}`,
      opener,
      ...grounded,
      contextLine || coaching,
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
      contextLine,
      line(lang, "soc.checkQ", "Which line of your working are you least sure about?"),
    ]);
  }
  if (intent === "stuck") {
    return joinSentences([stuckShape(lang, contextLine || conceptLine), ...grounded]);
  }
  return joinSentences([
    opener,
    ...grounded,
    contextLine,
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
export function workedExample(
  conceptId: string,
  lang = "en",
  seed?: string,
): { prompt: string; steps: string[] } | null {
  // SEEDED CALLERS EXIST BECAUSE A TUTOR REPLY MUST BE RE-READABLE. The lesson
  // page wants a fresh example each time it renders (it passes no seed and gets
  // one), but a TUTOR REPLY MUST SURVIVE A RE-READ: an unseeded generator made
  // the same message return a different worked example on every call, breaking
  // the tutor's own pinned property "the same question twice is answered the
  // same way" — and making the shipped offline engine's reply differ from the
  // server's for identical inputs (the product benchmark's parity check). A
  // caller that must be reproducible passes its own seed.
  const q = generateQuestion(conceptId, seed ?? `ex-${Math.floor(Math.random() * 1e9)}`);
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
