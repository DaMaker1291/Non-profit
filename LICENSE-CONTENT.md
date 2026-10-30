# Licence for the teaching content

The **code** in this repository is MIT-licensed — see [`LICENSE`](./LICENSE).

The **teaching content** is licensed separately, because a ministry, a teacher
training college or an NGO needs the legal right to *translate and adapt* what a
learner is taught, not merely to run the program. That content is:

> **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**
> <https://creativecommons.org/licenses/by-sa/4.0/>

It covers, in every language and every translation:

- the authored lesson plans and the teaching paragraphs they carry
  (`lib/lesson-plans.ts`, `lib/lesson-plans-intl.ts`);
- the question bank, its marking explanations and its distractor notes
  (`lib/questions*.ts`, `lib/numeric-items*.ts`);
- the misconception catalogue, its coaching paragraphs and the targeted repairs
  (`lib/misconceptions.ts`, `lib/repair.ts`);
- the curriculum, concept and qualification descriptions authored here
  (`lib/genome.ts`, `lib/specifications.ts`, `lib/curricula/`).

## What this means in practice

You may share, translate, adapt and republish that content, including
commercially, provided that you:

1. **name the source** — OpenMind, with a link to this repository;
2. **license your version the same way** — a translation or adaptation is a
   derivative and stays under CC BY-SA 4.0, so the next school to find it can
   adapt it in turn;
3. **do not imply endorsement** — an adaptation is yours, not OpenMind's, and
   must not be presented as reviewed by this project (see the review states
   below).

Nothing here asks for permission to *use* the content. Translating a lesson into
a language this project has not reached is the intended use, and is why the
licence is share-alike rather than "all rights reserved".

## What is **not** covered

- **No board's examination material is bundled.** The catalogue holds
  **zero** official items, because none is licensed to this project; papers are
  modelled on a board's *published structure*, with the source recorded
  (`audit/paper-shape-coverage.json`). A real board paper stays the board's
  property, and the product is built around that: the learner brings their own
  paper and OpenMind supplies only the workspace and the diagnosis
  (`lib/content-rights.ts`).
- **Third-party names and marks** — a qualification's name is used to describe
  which syllabus an item was written for, not to claim endorsement.
- **Learner records.** They are not content and they are not ours — see below.

## Learner records belong to the learner

The record a learner produces (their answers, their evidence ledger, their
progress) is not licensed to anyone by this file. It is theirs: it can be
exported, and it can be erased through the product's own erasure door, which
removes it from the store rather than hiding it. There is no data market here
and no advertising: the product sells nothing about a learner, and the record
exists to teach that learner and nobody else.

## Review states are part of the content, not a disclaimer

Every authored lesson declares `review: "unreviewed" | "subject-reviewed"`, the
lesson page prints it, and no translation changes it. A CC BY-SA translation
that a qualified teacher has checked is *better* than one that has not — record
which one yours is, in the same field, so the next reader knows.
