// ─────────────────────────────────────────────────────────────────────────────
// THE RECOVERY CODE — how a learner gets back into their own record.
//
// WHY THIS EXISTS, in the terms of the people it is for. An OpenMind account is
// an email and a password, and this deployment has no mail service: `verified` is
// false for every account because nobody can prove an address (see
// lib/server/auth.ts). That was a truthful limitation right up to the moment a
// learner forgot their password — and then it was DATA LOSS. The evidence ledger,
// the diagnostic history and the misconceptions a teacher was working from all sit
// behind that one password, and there was no reset route to ask.
//
// The population makes it worse, not better: a shared phone, a borrowed address,
// a class of forty-five where the learner who is absent on Tuesday is the one who
// needs it. An email-reset flow would have been the wrong answer twice over — it
// needs a mailbox nobody has, and it assumes the learner still controls the address
// they typed at enrolment.
//
// So the credential is a CODE, printed once and kept:
//
//   · long-random (16 symbols from a 31-character alphabet ≈ 79 bits), so it
//     cannot be guessed, and stored only as a scrypt hash + per-account salt;
//   · hand-copied, so the alphabet excludes I, L, O, 0 and 1 (the same rule the
//     class join code uses, for the same reason: this is read off paper);
//   · rotatable from a signed-in session, and rotated automatically on use — one
//     printed code that has been typed into a shared phone should not stay valid
//     for the life of the account.
//
// THE SECOND KEY, for the case the first one cannot cover: a learner who has lost
// the paper. A teacher who already teaches them can issue a SHORT-LIVED grant
// (15 minutes, single use) and read it out. That grant has to identify its account
// without an email, because a teacher-mediated reset that still asks for a mailbox
// is not teacher-mediated — so its first eight characters are a LOOKUP KEY derived
// from the account id (public and non-secret: it only says *which* account to try),
// and its last eight are the secret that is actually verified.
//
// WHAT THIS MODULE MUST NOT DO: mint anything with `Math.random`. A recovery code
// is a bearer credential — anyone holding it can take the account over — and
// `Math.random` is a PRNG whose state is recoverable from its output. The minting
// functions use the platform CSPRNG (`crypto.getRandomValues`, present in Node 20
// and every browser we ship to), with rejection sampling so the alphabet is not
// biased by 256 not dividing by 31.
//
// The module is PURE apart from that CSPRNG call, so the alphabet, the grouping and
// the validation can be tested without an account, a server or a clock.
// ─────────────────────────────────────────────────────────────────────────────

/** The characters a human copies off paper. No I, L, O, 0 or 1: the pairs that
 *  cost a learner their account in a badly-lit classroom. 31 symbols, chosen so
 *  no two of them are mirror images on a phone keypad. */
export const RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** How many symbols a full recovery code carries: 16 → 31^16 ≈ 79 bits. Well
 *  beyond guessing, and short enough to fit on one printed line. */
export const RECOVERY_SYMBOLS = 16;

/** A teacher-issued grant is the same printed length but split in two: eight
 *  characters that name the account and eight that prove it. The secret half is
 *  31^8 ≈ 39.7 bits, which is only acceptable because it expires in fifteen
 *  minutes and can be tried a bounded number of times (see the recover route). */
export const RESET_KEY_SYMBOLS = 8;
export const RESET_SECRET_SYMBOLS = 8;

/** How long a teacher-issued grant stays usable. Long enough to walk to the
 *  learner's desk, short enough that a code read aloud in a corridor is worthless
 *  tomorrow. */
export const RESET_TTL_MS = 15 * 60_000;

/** Grouping for display. Four is short enough to read aloud and long enough that
 *  a mistyped character is visible. */
export const GROUP_SIZE = 4;

/**
 * One symbol from the CSPRNG, unbiased.
 *
 * 256 does not divide by 31, so `byte % 31` would make the first eight symbols of
 * the alphabet ~1.6% likelier than the rest — a small bias, but this is a
 * credential and the honest version costs three extra lines. Bytes at or above
 * `256 - (256 % 31)` are discarded and redrawn.
 */
