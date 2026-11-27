// ─────────────────────────────────────────────────────────────────────────────
// THE PURE IDENTITY HELPERS — ids, salts, and the one password hash.
//
// WHY THEY ARE NOT IN `store.ts` ANY MORE. Both storage backends mint accounts,
// and both have to produce a hash the sign-in path verifies. Leaving the four
// functions in the file store would mean the Postgres backend importing the file
// store to create an account — a backend that depends on the backend it replaces,
// which is how two implementations of one hash start to drift. They are pure
// (a UUID, a random salt, scrypt) and import nothing, so they belong in a leaf
// module that both backends and `lib/server/auth.ts` can share.
//
// `store.ts` re-exports every one of them, so no existing importer changes.
// ─────────────────────────────────────────────────────────────────────────────
import { randomUUID, randomBytes, scryptSync } from "node:crypto";

/** An id with a typed prefix: `acc_9f2…`, `prof_4c1…`. Random, never
 *  clock-derived — two accounts created in the same millisecond must not collide,
 *  and an id that encodes a time is an id that leaks one. */
export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

/** Normalise an email: trim and lowercase. Every account operation uses this, so
 *  the same address typed differently is always the same key. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** A random scrypt salt (16 bytes = 128 bits). */
export function makeSalt(): string {
  return randomBytes(16).toString("hex");
}

/** scrypt(password, salt, 64) -> hex. The ONE definition: sign-in verifies
 *  against it, and a backend that hashed differently would lock every learner out
 *  of the store it just migrated them into. */
export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}
