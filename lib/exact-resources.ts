// ─────────────────────────────────────────────────────────────────────────────
// EXACT-CONCEPT RESOURCE RECOMMENDATION.
//
// A provider SEARCH URL is not a recommendation: it makes the learner find the
// relevant resource themselves. This module offers resources whose metadata
// names the exact concept. Today those are the plan videos `lib/lesson-media.ts`
// already verifies as concept-scoped; the internal lesson and, where eligible,
// the offline package always come first.
//
// There is no English fallback for a learner taught in another language and no
// video for a learner who chose text only. Unknown metadata stays unknown: file
// size, transcripts, registration and region restrictions are not inferred
// from a URL.
// ─────────────────────────────────────────────────────────────────────────────
import { CONCEPTS_BY_ID } from "./genome";
import { planFor, teachingLanguages } from "./lesson-plans";
import { videoFor } from "./lesson-media";
import { PILOT_SEQUENCE } from "./pilot";
import type { DataPreference } from "./types";

export interface ResourceContext {
  readonly teachingLang: string;
  readonly examLang?: string;
  readonly dataPreference?: DataPreference;
  readonly levelId?: string | null;
}

export type ResourceKind = "internal-lesson" | "offline-pack" | "external-video";

export interface RecommendedResource {
  readonly id: string;
  readonly kind: ResourceKind;
  readonly title: string;
  /** A same-origin route or the provider's exact resource URL. Never search. */
  readonly url: string;
  readonly language: string;
  readonly external: boolean;
  readonly offlineAvailable: boolean;
  readonly contentType: "text-lesson" | "lesson-package" | "video";
  readonly provider: string | null;
  readonly duration: string | null;
  readonly captions: "human" | "auto" | "none" | "unknown" | null;
  readonly transcript: "available" | "none" | "unknown";
  readonly fileSizeBytes: number | null;
  readonly registrationRequired: "yes" | "no" | "unknown";
  readonly regionRestricted: "yes" | "no" | "unknown";
  readonly pedagogicalReview: "none" | "subject-reviewed";
  readonly linkStatus: "not-rechecked-in-this-build" | "checked-in-this-build";
  readonly limitations: readonly string[];
}

export interface Recommendation {
  readonly conceptId: string;
  readonly requestedLanguage: string;
  readonly examLanguage: string;
  readonly dataPreference: DataPreference;
  readonly resources: readonly RecommendedResource[];
  /** Why no external resource is present. This is a metadata fact, never a
   *  provider-outage claim. */
  readonly externalReason:
    | "exact-language-match"
    | "text-only-preference"
    | "no-language-match"
    | "no-exact-resource";
}

let exactCache: RecommendedResource[] | null = null;

/** Every exact-concept video the authored plans carry, with only the metadata
 *  those plans actually record. */
export function exactVideoResources(): readonly RecommendedResource[] {
  if (exactCache) return exactCache;
  const out: RecommendedResource[] = [];
  for (const concept of Object.values(CONCEPTS_BY_ID)) {
    const plan = planFor(concept.id);
    const video = plan ? videoFor(plan) : null;
    if (!plan || !video) continue;
    out.push({
      id: `video:${concept.id}`,
      kind: "external-video",
      title: video.title,
      url: video.url,
      language: video.language,
      external: true,
      offlineAvailable: false,
      contentType: "video",
      provider: video.source,
      duration: video.length ?? null,
      captions: video.captions,
      transcript: "unknown",
      fileSizeBytes: null,
      registrationRequired: "unknown",
      regionRestricted: "unknown",
      pedagogicalReview: plan.review === "subject-reviewed" ? "subject-reviewed" : "none",
      linkStatus: "not-rechecked-in-this-build",
      limitations: [
        "The link resolved when it was authored; it has not been rechecked in this build.",
        "Transcript availability has not been verified.",
        "The file size and mobile-data cost are unknown, so none are estimated.",
        "The video is external, link-only and is not available for offline use.",
      ],
    });
  }
  exactCache = out;
  return out;
}

