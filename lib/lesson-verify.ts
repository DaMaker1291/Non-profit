import { CONCEPTS, CONCEPTS_BY_ID } from "./genome";
import {
  LESSON_CONTRACT_VERSION,
  LESSON_RANK,
  type AuthoredLesson,
  type LessonPart,
  type LessonRung,
  type LessonStatus,
} from "./lesson-contract";
import { frameworkFor } from "./lesson-frameworks";

// ─────────────────────────────────────────────────────────────────────────────
// THE LESSON GATE.
//
// Pure functions, so the same rule judges a lesson from `npm run verify` and
// from `npm run lesson:catalogue`. A second copy of these checks in a script
// would drift, and a drifted gate is worse than none: it reports green for a
// lesson nobody checked.
//
// Four families, in the order a reviewer would raise them:
//
//   ORIGINALITY  — is this lesson written, or is it the genome paragraph and a
//                  lens wearing a lesson's clothes? The check is a shared
//                  12-word shingle: assembling from sources fails it, and so
//                  does reusing a paragraph between two lessons.
//   PEDAGOGY     — does it teach before it tests? Explanation length and
//                  structure, worked examples with reasons, misconception
//                  corrections, hints on practice, marking criteria on
//                  assessment, spacing in retrieval.
//   ACCURACY     — is the answer reachable in the working, and is the answer
//                  key present at all? Subject arithmetic lives in the
//                  frameworks; this layer checks that every claim has a key.
//   TECHNICAL    — does the notation render, and does every block teach?
//
// And one honesty rule that is not a score: a lesson may not CLAIM a rung it has
// not reached. `educator_reviewed` needs a named reviewer and a date, and
// `learner_tested` needs real participants and a measure that is not click
// completion. There is no code path in this module that fills either.
// ─────────────────────────────────────────────────────────────────────────────

export interface LessonProblem {
  readonly where: string;
  readonly problem: string;
}

const BANNED_IN_PROSE = /\^|\*|sqrt\(/;
const PLACEHOLDER = /\bTODO\b|\bTBD\b|lorem ipsum|\?\?\?/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));
}

export function wordCount(text: string): number {
  return wordsOf(text).length;
}

function normalisedWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Overlapping word windows, used to detect shared prose. Twelve words is long
 *  enough that a shared window is a copied sentence rather than a shared phrase
 *  like "the same size of piece". */
export function shinglesOf(text: string, size = 12): string[] {
  const words = normalisedWords(text);
  if (words.length < size) return [];
  const out: string[] = [];
  for (let i = 0; i + size <= words.length; i++) {
    out.push(words.slice(i, i + size).join(" "));
  }
  return out;
}

/** Everything a learner reads. Answer keys and review records are deliberately
 *  excluded: they are not on the screen, so a notation rule applied to them
 *  would fail a lesson for text no learner sees. */
export function learnerVisibleText(lesson: AuthoredLesson): string[] {
  return [
    ...lesson.objectives.flatMap((o) => [o.statement, o.evidence]),
    lesson.introduction.hook,
    lesson.introduction.why,
    ...lesson.explanation.flatMap((e) => [e.heading, ...e.paragraphs]),
    ...lesson.representations.flatMap((b) => [b.body, b.caption ?? ""]),
    ...lesson.workedExamples.flatMap((w) => [
      w.prompt,
      ...w.steps.flatMap((s) => [s.move, s.why]),
      w.answer,
    ]),
    ...lesson.misconceptions.flatMap((m) => [m.belief, m.whyItFails, m.correction]),
    ...lesson.guidedPractice.flatMap((p) => [p.prompt, p.hint, p.answer, p.feedback.correct, p.feedback.incorrect]),
    ...lesson.assessment.flatMap((a) => [a.prompt]),
    ...lesson.transfer.flatMap((t) => [t.prompt, t.whyItTransfers]),
    ...lesson.retrieval.flatMap((r) => [r.prompt]),
    ...lesson.summary,
  ];
}

/** A code listing is code, not mathematics: a Python `*` must survive as
 *  written, exactly as lib/prompt.ts keeps a code block out of the formatter. */
function isCodeListing(lesson: AuthoredLesson, body: string): boolean {
  const index = lesson.representations.findIndex((b) => b.body === body);
  return index >= 0 && lesson.representations[index]?.kind === "computing.code";
}

