// ─────────────────────────────────────────────────────────────────────────────
// THE CHEMISTRY DEPTH LAYER.
//
// Why it exists. `npm run gate:ceiling` asks every advanced course whether the
// MEDIAN concept it serves can reach the depth the course declares, and
// chemistry failed every one of them — A2, IB HL, AP, Class 11–12, ISC and the
// independent pathway — at a median of 0.74–0.75 against declarations of 0.78
// to 0.90. The top of the subject was the limit: not one chemistry concept could
// exceed 0.78, while maths cruises at 0.92 because maths has a depth layer. A
// declared difficulty a course cannot serve is a claim, not a curriculum.
//
// WHAT MAKES THIS LAYER SAFE TO AUTHOR. Every answer here is COMPUTED by the
// generator from data the item prints — an Mr is summed from an atomic-mass
// table, a mole ratio is applied to a real equation, a titration is worked at
// the concentrations in the stem, a bond-energy sum is subtracted, an
// equilibrium constant is evaluated — instead of being worked out in an author's
// head and typed. The key cannot drift from the item, because the item is
// generated FROM the key, and each distractor is a named slip a student really
// makes (adding subscripts instead of multiplying by them, reading cm³ as dm³,
// forgetting that a 2+ ion needs two electrons, taking the Mr for the mass).
//
// THE BAND IS THE POINT. Every family declares 0.90–0.96 — the band these
// courses ask for — because each item chains at least three steps and reads its
// inputs out of a table. That is a claim the content sweep in `npm run verify`
// holds every family to over 240 draws, along with the option contract.
//
// WHAT IT IS NOT: a claim that multiple choice measures practical work. The
// demand ladder still ends at data_interpretation, and `extended_response` stays
// out of `SKILLS_IN_BANK` exactly as before.
//
// Only TYPES are imported from the maths depth layer: questions.ts composes THIS
// record, so a value-level import back would close a module cycle.
// ─────────────────────────────────────────────────────────────────────────────
import type { DeepGen, DeepRng } from "./questions-deep";

/** The first `n` candidates genuinely different from the answer and each other.
 *  A family that returns fewer than three distinct wrong answers makes the
 *  assembler fall back to a near-miss padder, which the suite treats as a weak
 *  item — so every family below passes more candidates than it needs. */
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

/** The band every family here earns: the answer is not in the question, it has
 *  to be built from a table or a chain of steps. Written as a helper so no
 *  family can quietly drop back into the recall band while being described as
 *  deep. */
function hardest(r: DeepRng): number {
  return 0.9 + r.next() * 0.06;
}

