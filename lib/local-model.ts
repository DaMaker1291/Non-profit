// ─────────────────────────────────────────────────────────────────────────────
// ON-DEVICE INFERENCE: a small FITTED model that runs on the phone a learner
// already owns.
//
// Why a fitted classifier and not a transformer: a 2016 Android with 1 GB of
// RAM and a Cortex-A53 cannot run one, and an "AI feature" that only works on
// new phones excludes precisely the learners this project exists for. A
// multinomial Naive Bayes over bag-of-tokens is a real trained model (fitted
// parameters, not hand-written rules), costs a few hundred kilobytes of code,
// allocates only for the tokens in the sentence in front of it, and runs in
// pure JS on any engine — including the ones shipped a decade ago.
//
// WHAT IT IS TRAINED ON — stated plainly, because a model that hides its
// training data is a model you cannot trust:
//   · intent: the authored phrase lists below (this project's own examples of
//     how a student asks for an answer, says they are stuck, asks why, or asks
//     for their work to be checked, across the languages OpenMind serves).
//     It is NOT trained on real student messages, and the header says so.
//   · concepts: whatever corpus the caller fits it with (lib/matcher.ts feeds
//     it the genome's own titles/aliases/blurbs), so there is no second copy
//     of the curriculum to drift out of date.
//
// The honesty rules this module must obey:
//   1. Below the confidence floor it returns "unknown" — never a guess.
//   2. It never overrides a rule that already matched. Callers treat it as
//      ADDITIONAL recall, so worst case is the behaviour the app had before.
//   3. One sentence in, one label out, synchronous, no allocation per label
//      beyond the arithmetic. It must not be able to jank an old device.
// ─────────────────────────────────────────────────────────────────────────────

export interface Sample {
  label: string;
  text: string;
}

export interface NbModel {
  labels: string[];
  /** log P(label) */
  logPrior: number[];
  /** P(token | label), Laplace-smoothed. */
  prob: Map<string, Float64Array>;
  /** Token→row index in `prob`'s arrays. */
  vocab: Map<string, number>;
  /** Tokens the model never saw; they contribute nothing to any label. */
  vocabularySize: number;
  /** How many training examples each label got — a label fitted on two
   *  examples is a label the caller should not trust. */
  examples: number[];
}

/** Same normalisation as the matcher's, kept local so this module has no
 *  imports at all: it is the one piece of the app that must load on a device
 *  with nothing else available. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => (w.length > 4 ? w.replace(/s$/, "") : w));
}

/** Fit a multinomial Naive Bayes model. Alpha is Laplace smoothing: it is what
 *  stops a single unseen token from zeroing a whole label's score. */
export function fitNaiveBayes(samples: Sample[], alpha = 0.35): NbModel {
  const labels: string[] = [];
  const index = new Map<string, number>();
  for (const s of samples) {
    if (!index.has(s.label)) {
      index.set(s.label, labels.length);
      labels.push(s.label);
    }
  }
  const vocab = new Map<string, number>();
  const tokenized = samples.map((s) => tokenize(s.text));
  for (const toks of tokenized) {
    for (const t of toks) if (!vocab.has(t)) vocab.set(t, vocab.size);
  }
  const V = vocab.size || 1;
  const counts: Float64Array[] = labels.map(() => new Float64Array(V));
  const totals = new Float64Array(labels.length);
  const examples = new Float64Array(labels.length);
  tokenized.forEach((toks, i) => {
    const li = index.get(samples[i].label)!;
    examples[li] += 1;
    for (const t of toks) {
      const ti = vocab.get(t)!;
      counts[li][ti] += 1;
      totals[li] += 1;
    }
  });
  const prob = new Map<string, Float64Array>();
  labels.forEach((label, li) => {
    const row = new Float64Array(V);
    // P(t | label), smoothed. Unseen-in-this-label tokens get alpha/(total+…)
    // rather than 0, so one odd word cannot veto a label entirely.
    for (let ti = 0; ti < V; ti++) row[ti] = (counts[li][ti] + alpha) / (totals[li] + alpha * V);
    prob.set(label, row);
  });
  return {
    labels,
    logPrior: labels.map((_, li) => Math.log((examples[li] + alpha) / (samples.length + alpha * labels.length))),
    prob,
    vocab,
    vocabularySize: V,
    examples: Array.from(examples),
  };
}

export interface Scored {
  label: string;
  /** Normalised posterior, 0..1 across the labels present. */
  p: number;
}

