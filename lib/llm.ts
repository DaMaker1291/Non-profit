// ─────────────────────────────────────────────────────────────────────────────
// The AI layer. OpenMind works completely without it — the deterministic
// engines teach, question and mark on their own — but when the deployment has
// a key, the same pedagogy rules are handed to a live model for the four jobs
// it is genuinely better at:
//
//   tutor      — free-form Socratic replies in the learner's language
//   explain    — a worked explanation of a concept the student got stuck on
//   question   — exam-style questions in their board's format and wording
//   mark       — marking a free-text reasoning step against a rubric
//
// ── Why every call returns a REASON, not a null ───────────────────────────
//
// `null` collapsed five different situations into one: no key was configured,
// the provider returned an error, the request timed out, the provider answered
// with something unusable, or a model simply chose not to answer. The caller
// could not tell the learner which had happened, so it could not be honest
// about who answered — and the honesty key it renders (`tutor.offlineNote`
// versus `tutor.fallbackNote`) depends on exactly that difference.
//
// So transport returns `AiOutcome`: text, or one of four named reasons. None of
// them is an exception and none of them is an error page. A model that is
// unavailable makes the offline engine answer, which is a supported outcome of
// this product rather than a failure of it.
// ─────────────────────────────────────────────────────────────────────────────

import { getConcept } from "./genome";
import { decisionLine, tutorGroundingPacket, type TutorGrounding } from "./tutor-context";
import type { Question } from "./types";

export type LlmProvider = "gemini" | "openai" | "groq" | "openrouter" | "custom" | null;
/** A provider that is actually configured — `null` means no model at all. */
export type LiveProvider = Exclude<LlmProvider, null>;

/**
 * Which provider answers, if any.
 *
 * An explicitly configured OpenAI-compatible endpoint wins over every vendor
 * key. That is a deployment decision, not a convenience: a school or region
 * running its own model behind `OPENMIND_AI_BASE_URL` must not be shadowed by
 * an unrelated key that happens to sit in the same environment — and it is also
 * what makes every failure mode of this layer testable against a real HTTP
 * endpoint instead of mocked out.
 */
export function activeProvider(): LlmProvider {
  if (process.env.OPENMIND_AI_BASE_URL && process.env.OPENMIND_AI_KEY) return "custom";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  return null;
}

export function isLlmEnabled(): boolean {
  return activeProvider() !== null;
}

/** Why a model did not answer. Every one of these is an OUTCOME the caller
 *  handles with the offline engine — never an error surfaced to a learner. */
export type AiUnavailableReason = "no_key" | "provider_error" | "timeout" | "malformed";

export type AiOutcome =
  | { ok: true; text: string; provider: LiveProvider; model: string }
  | { ok: false; reason: AiUnavailableReason; provider: LlmProvider; model: string | null };

export interface AiStatus {
  enabled: boolean;
  provider: LlmProvider;
  /** The model that would answer — shown in the UI so a deployment can see
   *  exactly what its key is doing. */
  model: string | null;
  /** How long a call may take before the offline engine answers instead. */
  timeoutMs: number;
}

const MODELS: Record<Exclude<LiveProvider, "custom">, string> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  openrouter: "openai/gpt-4o-mini",
};

/** A self-hosted endpoint names its own model; the vendor list is fixed. */
export function modelFor(provider: LiveProvider): string {
  if (provider === "custom") return process.env.OPENMIND_AI_MODEL ?? "self-hosted";
  return MODELS[provider];
}

/**
 * The timeout on a model call.
 *
 * Bounded because a tutor that hangs is worse for a learner than one that
 * answers from the offline engine: they are sitting in front of a chat box
 * that has stopped responding. Deployments with a slow self-hosted model can
 * raise it; the default keeps a lesson moving.
 */
export function aiTimeoutMs(): number {
  const raw = Number(process.env.OPENMIND_AI_TIMEOUT_MS ?? "");
  return Number.isFinite(raw) && raw >= 200 && raw <= 60000 ? raw : 12000;
}

/** AbortSignal.timeout rejects with TimeoutError; an aborted controller arrives
 *  as AbortError. To a learner waiting on a reply they are the same event. */
function isTimeout(e: unknown): boolean {
  const name = (e as { name?: string } | null)?.name ?? "";
  return name === "TimeoutError" || name === "AbortError";
}

export function aiStatus(): AiStatus {
  const provider = activeProvider();
  return {
    enabled: provider !== null,
    provider,
    model: provider ? modelFor(provider) : null,
    timeoutMs: aiTimeoutMs(),
  };
}

/** Shorthand for the four ways a call can fail to produce text. */
function unavailable(reason: AiUnavailableReason, provider: LlmProvider, model: string | null): AiOutcome {
  return { ok: false, reason, provider, model };
}

