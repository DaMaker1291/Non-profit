// ─────────────────────────────────────────────────────────────────────────────
// THE MISSING MIDDLE — chemistry.
//
// Two holes, both measured by `scripts/content-audit.mjs`:
//
//   · `moles-calcs` had families at 0.35–0.50 and 0.90–0.96 with nothing
//     between, so band 4 (0.60–0.80) was unreachable for twenty-five courses.
//   · `metallic-bonding`, `electron-shells`, `compounds-mixtures`,
//     `atoms-elements` and `periodic-table` all topped out at 0.75–0.78 —
//     below the 0.80 floor of band 5 — so twenty-four courses declaring 0.80+
//     work could never be served it. The `midband()` items here are written at
//     0.80–0.86: the answer is read OUT OF A TABLE the question prints, which is
//     exactly what the data-interpretation band means.
//
// Neither cause is the serve search: the audit reports cause A = 0 for every
// course in the platform, and raising the production draw budget from 40 to 400
// changed nothing. There was nothing for the search to find.
//
// Every answer is COMPUTED — the moles are actually worked through, the neutron
// counts and charges are actually subtracted, the ratios actually divided —
// rather than worked out in an author's head and typed. Where a table is
// printed, the answer is derived from the table the question shows, so the key
// cannot drift from the item.
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

/** Band 4 (0.60–0.80): three linked steps, with the values stated. */
function mid4(r: DeepRng): number {
  return 0.63 + r.next() * 0.14;
}

/** Band 5 (0.80–0.90), held under 0.90 on purpose: the answer is read OUT OF A
 *  TABLE the question prints. */
function midband(r: DeepRng): number {
  return 0.8 + r.next() * 0.06;
}

/** A four-row table rendered the way the questions present it. */
function table(rows: Array<[string, string]>): string {
  return rows.map(([a, b]) => `· ${a}: ${b}`).join("\n");
}

