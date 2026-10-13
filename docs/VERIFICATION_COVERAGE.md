# What has been verified, and what has not

This page exists because a green test run is easy to misread. `npm run verify:q`
reports **135 generators × 300 draws — 0 problems**, and that sentence is true
and does not mean "every answer in the bank is correct". It means every draw
satisfied the checks that exist. This page says which checks exist, what each one
can prove, and — in the machine-readable ledger beside it — which concepts each
one actually reaches.

The ledger is `audit/verification-coverage.json`, written by `npm run verify:q`.
It is deterministic (no timestamp), so a diff in it **is** the review: a concept
moving from structural-only to prompt-derived is a change in what has been
verified, and nothing else moves it.

## The five layers, in the order a defect has to survive them

| Layer | What it establishes | What it cannot establish |
|---|---|---|
| **Structure** | Four options that are distinct BY VALUE, no floating-point noise, a non-empty explanation, a difficulty in range, no filler text. | Nothing about the mathematics. |
| **Explanation vs key** | The explanation states its own key: an item whose working never arrives at its own answer is not explaining the answer. | An item whose working and key are **consistently wrong** — that pair agrees with itself. |
| **Prompt-derived answer** | The answer is re-computed from the prompt by a matcher, so a wrong key is caught even when the explanation agrees with it. | Anything about the concepts no matcher reaches. |
| **Assessment validity** (`npm run gate:options`) | Eight fixed guessing strategies are scored per concept on the served items; none may beat the others by exploiting option length, digit count, magnitude or position. | Whether the item is well-posed, useful, or correctly keyed. A question can resist every shortcut and still be ambiguous. |
| **Human review** | A qualified person read the items. | — |

The first four are automated and run on every change. **The fifth has not
happened.** `humanReviewed` in the ledger is an empty list, deliberately a list
rather than a count of zero, because "no reviewer has seen this" is a statement
and not a missing value.

## The measured position, as of this release

Reproduce it with `npm run verify:q`:

```
135 concepts · 40,500 draws
  prompt-derived     5  (circle-area-arc, completing-square, fractions,
                         mixture-problems, surds)
  structural-only  130
  human-reviewed     0
```

That is the number to read before trusting any claim about content quality:
**3.7% of draws have their answer re-derived independently of the generator, and
96.3% met the structural rules only.** The `fractions` wrong key — the item that
marked a correct learner wrong — was invisible to structure and to the option
gates, and was found by a matcher. Its siblings are not hypothetical; they are
simply unlooked for.

## The rule for adding a matcher

A matcher is added for a concept whose generated answer can be re-derived from
its own prompt, and it is only kept once it has been shown to FAIL:

1. plant a deliberately wrong key in the family (change the arithmetic, not the
   text), run `npm run verify:q`, and confirm the new checker names it;
2. plant a *consistent* wrong explanation — working and key wrong together — and
   confirm the matcher still catches it, because the explanation rule cannot;
3. restore the file and compare hashes, so a probe never leaves a planted defect
   behind.

Both plants above have been done for the matchers that exist: the `fractions`
magnitude slip was re-introduced and the suite failed with
`mathematically wrong: 5/6 − 1/3 = 0.5, but the key is 2/3`, and the coverage
claim's placeholder rule was shown to fail by hard-coding a number back into a
dictionary. A **scripted** mutation harness — planting N defect classes and
reporting which gate catches each — does not exist yet; the evidence above is
from two manual probes. It is the natural next step, and until it exists this
page is the honest record of what has been demonstrated.

## What this page is not

It is not a claim that OpenMind teaches well. Nothing here measures whether a
student learns or retains anything. The three measurements that would — initial
competence, transfer to unfamiliar questions, and retention after a delay — need
learners and a teacher, and have not been taken.
