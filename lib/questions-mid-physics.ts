// ─────────────────────────────────────────────────────────────────────────────
// THE MISSING MIDDLE — physics.
//
// Two different holes, both measured by `scripts/content-audit.mjs`, and both
// filled here:
//
//   · `atoms-nucleus` had a base family at 0.25–0.40 and a depth family at
//     0.90–0.96 with NOTHING between, so band 4 (0.60–0.80) was unreachable
//     for twenty-five courses.
//   · `waves-basics`, `motion-graphs` and `energy-conservation` topped out at
//     0.78 — below the 0.80 floor of band 5 — so twenty-four courses declaring
//     0.80+ work could never be served it at all. The midband() items below are
//     written at 0.80–0.86: the answer is read OUT OF A TABLE the question
//     prints, which is what the data-interpretation band means.
//
// The cause of neither is the serve search: the audit reports cause A = 0 for
// every course in the platform, and raising the production draw budget from 40
// to 400 changed nothing. There was nothing for the search to find.
//
// Every answer is COMPUTED from the table the generator prints, so the key
// cannot drift from the item. The distractors are the specific misreadings the
// table invites: reporting one of the table's own cells, using the wrong pair
// of rows, adding where the question asks for a difference, or stopping before
// the unit conversion the question asks for.
//
// Ceilings stay strictly below 0.90 — these fill a hole in the middle of the
// ladder, they do not compete with the subject's depth layer, and `verify`
// asserts that a stage-0 learner is never offered a concept whose depth passes
// 0.9.
// ─────────────────────────────────────────────────────────────────────────────
import type { DeepGen, DeepRng } from "./questions-deep";

/** The first `n` candidates genuinely different from the answer and each other.
 *  Fewer than three distinct wrongs and the assembler falls back to filler,
 *  which the question audit rightly calls a broken item. */
function distinct(correct: string, candidates: readonly (string | number)[], n = 3): string[] {
  const out: string[] = [];
  for (const cand of candidates) {
    const s = String(cand);
    if (s !== correct && !out.includes(s) && out.length < n) out.push(s);
  }
  return out;
}

/** A number a student would write: never a floating-point tail. */
function num(x: number, dp = 2): string {
  return String(Number(x.toFixed(dp)));
}

/** Band 4 (0.60–0.80): three linked steps, with the values stated. */
function mid4(r: DeepRng): number {
  return 0.63 + r.next() * 0.14;
}

/** Band 5 (0.80–0.90), held under 0.90 on purpose: the answer is read OUT OF A
 *  TABLE, which is what the data-interpretation band means. */
function midband(r: DeepRng): number {
  return 0.8 + r.next() * 0.06;
}

