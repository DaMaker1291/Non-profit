// Cultural adaptation (§14): examples in contexts the learner knows.
// No stereotypes: the student picks; the default is neutral.
//
// Both the labels and the examples are i18n KEYS, not English text — every
// sentence here renders in the learner's language via `t()`. The bank holds one
// key per (concept, culture) pair; `cul.ex.<concept>.<culture>` is authored for
// all 15 languages in lib/i18n.ts.
export const CULTURES = [
  { id: "neutral", label: "cul.neutral" },
  { id: "agriculture", label: "cul.agriculture" },
  { id: "urban", label: "cul.urban" },
  { id: "coast", label: "cul.coast" },
  { id: "sport", label: "cul.sport" },
] as const;

export type CultureId = (typeof CULTURES)[number]["id"];

const IDS = new Set<string>(CULTURES.map((c) => c.id));

/** Concepts that have culture-specific examples authored. */
const BANKED = new Set(["fractions", "percentages"]);

/** Returns the i18n KEY for the example, or null when none applies. */
export function exampleFor(conceptId: string, culture: string): string | null {
  if (!BANKED.has(conceptId)) return null;
  const id = IDS.has(culture) ? culture : "neutral";
  return `cul.ex.${conceptId}.${id}`;
}

/** Returns the i18n KEY for a culture's label. */
export function cultureLabel(id: string): string {
  return CULTURES.find((c) => c.id === id)?.label ?? id;
}
