// ─────────────────────────────────────────────────────────────────────────────
// ALGEBRAIC EQUIVALENCE, IN ONE POLYNOMIAL VARIABLE.
//
// An expression question cannot be marked by comparing text: `2(x + 3)` and
// `2x + 6` are the same answer, and `x + 6` is not. This module parses the small
// algebraic language the bank's expression items actually use — constants, one
// variable, + − × ^ and brackets, with implicit multiplication (`2x`,
// `3(x + 1)`) — into polynomial coefficients, and compares the coefficients.
//
// THE LIMIT IS DELIBERATE AND STATED: only polynomials in one variable are
// recognised. Division by a variable, roots, trigonometric functions and
// equations are refused (null), so a question that needs them must not be
// authored as an `algebra` part until a marker that understands them exists.
// Refusing is the honest answer; guessing an equivalence is not.
// ─────────────────────────────────────────────────────────────────────────────

export type Polynomial = number[]; // lowest power first

const EPS = 1e-9;

/** Normalise the notation a learner can type without changing its mathematics. */
export function normaliseAlgebra(raw: string): string {
  return String(raw ?? "")
    .replace(/[−–—]/g, "-")
    .replace(/[×·∙]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[²³⁴⁵⁶⁷⁸⁹]/g, (d) => `^${"²³⁴⁵⁶⁷⁸⁹".indexOf(d) + 2}`)
    .replace(/⁰/g, "^0")
    .replace(/\s+/g, "")
    .trim();
}

interface Token {
  kind: "num" | "var" | "op" | "lparen" | "rparen";
  text: string;
}

function tokenize(s: string): Token[] | null {
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " ") { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!m) return null;
      out.push({ kind: "num", text: m[0] });
      i += m[0].length;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      out.push({ kind: "var", text: c });
      i++;
      continue;
    }
    if ("+-*^/".includes(c)) { out.push({ kind: "op", text: c }); i++; continue; }
    if (c === "(") { out.push({ kind: "lparen", text: c }); i++; continue; }
    if (c === ")") { out.push({ kind: "rparen", text: c }); i++; continue; }
    return null;
  }
  return out;
}

function trimPoly(p: Polynomial): Polynomial {
  const out = [...p];
  while (out.length > 1 && Math.abs(out[out.length - 1]) < EPS) out.pop();
  return out;
}

function add(a: Polynomial, b: Polynomial, sign = 1): Polynomial {
  const out = Array.from({ length: Math.max(a.length, b.length) }, () => 0);
  for (let i = 0; i < out.length; i++) out[i] = (a[i] ?? 0) + sign * (b[i] ?? 0);
  return trimPoly(out);
}

function multiply(a: Polynomial, b: Polynomial): Polynomial {
  if (a.length * b.length > 400) return [NaN];
  const out = Array.from({ length: a.length + b.length - 1 }, () => 0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  }
  return trimPoly(out);
}

function power(a: Polynomial, n: number): Polynomial | null {
  if (!Number.isInteger(n) || n < 0 || n > 20) return null;
  let out: Polynomial = [1];
  for (let i = 0; i < n; i++) out = multiply(out, a);
  return out.some((x) => !Number.isFinite(x)) ? null : out;
}

/** Parse one expression to coefficients, or null when it is outside the language. */
export function parsePolynomial(raw: string, variable = "x"): Polynomial | null {
  const tokens = tokenize(normaliseAlgebra(raw));
  if (!tokens || tokens.length === 0) return null;
  if (!/^[a-zA-Z]$/.test(variable)) return null;

  let at = 0;
  const peek = () => tokens[at];
  const startsFactor = (t: Token | undefined) =>
    !!t && (t.kind === "num" || t.kind === "var" || t.kind === "lparen");

  function primary(): Polynomial | null {
    const t = peek();
    if (!t) return null;
    if (t.kind === "num") {
      at++;
      const n = Number(t.text);
      return Number.isFinite(n) ? [n] : null;
    }
    if (t.kind === "var") {
      at++;
      if (t.text !== variable) return null;
      return [0, 1];
    }
    if (t.kind === "lparen") {
      at++;
      const inner = expression();
      if (!inner || peek()?.kind !== "rparen") return null;
      at++;
      return inner;
    }
    return null;
  }

  function powerExpr(): Polynomial | null {
    let base = primary();
    if (!base) return null;
    if (peek()?.kind === "op" && peek().text === "^") {
      at++;
      const t = peek();
      if (!t || t.kind !== "num" || !/^\d+$/.test(t.text)) return null;
      at++;
      base = power(base, Number(t.text));
      if (!base) return null;
    }
    return base;
  }

  function unary(): Polynomial | null {
    if (peek()?.kind === "op" && (peek().text === "+" || peek().text === "-")) {
      const sign = peek().text === "-" ? -1 : 1;
      at++;
      const v = unary();
      return v ? v.map((n) => sign * n) : null;
    }
    return powerExpr();
  }

  function term(): Polynomial | null {
    let left = unary();
    if (!left) return null;
    for (;;) {
      const t = peek();
      if (!t) break;
      if (t.kind === "op" && t.text === "*") {
        at++;
        const right = unary();
        if (!right) return null;
        left = multiply(left, right);
        continue;
      }
      // Implicit multiplication: `2x`, `3(x + 1)`, `(x + 1)(x - 2)`.
      if (startsFactor(t)) {
        const right = unary();
        if (!right) return null;
        left = multiply(left, right);
        continue;
      }
      // Division is outside this marker's language — even `x / 2`, because a
      // fraction parser that silently accepts it must then decide equivalence of
      // rational functions, which this module does not claim to do.
      if (t.kind === "op" && t.text === "/") return null;
      break;
    }
    return left;
  }

  function expression(): Polynomial | null {
    let left = term();
    if (!left) return null;
    for (;;) {
      const t = peek();
      if (!t || t.kind !== "op" || (t.text !== "+" && t.text !== "-")) break;
      at++;
      const right = term();
      if (!right) return null;
      left = add(left, right, t.text === "-" ? -1 : 1);
    }
    return left;
  }

  const result = expression();
  if (!result || at !== tokens.length) return null;
  if (result.some((n) => !Number.isFinite(n))) return null;
  return trimPoly(result);
}

/** Is `given` the same polynomial as at least one authored accepted form? */
export function algebraEquivalent(given: string, accepted: readonly string[], variable = "x"): boolean {
  const parsed = parsePolynomial(given, variable);
  if (!parsed) return false;
  for (const form of accepted) {
    const target = parsePolynomial(form, variable);
    if (!target) continue;
    if (parsed.length !== target.length) continue;
    if (parsed.every((n, i) => Math.abs(n - target[i]) <= EPS)) return true;
  }
  return false;
}

/** A human-readable expanded form, for feedback. Not used for marking. */
export function formatPolynomial(p: Polynomial, variable = "x"): string {
  const terms: string[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const n = p[i];
    if (Math.abs(n) < EPS) continue;
    const abs = Math.abs(n);
    const coef = i === 0 ? String(Number(abs.toFixed(10))) : abs === 1 ? "" : String(Number(abs.toFixed(10)));
    const v = i === 0 ? "" : i === 1 ? variable : `${variable}^${i}`;
    terms.push(`${n < 0 ? "−" : terms.length ? "+" : ""}${coef}${v}`);
  }
  return terms.length ? terms.join(" ") : "0";
}
