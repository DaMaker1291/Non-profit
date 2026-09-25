import type { SubjectId } from "./types";
import { translator } from "./i18n";

export const SUBJECT_IDS: SubjectId[] = ["maths", "physics", "chemistry", "biology", "computing"];

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
