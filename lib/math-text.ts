// ─────────────────────────────────────────────────────────────────────────────
// MATHS ON THE PAGE, NOT MATHS ON A KEYBOARD.
//
// The bank is authored as plain strings, and a plain string can only say `^` for
// a power, `*` for a product, `5/6` for a fraction and `sqrt(18)` for a root. A
// learner opening a question then reads the notation an AUTHOR TYPES rather than
// the notation a textbook PRINTS: "Work out 5/6 − 3/10" instead of two stacked
// fractions, "10^4" instead of ten to the fourth, "x_{n+1}" with a literal
// underscore in it. That is the report "some still use / or * or ^ instead of
// actually showing them", and it is not one generator's bug: 61 of the 135
// concepts printed raw notation somewhere (measured over 60 draws each).
//
// WHY A LAYER AND NOT AN AUTHORING PASS. Re-authoring 61 generators in
// typography would fix the strings that exist today and nothing else: the next
// family an author writes writes `3/4` again, because that is what a keyboard
// has. So the conversion happens WHERE THE STRING IS DRAWN, once, and every
// surface that shows a question — prompt, option, explanation, the static twin —
// goes through it. The generator keeps emitting the ASCII it can emit; the page
// prints the maths.
//
// WHAT THIS IS NOT. Not a LaTeX renderer and not a maths engine. It recognises
// the handful of shapes this bank actually writes, and it refuses the ambiguous
// ones rather than guessing:
//   · a NUMERIC fraction (`5/6`, `-2/17`, `(x + 1)/2`) becomes a stacked
//     fraction; `dy/dx`, `mol/dm³` and `m/s` stay linear, because a unit and a
//     derivative are read inline and stacking them is not an improvement;
//   · `10.0.4.0/30` is a CIDR block and `24/10/2026` is a date — the guards
//     below are what stop the formatter from turning either into a fraction,
//     and they were written after MEASURING the bank, not imagined;
//   · a code block is never touched (that is lib/prompt.ts's job — a Python
//     `n * fact(n - 1)` must stay exactly what it is);
//   · a MATRIX (`[[5, 1], [0, 1]]`) is drawn as a bracketed grid. It was the
//     one shape this file still printed as the author typed it, so a matrices
//     question read as a list of numbers between square brackets — and the
//     learner had to reconstruct the rows themselves. A 2×2 product is exactly
//     the item where the rows are the question. The reader refuses anything that
//     is not a rectangle of plain values (a single row, rows of different
//     lengths, any bracketed text), so an array in prose cannot be drawn as a
//     matrix by accident.
//
// LOSSLESS. The spans carry the authored characters, not a rewritten copy: read
// them back through `mathNotation` and you get the input again, character for
// character, with exactly two allowances — an atom's braces (`x_{n+1}` draws as
// x with a subscript, and comes back as `^{…}` if the atom is longer than one
// character) and the whitespace around a fraction's slash, which a stacked
// fraction has no slash to space. A formatter a learner's question passes
// through must not quietly edit it, and the suite asserts this on every
// generator × seed: for 8,100 draws, nothing is dropped.
//
// Pure and dependency-free: the React surfaces and the static build both read it.
// ─────────────────────────────────────────────────────────────────────────────

/** One run of a question's text, and how it is DRAWN. A `frac` and a `radical`
 *  carry their own text so the renderer can recurse (`5/x_n` has a subscript in
 *  its denominator); everything else carries what it printed. */