export const MID_CHEMISTRY: Record<string, DeepGen> = {
  // ── MOLE CALCULATIONS ─────────────────────────────────────────────────────
  /** Band 4: mass → moles → the equation's ratio → mass again. Three linked
   *  steps, which is why a moles question is never a single multiplication. */
  "moles-calcs": (r) => {
    const metals: Array<[string, string, number]> = [
      ["magnesium", "Mg", 24],
      ["calcium", "Ca", 40],
      ["zinc", "Zn", 65],
      ["copper", "Cu", 64],
    ];
    const [metal, sym, ar] = r.pick(metals);
    const mr = ar + 16; // the metal oxide MO
    const moles = r.int(2, 9);
    const mass = ar * moles; // chosen so the moles are a whole number
    const product = mr * moles;
    const oxygenUsed = (moles / 2) * 32;
    const correct = `${product} g`;
    return {
      prompt: `The equation for burning ${metal} is:\n\n2 ${sym} + O₂ → 2 ${sym}O\n\nRelative atomic masses: ${sym} = ${ar}, O = 16.\n\nWhat mass of ${metal} oxide (${sym}O) is formed when ${mass} g of ${metal} burns completely?`,
      correct,
      wrongs: distinct(correct, [
        // The reactant's mass quoted as the product's.
        `${mass} g`,
        // Moles multiplied by the wrong relative mass.
        `${ar * moles} g`,
        // The oxygen consumed, not the oxide formed.
        `${num(oxygenUsed, 2)} g`,
        `${mass + num(oxygenUsed, 2)} g`,
        `${mr * moles + ar} g`,
      ]),
      tags: [],
      explanation: `A balanced equation is a ratio in MOLES, so mass alone cannot be compared with it. Step 1, the moles of ${metal}: ${mass} g ÷ ${ar} g/mol = ${moles} mol. Step 2, the ratio — the equation puts 2 mol of ${metal} with 2 mol of ${metal} oxide, so the ratio is 1:1 and ${moles} mol of ${metal} gives ${moles} mol of ${metal} oxide. Step 3, back to mass: ${moles} × (${ar} + 16) = ${product} g. Reporting ${mass} g assumes mass is conserved in the ratio, which is exactly what the oxygen it picked up makes false.`,
      difficulty: mid4(r),
    };
  },

  // ── THE PERIODIC TABLE ────────────────────────────────────────────────────
  /** Band 5: the number of neutrons is nowhere in the table — it has to be
   *  worked out for every row before any of them can be compared. */
  "periodic-table": (r) => {
    // THE ROWS ARE CHOSEN AS A WHOLE, not sampled one by one. Neutron counts can
    // tie, and a table with two right answers is not a question — so the sets
    // below are picked because each has one clear winner, and the generator
    // never has to hope that a random draw produced one.
    const sets: Array<Array<[string, number, number]>> = [
      [["carbon", 6, 12], ["sodium", 11, 23], ["chlorine", 17, 35], ["iron", 26, 56]],
      [["oxygen", 8, 16], ["aluminium", 13, 27], ["chlorine", 17, 35], ["calcium", 20, 40]],
      [["carbon", 6, 12], ["oxygen", 8, 16], ["sodium", 11, 23], ["aluminium", 13, 27]],
      [["sodium", 11, 23], ["chlorine", 17, 35], ["potassium", 19, 39], ["iron", 26, 56]],
    ];
    const chosen = r.pick(sets);
    const neutrons = chosen.map(([, z, a]) => a - z);
    let bestIdx = 0;
    for (let i = 1; i < chosen.length; i++) if (neutrons[i] > neutrons[bestIdx]) bestIdx = i;
    const rows = chosen.map(([name, z, a]) => [name, `protons ${z}, mass number ${a}`] as [string, string]);
    const correct = chosen[bestIdx][0];
    return {
      prompt: `A table lists four atoms.\n${table(rows)}\n\nWhich atom has the MOST neutrons in its nucleus?`,
      correct,
      wrongs: distinct(correct, chosen.map(([name]) => name)),
      tags: [],
      explanation: `A mass number counts protons AND neutrons together, so the neutron count is a subtraction that has to be done for every row before they can be compared: ${chosen.map(([name, z, a]) => `${name}: ${a} − ${z} = ${a - z}`).join(", ")}. The largest is ${correct}. Answering the atom with the largest mass number is right only when the proton counts are equal — a heavy atom with many protons can carry fewer neutrons than a lighter one.`,
      difficulty: midband(r),
    };
  },

  // ── ATOMS & ELEMENTS ──────────────────────────────────────────────────────
  /** Band 5: the charge of each species has to be derived from the table. The
   *  charge is nowhere in it. */
  "atoms-elements": (r) => {
    const labels = ["A", "B", "C", "D"];
    // BUILT, not sampled: the charge asked for is placed in exactly one row and
    // the other three are given charges that are definitely not it, so the item
    // can never have two right answers.
    const want = r.pick([1, 2, 3, -1, -2, -3]);
    const others = r.shuffle([1, 2, 3, -1, -2, -3, 0].filter((c) => c !== want)).slice(0, 3);
    const at = r.int(0, 3);
    const charges = labels.map((_, i) => (i === at ? want : others[i > at ? i - 1 : i]));
    const protons = [4 + at, 12, 17, 20];
    const rows = labels.map((l, i) => ({ protons: protons[i], electrons: protons[i] - charges[i], charge: charges[i] }));
    const correct = labels[at];
    const chargeText = `${want > 0 ? `${want}+` : `${-want}−`}`;
    return {
      prompt: `A table records four species.\n${table(labels.map((l, i) => [l, `protons ${rows[i].protons}, electrons ${rows[i].electrons}`]))}\n\nWhich species carries a charge of ${chargeText}?`,
      correct,
      wrongs: distinct(correct, labels),
      tags: [],
      explanation: `An atom's charge is decided by the BALANCE of protons and electrons, and the table does not give it away. Subtract for each row: ${labels.map((l, i) => `${l}: ${rows[i].protons} − ${rows[i].electrons} = ${rows[i].charge > 0 ? `+${rows[i].charge}` : rows[i].charge}`).join(", ")}. Only ${correct} carries ${chargeText}. Reading the counts as the charge — answering the row with the most protons, or forgetting that an atom with equal numbers is neutral — is the slip this table is built to catch.`,
      difficulty: midband(r),
    };
  },

  // ── ELECTRON SHELLS ───────────────────────────────────────────────────────
  /** Band 5: the OUTER shell is the last number of each configuration, so the
   *  table has to be read row by row rather than recognised. */
  "electron-shells": (r) => {
    const elements: Array<[string, number[]]> = [
      ["lithium", [2, 1]],
      ["oxygen", [2, 6]],
      ["sodium", [2, 8, 1]],
      ["chlorine", [2, 8, 7]],
      ["argon", [2, 8, 8]],
      ["magnesium", [2, 8, 2]],
      ["aluminium", [2, 8, 3]],
      ["potassium", [2, 8, 8, 1]],
    ];
    const picked = r.shuffle(elements).slice(0, 4);
    const outer = picked.map(([, shells]) => shells[shells.length - 1]);
    const targets = [1, 2, 6, 7, 8].filter((n) => outer.filter((o) => o === n).length === 1);
    if (!targets.length) return MID_CHEMISTRY["electron-shells"](r);
    const want = r.pick(targets);
    const correct = picked[outer.indexOf(want)][0];
    return {
      prompt: `A table gives the electron arrangement of four elements.\n${table(picked.map(([name, shells]) => [name, `shells ${shells.join(", ")}`]))}\n\nWhich element has ${want} electron${want === 1 ? "" : "s"} in its OUTER shell?`,
      correct,
      wrongs: distinct(correct, picked.map(([name]) => name)),
      tags: [],
      explanation: `Shells fill from the inside out, so the OUTER shell is the LAST number in the arrangement: ${picked.map(([name, shells]) => `${name} (${shells.join(", ")}) has ${shells[shells.length - 1]} in its outer shell`).join("; ")}. Exactly one of them has ${want}, and it is ${correct}. Adding the shells up, or reading the FIRST number, answers a different question — the total number of electrons is the atomic number, but chemical behaviour is decided by the outermost shell alone.`,
      difficulty: midband(r),
    };
  },

  // ── COMPOUNDS & MIXTURES ──────────────────────────────────────────────────
  /** Band 5: a pure substance melts at one temperature; a mixture melts across
   *  a range. The range is in the table and has to be spotted, not recalled. */
  "compounds-mixtures": (r) => {
    const sampleNames = ["sample A", "sample B", "sample C", "sample D"];
    const pure = r.shuffle(sampleNames).slice(0, 3);
    const mp = () => r.int(30, 140);
    const rows: Array<{ name: string; text: string; mixture: boolean }> = pure.map((name) => {
      const t = mp();
      return { name, text: `melts sharply at ${t} °C`, mixture: false };
    });
    const lo = r.int(30, 90);
    const hi = lo + r.int(8, 30);
    rows.push({ name: sampleNames.find((n) => !pure.includes(n)) ?? "sample D", text: `melts between ${lo} °C and ${hi} °C`, mixture: true });
    for (let i = rows.length - 1; i > 0; i--) {
      const j = r.int(0, i);
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    const correct = rows.find((x) => x.mixture)?.name ?? "sample D";
    return {
      prompt: `A table gives the melting behaviour of four samples.\n${table(rows.map((x) => [x.name, x.text]))}\n\nWhich sample is a MIXTURE?`,
      correct,
      wrongs: distinct(correct, rows.map((x) => x.name)),
      tags: [],
      explanation: `A PURE substance has a single, sharp melting point, because every particle breaks out of the solid at the same temperature. A MIXTURE is made of substances with different melting points, so it softens and melts across a RANGE: ${correct} melts between two temperatures, while the other samples each have one. Melting over a range is the evidence, not an impurity you can see — this is why a melting point is measured to check purity.`,
      difficulty: midband(r),
    };
  },

  // ── METALLIC BONDING ──────────────────────────────────────────────────────
  /** Band 5: two properties have to be compared across the table at once — the
   *  number of delocalised electrons AND the melting point — because metallic
   *  bonding is stronger when there are more of them. */
  "metallic-bonding": (r) => {
    const metals: Array<[string, number, number]> = [
      ["potassium", 1, 63],
      ["sodium", 1, 98],
      ["calcium", 2, 842],
      ["magnesium", 2, 650],
      ["aluminium", 3, 660],
    ];
    const picked = r.shuffle(metals).slice(0, 4);
    let best = 0;
    for (let i = 1; i < picked.length; i++) {
      if (picked[i][1] > picked[best][1] || (picked[i][1] === picked[best][1] && picked[i][2] > picked[best][2])) best = i;
    }
    // The strongest is unique only when no other row matches both counts.
    const ties = picked.filter((x) => x[1] === picked[best][1] && x[2] === picked[best][2]).length;
    if (ties > 1) return MID_CHEMISTRY["metallic-bonding"](r);
    const correct = picked[best][0];
    return {
      prompt: `A table gives two properties of four metals.\n${table(picked.map(([name, e, melt]) => [name, `${e} delocalised electron${e === 1 ? "" : "s"} per atom, melting point ${melt} °C`]))}\n\nWhich metal has the STRONGEST metallic bonding?`,
      correct,
      wrongs: distinct(correct, picked.map(([name]) => name)),
      tags: [],
      explanation: `Metallic bonding is the attraction between the positive ions and the sea of delocalised electrons, so it gets stronger when each atom contributes MORE electrons and when the ions are closer together — which is what a higher melting point measures. Reading both columns: ${picked.map(([name, e, melt]) => `${name} contributes ${e} electron${e === 1 ? "" : "s"} and melts at ${melt} °C`).join("; ")}. ${correct} contributes the most electrons, and its melting point confirms it. Reading the melting point alone gives the same answer here, but the number of delocalised electrons is the CAUSE and the melting point is the evidence — confusing the two is how the wrong metal gets chosen on a table where they disagree.`,
      difficulty: midband(r),
    };
  },
};
