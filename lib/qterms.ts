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
// Difficulty escalation is not transfer. A learner who solves 3x+2=11 has not
// proven anything about recognising the same idea in a taxi fare. The transfer
// stage therefore re-serves the concept's idea through a DIFFERENT surface:
// one of a small set of deterministic wrapper templates that invert, narrate
// or re-represent the same generator's question.

/** The surface families a transfer claim may be made on. A transfer question
 *  must carry a different family from the practice surface ("direct"). */
export type TransferSurface = "direct" | "reverse" | "real_world" | "compare" | "justify";

/** Per-surface stem keys (t.* / q.* namespaces, English fallback is fine). */
const TRANSFER_STEMS: Record<Exclude<TransferSurface, "direct">, { lead: string; tail?: string }> = {
  // Inverse reasoning: given the outcome, find the input.
  reverse: { lead: "tr.reverse" },
  // Narrative wrapper: the same operation inside a real-world situation.
  real_world: { lead: "tr.realWorld", tail: "tr.realWorldQ" },
  // Comparison: which of two situations matches / differs, and why.
  compare: { lead: "tr.compare" },
  // Justification: the learner picks the reasoning that justifies the result.
  justify: { lead: "tr.justify" },
};

/** Deterministic surface choice per seed — different learners (and retests)
 *  meet different surfaces, and a surface never repeats twice in a row. */
export function transferSurfaceFor(seed: string, usedSurfaces: string[] = []): TransferSurface {
  const families: TransferSurface[] = ["reverse", "real_world", "compare", "justify"];
  // Hash the seed to pick a family, skipping any family used most recently.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const last = usedSurfaces[usedSurfaces.length - 1];
  const ordered = [families[h % 4], families[(h >> 2) % 4], families[(h >> 4) % 4], families[(h >> 6) % 4]];
  return ordered.find((f) => f !== last) ?? "reverse";
}

/** Wrap a direct question into a transfer surface. The underlying skill, the
 *  choices and the answer index are untouched — only the framing changes, so
 *  grading stays identical and the evidence measures recognition, not luck.
 *  Returns the prompt unchanged when the language lacks the stem (the
 *  translator falls back to English via the i18n layer). */
export function applyTransferSurface(
  prompt: string,
  surface: TransferSurface,
  lang: string,
  detail: { topic: string; solution: string; distractor: string; final: string },
): string {
  const t = translator(lang);
  const body = prompt.replace(/^(Work out|Solve|Simplify|Expand|Evaluate|Convert|Complete|Find|Round|Add|Write|Calculate|Share|Balance)\s+/, "");
  switch (surface) {
    case "reverse":
      // "After working it out the answer was X. Which input gives that?" —
      // expressed over the same choices, so the learner reasons backwards.
      return `${t("tr.reverseLead")} ${solutionOf(detail.solution)} ${t("tr.reverseTail")} ${body}?`;
    case "real_world":
      return `${t("tr.rwLead")} ${detail.topic}. ${body} ${t("tr.rwTail")}`;
    case "compare":
      return `${t("tr.cmpLead")} ${detail.topic}: ${detail.distractor} — ${detail.solution}. ${t("tr.cmpTail")} ${body}?`;
    case "justify":
      return `${t("tr.justLead")} ${detail.final}. ${t("tr.justTail")} ${body}?`;
    default:
      return prompt;
  }
}

function solutionOf(solution: string): string {
  return solution;
}
