// Question-stem verbs (§12, P0-C): the ~50 maths generators share a tiny set
// of command-verb stems ("Work out…", "Solve…", "Simplify…"). Storing the
// body's numbers verbatim and localizing only the stem keeps the wedge's
// questions readable in every interface language without touching 126
// generators. Language wraps at serve time; grading is unaffected because
// answers are indices, never text.

import { translator } from "./i18n";

/** Extract the leading English command stem of a maths prompt, if it is one
 *  the dictionary covers. Returns null for narrative/science prompts. */
export function stemKeyOf(prompt: string): { key: string; len: number } | null {
  const p = prompt.trim();
  const hit = (re: RegExp, key: string) => {
    const m = p.match(re);
    return m ? { key, len: m[0].length } : null;
  };
  return (
    hit(/^Work out /, "q.workOut") ?? hit(/^Solve /, "q.solve") ??
    hit(/^Simplify /, "q.simplify") ?? hit(/^Expand /, "q.expand") ??
    hit(/^Evaluate /, "q.evaluate") ?? hit(/^Convert /, "q.convert") ??
    hit(/^Complete /, "q.complete") ?? hit(/^Find /, "q.find") ??
    hit(/^Round /, "q.round") ?? hit(/^Add /, "q.add") ??
    hit(/^Write /, "q.write") ?? hit(/^Calculate /, "q.calculate") ??
    hit(/^Share /, "q.share") ?? hit(/^Balance /, "q.balance")
  );
}

/** Replace the leading English stem with its translation, when covered.
 *  Narrative prompts (which begin with a sentence, not a command) return
 *  unchanged — those are part of the teaching-content pass, not this one. */
export function localizeStem(prompt: string, lang: string): string {
  const hit = stemKeyOf(prompt);
  if (!hit) return prompt;
  const rest = prompt.slice(hit.len);
  return `${translator(lang)(hit.key)}${rest}`;
}

// ── Genuine transfer (audit P0-D) ───────────────────────────────────────────
// Re-framing a question onto a SECOND SURFACE is a transfer decision, and it
// has exactly one owner: lib/transfer.ts. A set of wrapper templates lived here
// — deterministic families that prefixed or narrated a stem — and it was never
// called by anything: it changed the framing while keeping the original choices,
// so "work backwards — which choice gives …?" still asked for the same answer
// from the same options. That is a preamble, not a second surface, and two
// implementations of one idea is how the gate and the serve drift apart. It was
// deleted; the surface families this file used to name live in lib/transfer.ts,
// built from real generated questions with a provably single correct option.
