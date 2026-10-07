// ─────────────────────────────────────────────────────────────────────────────
// THE BIOLOGY DEPTH LAYER.
//
// Why it exists. `npm run gate:ceiling` asks every advanced course whether the
// MEDIAN concept it serves can reach the depth the course declares, and biology
// failed every advanced one — A2, IB HL, AP, Class 11–12, ISC, HSC and the
// independent pathway — at a median of 0.75 against declarations of 0.78 to
// 0.90. Nothing in the subject reached 0.80, so the ceiling itself was the
// limit: however strong a learner was, biology could not ask them a question at
// the level their course is examined at.
//
// WHAT MAKES THIS LAYER SAFE TO AUTHOR. Every answer is COMPUTED by the
// generator from the data the item prints — a Punnett square is enumerated
// rather than remembered, a quadrat estimate multiplies the counts it shows, an
// allele frequency is squared, a food chain's losses are applied twice, an
// insulin dose adds its two rules — instead of being worked out in an author's
// head and typed. The key cannot drift from the item, because the item is
// generated FROM the key, and each distractor names a real slip: a single
// trophic step instead of two, the mean quoted as the population, a genotype
// ratio confused with a phenotype one, unit conversion left out.
//
// THE BAND IS THE POINT: every family declares 0.90–0.96, the band these
// courses ask for, because each item chains several steps and reads its inputs
// out of a table. The content sweep in `npm run verify` holds each family to
// that over 240 draws, along with the four-option contract.
//
// WHAT IT IS NOT: a claim that multiple choice examines practical work or
// extended writing. The demand ladder still ends at data_interpretation, and
// `extended_response` stays out of `SKILLS_IN_BANK` exactly as before.
//
// Only TYPES are imported from the maths depth layer: questions.ts composes THIS
// record, so a value-level import back would close a module cycle.
// ─────────────────────────────────────────────────────────────────────────────
import type { DeepGen, DeepRng } from "./questions-deep";

function distinct(correct: string, candidates: readonly (string | number)[], n = 3): string[] {
  const out: string[] = [];
  for (const cand of candidates) {
    const s = String(cand);
    if (s !== correct && !out.includes(s) && out.length < n) out.push(s);
  }
  return out;
}

/** A number a student would write: at most three decimals, no float tail. */
function num(x: number, dp = 3): string {
  return x.toFixed(dp).replace(/\.?0+$/, "");
}

/** The band every family here earns. Written as a helper so no family can
 *  quietly drop back into the recall band while being described as deep. */
function hardest(r: DeepRng): number {
  return 0.9 + r.next() * 0.06;
}

