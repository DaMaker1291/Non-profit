// Language profile pipeline (§3): language stops being a UI setting and
// starts being teaching context. Every explanation receives this context so
// the engine teaches IN the language while preserving school terminology.
import type { StudentProfile } from "./types";
import { langMeta } from "./i18n";

export interface LanguageProfile {
  interface: string;
  teaching: string;
  answer: string;
  school: string;
  voice: string;
  keepTermsIn: string;
  mixed: boolean;
}

export function languageProfile(p: StudentProfile): LanguageProfile {
  const teaching = p.teachingLang ?? p.language;
  const answer = p.answerLang ?? teaching;
  const school = p.schoolLang ?? p.language;
  return {
    interface: p.language,
    teaching, answer, school,
    voice: teaching,
    keepTermsIn: school,
    mixed: teaching !== school,
  };
}

/** One-line teaching directive prepended to tutor/explanation context. */
export function teachingDirective(p: StudentProfile): string {
  const lp = languageProfile(p);
  const name = (c: string) => langMeta(c).name;
  if (!lp.mixed) return `Teach in ${name(lp.teaching)}.`;
  return `Explain in ${name(lp.teaching)}, but keep important scientific terms in ${name(lp.keepTermsIn)} (e.g. photosynthesis, equation). The student replies in ${name(lp.answer)}.`;
}