const TUTOR_SYSTEM = `You are OpenMind's tutor, serving students anywhere in the world.
RULES (non-negotiable):
1. SOCRATIC: guide with questions; never reveal the final answer to a practice problem.
2. One idea per message; keep under 120 words.
3. Assume low bandwidth: plain text, no markdown tables, no emojis.
4. If the student may be translating in their head, keep sentences short.
5. Encourage before correcting; name the misconception pattern if you know it.`;

const EXPLAIN_SYSTEM = `You are OpenMind, explaining one school concept to a student who is stuck.
RULES:
1. Teach the idea, not the answer to a specific homework question.
2. Plain text only. No markdown headings, no emojis, no tables.
3. Use the student's own examples and units from their curriculum.
4. Under 180 words. Short sentences. One worked step if it helps.
5. End with one question that checks they understood.`;

const QUESTION_SYSTEM = `You write exam questions for OpenMind, exactly in the format of the qualification given.
RULES (non-negotiable):
1. Reply with JSON only — no prose, no markdown fence.
2. Every question must be solvable from the information given.
3. Exactly four choices, exactly one correct, three plausible wrong answers that
   reflect real student mistakes (not silly ones).
4. The explanation must show the working, not just state the answer.
5. Match the qualification's wording and notation, and its tier's difficulty.
6. Never repeat a question that is already in the paper.`;

const MARK_SYSTEM = `You are OpenMind marking one step of a student's written reasoning.
RULES:
1. Be exact about what is right and what is wrong; no praise padding.
2. One sentence on what they did well, one on the next move. Under 60 words.
3. If the reasoning is right but the final value is wrong, say which step slipped.
4. Plain text, no markdown.`;

// ── Transport ───────────────────────────────────────────────────────────────

async function callGemini(prompt: string, system: string, maxTokens: number): Promise<AiOutcome> {
  const provider: LiveProvider = "gemini";
  const model = modelFor(provider);
  const key = process.env.GEMINI_API_KEY;
  if (!key) return unavailable("no_key", provider, model);
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(aiTimeoutMs()),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: system }] },
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
        }),
      },
    );
  } catch (e) {
    return unavailable(isTimeout(e) ? "timeout" : "provider_error", provider, model);
  }
  if (!res.ok) return unavailable("provider_error", provider, model);
  let j: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  try {
    j = (await res.json()) as typeof j;
  } catch {
    return unavailable("malformed", provider, model);
  }
  const text = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) return unavailable("malformed", provider, model);
  return { ok: true, text, provider, model };
}

/**
 * One OpenAI-compatible completion. The URL is a parameter because a deployment
 * may point it at its own model (OPENMIND_AI_BASE_URL) — and because that is how
 * this layer's failure modes get tested against a real endpoint.
 */
async function callOpenAiCompatible(
  prompt: string, url: string, key: string, prov: LiveProvider,
  system: string, maxTokens: number,
): Promise<AiOutcome> {
  const model = modelFor(prov);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(aiTimeoutMs()),
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.4,
      }),
    });
  } catch (e) {
    return unavailable(isTimeout(e) ? "timeout" : "provider_error", prov, model);
  }
  if (!res.ok) return unavailable("provider_error", prov, model);
  let j: { choices?: Array<{ message?: { content?: string } }> };
  try {
    j = (await res.json()) as typeof j;
  } catch {
    // A 200 whose body is not JSON at all (an HTML error page from a proxy is
    // the common case) is a malformed response, not a provider outage.
    return unavailable("malformed", prov, model);
  }
  const text = j.choices?.[0]?.message?.content?.trim();
  // A well-formed envelope with nothing in it is the fourth outcome: the shape
  // arrived, the answer did not.
  if (!text) return unavailable("malformed", prov, model);
  return { ok: true, text, provider: prov, model };
}

/** The exact endpoint for a provider. Exported so tests and operators can see
 *  where a turn was sent without reading the transport. */
export function endpointFor(provider: LiveProvider): string {
  switch (provider) {
    case "custom": return process.env.OPENMIND_AI_BASE_URL ?? "";
    case "openai": return "https://api.openai.com/v1/chat/completions";
    case "groq": return "https://api.groq.com/openai/v1/chat/completions";
    case "openrouter": return "https://openrouter.ai/api/v1/chat/completions";
    case "gemini": return "https://generativelanguage.googleapis.com/v1beta/models";
  }
}

/** One completion, with the reason attached. Never throws, so a network outage
 *  can never break a lesson. */
