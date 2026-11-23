// ── THE TEACHER'S RUN SHEET, FROM THE SAME AUTHORED LESSON ──────────────────
//
// A pupil worksheet and an answer key are not a lesson plan. A teacher with one
// computer, 60 pupils and ten minutes to prepare needs the sequence: what to ask
// first, what to explain, which worked example to reveal, which misconception to
// expect, what the class does together, what they do independently, and what to
// do next. This module composes that from the AuthoredLesson the digital lesson,
// the worksheet and the presenter already use.
//
// It carries NO assessment model answers. The separate authenticated answer key
// remains the marking copy; this guide contains only the prompts, marks and
// teaching notes. A guide that duplicated the key would become a second,
// drift-prone marking surface.
import { classroomContext, type ClassroomContext } from "./classroom-session";
import type { AuthoredLesson } from "./lesson-contract";

export interface GuideStep {
  minutes: number;
  step: string;
  detail: string;
}

export interface GuideGroup {
  level: "Foundational" | "Developing" | "Applying" | "Extending";
  focus: string;
  task: string;
  check: string;
}

export interface TeacherGuide {
  conceptId: string;
  title: string;
  subject: string;
  version: string;
  review: string;
  curriculum: { reference: string; level: string };
  context: ClassroomContext;
  objectives: string[];
  preparation: string[];
  boardWork: string[];
  sequence: GuideStep[];
  groups: GuideGroup[];
  groupNote: string;
  priorKnowledge: { question: string; answer: string }[];
  explanation: { heading: string; paragraphs: string[] }[];
  workedExample: {
    prompt: string;
    steps: { move: string; why: string }[];
    answer: string;
  } | null;
  misconceptions: {
    belief: string;
    whyItFails: string;
    correction: string;
    contrast: { wrong: string; right: string };
  }[];
  guidedPractice: { prompt: string; hint: string; answer: string }[];
  assessment: { prompt: string; marks: number }[];
  assessmentTotal: number;
  exitTicket: { prompt: string; why: string } | null;
  followUp: { prompt: string; when: string }[];
  summary: string[];
  evidenceNote: string;
}

function marksFor(item: AuthoredLesson["assessment"][number]): number {
  if (item.scored === false) return 0;
  if (item.structured) return item.structured.parts.reduce((n, p) => n + p.marks, 0);
  return 4;
}

