// ─────────────────────────────────────────────────────────────────────────────
// STUDY ROUTES — WHERE TO SEE THIS IDEA, WATCH IT OR TRY IT AGAIN.
//
// The lesson already carries the teaching, a live worked example and practice.
// What it did not carry was a dependable answer to the learner's next question:
// "where can I see this explained another way?" Twenty-four secondary-learning
// sites were reviewed for `docs/LEARNING_DESIGN.md`; the strongest common
// pattern was not one magic provider but a ROUTE to a video, a visual model and
// real exam questions beside the explanation.
//
// These are SEARCH routes, not claims that a particular video teaches this
// exact concept. That distinction is the same one `lib/lesson-media.ts` makes:
// an exact-concept video is labelled as such and only exists where somebody
// verified it; a provider search is honest about being a search. The learner
// can see the provider before opening it, and the card says it is external.
//
// All URLs are the provider's own search page. Nothing is embedded, proxied,
// copied or fetched by the lesson: the link opens only when the learner chooses
// it. The URL shapes were resolved against the providers' own search pages when
// this map was written; they are not presented as vetted exact-concept links.
// ─────────────────────────────────────────────────────────────────────────────

import { CONCEPTS_BY_ID } from "./genome";
import type { SubjectId } from "./types";

export type StudyResourceKind = "video" | "visual" | "exam";

export interface StudyResource {
  readonly id: string;
  readonly label: string;
  readonly url: string;
  readonly kind: StudyResourceKind;
}

interface Provider {
  readonly id: string;
  readonly label: string;
  readonly kind: StudyResourceKind;
  readonly base: string;
}

/** A source every concept can use for another explanation or a video. */
const COMMON: readonly Provider[] = [
  {
    id: "khan",
    label: "Khan Academy",
    kind: "video",
    base: "https://www.khanacademy.org/search?page_search_query=",
  },
  {
    id: "bbc",
    label: "BBC Bitesize",
    kind: "video",
    base: "https://www.bbc.co.uk/bitesize/search?q=",
  },
  {
    id: "youtube",
    label: "YouTube",
    kind: "video",
    base: "https://www.youtube.com/results?search_query=",
  },
];

/** Subject-specific routes. A provider is only added where it actually has a
 *  substantial bank for that subject; the review document records the evidence. */
const BY_SUBJECT: Partial<Record<SubjectId, readonly Provider[]>> = {
  maths: [
    {
      id: "corbettmaths",
      label: "Corbettmaths",
      kind: "video",
      base: "https://corbettmaths.com/?s=",
    },
    {
      id: "pmt",
      label: "Physics & Maths Tutor",
      kind: "exam",
      base: "https://www.physicsandmathstutor.com/?s=",
    },
    {
      id: "geogebra",
      label: "GeoGebra",
      kind: "visual",
      base: "https://www.geogebra.org/search?query=",
    },
  ],
  physics: [
    {
      id: "pmt",
      label: "Physics & Maths Tutor",
      kind: "exam",
      base: "https://www.physicsandmathstutor.com/?s=",
    },
    {
      id: "phet",
      label: "PhET",
      kind: "visual",
      base: "https://phet.colorado.edu/en/search?q=",
    },
  ],
  chemistry: [
    {
      id: "phet",
      label: "PhET",
      kind: "visual",
      base: "https://phet.colorado.edu/en/search?q=",
    },
  ],
  biology: [],
  computing: [],
};

/** A concept's English title is used for the query on purpose: the providers'
 *  indexes are in English, and the learner can read the concept title in their
 *  own language above the card. The URL is encoded, never assembled with raw
 *  spaces. */
export function studyResourcesFor(conceptId: string, subject: SubjectId): StudyResource[] {
  const title = CONCEPTS_BY_ID[conceptId]?.title ?? conceptId;
  const query = `${title} GCSE`;
  return [...COMMON, ...(BY_SUBJECT[subject] ?? [])].map((provider) => ({
    id: provider.id,
    label: provider.label,
    kind: provider.kind,
    url: `${provider.base}${encodeURIComponent(query)}`,
  }));
}
