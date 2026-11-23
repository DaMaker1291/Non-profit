# Teacher review form — one lesson, one version

This form is for a qualified subject teacher reviewing an authored lesson. It
records a professional judgement; it is **not** a learner result, an
institutional approval, or a substitute for the school's own quality process.

**No learner data belongs on this form.** Do not write a pupil's name, class
list, marks or identifying details here. Reviewing content needs no pupil
consent because the content contains no pupil data. Any learner pilot has a
separate consent and de-identification protocol in
[`docs/PILOT_PROTOCOL.md`](./PILOT_PROTOCOL.md).

## 1. Reviewer and scope

```text
reviewer name:
role and subject:
qualifications / current teaching context:
school or institution (optional):
conflict of interest (author, paid contributor, none):
date:
```

## 2. Lesson identity

```text
concept id:
lesson title:
lesson version reviewed:
curriculum reference and level:
assessment item ids and versions reviewed:
pack generated at:
```

A later edit to the lesson invalidates this review. The version above is the
only version the decision covers.

## 3. Review checks

Mark each row **meets / meets with changes / does not meet**, and give the
evidence or the required change. A tick without a reason is not a review.

| Check | Verdict | Evidence or required change |
|---|---|---|
| **Explanation** — correct, complete for the stated level, no misleading simplification |  |  |
| **Objectives** — each objective is teachable and its evidence is observable |  |  |
| **Worked examples** — model the reasoning, not only the answer; no skipped step |  |  |
| **Visual representation** — figure, graph, table or diagram is accurate and readable; its caption says what it shows |  |  |
| **Misconceptions** — each is a real learner belief; the correction explains why it fails |  |  |
| **Assessment demand** — each item asks what the objective claims, at the stated level |  |  |
| **Mark scheme** — another teacher could apply it consistently; partial credit and units are explicit |  |  |
| **Feedback** — a wrong answer receives a repair specific to that error, not only “wrong” |  |  |
| **Transfer** — genuinely new, not a reworded practice item |  |  |
| **Retrieval** — spaced prompts are answerable from the lesson and not a memory quiz of trivia |  |  |
| **Accessibility alternatives** — the stated alternatives are sufficient for the named need |  |  |
| **Print** — the pupil sheet and separate key are legible, complete and correctly paginated **if a print copy was supplied** |  |  |
| **Language** — the wording is appropriate for the learners the pilot will use; a machine translation is not reviewed by this form |  |  |

## 4. Subject-specific checks

Use the rows that apply to this lesson; write “not applicable” where they do not.

| Check | Verdict | Evidence or required change |
|---|---|---|
| Units, significant figures and rounding are correct and consistent |  |  |
| Graph axes, scales, gradients, areas and read-offs are correct |  |  |
| Chemical formulae, equations, state symbols and ion charges are correct |  |  |
| Diagram labels point to the right structure and are unambiguous in monochrome |  |  |
| Code trace, expected output and error explanation are correct |  |  |
| Practical method is safe, feasible with school equipment and measures what it claims |  |  |
| Curriculum mapping is accurate and does not claim official endorsement |  |  |

## 5. Decision

```text
decision: approve / approve with changes / reject
required changes before learner use:
changes that can wait:
reviewer signature or verifiable identifier:
date:
```

**Approval conditions**

- The decision applies only to the exact lesson version and item ids above.
- “Approve with changes” is not approval until the named changes are made and
  the changed version is reviewed again.
- A review recorded here does not make a lesson institutionally approved. The
  school or awarding body's own process still applies.
- A reviewer who is also an author must say so; an author's self-check is not an
  independent review.

## 6. Recording the decision

The review must be recorded against the exact content fingerprint in the
project's review record, not only in a private document. A form left in a drawer
does not change the lesson's `unreviewed` state.

The representative five-subject pack is
[`docs/SUBJECT_REVIEW_PACK.md`](./SUBJECT_REVIEW_PACK.md). The software and
browser checks in `npm run production-check` do not review teaching quality and
must not be cited as if they did.
