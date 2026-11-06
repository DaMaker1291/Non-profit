import type { AuthoredLesson } from "./lesson-contract";
import { learnerVisibleText } from "./lesson-verify";

// ─────────────────────────────────────────────────────────────────────────────
// IS A TRANSLATION COMPLETE, OR IS IT A HEADING WITH ENGLISH UNDER IT?
//
// The rule this module enforces is the one a pupil suffers when it is broken: a
// translated title above an English lesson. Six checks, each aimed at a way that
// happens:
//
//   1. STRUCTURE   same number of objectives, explanation sections, paragraphs
//                  per section, worked examples and steps, misconceptions,
//                  practice items, assessments, transfer tasks, retrieval items,
//                  summary lines and accessibility notes. A translated lesson
//                  that dropped a section is not the same lesson in another
//                  language.
//   2. PRESENCE    no learner-visible field is empty.
//   3. NOT A COPY  the share of learner-visible strings identical to the English
//                  is measured, and reported above a small allowance. Numbers,
//                  notation and names legitimately match; a whole paragraph that
//                  matches is untranslated text.
//   4. THE RECORD  the lesson's own `translations` array names this language.
//   5. THE RUNG    a record claiming `human-reviewed` must name who reviewed it,
//                  and a `machine` record must not. Nothing here can grant a
//                  review; this only refuses a claim with nobody behind it.
//   6. THE KEY     a deterministic answer key is language-independent, so the
//                  translated item must accept the English key's answers too,
//                  unless it adds the local spelling of the same value.
// ─────────────────────────────────────────────────────────────────────────────

export interface TranslationProblem {
  readonly conceptId: string;
  readonly language: string;
  readonly problem: string;
}

/** Fields whose LENGTH must match the English lesson. Named so a new section
 *  added to the contract fails here rather than being silently unchecked. */
function structureCounts(lesson: AuthoredLesson): Record<string, number> {
  return {
    objectives: lesson.objectives.length,
    explanation: lesson.explanation.length,
    "explanation.paragraphs": lesson.explanation.reduce((n, s) => n + s.paragraphs.length, 0),
    representations: lesson.representations.length,
    workedExamples: lesson.workedExamples.length,
    "workedExamples.steps": lesson.workedExamples.reduce((n, w) => n + w.steps.length, 0),
    misconceptions: lesson.misconceptions.length,
    guidedPractice: lesson.guidedPractice.length,
    assessment: lesson.assessment.length,
    transfer: lesson.transfer.length,
    retrieval: lesson.retrieval.length,
    summary: lesson.summary.length,
    accessibility: lesson.accessibility.length,
  };
}

/** Share of learner-visible strings that are byte-identical to the English.
 *  Compared in order: the two lessons have the same structure by check 1, so
 *  position is meaningful. */
export function untranslatedShare(english: AuthoredLesson, translated: AuthoredLesson): number {
  const a = learnerVisibleText(english);
  const b = learnerVisibleText(translated);
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let same = 0;
  for (let i = 0; i < n; i += 1) if (a[i].trim() === b[i].trim()) same += 1;
  return same / n;
}

/** Above this, a lesson is reported as carrying English. Notation, numbers and
 *  proper names legitimately match, so the allowance is not zero — but it is
 *  small enough that a section left in English is caught. */
export const UNTRANSLATED_ALLOWANCE = 0.15;

export function translationProblems(
  english: AuthoredLesson,
  translated: AuthoredLesson,
  language: string,
): TranslationProblem[] {
  const out: TranslationProblem[] = [];
  const add = (problem: string) => out.push({ conceptId: english.conceptId, language, problem });

  if (translated.conceptId !== english.conceptId) add("concept id differs from the English lesson");
  if (translated.subject !== english.subject) add("subject differs from the English lesson");

  const e = structureCounts(english);
  const t = structureCounts(translated);
  for (const key of Object.keys(e)) {
    if (e[key] !== t[key]) add(`${key}: ${t[key]} translated, ${e[key]} in English`);
  }

  const blank = learnerVisibleText(translated).filter((text) => text.trim() === "");
  if (blank.length > 0) add(`${blank.length} learner-visible field(s) are empty`);

  const share = untranslatedShare(english, translated);
  if (share > UNTRANSLATED_ALLOWANCE) {
    add(
      `${Math.round(share * 100)}% of learner-visible text is identical to the English (allowance ${Math.round(UNTRANSLATED_ALLOWANCE * 100)}%)`,
    );
  }

  const record = translated.translations.find((r) => r.language === language);
  if (!record) add("the lesson does not record this language in `translations`");
  else {
    if (record.status === "human-reviewed" && !record.reviewer) {
      add("claims a human review with nobody recorded as the reviewer");
    }
    if (record.status === "machine" && record.reviewer) {
      add("is recorded as machine and also as reviewed by a person — those cannot both be true");
    }
  }

  // A key that only the English spelling satisfies would mark a correct pupil
  // wrong for typing their own language's thousands separator.
  english.assessment.forEach((item, index) => {
    const other = translated.assessment[index];
    if (!item.check || !other?.check) return;
    for (const accepted of item.check.accepted) {
      if (!other.check.accepted.some((a) => a.replace(/\s/g, "") === accepted.replace(/\s/g, ""))) {
        add(`assessment ${item.id} no longer accepts the English key "${accepted}"`);
      }
    }
  });

  return out;
}

/** True when this language may be SHOWN, and what the page must say about it.
 *  A machine translation is showable — it is a whole lesson in the pupil's
 *  language — but only with its status printed. There is no "silently fine". */
export function translationDisclosure(
  lesson: AuthoredLesson,
  language: string,
): { showable: boolean; status: string | null } {
  const record = lesson.translations.find((r) => r.language === language);
  return { showable: Boolean(record), status: record?.status ?? null };
}
