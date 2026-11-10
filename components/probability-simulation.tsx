"use client";

import { useState } from "react";
import {
  combineExperiments,
  emptyExperiment,
  simulateExperiment,
  type ExperimentSimulation,
  type SimulationExperiment,
} from "@/lib/probability-simulation";

// THE ONE CONTROL THAT LETS A LEARNER SEE VARIATION RATHER THAN READ ABOUT IT.
//
// It samples a stated model. The sentence below the numbers says that plainly,
// because a simulation that is mistaken for a physical experiment teaches the
// opposite of the lesson's point: the computer cannot tell you whether the coin
// in your hand is fair.
//
// The counts are cumulative by design. A single 20-toss run looks like evidence
// for whatever it did; pressing 200 and then 2,000 shows the running proportion
// settling without ever being promised to equal the theoretical value.
//
// The bag is WITHOUT replacement. That is deliberate: the second draw is
// conditional on the first, so the observed proportions must not be read as
// two independent 3/5 draws.

const EXPERIMENT_LABEL: Record<SimulationExperiment, string> = {
  coin: "Fair coin",
  die: "Fair die",
  bag: "Two draws, no replacement",
};

const percent = (value: number): string => `${(value * 100).toFixed(1)}%`;

const EMPTY: Record<SimulationExperiment, ExperimentSimulation> = {
  coin: emptyExperiment("coin"),
  die: emptyExperiment("die"),
  bag: emptyExperiment("bag"),
};

export function ProbabilitySimulation() {
  const [experiment, setExperiment] = useState<SimulationExperiment>("coin");
  const [totals, setTotals] = useState<ExperimentSimulation>(EMPTY.coin);
  const [last, setLast] = useState<ExperimentSimulation | null>(null);
  const [seed, setSeed] = useState(1);

  function run(trials: number): void {
    const simulation = simulateExperiment(experiment, trials, seed);
    setTotals((current) => combineExperiments(current, simulation));
    setLast(simulation);
    setSeed((current) => current + 1);
  }

  function reset(): void {
    setTotals(emptyExperiment(experiment));
    setLast(null);
    setSeed(1);
  }

  function choose(next: SimulationExperiment): void {
    setExperiment(next);
    setTotals(emptyExperiment(next));
    setLast(null);
    setSeed(1);
  }

  const heads = totals.outcomes.find((outcome) => outcome.key === "heads")?.count ?? 0;
  const tails = totals.outcomes.find((outcome) => outcome.key === "tails")?.count ?? 0;
  const lastHeads = last?.outcomes.find((outcome) => outcome.key === "heads")?.count ?? 0;
  const lastDifference = last && last.trials > 0 ? lastHeads / last.trials - 0.5 : 0;
  const largestGap = last && last.trials > 0
    ? Math.max(...last.outcomes.map((outcome) => Math.abs(outcome.count / last.trials - outcome.theoretical)))
    : 0;

  const intro = experiment === "coin"
    ? "Toss a simulated fair coin. Start with 20 and watch the observed proportion; then add 200 and 2,000. The theoretical probability is 1/2, but a finite run is not required to land exactly there."
    : experiment === "die"
      ? "Roll a simulated fair die. The theoretical probability of each face is 1/6. A short run may look uneven; add more rolls and compare the observed proportions with the theoretical column."
      : "Draw two counters without replacement from a bag with 3 red and 2 blue. The second draw is conditional on the first, so the four paths are not all equally likely. Compare the observed proportions with the theoretical column.";

  return (
    <section className="card" data-probability-simulation data-sim-kind={experiment} aria-label="Probability simulation" style={{ marginBottom: 18 }}>
      <p className="eyebrow" style={{ margin: 0 }}>Try the model</p>
      <h3 className="reading" style={{ margin: "6px 0 0" }}>What does variation look like?</h3>
      <p className="reading lesson-text" style={{ marginTop: 8 }}>{intro}</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginTop: 10 }}>
        <label className="reading small" htmlFor="sim-experiment" style={{ display: "grid", gap: 4 }}>
          Experiment
          <select
            id="sim-experiment"
            className="input"
            data-sim-experiment
            value={experiment}
            onChange={(event) => choose(event.target.value as SimulationExperiment)}
          >
            {(["coin", "die", "bag"] as const).map((kind) => (
              <option key={kind} value={kind}>{EXPERIMENT_LABEL[kind]}</option>
            ))}
          </select>
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[20, 200, 2000].map((n) => (
            <button
              key={n}
              type="button"
              className="btn"
              data-sim-toss={n}
              onClick={() => run(n)}
            >
              {experiment === "coin" ? "Toss" : experiment === "die" ? "Roll" : "Draw"} {n.toLocaleString("en-GB")}
            </button>
          ))}
          <button type="button" className="btn secondary" data-sim-reset onClick={reset} disabled={totals.trials === 0}>
            Reset
          </button>
        </div>
      </div>

      <div
        data-sim-trials={totals.trials}
        data-sim-heads={experiment === "coin" ? heads : 0}
        data-sim-tails={experiment === "coin" ? tails : 0}
        aria-live="polite"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))",
          gap: 10,
          marginTop: 14,
        }}
      >
        <div>
          <div className="small muted">Simulated trials</div>
          <strong data-sim-total>{totals.trials.toLocaleString("en-GB")}</strong>
        </div>
        {totals.outcomes.map((outcome) => (
          <div key={outcome.key} data-sim-outcome={outcome.key}>
            <div className="small muted">{outcome.label}</div>
            <strong>{outcome.count.toLocaleString("en-GB")}</strong>
            <div className="small muted">
              {totals.trials === 0 ? "—" : percent(outcome.count / totals.trials)} observed
              <br />
              {percent(outcome.theoretical)} theoretical
            </div>
          </div>
        ))}
      </div>

      {last && (
        <p className="reading small muted" style={{ marginTop: 10 }}>
          Last run: {last.trials.toLocaleString("en-GB")} trials.{" "}
          {experiment === "coin"
            ? `Its proportion of heads differed from 1/2 by ${(Math.abs(lastDifference) * 100).toFixed(1)} percentage points.`
            : `The largest gap between an observed proportion and its theoretical value was ${(largestGap * 100).toFixed(1)} percentage points.`}
        </p>
      )}

      {experiment === "coin" ? (
        <p className="reading small muted" style={{ marginTop: 10 }}>
          This is a simulation of a fair-coin model, not an observation of a physical coin. It cannot
          tell you whether a real coin is fair; it shows how much variation the model produces.
        </p>
      ) : experiment === "die" ? (
        <p className="reading small muted" style={{ marginTop: 10 }}>
          This is a simulation of a fair-die model. The theoretical column is a property of that
          model, not a promise that a finite run will match it.
        </p>
      ) : (
        <p className="reading small muted" style={{ marginTop: 10 }}>
          This is a simulation of two draws without replacement from a stated bag. The theoretical
          column is what the model implies; the observed column is one finite run, and the second
          draw is conditional on the first.
        </p>
      )}
    </section>
  );
}
