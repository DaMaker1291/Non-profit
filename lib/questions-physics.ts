// ─────────────────────────────────────────────────────────────────────────────
// THE PHYSICS DEPTH LAYER.
//
// Why it exists. `npm run gate:ceiling` asks every advanced course whether the
// MEDIAN concept it serves can reach the depth the course declares, and physics
// failed every advanced one — A2, IB HL, AP, Class 11–12, ISC and the
// independent pathway — at a median of 0.78 against declarations of 0.80 to
// 0.90. Nothing in the subject reached 0.82: the ceiling itself was the limit,
// not the sampling, so a learner on a 0.90 course could never be asked a 0.90
// question however strong they were. Maths does not have that problem, and the
// reason is that maths has a depth layer.
//
// WHAT MAKES THIS LAYER SAFE TO AUTHOR. Every answer is COMPUTED by the
// generator from data the item prints — a specific heat is multiplied by a
// temperature change read out of a table, a transformer ratio is applied to a
// stated voltage, an orbital ratio is raised to a power, a pressure is taken
// through a second step to a force — instead of being worked out in an author's
// head and typed. The key cannot drift from the item, because the item is
// generated FROM the key, and each distractor names a real slip: two stages
// collapsed into one, a quantity divided instead of multiplied, a square
// forgotten on the radius, an angle's sine left out.
//
// THE BAND IS THE POINT: every family declares 0.90–0.96, the band these
// courses ask for, because each item chains at least three steps. That claim is
// held to over 240 draws per family by the content sweep in `npm run verify`,
// along with the four-option contract.
//
// WHAT IT IS NOT: a claim that multiple choice measures practical work. The
// demand ladder still ends at data_interpretation, and `extended_response` stays
// out of `SKILLS_IN_BANK` exactly as before.
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