export async function llmRequest(
  prompt: string,
  opts: { system?: string; maxTokens?: number } = {},
): Promise<AiOutcome> {
  const system = opts.system ?? TUTOR_SYSTEM;
  const maxTokens = opts.maxTokens ?? 400;
  const provider = activeProvider();
  if (!provider) return unavailable("no_key", null, null);
  switch (provider) {
    case "gemini":
      return callGemini(prompt, system, maxTokens);
    case "custom":
      return callOpenAiCompatible(prompt, endpointFor("custom"), process.env.OPENMIND_AI_KEY!, "custom", system, maxTokens);
    case "openai":
      return callOpenAiCompatible(prompt, endpointFor("openai"), process.env.OPENAI_API_KEY!, "openai", system, maxTokens);
    case "groq":
      return callOpenAiCompatible(prompt, endpointFor("groq"), process.env.GROQ_API_KEY!, "groq", system, maxTokens);
    case "openrouter":
      return callOpenAiCompatible(prompt, endpointFor("openrouter"), process.env.OPENROUTER_API_KEY!, "openrouter", system, maxTokens);
  }
}

/** The text, or null when no model answered — for callers that only need the
 *  text. New code should prefer `llmRequest`, which can say WHY. */
export async function llmComplete(
  prompt: string,
  opts: { system?: string; maxTokens?: number } = {},
): Promise<string | null> {
  const out = await llmRequest(prompt, opts);
  return out.ok ? out.text : null;
}

// ── Task: tutor ─────────────────────────────────────────────────────────────

/**
 * A tutor turn, grounded in the decision the surfaces are showing.
 *
 * The prompt is built from the learner's own projection — the action, its
 * reason, the events it cites, the projection version, what has been measured
 * and which belief patterns their work triggered — so the model is not guessing
 * why this student is here. `grounding` is assembled server-side (lib/server/
 * tutor.ts) and never from the request body; a client cannot tell the model a
 * different story than the app is telling itself.
 *
 * Returns the text AND, when there is none, why: `no_key`, `provider_error`,
 * `timeout` or `malformed`. The caller answers with the offline tutor in every
 * one of those cases and says so on screen.
 */
export async function llmTutorReply(grounding: TutorGrounding, message: string, languageHint: string): Promise<AiOutcome> {
  const prompt = tutorGroundingPacket(grounding, message, languageHint);
  return llmRequest(prompt, { system: TUTOR_SYSTEM, maxTokens: 300 });
}

// ── Task: explain ───────────────────────────────────────────────────────────

export interface ExplainInput {
  conceptId: string;
  /** Language the explanation must be written in (BCP-47-ish tag). */
  language: string;
  /** What the student actually asked, when they asked something. */
  question?: string;
  /** Their board's terminology, so a US student reads "slope" not "gradient". */
  terms?: Array<{ from: string; to: string }>;
  /** "short" keeps it to the minimum that unblocks them. */
  length?: "short" | "full";
  /** The learner's own projection, when there is one — so the explanation is
   *  written for this student's step rather than for the concept in general. */
  grounding?: TutorGrounding;
}

export async function llmExplain(input: ExplainInput): Promise<AiOutcome> {
  const c = getConcept(input.conceptId);
  if (!c) return unavailable("malformed", null, null);
  const terms = (input.terms ?? []).map((t) => `${t.from} → ${t.to}`).join(", ");
  const prompt = [
    `Concept: ${c.title} (${c.subject}).`,
    `Teaching note: ${c.lesson}`,
    // The same grounding the tutor gets: an explanation is far better when the
    // model knows which step this learner is on and what their record says
    // about it. Absent without a profile, and said so rather than invented.
    input.grounding ? decisionLine(input.grounding) : "",
    input.grounding?.measured.length
      ? `What their record says: ${input.grounding.measured.map((m) => `${m.label} ${m.correct}/${m.asked}`).join("; ")}`
      : "",
    input.question ? `The student asked: ${input.question}` : "The student did not say why they are stuck.",
    input.length === "short" ? "Keep it to about 80 words." : "Keep it under 180 words.",
    terms ? `Use the student's curriculum words: ${terms}` : "",
    `Write in this language: ${input.language}`,
  ].filter(Boolean).join("\n");
  return llmRequest(prompt, { system: EXPLAIN_SYSTEM, maxTokens: 500 });
}

// ── Task: mark written reasoning ────────────────────────────────────────────

export interface MarkInput {
  conceptId: string;
  prompt: string;
  correctAnswer: string;
  studentWork: string;
  language: string;
}

// Marking returns the same `AiOutcome`: feedback text, or the reason a model
// did not produce any. Marking never writes a mark into a learner's record —
// the caller decides what to do with the text, and nothing here can reach the
// ledger (see the header of lib/server/tutor.ts for the rule and its proof).