export const MID_PHYSICS: Record<string, DeepGen> = {
  // ── ATOMS & NUCLEI ────────────────────────────────────────────────────────
  /** Band 4: a relative atomic mass from two isotopes' abundances — two
   *  weighted products, a sum, and a divide, which is three linked steps and
   *  the standard reason the table of isotopes exists. */
  "atoms-nucleus": (r) => {
    const pct = r.pick([20, 25, 30, 40, 50, 60, 75, 80]);
    const qPct = 100 - pct;
    const m1 = r.int(20, 60);
    let m2 = m1 + r.int(1, 4);
    if (m2 === m1) m2 += 1;
    const weighted = (pct * m1 + qPct * m2) / 100;
    const correct = num(weighted, 2);
    return {
      prompt: `An element has two stable isotopes.\n· isotope 1: mass number ${m1}, abundance ${pct}%\n· isotope 2: mass number ${m2}, abundance ${qPct}%\n\nWork out the element's relative atomic mass. Give your answer to 2 decimal places.`,
      correct,
      wrongs: distinct(correct, [
        // The plain average of the two mass numbers — correct only at 50%.
        num((m1 + m2) / 2, 2),
        // The heavier isotope's mass number quoted on its own.
        m2,
        // The weighted sum never divided by 100.
        num((pct * m1 + qPct * m2) / 1, 2),
        // The abundances multiplied instead of weighting the masses.
        num((pct * qPct) / 100, 2),
        num((pct * m2 + qPct * m1) / 100, 2),
      ]),
      tags: [],
      explanation: `An average mass is WEIGHTED by how much of each isotope there is. Each isotope contributes its abundance as a fraction times its mass number: ${pct}% gives ${pct}/100 × ${m1} = ${num((pct * m1) / 100, 2)} and ${qPct}% gives ${qPct}/100 × ${m2} = ${num((qPct * m2) / 100, 2)}. Adding those gives ${correct}. Averaging the two mass numbers (${num((m1 + m2) / 2, 2)}) ignores the abundances completely, and ${num((pct * m1 + qPct * m2) / 1, 2)} is the same sum before it is divided by 100 — a number a hundred times too big.`,
      difficulty: mid4(r),
    };
  },

  // ── WAVES ─────────────────────────────────────────────────────────────────
  /** Band 5: four waves' speeds and wavelengths are given in a table; the
   *  frequency of each has to be computed before they can be compared. */
  "waves-basics": (r) => {
    const names = ["sound in air", "a radio wave", "a water wave", "an ultrasound pulse"];
    const rows = names.map((n) => {
      const speed = r.pick([340, 1500, 3000, 6000]);
      const wave = r.pick([0.5, 1, 2, 2.5, 4, 5]);
      return { n, speed, wave, f: speed / wave };
    });
    // The fastest frequency, and the two tables that make it a comparison
    // rather than a lookup.
    let best = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].f > rows[best].f) best = i;
    let worst = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].f < rows[worst].f) worst = i;
    let fastestSpeed = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].speed > rows[fastestSpeed].speed) fastestSpeed = i;
    let longest = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].wave > rows[longest].wave) longest = i;
    const correct = rows[best].n;
    return {
      prompt: `A table records four waves.\n${rows.map((x) => `· ${x.n}: speed ${x.speed} m/s, wavelength ${x.wave} m`).join("\n")}\n\nWhich wave has the HIGHEST frequency?`,
      correct,
      // The teaching distractors come FIRST, but the full list of names is
      // appended: one wave can be both the fastest AND the highest-frequency,
      // and when that happens the first three candidates collapse to fewer than
      // three distinct wrongs and the assembler pads the question with "None of
      // these" — measured, not guessed (the question audit failed this family
      // on exactly that). Appending the names guarantees three.
      wrongs: distinct(correct, [
        // The highest speed, read as the highest frequency.
        rows[fastestSpeed].n,
        // The longest wavelength.
        rows[longest].n,
        // The lowest frequency.
        rows[worst].n,
        ...rows.map((x) => x.n),
      ]),
      tags: [],
      explanation: `The table gives speed and wavelength, not frequency, so none of these numbers may be compared as they stand. The wave equation, v = f λ, has to be rearranged first: f = v ÷ λ. Computing each row gives ${rows.map((x) => `${x.n}: ${x.speed} ÷ ${x.wave} = ${num(x.f, 2)} Hz`).join("; ")}. The highest is ${correct}. Answering ${rows[fastestSpeed].n} reads the fastest SPEED as the highest frequency, which is only true when the wavelengths match — and ${rows[longest].n} does the same with the wavelength, which is inversely related to frequency.`,
      difficulty: midband(r),
    };
  },

  // ── MOTION GRAPHS ─────────────────────────────────────────────────────────
  /** Band 5: the speed has to be read out of the table between two of its rows,
   *  which is the gradient of a distance–time graph in numerical form. */
  "motion-graphs": (r) => {
    const t0 = r.int(2, 6);
    const t1 = t0 + r.int(4, 10);
    const v = r.pick([2, 3, 4, 5, 6, 8, 10]);
    // The table starts with a stationary period, so the total distance over the
    // total time is deliberately NOT the answer.
    const d0 = r.int(10, 40);
    const d1 = d0 + v * (t1 - t0);
    const totalTime = t1 + r.int(2, 6);
    const totalDist = d1 + v * 2;
    const rows: Array<[number, number]> = [
      [0, 0],
      [t0, d0],
      [t1, d1],
      [totalTime, totalDist],
    ];
    const correct = `${num((d1 - d0) / (t1 - t0), 2)} m/s`;
    return {
      prompt: `A distance–time graph is drawn from this table.\n${rows.map(([t, d]) => `· time ${t} s, distance ${d} m`).join("\n")}\n\nWhat is the object's speed between ${t0} s and ${t1} s?`,
      correct,
      wrongs: distinct(correct, [
        // The average speed over the WHOLE journey, which includes the
        // stationary part at the start.
        `${num(totalDist / totalTime, 2)} m/s`,
        // The distance divided by the wrong time, or the time quoted as a
        // speed.
        `${num(d1 / t1, 2)} m/s`,
        `${num(t1 - t0, 2)} m/s`,
        // The distance covered, not the rate of covering it.
        `${num(d1 - d0, 2)} m/s`,
        `${num((d1 + d0) / (t1 - t0), 2)} m/s`,
      ]),
      tags: [],
      explanation: `A distance–time graph shows speed as its GRADIENT, so the question is about one segment, not the whole line. Between ${t0} s and ${t1} s the distance goes from ${d0} m to ${d1} m — a change of ${d1 - d0} m — over a time of ${t1} − ${t0} = ${t1 - t0} s. So the speed is ${d1 - d0} ÷ ${t1 - t0} = ${correct}. Dividing the whole distance by the whole time (${num(totalDist / totalTime, 2)} m/s) answers "average speed over the journey", and the table's first rows were put there to make the two numbers different.`,
      difficulty: midband(r),
    };
  },

  // ── ENERGY CONSERVATION ───────────────────────────────────────────────────
  /** Band 5: the energy lost to friction is the DIFFERENCE between two rows of
   *  gravitational potential energy, each of which has to be computed first. */
  "energy-conservation": (r) => {
    const mass = r.pick([0.5, 1, 1.5, 2, 2.5, 4]);
    const g = 10;
    const h1 = r.int(2, 12);
    const h2 = h1 - r.int(1, Math.max(1, h1 - 1));
    const gpe1 = mass * g * h1;
    const gpe2 = mass * g * h2;
    const lost = gpe1 - gpe2;
    const correct = `${num(lost, 2)} J`;
    return {
      prompt: `A ball of mass ${num(mass, 2)} kg is released from a height of ${h1} m and caught at a height of ${h2} m. A table of its gravitational potential energy has been worked out for two heights (take g = ${g} N/kg):\n· at ${h1} m: ${deepNumCell(gpe1)} J\n· at ${h2} m: ${deepNumCell(gpe2)} J\n\nIt is moving slower than a frictionless fall would explain. How much energy was transferred to the surroundings?`,
      correct,
      wrongs: distinct(correct, [
        // The energy at the top, not the amount that went missing.
        `${num(gpe1, 2)} J`,
        // The energy at the bottom.
        `${num(gpe2, 2)} J`,
        // The two energies added.
        `${num(gpe1 + gpe2, 2)} J`,
        `${num(h1 - h2, 2)} J`,
        `${num(lost * 2, 2)} J`,
      ]),
      tags: [],
      explanation: `The table already holds both potential energies, so the loss is a DIFFERENCE: ${num(gpe1, 2)} J at the top minus ${num(gpe2, 2)} J where it was caught = ${correct}. Energy is conserved, so the missing amount went to the surroundings as heat and sound rather than disappearing. Reporting ${num(gpe1, 2)} J is the energy at the start, not the part that was lost, and ${num(gpe2, 2)} J is what is still stored — neither is the amount that changed form.`,
      difficulty: midband(r),
    };
  },
};

/** A table cell a student would write: no float tail, no trailing zeros beyond
 *  what the value needs. */
function deepNumCell(x: number): string {
  return String(Number(x.toFixed(3)));
}
