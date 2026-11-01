// ─────────────────────────────────────────────────────────────────────────────
// FROM AN ERROR TO THE BELIEF THAT PRODUCED IT
//
// A wrong answer is not a diagnosis. This module converts the error log's
// classifications into named beliefs, and only reports a belief when the
// evidence names one — it never invents a cause for an untagged miss. That
// distinction matters: "you got it wrong" is already true and useful; "you
// believe congruence means equality" is a claim that needs evidence.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  Attempt,
  DetectedMisconception,
  ErrorClassification,
  InstructionStrategy,
} from "./types";

interface Signature {
  readonly id: string;
  readonly preferredStrategy: InstructionStrategy;
  readonly reason: string;
}

/** Error codes are produced upstream by the error log; these are the codes this
 *  ability layer understands. An unknown code is still counted as an error but
 *  is not promoted into a named misconception. */
export const ERROR_SIGNATURES: Readonly<Record<string, Signature>> = {
  congruence_is_equality: {
    id: "mod-equals",
    preferredStrategy: "FOUNDATIONAL",
    reason: "reads a ≡ b (mod n) as the equality a = b",
  },
  asserts_residues_equal: {
    id: "mod-equals",
    preferredStrategy: "FOUNDATIONAL",
    reason: "treats equal residues as equal numbers",
  },
  chooses_arbitrary_modulus: {
    id: "mod-arbitrary",
    preferredStrategy: "CONTRASTIVE",
    reason: "chooses a modulus without checking what distinctions it preserves",
  },
  modulus_without_fit: {
    id: "mod-arbitrary",
    preferredStrategy: "CONTRASTIVE",
    reason: "uses a modulus whose residue classes cannot answer the question",
  },
  checks_examples_only: {
    id: "mod-proof-gap",
    preferredStrategy: "PROOF_COACHING",
    reason: "offers checked examples where a general argument is required",
  },
  assumes_converse: {
    id: "mod-proof-gap",
    preferredStrategy: "PROOF_COACHING",
    reason: "assumes the converse of a congruence argument",
  },
  negative_residue_sign: {
    id: "mod-negative-residue",
    preferredStrategy: "WORKED_EXAMPLE",
    reason: "loses the sign when reducing a negative number",
  },
  reverses_congruence_order: {
    id: "mod-negative-residue",
    preferredStrategy: "WORKED_EXAMPLE",
    reason: "subtracts the two numbers in the wrong order",
  },
  ignores_residue_class: {
    id: "mod-residue-class",
    preferredStrategy: "INTUITIVE",
    reason: "reduces a number without keeping the class it belongs to",
  },
};

const KNOWN_IDS = new Set([
  "mod-equals",
  "mod-arbitrary",
  "mod-proof-gap",
  "mod-negative-residue",
  "mod-residue-class",
]);

/** Classify one error using the log's code, an explicit belief, or a narrow
 *  textual signature. The answer patterns are exact enough to avoid claiming a
 *  belief from a stray "=" in unrelated working. */
export function classifyError(
  code: string,
  misconceptionId?: string | null,
  answer?: string | null,
): Signature | null {
  if (misconceptionId && KNOWN_IDS.has(misconceptionId)) {
    const byId = Object.values(ERROR_SIGNATURES).find((s) => s.id === misconceptionId);
    if (byId) return byId;
    return { id: misconceptionId, preferredStrategy: "FOUNDATIONAL", reason: "an explicitly classified misconception" };
  }
  const direct = ERROR_SIGNATURES[code];
  if (direct) return direct;
  if (answer) {
    if (/\b(?:a|b|\d+)\s*=\s*(?:a|b|\d+)\b/.test(answer) && /mod|congruen/i.test(answer)) {
      return ERROR_SIGNATURES.congruence_is_equality;
    }
    if (/checked (?:three|several|some) examples?|works for \d+ examples?/i.test(answer)) {
      return ERROR_SIGNATURES.checks_examples_only;
    }
  }
  return null;
}

/**
 * Detect beliefs from the error log and attempts. A belief is actionable at two
 * hits, matching the rest of the product's recurring-slip rule; one miss can be
 * noise, and the engine must not rebuild a lesson around noise.
 */
export function detectMisconceptions(
  errorLog: readonly ErrorClassification[] = [],
  attempts: readonly Attempt[] = [],
): DetectedMisconception[] {
  const found = new Map<string, { hits: number; evidence: string[]; preferredStrategy: InstructionStrategy }>();

  const add = (signature: Signature, hits: number, evidence: string) => {
    const current = found.get(signature.id) ?? {
      hits: 0,
      evidence: [],
      preferredStrategy: signature.preferredStrategy,
    };
    current.hits += Math.max(1, hits);
    if (!current.evidence.includes(evidence)) current.evidence.push(evidence);
    found.set(signature.id, current);
  };

  for (const error of errorLog) {
    const signature = classifyError(error.code, error.misconceptionId);
    if (signature) add(signature, error.hits ?? 1, `error:${error.code}`);
  }

  for (const attempt of attempts) {
    if (attempt.correct || !attempt.errorCode) continue;
    const signature = classifyError(attempt.errorCode, null, attempt.answer);
    if (signature) add(signature, 1, `attempt:${attempt.id}`);
  }

  return [...found.entries()]
    .filter(([, value]) => value.hits >= 2)
    .map(([id, value]) => ({
      id,
      hits: value.hits,
      evidence: [...value.evidence].sort(),
      preferredStrategy: value.preferredStrategy,
    }))
    .sort((a, b) => b.hits - a.hits || a.id.localeCompare(b.id));
}

/** A single explicit belief declaration from an error log entry, if any. */
export function namedMisconception(
  errorLog: readonly ErrorClassification[] = [],
): string | null {
  const direct = errorLog.find((error) => error.misconceptionId && KNOWN_IDS.has(error.misconceptionId));
  return direct?.misconceptionId ?? null;
}
