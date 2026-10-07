// ─────────────────────────────────────────────────────────────────────────────
// THE MISSING MIDDLE — computing.
//
// The companion to lib/questions-mid-maths.ts, and it exists for the same
// measured reason. Every computing concept already HAD a depth family
// (lib/questions-computing.ts, band 0.88–0.96), and every one of them was
// missing the rung in between: `variables` produced 0.35–0.40 and then nothing
// until 0.88, so band 3 (0.45–0.60) and band 4 (0.60–0.80) were unreachable.
// Nineteen computing courses per affected concept were being served a recall
// item or a data-interpretation item, and never the step between them.
//
// The cause is NOT the serve search. `scripts/content-audit.mjs` reports cause
// A = 0 for every course in the platform: there was no in-band item the serve
// failed to find, because there was no in-band item. Raising the draw budget
// from 40 to 400 changed nothing at all. So this is content, and this is it.
//
// WHAT MAKES THESE SAFE TO AUTHOR. Every answer is COMPUTED by simulating the
// code in the generator — the loop is actually run, the swap is actually
// performed, the bubble pass is actually simulated, the byte is actually
// converted — instead of being worked out in an author's head and typed. The
// key cannot drift from the item, because the item is generated FROM the key.
// The distractors are the mistakes the trace actually invites: reporting the
// value that USED to be at an index, stopping one operation short, counting
// assignments where the question asks for entries, applying the update before
// the condition that filters it.
//
// WHAT IT IS NOT: a claim that a multiple-choice item measures writing code.
// `extended_response` stays out of `SKILLS_IN_BANK` (lib/skills.ts), exactly as
// before, and the demand ladder still ends at data_interpretation.
//
// Bands are declared, not hoped for — and held under 0.90 on purpose, because
// these fill a hole rather than raise the top of the bank:
//   mid3()  0.47–0.58   two linked steps
//   mid4()  0.63–0.77   three linked steps
//
// Only TYPES are imported from the maths depth layer: lib/questions.ts composes
// these records into its own generator table, so a value-level import back would
// close a module cycle — which is also why the small helpers are local rather
// than shared with the other mid files.
// ─────────────────────────────────────────────────────────────────────────────
import type { DeepGen, DeepRng } from "./questions-deep";

/** The first `n` candidates genuinely different from the answer and each other.
 *  Fewer than three distinct wrongs and the assembler falls back to filler,
 *  which the question audit rightly calls a broken item — so every family below
 *  passes more candidates than it needs. */
function distinct(correct: string, candidates: readonly (string | number)[], n = 3): string[] {
  const out: string[] = [];
  for (const cand of candidates) {
    const s = String(cand);
    if (s !== correct && !out.includes(s) && out.length < n) out.push(s);
  }
  return out;
}

const joinList = (xs: readonly (string | number)[]) => xs.join(", ");

/** Band 3 (0.45–0.60): two linked steps. */
function mid3(r: DeepRng): number {
  return 0.47 + r.next() * 0.11;
}

/** Band 4 (0.60–0.80): three linked steps. */
function mid4(r: DeepRng): number {
  return 0.63 + r.next() * 0.14;
}

/** A binary rendering with a fixed width, so a byte looks like a byte. */
function bin(n: number, width = 8): string {
  return n.toString(2).padStart(width, "0");
}

