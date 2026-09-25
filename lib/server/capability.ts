// ── THE CAPABILITY RULE, IN ONE PLACE ───────────────────────────────────────
//
// A profile id is not a credential. Every learner-scoped route must be shown
// the profile's secret, and the profile it names must still hold that secret —
// otherwise an id leaking out of a URL, a screenshot or a shared link is enough
// to read a learner's plan, their weak concepts and their recorded answers.
//
// The rule lives here rather than in each route because four read doors had
// drifted to no check at all (/api/next, /api/my-pack, /api/path and
// /api/classes answered 200 to anyone holding an id) while the rest enforced
// it: a rule with five copies is a rule with four bugs.
//
// Deliberately NOT "bind a secret on first use". That behaviour belongs to the
// WRITE path, where a profile born before secrets existed mints its credential
// on its first authenticated write. A read must never create or accept one.
import type { ProfileState } from "../types";
import { getProfile } from "./store";

export type Capability =
  | { ok: true; state: ProfileState }
  | { ok: false; status: 400 | 401 | 404; error: string };

/** A presented secret must be a real token: an empty string must never be
 *  mistaken for the absence of a requirement. */
export function secretMatches(state: ProfileState, presented: unknown): boolean {
  const secret = typeof presented === "string" ? presented : "";
  return secret.length > 0 && Boolean(state.secret) && secret === state.secret;
}

/**
 * Load the named learner and check the caller's capability in one step.
 *
 * `401` for a missing or wrong secret, `404` for a learner that does not exist
 * — the same two answers, in the same order, as the read doors that already
 * enforced this. A caller cannot tell "wrong secret" from "not your learner".
 */
export async function authorizeLearner(
  id: string | null | undefined,
  presented: unknown,
): Promise<Capability> {
  if (!id) return { ok: false, status: 400, error: "missing id" };
  const state = await getProfile(id);
  if (!state) return { ok: false, status: 404, error: "not found" };
  if (!secretMatches(state, presented)) return { ok: false, status: 401, error: "unauthorized" };
  return { ok: true, state };
}
