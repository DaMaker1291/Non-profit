// A SIMULATION OF THE MODEL, NOT AN OBSERVATION OF THE WORLD.
//
// The lesson needs a learner to see relative frequency vary around 1/2, and to
// see more trials narrow the variation without guaranteeing an exact hit. A
// random button would do that, but it would not be testable: two runs on the
// same seed must be the same run, or a browser check can only assert that some
// number appeared.
//
// So the generator is a tiny, explicit PRNG and the trial count is pure. The
// UI is allowed to look random; the function underneath is reproducible.
//
// This is deliberately NOT a physical-coin simulator. It samples a fair-coin
// model, and the component says so. A learner must not come away thinking a
// computer run has tested the coin in their hand.

export interface CoinSimulation {
  trials: number;
  heads: number;
  tails: number;
  /** heads / trials, or 0 for an empty run. */
  relativeFrequency: number;
  /** observed − 0.5, in probability units (not percentage points). */
  difference: number;
}

/** Mulberry32: 32-bit state, deterministic, no dependency. */
export function mulberry32(seed: number): () => number {
  let a = (Number(seed) || 0) >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateCoinTosses(trials: number, seed: number): CoinSimulation {
  const n = Math.max(0, Math.min(100000, Math.floor(Number(trials) || 0)));
  const random = mulberry32(seed);
  let heads = 0;
  for (let i = 0; i < n; i += 1) {
    if (random() < 0.5) heads += 1;
  }
  const tails = n - heads;
  const relativeFrequency = n === 0 ? 0 : heads / n;
  return {
    trials: n,
    heads,
    tails,
    relativeFrequency,
    difference: relativeFrequency - 0.5,
  };
}

// ── the reusable experiment layer ───────────────────────────────────────────
//
// The coin was the first experiment, not the only one. A die and a two-draw bag
// share the same contract: a reproducible run, the observed count of each
// outcome, and the theoretical probability the model assigns to it. The bag is
// deliberately WITHOUT replacement, because that is the case a learner must not
// analyse by multiplying the first probability by itself.

export type SimulationExperiment = "coin" | "die" | "bag";

export interface SimulationOutcome {
  readonly key: string;
  readonly label: string;
  readonly count: number;
  readonly theoretical: number;
}

export interface ExperimentSimulation {
  readonly experiment: SimulationExperiment;
  readonly trials: number;
  readonly outcomes: readonly SimulationOutcome[];
}

const MAX_TRIALS = 100000;

function clampTrials(trials: number): number {
  return Math.max(0, Math.min(MAX_TRIALS, Math.floor(Number(trials) || 0)));
}

function coinOutcomes(heads: number, trials: number): SimulationOutcome[] {
  const tails = trials - heads;
  return [
    { key: "heads", label: "Heads", count: heads, theoretical: 0.5 },
    { key: "tails", label: "Tails", count: tails, theoretical: 0.5 },
  ];
}

export function emptyExperiment(experiment: SimulationExperiment): ExperimentSimulation {
  if (experiment === "die") {
    return {
      experiment,
      trials: 0,
      outcomes: [1, 2, 3, 4, 5, 6].map((face) => ({
        key: String(face), label: String(face), count: 0, theoretical: 1 / 6,
      })),
    };
  }
  if (experiment === "bag") {
    return {
      experiment,
      trials: 0,
      outcomes: [
        { key: "rr", label: "Red then red", count: 0, theoretical: 6 / 20 },
        { key: "rb", label: "Red then blue", count: 0, theoretical: 6 / 20 },
        { key: "br", label: "Blue then red", count: 0, theoretical: 6 / 20 },
        { key: "bb", label: "Blue then blue", count: 0, theoretical: 2 / 20 },
      ],
    };
  }
  return { experiment, trials: 0, outcomes: coinOutcomes(0, 0) };
}

export function simulateExperiment(
  experiment: SimulationExperiment,
  trials: number,
  seed: number,
): ExperimentSimulation {
  const n = clampTrials(trials);
  if (experiment === "die") {
    const counts = [0, 0, 0, 0, 0, 0];
    const random = mulberry32(seed);
    for (let i = 0; i < n; i += 1) {
      const face = Math.min(6, Math.floor(random() * 6) + 1);
      counts[face - 1] += 1;
    }
    return {
      experiment,
      trials: n,
      outcomes: counts.map((count, index) => ({
        key: String(index + 1), label: String(index + 1), count, theoretical: 1 / 6,
      })),
    };
  }

  if (experiment === "bag") {
    const counts: Record<string, number> = { rr: 0, rb: 0, br: 0, bb: 0 };
    const random = mulberry32(seed);
    for (let i = 0; i < n; i += 1) {
      let red = 3;
      let blue = 2;
      const firstRed = random() < red / (red + blue);
      if (firstRed) red -= 1; else blue -= 1;
      const secondRed = random() < red / (red + blue);
      const key = firstRed ? (secondRed ? "rr" : "rb") : (secondRed ? "br" : "bb");
      counts[key] += 1;
    }
    return {
      experiment,
      trials: n,
      outcomes: emptyExperiment("bag").outcomes.map((outcome) => ({
        ...outcome,
        count: counts[outcome.key] ?? 0,
      })),
    };
  }

  const coin = simulateCoinTosses(n, seed);
  return { experiment: "coin", trials: n, outcomes: coinOutcomes(coin.heads, n) };
}

/** Add a run to a cumulative experiment, keeping the theoretical column. */
export function combineExperiments(
  current: ExperimentSimulation,
  run: ExperimentSimulation,
): ExperimentSimulation {
  if (current.experiment !== run.experiment) return run;
  const previous = new Map(current.outcomes.map((outcome) => [outcome.key, outcome.count]));
  return {
    experiment: current.experiment,
    trials: current.trials + run.trials,
    outcomes: run.outcomes.map((outcome) => ({
      ...outcome,
      count: outcome.count + (previous.get(outcome.key) ?? 0),
    })),
  };
}