export const BIOLOGY_DEEP: Record<string, DeepGen> = {
  /** Magnification rearranged for the ACTUAL size, with mm converted to µm —
   *  the conversion is half the question. */
  microscopy: (r) => {
    const imageMm = r.pick([20, 40, 50, 80, 100, 120]);
    const mag = r.pick([500, 1000, 2000, 2500, 4000]);
    const actualMm = imageMm / mag;
    const actualUm = actualMm * 1000;
    const correct = `${num(actualUm)} µm`;
    return {
      // ONE LINE WHERE THE PROMPT IS PROSE. `readableOption` (lib/transfer.ts)
      // refuses a multi-part stem in a choice list, so a two-sentence question
      // that needs no break must not carry one — with a break, this concept
      // loses its inverse (transfer) surface at that band. Prompts that really
      // print a table or a list keep their breaks and fall back to `direct`.
      prompt: `A cell measures ${imageMm} mm across on a micrograph taken at a magnification of ×${mag}. What is the ACTUAL length of the cell?`,
      correct,
      wrongs: distinct(correct, [
        // The millimetre value left unconverted (0.02 "µm").
        `${num(actualMm)} µm`,
        // Multiplied instead of divided.
        `${num(imageMm * mag)} µm`,
        // The conversion applied twice.
        `${num(actualUm * 1000)} µm`,
        // The micrograph size quoted as the real one.
        `${num(imageMm)} µm`,
        // Half, for the collapse case.
        `${num(actualUm / 2)} µm`,
      ]),
      tags: [],
      explanation: `Magnification = image size ÷ actual size, so actual size = image size ÷ magnification = ${imageMm} mm ÷ ${mag} = ${num(actualMm)} mm. A cell is measured in micrometres, and there are 1000 µm in a millimetre, so that is ${num(actualMm)} × 1000 = ${correct}. Reporting ${num(actualMm)} µm is the answer in the wrong unit and it is 1000 times too small — the conversion is not decoration, it is the difference between a cell and a tenth of one.`,
      difficulty: hardest(r),
    };
  },

  /** A monohybrid cross ENUMERATED: the phenotype percentage comes out of the
   *  square, not out of a remembered ratio. */
  genetics: (r) => {
    const crosses: Array<[string, string]> = [["Bb", "Bb"], ["Bb", "bb"], ["BB", "Bb"], ["BB", "bb"], ["bb", "bb"], ["Bb", "BB"]];
    const [mum, dad] = r.pick(crosses);
    const gametes = (g: string) => [g[0], g[1]];
    const offspring: string[] = [];
    for (const a of gametes(mum)) for (const b of gametes(dad)) offspring.push([a, b].sort().join(""));
    const dominant = offspring.filter((g) => /[A-Z]/.test(g)).length;
    const pct = (dominant / offspring.length) * 100;
    const correct = `${num(pct)}%`;
    const recessivePct = 100 - pct;
    return {
      prompt: `In a species of plant, the allele for purple flowers (B) is dominant to the allele for white flowers (b).\n\nTwo plants are crossed:\n\n· parent 1: ${mum}\n· parent 2: ${dad}\n\nWhat percentage of the offspring are expected to have PURPLE flowers?`,
      correct,
      wrongs: distinct(correct, [
        // The genotype ratio given as the phenotype one.
        `${num(pct / 2)}%`,
        // The recessive percentage.
        `${num(recessivePct)}%`,
        // One quarter, for every cross.
        "25%",
        // One half, for every cross.
        "50%",
        // Three quarters, for every cross.
        "75%",
        // The percentage of the tail, so a 100% or 0% cross still has options.
        `${num(pct === 100 ? 0 : 100)}%`,
        `${num(pct + 25 > 100 ? pct - 25 : pct + 25)}%`,
      ]),
      tags: [],
      explanation: `Work the cross out rather than quoting a ratio. ${mum} gives gametes ${gametes(mum).join(" or ")}, ${dad} gives ${gametes(dad).join(" or ")}, and the four combinations are ${offspring.join(", ")}. ${dominant} of the 4 contain at least one B, so ${num(pct)}% show the dominant phenotype. The 3 : 1 ratio only applies to a cross of two heterozygotes — with ${mum} × ${dad} the answer is ${correct}, and a ratio remembered rather than derived gets this question wrong.`,
      difficulty: hardest(r),
    };
  },

  /** Cardiac output: stroke volume × heart rate, converted to dm³/min. */
  circulation: (r) => {
    const stroke = r.pick([60, 70, 80, 90, 100]);
    const rate = r.pick([50, 60, 72, 75, 80, 90, 100]);
    const output = (stroke * rate) / 1000;
    const correct = `${num(output)} dm³/min`;
    return {
      prompt: `A student's stroke volume is ${stroke} cm³ and their heart rate is ${rate} beats per minute. What is their cardiac output?`,
      correct,
      wrongs: distinct(correct, [
        // Left in cm³.
        `${num(stroke * rate)} dm³/min`,
        // Rate converted per second instead of per minute.
        `${num((stroke * rate) / 60)} dm³/min`,
        // Divided instead of multiplied.
        `${num(stroke / rate)} dm³/min`,
        // The stroke volume alone.
        `${num(stroke)} dm³/min`,
        // Half, for the collapse case.
        `${num(output / 2)} dm³/min`,
      ]),
      tags: [],
      explanation: `Cardiac output = stroke volume × heart rate = ${stroke} cm³ × ${rate} = ${num(stroke * rate)} cm³ per minute. There are 1000 cm³ in a dm³ (a litre), so that is ${num(stroke * rate)} ÷ 1000 = ${correct}. Quoting ${num(stroke * rate)} dm³/min means five litres a beat rather than five litres a minute — the unit is what makes the number mean anything, and a resting adult's whole output is about 5 dm³/min.`,
      difficulty: hardest(r),
    };
  },

  /** Impulse speed along a neurone: millimetres over milliseconds, in m/s —
   *  two conversions, in opposite directions. */
  "nervous-system": (r) => {
    const distanceMm = r.pick([300, 600, 900, 1200, 1500]);
    const timeMs = r.pick([1, 2, 3, 4, 5]);
    const speed = distanceMm / timeMs;
    const correct = `${num(speed)} m/s`;
    return {
      prompt: `A nerve impulse travels ${distanceMm} mm along a neurone in ${num(timeMs)} ms. What is its speed?`,
      correct,
      wrongs: distinct(correct, [
        // Both units left as they are and read as SI.
        `${num((distanceMm / 1000) / timeMs)} m/s`,
        // The conversions applied the wrong way round.
        `${num(distanceMm * timeMs)} m/s`,
        // Multiplied instead of divided.
        `${num(distanceMm * 1000 / timeMs)} m/s`,
        // The distance quoted as a speed.
        `${num(distanceMm)} m/s`,
        // Half, for the collapse case.
        `${num(speed / 2)} m/s`,
      ]),
      tags: [],
      explanation: `Convert BOTH: ${distanceMm} mm = ${num(distanceMm / 1000)} m, and ${num(timeMs)} ms = ${num(timeMs / 1000)} s. Dividing those gives ${num(distanceMm / 1000)} ÷ ${num(timeMs / 1000)} = ${correct} — and the two conversions cancel, which is why the answer is simply ${distanceMm} ÷ ${timeMs}. Leaving the distance in millimetres (${num((distanceMm / 1000) / timeMs)} m/s) is a thousand times too slow: a myelinated neurone manages around 100 m/s, so a two-figure answer is the sanity check that catches it.`,
      difficulty: hardest(r),
    };
  },

  /** Hardy–Weinberg applied to one allele: q² is the proportion showing the
   *  recessive phenotype. */
  evolution: (r) => {
    const q = r.pick([0.1, 0.2, 0.3, 0.4, 0.5]);
    const p = Number((1 - q).toFixed(2));
    const recessive = q * q * 100;
    const correct = `${num(recessive)}%`;
    return {
      prompt: `In a population in Hardy–Weinberg equilibrium, the frequency of a recessive allele (q) is ${num(q)}. What percentage of the population shows the recessive PHENOTYPE?`,
      correct,
      wrongs: distinct(correct, [
        // The allele frequency itself.
        `${num(q * 100)}%`,
        // Double the allele frequency (the heterozygote term misused).
        `${num(2 * q * 100)}%`,
        // The homozygous dominant term.
        `${num(p * p * 100)}%`,
        // The dominant phenotype.
        `${num((1 - q * q) * 100)}%`,
        // The heterozygote term.
        `${num(2 * p * q * 100)}%`,
      ]),
      tags: [],
      explanation: `Only the homozygous recessive genotype shows the recessive phenotype, and its frequency is q²: ${num(q)}² = ${num(q * q)}, so ${correct} of the population. The frequency of the ALLELE (${num(q * 100)}%) is not the frequency of the PHENOTYPE — recessive alleles hide in heterozygotes, which is why a rare recessive allele affects far fewer people than its frequency suggests.`,
      difficulty: hardest(r),
    };
  },

  /** Energy through a food chain: the transfer is applied at every step, not
   *  once. */
  ecosystems: (r) => {
    const producers = r.pick([20000, 50000, 80000, 100000, 250000]);
    const efficiency = r.pick([5, 10, 12, 15, 20]);
    const primary = (producers * efficiency) / 100;
    const secondary = (primary * efficiency) / 100;
    const correct = `${num(secondary)} kJ`;
    return {
      prompt: `A food chain starts with producers holding ${producers} kJ of energy, and only ${efficiency}% of the energy at each level passes to the next. How much energy reaches the SECONDARY consumers (the third trophic level)?`,
      correct,
      wrongs: distinct(correct, [
        // One transfer applied instead of two.
        `${num(primary)} kJ`,
        // Both percentages applied but a division missed.
        `${num((producers * efficiency * efficiency) / 100)} kJ`,
        // The percentage applied twice as a division.
        `${num(producers / efficiency / efficiency)} kJ`,
        // The producers' energy, three times the correction.
        `${num(producers * efficiency * efficiency)} kJ`,
        // Half, for the collapse case.
        `${num(secondary / 2)} kJ`,
      ]),
      tags: [],
      explanation: `Apply the loss at EVERY step. Producers → primary consumers: ${producers} × ${efficiency}% = ${num(primary)} kJ. Primary → secondary consumers: ${num(primary)} × ${efficiency}% = ${correct}. Applying the ${efficiency}% once (${num(primary)} kJ) stops a step short, and that shortfall is the reason food chains are short: after three transfers only about a thousandth of the original energy is left.`,
      difficulty: hardest(r),
    };
  },

  /** Quadrat sampling: the mean per quadrat scaled to the whole area. */
  biodiversity: (r) => {
    const counts = [r.int(1, 9), r.int(2, 10), r.int(1, 8), r.int(2, 12), r.int(1, 7), r.int(2, 11)];
    const n = counts.length;
    const total = counts.reduce((s, x) => s + x, 0);
    const mean = total / n;
    const quadratArea = r.pick([0.25, 0.5, 1]);
    const fieldArea = r.pick([100, 200, 400, 500]);
    const estimate = mean * (fieldArea / quadratArea);
    const correct = num(estimate, 0);
    return {
      prompt: `A student counts a plant in ${n} quadrats of ${num(quadratArea)} m² each:\n\n${counts.map((c, i) => `· quadrat ${i + 1}: ${c}`).join("\n")}\n\nThe field has an area of ${fieldArea} m².\n\nWhat is the best estimate of the population in the field?`,
      correct,
      wrongs: distinct(correct, [
        // The mean per quadrat quoted as the population.
        num(mean, 2),
        // The counts added.
        String(total),
        // Scaled by the field area with the quadrat area ignored.
        num(mean * fieldArea, 0),
        // The quadrats counted as if they were the whole field.
        num(total * (fieldArea / quadratArea) / n / n, 0),
        // Half, for the collapse case.
        num(estimate / 2, 0),
      ]),
      tags: [],
      explanation: `Find the mean per quadrat first: (${counts.join(" + ")}) ÷ ${n} = ${num(mean, 2)} plants per ${num(quadratArea)} m². Then scale to the whole field by asking how many quadrats fit in it: ${fieldArea} ÷ ${num(quadratArea)} = ${num(fieldArea / quadratArea)} quadrats, so the estimate is ${num(mean, 2)} × ${num(fieldArea / quadratArea)} = ${correct}. Quoting the mean (${num(mean, 2)}) is the estimate for ONE quadrat — sampling only lets you scale up because the quadrats are meant to be representative, which is why they are placed randomly.`,
      difficulty: hardest(r),
    };
  },

  /** Herd immunity: the shortfall against a threshold, not the number
   *  unprotected today. */
  "immune-health": (r) => {
    const population = r.pick([200, 400, 500, 800, 1000, 2000]);
    const vaccinated = Math.round(population * r.pick([0.5, 0.6, 0.7, 0.75, 0.8, 0.85]));
    const threshold = r.pick([90, 92, 95]);
    const target = (population * threshold) / 100;
    const shortfall = target - vaccinated;
    const correct = shortfall <= 0 ? "0" : String(Math.ceil(shortfall));
    return {
      prompt: `A school has ${population} learners, of whom ${vaccinated} are vaccinated against measles. Public health advice is that ${threshold}% must be vaccinated to stop measles spreading through the school. How many MORE learners would need to be vaccinated to reach ${threshold}%?`,
      correct,
      wrongs: distinct(correct, [
        // The unvaccinated count.
        String(population - vaccinated),
        // The target number, quoted as the shortfall.
        String(Math.round(target)),
        // Already vaccinated.
        String(vaccinated),
        // The unprotected percentage, quoted as a count.
        String(100 - threshold),
        // The shortfall per hundred.
        String(Math.max(1, Math.round(shortfall / 100))),
      ]),
      tags: [],
      explanation: `${threshold}% of ${population} is ${num(target, 0)} learners, and ${vaccinated} are already vaccinated, so the shortfall is ${num(target, 0)} − ${vaccinated} = ${correct}. The number unprotected TODAY is ${population - vaccinated} — that is a different, larger number, and it is larger precisely because the shortfall has to be closed to stop the vulnerable learners being exposed. Herd immunity protects the people who cannot be vaccinated, which is what the threshold is for.`,
      difficulty: hardest(r),
    };
  },

  /** Aerobic against anaerobic yield, worked the other way round: how many
   *  glucoses an anaerobic pathway needs to match one aerobic one. */
  respiration: (r) => {
    const anaerobicYield = 2;
    const aerobicYield = 32;
    const glucoses = r.pick([16, 32, 48, 64, 80]);
    const anaerobicAtp = glucoses * anaerobicYield;
    const aerobicNeeded = anaerobicAtp / aerobicYield;
    const correct = num(aerobicNeeded, 0);
    return {
      prompt: `Anaerobic respiration releases ${anaerobicYield} ATP per glucose molecule and aerobic respiration releases ${aerobicYield}. A muscle respires ${glucoses} glucose molecules anaerobically. How many glucose molecules would aerobic respiration have needed to release THE SAME amount of ATP?`,
      correct,
      wrongs: distinct(correct, [
        // The same number of glucose molecules.
        String(glucoses),
        // The ratio the wrong way round.
        String(glucoses * (aerobicYield / anaerobicYield)),
        // Half the anaerobic count.
        String(glucoses / 2),
        // The ATP total quoted as a glucose count.
        String(anaerobicAtp),
        // The two yields added.
        String(glucoses / (aerobicYield + anaerobicYield)),
      ]),
      tags: [],
      explanation: `Anaerobic respiration of ${glucoses} glucose molecules gives ${glucoses} × ${anaerobicYield} = ${anaerobicAtp} ATP. Aerobic respiration gives ${aerobicYield} ATP from each glucose, so reaching ${anaerobicAtp} ATP aerobically takes ${anaerobicAtp} ÷ ${aerobicYield} = ${correct} glucose molecules. That is the ${aerobicYield / anaerobicYield}-fold difference anaerobiosis costs you — the reason a sprinter can keep going and a marathon runner cannot.`,
      difficulty: hardest(r),
    };
  },

  /** A limiting factor: the mean change in rate per unit of the factor, read
   *  out of a results table. */
  photosynthesis: (r) => {
    const rows = [
      { light: 10, rate: 5 }, { light: 20, rate: 10 }, { light: 30, rate: 15 }, { light: 40, rate: 18 },
    ];
    const from = 0;
    const to = r.pick([1, 2]);
    const dRate = rows[to].rate - rows[from].rate;
    const dLight = rows[to].light - rows[from].light;
    const gradient = dRate / dLight;
    const correct = `${num(gradient)} per unit of light intensity`;
    return {
      prompt: `An experiment measures the rate of photosynthesis at different light intensities:\n\n${rows.map((x) => `· light intensity ${x.light} → rate ${x.rate}`).join("\n")}\n\nWhat is the mean INCREASE in rate for each extra unit of light between ${rows[from].light} and ${rows[to].light}?`,
      correct,
      wrongs: distinct(correct, [
        // The rate at the end of the range.
        `${num(rows[to].rate)} per unit of light intensity`,
        // The total increase, with the range forgotten.
        `${num(dRate)} per unit of light intensity`,
        // The gradient over the whole table.
        `${num((rows[rows.length - 1].rate - rows[0].rate) / (rows[rows.length - 1].light - rows[0].light))} per unit of light intensity`,
        // The gradient inverted.
        `${num(dLight / dRate)} per unit of light intensity`,
        // The rate at the start.
        `${num(rows[from].rate)} per unit of light intensity`,
      ]),
      tags: [],
      explanation: `A mean increase is a gradient: change in rate ÷ change in the thing that changed it. From ${rows[from].light} to ${rows[to].light} the rate rises ${rows[to].rate} − ${rows[from].rate} = ${num(dRate)}, over ${dLight} units of light, so the mean increase is ${num(dRate)} ÷ ${dLight} = ${correct}. The rate is NOT rising at the same rate everywhere — between ${rows[2].light} and ${rows[3].light} it only rises ${num(rows[3].rate - rows[2].rate)}, because light has stopped being the limiting factor, and that flattening is the point of measuring the gradient rather than the totals.`,
      difficulty: hardest(r),
    };
  },

  /** An insulin dose: two rules added, which is how a real correction dose is
   *  worked out. */
  hormones: (r) => {
    const carbs = r.pick([30, 40, 50, 60, 75, 90]);
    const carbRatio = r.pick([5, 10, 15]);
    const blood = r.pick([9, 10, 12, 14]);
    const target = r.pick([5, 6, 7]);
    const correctionPerUnit = r.pick([1, 2, 3]);
    const carbUnits = carbs / carbRatio;
    const correctionUnits = (blood - target) / correctionPerUnit;
    const total = carbUnits + correctionUnits;
    const correct = `${num(total)} units`;
    return {
      prompt: `A learner works out a mealtime insulin dose with two rules:\n\n· 1 unit for every ${carbRatio} g of carbohydrate\n· 1 unit for every ${num(correctionPerUnit)} mmol/L their blood glucose is ABOVE the target of ${num(target)} mmol/L\n\nA meal contains ${carbs} g of carbohydrate and their blood glucose is ${num(blood)} mmol/L.\n\nWhat dose should they take?`,
      correct,
      wrongs: distinct(correct, [
        // The carbohydrate rule alone.
        `${num(carbUnits)} units`,
        // The correction alone.
        `${num(correctionUnits)} units`,
        // The rules multiplied instead of added.
        `${num(carbUnits * correctionUnits)} units`,
        // The blood glucose used instead of the difference from target.
        `${num(carbUnits + blood / correctionPerUnit)} units`,
        // The difference from target ignored altogether.
        `${num(carbRatio)} units`,
      ]),
      tags: [],
      explanation: `Two doses, added. For the meal: ${carbs} ÷ ${carbRatio} = ${num(carbUnits)} units. For the correction: (${num(blood)} − ${num(target)}) ÷ ${num(correctionPerUnit)} = ${num(correctionUnits)} units — note it is the amount ABOVE the target, not the reading itself. Together: ${num(carbUnits)} + ${num(correctionUnits)} = ${correct}. Taking one rule and not the other is the mistake this question is built to catch, and it is why a correction is worked out separately from the meal dose.`,
      difficulty: hardest(r),
    };
  },

  /** Bile emulsifies fat: the radius of each new droplet follows from volume
   *  conservation, and the surface lipase can act on goes UP by the same
   *  factor — which is the whole reason bile exists. */
  digestion: (r) => {
    // The shrink factor and the droplet count are ONE choice, not two: volume is
    // conserved, so splitting one droplet into k³ equal droplets makes each of
    // them R/k across. Drawing the two independently would ask for a radius that
    // no real splitting produces.
    const k = r.pick([2, 3, 4]);
    const droplets = k * k * k;
    const radius = r.pick([12, 24, 36, 48]);
    const correct = `${num(radius / k)} µm`;
    return {
      prompt: `Bile splits a fat droplet of radius ${radius} µm into ${droplets} droplets of equal size. What is the radius of each?`,
      correct,
      wrongs: distinct(correct, [
        // Splitting treated as leaving every piece the size it was.
        `${num(radius)} µm`,
        // Divided by the NUMBER of droplets instead of by its cube root.
        `${num(radius / droplets)} µm`,
        // Multiplied by the factor instead of divided.
        `${num(radius * k)} µm`,
        // The factor itself, quoted as a radius.
        `${num(k)} µm`,
        // The factor applied twice.
        `${num(radius / k / k)} µm`,
      ]),
      tags: [],
      explanation: `Emulsifying conserves the fat: ${droplets} droplets of radius r hold the same volume as one of radius ${radius} µm, so ${droplets} × r³ = ${radius}³ and r = ${radius} ÷ ∛${droplets} = ${radius} ÷ ${k} = ${correct}. The point of it is the SURFACE, and that is why bile is worth secreting at all: one droplet's surface is proportional to ${radius}² = ${num(radius * radius)}, while the ${droplets} small ones come to ${droplets} × ${num(radius / k)}² = ${num(droplets * (radius / k) ** 2)}, which is ${k} times as much. Lipase can only work at a surface, so bile multiplies the fat lipase can reach without changing a single molecule of it. Dividing by ${droplets} instead of by ∛${droplets} is the slip to watch: the number of droplets is the VOLUME split, not the length.`,
      difficulty: hardest(r),
    };
  },
};
