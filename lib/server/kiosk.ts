// ─────────────────────────────────────────────────────────────────────────────
// THE CLASSROOM'S POLICY, IN ONE PLACE.
//
// Three numbers and one comparison, kept here rather than inline in the login
// door because each of them is a security parameter a reviewer must be able to
// find, and because the regression suite asserts them (a bound that changes in a
// route file is a bound nobody reviews).
//
// WHY A HARD BOUND FOR A PIN, WHEN SIGN-IN'S ACCOUNT BOUND IS SOFT.
//
// On the account door, `hard` on the account would let a stranger who knows an
// email address lock a learner out of their own record for fifteen minutes — the
// defence turned into the attack (lib/server/rate-limit.ts records that
// measurement). A classroom PIN is a different situation in all three respects:
//
//   • the credential is issued for one lesson and rotated by the teacher when it
//     is forgotten, so "locked out" costs a walk to the teacher, not a record;
//   • the attacker is somebody holding the handset — there is no network path to
//     route around, and a soft pause is a pause they can simply outlast by
//     pressing the button again;
//   • the space is ~20 bits. A bound is not a courtesy here, it is the entire
//     margin between a PIN and no PIN.
//
// So: eight failures per learner per fifteen minutes, then a refusal. The counter
// is ALSO written to the class (the `failed`/`lockedUntil` row), because an
// in-memory limiter dies with the process and a curious child will restart it.
//
// WHAT THIS DOES NOT DEFEND AGAINST, stated because it is a real property: a
// classmate can hold a learner's PIN budget open by guessing at their name. That
// is inherent to any short credential, and the mitigation is the teacher's
// `revoke` (re-issue) rather than a longer lockout — a longer one would hand the
// same classmate a stronger denial of service.
import { createHash, timingSafeEqual } from "node:crypto";
import type { LimitPolicy } from "./rate-limit";

/** The PIN attempt budget. See the header for why this is `hard`. */
export const KIOSK_PIN_POLICY: LimitPolicy = { max: 8, windowMs: 15 * 60 * 1000, mode: "hard" };

/** How long a classroom session lives. Long enough for a lesson and its homework
 *  on the same handset; short enough that an ended lesson does not leave a live
 *  credential overnight. The server checks it on every use, so the client's clock
 *  is irrelevant. */
export const KIOSK_SESSION_TTL_MS = 90 * 60 * 1000;

export function getSessionTtlMs(): number {
  return KIOSK_SESSION_TTL_MS;
}

/** The rate-limit key: one budget per learner IN one class. Keying on the learner
 *  alone would let a wrong PIN at one class spend another class's budget, and
 *  keying on the class alone would let one child lock out forty. */
export function kioskLimitKey(classId: string, learnerId: string): string {
  return `kiosk:${classId}:${learnerId}`;
}

/** Compare two hex hashes without leaking their difference by timing. scrypt's
 *  output is fixed-length, but the comparison is still the moment a wrong PIN is
 *  distinguished from a right one, so it is constant-time like every other
 *  credential comparison in this codebase. */
export function hashEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    // Still do the work, on two equal-length digests, so a length mismatch and a
    // value mismatch cannot be told apart by how long the answer took.
    timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
    return false;
  }
  return timingSafeEqual(left, right);
}
