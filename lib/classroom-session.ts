// ── TEACHER-LED AND GROUP SESSIONS FROM THE AUTHORED LESSON ─────────────────
//
// Mode A has one teacher computer and no pupil devices; Mode B has one device
// per group. Neither can honestly claim individual mastery from a shared answer.
// This module builds the teacher's run of show from the same AuthoredLesson the
// digital lesson and the printed sheet use, so a teacher presenting the lesson
// is presenting the authored one rather than a slide deck that drifted from it.
import type { AuthoredLesson } from "./lesson-contract";
import type { LessonFigureSpec } from "./lesson-figure";

export type ClassSlideKind =
  | "objective"
  | "prior"
  | "explain"
  | "figure"
  | "worked"
  | "misconception"
  | "guided"
  | "group"
  | "assessment"
  | "transfer"
  | "summary";

/** The classroom conditions a teacher can declare before presenting. These are
 *  delivery modes, not country labels: a rural school in one country and an
 *  overcrowded urban school in another can need the same one. The default stays
 *  the existing shared-device mode so no current link changes meaning. */
export type ClassroomContextId =
  | "no-student-devices"
  | "shared-devices"
  | "individual-devices"
  | "large-class"
  | "multilingual"
  | "limited-materials";

export interface ClassroomContext {
  id: ClassroomContextId;
  label: string;
  /** One sentence a teacher can check against their room. */
  summary: string;
  /** What this mode deliberately does NOT assume. */
  assumptions: string[];
  groupRoutine: string[];
  groupPrompt: string;
  groupParagraphs: string[];
  teacherNote: string;
  evidenceNote: string;
}