function partCount(lesson: AuthoredLesson, part: LessonPart): number {
  switch (part) {
    case "objectives":
      return lesson.objectives.length;
    case "priorKnowledge":
      return lesson.priorKnowledge.check.length;
    case "introduction":
      return lesson.introduction.hook && lesson.introduction.why ? 1 : 0;
    case "explanation":
      return lesson.explanation.length;
    case "representations":
      return lesson.representations.length;
    case "workedExamples":
      return lesson.workedExamples.length;
    case "misconceptions":
      return lesson.misconceptions.length;
    case "guidedPractice":
      return lesson.guidedPractice.length;
    case "assessment":
      return lesson.assessment.length;
    case "transfer":
      return lesson.transfer.length;
    case "retrieval":
      return lesson.retrieval.length;
  }
}

const ALL_PARTS: readonly LessonPart[] = [
  "objectives",
  "priorKnowledge",
  "introduction",
  "explanation",
  "representations",
  "workedExamples",
  "misconceptions",
  "guidedPractice",
  "assessment",
  "transfer",
  "retrieval",
];

/** Structural, pedagogical, accuracy and technical checks for one lesson. */
export function auditLesson(lesson: AuthoredLesson): LessonProblem[] {
  const out: LessonProblem[] = [];
  const add = (problem: string) => out.push({ where: lesson.conceptId, problem });

  if (lesson.contract !== LESSON_CONTRACT_VERSION) {
    add(`contract ${lesson.contract} is not ${LESSON_CONTRACT_VERSION}`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(lesson.version)) {
    add(`version ${lesson.version} is not semantic`);
  }

  const concept = CONCEPTS_BY_ID[lesson.conceptId];
  if (!concept) {
    add("concept is not in the genome");
    return out;
  }
  if (concept.subject !== lesson.subject) {
    add(`declares ${lesson.subject} but the genome says ${concept.subject}`);
  }

  // ── 1. Every part is present ───────────────────────────────────────────────
  for (const part of ALL_PARTS) {
    if (partCount(lesson, part) === 0) add(`missing part: ${part}`);
  }

  // ── 2. Subject framework ───────────────────────────────────────────────────
  const framework = frameworkFor(lesson.subject);
  if (!framework) {
    add(`no authoring framework for ${lesson.subject}`);
  } else {
    const kinds = new Set(lesson.representations.map((b) => b.kind));
    for (const required of framework.requiredBlockKinds) {
      if (!kinds.has(required)) add(`framework ${framework.name}: no ${required} block`);
    }
    for (const item of lesson.assessment) {
      if (!framework.assessmentKinds.includes(item.kind)) {
        add(`assessment ${item.id}: ${item.kind} is not an assessment kind for ${framework.name}`);
      }
    }
    for (const rule of framework.rules) {
      for (const problem of rule.check(lesson)) add(`framework ${rule.id}: ${problem}`);
    }
  }

  // ── 3. Pedagogy floors ─────────────────────────────────────────────────────
  const paragraphs = lesson.explanation.flatMap((e) => e.paragraphs);
  const teachingWords = paragraphs.reduce((n, p) => n + wordCount(p), 0);
  if (lesson.explanation.length < 3) add("fewer than three explanation sections");
  if (paragraphs.length < 4) add("fewer than four explanation paragraphs");
  if (teachingWords < 350) add(`explanation is ${teachingWords} words, below 350`);
  for (const [i, paragraph] of paragraphs.entries()) {
    if (wordCount(paragraph) < 20) add(`explanation paragraph ${i + 1} is under 20 words`);
  }

  if (lesson.objectives.length < 2) add("fewer than two objectives");
  for (const objective of lesson.objectives) {
    if (wordCount(objective.evidence) < 5) add(`objective has no usable evidence: ${objective.statement.slice(0, 40)}`);
  }

  if (lesson.workedExamples.length < 2) add("fewer than two worked examples");
  for (const example of lesson.workedExamples) {
    if (example.steps.length < 2) add(`worked example ${example.id}: fewer than two moves`);
    for (const step of example.steps) {
      if (wordCount(step.why) < 6) add(`worked example ${example.id}: a move has no reason`);
    if (BANNED_IN_PROSE.test(step.move)) add(`worked example ${example.id}: raw notation in a move`);
    }
    if (wordCount(example.answer) < 1) add(`worked example ${example.id}: no answer`);
  }

  if (lesson.misconceptions.length < 2) add("fewer than two misconceptions taught");
  for (const m of lesson.misconceptions) {
    if (wordCount(m.whyItFails) < 12) add(`misconception ${m.id}: whyItFails is too thin to teach from`);
    if (wordCount(m.correction) < 8) add(`misconception ${m.id}: correction is too thin`);
  }

  if (lesson.guidedPractice.length < 2) add("fewer than two guided practice items");
  for (const p of lesson.guidedPractice) {
    if (wordCount(p.hint) < 5) add(`guided practice ${p.id}: no usable hint`);
    if (!p.feedback.correct.trim() || !p.feedback.incorrect.trim()) add(`guided practice ${p.id}: feedback is incomplete`);
  }

  if (lesson.assessment.length < 1) add("no assessment");
  for (const a of lesson.assessment) {
    // A DETERMINISTIC KEY IS THE ANSWER, so a short-answer item is allowed to
    // state it in one token: "3040" is complete, and padding it into a sentence
    // would be writing for the gate rather than for the learner. Correctness for
    // those items is proved instead by `npm run verify`'s own-key check (the key
    // must accept its model answer and refuse nonsense). Every item WITHOUT a
    // key keeps the six-word floor, because there a thin model answer is what a
    // learner has to mark their own work against.
    if (wordCount(a.modelAnswer) < (a.check ? 1 : 6)) add(`assessment ${a.id}: model answer is missing or too thin`);
    if (a.marking.length < 2) add(`assessment ${a.id}: fewer than two marking criteria`);
  }

  if (lesson.transfer.length < 1) add("no transfer challenge");
  for (const t of lesson.transfer) {
    if (wordCount(t.whyItTransfers) < 8) add(`transfer ${t.id}: does not say why it transfers`);
    if (t.marking.length < 2) add(`transfer ${t.id}: fewer than two marking criteria`);
  }

  if (lesson.retrieval.length < 1) add("no retrieval item");
  if (!lesson.retrieval.some((r) => r.when !== "next-day")) {
    add("no spaced retrieval: every item is scheduled for the next day");
  }

  if (lesson.accessibility.length < 2) add("fewer than two accessibility alternatives");
  if (lesson.summary.length < 2) add("summary is too short to be a summary");

  // ── 4. Technical ───────────────────────────────────────────────────────────
  const seenBlocks = new Set<string>();
  for (const block of lesson.representations) {
    if (seenBlocks.has(block.id)) add(`duplicate block id: ${block.id}`);
    seenBlocks.add(block.id);
    if (!block.body.trim()) add(`block ${block.id}: empty body`);
    if (block.notation && !block.caption?.trim()) add(`block ${block.id}: notation with no caption`);
  }

  for (const text of learnerVisibleText(lesson)) {
    if (isCodeListing(lesson, text)) continue;
    if (BANNED_IN_PROSE.test(text)) add(`raw notation in prose: ${text.slice(0, 60)}`);
    if (PLACEHOLDER.test(text)) add(`placeholder text: ${text.slice(0, 60)}`);
  }

  // ── 5. Accuracy plumbing ───────────────────────────────────────────────────
  for (const check of lesson.priorKnowledge.check) {
    if (wordCount(check.answer) < 3) add(`diagnostic ${check.id}: no usable answer`);
    const targets = check.targets.filter((t) => !CONCEPTS_BY_ID[t]);
    if (targets.length) add(`diagnostic ${check.id}: unknown targets ${targets.join(", ")}`);
  }
  for (const id of lesson.priorKnowledge.conceptIds) {
    if (!CONCEPTS_BY_ID[id]) {
      add(`prior knowledge names an unknown concept: ${id}`);
      continue;
    }
    const declared = CONCEPTS_BY_ID[lesson.conceptId]?.prereqs ?? [];
    if (declared.length > 0) {
      // The genome declares prerequisites, so a lesson may not invent one: the
      // ordering a course uses and the ordering the lesson assumes must agree.
      if (!isTransitivePrereq(id, lesson.conceptId)) {
        add(`prior knowledge ${id} is not a declared prerequisite of ${lesson.conceptId}`);
      }
    } else if (!lesson.priorKnowledge.check.some((c) => c.targets.includes(id))) {
      // A foundation concept declares no prerequisites, so the lesson's claim is
      // allowed — but it must be PROBED, or it is an assertion nobody checks.
      add(`prior knowledge ${id} is not a declared prerequisite, so a diagnostic must probe it`);
    }
  }

  // ── 6. Review records, checked for being real records ──────────────────────
  for (const review of lesson.reviews) {
    if (!ISO_DATE.test(review.date)) add(`review by ${review.reviewer}: date is not ISO`);
    if (!review.scope.trim()) add(`review by ${review.reviewer}: no scope`);
    if (review.lessonVersion !== lesson.version) {
      add(`review by ${review.reviewer} covers ${review.lessonVersion}, not ${lesson.version}`);
    }
    if (lesson.authors.some((a) => a.author === review.reviewer)) {
      add(`review by ${review.reviewer}: the author cannot review their own lesson`);
    }
  }
  for (const test of lesson.learnerTesting) {
    if (!ISO_DATE.test(test.date)) add("learner testing: date is not ISO");
    if (!Number.isInteger(test.participants) || test.participants <= 0) {
      add("learner testing: no participants");
    }
    if (test.findings.length === 0) add("learner testing: no findings");
    const measures = test.measures.join(" ").toLowerCase();
    if (!/assessment|retention|transfer|independent/.test(measures)) {
      add("learner testing measures usage, not understanding");
    }
  }

  return out;
}

function isTransitivePrereq(candidate: string, conceptId: string): boolean {
  const seen = new Set<string>();
  const stack = [...(CONCEPTS_BY_ID[conceptId]?.prereqs ?? [])];
  while (stack.length) {
    const id = stack.pop() as string;
    if (id === candidate) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...(CONCEPTS_BY_ID[id]?.prereqs ?? []));
  }
  return false;
}

