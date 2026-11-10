// ── THE DEVICE'S COPY OF AN OFFLINE LESSON ──────────────────────────────────
//
// Packs and drafts are scoped by the learner profile id that downloaded them.
// That is deliberately not a global key: a shared school handset must not show
// pupil A's lesson draft to pupil B after a handover. Sign-out removes the
// learner's packs, drafts and queued answers; if sign-out is missed, a different
// profile still cannot address the previous profile's keys.
import type { FigureSpec, Question, SubjectId } from "./types";

export interface OfflinePlan {
  objective: string;
  intuition: string;
  idea: string[];
  traps: { move: string; why: string }[];
  usedFor: string;
  figure: { spec: FigureSpec; caption: string } | null;
  workedExamples: { prompt: string; steps: string[]; answer: string }[];
}

export interface OfflinePack {
  packId: string;
  conceptId: string;
  title: string;
  subject: SubjectId | null;
  /** The language the TEACHING is actually in, after translation fallback. */
  language: string;
  /** The learner's requested teaching language, kept even when the pack fell
   *  back to English so the screen can distinguish the two. */
  requestedLanguage?: string;
  /** The language the marked practice questions are actually authored in. */
  questionLanguage?: string;
  teachingTranslated?: boolean;
  questionsTranslated?: boolean;
  /** Whole pack (teaching and questions) in the requested language. */
  complete?: boolean;
  rights: { basis: string; licence: string; note: string };
  review: string;
  issuedAt: number;
  plan: OfflinePlan;
  questions: Question[];
}

export interface OfflineAnswer {
  questionId: string;
  choiceIndex: number;
  correct: boolean;
  at: number;
  submissionId: string;
  eventId: string;
  status: "queued" | "synced" | "refused";
}

export interface OfflineDraft {
  conceptId: string;
  answers: Record<string, OfflineAnswer>;
  updatedAt: number;
}

const PACK_PREFIX = "openmind:offline-pack:";
const DRAFT_PREFIX = "openmind:offline-draft:";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

function safeId(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 96);
}

const packKey = (learnerId: string, conceptId: string) =>
  `${PACK_PREFIX}${safeId(learnerId)}:${safeId(conceptId)}`;
const draftKey = (learnerId: string, conceptId: string) =>
  `${DRAFT_PREFIX}${safeId(learnerId)}:${safeId(conceptId)}`;

export function saveOfflinePack(learnerId: string, pack: OfflinePack): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(packKey(learnerId, pack.conceptId), JSON.stringify(pack));
    return true;
  } catch { return false; }
}

export function loadOfflinePack(learnerId: string, conceptId: string): OfflinePack | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(packKey(learnerId, conceptId));
    if (!raw) return null;
    const p = JSON.parse(raw) as OfflinePack;
    return p && p.conceptId === conceptId && Array.isArray(p.questions) ? p : null;
  } catch { return null; }
}

export function localOfflinePacks(learnerId: string): OfflinePack[] {
  const s = storage();
  if (!s) return [];
  const prefix = `${PACK_PREFIX}${safeId(learnerId)}:`;
  const out: OfflinePack[] = [];
  try {
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (!k?.startsWith(prefix)) continue;
      try {
        const p = JSON.parse(s.getItem(k) ?? "") as OfflinePack;
        if (p?.conceptId && Array.isArray(p.questions)) out.push(p);
      } catch { /* one corrupt pack must not hide the others */ }
    }
  } catch { /* storage blocked */ }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}

export function loadOfflineDraft(learnerId: string, conceptId: string): OfflineDraft {
  const s = storage();
  const empty: OfflineDraft = { conceptId, answers: {}, updatedAt: 0 };
  if (!s) return empty;
  try {
    const raw = s.getItem(draftKey(learnerId, conceptId));
    if (!raw) return empty;
    const d = JSON.parse(raw) as OfflineDraft;
    return d && d.conceptId === conceptId && d.answers && typeof d.answers === "object" ? d : empty;
  } catch { return empty; }
}

export function saveOfflineDraft(learnerId: string, draft: OfflineDraft): void {
  const s = storage();
  if (!s) return;
  try { s.setItem(draftKey(learnerId, draft.conceptId), JSON.stringify({ ...draft, updatedAt: Date.now() })); }
  catch { /* storage full: the answer remains in this page's state */ }
}

/** Remove every local trace this learner left on this device. Called on
 *  sign-out, which is the handover point on a shared school computer. */
export function clearOfflineLearner(learnerId: string | null): void {
  const s = storage();
  if (!s || !learnerId) return;
  const prefixes = [`${PACK_PREFIX}${safeId(learnerId)}:`, `${DRAFT_PREFIX}${safeId(learnerId)}:`];
  try {
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && prefixes.some((p) => k.startsWith(p))) keys.push(k);
    }
    for (const k of keys) s.removeItem(k);
  } catch { /* storage blocked */ }
}

export function newOfflineSubmissionId(): string {
  const rnd = globalThis.crypto?.randomUUID?.().replace(/-/g, "")
    ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `sub_${rnd}`.slice(0, 64);
}

/** The exact device event the sync door accepts. It is deliberately marked
 *  `device` at the source too; the server overwrites that field, so a client
 *  cannot promote its own claim to server-observed truth. */
export function offlineEvent(
  learnerId: string,
  pack: OfflinePack,
  q: Question,
  choiceIndex: number,
  at: number,
  submissionId: string,
) {
  return {
    type: "answer_submitted" as const,
    id: `ev_${submissionId}`,
    schemaVersion: 1,
    learnerId,
    provenance: "device" as const,
    at,
    source: "practice" as const,
    subject: pack.subject,
    conceptId: pack.conceptId,
    specificationId: null,
    questionId: q.id,
    correct: choiceIndex === q.answer,
    chosen: choiceIndex,
    givenValue: null,
    mode: "independent" as const,
    hints: 0,
    score: null,
    ms: null,
    tags: q.misconceptionTags ?? [],
    deviceAt: at,
    certainty: null,
  };
}