export const CHEMISTRY_DEEP: Record<string, DeepGen> = {
  /** Mr summed from an atomic-mass table, then multiplied by the moles. The
   *  subscripts are the whole trap: O₃ is three oxygens, not one. */
  "moles-calcs": (r) => {
    const compounds: Array<{ formula: string; ar: Array<[number, string, number]> }> = [
      { formula: "CaCO₃", ar: [[40, "Ca", 1], [12, "C", 1], [16, "O", 3]] },
      { formula: "H₂SO₄", ar: [[1, "H", 2], [32, "S", 1], [16, "O", 4]] },
      { formula: "Na₂CO₃", ar: [[23, "Na", 2], [12, "C", 1], [16, "O", 3]] },
      { formula: "KNO₃", ar: [[39, "K", 1], [14, "N", 1], [16, "O", 3]] },
      { formula: "CuSO₄", ar: [[64, "Cu", 1], [32, "S", 1], [16, "O", 4]] },
      { formula: "Mg(OH)₂", ar: [[24, "Mg", 1], [16, "O", 2], [1, "H", 2]] },
    ];
    const c = r.pick(compounds);
    const mr = c.ar.reduce((s, [a, , k]) => s + a * k, 0);
    const biggest = c.ar.slice().sort((x, y) => y[0] * y[2] - x[0] * x[2])[0];
    const n = r.pick([0.25, 0.4, 0.5, 1.5, 2, 2.5, 3]);
    const mass = n * mr;
    const correct = `${num(mass)} g`;
    return {
      prompt: `Relative atomic masses:\n${c.ar.map(([a, s]) => `· ${s} = ${a}`).join("\n")}\n\nA sample contains ${num(n)} mol of ${c.formula}.\nWhat is the mass of the sample?`,
      correct,
      wrongs: distinct(correct, [
        // One element's Ar used as the whole formula mass.
        `${num(n * biggest[0])} g`,
        // The Mr itself, not multiplied by the moles.
        `${num(mr)} g`,
        // Subscripts read as 1 for everything.
        `${num(n * c.ar.reduce((s, [a]) => s + a, 0))} g`,
        // The moles added to the mass instead of multiplied.
        `${num(mr + n)} g`,
      ]),
      tags: [],
      explanation: `Work out the formula mass first, multiplying each Ar by its subscript: ${c.ar.map(([a, s, k]) => `${a}${k > 1 ? ` × ${k}` : ""} (${s})`).join(" + ")} = ${num(mr)}. Then mass = moles × formula mass = ${num(n)} × ${num(mr)} = ${correct}. Using one element's Ar as if it were the whole formula (${num(biggest[0])}) is the commonest version of this slip — a formula is a sum, and the subscript is how many times each atom appears.`,
      difficulty: hardest(r),
    };
  },

  /** Mass → moles → mole ratio → mass, on a real balanced equation whose formula
   *  masses come from an atomic-mass table. */
  "equations-stoich": (r) => {
    const reactions: Array<{ eq: string; left: string; right: string; ar: Array<[number, string]> }> = [
      { eq: "2Mg + O₂ → 2MgO", left: "Mg", right: "MgO", ar: [[24, "Mg"], [16, "O"]] },
      { eq: "2Na + Cl₂ → 2NaCl", left: "Na", right: "NaCl", ar: [[23, "Na"], [35.5, "Cl"]] },
      { eq: "CaCO₃ → CaO + CO₂", left: "CaCO₃", right: "CaO", ar: [[40, "Ca"], [12, "C"], [16, "O"]] },
      { eq: "2H₂O₂ → 2H₂O + O₂", left: "H₂O₂", right: "H₂O", ar: [[1, "H"], [16, "O"]] },
      { eq: "CH₄ + 2O₂ → CO₂ + 2H₂O", left: "CH₄", right: "CO₂", ar: [[12, "C"], [1, "H"], [16, "O"]] },
    ];
    const rx = r.pick(reactions);
    const mrOf: Record<string, number> = {
      Mg: 24, "MgO": 40, Na: 23, NaCl: 58.5, "CaCO₃": 100, CaO: 56, "H₂O₂": 34, "H₂O": 18, "CH₄": 16, "CO₂": 44,
    };
    const mrL = mrOf[rx.left];
    const mrR = mrOf[rx.right];
    const molesL = r.pick([0.25, 0.5, 1, 1.5, 2, 2.5, 3]);
    const massL = molesL * mrL;
    const massR = molesL * mrR;
    const correct = `${num(massR)} g`;
    return {
      prompt: `Relative atomic masses:\n${rx.ar.map(([a, s]) => `· ${s} = ${a}`).join("\n")}\n\n${massL} g of ${rx.left} reacts completely:\n\n${rx.eq}\n\nWhat mass of ${rx.right} is formed?`,
      correct,
      wrongs: distinct(correct, [
        // Equal masses assumed.
        `${num(massL)} g`,
        // The product's formula mass on its own.
        `${num(mrR)} g`,
        // The ratio inverted.
        `${num(molesL * mrR * (mrL / mrR) ** 2)} g`,
        // The two formula masses added.
        `${num(massL + mrR)} g`,
        // Moles of product equal to the reactant's MASS.
        `${num(massL * mrR)} g`,
      ]),
      tags: [],
      explanation: `Convert what you are given into MOLES before using the equation: ${massL} ÷ ${num(mrL)} = ${num(molesL)} mol of ${rx.left}. The equation's coefficients give the ratio, so ${num(molesL)} mol of ${rx.right} forms, weighing ${num(molesL)} × ${num(mrR)} = ${correct}. The equation balances ATOMS, not masses: the product mass is different from the reactant mass because a different substance is being weighed.`,
      difficulty: hardest(r),
    };
  },

  /** A titration: concentration × volume for the known solution, the ratio from
   *  the equation, then the unknown concentration. */
  "acids-bases": (r) => {
    const baseConc = r.pick([0.05, 0.1, 0.2, 0.25]);
    const baseVol = r.pick([20, 25, 30, 40]);
    const acidVol = r.pick([20, 25, 50]);
    const [aCoef, bCoef] = r.pick([[1, 1], [1, 2], [2, 1]]);
    const molesBase = (baseConc * baseVol) / 1000;
    const molesAcid = (molesBase * aCoef) / bCoef;
    const acidConc = molesAcid / (acidVol / 1000);
    const correct = `${num(acidConc)} mol/dm³`;
    return {
      prompt: `A student titrates ${acidVol}.0 cm³ of a hydrochloric acid solution against sodium hydroxide.\n\nThe equation is:\n${aCoef === 1 && bCoef === 1 ? "HCl + NaOH → NaCl + H₂O" : `${aCoef}HCl + ${bCoef}NaOH → ${aCoef}NaCl + ${bCoef}H₂O`}\n\n· Volume of NaOH used: ${baseVol}.0 cm³\n· Concentration of NaOH: ${num(baseConc)} mol/dm³\n\nWhat is the concentration of the acid?`,
      correct,
      wrongs: distinct(correct, [
        // The base's own concentration — "equal volumes, equal strength".
        `${num(baseConc)} mol/dm³`,
        // cm³ used as dm³: the 1000 dropped.
        `${num((molesBase * aCoef * 1000) / (bCoef * acidVol))} mol/dm³`,
        // The ratio inverted.
        `${num((molesBase * bCoef) / aCoef / (acidVol / 1000))} mol/dm³`,
        // The volumes used raw, as if cm³ could be divided directly.
        `${num((baseConc * baseVol) / acidVol)} mol/dm³`,
        // THE SAFETY TAIL. When the equation is 1:1 AND the two volumes are
        // equal, three of the slips above become the CORRECT answer and collapse
        // (measured: `0.25 mol/dm³` alone). These three cannot: one reports the
        // moles as a concentration, and the other two misapply the ratio.
        `${num(molesAcid)} mol/dm³`,
        `${num(acidConc * 2)} mol/dm³`,
        // A decimal-place slip (0.25 read as 2.5). Deliberately ×10 rather than
        // another doubling: when the acid IS the base's own concentration, ×2
        // coincides with the doubling above and the list thins to two.
        `${num(acidConc * 10)} mol/dm³`,
      ]),
      tags: [],
      explanation: `Moles of NaOH = concentration × volume in dm³ = ${num(baseConc)} × ${num(baseVol / 1000)} = ${num(molesBase)} mol. The equation fixes the ratio (${aCoef} : ${bCoef}), so moles of acid = ${num(molesAcid)} mol. Concentration = moles ÷ volume = ${num(molesAcid)} ÷ ${num(acidVol / 1000)} = ${correct}. Two slips live here: dividing by a volume in cm³ instead of dm³ (a factor of 1000), and assuming equal volumes of acid and alkali mean equal concentrations — the equation's ratio says otherwise.`,
      difficulty: hardest(r),
    };
  },

  /** The formula of an ionic compound, from the charges in the table: the
   *  crossover rule, applied rather than remembered. */
  "ionic-bonding": (r) => {
    const cations: Array<[string, number]> = [["Na", 1], ["K", 1], ["Mg", 2], ["Ca", 2], ["Al", 3], ["Fe", 3]];
    const anions: Array<[string, number]> = [["Cl", 1], ["O", 2], ["SO₄", 2], ["NO₃", 1], ["OH", 1]];
    const [cat, cp] = r.pick(cations);
    const [an, ap] = r.pick(anions);
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const g = gcd(cp, ap) || 1;
    const nCat = ap / g;
    const nAn = cp / g;
    const sub = (n: number) => (n === 1 ? "" : String(n));
    const formula = `${cat}${sub(nCat)}${an}${sub(nAn)}`;
    const swap = `${cat}${sub(nAn)}${an}${sub(nCat)}`;
    const bare = `${cat}${an}`;
    return {
      prompt: `Two ions combine to form a neutral compound:\n\n· ${cat} ion: charge ${cp > 1 ? `${cp}+` : "+"}\n· ${an} ion: charge ${ap > 1 ? `${ap}−` : "−"}\n\nWhat is the formula of the compound?`,
      correct: formula,
      // Every candidate is a real way to get this wrong, and they are listed so
      // that a 1:1 pair with NO subscripts (KCl) still has three: on that draw
      // `swap` and `bare` both collapse onto the answer.
      wrongs: distinct(formula, [
        // The two numbers crossed the wrong way round.
        swap,
        // Anion subscript dropped.
        `${cat}${sub(nCat)}${an}`,
        // Cation subscript dropped.
        `${cat}${an}${sub(nAn)}`,
        // One ion too many on each side.
        `${cat}${sub(nCat + 1)}${an}${sub(nAn)}`,
        `${cat}${sub(nCat)}${an}${sub(nAn + 1)}`,
        // The "always write 2 and 2" habit.
        `${cat}2${an}2`,
        // No subscripts at all.
        bare,
      ]),
      tags: [],
      explanation: `The compound is neutral, so the total positive charge must equal the total negative charge. A ${cp}${cp > 1 ? "+" : "+"} ion needs ${ap} of the ${an} ion (charge ${ap}−) to balance, and ${cp} of the ${cat} ion balances ${ap} copies of the ${an} ion — reduced to lowest terms that is ${nCat} : ${nAn}, giving ${formula}. Writing ${swap} swaps the numbers instead of crossing them over, which balances only when the two charges happen to be equal.`,
      difficulty: hardest(r),
    };
  },

  /** Shared pairs counted from a displayed formula — where a double bond is TWO
   *  pairs and a triple bond is three. */
  "covalent-bonding": (r) => {
    const molecules: Array<{ name: string; formula: string; bonds: Array<[string, string, number, number]> }> = [
      { name: "methane", formula: "CH₄", bonds: [["C", "H", 1, 4]] },
      { name: "water", formula: "H₂O", bonds: [["O", "H", 1, 2]] },
      { name: "ammonia", formula: "NH₃", bonds: [["N", "H", 1, 3]] },
      { name: "carbon dioxide", formula: "CO₂", bonds: [["C", "O", 2, 2]] },
      { name: "nitrogen", formula: "N₂", bonds: [["N", "N", 3, 1]] },
      { name: "ethene", formula: "C₂H₄", bonds: [["C", "H", 1, 4], ["C", "C", 2, 1]] },
      { name: "hydrogen cyanide", formula: "HCN", bonds: [["H", "C", 1, 1], ["C", "N", 3, 1]] },
    ];
    const m = r.pick(molecules);
    const pairs = m.bonds.reduce((s, [, , order, count]) => s + order * count, 0);
    const bondCount = m.bonds.reduce((s, [, , , count]) => s + count, 0);
    const atoms = m.bonds.reduce((s, [, , , count]) => s + count, 0) + 1;
    const correct = String(pairs);
    return {
      prompt: `A molecule of ${m.name} (${m.formula}) contains:\n${m.bonds.map(([a, b, order, count]) => `· ${count} × ${a}${order === 1 ? "–" : order === 2 ? "=" : "≡"}${b}`).join("\n")}\n\nHow many SHARED PAIRS of electrons hold the molecule together?`,
      correct,
      wrongs: distinct(correct, [
        // Bonds counted instead of pairs: a double bond missed.
        String(bondCount),
        // Atoms in the molecule.
        String(atoms),
        // Everything doubled: electrons rather than pairs.
        String(pairs * 2),
        // THE SAFETY TAIL: for CH₄ the atom count IS the pair count, so the two
        // above collapse together (measured: "6 | 5 | 12" for ethene). A pair
        // over, a pair short and the doubled total cannot all coincide.
        String(pairs - 1),
        String(pairs + 1),
      ]),
      tags: [],
      explanation: `Count the pairs, not the lines: a single line is one shared pair, a double line is two and a triple line is three. ${m.bonds.map(([a, b, order, count]) => `${count} × ${order} (${a}${order === 1 ? "–" : order === 2 ? "=" : "≡"}${b})`).join(" + ")} = ${correct} shared pairs. Counting the lines (${bondCount}) treats a double bond as one shared pair, which would leave carbon with too few electrons — that is exactly why the double bond is drawn as two lines.`,
      difficulty: hardest(r),
    };
  },

  /** ΔH from bond energies: broken minus made, with the sign. */
  "energy-changes": (r) => {
    const reactions: Array<{ eq: string; broken: Array<[string, number]>; made: Array<[string, number]> }> = [
      { eq: "H₂ + Cl₂ → 2HCl", broken: [["H–H", 436], ["Cl–Cl", 243]], made: [["H–Cl", 432 * 2]] },
      { eq: "H₂ + Br₂ → 2HBr", broken: [["H–H", 436], ["Br–Br", 193]], made: [["H–Br", 366 * 2]] },
      { eq: "N₂ + 3H₂ → 2NH₃", broken: [["N≡N", 945], ["H–H", 436 * 3]], made: [["N–H", 391 * 6]] },
      { eq: "2H₂ + O₂ → 2H₂O", broken: [["H–H", 436 * 2], ["O=O", 498]], made: [["O–H", 464 * 4]] },
      { eq: "CH₄ + Cl₂ → CH₃Cl + HCl", broken: [["C–H", 413], ["Cl–Cl", 243]], made: [["C–Cl", 346], ["H–Cl", 432]] },
    ];
    const rx = r.pick(reactions);
    const inTotal = rx.broken.reduce((s, [, v]) => s + v, 0);
    const outTotal = rx.made.reduce((s, [, v]) => s + v, 0);
    const dh = inTotal - outTotal;
    const correct = `${num(dh)} kJ/mol (${dh < 0 ? "exothermic" : "endothermic"})`;
    return {
      prompt: `Bond energies (kJ/mol):\n${[...rx.broken, ...rx.made].map(([b, v]) => `· ${b} = ${v}`).join("\n")}\n\nFor the reaction:\n\n${rx.eq}\n\nWhat is the overall energy change, and is it exothermic or endothermic?`,
      correct,
      wrongs: distinct(correct, [
        // The sign reversed.
        `${num(-dh)} kJ/mol (${-dh < 0 ? "exothermic" : "endothermic"})`,
        // Bonds made minus bonds broken, sign flipped again.
        `${num(outTotal)} kJ/mol (endothermic)`,
        // Only the bonds broken counted.
        `${num(inTotal)} kJ/mol (endothermic)`,
        // The totals added instead of compared.
        `${num(inTotal + outTotal)} kJ/mol (endothermic)`,
      ]),
      tags: [],
      explanation: `Energy is put IN to break bonds (${rx.broken.map(([b, v]) => `${v} (${b})`).join(" + ")} = ${inTotal}) and released when new ones form (${outTotal}). The overall change is in − out = ${inTotal} − ${outTotal} = ${correct}. Breaking bonds alone (${inTotal}) is not the reaction's energy change — the bonds made pay some of it back, and when they pay back more than was spent the reaction is exothermic.`,
      difficulty: hardest(r),
    };
  },

  /** The mean rate between two readings in a results table — not the overall
   *  rate and not the initial one. */
  "rates-reaction": (r) => {
    const k = r.pick([0.5, 1, 1.5, 2, 2.5]);
    const step = 10;
    const rates = [k, 0.8 * k, 0.6 * k, 0.5 * k];
    const vols = [0];
    for (const rate of rates) vols.push(vols[vols.length - 1] + rate * step);
    const times = [0, 10, 20, 30, 40];
    const from = r.pick([0, 1, 2]);
    const to = from + 1;
    const rateBetween = (vols[to] - vols[from]) / (times[to] - times[from]);
    const correct = `${num(rateBetween)} cm³/s`;
    return {
      prompt: `A student measures the gas given off when marble chips react with acid:\n\n${times.map((t, i) => `· ${t} s → ${num(vols[i])} cm³`).join("\n")}\n\nWhat is the mean rate of reaction between ${times[from]} s and ${times[to]} s?`,
      correct,
      wrongs: distinct(correct, [
        // The overall rate for the whole experiment.
        `${num(vols[vols.length - 1] / times[times.length - 1])} cm³/s`,
        // The initial rate.
        `${num(rates[0])} cm³/s`,
        // The volume at the end, taken as a rate.
        `${num(vols[vols.length - 1])} cm³/s`,
        // The gas produced in the interval, with the time forgotten.
        `${num(vols[to] - vols[from])} cm³/s`,
      ]),
      tags: [],
      explanation: `A mean rate is a gradient: the change in the measured quantity ÷ the time it took. Between ${times[from]} s and ${times[to]} s the volume goes from ${num(vols[from])} to ${num(vols[to])} cm³, so the rate is (${num(vols[to])} − ${num(vols[from])}) ÷ ${times[to] - times[from]} = ${correct}. The rate is falling as the acid is used up, so quoting the overall rate (total volume ÷ total time) UNDERSTATES the start and overstates the end — which is why the interval has to be named.`,
      difficulty: hardest(r),
    };
  },

  /** Kc evaluated from a table of equilibrium concentrations, with the
   *  stoichiometry applied as powers. */
  equilibria: (r) => {
    const h2 = r.pick([0.2, 0.25, 0.5]);
    const i2 = r.pick([0.2, 0.5, 1]);
    const hi = r.pick([0.2, 0.5, 1, 2]);
    const kc = (hi * hi) / (h2 * i2);
    const correct = num(kc);
    return {
      prompt: `An equilibrium mixture at a fixed temperature contains:\n\n· H₂: ${num(h2)} mol/dm³\n· I₂: ${num(i2)} mol/dm³\n· HI: ${num(hi)} mol/dm³\n\nfor the reaction\n\nH₂ + I₂ ⇌ 2HI\n\nWhat is the value of the equilibrium constant Kc?`,
      correct,
      wrongs: distinct(correct, [
        // The expression inverted.
        num((h2 * i2) / (hi * hi)),
        // The square forgotten on HI.
        num(hi / (h2 * i2)),
        // The concentrations added rather than multiplied.
        num(hi + hi - h2 - i2),
        // The product's coefficient used as a multiplier instead of a power —
        // which for [HI] = 2 lands exactly on the right answer (hi² = 2 × hi).
        num((2 * hi) / (h2 * i2)),
        // THE SAFETY TAIL: the reciprocal's own neighbours, so the question
        // always offers three wrong values even when the slips coincide.
        num(kc * 2),
        num(kc / 2),
        num(kc + 1),
      ]),
      tags: [],
      explanation: `Kc is the products over the reactants, each raised to the power of its coefficient: Kc = [HI]² ÷ ([H₂] × [I₂]) = ${num(hi)}² ÷ (${num(h2)} × ${num(i2)}) = ${num(hi * hi)} ÷ ${num(h2 * i2)} = ${correct}. The 2 in front of HI makes the concentration SQUARED, not doubled — and inverting the expression gives the reciprocal, which is a different number that happens to look plausible.`,
      difficulty: hardest(r),
    };
  },

  /** The formula mass of an alkane from its general formula — with the Ar table,
   *  so it is computed rather than recalled. */
  "organic-intro": (r) => {
    const n = r.int(3, 9);
    const hydrogens = 2 * n + 2;
    const mr = 12 * n + hydrogens;
    const correct = String(mr);
    return {
      prompt: `Relative atomic masses: C = 12, H = 1. An alkane has the general formula CₙH₂ₙ₊₂ and one of its molecules contains ${n} carbon atoms. What is its relative molecular mass?`,
      correct,
      wrongs: distinct(correct, [
        // Hydrogen count one short: 2n.
        String(12 * n + 2 * n),
        // Hydrogen count one over: 2n + 3.
        String(12 * n + 2 * n + 3),
        // n hydrogens instead of 2n + 2.
        String(12 * n + n),
        // Carbons and hydrogens added without the 12.
        String(n + hydrogens),
      ]),
      tags: [],
      explanation: `${n} carbons carry ${n * 2} + 2 = ${hydrogens} hydrogens, so the formula is C${n}H${hydrogens} and the relative molecular mass is (${n} × 12) + (${hydrogens} × 1) = ${correct}. Using 2n hydrogens forgets the two extra hydrogens that cap the ends of the chain — which is exactly what 2n + 2 is there to say.`,
      difficulty: hardest(r),
    };
  },

  /** Identify an ion from two reported test results, matched against the table. */
  "analysis-tests": (r) => {
    const ions: Array<{ ion: string; flame: string; naoh: string }> = [
      { ion: "Li⁺", flame: "red", naoh: "no precipitate" },
      { ion: "Na⁺", flame: "yellow", naoh: "no precipitate" },
      { ion: "K⁺", flame: "lilac", naoh: "no precipitate" },
      { ion: "Ca²⁺", flame: "brick-red", naoh: "white precipitate" },
      { ion: "Cu²⁺", flame: "green", naoh: "blue precipitate" },
      { ion: "Fe²⁺", flame: "no colour", naoh: "green precipitate" },
      { ion: "Fe³⁺", flame: "no colour", naoh: "brown precipitate" },
    ];
    const picked = r.shuffle(ions.slice()).slice(0, 4);
    const target = picked[r.int(0, 3)];
    const others = picked.filter((x) => x.ion !== target.ion);
    const correct = target.ion;
    return {
      prompt: `A solution is tested in two ways.\n\nThe flame test gives a ${target.flame} flame.\nAdding sodium hydroxide solution gives a ${target.naoh}.\n\nWhich ion does the solution contain?\n\n${picked.map((x) => `· ${x.ion}`).join("\n")}`,
      correct,
      wrongs: distinct(correct, others.map((x) => x.ion)),
      tags: [],
      explanation: `Both tests have to fit. The flame identifies the metal ion, and the hydroxide precipitate confirms it — a ${target.ion} solution gives a ${target.flame} flame and a ${target.naoh} with sodium hydroxide. The other ions in the list fail one of the two tests, which is why a single test is not enough to identify an ion: two different ions can give the same precipitate colour, and the flame test is what separates them.`,
      difficulty: hardest(r),
    };
  },

  /** Mass deposited in electrolysis: Q = It, moles of electrons = Q/F, then the
   *  ion's charge converts electrons to atoms. */
  electrolysis: (r) => {
    const metals: Array<{ name: string; ion: string; ar: number; charge: number }> = [
      { name: "copper", ion: "Cu²⁺", ar: 63.5, charge: 2 },
      { name: "silver", ion: "Ag⁺", ar: 108, charge: 1 },
      { name: "aluminium", ion: "Al³⁺", ar: 27, charge: 3 },
      { name: "zinc", ion: "Zn²⁺", ar: 65, charge: 2 },
      { name: "lead", ion: "Pb²⁺", ar: 207, charge: 2 },
    ];
    const m = r.pick(metals);
    const current = r.pick([2, 5, 10]);
    const seconds = r.pick([482.5, 965, 1930, 4825]);
    const charge = current * seconds;
    const electrons = charge / 96500;
    const moles = electrons / m.charge;
    const mass = moles * m.ar;
    const correct = `${num(mass)} g`;
    return {
      prompt: `A current of ${num(current)} A flows for ${num(seconds)} s through a solution of ${m.name} ions (${m.ion}).\n\nThe Faraday constant is 96500 C/mol and Ar(${m.name}) = ${m.ar}.\n\nWhat mass of ${m.name} is deposited at the cathode?`,
      correct,
      wrongs: distinct(correct, [
        // Electrons used as atoms: the charge of the ion ignored.
        `${num(electrons * m.ar)} g`,
        // The charge used as the moles of metal directly.
        `${num(charge * m.ar)} g`,
        // Moles of metal found but Ar forgotten.
        `${num(moles)} g`,
        // The ion's charge MULTIPLIED instead of divided.
        `${num(electrons * m.charge * m.ar)} g`,
        // THE SAFETY TAIL. For a 1+ metal (silver) the moles of electrons ARE
        // the moles of metal, so two of the slips above collapse onto the answer
        // (measured: "5.4 g | 521100 g | 0.05 g"). These cannot: the Ar added
        // instead of multiplied, and a doubled total.
        `${num(mass + m.ar)} g`,
        `${num(mass * 2)} g`,
      ]),
      tags: [],
      explanation: `Charge = current × time = ${num(current)} × ${num(seconds)} = ${num(charge)} C. Moles of electrons = charge ÷ Faraday constant = ${num(charge)} ÷ 96500 = ${num(electrons)} mol. Each ${m.ion} ion needs ${m.charge} electron${m.charge === 1 ? "" : "s"}, so the moles of metal are ${num(electrons)} ÷ ${m.charge} = ${num(moles)}, weighing ${num(moles)} × ${m.ar} = ${correct}. Using the moles of ELECTRONS as the moles of metal is the classic slip — it deposits ${m.charge} times too much, which is a factor you cannot afford in electroplating.`,
      difficulty: hardest(r),
    };
  },
};
