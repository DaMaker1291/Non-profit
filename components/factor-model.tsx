"use client";

// A PRIME FACTOR TREE YOU BUILD, THEN USE.
//
// The N4 lesson already explained the tree and the HCF/LCM rule in prose. This
// model makes the learner do the two things the prose can only describe:
// split a composite number until every leaf is prime, then read the shared and
// unshared primes off 24 and 36 to see where 12 and 72 come from.
//
// Nothing is scored. The model is a place to try the method; the lesson's
// assessment is where evidence comes from. The arithmetic lives in
// `lib/interactive-models.ts`, so the tree and the reading are testable without
// a browser.

import { useId, useState } from "react";
import {
  factorPairs,
  firstUnsplitComposite,
  isPrime,
  makeFactorTree,
  readFactorTree,
  readHcfLcm,
  splitFactorTree,
  type FactorNode,
} from "@/lib/interactive-models";

const ROOT = 36;

function FactorBranch({ node, activeId }: { node: FactorNode; activeId: string | null }) {
  const leaf = !node.left || !node.right;
  const prime = leaf && isPrime(node.value);
  const active = node.id === activeId;
  return (
    <li className="factor-tree-item">
      <span
        className={`factor-node${prime ? " is-prime" : ""}${active ? " is-active" : ""}`}
        data-factor-node={node.value}
        data-factor-prime={prime ? "yes" : "no"}
      >
        {node.value}
      </span>
      {node.left && node.right && (
        <ul className="factor-tree-children">
          <FactorBranch node={node.left} activeId={activeId} />
          <FactorBranch node={node.right} activeId={activeId} />
        </ul>
      )}
    </li>
  );
}

export function FactorModel() {
  const id = useId();
  const [tree, setTree] = useState<FactorNode>(() => makeFactorTree(ROOT));
  const [note, setNote] = useState(`Split ${ROOT} into a factor pair to start the tree.`);
  const [compareOpen, setCompareOpen] = useState(false);

  const summary = readFactorTree(tree);
  const active = firstUnsplitComposite(tree);
  const done = summary.complete && !active;
  const pairs = active ? factorPairs(active.value) : [];
  const comparison = readHcfLcm(24, 36);

  function choose(a: number, b: number) {
    if (!active) return;
    const next = splitFactorTree(tree, active.id, a, b);
    if (!next) {
      setNote(`That pair does not make ${active.value}. Choose a pair whose product is ${active.value}.`);
      return;
    }
    setTree(next);
    const nextSummary = readFactorTree(next);
    const nextActive = firstUnsplitComposite(next);
    if (!nextActive) {
      setNote(
        `Every leaf is prime: ${ROOT} = ${nextSummary.productText} = ${nextSummary.indexText}.`,
      );
    } else {
      setNote(`${active.value} = ${a} × ${b}. Now split ${nextActive.value}.`);
    }
  }

  function reset() {
    setTree(makeFactorTree(ROOT));
    setNote(`Split ${ROOT} into a factor pair to start the tree.`);
    setCompareOpen(false);
  }

  return (
    <section className="factor-model" aria-labelledby={`${id}-h`} data-factor-model data-factor-tree-complete={done ? "yes" : "no"}>
      <div className="factor-model-head">
        <h3 id={`${id}-h`} className="small" style={{ margin: 0 }}>
          Build the factor tree for {ROOT}
        </h3>
        <button type="button" className="btn ghost small" onClick={reset}>
          Start again
        </button>
      </div>

      <p className="small muted" style={{ margin: 0 }}>
        Split a composite number into a factor pair until every leaf is prime. Any first split is
        allowed; the primes at the bottom are the same.
      </p>

      <div className="factor-tree-wrap">
        <ul className="factor-tree" aria-label={`Factor tree for ${ROOT}`}>
          <FactorBranch node={tree} activeId={active?.id ?? null} />
        </ul>
      </div>

      <p className="small" role="status" aria-live="polite" data-factor-status style={{ margin: 0 }}>
        {note}
      </p>

      {done ? (
        <div className="factor-result" data-factor-product={summary.productText} data-factor-index={summary.indexText}>
          <p className="small" style={{ margin: 0 }}>
            <b>
              {ROOT} = {summary.productText}
            </b>{" "}
            <span className="muted">= {summary.indexText}</span>
          </p>
          <p className="small muted" style={{ margin: "6px 0 0" }}>
            Every route ends at the same primes. The order of the leaves may change; the set of
            primes does not.
          </p>
          {!compareOpen ? (
            <button className="btn small" type="button" style={{ marginTop: 10 }} onClick={() => setCompareOpen(true)}>
              Compare 24 and 36
            </button>
          ) : (
            <div className="factor-compare" data-factor-compare style={{ marginTop: 10 }}>
              <p className="small" style={{ margin: 0 }}>
                <b>24</b> = {comparison.aText}
              </p>
              <p className="small" style={{ margin: 0 }}>
                <b>36</b> = {comparison.bText}
              </p>
              <p className="small" style={{ margin: "8px 0 0" }} data-factor-hcf={comparison.hcf}>
                <b>HCF</b> = {comparison.hcfText} = {comparison.hcf}{" "}
                <span className="muted">— shared primes at the lower power.</span>
              </p>
              <p className="small" style={{ margin: "4px 0 0" }} data-factor-lcm={comparison.lcm}>
                <b>LCM</b> = {comparison.lcmText} = {comparison.lcm}{" "}
                <span className="muted">— every prime at its highest power.</span>
              </p>
              <p className="small muted" style={{ margin: "8px 0 0" }}>
                864 is also a common multiple, but it counts the shared primes twice and is not the
                lowest. The HCF must divide both numbers; the LCM must be divisible by both.
              </p>
            </div>
          )}
        </div>
      ) : active ? (
        <div className="factor-splits">
          <p className="small" style={{ margin: 0 }}>
            <b>Split {active.value}.</b> Choose a factor pair.
          </p>
          <div className="actions" style={{ marginTop: 8 }}>
            {pairs.map((pair) => (
              <button
                key={`${pair.a}-${pair.b}`}
                type="button"
                className="btn small"
                onClick={() => choose(pair.a, pair.b)}
                data-factor-pair={`${pair.a}x${pair.b}`}
              >
                {pair.a} × {pair.b}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
