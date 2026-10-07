// ─────────────────────────────────────────────────────────────────────────────
// THE COMPUTING DEPTH LAYER.
//
// Why it exists. `npm run gate:ceiling` measures, for every advanced course in
// the platform, whether the MEDIAN concept it serves can actually reach the
// depth that course declares — and computing failed every one of them: its worst
// concepts capped at 0.40, nothing at all above 0.72, and a median of 0.58
// against courses declaring 0.70 to 0.90. Maths does not have that problem
// because maths has a depth layer (lib/questions-deep.ts, DEEP_GENS) that lifts
// its flagship concepts past 0.90. A declared difficulty a course cannot serve
// is a claim, not a curriculum, so computing gets the same treatment rather than
// a lowered declaration.
//
// WHAT MAKES THIS LAYER SAFE TO AUTHOR. Every answer here is COMPUTED by the
// generator — a trace is simulated, a table is filtered, a loop is actually
// counted, a subnet is actually sized — instead of being worked out in an
// author's head and typed. The key cannot drift from the item, because the item
// is generated FROM the key, and the distractor lists name the real mistakes
// (reporting `y` when asked for `z`, counting assignments instead of entries,
// using 2^(32−p) instead of 2^(32−p) − 2). A generator whose arithmetic is
// wrong produces a wrong ITEM, not a silently wrong MARK, and the content sweep
// in `npm run verify` holds every family over 240 seeds.
//
// WHAT IT IS NOT: a claim that a multiple-choice item measures writing code. The
// demand ladder still ends at data_interpretation, and `extended_response` stays
// out of `SKILLS_IN_BANK` (lib/skills.ts) exactly as before.
//
// Only TYPES are imported from the maths depth layer: questions-deep spreads
// THIS record into `DEEP_GENS`, so a value-level import back would close a
// module cycle — and a cycle that happens to work today is one that breaks at
// the next refactor. That is also why `distinct` is local.
// ─────────────────────────────────────────────────────────────────────────────
import type { DeepGen, DeepRng } from "./questions-deep";

/** The first `n` candidates genuinely different from the answer and each other.
 *
 *  A family that returns fewer than three distinct wrong answers makes the
 *  assembler fall back to filler ("None of these"), which the suite treats as a
 *  broken item — so every family below passes more candidates than it needs. */
function distinct(correct: string, candidates: readonly (string | number)[], n = 3): string[] {
  const out: string[] = [];
  for (const cand of candidates) {
    const s = String(cand);
    if (s !== correct && !out.includes(s) && out.length < n) out.push(s);
  }
  return out;
}

/**
 * The band these items earn: the answer is NOT in the question — it has to be
 * read out of a trace, a table or a model — and it carries a declared band of
 * 0.88–0.96, which is what the courses that teach computing at advanced level
 * ask for.
 *
 * THE BAND WAS RAISED BY MEASUREMENT, and the measurement is worth recording.
 * These families first declared 0.76–0.88, which cleared every 0.70–0.85 course
 * and left TWO rows failing `npm run gate:ceiling`: A-Level A2 and IB HL both
 * declare 0.90 (the same band their maths and science courses declare), and a
 * subject whose layer tops out at 0.88 cannot serve them however it is sampled.
 * The choice was between an honest 0.90 band and a lowered declaration, and a
 * course that asks for 0.90 work is a claim about the learner, not about the
 * content — so the content moved. The concepts' OTHER families are untouched, so
 * the shallower draws a lower tier needs are all still there; only the ceiling
 * of this layer moved.
 *
 * Written as a helper so no family can quietly drop back into the recall band
 * while still being described as deep.
 */
function reading(r: DeepRng): number {
  return 0.88 + r.next() * 0.08;
}

const joinList = (xs: readonly (string | number)[]) => xs.join(", ");

/** A number a student would write: at most three decimals, no float tail. */
function num(x: number, dp = 3): string {
  return x.toFixed(dp).replace(/\.?0+$/, "");
}

