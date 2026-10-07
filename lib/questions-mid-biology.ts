// ─────────────────────────────────────────────────────────────────────────────
// THE MISSING MIDDLE — biology.
//
// Three shapes of hole, all measured by `scripts/content-audit.mjs`:
//
//   · `microscopy` had families at 0.35–0.40 and 0.90–0.96 with nothing
//     between, so bands 3 and 4 were both unreachable for twenty-seven courses.
//   · `genetics` was the same shape, one band wide (band 4 unreachable).
//   · `enzymes` was missing band 3 AND band 5 — its content could only ever be
//     the middle of the ladder.
//   · `breathing-gas`, `diffusion` and `cells` topped out at 0.75–0.78, below
//     the 0.80 floor of band 5, so twenty-four courses declaring 0.80+ work
//     could never be served it at all.
//
// Neither cause is the serve search: the audit reports cause A = 0 for every
// course in the platform, and raising the production draw budget from 40 to 400
// changed nothing. There was nothing for the search to find.
//
// Every answer is COMPUTED — the magnification is actually applied, the
// expected offspring actually counted from the ratio, the ratios actually
// divided per row — rather than worked out in an author's head and typed. The
// `midband()` items print a table and the answer has to be derived from it,
// which is what the data-interpretation band means.
//
// Ceilings stay strictly below 0.90: these fill a hole in the middle of the
// ladder rather than competing with the subject's depth layer, and `verify`
// asserts a stage-0 learner is never offered a concept whose depth passes 0.9.
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

/** Band 3 (0.45–0.60): two linked steps. */
function mid3(r: DeepRng): number {
  return 0.47 + r.next() * 0.11;
}

/** Band 4 (0.60–0.80): three linked steps, with the values stated. */
function mid4(r: DeepRng): number {
  return 0.63 + r.next() * 0.14;
}

/** Band 5 (0.80–0.90), held under 0.90 on purpose: the answer is read OUT OF A
 *  TABLE the question prints. */
function midband(r: DeepRng): number {
  return 0.8 + r.next() * 0.06;
}

function table(rows: Array<[string, string]>): string {
  return rows.map(([a, b]) => `· ${a}: ${b}`).join("\n");
}

