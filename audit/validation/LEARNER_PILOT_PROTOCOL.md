# Learner pilot protocol — Independent Educational Validation 1.0

**Status: NOT CONDUCTED.** This file is a protocol and a blank record. It contains
no learner data and no outcome.

## Purpose

A small supervised pilot can reveal confusion that automated tests cannot see. It
cannot prove that OpenMind is universally effective. Report the number of pupils,
what was missing, and the limits of the sample.

## Safeguarding, consent and data

- The pilot must be organised by a responsible teacher or school, under its
  safeguarding and data-protection rules.
- Obtain consent from the pupil and, where required, their parent or carer.
- Do not put names, email addresses, school identifiers or free-text remarks that
  identify a pupil in this repository.
- Use a pseudonymous participant code (for example `P01`) held by the supervising
  adult, not in the lesson data.
- Do not publish a learner's answer, video, audio or screen recording without
  explicit permission.

## Baseline and post-assessment

For each selected lesson, define the baseline before the session and use the same
conditions afterwards. Do not use a post-assessment item as a worked example.

- **Baseline.** Ask the lesson's two prior-knowledge checks and one item from the
  concept that the pupil has not seen. Record the answer, whether it was independent,
  and the prerequisite it exposes. This is a starting observation, not a diagnosis.
- **Post-assessment.** Immediately after the independent lesson, ask the authored
  assessment items without hints or the model answer. Score deterministic items with
  the authored key; judge constructed responses against the authored marking criteria.
  Record hints and prompts separately from independent answers.
- **Transfer.** Ask the transfer item, which must be a situation the lesson did not
  use as an example. Record the reasoning, not only the result.
- **Delayed retrieval.** Use a retrieval item at its scheduled delay; do not count
  an immediate repeat as retention.
- **Teacher observation.** The supervising adult records what the pupil did, not a
  judgement about the pupil. Keep it separate from the pupil's own usability comments.

## Session sequence

For each selected lesson:

1. **Prior knowledge and baseline.** Ask the two prior-knowledge checks before
   teaching begins, plus the baseline item defined above. Record only whether the
   pupil could use the prerequisite, not a label about the pupil.
2. **Independent lesson.** The pupil uses the lesson without an adult explaining
   the mathematics. The adult may help with the device, not with the reasoning.
3. **Confusion log.** Record the section, item or sentence where the pupil
   stopped, what they tried, and what they said. Do not prompt them towards the
   answer while logging.
4. **Independent assessment.** The pupil answers the deterministic assessment
   items without the model answer open. Constructed responses are judged by the
   adult against the authored criteria; the app does not mark prose.
5. **Transfer.** Give the transfer task, which is deliberately a new situation.
   Record the pupil's reasoning, not only the final number.
6. **Delayed retention.** Revisit one retrieval item after the scheduled delay
   (next day, week later or month later, as available). Do not count immediate
   repetition as delayed retention.
7. **Compare and revise.** Compare the evidence with the lesson's stated
   objectives. Record a specific improvement to the lesson, not a general
   impression.

## Measures to report

| Measure | What to record |
| --- | --- |
| Baseline | Prior checks and one unseen item; independent or prompted |
| Completion | Which sections were reached, and where did the pupil stop? |
| Independent post-assessment | Item id, answer, correct/incorrect, hints used |
| Transfer | The pupil's reasoning and whether it used the taught invariant |
| Delayed retention | Delay, item, answer and whether it was independent |
| Teacher observation | What the pupil did, without a label about the pupil |
| Learner usability | The pupil's own words about what helped or obstructed them |
| Confusion | Section, observed behaviour and quoted comment (pseudonymous) |
| Accessibility | Device, input method, text size, any barrier encountered |

Do not convert a constructed response into a vocabulary score. Use the authored
marking criteria and a human judgement, and say when the judgement is uncertain.

## Blank record

| Participant | Lesson / version | Prior check | Sections reached | Independent items | Transfer | Delayed item | Confusion / change |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P01 |  |  |  |  |  |  |  |
| P02 |  |  |  |  |  |  |  |
| P03 |  |  |  |  |  |  |  |

## Exact lesson versions in scope

| Lesson | Version | Content hash |
| --- | --- | --- |
| `probability-basics` | `1.0.0` | `322701ed77660d3aa059d30678516bd97d37110db41f778e27444b1dc0c4b7f0` |
| `ratio` | `1.0.0` | `bb9379a0927d31572417299c2530d0d977b36812bb7ee83f49b2345822803272` |
| `proportion` | `1.0.0` | `3a3ec029f96c718603163b1a2b1fda457ef4e667a1a0d177c698bc41513b58e7` |
| `sequences` | `1.0.0` | `88a103da99de0cd9a6671a237ee07496044de3763bd66935167f3e2fbc9c041a` |
| `indices-intro` | `1.0.0` | `f6fe1d7628e7ac144566c6a084998f107a8d8f0c12a8475d3df3f1db9d3e6ef3` |

## Reporting rule

Report the sample size, missing data and the conditions of the pilot. A pupil
succeeding once is an existence proof, not an effect size. A pupil failing once is
a finding to investigate, not proof that the lesson cannot work. Do not describe
the pilot as “validated”, “effective” or “proven” without a design that can
support that claim.