function randomSymbol(): string {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    // Throwing is the only safe answer: a fallback to Math.random would silently
    // weaken every code minted on that deployment.
    throw new Error("no CSPRNG available to mint a recovery code (crypto.getRandomValues is missing)");
  }
  const limit = 256 - (256 % RECOVERY_ALPHABET.length);
  const buf = new Uint8Array(1);
  for (;;) {
    cryptoObj.getRandomValues(buf);
    if (buf[0] < limit) return RECOVERY_ALPHABET[buf[0] % RECOVERY_ALPHABET.length];
  }
}

/** `symbols` characters, grouped for reading: `ABCD-EFGH-JKMN-PQRS`. */
export function mintCode(symbols: number): string {
  if (!Number.isInteger(symbols) || symbols <= 0) throw new Error("a code needs a positive length");
  let raw = "";
  for (let i = 0; i < symbols; i++) raw += randomSymbol();
  return groupCode(raw);
}

/** A learner's own recovery code. */
export function mintRecoveryCode(): string {
  return mintCode(RECOVERY_SYMBOLS);
}

/**
 * The eight-character LOOKUP KEY for an account, and the reason a teacher can reset
 * a learner who has no mailbox they control.
 *
 * It is derived from the account id rather than stored, so it costs no migration
 * and two exports of the same account always agree. It is NOT a secret: it only
 * shortlists which account a typed code should be checked against, and the secret
 * half is what has to verify. Account ids are `acc_<hex>`, so the key is the first
 * eight hex characters, uppercased.
 */
export function resetKeyFor(accountId: string): string {
  const hex = accountId.replace(/^acc_/, "").replace(/[^0-9a-fA-F]/g, "").toUpperCase();
  return hex.slice(0, RESET_KEY_SYMBOLS).padEnd(RESET_KEY_SYMBOLS, "0");
}

/** The teacher-issued grant as the teacher reads it: lookup key, then secret,
 *  grouped. `1A2B-3C4D-EFGH-JKMN`. */
export function resetGrantCode(accountId: string): string {
  return groupCode(`${resetKeyFor(accountId)}${mintCode(RESET_SECRET_SYMBOLS).replace(/-/g, "")}`);
}

/**
 * Uppercase, and drop everything a human might type as decoration.
 *
 * Deliberately does NOT "correct" confusable pairs (O→0, I→1, l→1). The alphabet
 * excludes those characters precisely so a code can never contain them, and a
 * silent substitution would turn a wrong code into a different wrong code — which
 * is worse than a clean refusal, because the learner cannot see it happened.
 */
export function normaliseCode(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Group a raw code for display. Already-grouped input is normalised first, so
 *  `groupCode(normaliseCode(x))` is idempotent. */
export function groupCode(code: string): string {
  const raw = normaliseCode(code);
  const parts: string[] = [];
  for (let i = 0; i < raw.length; i += GROUP_SIZE) parts.push(raw.slice(i, i + GROUP_SIZE));
  return parts.join("-");
}

/** What is wrong with this code, or null. Shape only — whether it MATCHES is a
 *  question for the stored hash, and conflating the two is how a check starts
 *  reporting "invalid code" for a correct one typed with a space. */
export function codeProblem(input: unknown): string | null {
  const raw = normaliseCode(input);
  if (!raw) return "missing_code";
  if (raw.length !== RECOVERY_SYMBOLS) return "bad_code";
  return null;
}

/** Split a typed code into the teacher-grant halves, or null when it is not one.
 *  The learner's own recovery code has no lookup key, so it never splits — the
 *  caller then checks it against the account it already has. */
export function splitGrant(input: unknown): { key: string; secret: string } | null {
  const raw = normaliseCode(input);
  if (raw.length !== RESET_KEY_SYMBOLS + RESET_SECRET_SYMBOLS) return null;
  return { key: raw.slice(0, RESET_KEY_SYMBOLS), secret: raw.slice(RESET_KEY_SYMBOLS) };
}

/** Entropy of a code of this length, in bits. Exported so the suite can assert the
 *  printed length actually buys the security the header claims instead of trusting
 *  a comment. */
export function codeEntropyBits(symbols: number): number {
  return symbols * Math.log2(RECOVERY_ALPHABET.length);
}