export const MID_BIOLOGY: Record<string, DeepGen> = {
  // ── MICROSCOPY ────────────────────────────────────────────────────────────
  /** Band 3: magnification applied, then the answer converted into millimetres.
   *  Band 4: the conversion the OTHER way — an image size in centimetres has to
   *  be taken back to micrometres before it can be divided by the magnification. */
  microscopy: (r) => {
    const real = r.pick([5, 10, 20, 40, 50, 100]);
    const mag = r.pick([100, 200, 400, 500, 1000]);
    if (r.next() < 0.5) {
      const imageMm = (real * mag) / 1000;
      const correct = `${num(imageMm, 3)} mm`;
      return {
        prompt: `A cell is ${real} μm across. It is viewed with a microscope at a magnification of ${mag}×. Work out the width of the cell's IMAGE, in millimetres.`,
        correct,
        wrongs: distinct(correct, [
          // The image size left in micrometres.
          `${num(real * mag, 3)} μm`,
          // Multiplied by 1000 instead of divided.
          `${num(real * mag * 1000, 3)} mm`,
          // The magnification quoted as a size.
          `${mag} mm`,
          // Only the real size, as if nothing had been magnified.
          `${num(real, 3)} mm`,
          `${num(imageMm + real, 3)} mm`,
        ]),
        tags: [],
        explanation: `Magnification compares two lengths in the SAME unit, so the unit is the second step, not an afterthought. First the image: ${real} μm × ${mag} = ${num(real * mag, 1)} μm. Then convert, because the question asks for millimetres and there are 1000 μm in a millimetre: ${num(real * mag, 1)} ÷ 1000 = ${correct}. Answering ${num(real * mag, 3)} μm is right in size and wrong in unit, which is worth no marks at all on a question that names the unit.`,
        difficulty: mid3(r),
      };
    }
    const imageCm = r.pick([1, 2, 4, 5, 8, 10]);
    const realUm = (imageCm * 10000) / mag;
    const correct = `${num(realUm, 2)} μm`;
    return {
      prompt: `An image of a cell measures ${imageCm} cm across at a magnification of ${mag}×. Work out the real width of the cell, in micrometres (1 cm = 10 000 μm).`,
      correct,
      wrongs: distinct(correct, [
        // The image size quoted as the real size.
        `${num(imageCm, 2)} μm`,
        // The conversion taken the wrong way.
        `${num((imageCm / 10000) / mag, 4)} μm`,
        // Multiplied by the magnification instead of divided.
        `${num(imageCm * 10000 * mag, 2)} μm`,
        // The micrometres not converted before dividing.
        `${num(imageCm / mag, 4)} μm`,
        `${num(realUm * mag, 2)} μm`,
      ]),
      tags: [],
      explanation: `mag = image ÷ real, so the real size is image ÷ mag — but only once both lengths are in the SAME unit. Convert first: ${imageCm} cm × 10 000 = ${imageCm * 10000} μm. Then divide: ${num(imageCm * 10000, 1)} ÷ ${mag} = ${correct}. Multiplying by the magnification (${num(imageCm * 10000 * mag, 2)} μm) turns a microscope into a shrink ray, and reporting ${num(imageCm, 2)} μm says the drawing is life-size.`,
      difficulty: mid4(r),
    };
  },

  // ── GENETICS ──────────────────────────────────────────────────────────────
  /** Band 4: the ratio has to be worked out from the genotypes, then turned
   *  into an EXPECTED COUNT out of a real number of offspring — three linked
   *  steps, and the middle one is the ratio itself. */
  genetics: (r) => {
    const testCross = r.next() < 0.5;
    const tally = r.int(4, 20) * 20; // divisible by 4, so 3/4 and 1/4 are whole
    // Tt × Tt gives 3 tall : 1 short; Tt × tt gives 1 tall : 1 short.
    const dominantShare = testCross ? 1 / 2 : 3 / 4;
    const dominantCount = tally * dominantShare;
    const recessiveCount = tally - dominantCount;
    const countDominant = r.next() < 0.5;
    const correct = String(countDominant ? dominantCount : recessiveCount);
    const parents = testCross ? "Tt × tt" : "Tt × Tt";
    const want = countDominant ? "tall" : "short";
    const ratio = testCross ? "1 : 1" : "3 : 1";
    return {
      prompt: `In pea plants, the allele T (tall) is dominant over t (short). Two plants with the genotypes ${parents} are crossed and produce ${tally} offspring.\n\nHow many of the offspring would you EXPECT to be ${want}?`,
      correct,
      wrongs: distinct(correct, [
        // The other class counted.
        countDominant ? recessiveCount : dominantCount,
        // Everybody, as if the cross were pure-breeding.
        tally,
        // Half of them, whichever cross it was.
        tally / 2,
        // The ratio's parts quoted as a count.
        testCross ? 1 : 3,
        countDominant ? recessiveCount / 2 : dominantCount + tally / 4,
      ]),
      tags: [],
      explanation: `Three steps, and the middle one is the step students skip. (1) Work out the gametes and the ratio: ${parents} gives ${ratio}. (2) Turn the ratio into a fraction of the offspring: ${testCross ? "one part in two, that is 1/2" : "three parts in four, that is 3/4"}. (3) Apply it to the real number born: ${tally} × ${testCross ? "1/2" : "3/4"} = ${correct}. "Expected" is a PROPORTION applied to a real total — answering ${tally} says every plant must show the dominant feature, and ${testCross ? 1 : 3} reports the ratio itself as though it were a count of plants.`,
      difficulty: mid4(r),
    };
  },

  // ── ENZYMES ───────────────────────────────────────────────────────────────
  /** Band 3: a rate, then the unit conversion — a rate question is never just
   *  one division when the units asked for are not the units given. Band 5: the
   *  rate has to be read out of a table of pH against rate, and half the
   *  maximum is nowhere in it. */
  enzymes: (r) => {
    if (r.next() < 0.5) {
      const time = r.pick([10, 15, 20, 30]);
      const volume = r.pick([5, 10, 20, 30, 40, 60]);
      const perMin = (volume / time) * 60;
      const correct = `${num(perMin, 2)} cm³ per minute`;
      return {
        prompt: `An enzyme-catalysed reaction produces ${volume} cm³ of gas in ${time} seconds. Work out the rate of reaction in cm³ per MINUTE.`,
        correct,
        wrongs: distinct(correct, [
          // The rate per second, which is a different unit.
          `${num(volume / time, 2)} cm³ per minute`,
          // Divided by 60 instead of multiplied.
          `${num(volume / time / 60, 2)} cm³ per minute`,
          // The volume with no rate in it.
          `${volume} cm³ per minute`,
          // The time quoted as the rate.
          `${time} cm³ per minute`,
          `${num(perMin * 60, 2)} cm³ per minute`,
        ]),
        tags: [],
        explanation: `A rate is an amount divided by a time, and the answer has to come out in the units the question asks for. Per second: ${volume} ÷ ${time} = ${num(volume / time, 2)} cm³/s. There are 60 seconds in a minute, so the rate is ${num(volume / time, 2)} × 60 = ${correct}. Answering ${num(volume / time, 2)} cm³ per minute is the per-second rate wearing the per-minute label — the number is right for a unit nobody asked for, which is why the unit is printed in the answer.`,
        difficulty: mid3(r),
      };
    }
    // A table of pH against rate: find the pH at which the rate is HALF the
    // maximum, which needs the maximum found first.
    const base = r.int(20, 44);
    const optIdx = r.int(1, 4); // the optimum is never the first or last row
    const halfIdx = optIdx - 1; // exactly one row sits at half the maximum
    const phs = [3, 4, 5, 6, 7, 8, 9];
    // BUILT, not sampled: one row is the maximum, one row is exactly half of
    // it, and every other row is off the half-value by a known amount — so
    // "half the maximum" matches exactly one row on every draw.
    const others = [base - 9, base + 6, base - 15, base + 11, base + 17, base - 4].filter((x) => x > 0);
    let next = 0;
    const rates = phs.map((_, i) => {
      if (i === optIdx) return base * 2;
      if (i === halfIdx) return base;
      return others[next++ % others.length];
    });
    const correct = `pH ${phs[halfIdx]}`;
    return {
      prompt: `A table shows the rate of an enzyme-controlled reaction at different pH values.\n${table(phs.map((p, i) => [`pH ${p}`, `${rates[i]} units`]))}\n\nAt which pH is the rate HALF of the maximum rate?`,
      correct,
      wrongs: distinct(correct, phs.map((p) => `pH ${p}`)),
      tags: [],
      explanation: `Two steps, and the first one is the one that gets skipped: find the MAXIMUM in the table first. The highest rate is ${base * 2} units, at pH ${phs[optIdx]}. Half of that is ${base} units, and the table shows exactly ${base} units at ${correct}. Halving the pH NUMBER instead (${num(phs[optIdx] / 2, 1)}) answers a question about the column heading rather than about the rate — the axis and the value are different quantities, and only one of them was asked about.`,
      difficulty: midband(r),
    };
  },

  // ── BREATHING & GAS EXCHANGE ──────────────────────────────────────────────
  /** Band 5: three people's breath volumes and rates have to be multiplied out
   *  before any of them can be compared — the table gives neither product. */
  "breathing-gas": (r) => {
    const names = ["a resting adult", "a runner during a race", "a sleeping child", "a swimmer under water"];
    const rows = names.map((n) => {
      const volume = r.pick([0.4, 0.5, 0.8, 1.2, 2, 3]);
      const rate = r.pick([8, 10, 12, 15, 20, 30, 40]);
      return { n, volume, rate, perMin: volume * rate };
    });
    let best = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].perMin > rows[best].perMin) best = i;
    let fastest = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].rate > rows[fastest].rate) fastest = i;
    let biggest = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].volume > rows[biggest].volume) biggest = i;
    let worst = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].perMin < rows[worst].perMin) worst = i;
    const correct = rows[best].n;
    return {
      prompt: `A table records the breathing of four people.\n${table(rows.map((x) => [x.n, `${x.volume} dm³ per breath, ${x.rate} breaths per minute`]))}\n\nWho breathes the GREATEST VOLUME of air per minute?`,
      correct,
      // The teaching distractors come first, but the full list of names is
      // appended: one person can be both the deepest breather AND the highest
      // volume per minute, and when that happens the first three candidates
      // collapse and the assembler pads the question with "None of these" —
      // measured, not guessed (the question audit failed this family on exactly
      // that). Appending the names guarantees three distinct wrongs.
      wrongs: distinct(correct, [
        // The fastest breathing rate, which is only part of the answer.
        rows[fastest].n,
        // The deepest single breath.
        rows[biggest].n,
        // The person with the smallest volume per minute.
        rows[worst].n,
        ...rows.map((x) => x.n),
      ]),
      tags: [],
      explanation: `The table gives a volume PER BREATH and a RATE, and neither is the answer on its own — they have to be multiplied: ${rows.map((x) => `${x.n}: ${x.volume} × ${x.rate} = ${num(x.perMin, 2)} dm³ per minute`).join("; ")}. The greatest total is ${correct}. Answering ${rows[fastest].n} counts breaths rather than air, and ${rows[biggest].n} counts one deep breath as if the rate did not matter — a fast shallow breath and a slow deep one move very different amounts of air.`,
      difficulty: midband(r),
    };
  },

  // ── DIFFUSION ─────────────────────────────────────────────────────────────
  /** Band 5: a distance and a time per run means the SPEED of diffusion has to
   *  be computed for every row before the fastest can be named. */
  diffusion: (r) => {
    const conditions = ["in water at 5 °C", "in water at 20 °C", "in water at 40 °C", "in a gel at 20 °C", "as a gas at 20 °C"];
    const picked = r.shuffle(conditions).slice(0, 4);
    const rows = picked.map((c) => {
      const dist = r.pick([10, 20, 30, 40, 50, 60, 80]);
      const time = r.pick([5, 10, 20, 25, 40, 50]);
      return { c, dist, time, speed: dist / time };
    });
    let best = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].speed > rows[best].speed) best = i;
    let longest = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].dist > rows[longest].dist) longest = i;
    let shortest = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].time < rows[shortest].time) shortest = i;
    let slowest = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].speed < rows[slowest].speed) slowest = i;
    const correct = rows[best].c;
    return {
      prompt: `A table records how far a coloured substance diffused in different conditions.\n${table(rows.map((x) => [x.c, `${x.dist} mm in ${x.time} s`]))}\n\nIn which condition did the substance diffuse FASTEST?`,
      correct,
      wrongs: distinct(correct, [
        // The longest distance, which says nothing without the time.
        rows[longest].c,
        // The shortest time, which says nothing without the distance.
        rows[shortest].c,
        // The slowest rate.
        rows[slowest].c,
      ]),
      tags: [],
      explanation: `"Fastest" is a RATE, and the table gives two different quantities — a distance and a time — so neither column can be compared on its own. The rate is distance ÷ time for each row: ${rows.map((x) => `${x.c}: ${x.dist} ÷ ${x.time} = ${num(x.speed, 2)} mm/s`).join("; ")}. The fastest is ${correct}. Answering ${rows[longest].c} is the longest DISTANCE, which may simply have had longer to happen, and ${rows[shortest].c} is the shortest time, which may have covered almost nothing.`,
      difficulty: midband(r),
    };
  },

  // ── CELLS ─────────────────────────────────────────────────────────────────
  /** Band 5: a surface-area-to-volume RATIO per cell — two computations per row
   *  before the comparison can be made. */
  cells: (r) => {
    const labels = ["cell A", "cell B", "cell C", "cell D"];
    // BUILT, not sampled. Two random surface areas and volumes collide on the
    // same ratio far more often than they look like they should (6/2 and 12/4
    // are both 3), and a table with two greatest ratios is not a question — so
    // the RATIOS are chosen distinct and the surface areas derived from them.
    const vols = [2, 3, 4, 6];
    const ratios = r.shuffle([1, 2, 3, 4, 6, 8, 9]).slice(0, 4);
    const rows = labels.map((l, i) => ({ l, vol: vols[i], ratio: ratios[i], sa: ratios[i] * vols[i] }));
    let best = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].ratio > rows[best].ratio) best = i;
    const correct = rows[best].l;
    return {
      prompt: `A table gives the surface area and volume of four cells.\n${table(rows.map((x) => [x.l, `surface area ${x.sa} mm², volume ${x.vol} mm³`]))}\n\nWhich cell has the GREATEST surface area to volume RATIO?`,
      correct,
      wrongs: distinct(correct, rows.map((x) => x.l)),
      tags: [],
      explanation: `A ratio is one quantity divided by the other, so the table's two columns have to be combined rather than compared: ${rows.map((x) => `${x.l}: ${x.sa} ÷ ${x.vol} = ${num(x.ratio, 2)}`).join("; ")}. ${correct} has the greatest ratio. The biggest surface area (${rows.reduce((a, x) => (x.sa > a.sa ? x : a)).l}) is not the same thing, and neither is the smallest volume — which is why diffusion is fast into a small cell and slows as a cell grows: volume rises faster than surface area, so the ratio falls.`,
      difficulty: midband(r),
    };
  },
};
