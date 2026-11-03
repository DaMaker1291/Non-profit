import type { SubjectId } from "./types";
import { translator } from "./i18n";

export const SUBJECT_IDS: SubjectId[] = ["maths", "physics", "chemistry", "biology", "computing"];

/**
 * Put a learner's MAIN subject first, without inventing a second record.
 *
 * `subjects[0]` is the subject the shell, Home, the context strip and the
 * baseline diagnostic open by default. Adding chemistry to a physics-only
 * profile used to leave physics first, so a learner who believed they had
 * changed subject still met physics everywhere. This is the ONE owner of that
 * order: the chosen main subject leads, the rest keep their own order, and a
 * duplicate or unknown value cannot enter the list.
 */
export function withMainSubject(
  subjects: readonly SubjectId[],
  main: SubjectId | undefined,
): SubjectId[] {
  const out: SubjectId[] = [];
  const seen = new Set<SubjectId>();
  for (const subject of [main, ...subjects]) {
    if (!subject || seen.has(subject) || !SUBJECT_IDS.includes(subject)) continue;
    seen.add(subject);
    out.push(subject);
  }
  return out;
}

export const SUBJECT_LABELS: Record<SubjectId, string> = {
  maths: "subj.maths",
  physics: "subj.physics",
  chemistry: "subj.chemistry",
  biology: "subj.biology",
  computing: "subj.computing",
};

/** Translated subject name — falls back to the id when unknown. */
export function subjectLabel(id: string, lang?: string): string {
  const key = SUBJECT_LABELS[id as SubjectId];
  if (!key) return id;
  return translator(lang ?? "en")(key);
}

export function subjectFromParam(raw: string | string[] | undefined): SubjectId {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return (SUBJECT_IDS as string[]).includes(v ?? "") ? (v as SubjectId) : "maths";
}
