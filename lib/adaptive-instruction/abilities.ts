// ─────────────────────────────────────────────────────────────────────────────
// THE ABILITY CATALOG
//
// The existing genome models concepts and prerequisite edges; it did not yet
// contain a first-class mathematical-ability model. This catalog is the small,
// explicit bridge the adaptive engine needs, beginning with the modular
// arithmetic ability from the brief. Every prerequisite names its OWN mastery
// threshold, because "ready" is not one universal number.
//
// These are authored definitions, not board-approved claims. `estimatedMinutes`
// is a provisional empirical estimate and is never derived from difficultyBand.
// ─────────────────────────────────────────────────────────────────────────────
import type { MathematicalAbility, PrerequisiteStatus } from "./types";

export const ABILITIES: readonly MathematicalAbility[] = [
  {
    id: "nt-mod-residue-classes",
    title: "Residue classes",
    objective: "Read a remainder as a class of numbers, not a single number.",
    difficultyBand: 2,
    estimatedMinutes: 12,
    prerequisites: [],
    misconceptionIds: ["mod-residue-class"],
  },
  {
    id: "nt-mod-congruence",
    title: "Congruence",
    objective: "Use a ≡ b (mod n) to mean that n divides a − b.",
    difficultyBand: 2,
    estimatedMinutes: 15,
    prerequisites: [
      {
        abilityId: "nt-mod-residue-classes",
        minMastery: 0.4,
        why: "A congruence is a statement about residue classes; without that idea the notation is just an equals sign with extra marks.",
      },
    ],
    misconceptionIds: ["mod-equals", "mod-negative-residue"],
  },
  {
    id: "nt-mod-select-modulus",
    title: "Select a modulus",
    objective:
      "Choose a modulus that can distinguish the property being tested, and explain why another modulus cannot.",
    difficultyBand: 3,
    estimatedMinutes: 25,
    prerequisites: [
      {
        abilityId: "nt-mod-residue-classes",
        minMastery: 0.5,
        why: "Selecting a modulus requires knowing what a residue class separates.",
      },
      {
        abilityId: "nt-mod-congruence",
        minMastery: 0.75,
        why: "The learner must be able to read congruence independently before choosing the modulus that creates it.",
      },
    ],
    misconceptionIds: [
      "mod-equals",
      "mod-arbitrary",
      "mod-negative-residue",
      "mod-proof-gap",
      "mod-residue-class",
    ],
  },
];

export const ABILITY_BY_ID: Readonly<Record<string, MathematicalAbility>> = Object.fromEntries(
  ABILITIES.map((ability) => [ability.id, ability]),
);

export function abilityById(id: string): MathematicalAbility {
  const ability = ABILITY_BY_ID[id];
  if (!ability) throw new Error(`Unknown mathematical ability: ${id}`);
  return ability;
}

/**
 * Read only the prerequisites this ability declares. The result is ordered as
 * the curriculum declares them, so a route is reproducible.
 */
export function prerequisiteStatuses(
  ability: MathematicalAbility,
  mastery: Readonly<Record<string, number>>,
): PrerequisiteStatus[] {
  return ability.prerequisites.map((prereq) => {
    const measured = mastery[prereq.abilityId] ?? 0;
    return {
      abilityId: prereq.abilityId,
      mastery: measured,
      minMastery: prereq.minMastery,
      ready: measured >= prereq.minMastery,
      why: prereq.why,
    };
  });
}

/** The first prerequisite that is not ready, in declared order. */
export function firstUnmetPrerequisite(
  ability: MathematicalAbility,
  mastery: Readonly<Record<string, number>>,
): PrerequisiteStatus | null {
  return prerequisiteStatuses(ability, mastery).find((status) => !status.ready) ?? null;
}
