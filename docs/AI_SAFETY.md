# AI safety

OpenMind's AI layer is optional, server-side, and **cannot write to the record**.
This document describes how it is wired, what it may and may not do, and how a
provider outage is a normal state rather than an error page.

---

## 1. The gateway

There is exactly one path from a learner to a model, and it runs on the server:

```text
learner
  ↓
app route (/api/ai, /api/tutor, rooms)
  ↓
policy + grounding        lib/server/tutor.ts, lib/tutor-context.ts
  ↓
provider                  lib/llm.ts
  ↓
output validation
  ↓
learner
```

The UI never holds a provider key. The browser calls OpenMind; OpenMind calls the
model.

## 2. What the gateway decides

| Decision | Where |
|---|---|
| which provider (or none) | `lib/llm.ts#aiStatus`, precedence: your endpoint → Gemini → OpenAI → Groq → OpenRouter → offline |
| whether an endpoint is configured | `lib/env.ts` (a half-set endpoint is a reported problem) |
| which model | `OPENMIND_AI_MODEL`, or the provider default |
| what learner context may be sent | `lib/server/tutor.ts#tutorGroundingFor` — the same decision, reasoning, citations and projection version the app shows the learner, read from their own projection, never from the request |
| token limits / length | request shape ("short" / "full") |
| timeouts | `OPENMIND_AI_TIMEOUT_MS` (default 12000) |
| fallback | the deterministic offline tutor |
| safety handling | provider guardrails + **PROPOSED** an explicit policy layer (§5) |

## 3. The invariant: a model can never write

> There is no code path from an AI response to the evidence ledger or to a
> mastery field.

The only way into the record is **append → confirm → replay/adopt**, reached from
the grading routes *after* the server has marked the answer against the engine's
own key. An explanation is prose shown to the learner; it is not evidence.
`npm run verify` asserts this ("AI explains, never records").

## 4. Failure is a normal production state

Four failure modes, all supported outcomes:

| Failure | Result |
|---|---|
| no key for the request | offline tutor |
| provider error | offline tutor |
| timeout | offline tutor |
| unparseable body | offline tutor |

The learner is told **which of the two answered**, via disclosure lines that
exist in all 15 languages, so a fallback can never be labelled as a model's work.
The UI must never show "AI Tutor is thinking…" for a long time and then "something
went wrong": the timeout bounds the wait and the offline tutor answers
immediately after.

`/api/ai` reports the live status; `npm run smoke` checks it; `production-check`
records whether a model is configured.

## 5. Safety policy — **PROPOSED**

Automated safety is not implemented. The recommended layer, at the gateway:

```text
input policy   refuse and redirect on harmful or off-topic-and-unsafe asks
context policy never send more learner context than the task needs
output policy  scan the reply before it reaches the child
safe response  a fixed, calm template in the learner's language
audit event    record THAT the safety path triggered — not the conversation
```

Until it exists, safety rests on provider guardrails, the no-write invariant, and
human review (`SAFEGUARDING.md`). A deployment enabling cloud AI should say so in
its own safeguarding policy.

## 6. Audit without hoarding

- The AI result **cache** stores generated *content*, keyed by concept, language,
  board and length — not a child's conversation.
- **PROPOSED** — an audit-safe AI event (surface, provider, outcome, latency,
  fallback reason, deployment id) with no personal data, so "why did the tutor
  fail?" is answerable without keeping a child's chat forever.
