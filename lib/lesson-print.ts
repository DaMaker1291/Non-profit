// ── PRINTABLE LESSONS FROM THE SAME AUTHORED LESSON ─────────────────────────
//
// A school with no student devices still needs the lesson. This module turns an
// AuthoredLesson into two SEPARATE values:
//
//   worksheetFor(lesson)  — everything a pupil may see, and no answers.
//   answerKeyFor(lesson)  — the teacher's marking copy.
//
// They are separate functions returning separate types on purpose. A single
// object with a `showAnswers` flag ends up serialised with its answers when a
// page is forgotten, and the browser's React payload is a place an answer key
// must never be. The worksheet has sanitised matching, ordering and diagram
// data: the pair map and correct order exist only in the key.
//
// Printable and digital lessons therefore share one source: the authored
// assessment's own prompt, model answer, marking criteria and question ids.
// Editing the lesson edits the sheet, and the key cannot become an older copy.
import type { AuthoredLesson, AssessmentItem, LessonDiagramShape } from "./lesson-contract";
import type { SubjectId } from "./types";
import type { StructuredPart } from "./structured-items";

export interface WorksheetObjective {
  statement: string;
  evidence: string;
}

export interface WorksheetPriorQuestion {
  id: string;
  question: string;
}

export interface WorksheetWorkedExample {
  id: string;
  prompt: string;
  steps: { move: string; why: string }[];
  answer: string;
}

export interface WorksheetMisconception {
  id: string;
  belief: string;
  whyItFails: string;
  correction: string;
  contrast: { wrong: string; right: string };
}

export interface WorksheetGuided {
  id: string;
  prompt: string;
  hint: string;
}

export interface WorksheetStructuredPart {
  id: string;
  prompt: string;
  marks: number;
  response: string;
  unit?: string;
  methodPrompt?: string;
  /** Given cells only; an answer cell is null on the worksheet. */
  table?: {
    columns: string[];
    rows: { label?: string; cells: (string | null)[] }[];
  };
  /** A blank grid for a graph/plot part. Bounds only: target points and the
   *  equation stay in the key. */
  grid?: { xMin: number; xMax: number; yMin: number; yMax: number };
  /** A read-off part points back to the learner's own graph rather than
   *  printing a key line they could copy. */
  readOff?: { from: string; at: number };
}

interface WorksheetItemBase {
  id: string;
  kind: AssessmentItem["kind"];
  prompt: string;
  marks: number;
  scored: boolean;
}

export type WorksheetAssessment =
  | (WorksheetItemBase & { kind: "short-answer" | "constructed-response"; lines: number; unit?: string })
  | (WorksheetItemBase & { kind: "structured"; parts: WorksheetStructuredPart[] })
  | (WorksheetItemBase & { kind: "code"; starterCode: string; testNames: string[]; traceRows: number })
  | (WorksheetItemBase & { kind: "gap-fill"; template: string; wordBank: string[]; gapCount: number; labels: string[] })
  | (WorksheetItemBase & { kind: "matching"; leftHeading: string; rightHeading: string; left: { id: string; text: string }[]; right: { id: string; text: string }[] })
  | (WorksheetItemBase & { kind: "ordering"; items: { id: string; text: string }[] })
  | (WorksheetItemBase & {
      kind: "diagram";
      width: number;
      height: number;
      shapes: LessonDiagramShape[];
      targets: { id: string; x: number; y: number }[];
      /** A word bank in a shuffled order; no label says where it belongs. */
      labels: { id: string; text: string }[];
      caption: string;
    });

export interface WorksheetTransfer {
  id: string;
  prompt: string;
  whyItTransfers: string;
}

export interface WorksheetRetrieval {
  id: string;
  prompt: string;
  when: string;
}

