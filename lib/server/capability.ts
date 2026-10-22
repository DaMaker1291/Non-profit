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
//
// ── TWO KINDS OF LEARNER CREDENTIAL, ONE DOOR ────────────────────────────────
//
//   1. THE CAPABILITY SECRET. Permanent, stored on the learner's own device,
//      authorises everything that learner may do (this is the household and
//      1:1 case, and it is what every pre-kiosk profile has).
//
//   2. A CLASSROOM SESSION TOKEN. Random, minted when a learner proves the PIN
//      the teacher issued, held in `kiosk-sessions.json` as a hash, and ended by
//      the server on hand-back or by expiry. It travels the SAME `secret` slot —
//      so no route needed a second transport — and it is marked `via: "kiosk"`
//      so the doors that must refuse it can ask a flag instead of re-parsing.
//
// Why the distinction is not cosmetic: a capability is permanent, unforgeable
// without the store, and identical on every device that holds it. A classroom
// session is short-lived and revocable, and a school handset must never hold the
// former for forty learners (the shared-device audit measured what that costs:
// any holder could read, export or erase every remembered learner). Marking the
// difference at the one place credentials are checked is what makes "a learner
// cannot erase a record from a kiosk" a property of the system rather than a
// promise made by four route files.
import type { ProfileState } from "../types";
import { getProfile, resolveKioskSession } from "./store";

/** How the caller proved themselves. `classId` is present only for a classroom
 *  session, and names the class the PIN was issued for — a session is scoped to
 *  it, so a token cannot act outside the room it was minted in. */
export type CredentialKind = "capability" | "kiosk";

export type Capability =
  | { ok: true; state: ProfileState; via: CredentialKind; classId?: string }
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
 *
 * A classroom token is checked FIRST and only against the learner it names, so a
 * token minted for one child can never be replayed for another by changing `id`.
 */
export async function authorizeLearner(
  id: string | null | undefined,
  presented: unknown,
): Promise<Capability> {
  if (!id) return { ok: false, status: 400, error: "missing id" };
  const state = await getProfile(id);
  if (!state) return { ok: false, status: 404, error: "not found" };
  if (typeof presented === "string" && presented.length >= 32) {
    const session = await resolveKioskSession(presented);
    // A session that exists but names ANOTHER learner is not a credential for
    // this one: treat it exactly like a wrong secret rather than reading it.
    if (session && session.profileId === state.profile.id) {
      return { ok: true, state, via: "kiosk", classId: session.classId };
    }
  }
  if (!secretMatches(state, presented)) return { ok: false, status: 401, error: "unauthorized" };
  return { ok: true, state, via: "capability" };
}

/**
 * A classroom session token, resolved AGAINST a learner, so a route can ask
 * "is this the credential of THIS record?" before it opens the transaction.
 *
 * It exists because the answer needs the store (`resolveKioskSession` is async,
 * the port's contract), while the in-transaction check is a synchronous
 * mutator guard. So the resolution happens here, once, on the request thread,
 * and the fact travels into the lock — the alternative was a second comparison
 * inside a mutator, which is how the two came to disagree in the first place.
 *
 * Null on anything that is not a live session for this learner: an expired or
 * revoked token, a token minted for another child, or an ordinary capability
 * (which the mutator checks itself).
 */
export async function classroomSessionFor(
  id: string | null | undefined,
  presented: unknown,
): Promise<string | null> {
  if (!id || typeof presented !== "string" || presented.length < 32) return null;
  const session = await resolveKioskSession(presented);
  return session && session.profileId === id ? id : null;
}

/**
 * MAY THIS CALLER ACT AS THIS LEARNER? — the guard every learner mutator makes
 * inside its own transaction, and the ONE copy of it.
 *
 * There used to be four copies of this comparison (progress, diagnostic, evidence
 * and my-paper), each written out by hand. A classroom session token is a valid
 * credential for its own learner — `authorisedProfile` accepts it, so the route
 * let the request in — and every one of those copies then compared it against the
 * record's permanent capability, found it different, and answered 401. MEASURED: a
 * provisioned learner could sign in with their PIN and then be refused practice,
 * their progress read and their own evidence. The kiosk suite missed it because it
 * asserted what a session may NOT do; nothing asserted the learner could learn.
 *
 *   presented    the token the caller sent (the `secret` slot every route uses)
 *   provenFor    the learner id `classroomSessionFor` resolved it to, or null
 *   opts.bind    whether an unbound legacy profile adopts this token. TRUE
 *                everywhere a capability arrives; FALSE where the route was
 *                already strict about a missing secret (evidence), so consolidating
 *                the copies does not quietly loosen one of them.
 *
 * A PROVEN SESSION IS NEVER BOUND. The first-writer rule exists for a capability,
 * which is a record's own device credential; writing a token that the server ends
 * at hand-back into `state.secret` would lock the learner out of their own record
 * the moment the lesson ends, and would make the next PIN sign-in look like a
 * credential change.
 *
 * Throws `unauthorized` so every caller's existing catch answers 401 — the shape
 * the four copies had, preserved deliberately: routes differ in what they DO,
 * not in how a refusal is spelled.
 */
export function checkPresentedSecret(
  state: { secret?: string; profile: { id: string } },
  presented: unknown,
  provenFor: string | null = null,
  opts: { bind?: boolean } = {},
): void {
  if (typeof presented !== "string" || !presented) throw new Error("unauthorized");
  if (provenFor && provenFor === state.profile.id) return;
  if (!state.secret) {
    if (opts.bind ?? true) {
      state.secret = presented;
      return;
    }
    throw new Error("unauthorized");
  }
  if (state.secret !== presented) throw new Error("unauthorized");
}

/** The refusal a door returns when a classroom session reaches past what the
 *  classroom may do. Named so a screen can say "ask your teacher", and separate
 *  from `unauthorized` so the regression suite can prove the distinction. */
export function kioskRefusal(what: string): { ok: false; status: 403; error: string } {
  return { ok: false, status: 403, error: `kiosk_cannot_${what}` };
}