export interface Classification {
  label: string;
  confidence: number;
  /** Ranked posterior — the caller can see how close the decision was. */
  ranked: Scored[];
  /** Top label's posterior minus the runner-up's. A confident single answer
   *  looks different from a two-way tie, and that difference matters. */
  margin: number;
  /**
   * How much more likely the top label is than the runner-up (p1/p2).
   *
   * This is the measure a many-class problem actually needs: with 135 concepts
   * the posterior mass is spread thin, so `confidence` of 0.6 is unreachable
   * even for an unambiguous question, while "three times more likely than the
   * next candidate" is meaningful and stays comparable across label counts.
   */
  ratio: number;
}

/**
 * Classify one short text. Returns `null` when there is nothing to classify
 * (no known tokens at all) — an empty answer, not a default guess.
 */
export function classify(model: NbModel, text: string): Classification | null {
  const toks = tokenize(text);
  if (toks.length === 0) return null;
  const known = toks.filter((t) => model.vocab.has(t));
  if (known.length === 0) return null;

  const logScores = model.labels.map((label, li) => {
    let s = model.logPrior[li];
    const row = model.prob.get(label)!;
    for (const t of known) s += Math.log(row[model.vocab.get(t)!]);
    return s;
  });
  // Softmax over log-scores → a posterior we can threshold and display.
  const max = Math.max(...logScores);
  const exps = logScores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  const ranked = model.labels
    .map((label, li) => ({ label, p: exps[li] / sum }))
    .sort((a, b) => b.p - a.p);
  const top = ranked[0];
  const margin = top.p - (ranked[1]?.p ?? 0);
  const ratio = ranked[1] && ranked[1].p > 0 ? top.p / ranked[1].p : Infinity;
  return { label: top.label, confidence: top.p, ranked, margin, ratio };
}

// ── Intent ───────────────────────────────────────────────────────────────────
// The four things a student actually says to a tutor, plus an explicit "other".
// The phrases are AUTHORED examples of each intent in the languages OpenMind
// serves — short, because a student typing on a cheap phone is brief.

export type Intent = "answer" | "stuck" | "why" | "check" | "practice" | "other";

export const INTENT_SAMPLES: Sample[] = [
  // ── "just give me the answer" ──
  ...["just tell me the answer", "what is the answer", "give me the answer please", "i need the answer now",
    "answer only", "can you just solve it for me", "what's the final answer", "tell me the result"].map((text) => ({ label: "answer", text })),
  ...["dame la respuesta", "cuál es la respuesta", "solo dime la respuesta", "resposta por favor"].map((text) => ({ label: "answer", text })),
  ...["donne moi la réponse", "quel est le résultat", "la réponse s'il te plaît"].map((text) => ({ label: "answer", text })),
  ...["答えを教えて", "答えは何ですか", "答案是什么", "الجواب من فضلك", "सिर्फ जवाब दो", "答案だけ教えて"].map((text) => ({ label: "answer", text })),

  // ── "I'm stuck / I need help" ──
  ...["i am stuck", "i'm stuck on question 4", "i dont understand this", "i don't get it", "help me with this",
    "i cannot do this one", "i have no idea how to start", "this makes no sense to me", "i keep getting it wrong",
    "this is too hard for me", "too difficult", "i am lost", "no idea what to do", "i tried and it went wrong",
    "i keep going wrong", "not getting it at all", "i need help understanding"].map((text) => ({ label: "stuck", text })),
  ...["estoy atascado", "no entiendo", "no lo entiendo", "ayúdame con esto", "no sé cómo empezar"].map((text) => ({ label: "stuck", text })),
  ...["je suis bloqué", "je ne comprends pas", "aide moi avec ça", "je n'y arrive pas"].map((text) => ({ label: "stuck", text })),
  ...["niache", "sielewi", "nisaidie", "nimekwama"].map((text) => ({ label: "stuck", text })),
  ...["私は困っています", "わかりません", "助けて", "我看不懂", "我不明白", "帮帮我", "أنا عالق", "لا أفهم", "मुझे समझ नहीं आया", "मदद करो", "আমি বুঝতে পারছি না"].map((text) => ({ label: "stuck", text })),

  // ── "why does this work?" ──
  ...["why does this work", "why is the answer that", "why do we flip the fraction", "explain why",
    "why does the sign change", "why is it negative", "why do we do that step", "what is the reason for this",
    "how come that works", "explain the reason for this step", "what makes that rule true"].map((text) => ({ label: "why", text })),
  ...["por qué", "¿por qué funciona?", "pourquoi ça marche", "warum ist das so", "por que funciona"].map((text) => ({ label: "why", text })),
  ...["なぜそうなるの", "这是为什么", "لماذا", "क्यों", "kwa nini", "kenapa begitu", "bakit ganoon"].map((text) => ({ label: "why", text })),

  // ── "check my working" ──
  ...["check my answer", "is this right", "did i do this correctly", "is my working correct",
    "did i make a mistake", "check my working", "have i got this right", "is this correct",
    "check this for me", "verify my working", "the solution i wrote is correct", "my method is correct",
    "spot my slip", "review my steps"].map((text) => ({ label: "check", text })),
  ...["¿está bien?", "revisa mi respuesta", "is dit reg", "vérifie ma réponse", "こたえはあっていますか"].map((text) => ({ label: "check", text })),
  ...["هل هذا صحيح", "यह सही है क्या", "चेक करो"].map((text) => ({ label: "check", text })),

  // ── "let me practise" ──
  ...["give me more practice questions", "i want to practice", "quiz me", "give me another question",
    "more questions please", "let me try some", "test me on this", "another one please",
    "a few more of these", "similar questions", "more of the same kind"].map((text) => ({ label: "practice", text })),
  ...["quiero practicar", "dame más ejercicios", "dammi altri esercizi", "mehr übungen bitte"].map((text) => ({ label: "practice", text })),
  ...["もう一問ください", "再给我一题", "अभ्यास करना है"].map((text) => ({ label: "practice", text })),

  // ── ambient / greeting / not a request for help ──
  ...["hello", "hi there", "good morning", "thanks", "thank you", "ok", "okay i will try", "let me read the lesson first",
    "next question", "ready"].map((text) => ({ label: "other", text })),
  ...["hola", "gracias", "bonjour merci", "asante", "shukriya", "ありがとう", "谢谢", "شكرا"].map((text) => ({ label: "other", text })),
];