/** The highest rung the EVIDENCE supports. `machineChecked` is the caller's
 *  verdict on this module's own checks; the two human rungs are read from
 *  records and cannot be inferred. */
export function earnedRung(lesson: AuthoredLesson, machineChecked: boolean): LessonRung {
  if (!machineChecked) return "draft";
  const approved = lesson.reviews.some(
    (r) => r.verdict === "approved" && r.lessonVersion === lesson.version,
  );
  const tested = lesson.learnerTesting.some((t) => t.participants > 0);
  const curriculumApproval = lesson.reviews.some(
    (r) => r.role === "curriculum-lead" && r.verdict === "approved" && r.lessonVersion === lesson.version,
  );
  if (approved && tested && curriculumApproval) return "published";
  if (approved && tested) return "learner_tested";
  if (approved) return "educator_reviewed";
  return "machine_checked";
}

/** Content problems plus the one honesty check that needs the earned rung. */
export function auditLessonForStatus(lesson: AuthoredLesson): LessonProblem[] {
  const problems = auditLesson(lesson);
  const earned = earnedRung(lesson, problems.length === 0);
  if (lesson.declaredStatus !== "needs_revision") {
    const declaredRank = LESSON_RANK[lesson.declaredStatus as LessonRung];
    if (declaredRank > LESSON_RANK[earned]) {
      problems.push({
        where: lesson.conceptId,
        problem: `claims ${lesson.declaredStatus} but the evidence reaches only ${earned}`,
      });
    }
  }
  return problems;
}

