# Educator review — outreach pack

**Status: 0 reviews completed. 0 reviewers approached by this repository.**
Nothing in this folder is an approval. The nine packs in `educator-packs/` are
labelled NOT REVIEWED, and no code path can change that label — only a named
teacher editing `lib/learning-research.ts` or the pack itself can.

This document exists so that the first nine reviews can start without another
round of design work: it names the role needed, the nine models to be reviewed,
what a reviewer is actually asked to do, and the message to send. It deliberately
does **not** name any individual teacher as a reviewer — these are open requests,
not completed reviews. The full per-model programme, including what to test in
each model and how a response is recorded, is `NINE-MODEL-REVIEW-PROGRAMME.md`;
the reviewer-facing kit is `EDUCATOR-REVIEW-KIT.md` and the structured response
is `EDUCATOR-FEEDBACK-FORM.md`. The isolated demo is `EDUCATOR-DEMO.md`
(`npm run educator:demo`), and the five ready-to-send subject messages are
`EDUCATOR-OUTREACH-MESSAGES.md`.

## The nine models and the specialist each needs

| Concept | Subject | Pack | Specialist profile | Where such a specialist is typically found |
|---|---|---|---|---|
| `fractions` | Maths | `educator-packs/fractions.md` | A KS2/KS3 maths teacher who teaches fraction magnitude and comparison, not only procedures; comfortable with a number-line representation. | The school's own maths department; the Association of Teachers of Mathematics (ATM) and the Mathematical Association (MA) local branches; a maths hub's teaching-for-mastery lead. |
| `fraction-ops` | Maths | `educator-packs/fraction-ops.md` | The same department, ideally the teacher who handles the Year 7 transition, because adding unlike denominators is where the misconception is named. | As above. |
| `place-value` | Maths | `educator-packs/place-value.md` | A KS2/KS3 teacher who teaches place value with a number line, not only column headings. | The school's maths department; ATM/MA branches; a maths hub lead. |
| `negatives` | Maths | `educator-packs/negatives.md` | A teacher who introduces negative numbers on a line and has a view on when the "further from zero" rule should be named. | As above. |
| `decimals` | Maths | `educator-packs/decimals.md` | A teacher who teaches decimal magnitude and ordering, including why 0.45 < 0.5. | As above. |
| `electricity-circuits` | Physics | `educator-packs/electricity-circuits.md` | A physics teacher who teaches series circuits quantitatively (V = IR) and has an opinion on when conventional current should be introduced. | The school's physics department; the Institute of Physics (IOP) teacher network; a local STEM Learning hub. |
| `atoms-elements` | Chemistry | `educator-packs/atoms-elements.md` | A chemistry teacher who teaches atomic structure, isotopes and ions at 14–16. | The school's chemistry department; the Royal Society of Chemistry (RSC) education network. |
| `cells` | Biology | `educator-packs/cells.md` | A biology teacher who teaches cell structure and specialisation, ideally someone who already teaches that root hair cells lack chloroplasts. | The school's biology department; the Royal Society of Biology (RSB) education network. |
| `algorithms-search` | Computing | `educator-packs/algorithms-search.md` | A computing teacher who teaches searching at KS4 and assesses comparison counts, not just definitions. | The school's computing department; Computing at School (CAS) regional hubs; the BCS Academy. |

Nine packs for five subjects. Five are maths (`place-value`, `negatives`,
`fractions`, `fraction-ops`, `decimals`) and can be split between two maths
reviewers; `fraction-ops` carries the most-hit misconception in the bank
(`denom-add`), so it should not be the pack that is dropped. The other four are
one each: physics, chemistry, biology, computing.

## What a reviewer is asked to do

One sitting, about 45–60 minutes per model:

1. Read the pack (objective, research basis, design decision, model assumptions,
   browser evidence, teacher notes).
2. Sign in to the scratch demo on the reviewer's own device
   (`npm run educator:demo` prints the account and routes), open
   `/learn/<subject>/<concept>`, commit a prediction as a pupil would, and use
   the model. The demo never opens the live learner store.
3. Answer the pack's question — **"would you use this to teach the concept, and
   what would you change before using it with your pupils?"** — in that order:
   subject accuracy first, then level, then wording, then the model's simplifications.
4. Mark each of the pack's "misconceptions it might accidentally introduce" as
   *acceptable at this level*, *should be fixed*, or *not an issue*.
5. Return the pack with the reviewer's name, role and date filled in.

A reviewer who says "do not use this yet" is a successful review. The packs record
that outcome as honestly as an approval. The session plan, the demo route and the
per-model questions are in `EDUCATOR-REVIEW-KIT.md`; the reviewer returns
`EDUCATOR-FEEDBACK-FORM.md` with the signed pack.

## The request message

> Hello — I am looking for a subject specialist to review one interactive lesson
> before it is used with pupils. It is a single concept, about 45 minutes, and the
> pack is written so you can judge the subject accuracy first and the interface
> second. You would get a one-page pack, a 45-minute session plan and a structured
> feedback form; the demo runs on a scratch copy, never real learner data.
> Nothing is being sold or published; the review is the point, and a "not yet" is
> as useful to me as a "yes". Would you be willing to read one?

## Rules the review must keep

- **No unsupervised testing with children.** Learner testing uses
  `LEARNER-TESTING-PROTOCOL.md`, which is currently **a draft and not approved**.
- **No unnecessary personal data.** A pack records a reviewer's name, role and
  date, and nothing else. Pupil names must not be entered anywhere.
- **Reviewer edits stay reviewer edits.** A subject correction changes the lesson
  content and the pack's status together; a pack is never marked reviewed because
  a browser check passed.
- **The review state is printed on the screen**, not just in a document: the lesson
  page shows `review: unreviewed` beside `usedFor`, so a learner is told the
  teaching has not been signed off.

## What is not claimed here

- No reviewer has been contacted. No review has been booked, declined or completed.
- The organisations above are where such a specialist is *typically* found; naming
  an organisation is not a claim that it endorses anything.
- Educator review remains **0 of 9** until a filled-in pack comes back.