export function teacherGuideFor(
  lesson: AuthoredLesson,
  title = lesson.conceptId,
  contextId: string | undefined | null = "shared-devices",
): TeacherGuide {
  const context = classroomContext(contextId);
  const assessment = lesson.assessment.map((a) => ({
    prompt: a.prompt,
    marks: marksFor(a),
  }));
  const exit = lesson.transfer[0] ?? lesson.assessment[0] ?? null;
  const firstGuided = lesson.guidedPractice[0];
  const secondGuided = lesson.guidedPractice[1] ?? lesson.guidedPractice[0];
  const firstAssessment = lesson.assessment[0];
  const groups: GuideGroup[] = [
    {
      level: "Foundational",
      focus: "Secure the step before the new idea",
      task: firstGuided
        ? `${firstGuided.prompt} Start with the hint: ${firstGuided.hint}`
        : lesson.priorKnowledge.check[0]?.question ?? "Re-read the worked example and write the first move in your own words.",
      check: "The pupil can start the task with the hint and say which step the hint supplies.",
    },
    {
      level: "Developing",
      focus: "Use the new idea without the hint",
      task: secondGuided
        ? secondGuided.prompt
        : "Re-do the first guided question without looking at the hint, then compare with your first attempt.",
      check: "The pupil completes the task without the hint and can name the rule used.",
    },
    {
      level: "Applying",
      focus: "Apply it independently",
      task: firstAssessment?.prompt ?? "Answer the first independent question and show the method.",
      check: "The pupil answers independently; a group answer is not individual evidence.",
    },
    {
      level: "Extending",
      focus: "Transfer it to an unfamiliar problem",
      task: exit?.prompt ?? "Explain where else this idea would apply and solve one unfamiliar example.",
      check: "The pupil explains why the idea transfers, not only the answer.",
    },
  ];
  return {
    conceptId: lesson.conceptId,
    title,
    subject: lesson.subject,
    version: lesson.version,
    review: lesson.declaredStatus,
    curriculum: { reference: lesson.curriculum.reference, level: lesson.curriculum.level },
    context,
    objectives: lesson.objectives.map((o) => `${o.statement} — evidence: ${o.evidence}`),
    preparation: [
      "Print the pupil worksheet and this guide. Print the answer key separately; it is the marking copy.",
      "Have the board and exercise books ready. No pupil device, projector or laboratory is assumed.",
      context.assumptions[0],
    ],
    boardWork: [
      `Objective: ${lesson.objectives[0]?.statement ?? title}`,
      ...(lesson.workedExamples[0]
        ? [
            lesson.workedExamples[0].prompt,
            ...(lesson.workedExamples[0].steps[0]
              ? [`First move: ${lesson.workedExamples[0].steps[0].move}`]
              : []),
            "Leave the remaining moves blank until pupils supply the reason for each one.",
          ]
        : []),
      "Keep the key subject term visible for the whole lesson.",
    ],
    groups,
    groupNote: "Use the prior check or exit ticket to place pupils. These groups are temporary: move pupils after the exit ticket. Do not use school year, age or a permanent label to decide a group.",
    sequence: [
      {
        minutes: 3,
        step: "Prior knowledge",
        detail: "Ask the prior questions. Take three answers before revealing the expected answer; do not reteach the whole prerequisite.",
      },
      {
        minutes: 8,
        step: "Explain",
        detail: "Use the explanation headings below. Pause after each paragraph and ask one pupil to restate the key sentence.",
      },
      {
        minutes: 8,
        step: "Worked example",
        detail: "Reveal one step at a time. Ask why the step is allowed before showing the written reason.",
      },
      {
        minutes: 8,
        step: "Guided practice and group task",
        detail: context.groupRoutine.join(" "),
      },
      {
        minutes: 8,
        step: "Independent assessment",
        detail: "Pupils answer independently. A group answer or a sampled oral answer is formative feedback, not individual mastery evidence.",
      },
      {
        minutes: 5,
        step: "Exit ticket and close",
        detail: "Use the exit prompt below. Finish with the summary; ask one pupil to say what they will remember tomorrow.",
      },
    ],
    priorKnowledge: lesson.priorKnowledge.check.map((q) => ({ question: q.question, answer: q.answer })),
    explanation: lesson.explanation.map((e) => ({ heading: e.heading, paragraphs: e.paragraphs.slice() })),
    workedExample: lesson.workedExamples[0]
      ? {
          prompt: lesson.workedExamples[0].prompt,
          steps: lesson.workedExamples[0].steps.map((s) => ({ move: s.move, why: s.why })),
          answer: lesson.workedExamples[0].answer,
        }
      : null,
    misconceptions: lesson.misconceptions.map((m) => ({
      belief: m.belief,
      whyItFails: m.whyItFails,
      correction: m.correction,
      contrast: { ...m.contrast },
    })),
    guidedPractice: lesson.guidedPractice.map((g) => ({ prompt: g.prompt, hint: g.hint, answer: g.answer })),
    assessment,
    assessmentTotal: assessment.reduce((n, a) => n + a.marks, 0),
    exitTicket: exit
      ? {
          prompt: exit.prompt,
          why: "whyItTransfers" in exit ? exit.whyItTransfers : "Use this to check whether the idea transfers beyond the worked example.",
        }
      : null,
    followUp: lesson.retrieval.map((r) => ({ prompt: r.prompt, when: r.when })),
    summary: lesson.summary.slice(),
    evidenceNote: context.evidenceNote,
  };
}