export interface PrintWorksheet {
  conceptId: string;
  title: string;
  subject: SubjectId;
  version: string;
  review: string;
  curriculum: { reference: string; level: string };
  objectives: WorksheetObjective[];
  priorKnowledge: WorksheetPriorQuestion[];
  introduction: { hook: string; why: string };
  explanation: { heading: string; paragraphs: string[] }[];
  representations: AuthoredLesson["representations"];
  workedExamples: WorksheetWorkedExample[];
  misconceptions: WorksheetMisconception[];
  guidedPractice: WorksheetGuided[];
  assessment: WorksheetAssessment[];
  transfer: WorksheetTransfer[];
  retrieval: WorksheetRetrieval[];
  summary: string[];
  accessibility: { need: string; alternative: string }[];
  provenanceNote: string;
}

export interface KeyEntry {
  id: string;
  label: string;
  answer: string;
  marking: string[];
  /** Type-specific key material: gap answers, pairings, correct order,
   *  diagram positions, expected stdout, structured part answers. */
  details?: string[];
}

export interface PrintAnswerKey {
  conceptId: string;
  title: string;
  version: string;
  priorKnowledge: KeyEntry[];
  guidedPractice: KeyEntry[];
  assessment: KeyEntry[];
  transfer: KeyEntry[];
  retrieval: KeyEntry[];
  /** The authored review state, printed so a key cannot look approved when it is not. */
  review: string;
}

/** Four marks is the authored convention for a single free-response item; a
 *  structured item carries its own total. An unscored reflection carries none. */
function marksFor(item: AssessmentItem): number {
  if (item.scored === false) return 0;
  if (item.structured) return item.structured.parts.reduce((n, p) => n + p.marks, 0);
  return 4;
}

function responseLines(kind: AssessmentItem["kind"], marks: number): number {
  if (kind === "constructed-response") return Math.max(8, marks * 2);
  return Math.max(2, marks + 1);
}

