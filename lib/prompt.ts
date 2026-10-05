// ─────────────────────────────────────────────────────────────────────────────
// PROMPT FORMATTING — a question asks to be read as the thing it IS.
//
// Questions are authored as one string, and about a quarter of the bank mixes a
// real code block (Python, mostly) into ordinary prose. Rendered as one
// paragraph that mix reads wrong: `def total(items):` and its four-space body
// collapse into run-on prose, and the indentation — the whole point of the
// example — is the first thing to go.
//
// So a prompt is split into segments, each drawn with the type it deserves:
// prose in the question's own voice, code in a monospace block.
//
// The split is deliberately conservative. A false "code" sets a sentence like a
// program; a missed one is only the status quo. Code is recognised by the
// signals that are unambiguous in this bank:
//   · an indented line (a Python body or continuation);
//   · a line OPENING with a statement keyword (`def`, `for`, `if`, `print`, …);
//   · a block that OPENS with an assignment and holds two or more of them. The
//     opening position is what keeps a maths question that merely contains two
//     equations (`y = 4x − 4` / `y = x² + 8x − 1`, under a prose heading) out of
//     the code path — its first line is a sentence, not an assignment.
//
// The result is lossless: the segments, read in order with their `sep`, are the
// original string, character for character. A formatter a learner's question
// passes through must not quietly edit it, and the suite asserts exactly that.
//
// Pure and dependency-free: the React surfaces and the static build both read
// it, and a formatter two bundles import must not drag a graph behind it.
// ─────────────────────────────────────────────────────────────────────────────

export type PromptSegment = {
  kind: "prose" | "code";
  text: string;
  /** The whitespace that preceded this segment in the authored string. The
   *  renderer ignores it (each kind is a block); the round-trip needs it. */
  sep: string;
};

/** A line that OPENS a statement in the languages this bank uses. */
const CODE_KEYWORD =
  /^\s*(?:def|class|for|while|if|elif|else|return|print|import|from|try|except|finally|with|lambda|yield|let|const|var|function)\b/;
/** The first character of the line is whitespace — a body or a continuation. */
const INDENTED = /^[ \t]+\S/;
/** `name = …` or `name[subscript] = …`, the shape an assignment line takes. */
const ASSIGN = /^\s*[A-Za-z_]\w*(?:\[[^\]]*\])?\s*=/;

/** One line that reads as a question rather than a statement: it opens with a
 *  capital and closes with sentence punctuation. A code line rarely does both,
 *  and the opening capital alone is what keeps `print(fruits[3]) — what prints?`
 *  in the program it belongs to. */
function looksLikeSentence(line: string): boolean {
  const t = line.trim();
  return /^[A-Z]/.test(t) && /[.?！？]\s*$/.test(t);
}

/** Is this whole paragraph (a run between blank lines) code? */
function blockIsCode(lines: readonly string[]): boolean {
  const first = lines[0] ?? "";
  if (lines.some((l) => INDENTED.test(l) || CODE_KEYWORD.test(l))) return true;
  return ASSIGN.test(first) && lines.filter((l) => ASSIGN.test(l)).length >= 2;
}

/**
 * Split one authored prompt into alternating prose and code segments, in the
 * order they were written.
 *
 * Blank lines separate paragraphs, and a paragraph is code or prose as a whole.
 * A code paragraph with a trailing plain question (`What is total?`) gives that
 * line back to prose, because the question is not part of the program.
 */
export function splitPrompt(prompt: string): PromptSegment[] {
  const segments: PromptSegment[] = [];
  const push = (kind: PromptSegment["kind"], text: string, sep: string): void => {
    if (!text) return;
    const last = segments[segments.length - 1];
    // Neighbours of the same kind merge; the separator goes back in between, so
    // nothing is lost and no empty block is drawn.
    if (last && last.kind === kind) last.text += `${sep}${text}`;
    else segments.push({ kind, text, sep });
  };

  // `split` with a capturing group keeps the separators, which is what makes the
  // round-trip exact rather than approximately exact.
  const parts = prompt.split(/(\n{2,})/);
  for (let i = 0; i < parts.length; i += 2) {
    const block = parts[i];
    const sep = i === 0 ? "" : parts[i - 1];
    const lines = block.split("\n");
    if (!blockIsCode(lines)) {
      push("prose", block, sep);
      continue;
    }
    // Peel any trailing sentence back off the program it was written after.
    let cut = lines.length;
    while (cut > 1 && looksLikeSentence(lines[cut - 1])) cut -= 1;
    push("code", lines.slice(0, cut).join("\n"), sep);
    if (cut < lines.length) push("prose", lines.slice(cut).join("\n"), "\n");
  }
  return segments;
}