/** Originality across the whole set: a 12-word window may appear once.
 *
 *  The genome paragraph is included as a comparison text on purpose. A lesson
 *  assembled from the concept's own teaching note shares long runs with it, and
 *  that assembly is precisely the thing this milestone replaces. */
export function originalityProblems(lessons: readonly AuthoredLesson[]): LessonProblem[] {
  const out: LessonProblem[] = [];
  const owner = new Map<string, { conceptId: string; source: string }>();

  for (const lesson of lessons) {
    const texts: { source: string; text: string }[] = [
      ...lesson.explanation.flatMap((e, i) => e.paragraphs.map((p, j) => ({ source: `explanation ${i + 1}.${j + 1}`, text: p }))),
      ...lesson.workedExamples.map((w) => ({ source: `worked example ${w.id}`, text: w.prompt })),
      ...lesson.guidedPractice.map((p) => ({ source: `practice ${p.id}`, text: p.prompt })),
    ];
    for (const { source, text } of texts) {
      for (const shingle of shinglesOf(text)) {
        const previous = owner.get(shingle);
        if (previous && previous.conceptId !== lesson.conceptId) {
          out.push({
            where: lesson.conceptId,
            problem: `shares a 12-word run with ${previous.conceptId} (${previous.source} / ${source})`,
          });
          break;
        }
        if (!previous) owner.set(shingle, { conceptId: lesson.conceptId, source });
      }
    }
  }

  for (const lesson of lessons) {
    const concept = CONCEPTS_BY_ID[lesson.conceptId];
    if (!concept) continue;
    const genomeShingles = new Set(shinglesOf(concept.lesson));
    for (const paragraph of lesson.explanation.flatMap((e) => e.paragraphs)) {
      const overlap = shinglesOf(paragraph).find((s) => genomeShingles.has(s));
      if (overlap) {
        out.push({
          where: lesson.conceptId,
          problem: "explanation reuses the genome paragraph instead of teaching it",
        });
        break;
      }
    }
  }

  return out;
}

