import type {
  AccessibilityAlternative,
  AuthoredLesson,
  AuthorRecord,
  ProvenanceEntry,
} from "../../lesson-contract";

// Shared metadata for the curriculum-gap batch. The teaching content is still
// written per lesson; this helper only prevents 46 copies of the same provenance,
// authorship and access statements from drifting apart. A lesson may override any
// of these defaults when its subject needs a different alternative.
type GapContent = Omit<
  AuthoredLesson,
  | "contract"
  | "version"
  | "declaredStatus"
  | "accessibility"
  | "provenance"
  | "authors"
  | "reviews"
  | "learnerTesting"
  | "translations"
> & {
  readonly accessibility?: readonly AccessibilityAlternative[];
  readonly provenance?: readonly ProvenanceEntry[];
  readonly authors?: readonly AuthorRecord[];
};

const ACCESSIBILITY: readonly AccessibilityAlternative[] = [
  {
    need: "screen-reader",
    alternative:
      "Every expression, table and trace is also stated in words, so a reader who cannot see the layout still hears what each part represents.",
  },
  {
    need: "motor",
    alternative:
      "Answers are typed into ordinary fields or selected with standard buttons; no dragging, drawing or timed pointer movement is required.",
  },
  {
    need: "dyslexia",
    alternative:
      "Working is split into short labelled lines, and a new term is defined where it first appears rather than in a separate glossary.",
  },
];

export function defineGapLesson(input: GapContent): AuthoredLesson {
  const curriculum = input.curriculum;
  return {
    ...input,
    contract: "openmind.lesson/1.0",
    version: "1.0.0",
    declaredStatus: "draft",
    accessibility: input.accessibility ?? ACCESSIBILITY,
    provenance: input.provenance ?? [
      {
        sourceId: "openmind-authored",
        basis: "openmind-authored",
        licence: "OpenMind internal",
        attribution: "Written for OpenMind.",
        reproduction: "none",
        note:
          "The explanation, examples, practice, assessment, transfer task and retrieval prompts are original to OpenMind.",
      },
      {
        sourceId: "curriculum-citation",
        basis: "curriculum-citation",
        licence: "official-reference",
        attribution: `Scope cited against the published curriculum for ${curriculum.reference}.`,
        reproduction: "none",
      },
    ],
    authors: input.authors ?? [
      {
        author: "OpenMind curriculum team",
        role: "instructional author",
        authoredAt: "2026-11-12",
        method: "ai-assisted-then-edited",
      },
    ],
    reviews: [],
    learnerTesting: [],
    translations: [],
  };
}