export type MathSpan =
  | { kind: "text"; text: string }
  /** `delim` is how the exponent was WRITTEN, so `mathNotation` can put the
   *  same brackets back: `x^{n+1}` and `x^(n−r)` are different strings that draw
   *  the same way. */
  | { kind: "sup"; text: string; delim?: "{" | "(" }
  | { kind: "sub"; text: string; delim?: "{" }
  | { kind: "frac"; numerator: string; denominator: string }
  | { kind: "radical"; text: string }
  /** A `*` standing between two operands: drawn as ×. */
  | { kind: "times" }
  /** A `~` immediately before a number: drawn as ≈. */
  | { kind: "approx" }
  /** A matrix, `[[5, 1], [0, 1]]`, drawn as a bracketed grid. `raw` is the
   *  authored slice, character for character: the drawing is rows and columns,
   *  but the round-trip has to give the string back, and the accessible name is
   *  the authored form — a reader who cannot see the brackets needs to know
   *  where a row ends, and "5, 1, 0, 1" does not say it. */
  | { kind: "matrix"; rows: string[][]; raw: string };

/** A character that can sit beside an operator as an operand. Deliberately
 *  narrow: `*` between `)` and `3` is multiplication, `*` between two spaces in
 *  emphasis-markup-ish prose is not. */
function isOperand(ch: string): boolean {
  return /[0-9A-Za-z)\]²³⁴⁵]/.test(ch);
}

/** Read a `{…}` group starting at `i` (which must be `{`). Returns the inside and
 *  the index just past the closing brace, or null when it is never closed. */
function readBraced(s: string, i: number): { text: string; end: number } | null {
  if (s[i] !== "{") return null;
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === "{") depth += 1;
    else if (s[j] === "}") {
      depth -= 1;
      if (depth === 0) return { text: s.slice(i + 1, j), end: j + 1 };
    }
  }
  return null;
}

/** The index of the `)` that closes the `(` at `i`, or -1. */
function matchParen(s: string, i: number): number {
  if (s[i] !== "(") return -1;
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === "(") depth += 1;
    else if (s[j] === ")") {
      depth -= 1;
      if (depth === 0) return j;
    }
  }
  return -1;
}

/** The last non-space character strictly before `i`, or "". */
function prevVisible(s: string, i: number): string {
  let j = i;
  while (j >= 0 && (s[j] === " " || s[j] === "\t")) j -= 1;
  return j >= 0 ? s[j] : "";
}

/** The first non-space character strictly after `i`, or "". */
function nextVisible(s: string, i: number): string {
  let j = i;
  while (j < s.length && (s[j] === " " || s[j] === "\t")) j += 1;
  return j < s.length ? s[j] : "";
}

/** The payload of a `^` / `_`: the braced group, or the shortest token that reads
 *  as one. `^` takes a sign (`10^−2`); `_` takes a single character and only
 *  when it stands alone, so an identifier like `data_dir` is left as an
 *  identifier rather than becoming `data` + subscript(ir). */
function readAtom(s: string, i: number, kind: "^" | "_"): { text: string; end: number; delim?: "{" | "(" } | null {
  const braced = readBraced(s, i);
  if (braced) return { ...braced, delim: "{" };
  if (kind === "^" && s[i] === "(") {
    const close = matchParen(s, i);
    if (close > i + 1) return { text: s.slice(i + 1, close), end: close + 1, delim: "(" };
  }
  if (kind === "^") {
    let j = i;
    if (s[j] === "−" || s[j] === "-" || s[j] === "+") j += 1;
    if (/[0-9]/.test(s[j] ?? "")) {
      while (/[0-9]/.test(s[j] ?? "")) j += 1;
      return j > i ? { text: s.slice(i, j), end: j } : null;
    }
    if (/[A-Za-z]/.test(s[j] ?? "")) return { text: s[j], end: j + 1 };
    return null;
  }
  if (!/[A-Za-z0-9]/.test(s[i] ?? "")) return null;
  // A single character, and only at a boundary: `x_n` is a subscript, `x_ns` is
  // not something this bank writes and is safer left alone.
  if (/[A-Za-z0-9]/.test(s[i + 1] ?? "")) return null;
  return { text: s[i], end: i + 1 };
}