export const PHYSICS_DEEP: Record<string, DeepGen> = {
  /** Electrons in an ION: the atomic number has to be found and then adjusted
   *  for the charge, in the right direction. */
  "atoms-nucleus": (r) => {
    const nuclides: Array<{ name: string; a: number; z: number }> = [
      { name: "sodium", a: 23, z: 11 },
      { name: "magnesium", a: 24, z: 12 },
      { name: "chlorine", a: 35, z: 17 },
      { name: "calcium", a: 40, z: 20 },
      { name: "iron", a: 56, z: 26 },
      { name: "potassium", a: 39, z: 19 },
    ];
    const n = r.pick(nuclides);
    const charge = r.pick([1, 2, 3]);
    const sign = r.next() < 0.5 ? "lost" : "gained";
    const electrons = sign === "lost" ? n.z - charge : n.z + charge;
    const correct = String(electrons);
    return {
      // ONE LINE ON PURPOSE, wherever the prompt is prose rather than a trace, a
      // table or a list. `readableOption` (lib/transfer.ts) will not put a
      // multi-part stem into a choice list — correctly — so a two-sentence
      // question that needs no break must not carry one: a line break here costs
      // the concept its inverse (transfer) surface for that whole band. Prompts
      // that really do print data keep their breaks and fall back to `direct`.
      prompt: `An atom of ${n.name} has mass number ${n.a} and atomic number ${n.z}. It forms an ion that has ${sign} ${charge} electron${charge === 1 ? "" : "s"}. How many electrons does the ion have?`,
      correct,
      wrongs: distinct(correct, [
        // The charge ignored: the neutral atom's electron count.
        String(n.z),
        // The charge applied the wrong way round.
        String(sign === "lost" ? n.z + charge : n.z - charge),
        // Neutrons, not electrons.
        String(n.a - n.z),
        // Mass number less the charge.
        String(n.a - charge),
        // One electron too many / too few.
        String(electrons + 1),
        String(electrons - 1),
      ]),
      tags: [],
      explanation: `The atomic number IS the number of protons, and a neutral atom has the same number of electrons — ${n.z} here. An ion that has ${sign} ${charge} electron${charge === 1 ? "" : "s"} is ${charge} away from neutral, so it has ${sign === "lost" ? `${n.z} − ${charge}` : `${n.z} + ${charge}`} = ${correct} electrons. The mass number (${n.a}) is never the electron count: it counts protons AND neutrons, and neutrons carry no charge, so ${n.a} − ${n.z} = ${n.a - n.z} is the number of NEUTRONS.`,
      difficulty: hardest(r),
    };
  },

  /** Momentum conservation through a collision, with both objects' momenta
   *  summed before the shared velocity. */
  momentum: (r) => {
    const m1 = r.pick([2, 3, 4, 5]);
    const u1 = r.pick([2, 3, 4, 5, 6]);
    const m2 = r.pick([1, 2, 3, 4]);
    const u2 = r.pick([0, 1, 2, 3]);
    const total = m1 * u1 + m2 * u2;
    const v = total / (m1 + m2);
    const correct = `${num(v)} m/s`;
    return {
      prompt: `A ${m1} kg trolley moving at ${u1} m/s collides with a ${m2} kg trolley moving at ${u2} m/s in the SAME direction. They stick together. What is their common velocity?`,
      correct,
      wrongs: distinct(correct, [
        // Only the first trolley's momentum used.
        `${num((m1 * u1) / (m1 + m2))} m/s`,
        // The two speeds averaged, as if mass did not matter.
        `${num((u1 + u2) / 2)} m/s`,
        // Momentum quoted as a velocity.
        `${num(total)} m/s`,
        // The speeds added.
        `${num(u1 + u2)} m/s`,
        // The first trolley's speed, as though the collision did not slow it.
        `${num(u1)} m/s`,
        // A half of the answer, for the collapse case.
        `${num(v / 2)} m/s`,
      ]),
      tags: [],
      explanation: `Momentum is conserved: total before = total after. Before: (${m1} × ${u1}) + (${m2} × ${u2}) = ${num(total)} kg·m/s. After: (${m1} + ${m2}) × v = ${m1 + m2}v, so v = ${num(total)} ÷ ${m1 + m2} = ${correct}. The masses ADD because the trolleys now move as one object — leaving the mass out gives the average of the speeds, which is only right when the two masses are equal.`,
      difficulty: hardest(r),
    };
  },

  /** A resultant force read out of a table of forces, then Newton's second law
   *  applied to it. Two stages, and the sign of the resultant matters. */
  "newton-laws": (r) => {
    const m = r.pick([2, 4, 5, 8, 10]);
    const fwd = [r.int(20, 40), r.int(20, 40)];
    const back = [r.int(10, 30), r.int(10, 30)];
    const net = fwd[0] + fwd[1] - back[0] - back[1];
    const a = net / m;
    const correct = `${num(a)} m/s²`;
    return {
      prompt: `The table records the horizontal forces on a ${m} kg sledge:\n\n· forward: ${fwd[0]} N\n· forward: ${fwd[1]} N\n· backward: ${back[0]} N\n· backward: ${back[1]} N\n\nWhat is the sledge's acceleration?`,
      correct,
      wrongs: distinct(correct, [
        // Every force added, direction ignored.
        `${num((fwd[0] + fwd[1] + back[0] + back[1]) / m)} m/s²`,
        // The resultant given as the acceleration (the ÷m step dropped).
        `${num(net)} m/s²`,
        // Newton's second law inverted.
        `${num(m / net)} m/s²`,
        // Only the first forward force used.
        `${num((fwd[0] - back[0] - back[1]) / m)} m/s²`,
        // Half, for the collapse case.
        `${num(a / 2)} m/s²`,
      ]),
      tags: [],
      explanation: `Forces in opposite directions subtract: forward ${fwd[0]} + ${fwd[1]} = ${fwd[0] + fwd[1]} N, backward ${back[0]} + ${back[1]} = ${back[0] + back[1]} N, so the resultant is ${fwd[0] + fwd[1]} − ${back[0] + back[1]} = ${net} N forwards. Then a = F ÷ m = ${net} ÷ ${m} = ${correct}. Adding every force as if it pulled the same way (${fwd[0] + fwd[1] + back[0] + back[1]} N) is the trap: a force is a vector, and the table gives you two directions on purpose.`,
      difficulty: hardest(r),
    };
  },

  /** An echo: the sound travels there AND back, so the time is halved. */
  "sound-acoustics": (r) => {
    const speed = r.pick([340, 1500, 3000]);
    const time = r.pick([0.4, 0.6, 0.8, 1.2, 1.6, 2.0]);
    const distance = (speed * time) / 2;
    const correct = `${num(distance)} m`;
    const medium = speed === 340 ? "air" : speed === 1500 ? "water" : "steel";
    return {
      prompt: `A pulse of sound is sent through ${medium} and its echo returns after ${num(time)} s. Sound travels at ${speed} m/s in ${medium}. How far away is the reflecting surface?`,
      correct,
      wrongs: distinct(correct, [
        // The round trip taken as the distance.
        `${num(speed * time)} m`,
        // The division inverted.
        `${num(speed / time)} m`,
        // The time divided instead of the distance.
        `${num((speed * time) / 4)} m`,
        // A multiplication instead of a division.
        `${num(speed * time * 2)} m`,
        // The speed quoted as the distance.
        `${num(speed)} m`,
      ]),
      tags: [],
      explanation: `The sound has to travel to the surface AND back, so the ${num(time)} s covers twice the distance: total path = ${speed} × ${num(time)} = ${num(speed * time)} m, and the surface is half of that, ${correct}. Quoting ${num(speed * time)} m is the classic echo error — it puts the wall twice as far away as it is, which is why an echo test has to be worked out as a round trip.`,
      difficulty: hardest(r),
    };
  },

  /** F = BIL — a three-factor product where every factor has to be found in the
   *  stem and left in its SI unit. */
  magnetism: (r) => {
    const b = r.pick([0.2, 0.5, 1.5, 2.0]);
    const current = r.pick([2, 3, 4, 5, 8]);
    const length = r.pick([0.1, 0.2, 0.4, 0.5]);
    const force = b * current * length;
    const correct = `${num(force)} N`;
    return {
      prompt: `A straight wire of length ${num(length * 100)} cm carries a current of ${current} A and lies at right angles to a magnetic field of flux density ${num(b)} T. What is the force on the wire?`,
      correct,
      wrongs: distinct(correct, [
        // The length left in cm.
        `${num(b * current * length * 100)} N`,
        // Only two factors multiplied.
        `${num(b * current)} N`,
        `${num(b * length)} N`,
        `${num(current * length)} N`,
        // The three added.
        `${num(b + current + length)} N`,
      ]),
      tags: [],
      explanation: `F = BIL, and every factor must be in its SI unit: B = ${num(b)} T, I = ${current} A, L = ${num(length)} m (the stem gives ${num(length * 100)} cm, so divide by 100 first). That gives ${num(b)} × ${current} × ${num(length)} = ${correct}. Leaving the length in centimetres multiplies the force by 100 — a unit error, not a physics one, and the commonest way this question is lost.`,
      difficulty: hardest(r),
    };
  },

  /** E = mcΔT, with ΔT read out of a before/after pair — the temperature CHANGE
   *  is the step that gets skipped. */
  "thermal-physics": (r) => {
    const mass = r.pick([0.5, 1, 1.5, 2, 2.5, 4]);
    const c = r.pick([4200, 900, 385, 2100]);
    const t1 = r.int(10, 25);
    const t2 = t1 + r.pick([20, 25, 30, 40, 50]);
    const dT = t2 - t1;
    const energy = mass * c * dT;
    const material = c === 4200 ? "water" : c === 900 ? "aluminium" : c === 385 ? "copper" : "ice";
    const correct = `${num(energy)} J`;
    return {
      prompt: `A ${num(mass)} kg block of ${material} is heated from ${t1} °C to ${t2} °C. Its specific heat capacity is ${c} J/kg°C. How much energy is transferred to the block?`,
      correct,
      wrongs: distinct(correct, [
        // The final temperature used instead of the change.
        `${num(mass * c * t2)} J`,
        // ΔT left out entirely.
        `${num(mass * c)} J`,
        // The change added rather than multiplied.
        `${num(mass + c + dT)} J`,
        // The temperature change quoted as the energy.
        `${num(dT)} J`,
        // Half the answer, for the collapse case.
        `${num(energy / 2)} J`,
      ]),
      tags: [],
      explanation: `E = m × c × ΔT, and ΔT is the CHANGE in temperature: ${t2} − ${t1} = ${dT} °C. So E = ${num(mass)} × ${c} × ${dT} = ${correct}. Using the final temperature (${num(mass * c * t2)} J) charges the block for heating from absolute zero rather than from ${t1} °C — the formula wants how much the temperature ROSE, not where it finished.`,
      difficulty: hardest(r),
    };
  },

  /** Work, then power: mgh to get the energy, ÷ t to get the rate. */
  "work-power": (r) => {
    const mass = r.pick([50, 60, 75, 100, 120, 150]);
    const height = r.pick([2, 3, 4, 5, 6, 8, 10]);
    const time = r.pick([2, 4, 5, 8, 10, 20]);
    const g = 10;
    const work = mass * g * height;
    const power = work / time;
    const correct = `${num(power)} W`;
    return {
      prompt: `A load of ${mass} kg is lifted ${height} m in ${time} s. Take g = ${g} N/kg. What is the average power of the motor doing the lifting?`,
      correct,
      wrongs: distinct(correct, [
        // Work, not power: the division by time skipped.
        `${num(work)} W`,
        // Weight instead of work.
        `${num(mass * g)} W`,
        // Height ÷ time, with the mass dropped.
        `${num((height * g) / time)} W`,
        // Multiplied by time instead of divided.
        `${num(work * time)} W`,
        // Half, for the collapse case.
        `${num(power / 2)} W`,
      ]),
      tags: [],
      explanation: `Power is the RATE of energy transfer, so find the energy first: work = mgh = ${mass} × ${g} × ${height} = ${num(work)} J. Then power = work ÷ time = ${num(work)} ÷ ${time} = ${correct}. ${num(work)} W is the work done, not the power — it is what the motor transfers in total, and the motor that does it in ${time} s has to be ${time} times more powerful than one that takes a minute.`,
      difficulty: hardest(r),
    };
  },

  /** Snell's law from a results table: the SINE of each angle, not the angle. */
  "light-optics": (r) => {
    const rows = [
      [20, 0.342, 13, 0.225],
      [30, 0.5, 19, 0.326],
      [40, 0.643, 25, 0.423],
      [50, 0.766, 31, 0.515],
      [60, 0.866, 35, 0.574],
    ] as const;
    const row = r.pick([...rows]);
    const [iDeg, sinI, rDeg, sinR] = row;
    const n = sinI / sinR;
    const correct = num(n, 2);
    return {
      prompt: `A student shines a ray into a glass block and records the angles:\n\n· angle of incidence: ${iDeg}°\n· angle of refraction: ${rDeg}°\n\nTheir data book gives sin ${iDeg}° = ${sinI} and sin ${rDeg}° = ${sinR}.\n\nWhat is the refractive index of the glass?`,
      correct,
      wrongs: distinct(correct, [
        // The ratio inverted.
        num(sinR / sinI, 2),
        // The ANGLES divided, with the sines left out — the whole point of the
        // data book being there.
        num(iDeg / rDeg, 2),
        // The two angles subtracted.
        num(iDeg - rDeg, 2),
        // The sines added.
        num(sinI + sinR, 2),
      ]),
      tags: [],
      explanation: `Snell's law uses the SINES: n = sin i ÷ sin r = ${sinI} ÷ ${sinR} = ${correct}. The data book is in the question because the angles themselves are useless here — dividing ${iDeg} by ${rDeg} gives ${num(iDeg / rDeg, 2)}, a number that changes if you measure the same glass from a different angle, which a refractive index must not.`,
      difficulty: hardest(r),
    };
  },

  /** A transformer: the ratio of turns sets the ratio of voltages. */
  "em-induction": (r) => {
    const np = r.pick([200, 250, 400, 500, 1000]);
    const ns = r.pick([50, 100, 500, 2000, 4000]);
    const vp = r.pick([6, 12, 230, 240]);
    const vs = (vp * ns) / np;
    const correct = `${num(vs)} V`;
    const stepUp = ns > np;
    return {
      prompt: `An ideal transformer has ${np} turns on the primary coil and ${ns} turns on the secondary coil. The primary is connected to a ${vp} V supply. What is the secondary voltage?`,
      correct,
      wrongs: distinct(correct, [
        // The turns ratio inverted.
        `${num((vp * np) / ns)} V`,
        // The primary voltage, unchanged.
        `${num(vp)} V`,
        // The turns ratio quoted as a voltage.
        `${num(ns / np)} V`,
        // Primary plus the turns difference.
        `${num(vp + (ns - np))} V`,
        // Half, for the collapse case.
        `${num(vs / 2)} V`,
        // THE SAFETY TAIL. When the two coils have the SAME number of turns the
        // ratio is 1, so the inverted ratio, the unchanged primary voltage and
        // the turns difference all collapse onto the answer at once (measured:
        // "12 V | 1 V | 6 V"). A doubled voltage cannot.
        `${num(vs * 2)} V`,
      ]),
      tags: [],
      explanation: `${vp} × (${ns} ÷ ${np}) = ${num(vs)} V. Each turn carries the same voltage, so the coil with ${ns > np ? "more" : "fewer"} turns has ${ns > np ? "more" : "less"} voltage, and this is a ${stepUp ? "step-up" : "step-down"} transformer. Inverting the ratio gives ${num((vp * np) / ns)} V, which is the voltage you would expect running the same transformer BACKWARDS — the one thing a transformer will not do is work on a d.c. supply, and it is the ratio, not the size, that sets this.`,
      difficulty: hardest(r),
    };
  },

  /** Kepler's third law as a ratio: period scales as the 3/2 power of the
   *  orbital radius. */
  astrophysics: (r) => {
    const factor = r.pick([4, 9, 16, 25]);
    const basePeriod = r.pick([1, 2, 4, 5]);
    const root = Math.sqrt(factor);
    const period = basePeriod * Math.pow(root, 3);
    const correct = `${num(period)} years`;
    return {
      prompt: `Two bodies orbit the same star.\n\n· Body A orbits at 1.0 AU with a period of ${num(basePeriod)} years.\n· Body B orbits at ${factor}.0 AU.\n\nFor orbits around one star, T² is proportional to r³.\n\nWhat is the period of body B?`,
      correct,
      wrongs: distinct(correct, [
        // A linear guess: period ∝ radius.
        `${num(basePeriod * factor)} years`,
        // The ratio squared instead of taken to the 3/2 power.
        `${num(basePeriod * factor * factor)} years`,
        // The period left unchanged, as if the orbit did not matter.
        `${num(basePeriod)} years`,
        // The ratio itself quoted as the answer.
        `${num(factor)} years`,
        // The two numbers added.
        `${num(basePeriod + factor)} years`,
      ]),
      tags: [],
      explanation: `T² ∝ r³, so multiplying r by ${factor} multiplies T² by ${factor}³ = ${factor * factor * factor}, and T by its square root: ${num(basePeriod)} × ${num(root)}³ = ${num(period)} years. The tempting answer is the linear one (${num(basePeriod * factor)}) — a planet ${factor} times further out does NOT take ${factor} times as long, and that difference is why Neptune's 165-year orbit was found by prediction rather than by watching.`,
      difficulty: hardest(r),
    };
  },

  /** Surface gravity as a ratio, then a weight: two stages, and the radius is
   *  SQUARED while the mass is not. */
  "gravity-fields": (r) => {
    const cases: Array<[number, number, string]> = [
      [4, 2, "Mars-like"], [9, 3, "Venus-like"], [2, 1, "super-Earth"], [3, 1, "heavy world"],
      [1, 2, "small moon"], [6, 2, "dense world"], [16, 4, "Earth-size giant"],
    ];
    const [mFactor, rFactor, label] = r.pick(cases);
    const gEarth = 9.8;
    const gFactor = mFactor / (rFactor * rFactor);
    const mass = r.pick([40, 50, 60, 70, 80]);
    const weight = mass * gEarth * gFactor;
    const correct = `${num(weight, 2)} N`;
    return {
      prompt: `A planet has ${mFactor} times the mass of Earth and ${rFactor} times its radius. On Earth g = ${gEarth} N/kg, and a learner of mass ${mass} kg stands on the planet. What is the learner's weight there?`,
      correct,
      wrongs: distinct(correct, [
        // The radius used linearly instead of squared.
        `${num((mass * gEarth * mFactor) / rFactor, 2)} N`,
        // The radius never used at all.
        `${num(mass * gEarth * mFactor, 2)} N`,
        // The learner's Earth weight.
        `${num(mass * gEarth, 2)} N`,
        // The ratio inverted.
        `${num((mass * gEarth * rFactor * rFactor) / mFactor, 2)} N`,
        // Only the mass, quoted as a weight.
        `${num(mass, 2)} N`,
      ]),
      tags: [],
      explanation: `g depends on mass AND on the square of the radius: here it scales by ${mFactor} ÷ ${rFactor}² = ${mFactor} ÷ ${rFactor * rFactor} = ${num(gFactor)} times Earth's. So weight = ${mass} × ${gEarth} × ${num(gFactor)} = ${correct}. Using the radius linearly (${num((mass * gEarth * mFactor) / rFactor, 2)} N) is the mistake the square exists to catch: standing ${rFactor}× further from a point mass weakens gravity ${rFactor * rFactor}×, because the same force is spread over a sphere ${rFactor}² times larger.`,
      difficulty: hardest(r),
    };
  },

  /** Two resistors in parallel, then the supply current: the combined resistance
   *  is the step that cannot be skipped. */
  "electricity-circuits": (r) => {
    const pairs: Array<[number, number]> = [[2, 6], [3, 6], [4, 12], [5, 20], [2, 3], [6, 3], [10, 15], [4, 4]];
    const [r1, r2] = r.pick(pairs);
    const v = r.pick([6, 12, 24]);
    const combined = (r1 * r2) / (r1 + r2);
    const current = v / combined;
    const correct = `${num(current)} A`;
    return {
      prompt: `Two resistors, ${r1} Ω and ${r2} Ω, are connected in PARALLEL across a ${v} V supply. What is the current drawn from the supply?`,
      correct,
      wrongs: distinct(correct, [
        // The parallel pair treated as a series one.
        `${num(v / (r1 + r2))} A`,
        // Only the first branch counted.
        `${num(v / r1)} A`,
        // The combined resistance quoted as the current.
        `${num(combined)} A`,
        // The total resistance as the current.
        `${num(r1 + r2)} A`,
        // Half, for the collapse case.
        `${num(current / 2)} A`,
      ]),
      tags: [],
      explanation: `First combine the resistors: 1/R = 1/${r1} + 1/${r2}, so R = (${r1} × ${r2}) ÷ (${r1} + ${r2}) = ${num(combined)} Ω — LOWER than either resistor, which is what adding a parallel path means. Then I = V ÷ R = ${v} ÷ ${num(combined)} = ${correct}. Adding the resistances (${r1 + r2} Ω) gives the answer for a SERIES circuit; here each resistor is across the full ${v} V, so the currents add up instead of the resistances.`,
      difficulty: hardest(r),
    };
  },

  /** Pressure at a depth, then the force on an area at that depth. */
  "pressure-fluids": (r) => {
    const depth = r.pick([2, 3, 4, 5, 8, 10]);
    const area = r.pick([0.01, 0.02, 0.05, 0.1, 0.25]);
    const density = 1000;
    const g = 10;
    const pressure = density * g * depth;
    const force = pressure * area;
    const correct = `${num(force)} N`;
    return {
      prompt: `A tank contains water to a depth of ${depth} m (density ${density} kg/m³, g = ${g} N/kg). A flat plate of area ${num(area)} m² lies on the bottom of the tank. What is the force of the water on the plate?`,
      correct,
      wrongs: distinct(correct, [
        // The pressure quoted instead of the force: the second stage skipped.
        `${num(pressure)} N`,
        // Area multiplied twice.
        `${num(pressure * area * area)} N`,
        // The depth used where the area belongs.
        `${num(pressure * depth)} N`,
        // The area alone, quoted as a force.
        `${num(area)} N`,
        // Half, for the collapse case.
        `${num(force / 2)} N`,
      ]),
      tags: [],
      explanation: `Two stages. First the pressure at that depth: p = ρgh = ${density} × ${g} × ${depth} = ${num(pressure)} Pa. Then the force that pressure exerts over the plate: F = p × A = ${num(pressure)} × ${num(area)} = ${correct}. Stopping at ${num(pressure)} N reports a pressure as a force — they are different quantities, and the area is in the question precisely because the same pressure on a bigger plate pushes harder.`,
      difficulty: hardest(r),
    };
  },
};
