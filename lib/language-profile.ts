// Language profile pipeline (§3): language stops being a UI setting and
// starts being teaching context. Every explanation receives this context so
// the engine teaches IN the language while preserving school terminology.
import type { DataPreference, StudentProfile } from "./types";
import { langMeta } from "./i18n";

export interface LanguageProfile {
  interface: string;
  teaching: string;
  answer: string;
  school: string;
  exam: string;
  secondary: string | null;
  voice: string;
  keepTermsIn: string;
  mixed: boolean;
  bilingualTerms: boolean;
  dataPreference: DataPreference;
}

export function languageProfile(p: StudentProfile): LanguageProfile {
  const teaching = p.teachingLang ?? p.language;
  const answer = p.answerLang ?? teaching;
  const school = p.schoolLang ?? p.language;
  return {
    interface: p.language,
    teaching, answer, school,
    exam: p.examLang ?? answer,
    secondary: p.secondaryLang?.trim() ? p.secondaryLang : null,
    voice: teaching,
    keepTermsIn: school,
    mixed: teaching !== school,
    bilingualTerms: p.bilingualTerms === true,
    dataPreference: p.dataPreference ?? "balanced",
  };
}

/** One-line teaching directive prepended to tutor/explanation context. */
export function teachingDirective(p: StudentProfile): string {
  const lp = languageProfile(p);
  const name = (c: string) => langMeta(c).name;
  const base = lp.mixed
    ? `Explain in ${name(lp.teaching)}, but keep important scientific terms in ${name(lp.keepTermsIn)} (e.g. photosynthesis, equation). The student replies in ${name(lp.answer)}.`
    : `Teach in ${name(lp.teaching)}.`;
  // The examination language constrains the terminology an answer is marked
  // in; it must not be silently replaced by the teaching language.
  if (lp.exam === lp.teaching) return base;
  return `${base} The examination language is ${name(lp.exam)}; use its assessment terminology where the two differ.`;
}