// ── catalogue ───────────────────────────────────────────────────────────────

export interface CatalogueLesson {
  readonly version: string;
  readonly declaredStatus: LessonStatus;
  readonly earnedStatus: LessonRung;
  readonly teachingWords: number;
  readonly explanationParagraphs: number;
  readonly workedExamples: number;
  readonly guidedPractice: number;
  readonly assessments: number;
  readonly transferChallenges: number;
  readonly retrievalItems: number;
  readonly reviews: number;
  readonly learnerTesting: number;
  readonly translations: readonly string[];
  readonly problems: readonly string[];
}

export interface CatalogueEntry {
  readonly conceptId: string;
  readonly title: string;
  readonly subject: string;
  readonly stage: number;
  readonly prereqs: readonly string[];
  readonly curriculum: string | null;
  readonly plan: "pilot" | "supplemental" | "none";
  readonly status: LessonStatus;
  readonly lesson: CatalogueLesson | null;
  readonly blocker: string | null;
}

export interface LessonCatalogue {
  readonly generatedBy: string;
  readonly contract: string;
  readonly at: string;
  readonly totals: {
    readonly concepts: number;
    readonly authored: number;
    readonly byStatus: Readonly<Record<string, number>>;
  };
  readonly bySubject: Readonly<
    Record<string, { concepts: number; authored: number; machineChecked: number; outline: number; metadataOnly: number }>
  >;
  readonly translations: {
    readonly languages: readonly string[];
    /** Languages with a WHOLE lesson translated automatically and not reviewed
     *  by a native speaker. Reported separately from `languages` so a count of
     *  reviewed translations cannot be read as "nothing is translated". */
    readonly machine: readonly string[];
    readonly note: string;
  };
  readonly gaps: readonly {
    readonly conceptId: string;
    readonly subject: string;
    readonly status: string;
    readonly blocker: string;
  }[];
  readonly concepts: readonly CatalogueEntry[];
}

const BLOCKER_NO_PLAN =
  "Only genome metadata exists (title, blurb, teaching note). No lesson plan and no authored lesson.";
const BLOCKER_SUPPLEMENTAL =
  "A supplemental plan assembled from the genome note and a concept lens exists. It is an outline, not authored teaching: no diagnostic, worked reasoning, assessment or review record.";
const BLOCKER_PILOT =
  "A pilot plan exists in lib/lesson-plans.ts. It is a substantial start but predates openmind.lesson/1.0 and has not been assessed against it, so it counts as an outline.";