/** Above this the model's reading is used on its own; below it, the caller's
 *  own rules decide. Chosen high on purpose: acting on a misread "I'm stuck"
 *  is worse than asking a neutral question. */
export const INTENT_FLOOR = 0.55;
/** A near-tie between two intents is not a decision. */
export const INTENT_MARGIN = 0.15;
/**
 * "This student is asking me to just give the answer" is the single most
 * consequential reading the model can produce, because that branch REFUSES to
 * help. Being wrong there tells a student who wanted their working checked
 * that they are trying to cheat. So that one label must clear a much higher
 * bar than the others — a misfire costs help, a miss costs nothing.
 */
export const ANSWER_STRICT = 0.85;

let intentModel: NbModel | null = null;

export function fitIntentModel(): NbModel {
  if (!intentModel) intentModel = fitNaiveBayes(INTENT_SAMPLES);
  return intentModel;
}

/**
 * The on-device reading of what a student is asking for. `null` when the model
 * is not sure enough to be worth acting on — callers keep their own rules for
 * that case, which is why this can only ever ADD recall, never remove it.
 */
export function classifyIntent(text: string): Classification | null {
  const r = classify(fitIntentModel(), text);
  if (!r) return null;
  if (r.confidence < INTENT_FLOOR || r.margin < INTENT_MARGIN) return null;
  // The "just give me the answer" reading is enforced HERE, inside the model's
  // own contract, so every caller inherits it: that branch refuses help, and a
  // misfire would tell a student who wanted their working checked that they are
  // trying to cheat. Abstaining is always the cheaper mistake.
  if (r.label === "answer" && r.confidence < ANSWER_STRICT) return null;
  return r;
}

/** The intent as one of the tutor's strategies, in the vocabulary lib/socratic
 *  switches on. Kept here so the label set travels with the training data. */
export function intentOf(text: string): Intent | null {
  const r = classifyIntent(text);
  return r ? (r.label as Intent) : null;
}

// ── What it costs a device ──────────────────────────────────────────────────
// Both figures are DERIVED from the shipped data rather than typed in, so a
// later change that bloats the model cannot quietly pass a size budget.

/** Bytes of training table this module carries into the bundle. */
export function sourceBytes(): number {
  return INTENT_SAMPLES.reduce((n, s) => n + s.text.length + s.label.length + 8, 0);
}

/** Exact bytes of the fitted counts, once a model has been fitted: one
 *  Float64 per (vocabulary token × label). The caller can decide whether that
 *  fits the phone in front of it instead of trusting a constant. */
export function fittedBytes(model: NbModel): number {
  return model.vocab.size * model.labels.length * 8;
}