export const MID_COMPUTING: Record<string, DeepGen> = {
  // ── VARIABLES ─────────────────────────────────────────────────────────────
  /** Band 3: a swap through a temporary — four lines, two live values. Band 4:
   *  four assignments that each build on the last, where reading the value of
   *  the variable mid-way is the error. */
  variables: (r) => {
    const x = r.int(3, 20);
    let y = r.int(3, 20);
    if (y === x) y += 1;
    if (r.next() < 0.5) {
      const correct = String(y);
      return {
        prompt: `Trace this code.\n\na = ${x}\nb = ${y}\ntemp = a\na = b\nb = temp\n\nWhat is the value of a at the end?`,
        correct,
        wrongs: distinct(correct, [
          // The variable never updated — the swap read as two separate lines.
          x,
          // The third line read as if it copied b rather than a.
          y,
          // The two values added.
          x + y,
          // The last line's target quoted.
          y * 2,
        ]),
        tags: [],
        explanation: `A temporary keeps the value that is about to be overwritten. Before line 3, a = ${x} and b = ${y}. Line 3 stores ${x} in temp. Line 4 OVERWRITES a with b, so a becomes ${y}. Line 5 puts the saved ${x} into b. At the end a = ${y} and b = ${x} — the two values have swapped. Answering ${x} stops at line 3, and ${x + y} treats assignment as addition.`,
        difficulty: mid3(r),
      };
    }
    // Four assignments, each built on the last.
    const step = r.int(2, 9);
    const after1 = x + step;
    const after2 = after1 * 2;
    const result = after2 - x;
    const correct = String(result);
    return {
      prompt: `Trace this code.\n\nscore = ${x}\nscore = score + ${step}\nscore = score * 2\nscore = score - ${x}\n\nWhat is the value of score at the end?`,
      correct,
      wrongs: distinct(correct, [
        // The value after the multiply, one line short.
        after2,
        // The value after the add.
        after1,
        // The original, as if only x had been stored.
        x,
        // The additions and multiplications collapsed instead of sequenced.
        x + step * 2 - x,
        result + step,
      ]),
      tags: [],
      explanation: `Assignment keeps one value per variable, and each line replaces the last. ${x} + ${step} = ${after1}; ${after1} × 2 = ${after2}; ${after2} − ${x} = ${result}. Reporting ${after2} stops one line early — and the reason a trace is necessary at all is that the arithmetic is not the same as the algebra: ${x} + ${step} × 2 − ${x} does NOT equal ${result}.`,
      difficulty: mid4(r),
    };
  },

  // ── CONDITIONALS ──────────────────────────────────────────────────────────
  /** Band 3: a compound condition, where both halves must be worked out before
   *  they can be combined. Band 4: the same rule applied to four inputs, which
   *  has to be evaluated case by case and then counted. */
  conditionals: (r) => {
    const threshold = r.int(40, 70);
    const attendance = r.pick([0.7, 0.75, 0.8, 0.85, 0.9, 0.95]);
    const score = r.int(30, 95);
    const passes = score >= threshold && attendance >= 0.85;
    if (r.next() < 0.5) {
      const correct = passes ? "true" : "false";
      return {
        prompt: `An exam is offered to a student who scores at least ${threshold} AND attends at least 85% of lessons.\n\nThe student scores ${score} and attends ${attendance * 100}% of lessons.\n\nIs the student offered the exam?\n\nif score >= ${threshold} and attendance >= 0.85:\n    offered = true\nelse:\n    offered = false`,
        correct,
        wrongs: distinct(correct, [passes ? "false" : "true", "0", "1", "cannot be determined"]),
        tags: [],
        explanation: `\`and\` needs BOTH sides true. The score test is ${score} >= ${threshold}, which is ${score >= threshold}; the attendance test is ${attendance} >= 0.85, which is ${attendance >= 0.85}. Since ${score >= threshold ? "the first" : "the second"} test is ${score >= threshold ? "true" : "false"}, the whole condition is ${correct}. A compound condition is not a vote: one false half makes the whole thing false, however comfortably the other half passes.`,
        difficulty: mid3(r),
      };
    }
    // The same rule across four applicants, evaluated and counted.
    const cut = r.int(50, 80);
    const marks = [r.int(40, 90), r.int(40, 90), r.int(40, 90), r.int(40, 90)];
    const names = ["Ana", "Bo", "Cy", "Di"];
    const offer = marks.map((m) => m >= cut);
    const count = offer.filter(Boolean).length;
    const correct = String(count);
    return {
      prompt: `Four students apply. The rule is: offer a place if mark >= ${cut}.\n\n${names.map((n, i) => `· ${n}: ${marks[i]}`).join("\n")}\n\nif mark >= ${cut}:\n    place = true\nelse:\n    place = false\n\nHow many students are offered a place?`,
      correct,
      wrongs: distinct(correct, [
        4 - count,
        // The ones who missed, plus one.
        count + 1,
        count === 0 ? 1 : count - 1,
        // The highest mark quoted as a count.
        Math.max(...marks),
        marks.filter((m) => m > cut).length,
      ]),
      tags: [],
      explanation: `Apply the rule to each applicant and then count the true results. ${names.map((n, i) => `${n} (${marks[i]} ${offer[i] ? ">=" : "<"} ${cut})`).join(", ")}. That is ${count} place${count === 1 ? "" : "s"}. The condition uses >=, so a mark of exactly ${cut} counts — and ${marks.filter((m) => m > cut).length} is the answer you get by reading it as strict >, which is a different rule.`,
      difficulty: mid4(r),
    };
  },

  // ── FUNCTIONS ─────────────────────────────────────────────────────────────
  /** Band 4: the same function called twice with its results accumulated, so
   *  the body has to be evaluated for two different arguments and the results
   *  then combined. */
  "functions-code": (r) => {
    const mul = r.int(2, 7);
    const add = r.int(1, 15);
    const n1 = r.int(2, 12);
    let n2 = r.int(2, 12);
    if (n2 === n1) n2 += 1;
    const f = (x: number) => x * mul + add;
    const total = f(n1) + f(n2);
    const correct = String(total);
    return {
      prompt: `Trace this code.\n\nfunction f(x):\n    return x * ${mul} + ${add}\n\ntotal = 0\ntotal = total + f(${n1})\ntotal = total + f(${n2})\n\nWhat is the value of total?`,
      correct,
      wrongs: distinct(correct, [
        // The function applied to the SUM of the arguments instead of to each.
        f(n1 + n2),
        // Only the first call counted.
        f(n1),
        // The two arguments added without going through the function.
        n1 + n2,
        total + add,
        total - mul,
      ]),
      tags: [],
      explanation: `The body runs once per call, with the argument substituted for x each time. f(${n1}) = ${n1} × ${mul} + ${add} = ${f(n1)}; f(${n2}) = ${n2} × ${mul} + ${add} = ${f(n2)}. Adding those gives ${total}. Applying the function to ${n1} + ${n2} = ${n1 + n2} (${f(n1 + n2)}) is the mistake functions exist to prevent — a function is a rule applied to EACH input, not a multiplier you can pour all the numbers into at once.`,
      difficulty: mid4(r),
    };
  },

  // ── WHAT IS CODE ──────────────────────────────────────────────────────────
  /** Band 3: assignment COPIES, so reassigning one variable leaves the other
   *  alone. Band 4: the same fact across three names, where the order of the
   *  assignments decides what is printed. */
  "what-is-code": (r) => {
    const words = ["ab", "go", "it", "no", "so", "up", "at", "id"];
    const first = r.pick(words);
    const second = r.pick(words.filter((w) => w !== first));
    if (r.next() < 0.5) {
      const correct = `${second} ${first}`;
      return {
        prompt: `Trace this code.\n\na = "${first}"\nb = a\na = "${second}"\nprint(a, b)\n\nWhat does it print?`,
        correct,
        wrongs: distinct(correct, [
          // b read as an alias for a, so it changes when a does.
          `${second} ${second}`,
          `${first} ${second}`,
          `${first} ${first}`,
          second,
          second + first,
        ]),
        tags: [],
        explanation: `\`b = a\` copies the VALUE held by a at that moment — it does not make b another name for a. So b keeps "${first}" for ever, while a is replaced by "${second}". The printed pair is "${second} ${first}". Printing "${second} ${second}" treats b as an alias, which is how assignment and reference are confused in nearly every language with both.`,
        difficulty: mid3(r),
      };
    }
    // Three names: a saves a value, a and b are swapped through it.
    const correct = `${second}${first}`;
    return {
      prompt: `Trace this code.\n\nfirst = "${first}"\nsecond = "${second}"\nsaved = first\nfirst = second\nsecond = saved\nprint(first + second)\n\nWhat does it print?`,
      correct,
      wrongs: distinct(correct, [
        // The swap read as a copy, so both keep their own value.
        first + second,
        `${first}${first}`,
        `${second}${second}`,
        // The concatenation done before the swap.
        second,
        first,
      ]),
      tags: [],
      explanation: `Three lines, three values at each stage. \`saved = first\` keeps "${first}" after first is overwritten; \`first = second\` makes first "${second}"; \`second = saved\` puts "${first}" back into second. The program has swapped two words, so printing first + second gives "${correct}". Printing "${first}${second}" reads the swap as a no-op, and "${second}${second}" happens whenever the temporary line is dropped — without a saved copy the original value is gone.`,
      difficulty: mid4(r),
    };
  },

  // ── DICTIONARIES ──────────────────────────────────────────────────────────
  /** Band 4: a value READ after it was changed — three lookups, one of them
   *  after an update, so the order of the statements decides the total. */
  dictionaries: (r) => {
    const names = ["ana", "bo", "cy"];
    const before = r.int(2, 9);
    const bumped = before + r.int(1, 9);
    const other = r.int(2, 9);
    const third = r.int(2, 9);
    const total = before + other + bumped;
    const correct = String(total);
    return {
      prompt: `Trace this code.\n\nscores = {"${names[0]}": ${before}, "${names[1]}": ${other}, "${names[2]}": ${third}}\ntotal = 0\ntotal = total + scores["${names[1]}"]\ntotal = total + scores["${names[0]}"]\nscores["${names[0]}"] = ${bumped}\ntotal = total + scores["${names[0]}"]\n\nWhat is the value of total?`,
      correct,
      wrongs: distinct(correct, [
        // The last lookup read BEFORE the update, so the change is missed.
        before + other + before,
        // The update applied to both earlier lookups.
        other + bumped + bumped,
        // All three of the dictionary's values added.
        before + other + third,
        // One value left out.
        before + other,
        total + bumped,
      ]),
      tags: [],
      explanation: `A dictionary read returns whatever is stored AT THE MOMENT OF THE READ. Line 3 reads ${names[1]}'s ${other}; line 4 reads ${names[0]}'s ${before}; line 5 CHANGES ${names[0]} to ${bumped}; line 6 reads ${names[0]} again and gets ${bumped}. So total = ${other} + ${before} + ${bumped} = ${total}. Reading ${before} twice (${before + other + before}) misses the update entirely — the same key can hand back two different values in one program, which is exactly what mutating state means.`,
      difficulty: mid4(r),
    };
  },

  // ── ALGORITHMS: SORT ──────────────────────────────────────────────────────
  /** Band 4: TWO passes of bubble sort, actually simulated. One pass is a rule;
   *  two passes is where the learner has to keep the intermediate list. */
  "algorithms-sort": (r) => {
    const vals: number[] = [];
    while (vals.length < 4) {
      const v = r.int(11, 99);
      if (!vals.includes(v)) vals.push(v);
    }
    const bubblePass = (list: number[]): number[] => {
      const out = list.slice();
      for (let i = 0; i < out.length - 1; i++) {
        if (out[i] > out[i + 1]) [out[i], out[i + 1]] = [out[i + 1], out[i]];
      }
      return out;
    };
    const pass1 = bubblePass(vals);
    const pass2 = bubblePass(pass1);
    const pass3 = bubblePass(pass2);
    const sorted = vals.slice().sort((a, b) => a - b);
    const correct = joinList(pass2);
    return {
      prompt: `Bubble sort compares each neighbouring pair, left to right, and SWAPS them if they are out of order. One pass moves along the whole list once.\n\nThe list starts as [${joinList(vals)}].\n\nWhat is the list after TWO passes?`,
      correct,
      wrongs: distinct(correct, [
        // The starting list, as if nothing moved.
        joinList(vals),
        // One pass.
        joinList(pass1),
        // The fully sorted list, which is more passes than were asked for.
        joinList(sorted),
        joinList(pass3),
        joinList(pass2.slice().reverse()),
      ]),
      tags: [],
      explanation: `A pass is a walk, not a sort. After one pass the list is [${joinList(pass1)}] — the largest item has walked all the way to the end, which is what a pass guarantees. The second pass moves along it again and gives [${joinList(pass2)}]. Reporting [${joinList(pass1)}] is one pass, and [${joinList(sorted)}] is the whole algorithm: a sorted list is not evidence that one pass happened, and the passes have to be counted rather than assumed.`,
      difficulty: mid4(r),
    };
  },

  // ── LOOPS ─────────────────────────────────────────────────────────────────
  /** Band 4: the counter is DOUBLED rather than incremented, so the number of
   *  runs has to be traced rather than divided out of the range. */
  loops: (r) => {
    const limit = r.pick([40, 50, 60, 70, 80, 100, 120]);
    const factor = r.pick([2, 3]);
    let i = 1;
    let runs = 0;
    while (i < limit) {
      runs++;
      i *= factor;
    }
    const last = i;
    const correct = String(runs);
    return {
      prompt: `Trace this loop.\n\ncount = 0\ni = 1\nwhile i < ${limit}:\n    count = count + 1\n    i = i * ${factor}\n\nHow many times does the loop body run?`,
      correct,
      wrongs: distinct(correct, [
        // The counter's final value quoted as the number of runs.
        last,
        // The range divided by the factor, as if the counter added instead.
        Math.floor((limit - 1) / factor),
        // One out either way.
        runs + 1,
        runs - 1,
        // The limit itself.
        limit,
      ]),
      tags: [],
      explanation: `The counter MULTIPLIES, so the runs are counted rather than divided. It takes the values 1, ${factor}${factor === 2 ? ", 4, 8" : ", 9, 27"} … up to ${last / factor}, which is ${runs} runs before i reaches ${last} and the condition i < ${limit} fails. ${last} is the counter's final value, NOT the number of runs — a loop that doubles gets there in very few steps, which is the whole reason logarithmic searches are fast.`,
      difficulty: mid4(r),
    };
  },

  // ── BINARY DATA ───────────────────────────────────────────────────────────
  /** Band 4: two bytes added, so both have to be read with their place values
   *  before anything can be summed. */
  "binary-data": (r) => {
    const a = r.int(40, 160);
    const b = r.int(20, 90);
    const correct = String(a + b);
    return {
      prompt: `A program reads two bytes from memory:\n· byte 1: ${bin(a)}\n· byte 2: ${bin(b)}\n\nThe program adds them as whole numbers. What is the result in decimal?`,
      correct,
      wrongs: distinct(correct, [
        // The bytes read as if the eight digits were decimal digits.
        Number(bin(a)) + Number(bin(b)),
        // The bit patterns combined with OR instead of added.
        a | b,
        // The bit patterns combined with AND.
        a & b,
        a + b + 1,
        a * b,
      ]),
      tags: [],
      explanation: `Each position in a byte is worth a power of two, and the reading has to happen before the addition. ${bin(a)} = ${a} and ${bin(b)} = ${b}, so the sum is ${a + b}. Reading the digits as decimal (${bin(a)} + ${bin(b)} = ${Number(bin(a)) + Number(bin(b))}) is the same mistake place value exists to prevent, and OR (${a | b}) is not addition — it only sets a bit when a bit in either number is set, so it always gives less than the sum whenever the two disagree.`,
      difficulty: mid4(r),
    };
  },

  // ── LISTS & ARRAYS ────────────────────────────────────────────────────────
  /** Band 4: three index accesses, one of which reads a value that a later line
   *  overwrites — so the ORDER of the lines is the whole question. */
  "lists-arrays": (r) => {
    const base = [r.int(2, 9), r.int(10, 19), r.int(20, 29), r.int(30, 39)];
    const moved = base[3];
    const after = [moved, base[1], base[2], 0];
    const correct = joinList(after);
    return {
      prompt: `Trace this code.\n\nlist = [${joinList(base)}]\nlist[0] = list[3]\nlist[3] = 0\n\nWhat is the list now?`,
      correct,
      wrongs: distinct(correct, [
        // The starting list, as if the assignments had not happened.
        joinList(base),
        // The value at index 3 read AFTER the first line, so the copy is lost.
        joinList([moved, base[1], base[2], moved]),
        // The write and the read swapped.
        joinList([0, base[1], base[2], moved]),
        // The overwrite applied one index too far to the left.
        joinList([moved, base[0], base[2], 0]),
        joinList(after.slice().reverse()),
      ]),
      tags: [],
      explanation: `Line 2 reads index 3 — ${moved} — and copies it into index 0. Line 3 then REPLACES index 3 with 0. The value copied out is safe, because an index holds a value and the copy was made before the overwrite, so the list becomes [${joinList(after)}]. Reporting [${joinList(base)}] treats an index as a label pointing at another index: index 0 now holds ${moved} itself, not a link to wherever ${moved} came from.`,
      difficulty: mid4(r),
    };
  },

  // ── STATISTICS FROM DATA ──────────────────────────────────────────────────
  /** Band 4: an EVEN number of readings, so the median is the average of the two
   *  middle values once they are in order — three steps, not one. */
  "statistics-data": (r) => {
    const data: number[] = [];
    while (data.length < 6) {
      const v = r.int(9, 70);
      if (!data.includes(v)) data.push(v);
    }
    // The readings are put in order ONCE, and the median is then read off
    // that same list. (An earlier draft nudged the two middle values to make
    // the median whole, which quietly changed the data the question prints —
    // the answer has to be the answer to the question actually asked. A
    // six-item list can give a `.5` median, and that is a correct answer, not
    // float noise.)
    const sorted = data.slice().sort((a, b) => a - b);
    const median = (sorted[2] + sorted[3]) / 2;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const correct = String(median);
    return {
      prompt: `A sensor logs six readings, in this order: ${joinList(data)} min. What is the MEDIAN reading?`,
      correct,
      wrongs: distinct(correct, [
        // The average of the OLD middle values, taken before the data is put in
        // order.
        (data[2] + data[3]) / 2,
        // The single middle value of a six-item list, as if it were odd.
        sorted[3],
        // The mean.
        Number(mean.toFixed(2)),
        sorted[2],
        sorted[5],
      ]),
      tags: [],
      explanation: `A median needs the readings IN ORDER first: ${joinList(sorted)}. Six readings have no single middle one, so the median is the average of the 3rd and 4th: (${sorted[2]} + ${sorted[3]}) ÷ 2 = ${median}. Averaging the 3rd and 4th of the LOGGED order (${Number(((data[2] + data[3]) / 2).toFixed(2))}) reads the order they arrived in as if it were their size, and ${Number(mean.toFixed(2))} is the mean — a different statistic that a stray large reading drags away.`,
      difficulty: mid4(r),
    };
  },

  // ── DATABASES & SQL ───────────────────────────────────────────────────────
  /** Band 4: TWO statements, where the second one counts rows the first one
   *  changed. The order matters, and so does the condition being applied after
   *  the update rather than before. */
  "databases-sql": (r) => {
    const subjects = ["computing", "maths", "science"];
    const want = r.pick(subjects);
    const others = subjects.filter((s) => s !== want);
    const bump = r.pick([5, 10, 15]);
    const cutoff = r.pick([60, 65, 70, 75]);
    const rows: Array<{ subject: string; mark: number }> = [];
    const wantCount = r.int(3, 6);
    const otherCount = r.int(2, 5);
    for (let i = 0; i < wantCount; i++) rows.push({ subject: want, mark: r.int(30, 85) });
    for (let i = 0; i < otherCount; i++) rows.push({ subject: r.pick(others), mark: r.int(30, 85) });
    // Shuffled from the seeded RNG, so the matching rows are not always the first
    // ones read and the learner has to apply the condition rather than count.
    for (let i = rows.length - 1; i > 0; i--) {
      const j = r.int(0, i);
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    const after = rows.map((x) => (x.subject === want ? { ...x, mark: x.mark + bump } : x));
    const correct = String(after.filter((x) => x.subject === want && x.mark >= cutoff).length);
    const beforeMatch = rows.filter((x) => x.subject === want && x.mark >= cutoff).length;
    const afterAll = after.filter((x) => x.subject === want).length;
    return {
      prompt: `The table results holds these rows:\n\n${rows.map((x, i) => `· id ${i + 1}: subject = ${x.subject}, mark = ${x.mark}`).join("\n")}\n\nUPDATE results SET mark = mark + ${bump} WHERE subject = '${want}';\nSELECT COUNT(*) FROM results WHERE subject = '${want}' AND mark >= ${cutoff};\n\nWhat number does the second statement return?`,
      correct,
      wrongs: distinct(correct, [
        // The update never applied.
        beforeMatch,
        // Every row of that subject counted, without the mark condition.
        afterAll,
        // The whole table counted.
        rows.length,
        // Only the rows whose marks were BELOW the cutoff, which are the ones
        // the update could have changed the answer for.
        afterAll - Number(correct),
        Number(correct) + 1,
      ]),
      tags: [],
      explanation: `Statement 1 adds ${bump} to the mark of every row whose subject is ${want} — and to those rows only. Statement 2 then counts the rows of that subject whose UPDATED mark is at least ${cutoff}: ${correct}. Counting before the update (${beforeMatch}) ignores statement 1; counting every row of the subject (${afterAll}) throws the mark condition away; and ${rows.length} is the whole table, which two WHERE clauses have both been dropped from.`,
      difficulty: mid4(r),
    };
  },
};