export const CLASSROOM_CONTEXTS: readonly ClassroomContext[] = [
  {
    id: "no-student-devices",
    label: "No pupil devices",
    summary: "One teacher computer or a printed plan; pupils use exercise books.",
    assumptions: ["No pupil account, tablet or phone is needed.", "No projector is required; the teacher can read the prompts aloud.", "Written evidence comes from the printed worksheet, not this screen."],
    groupRoutine: [
      "Groups of four to six, exercise books only.",
      "One recorder writes the group's answer; one speaker explains the reason.",
      "Every pupil then writes the method and answer in their own book.",
      "The teacher records only what was observed; a group answer is not individual mastery.",
    ],
    groupPrompt: "Use your exercise book. Agree the answer and one reason; the recorder writes both, then everyone copies the method into their own book.",
    groupParagraphs: [
      "No pupil device is needed. Put the task on the board or read it aloud.",
      "Every pupil must be able to show the method in their own exercise book, not only the group's final answer.",
    ],
    teacherNote: "Choose one pupil to explain the reason, not only the answer. Then ask a second pupil to repeat it in their own words.",
    evidenceNote: "No learner answers are recorded in this mode. Print the worksheet for individual written evidence, or use a kiosk session for individual digital evidence.",
  },
  {
    id: "shared-devices",
    label: "Shared devices",
    summary: "One device per group, rotated between pupils.",
    assumptions: ["One device is available for each group, not for each pupil.", "Groups can rotate the device operator.", "A group answer is not one pupil's individual evidence."],
    groupRoutine: [
      "Groups of three or four, one shared device.",
      "Roles rotate: reader, recorder, challenger, device operator.",
      "Agree the answer out loud before it is entered.",
      "The teacher records only what the teacher observed; a group answer is not an individual mastery claim.",
    ],
    groupPrompt: "Every group must be ready to explain one step, not just give the final answer.",
    groupParagraphs: [
      "Use the worked example and the diagram. Agree an answer before anyone types.",
      "One person operates the device, one explains the reasoning, one challenges, one records. Rotate after each question.",
    ],
    teacherNote: "Group answers are group evidence. Do not record them as individual mastery.",
    evidenceNote: "No learner answers are recorded in this mode. Print the worksheet for individual written evidence, or use a kiosk session for individual digital evidence.",
  },
  {
    id: "individual-devices",
    label: "A device each",
    summary: "Every pupil has their own device and their own account.",
    assumptions: [
      "Every pupil can reach a working device for the whole lesson.",
      "Each pupil signs in as themselves, so an answer is that pupil's own evidence.",
      "The teacher still stops the class to explain; a device each is not a lesson of silence.",
    ],
    groupRoutine: [
      "Pupils work individually first, then pair up to explain one step to a partner.",
      "The partner checks the reasoning, not only the answer, and says which step they would have got wrong.",
      "The teacher circulates rather than presenting: stop the class only when the same error appears in three books or three screens.",
      "Every answer is that pupil's own evidence; paired discussion is not.",
    ],
    groupPrompt: "Answer on your own first. Then explain your method to a partner and let them find the step you were least sure of.",
    groupParagraphs: [
      "Work through the task on your own device. Your answers are your own evidence, so do not copy a neighbour's.",
      "When you pair up, explain the method rather than reading out the answer. A partner who can repeat your reason has understood it.",
    ],
    teacherNote: "Circulate and read three screens before deciding to stop the class. A device each makes it easy to teach nobody: the explanation is still the teacher's job.",
    evidenceNote: "Each answer is recorded against the pupil who entered it. A rate is a measurement of answers, not of understanding: read it beside the written work and what you saw.",
  },
  {
    id: "large-class",
    label: "Large class",
    summary: "One teacher and a large class, with no assumption of individual devices.",
    assumptions: ["There may be no device for each pupil or each group.", "The teacher cannot read every pupil's written answer during the lesson.", "Oral and response-card checks are valid formative evidence, not individual mastery records."],
    groupRoutine: [
      "Use shoulder partners or groups of six to eight.",
      "Ask for a show of hands, response cards or one oral answer before revealing.",
      "One recorder writes the group's answer; the teacher samples two groups.",
      "A sampled oral answer is formative feedback, not individual mastery evidence.",
    ],
    groupPrompt: "Turn to a shoulder partner. Agree the answer and one reason, then be ready to say which step your partner checked.",
    groupParagraphs: [
      "This task is designed for a large class: every pupil can answer orally or in an exercise book without waiting for a device.",
      "Sample two groups rather than trying to read every book. Use the sampled errors to decide what to reteach.",
    ],
    teacherNote: "Take three answers before revealing. Do not wait for every hand; sample, then ask the class to check the reason.",
    evidenceNote: "No learner answers are recorded in this mode. Oral and group answers are formative feedback only; print the worksheet when individual written evidence is needed.",
  },
  {
    id: "multilingual",
    label: "Multilingual class",
    summary: "Pupils' strongest language may differ from the language of the examination.",
    assumptions: ["The teacher may need to explain a term in more than one language.", "The examination's subject term still has to be taught explicitly.", "OpenMind does not claim a reviewed translation of this lesson."],
    groupRoutine: [
      "Pupils may discuss the idea in the language they understand best.",
      "The recorder writes the subject answer using the term required in the examination.",
      "The speaker explains the idea in the group's strongest language, then gives the examination term.",
      "The teacher keeps both the home-language explanation and the examination term visible.",
    ],
    groupPrompt: "Explain the idea in the language you understand best. Then write the subject answer using the term your examination requires.",
    groupParagraphs: [
      "Use the language that makes the idea understandable, then connect it to the term the examination uses.",
      "Do not replace the subject term with a translation the pupil will not see in the examination.",
    ],
    teacherNote: "Say the key term in the language pupils use, then keep the examination term on the board. Ask a pupil to use both in one sentence.",
    evidenceNote: "No learner answers are recorded in this mode. Written evidence should use the language the assessment actually requires; this screen does not claim a reviewed translation.",
  },
  {
    id: "limited-materials",
    label: "Limited materials",
    summary: "No textbook, laboratory or projector assumed; board and exercise books.",
    assumptions: ["Pupils may share a textbook or have none in front of them.", "The practical apparatus named in the lesson may not exist.", "The teacher can still use the board, oral explanation and pupils' books."],
    groupRoutine: [
      "Use the board and exercise books; do not wait for a textbook or apparatus.",
      "Groups of four: one reads the prompt aloud, one explains, one records, one checks.",
      "Substitute a safe everyday demonstration where the lesson allows it; never pretend apparatus was used.",
      "The teacher records only what was observed; a group answer is not individual mastery.",
    ],
    groupPrompt: "Use the board and your exercise book. Agree the answer and one reason; if the apparatus is missing, say what you would measure and how you would measure it.",
    groupParagraphs: [
      "The lesson must still work when the textbook, laboratory or projector is absent.",
      "Where apparatus is unavailable, use a safe everyday substitute or a planned measurement, and state the limitation.",
    ],
    teacherNote: "Name what is missing and what you are using instead. A planned measurement is legitimate evidence of method, not of apparatus you did not have.",
    evidenceNote: "No learner answers are recorded in this mode. Print the worksheet for individual written evidence; a substituted demonstration must be described honestly.",
  },
];