/** `12`, `1.5` — a bare number. */
function readNumber(s: string, i: number): { text: string; end: number } | null {
  let j = i;
  if (!/[0-9]/.test(s[j] ?? "")) return null;
  while (/[0-9]/.test(s[j] ?? "")) j += 1;
  if (s[j] === "." && /[0-9]/.test(s[j + 1] ?? "")) {
    j += 1;
    while (/[0-9]/.test(s[j] ?? "")) j += 1;
  }
  return { text: s.slice(i, j), end: j };
}

/** A matrix cell this formatter will draw: a plain value with an optional sign
 *  and optional decimal or fraction part. Deliberately narrow — a cell holding a
 *  word, an operator or another bracket is not a matrix this bank writes, and
 *  drawing it as one would be a guess about what the author meant. */
const MATRIX_CELL = /^[−-]?[0-9]+(?:\.[0-9]+)?(?:\/[0-9]+)?$/;

/** Skip the spaces and tabs INSIDE a matrix (`[[5, 1], [0, 1]]` is one), so the
 *  authored padding reaches the drawing as padding rather than as an error. */
function skipInnerSpace(s: string, i: number): number {
  let j = i;
  while (s[j] === " " || s[j] === "\t") j += 1;
  return j;
}

/**
 * Read a matrix STARTING AT `i` (which must be the first `[` of `[[`), or null.
 *
 * Every refusal here is a shape the bank does not write and this formatter
 * therefore must not invent:
 *   · a single row (`[1, 2]`) is a vector or a plain list, not a matrix;
 *   · rows of different lengths cannot be set as a grid without saying something
 *     false about the columns;
 *   · a cell that is not a plain value (a word, a bracket, an expression) is
 *     left exactly as the author wrote it.
 */
function readMatrix(s: string, i: number): { rows: string[][]; end: number } | null {
  if (s[i] !== "[" || s[i + 1] !== "[") return null;
  const rows: string[][] = [];
  let j = i + 1;
  for (;;) {
    if (s[j] !== "[") return null;
    j = skipInnerSpace(s, j + 1);
    const cells: string[] = [];
    for (;;) {
      const start = j;
      while (j < s.length && s[j] !== "," && s[j] !== "]" && s[j] !== "[") j += 1;
      const cell = s.slice(start, j).trim();
      if (!MATRIX_CELL.test(cell)) return null;
      cells.push(cell);
      j = skipInnerSpace(s, j);
      if (s[j] === ",") {
        j = skipInnerSpace(s, j + 1);
        continue;
      }
      if (s[j] === "]") {
        j += 1;
        break;
      }
      return null;
    }
    // A one-cell row is not a matrix, and neither is a row that ended empty.
    if (cells.length < 2) return null;
    rows.push(cells);
    j = skipInnerSpace(s, j);
    if (s[j] === ",") {
      j = skipInnerSpace(s, j + 1);
      continue;
    }
    if (s[j] === "]") {
      j += 1;
      break;
    }
    return null;
  }
  if (rows.length < 2) return null;
  if (rows.some((row) => row.length !== rows[0].length)) return null;
  return { rows, end: j };
}

/** A denominator that is a variable, possibly subscripted (`x_n`, `x_{n+1}`):
 *  `5/x_n` is a fraction, `mg/100 ml` is a unit rate and stays linear. */
function readVariable(s: string, i: number): { text: string; end: number } | null {
  const m = /^[A-Za-z][A-Za-z0-9]*(?:_(?:\{[^{}]*\}|[A-Za-z0-9]))?/.exec(s.slice(i));
  return m ? { text: m[0], end: i + m[0].length } : null;
}

/** Absorb a power or index that belongs to the side just read: in `1/2^3` the
 *  cube is the DENOMINATOR's, and drawing the fraction first and the exponent
 *  after it would say `(1/2)³` — a different number. Kept as TEXT so the
 *  renderer recurses and the denominator shows its own superscript. */