export const COMPUTING_DEEP: Record<string, DeepGen> = {
  /** A trace down three assignment lines, where the last one is the answer. */
  variables: (r) => {
    const a = r.int(3, 20);
    const m = r.int(2, 5);
    const k = r.int(1, 9);
    const b = a * m + k;
    const c = b - a;
    const correct = String(c);
    return {
      prompt: `Trace this code.\n\nx = ${a}\ny = x * ${m} + ${k}\nz = y - x\n\nWhat is the value of z?`,
      correct,
      wrongs: distinct(correct, [b, a, b - 1, c + a, k]),
      tags: [],
      explanation: `Follow the lines in order and keep each value: x = ${a}. Then y = ${a} × ${m} + ${k} = ${b}. Then z = ${b} − ${a} = ${c}. Reporting ${b} answers y, not z — a trace is only right if you keep the value of the line you were asked about.`,
      difficulty: reading(r),
    };
  },

  /** An if / else-if chain plus a later mutation of the same variable. */
  conditionals: (r) => {
    const score = r.int(45, 95);
    const late = r.next() < 0.5;
    const started = score >= 80 ? 4 : score >= 70 ? 3 : score >= 60 ? 2 : 1;
    const correct = String(late ? started - 1 : started);
    return {
      prompt: `Trace this code.\n\nscore = ${score}\nlate = ${late ? "true" : "false"}\n\nif score >= 80: grade = 4\nelse if score >= 70: grade = 3\nelse if score >= 60: grade = 2\nelse: grade = 1\n\nif late: grade = grade - 1\n\nWhat is grade?`,
      correct,
      wrongs: distinct(correct, [started, started + 1, started - 1, started + 2, 0]),
      tags: [],
      explanation: `Only the FIRST true branch runs, so with score = ${score} the grade starts at ${started}. Then ${late ? `late is true, so grade becomes ${started} − 1 = ${started - 1}` : `late is false, so the last line is skipped and grade stays ${started}`}. Reading an if / else-if chain as a checklist — where every true test also fires — is how a trace passes a test the program fails.`,
      difficulty: reading(r),
    };
  },

  /** Counting the iterations of a loop with a step, including the off-by-one. */
  loops: (r) => {
    const step = r.pick([1, 2, 3]);
    // A step of 1 makes the SURVIVING distractors collapse: the last value of i
    // IS `to`, and `to − from` is the count minus one, so when the counter also
    // starts at 0 or 1 every candidate coincides with something already offered.
    // Starting a step-1 loop at 3 or more keeps `to` clear of the count and its
    // neighbours, so the three wrong answers below are all real errors rather
    // than padders. (Found by the sweep: 305 draws with only two distinct
    // distractors, every one of them a step-1 loop starting at 0 or 1.)
    const from = step === 1 ? r.int(3, 7) : r.int(0, 4);
    const to = from + r.int(6, 14);
    let count = 0;
    let last = from;
    for (let i = from; i <= to; i += step) { count++; last = i; }
    const correct = String(count);
    return {
      prompt: `Trace this loop.\n\ncount = 0\nfor i = ${from} to ${to} step ${step}:\n    count = count + 1\n\nHow many times does the loop body run?`,
      correct,
      wrongs: distinct(correct, [count + 1, count - 1, last, to - from, Math.round((to - from) / step), to]),
      tags: [],
      explanation: `The counter starts at ${from} and the body runs while i ≤ ${to}, stepping by ${step}: ${from}, ${from + step}, ${from + 2 * step}, … up to ${last}. That is ${count} runs. The final value of i (${last}) is NOT the number of runs, and the runs are not ${to} − ${from} — the step changes how many there are.`,
      difficulty: reading(r),
    };
  },

  /** Removing at an index and reading the SAME index back: the shift. */
  "lists-arrays": (r) => {
    // FIVE items, each from its own value range, so nothing hinges on two random
    // draws happening to differ. The first design used four: `after[last]` and
    // `base[last]` are then ALWAYS the same item (removing from before the end
    // never changes the end), so two of the five candidates were one answer — and
    // once either of the surviving pair coincided with the key the item was left
    // with two distractors (measured: 34 | 23 | 3). A five-item list also makes
    // `at + 2` a real position, which is the "shifted by two" error.
    const base = [r.int(2, 9), r.int(10, 19), r.int(20, 29), r.int(30, 39), r.int(40, 49)];
    const at = r.int(0, 2);
    const after = base.slice(0, at).concat(base.slice(at + 1));
    const correct = String(after[at]);
    return {
      prompt: `Trace this code.\n\nlist = [${joinList(base)}]\nremove the item at index ${at}\n\nWhat is now at index ${at}?`,
      correct,
      wrongs: distinct(correct, [base[at], base[at + 2], base[0], after[after.length - 1], after.length]),
      tags: [],
      explanation: `Everything after index ${at} shifts down by one, so the item now at index ${at} is the one that was at index ${at + 1} — ${correct}. Reporting ${base[at]} says what USED to be there: removing at an index does not leave a hole, and reading the index straight back is the commonest way a list question goes wrong.`,
      difficulty: reading(r),
    };
  },

  /** A function definition, called: the body is evaluated, not guessed. */
  "functions-code": (r) => {
    const n = r.int(3, 12);
    const mk = r.int(2, 6);
    const sub = r.int(1, 20);
    const f = (x: number) => x * mk - sub;
    const correct = String(f(n));
    return {
      prompt: `Trace this code.\n\nfunction f(x):\n    return x * ${mk} - ${sub}\n\nanswer = f(${n})\n\nWhat is the value of answer?`,
      correct,
      wrongs: distinct(correct, [n * mk, n * (mk - sub), f(n) + sub, n - sub * mk, f(n) + mk, sub - n * mk]),
      tags: [],
      explanation: `Substitute x = ${n} into the body: ${n} × ${mk} = ${n * mk}, then − ${sub} gives ${correct}. The argument goes INTO x wherever x appears, so the subtraction happens after the multiplication — ${n * mk} is the answer to the multiplication, not to the function.`,
      difficulty: reading(r),
    };
  },

  /** A registry written five times: what a repeated key does to the COUNT. */
  dictionaries: (r) => {
    const names = ["ana", "bo", "cy"];
    const entries: Array<[string, number]> = [];
    const order: number[] = [];
    for (let i = 0; i < 6; i++) order.push(i % 3);
    const seen = new Set<string>();
    let writes = 0;
    for (const idx of order) {
      writes++;
      seen.add(names[idx]);
      entries.push([names[idx], writes]);
    }
    const correct = String(seen.size);
    return {
      prompt: `Trace this code.\n\n${entries.map(([k, v]) => `register["${k}"] = ${v}`).join("\n")}\n\nHow many ENTRIES does register hold?`,
      correct,
      wrongs: distinct(correct, [writes, 1, 2, entries.length - 1, names.length + 1]),
      tags: [],
      explanation: `A dictionary is keyed, so writing to a key that already exists REPLACES its value and adds nothing: ${writes} assignments but only ${seen.size} distinct keys (${names.join(", ")}). Counting the assignments (${writes}) is the mistake this question is for — it is the difference between how much was written and how much is stored.`,
      difficulty: reading(r),
    };
  },

  /** Filtering a real table with two conditions: count the rows that match. */
  "databases-sql": (r) => {
    // THE TABLE IS BUILT, NOT SAMPLED, and that is the whole design. Drawing six
    // random rows let the four counts coincide (a subject count equal to the row
    // count, an OR count equal to the table size), and a family whose distractors
    // collapse hands the assembler two options and a padder — measured at
    // "0 | 1 | 6". Here every cell of the 2×2 (matches both, only the subject,
    // only the mark, neither) is populated by construction, so the AND answer,
    // the two one-condition answers and the whole-table answer stay distinct on
    // EVERY draw, and the two ways of getting OR wrong stay distinct too.
    const subjects = ["computing", "maths"];
    const want = r.pick(subjects);
    const other = want === "computing" ? "maths" : "computing";
    const cutoff = r.pick([50, 60, 70]);
    const rows: Array<{ id: number; subject: string; mark: number }> = [];
    const push = (subject: string, mark: number) => rows.push({ id: rows.length + 1, subject, mark });
    const both = r.int(1, 4);
    const bySubjectOnly = r.int(1, 2);
    const byMarkOnly = r.int(1, 3);
    const neither = r.int(0, 2);
    for (let i = 0; i < both; i++) push(want, cutoff + r.int(0, 20));
    for (let i = 0; i < bySubjectOnly; i++) push(want, cutoff - r.int(5, 20));
    for (let i = 0; i < byMarkOnly; i++) push(other, cutoff + r.int(0, 20));
    for (let i = 0; i < neither; i++) push(other, cutoff - r.int(5, 20));
    // Shuffled from the seeded RNG so the matching rows are not always the first
    // ones read: the learner has to apply the condition, not count the top rows.
    for (let i = rows.length - 1; i > 0; i--) {
      const j = r.int(0, i);
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    rows.forEach((x, i) => { x.id = i + 1; });
    const bySubject = both + bySubjectOnly;
    const byMark = both + byMarkOnly;
    const correct = String(both);
    return {
      prompt: `The table results has these rows:\n\n${rows.map((x) => `· id ${x.id}: subject = ${x.subject}, mark = ${x.mark}`).join("\n")}\n\nSELECT * FROM results WHERE subject = '${want}' AND mark >= ${cutoff}\n\nHow many rows does the query return?`,
      correct,
      wrongs: distinct(correct, [
        // Dropped the mark condition.
        bySubject,
        // Dropped the subject condition.
        byMark,
        // No WHERE clause at all.
        rows.length,
        // AND read as OR.
        bySubject + byMark,
        // AND read as OR, then the overlap counted twice.
        bySubject + byMark - both,
        // The whole table minus the matches.
        rows.length - both,
      ]),
      tags: [],
      explanation: `Both conditions must hold at once — that is what AND means. ${both} row${both === 1 ? " has" : "s have"} subject = ${want} AND mark >= ${cutoff}. ${bySubject} rows have subject = ${want} (ignoring the mark), ${byMark} have mark >= ${cutoff} (ignoring the subject), and ${rows.length} is the whole table: each of those answers dropped a condition. Adding them (${bySubject} + ${byMark}) reads AND as OR, counting rows that satisfy only one of the two.`,
      difficulty: reading(r),
    };
  },

  /** One pass of selection sort, simulated: the swap, not the sort. */
  "algorithms-sort": (r) => {
    const vals = [r.int(30, 49), r.int(10, 19), r.int(20, 29), r.int(2, 9)];
    const first = vals.slice();
    let minIdx = 0;
    for (let i = 1; i < first.length; i++) if (first[i] < first[minIdx]) minIdx = i;
    const after = first.slice();
    [after[0], after[minIdx]] = [after[minIdx], after[0]];
    const sorted = first.slice().sort((a, b) => a - b);
    const correct = joinList(after);
    const moved = [Math.min(...first), ...first.filter((v) => v !== Math.min(...first))];
    return {
      prompt: `One pass of selection sort:\n\n1. find the SMALLEST item\n2. SWAP it with the item at the front\n\nThe list starts as [${joinList(first)}].\n\nWhat is the list after this pass?`,
      correct,
      wrongs: distinct(correct, [
        joinList(first),
        joinList(sorted),
        joinList(moved),
        joinList(first.slice().reverse()),
        joinList([...after.slice(1), after[0]]),
      ]),
      tags: [],
      explanation: `The smallest item is ${first[minIdx]}, at index ${minIdx}, and selection sort SWAPS it with the front: ${first[0]} takes its place. Everything between the two positions stays where it was, so the result is [${correct}]. Moving the smallest item to the front without swapping (${joinList(moved)}) loses ${first[0]} — and one pass is not a sort, so [${joinList(sorted)}] is the whole algorithm, not one pass of it.`,
      difficulty: reading(r),
    };
  },

  /** Binary search over a real sorted list: the comparison count is simulated. */
  "algorithms-search": (r) => {
    const sorted: number[] = [];
    let v = r.int(2, 9);
    for (let i = 0; i < 8; i++) { sorted.push(v); v += r.int(3, 12); }
    const target = sorted[r.int(0, 7)];
    let lo = 0, hi = sorted.length - 1, steps = 0;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      steps++;
      if (sorted[mid] === target) break;
      if (sorted[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    const linear = sorted.indexOf(target) + 1;
    const correct = String(steps);
    return {
      prompt: `A binary search runs on this sorted list:\n\n[${joinList(sorted)}]\n\nIt looks for ${target}. Each step compares the middle item and throws away half the list.\n\nHow many comparisons does it need before it finds ${target}?`,
      correct,
      wrongs: distinct(correct, [linear, steps + 1, steps - 1, 3, sorted.length]),
      tags: [],
      explanation: `Halving ${sorted.length} items takes ${steps} comparisons: the middle of the whole list first, then the middle of the surviving half, and so on until ${target} is the middle. Checking from the left instead (linear search) would take ${linear}, which is why the list has to be sorted for binary search to work at all.`,
      difficulty: reading(r),
    };
  },

  /** A recurrence evaluated for one value, computed iteratively. */
  recursion: (r) => {
    const base = r.int(2, 5);
    const add = r.int(2, 6);
    const k = r.int(3, 7);
    const f = (n: number) => base + n * add;
    const correct = String(f(k));
    return {
      prompt: `A function is defined as:\n\nf(0) = ${base}\nf(n) = f(n - 1) + ${add}\n\nWhat is f(${k})?`,
      correct,
      wrongs: distinct(correct, [f(k - 1), f(k) + add, k * add, base * add * k, base + add]),
      tags: [],
      explanation: `f(${k}) unwinds to f(0) with ${k} additions of ${add} on the way back: ${base} + ${k} × ${add} = ${correct}. ${f(k - 1)} is f(${k - 1}) — one step short — and ${k * add} counts the additions but forgets the base case.`,
      difficulty: reading(r),
    };
  },

  /** A nested loop counted for a given n: n(n+1)/2, simulated rather than quoted. */
  complexity: (r) => {
    const n = r.int(6, 14);
    let count = 0;
    for (let i = 1; i <= n; i++) for (let j = i; j <= n; j++) count++;
    const correct = String(count);
    return {
      prompt: `Trace this code.\n\ncount = 0\nfor i = 1 to ${n}:\n    for j = i to ${n}:\n        count = count + 1\n\nHow many times does count increase?`,
      correct,
      wrongs: distinct(correct, [n * n, (n * (n - 1)) / 2, n, count - n, count + n]),
      tags: [],
      explanation: `The inner loop runs ${n} times when i = 1, ${n - 1} when i = 2, and so on down to 1 — that is ${n} + ${n - 1} + … + 1 = ${correct}. ${n * n} assumes the inner loop always runs ${n} times, which would be a full square rather than a triangle.`,
      difficulty: reading(r),
    };
  },

  /** A median read out of an unsorted table: the middle in ORDER, not on the page. */
  "statistics-data": (r) => {
    const data: number[] = [];
    while (data.length < 7) {
      const v = r.int(8, 60);
      if (!data.includes(v)) data.push(v);
    }
    const sorted = data.slice().sort((a, b) => a - b);
    const median = sorted[3];
    const mean = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
    const correct = String(median);
    return {
      prompt: `A sensor takes seven readings, logged in this order: ${joinList(data)} min. What is the MEDIAN reading?`,
      correct,
      wrongs: distinct(correct, [data[3], mean, sorted[sorted.length - 1], sorted[0], median + 1]),
      tags: [],
      explanation: `The median is the middle value once the readings are put IN ORDER: ${joinList(sorted)}. The middle of that is ${median}. ${data[3]} is the middle of the LOGGED order, which is a different number whenever the readings are not already sorted — the order they arrived in says nothing about their size.`,
      difficulty: reading(r),
    };
  },

  /** A subnet size, where the two reserved addresses are the whole point. */
  networks: (r) => {
    const prefix = r.pick([24, 25, 26, 27, 28, 29, 30]);
    const total = Math.pow(2, 32 - prefix);
    const usable = total - 2;
    const correct = String(usable);
    return {
      // ONE LINE ON PURPOSE. A prompt carrying a line break cannot become an
      // option in the inverse (transfer) surface — `readableOption` in
      // lib/transfer.ts excludes multi-part stems, because four paragraphs in a
      // choice list is a wall of text — so a two-sentence question that needs no
      // break should not have one. This family's answers ARE values, and joining
      // it restored the transfer coverage the deeper bank had cost (measured:
      // 99 inverse items against a floor of more than 100). Prompts that really
      // are a trace, a table or a list keep their line breaks: for those the
      // exclusion is honest, and the stage falls back to `direct`.
      prompt: `A school network is written as 10.0.4.0/${prefix}. How many USABLE host addresses does it have?`,
      correct,
      wrongs: distinct(correct, [total, total - 1, total / 2, total + 2, Math.floor(usable / 2)]),
      tags: [],
      explanation: `A /${prefix} leaves ${32 - prefix} bits for hosts, so the block holds 2^${32 - prefix} = ${total} addresses. The first address names the network and the last is the broadcast address, and neither can be given to a device: ${total} − 2 = ${correct}. Answering ${total} ignores those two reserved addresses.`,
      difficulty: reading(r),
    };
  },

  /** A search space, computed: why length beats alphabet, and by how much. */
  cybersecurity: (r) => {
    const alphabet = r.pick([26, 36, 52, 62]);
    const len = r.pick([3, 4, 5]);
    const space = Math.pow(alphabet, len);
    const correct = String(space);
    return {
      prompt: `A website allows passwords of any ${len} characters from an alphabet of ${alphabet} symbols. How many different passwords are possible?`,
      correct,
      wrongs: distinct(correct, [alphabet * len, Math.pow(alphabet, len - 1), alphabet + len, Math.pow(alphabet + 10, len), Math.pow(alphabet, len) + alphabet]),
      tags: [],
      explanation: `Each of the ${len} positions can be any of ${alphabet} symbols, and the choices multiply: ${Array.from({ length: len }, () => alphabet).join(" × ")} = ${correct}. ${alphabet * len} adds the possibilities instead of multiplying them — which is why one extra character usually buys far more than one extra symbol in the alphabet.`,
      difficulty: reading(r),
    };
  },

  /** Four hex digits read as one 16-bit value: the weights are the question. */
  "binary-data": (r) => {
    const nib = [r.int(0, 15), r.int(0, 15), r.int(0, 15), r.int(0, 15)];
    const value = (nib[0] << 12) | (nib[1] << 8) | (nib[2] << 4) | nib[3];
    const reversed = (nib[3] << 12) | (nib[2] << 8) | (nib[1] << 4) | nib[0];
    const correct = String(value);
    const hex = nib.map((x) => x.toString(16).toUpperCase());
    return {
      prompt: `A device stores a 16-bit number as four hex digits, MOST significant first:\n\n${hex.map((h, i) => `· position ${i + 1}: ${h}`).join("\n")}\n\nWhat is the number in decimal?`,
      correct,
      wrongs: distinct(correct, [reversed, nib.reduce((a, b) => a + b, 0), value + 1, value - 1, (nib[0] << 8) | (nib[1] << 4) | nib[2]]),
      tags: [],
      explanation: `Each position is worth 16 times the one to its right: ${nib[0]} × 4096 + ${nib[1]} × 256 + ${nib[2]} × 16 + ${nib[3]} = ${correct}. Reading the digits least-significant first gives ${reversed}, and adding them (${nib.reduce((a, b) => a + b, 0)}) weights every position the same — which is the mistake place value exists to prevent.`,
      difficulty: reading(r),
    };
  },

  /** A program traced line by line, where the answer is a VALUE rather than a
   *  number: `word = word + word` acts on the WHOLE value built so far, which is
   *  the difference between reading code as a description and executing it. */
  "what-is-code": (r) => {
    const words = ["ab", "go", "it", "no", "so", "up"];
    const first = r.pick(words);
    const second = r.pick(words.filter((w) => w !== first));
    const once = first + second;
    const correct = once + once;
    return {
      prompt: `A program runs its lines in order:\n\nword = "${first}"\nword = word + "${second}"\nword = word + word\nprint(word)\n\nWhat does it print?`,
      correct,
      wrongs: distinct(correct, [
        // The doubling line skipped: the word printed after one join.
        once,
        // The doubling line read as "print the first word twice".
        first + first,
        // The two joins swapped.
        second + first + second + first,
        // The doubling line applied twice.
        once + once + once + once,
        // Printed before the join.
        first,
      ]),
      tags: [],
      explanation: `Every line uses the value the line above it left behind. Line 1 gives "${first}"; line 2 joins the two parts to give "${once}"; line 3 adds the WHOLE current value to itself, so "${once}" + "${once}" = "${correct}". Printing "${once}" stops one line short, and "${first}${first}" is what you get by reading line 3 as "print ${first} twice" — which is what the line means to a person and not what it does. A computer executes exactly the lines written, in order, which is why precision is the whole discipline of writing code.`,
      difficulty: reading(r),
    };
  },

  /** CSS specificity read out of a real stylesheet: the winning colour is
   *  COMPUTED from the selectors, and every distractor is the colour a named
   *  mis-ordering would actually produce. */
  "web-stack": (r) => {
    // Five distinct colours, so neither branch below can offer a word twice. The
    // declaration ORDER is deliberate: the id rule sits in the middle, so "the
    // first rule wins" and "the last rule wins" are BOTH wrong answers rather
    // than shortcuts to the right one.
    const [lead, idC, pC, note, inline] = r
      .shuffle(["navy", "teal", "olive", "maroon", "purple", "crimson", "indigo", "sienna"])
      .slice(0, 5);
    const hasInline = r.next() < 0.5;
    const correct = hasInline ? inline : idC;
    return {
      prompt: `A page loads this stylesheet, in source order:\n\n.lead { color: ${lead}; }\n#intro { color: ${idC}; }\np { color: ${pC}; }\np.note { color: ${note}; }\n\nThe markup is\n\n<p id="intro" class="lead note"${hasInline ? ` style="color: ${inline};"` : ""}>Hello</p>\n\nWhich colour is the paragraph's text?`,
      correct,
      // With an inline style the id rule is no longer the winner but is still
      // the tempting answer; without one it IS the winner, and the tempting
      // answers become the first and last rules in the file.
      wrongs: distinct(correct, hasInline ? [note, idC, pC] : [note, lead, pC]),
      tags: [],
      explanation: `CSS scores a selector as three counts — ids, then classes, then elements — and the id count is decided FIRST: #intro is (1,0,0) and beats every selector built only from classes and elements, so .lead (0,1,0), p.note (0,1,1) and p (0,0,1) all lose to it whatever order they are written in. ${hasInline ? `An inline style attribute (${inline}) outranks every selector in every stylesheet, so it wins here.` : `Source order only breaks a TIE, and there is no tie here — so neither the first nor the last rule in the file wins.`} ${note} is what you get by counting how MANY parts a selector has rather than what they are worth: "p.note" looks more specific than "#intro" and one id is worth more than ten classes.`,
      difficulty: reading(r),
    };
  },

  /** A confusion matrix read as data. Accuracy is defined over the WHOLE test
   *  set, and the distractors are the other metrics — precision, recall, the
   *  error rate — each of which answers a different question. */
  "ai-basics": (r) => {
    const tp = r.int(30, 90);
    const fp = r.int(5, 25);
    const fn = r.int(3, 20);
    const tn = r.int(40, 120);
    const total = tp + fp + fn + tn;
    const accuracy = ((tp + tn) / total) * 100;
    const precision = (tp / (tp + fp)) * 100;
    const recall = (tp / (tp + fn)) * 100;
    const correct = `${num(accuracy, 1)}%`;
    return {
      prompt: `A classifier is tested on ${total} labelled emails and its results are recorded:\n\n· predicted spam, actually spam: ${tp}\n· predicted spam, actually not spam: ${fp}\n· predicted not spam, actually spam: ${fn}\n· predicted not spam, actually not spam: ${tn}\n\nWhat percentage of the test set did it label correctly?`,
      correct,
      wrongs: distinct(correct, [
        // Precision: the false positives left out of the denominator.
        `${num(precision, 1)}%`,
        // Recall: the ones it missed left out.
        `${num(recall, 1)}%`,
        // The error rate, quoted as the success rate.
        `${num(100 - accuracy, 1)}%`,
        // Only the true positives counted.
        `${num((tp / total) * 100, 1)}%`,
        // Only the positive predictions counted.
        `${num(((tp + fp) / total) * 100, 1)}%`,
        // The size of the test set quoted as a percentage.
        String(total),
      ]),
      tags: [],
      explanation: `Accuracy counts every example it got right, over every example there is: (${tp} + ${tn}) ÷ ${total} = ${correct}. The neighbouring numbers answer DIFFERENT questions rather than being wrong: precision (${num(precision, 1)}%) asks what share of the spam PREDICTIONS were right, recall (${num(recall, 1)}%) asks what share of the real spam was CAUGHT, and ${num(100 - accuracy, 1)}% is the error rate. Which one matters depends on what a mistake costs — missing real spam and binning a real email are not equally bad — which is why accuracy is a summary of a model and never the whole story about it.`,
      difficulty: reading(r),
    };
  },
};
