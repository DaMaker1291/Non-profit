# Manual assistive-technology testing — status

**Status: NOT PERFORMED.**

This file is deliberately separate from `npm run verify:a11y`. The browser audit
measures structure that can be measured: accessible names, labels, focus
visibility, keyboard submission of the public calculation activity, phone
navigation by tap, 200% browser zoom/reflow, computed contrast on a sample,
320-px overflow, maths spans and a diagram's accessible name. It is not a
screen-reader session, and it does not establish that a learner can complete a
lesson with VoiceOver or NVDA.

## What was not performed

- No VoiceOver session on macOS or iOS was run.
- No NVDA session with Firefox or Chrome on Windows was run.
- No switch-access, eye-gaze or speech-input session was run.
- No learner used the lesson with assistive technology while an observer logged
  confusion, announcements, verbosity or navigation order.

Do not change the status above until the session has actually happened.

## Minimum session record

| Field | Record |
| --- | --- |
| Date and tester |  |
| Assistive technology and version |  |
| Browser and operating system |  |
| Lesson / exact version |  |
| Task attempted |  |
| What was announced, in order |  |
| Where the learner lost the thread |  |
| Whether the task was completed independently |  |
| Barrier and recommended correction |  |
| Severity and whether publication should be blocked |  |

A finding from this record goes into the same review ledger as an educator's
finding: it is evidence, not an automatic approval. Re-test the exact corrected
version before closing it.

## Relationship to the automated audit

The browser audit may say "the diagram has an accessible name (93 chars)" and
"each diagram callout has a labelled control (4)". Those measurements are true
about the DOM. They do not say whether a screen reader announces the name at the
right moment, whether the four selects are understandable in sequence, or whether
the learner can finish the task. Those questions require the session above.