function withExponent(s: string, side: { text: string; end: number }): { text: string; end: number } {
  const ch = s[side.end];
  if (ch !== "^" && ch !== "_") return side;
  const atom = readAtom(s, side.end + 1, ch);
  if (!atom) return side;
  const written = atom.delim === "{" ? `{${atom.text}}` : atom.text;
  return { text: `${side.text}${ch}${written}`, end: atom.end };
}

/** One side of a fraction: a number, a parenthesised expression, or — see the
 *  two callers — a lone variable on TOP (`r/100`) or a word on the BOTTOM
 *  (`5/x_n`). */
function readFractionSide(s: string, i: number, mode: "numerator" | "denominator"): { text: string; end: number } | null {
  const num = readNumber(s, i);
  if (num) return withExponent(s, num);
  if (s[i] === "(") {
    const close = matchParen(s, i);
    if (close > i + 1) return withExponent(s, { text: s.slice(i, close + 1), end: close + 1 });
  }
  if (mode === "numerator") {
    // A SINGLE variable may sit on top: `r/100` is a fraction. A word may not,
    // which is what leaves `dy/dx`, `mol/dm³` and `was/were` inline where they
    // belong.
    if (/[A-Za-z]/.test(s[i] ?? "") && !/[A-Za-z]/.test(s[i - 1] ?? "") && !/[A-Za-z0-9]/.test(s[i + 1] ?? "")) {
      return { text: s[i], end: i + 1 };
    }
    return null;
  }
  const variable = readVariable(s, i);
  return variable ? withExponent(s, variable) : null;
}

/**
 * Read a fraction STARTING AT `i`, or null.
 *
 * The guards are the whole difficulty, and each one was measured against the
 * bank rather than assumed:
 *   · the numerator may not be preceded by a letter, digit, dot or slash, which
 *     is what keeps `10.0.4.0/30` and the second half of `24/10/2026` intact;
 *   · a numeric denominator may not be followed by a letter, digit, dot or by
 *     `/digit` — `1,000,000/2` is a fraction, `24/10/2026` is a date;
 *   · the numerator must be a number or a bracketed expression, so `dy/dx`,
 *     `mol/dm³` and `was/were` are never stacked.
 */