/** Deterministic shuffle: same lesson, same sheet, every print run. A random
 *  order would make two copies of one class set differ, and a teacher cannot
 *  mark a stack whose matching options moved. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffled<T>(items: readonly T[], seed: string): T[] {
  const out = items.slice();
  let state = hash(seed) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function structuredWorksheet(parts: readonly StructuredPart[]): WorksheetStructuredPart[] {
  return parts.map((p) => ({
    id: p.id,
    prompt: p.prompt,
    marks: p.marks,
    response: p.response ?? "number",
    ...(p.unit ? { unit: p.unit } : {}),
    ...(p.method ? { methodPrompt: p.method.prompt } : {}),
    ...(p.graph ? { grid: { xMin: p.graph.xMin, xMax: p.graph.xMax, yMin: p.graph.yMin, yMax: p.graph.yMax } } : {}),
    ...(p.plot ? { grid: { xMin: p.plot.xMin, xMax: p.plot.xMax, yMin: p.plot.yMin, yMax: p.plot.yMax } } : {}),
    ...(p.readOff ? { readOff: { from: p.readOff.from, at: p.readOff.at } } : {}),
    ...(p.table
      ? {
          table: {
            columns: p.table.columns,
            rows: p.table.rows.map((row) => ({
              ...(row.label ? { label: row.label } : {}),
              cells: row.cells.map((cell) => cell.given ?? null),
            })),
          },
        }
      : {}),
  }));
}

function worksheetItem(item: AssessmentItem, lessonId: string): WorksheetAssessment {
  const base = {
    id: item.id,
    kind: item.kind,
    prompt: item.prompt,
    marks: marksFor(item),
    scored: item.scored !== false,
  };
  switch (item.kind) {
    case "short-answer":
    case "constructed-response":
      return {
        ...base,
        kind: item.kind,
        lines: responseLines(item.kind, base.marks),
        ...(item.structured?.parts[0]?.unit ? { unit: item.structured.parts[0].unit } : {}),
      };
    case "structured":
      return {
        ...base,
        kind: "structured",
        parts: structuredWorksheet(item.structured?.parts ?? []),
      };
    case "code":
      return {
        ...base,
        kind: "code",
        starterCode: item.code?.starterCode ?? "",
        // Test NAMES tell the pupil what behaviour is checked; expected stdout
        // is an answer and stays in the key.
        testNames: (item.code?.tests ?? []).map((t) => t.name),
        traceRows: Math.max(4, (item.code?.tests ?? []).length + 2),
      };
    case "gap-fill": {
      const gaps = item.gaps?.gaps ?? [];
      let n = 0;
      const template = (item.gaps?.template ?? "").replace(/\[\[([^\]]+)\]\]/g, () => {
        n += 1;
        return `________ (${n})`;
      });
      return {
        ...base,
        kind: "gap-fill",
        template,
        wordBank: (item.gaps?.wordBank ?? []).slice(),
        gapCount: n,
        labels: gaps.map((g, i) => `${i + 1}. ${g.label}`),
      };
    }
    case "matching": {
      const m = item.matching;
      return {
        ...base,
        kind: "matching",
        leftHeading: m?.leftHeading ?? "Term",
        rightHeading: m?.rightHeading ?? "Meaning",
        left: (m?.left ?? []).map((x) => ({ id: x.id, text: x.text })),
        right: shuffled((m?.right ?? []).map((x) => ({ id: x.id, text: x.text })), `${lessonId}:${item.id}:matching`),
      };
    }
    case "ordering":
      return {
        ...base,
        kind: "ordering",
        items: (item.ordering?.items ?? []).map((x) => ({ id: x.id, text: x.text })),
      };
    case "diagram": {
      const d = item.diagram;
      return {
        ...base,
        kind: "diagram",
        width: d?.width ?? 500,
        height: d?.height ?? 300,
        shapes: (d?.shapes ?? []).slice(),
        targets: (d?.targets ?? []).map((t) => ({ id: t.id, x: t.x, y: t.y })),
        labels: shuffled((d?.labels ?? []).map((l) => ({ id: l.id, text: l.text })), `${lessonId}:${item.id}:diagram`),
        caption: d?.caption ?? "",
      };
    }
    default:
      return { ...base, kind: "short-answer", lines: 4 };
  }
}

export function worksheetFor(lesson: AuthoredLesson, title = lesson.conceptId): PrintWorksheet {
  return {
    conceptId: lesson.conceptId,
    title,
    subject: lesson.subject,
    version: lesson.version,
    review: lesson.declaredStatus,
    curriculum: { reference: lesson.curriculum.reference, level: lesson.curriculum.level },
    objectives: lesson.objectives.map((o) => ({ statement: o.statement, evidence: o.evidence })),
    priorKnowledge: lesson.priorKnowledge.check.map((q) => ({ id: q.id, question: q.question })),
    introduction: { ...lesson.introduction },
    explanation: lesson.explanation.map((e) => ({ heading: e.heading, paragraphs: e.paragraphs.slice() })),
    representations: lesson.representations.slice(),
    workedExamples: lesson.workedExamples.map((w) => ({
      id: w.id,
      prompt: w.prompt,
      steps: w.steps.map((s) => ({ move: s.move, why: s.why })),
      answer: w.answer,
    })),
    misconceptions: lesson.misconceptions.map((m) => ({
      id: m.id,
      belief: m.belief,
      whyItFails: m.whyItFails,
      correction: m.correction,
      contrast: { ...m.contrast },
    })),
    guidedPractice: lesson.guidedPractice.map((g) => ({ id: g.id, prompt: g.prompt, hint: g.hint })),
    assessment: lesson.assessment.map((a) => worksheetItem(a, lesson.conceptId)),
    transfer: lesson.transfer.map((t) => ({ id: t.id, prompt: t.prompt, whyItTransfers: t.whyItTransfers })),
    retrieval: lesson.retrieval.map((r) => ({ id: r.id, prompt: r.prompt, when: r.when })),
    summary: lesson.summary.slice(),
    accessibility: lesson.accessibility.map((a) => ({ need: a.need, alternative: a.alternative })),
    provenanceNote: "OpenMind-authored lesson. Printed from the same authored definition as the digital lesson; no answer key appears on this sheet.",
  };
}

function keyDetails(item: AssessmentItem): KeyEntry {
  const details: string[] = [];
  if (item.structured) {
    for (const p of item.structured.parts) {
      const answer = p.table
        ? p.table.rows
            .map((row) => `${row.label ?? "row"}: ${row.cells.map((c) => c.answer ?? c.given ?? "—").join(" | ")}`)
            .join("; ")
        : p.graph
          ? `line y = ${p.graph.m}x ${p.graph.c >= 0 ? "+" : "−"} ${Math.abs(p.graph.c)} on the printed grid`
          : p.plot
            ? `plot and join: ${p.plot.points.map((q) => `(${q.x}, ${q.y})`).join(", ")}`
            : p.readOff
              ? `read from the learner's line in part (${p.readOff.from}) at x = ${p.readOff.at}, within ±${p.readOff.tolerance}`
              : [p.accepted?.join(" / "), p.answer !== undefined ? String(p.answer) : "", p.algebra?.accepted.join(" / ")]
                  .filter(Boolean)
                  .join("; ");
      details.push(`(${p.id}) ${p.prompt} — ${answer || "see marking criteria"} [${p.marks} mark${p.marks === 1 ? "" : "s"}]`);
    }
  }
  if (item.gaps) {
    item.gaps.gaps.forEach((g, i) => {
      details.push(`Gap ${i + 1} — ${g.label}: ${g.accepted.join(" / ")}`);
    });
  }
  if (item.matching) {
    const right = new Map(item.matching.right.map((r) => [r.id, r.text]));
    for (const l of item.matching.left) {
      details.push(`${l.text} → ${right.get(item.matching.pairs[l.id] ?? "") ?? "—"}`);
    }
  }
  if (item.ordering) {
    const text = new Map(item.ordering.items.map((i) => [i.id, i.text]));
    details.push(`Correct order: ${item.ordering.correctOrder.map((id, i) => `${i + 1}. ${text.get(id) ?? id}`).join("  ")}`);
  }
  if (item.diagram) {
    const targetNumber = new Map(item.diagram.targets.map((t, i) => [t.id, i + 1]));
    for (const label of item.diagram.labels) {
      details.push(`${label.text} → position ${targetNumber.get(label.targetId) ?? "?"}`);
    }
  }
  if (item.code) {
    for (const test of item.code.tests) details.push(`${test.name}: stdout = ${JSON.stringify(test.expectedStdout)}`);
  }
  return {
    id: item.id,
    label: item.kind,
    answer: item.modelAnswer,
    marking: item.marking.slice(),
    ...(details.length > 0 ? { details } : {}),
  };
}

export function answerKeyFor(lesson: AuthoredLesson, title = lesson.conceptId): PrintAnswerKey {
  return {
    conceptId: lesson.conceptId,
    title,
    version: lesson.version,
    review: lesson.declaredStatus,
    priorKnowledge: lesson.priorKnowledge.check.map((q) => ({
      id: q.id,
      label: q.question,
      answer: q.answer,
      marking: q.targets.length > 0 ? [`Probes: ${q.targets.join(", ")}`] : [],
    })),
    guidedPractice: lesson.guidedPractice.map((g) => ({
      id: g.id,
      label: g.prompt,
      answer: g.answer,
      marking: [`Hint given: ${g.hint}`],
    })),
    assessment: lesson.assessment.map(keyDetails),
    transfer: lesson.transfer.map((t) => ({
      id: t.id,
      label: t.prompt,
      answer: t.answer,
      marking: t.marking.slice(),
    })),
    retrieval: lesson.retrieval.map((r) => ({
      id: r.id,
      label: `${r.prompt} (${r.when})`,
      answer: r.answer,
      marking: [],
    })),
  };
}