export function buildCatalogue(
  lessons: readonly AuthoredLesson[],
  at: string,
  planState: Readonly<Record<string, "pilot" | "supplemental">> = {},
): LessonCatalogue {
  const problemsByConcept = new Map<string, LessonProblem[]>();
  for (const lesson of lessons) {
    problemsByConcept.set(lesson.conceptId, auditLessonForStatus(lesson));
  }
  const originality = originalityProblems(lessons);
  for (const problem of originality) {
    const existing = problemsByConcept.get(problem.where) ?? [];
    existing.push(problem);
    problemsByConcept.set(problem.where, existing);
  }

  const byStatus: Record<string, number> = {
    metadata_only: 0,
    outline: 0,
    draft: 0,
    machine_checked: 0,
    educator_reviewed: 0,
    learner_tested: 0,
    published: 0,
    needs_revision: 0,
  };
  const bySubject: Record<
    string,
    { concepts: number; authored: number; machineChecked: number; outline: number; metadataOnly: number }
  > = {};

  const entries: CatalogueEntry[] = [];
  const gaps: { conceptId: string; subject: string; status: string; blocker: string }[] = [];

  for (const concept of CONCEPTS) {
    const lesson = lessons.find((l) => l.conceptId === concept.id) ?? null;
    const subjectTotals = (bySubject[concept.subject] ??= {
      concepts: 0,
      authored: 0,
      machineChecked: 0,
      outline: 0,
      metadataOnly: 0,
    });
    subjectTotals.concepts += 1;

    let status: LessonStatus;
    let summary: CatalogueLesson | null = null;

    if (lesson) {
      const problems = problemsByConcept.get(lesson.conceptId) ?? [];
      const earned = earnedRung(lesson, problems.length === 0);
      status = lesson.declaredStatus === "needs_revision" ? "needs_revision" : earned;
      summary = {
        version: lesson.version,
        declaredStatus: lesson.declaredStatus,
        earnedStatus: earned,
        teachingWords: lesson.explanation
          .flatMap((e) => e.paragraphs)
          .reduce((n, p) => n + wordCount(p), 0),
        explanationParagraphs: lesson.explanation.flatMap((e) => e.paragraphs).length,
        workedExamples: lesson.workedExamples.length,
        guidedPractice: lesson.guidedPractice.length,
        assessments: lesson.assessment.length,
        transferChallenges: lesson.transfer.length,
        retrievalItems: lesson.retrieval.length,
        reviews: lesson.reviews.length,
        learnerTesting: lesson.learnerTesting.length,
        translations: lesson.translations
          .filter((t) => t.status !== "none")
          .map((t) => t.language),
        problems: problems.map((p) => p.problem),
      };
      subjectTotals.authored += 1;
      if (earned === "machine_checked") subjectTotals.machineChecked += 1;
    } else {
      status = planState[concept.id] ? "outline" : "metadata_only";
      if (status === "outline") subjectTotals.outline += 1;
      else subjectTotals.metadataOnly += 1;
    }

    byStatus[status] = (byStatus[status] ?? 0) + 1;

    const plan = planState[concept.id] ?? "none";
    const blocker =
      status === "metadata_only"
        ? BLOCKER_NO_PLAN
        : status === "outline"
          ? plan === "pilot"
            ? BLOCKER_PILOT
            : BLOCKER_SUPPLEMENTAL
          : null;

    entries.push({
      conceptId: concept.id,
      title: concept.title,
      subject: concept.subject,
      stage: concept.stage,
      prereqs: concept.prereqs,
      curriculum: lesson ? `${lesson.curriculum.reference} (${lesson.curriculum.level})` : null,
      plan,
      status,
      lesson: summary,
      blocker,
    });

    if (blocker) gaps.push({ conceptId: concept.id, subject: concept.subject, status, blocker });
  }

  const languages = new Set<string>();
  const machineLanguages = new Set<string>();
  for (const lesson of lessons) {
    for (const translation of lesson.translations) {
      if (translation.status === "human-reviewed") languages.add(translation.language);
      else if (translation.status === "machine") machineLanguages.add(translation.language);
    }
  }

  return {
    generatedBy: "scripts/lesson-catalogue.mjs",
    contract: LESSON_CONTRACT_VERSION,
    at,
    totals: {
      concepts: CONCEPTS.length,
      authored: lessons.length,
      byStatus,
    },
    bySubject,
    translations: {
      languages: [...languages].sort(),
      machine: [...machineLanguages].sort(),
      note: "`languages` counts complete, human-reviewed lesson translations. `machine` counts whole lessons translated automatically and NOT reviewed by a native-speaking teacher — shown only with that status printed beside them, never as approved. The 15-language dictionaries cover concept titles, blurbs and UI strings, not teaching prose.",
    },
    gaps,
    concepts: entries,
  };
}