function readFraction(s: string, i: number): { numerator: string; denominator: string; end: number } | null {
  // A leading sign belongs to the numerator: `-2/17` is one fraction, and the
  // sign itself may sit at a word boundary.
  let start = i;
  if ((s[i] === "-" || s[i] === "−") && (i === 0 || !/[0-9A-Za-z._/]/.test(s[i - 1])) && /[0-9(]/.test(s[i + 1] ?? "")) {
    start = i + 1;
  } else if (i > 0 && /[0-9A-Za-z._/]/.test(s[i - 1])) {
    return null;
  }
  const num = readFractionSide(s, start, "numerator");
  if (!num) return null;
  let j = num.end;
  while (s[j] === " ") j += 1;
  if (s[j] !== "/") return null;
  j += 1;
  while (s[j] === " ") j += 1;
  const den = readFractionSide(s, j, "denominator");
  if (!den) return null;
  if (/^[0-9]/.test(den.text)) {
    const after = s[den.end] ?? "";
    // A digit glued on is not this fraction (`4.0/30` in a longer number), and
    // neither is a decimal point that continues into digits. A full stop that
    // ENDS the sentence is the ordinary case and must pass — "Work out 5/6 −
    // 3/10." was read as one fraction and one raw slash until this was
    // measured. A LETTER may follow, because that is how a coefficient is
    // written: `3/2x^2` is three-halves x squared.
    if (/[0-9]/.test(after)) return null;
    if (after === "." && /[0-9]/.test(s[den.end + 1] ?? "")) return null;
    if (after === "/" && /[0-9]/.test(s[den.end + 1] ?? "")) return null;
  }
  return { numerator: s.slice(i, num.end), denominator: den.text, end: den.end };
}

/**
 * Split one authored string into what it PRINTS.
 *
 * Every character of `input` appears in exactly one span (after `times` and
 * `approx`, whose authored `*` and `~` are the only characters replaced), so the
 * caller can trust that nothing was dropped — see `mathNotation`.
 */
export function mathSpans(input: string): MathSpan[] {
  const s = String(input ?? "");
  const spans: MathSpan[] = [];
  let text = "";
  const flush = (): void => {
    if (text) {
      spans.push({ kind: "text", text });
      text = "";
    }
  };

  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    const before = i === 0 ? "" : s[i - 1];

    // `sqrt(…)` → a radical. Only at a word boundary, so `sqrt` inside an
    // identifier is left alone.
    if (ch === "s" && s.startsWith("sqrt(", i) && !/[A-Za-z0-9_]/.test(before)) {
      const close = matchParen(s, i + 4);
      if (close > i + 5) {
        flush();
        spans.push({ kind: "radical", text: s.slice(i + 5, close) });
        i = close + 1;
        continue;
      }
    }

    // `[[…], […]]` → a bracketed grid. Before the fraction branch, because a
    // cell may itself be written `1/2`: the matrix is the outer shape and the
    // cell is drawn by the same formatter the row is.
    if (ch === "[") {
      const matrix = readMatrix(s, i);
      if (matrix) {
        flush();
        spans.push({ kind: "matrix", rows: matrix.rows, raw: s.slice(i, matrix.end) });
        i = matrix.end;
        continue;
      }
    }

    if (ch === "^" || ch === "_") {
      const atom = readAtom(s, i + 1, ch);
      if (atom) {
        flush();
        spans.push(
          ch === "^"
            ? { kind: "sup", text: atom.text, delim: atom.delim }
            : { kind: "sub", text: atom.text, delim: atom.delim === "{" ? "{" : undefined },
        );
        i = atom.end;
        continue;
      }
    }

    if (ch === "*") {
      // Spaces around the sign are the normal way to write it, so the OPERANDS
      // are the nearest visible characters, not the immediate neighbours.
      const prev = prevVisible(s, i - 1);
      const next = nextVisible(s, i + 1);
      if (prev && next && isOperand(prev) && isOperand(next)) {
        flush();
        spans.push({ kind: "times" });
        i += 1;
        continue;
      }
    }

    if (ch === "~" && /[0-9(]/.test(s[i + 1] ?? "") && !/[0-9A-Za-z]/.test(before)) {
      flush();
      spans.push({ kind: "approx" });
      i += 1;
      continue;
    }

    if (ch === "/" || /[0-9(\-−]/.test(ch)) {
      const frac = readFraction(s, i);
      if (frac) {
        flush();
        spans.push({ kind: "frac", numerator: frac.numerator, denominator: frac.denominator });
        i = frac.end;
        continue;
      }
    }

    text += ch;
    i += 1;
  }
  flush();
  return spans;
}

/** The authored notation back out of the spans, for the round-trip assertion.
 *  `times` and `approx` were the only characters actually replaced, so they come
 *  back as the `*` and `~` they were written as. */
export function mathNotation(spans: readonly MathSpan[]): string {
  return spans
    .map((span) => {
      switch (span.kind) {
        case "text":
          return span.text;
        case "sup":
          if (span.delim === "(") return `^(${span.text})`;
          return `^${/^[A-Za-z0-9]$/.test(span.text) ? span.text : `{${span.text}}`}`;
        case "sub":
          return `_${/^[A-Za-z0-9]$/.test(span.text) ? span.text : `{${span.text}}`}`;
        case "frac":
          return `${span.numerator}/${span.denominator}`;
        case "radical":
          return `sqrt(${span.text})`;
        case "times":
          return "*";
        case "approx":
          return "~";
        case "matrix":
          // The authored slice, not a rebuilt one: spacing inside the brackets
          // is the author's, and the round-trip is asserted on every draw.
          return span.raw;
      }
    })
    .join("");
}