export function classroomContext(id: string | undefined | null): ClassroomContext {
  return CLASSROOM_CONTEXTS.find((c) => c.id === id) ?? CLASSROOM_CONTEXTS[1];
}

export interface ClassSlide {
  id: string;
  kind: ClassSlideKind;
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  bullets: string[];
  /** The teacher's own prompt. Not shown to a class unless the teacher chooses. */
  teacherPrompt: string;
  /** A group task for Mode B, phrased for one shared device. */
  groupPrompt: string;
  figure?: { spec: LessonFigureSpec; caption: string };
  answer?: string;
}

export interface ClassroomSession {
  conceptId: string;
  title: string;
  subject: string;
  version: string;
  review: string;
  slides: ClassSlide[];
  context: ClassroomContext;
  contexts: readonly ClassroomContext[];
  groupRoutine: string[];
  evidenceNote: string;
}

function paragraphs(text: string, max = 2): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function classroomSession(
  lesson: AuthoredLesson,
  title = lesson.conceptId,
  contextId: string | undefined | null = "shared-devices",
): ClassroomSession {
  const context = classroomContext(contextId);
  const slides: ClassSlide[] = [];

  slides.push({
    id: "objective",
    kind: "objective",
    eyebrow: "Lesson objective",
    heading: title,
    paragraphs: [],
    bullets: lesson.objectives.map((o) => `${o.statement} — evidence: ${o.evidence}`),
    teacherPrompt: "Read the objective aloud. Ask one pupil to say what they will be able to do by the end.",
    groupPrompt: "In your group, say the objective in your own words. The recorder writes one sentence.",
  });

  for (const q of lesson.priorKnowledge.check) {
    slides.push({
      id: `prior:${q.id}`,
      kind: "prior",
      eyebrow: "Before we start",
      heading: q.question,
      paragraphs: [],
      bullets: [],
      teacherPrompt: `Take three answers before revealing. Expected: ${q.answer}`,
      groupPrompt: "Each person answers first, then compare. One person reports the group's answer.",
      answer: q.answer,
    });
  }

  lesson.explanation.forEach((e, i) => {
    slides.push({
      id: `explain:${i}`,
      kind: "explain",
      eyebrow: "Explanation",
      heading: e.heading,
      paragraphs: e.paragraphs.slice(0, 3),
      bullets: [],
      teacherPrompt: "Pause after each paragraph. Ask a pupil to restate the key sentence.",
      groupPrompt: "Read the explanation together. The challenger asks 'why is that true?' and the group answers with evidence.",
    });
  });

  lesson.representations.forEach((r, i) => {
    slides.push({
      id: `figure:${r.id}`,
      kind: "figure",
      eyebrow: "Look closely",
      heading: r.caption ?? `Representation ${i + 1}`,
      paragraphs: [r.body],
      bullets: r.notation ? [r.notation] : [],
      teacherPrompt: "Point to the part of the diagram that carries the reasoning, not just its label.",
      groupPrompt: "Cover the caption. What does the diagram show? Then read the caption and correct your answer.",
      ...(r.figure ? { figure: r.figure } : {}),
    });
  });

  lesson.workedExamples.forEach((w) => {
    slides.push({
      id: `worked:${w.id}`,
      kind: "worked",
      eyebrow: "Worked example",
      heading: w.prompt,
      paragraphs: [],
      bullets: w.steps.map((s) => `${s.move} — because ${s.why}`),
      teacherPrompt: "Reveal one step at a time. Ask why before showing the written reason.",
      groupPrompt: "Each person explains one step. The group checks that every step has a reason.",
      answer: w.answer,
    });
  });

  lesson.misconceptions.forEach((m) => {
    slides.push({
      id: `misconception:${m.id}`,
      kind: "misconception",
      eyebrow: "Common mistake",
      heading: m.belief,
      paragraphs: [m.whyItFails, m.correction],
      bullets: [`Wrong: ${m.contrast.wrong}`, `Right: ${m.contrast.right}`],
      teacherPrompt: "Ask for a show of hands: who believed this? Treat it as a useful starting point, not a confession.",
      groupPrompt: "Find the exact step where the wrong belief breaks. Agree on one sentence that explains why.",
    });
  });

  lesson.guidedPractice.forEach((g) => {
    slides.push({
      id: `guided:${g.id}`,
      kind: "guided",
      eyebrow: "We do it together",
      heading: g.prompt,
      paragraphs: [],
      bullets: [`Hint: ${g.hint}`],
      teacherPrompt: `Work it with the class. Answer: ${g.answer}`,
      groupPrompt: "Take turns: one person starts, the next continues, the last checks. Everyone must be able to explain the answer.",
      answer: g.answer,
    });
  });

  slides.push({
    id: "group",
    kind: "group",
    eyebrow: context.label,
    heading: "Group task",
    paragraphs: context.groupParagraphs,
    bullets: lesson.guidedPractice.slice(0, 2).map((g) => g.prompt),
    teacherPrompt: context.teacherNote,
    groupPrompt: context.groupPrompt,
  });

  lesson.assessment.forEach((a) => {
    slides.push({
      id: `assess:${a.id}`,
      kind: "assessment",
      eyebrow: "You do it",
      heading: a.prompt,
      paragraphs: [],
      bullets: [],
      teacherPrompt: `Keep the answer key closed. Marking guidance: ${a.marking.join(" · ")}`,
      groupPrompt: "Answer independently first. Then compare with your group and explain any difference.",
      answer: a.modelAnswer,
    });
  });

  lesson.transfer.forEach((t) => {
    slides.push({
      id: `transfer:${t.id}`,
      kind: "transfer",
      eyebrow: "A new situation",
      heading: t.prompt,
      paragraphs: [t.whyItTransfers],
      bullets: [],
      teacherPrompt: `Listen for the reasoning, not only the answer. ${t.marking.join(" · ")}`,
      groupPrompt: "Agree one answer and one reason. Be ready to defend the reason.",
      answer: t.answer,
    });
  });

  slides.push({
    id: "summary",
    kind: "summary",
    eyebrow: "Remember",
    heading: "What we learned",
    paragraphs: [],
    bullets: lesson.summary.slice(),
    teacherPrompt: "Ask pupils to close their books and say one thing they will remember.",
    groupPrompt: "Each person says one sentence. The recorder makes a group summary of no more than three sentences.",
  });

  return {
    conceptId: lesson.conceptId,
    title,
    subject: lesson.subject,
    version: lesson.version,
    review: lesson.declaredStatus,
    slides,
    context,
    contexts: CLASSROOM_CONTEXTS,
    groupRoutine: context.groupRoutine,
    evidenceNote: context.evidenceNote,
  };
}