export async function llmMarkWork(input: MarkInput): Promise<AiOutcome> {
  const prompt = [
    `Concept: ${getConcept(input.conceptId)?.title ?? input.conceptId}`,
    `Question: ${input.prompt}`,
    `Correct answer: ${input.correctAnswer}`,
    `Student's written work: ${input.studentWork.slice(0, 800)}`,
    `Write the feedback in this language: ${input.language}`,
  ].join("\n");
  return llmRequest(prompt, { system: MARK_SYSTEM, maxTokens: 200 });
}

// ── Task: exam-style questions ──────────────────────────────────────────────

export interface GeneratedQuestion {
  conceptId: string;
  prompt: string;
  choices: string[];
  /** Index of the correct choice. */
  answer: number;
  explanation: string;
}

export interface QuestionRequest {
  conceptId: string;
  /** Short description of the qualification, e.g. "AQA GCSE Mathematics, Higher tier". */
  qualification: string;
  /** Difficulty target 0–1 for this question slot. */
  difficulty: number;
  /** Language the question text must be written in. */
  language: string;
  /** Mark value the question is worth, so the wording matches the depth. */
  marks: number;
  /** Prompts already in the paper, so the model does not repeat itself. */
  avoid?: string[];
}

function parseQuestions(raw: string): GeneratedQuestion[] {
  // Models sometimes wrap JSON in a fence even when told not to; strip it
  // rather than throwing the whole batch away.
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("[") >= 0 ? cleaned.indexOf("[") : cleaned.indexOf("{");
  if (start < 0) return [];
  const json = cleaned.slice(start, cleaned.lastIndexOf("]") >= 0 ? cleaned.lastIndexOf("]") + 1 : undefined);
  try {
    const parsed = JSON.parse(json) as unknown;
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.filter((q): q is GeneratedQuestion => {
      if (!q || typeof q !== "object") return false;
      const x = q as Record<string, unknown>;
      return typeof x.prompt === "string"
        && Array.isArray(x.choices)
        && (x.choices as unknown[]).length === 4
        && (x.choices as unknown[]).every((c) => typeof c === "string" && c.trim().length > 0)
        && typeof x.answer === "number"
        && Number.isInteger(x.answer)
        && x.answer >= 0 && x.answer < 4
        && typeof x.explanation === "string" && x.explanation.trim().length > 0;
    });
  } catch {
    return [];
  }
}

/**
 * Ask the model for a batch of exam-style questions. Every result is validated
 * against the same four-option contract the deterministic engine guarantees, so
 * a malformed answer can never reach a student — it is simply dropped and the
 * caller fills the slot from the engine instead.
 */
export async function llmExamQuestions(reqs: QuestionRequest[]): Promise<GeneratedQuestion[]> {
  if (!isLlmEnabled() || reqs.length === 0) return [];
  const first = reqs[0];
  const avoid = (first.avoid ?? []).slice(-12);
  const prompt = [
    `Qualification: ${first.qualification}`,
    `Write ${reqs.length} questions, one for each of these concepts, in order:`,
    ...reqs.map((r, i) => `${i + 1}. conceptId "${r.conceptId}" — ${getConcept(r.conceptId)?.title ?? r.conceptId}; difficulty ${r.difficulty.toFixed(2)} of 1; worth ${r.marks} mark(s). ${getConcept(r.conceptId)?.lesson ?? ""}`),
    `Write all question text in this language: ${first.language}`,
    avoid.length ? `Do not reuse these questions: ${avoid.join(" || ")}` : "",
    `Reply with a JSON array of ${reqs.length} objects, each exactly:`,
    `{"conceptId":"…","prompt":"…","choices":["…","…","…","…"],"answer":0,"explanation":"…"}`,
  ].filter(Boolean).join("\n");

  const raw = await llmComplete(prompt, { system: QUESTION_SYSTEM, maxTokens: 300 * reqs.length + 400 });
  if (!raw) return [];
  const parsed = parseQuestions(raw);
  // A returned question must belong to a concept we asked for: an off-syllabus
  // or mislabelled item would corrupt the learner model it gets recorded into.
  const wanted = new Set(reqs.map((r) => r.conceptId));
  return parsed.filter((q) => wanted.has(q.conceptId));
}

/** Convert a validated AI question into the engine's Question shape, so the
 *  same serve/mark paths handle it. */
export function asQuestion(gen: GeneratedQuestion, conceptId: string, difficulty: number): Question {
  return {
    id: `ai_${conceptId}_${Math.random().toString(36).slice(2, 8)}`,
    conceptId,
    difficulty,
    prompt: gen.prompt,
    choices: gen.choices,
    answer: gen.answer,
    explanation: gen.explanation,
    misconceptionTags: [],
  };
}