/** The recommendation order the product can actually prove:
 *  1. internal text teaching;
 *  2. the offline package, where the concept is in the authored pack allowlist;
 *  3. an exact video, only when its audio language equals the teaching language
 *     and the learner has not chosen text-only.
 *
 * `levelId` is accepted so a reviewed catalogue can filter on it later. The
 * current video records carry no level, so no level match is invented. */
export function recommendResources(conceptId: string, ctx: ResourceContext): Recommendation {
  const concept = CONCEPTS_BY_ID[conceptId];
  if (!concept) throw new Error(`unknown concept: ${conceptId}`);
  // The lesson's OWN language, after the same fallback `planFor` applies. A
  // Bengali request with no complete Bengali plan is taught in English, and the
  // recommendation must say so instead of labelling English prose as Bengali.
  const translated = ctx.teachingLang === "en" || teachingLanguages(conceptId).includes(ctx.teachingLang);
  const planLanguage = translated ? ctx.teachingLang : "en";
  const plan = planFor(conceptId, planLanguage);
  if (!plan) throw new Error(`no lesson plan: ${conceptId}`);
  const dataPreference = ctx.dataPreference ?? "balanced";
  const review = plan.review === "subject-reviewed" ? "subject-reviewed" : "none";
  const resources: RecommendedResource[] = [
    {
      id: `internal:${conceptId}`,
      kind: "internal-lesson",
      title: concept.title,
      url: `/learn/${concept.subject}/${conceptId}`,
      language: planLanguage,
      external: false,
      offlineAvailable: false,
      contentType: "text-lesson",
      provider: "OpenMind",
      duration: null,
      captions: null,
      transcript: "unknown",
      fileSizeBytes: null,
      registrationRequired: "no",
      regionRestricted: "no",
      pedagogicalReview: review,
      linkStatus: "checked-in-this-build",
      limitations: [
        review === "subject-reviewed"
          ? "The lesson carries a subject-review record."
          : "The lesson has not been reviewed by a subject teacher.",
        translated
          ? "The teaching text is in the requested language."
          : `No complete translation exists, so this lesson is in ${planLanguage.toUpperCase()}.`,
        "This route needs the app to be reachable; it is not the offline pack.",
      ],
    },
  ];

  if (PILOT_SEQUENCE.includes(conceptId)) {
    resources.push({
      id: `offline:${conceptId}`,
      kind: "offline-pack",
      title: `${concept.title} — offline lesson`,
      url: `/offline/study?concept=${encodeURIComponent(conceptId)}`,
      language: planLanguage,
      external: false,
      offlineAvailable: true,
      contentType: "lesson-package",
      provider: "OpenMind",
      duration: null,
      captions: null,
      transcript: "unknown",
      fileSizeBytes: null,
      registrationRequired: "no",
      regionRestricted: "no",
      pedagogicalReview: review,
      linkStatus: "checked-in-this-build",
      limitations: [
        translated
          ? "The pack's teaching text is in the requested language; practice questions are currently English-authorised."
          : `The pack's teaching text is in ${planLanguage.toUpperCase()}; practice questions are also English.`,
        "The exact device storage size is not measured here.",
      ],
    });
  }

  const exact = exactVideoResources().find((r) => r.id === `video:${conceptId}`) ?? null;
  let externalReason: Recommendation["externalReason"] = "no-exact-resource";
  if (exact) {
    if (dataPreference === "text") {
      externalReason = "text-only-preference";
    } else if (exact.language !== ctx.teachingLang) {
      externalReason = "no-language-match";
    } else {
      resources.push(exact);
      externalReason = "exact-language-match";
    }
  }

  return {
    conceptId,
    requestedLanguage: ctx.teachingLang,
    examLanguage: ctx.examLang ?? ctx.teachingLang,
    dataPreference,
    resources,
    externalReason,
  };
}

/** A direct resource URL names the resource. It is not a provider homepage and
 *  not a search results page. */
export function isDirectResourceUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.pathname === "/" || u.pathname === "") return false;
    const search = `${u.pathname}${u.search}`.toLowerCase();
    return !/search|page_search_query|results\?search_query|\/results\//.test(search);
  } catch {
    return false;
  }
}
