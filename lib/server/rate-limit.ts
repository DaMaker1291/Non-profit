// ── A BOUNDED ATTEMPT COUNT ON THE CREDENTIAL DOORS ────────────────────────
//
// docs/SECURITY.md §9 opened with this, and it stayed true for as long as it
// was only written down: sign-in had **no attempt counter, no lockout and no
// delay**. Each guess costs the attacker a scrypt derivation, which is a high
// price per attempt — and the *number* of attempts was unlimited, so the price
// was the only thing standing between a password list and an account.
//
// WHAT THIS IS, AND WHAT IT IS NOT.
//
// This is an in-process counter. That is the honest size of it:
//
//   · it bounds attempts **within one server process**, which is the shape the
//     file store already has (its lock is an in-memory promise chain, so the
//     deployment is single-process by construction — see README "Storage");
//   · a restart clears every counter. An attacker who can restart the server
//     has already won by other means, but a deployment that restarts often is
//     weaker than one that does not, and that is worth saying out loud;
//   · it is NOT the outer bound. Sign-up, the AI routes and the answer routes
//     still need the reverse proxy that docs/DEPLOYMENT.md §10 specifies. What
//     lands here is the door whose abuse is guessable-credential-shaped.
//
// ── TWO KINDS OF BOUND, AND WHY BOTH EXIST ─────────────────────────────────
//
// A limiter that answers 429 to every attempt against an account is a way to
// LOCK A LEARNER OUT: anyone who knows an email address can spend that account's
// budget and keep the owner out of their own record for the length of the
// window. On a product for schools and shared devices that is not a theoretical
// cost — it is the whole defence turned into the attack. The first version of
// this module did exactly that (eight wrong passwords, then 429 for EVERYONE,
// including the account's own correct password, asserted as a feature) and the
// review that caught it was right.
//
// So there are two modes, and the difference is the whole design:
//
//   · `hard` — the attempt is REFUSED before the derivation. Only ever used
//     where a refusal cannot deny a person their own account: a source address
//     (the attacker's own bucket) and the sign-up door (a count of records
//     created, where "no" is the intended answer).
//   · `soft` — the attempt is DELAYED, never refused. The password is still
//     checked, so the learner who knows it gets in behind a pause of at most
//     `SIGNIN_BACKOFF_MS`'s last entry. Used for the account and for the whole
//     process, because refusing either would let one bad actor deny another
//     person's sign-in.
//
// The cost of that choice is stated rather than hidden: an attack on an account
// now costs its owner a pause (bounded, ≤ 2 s), not a lockout. That is the
// correct trade — a learner who can still get in is the requirement.
//
// WHY AN ACCOUNT KEY AT ALL, AND WHY IT IS NOT FORGEABLE.
//
// Next's route handlers expose no socket address, so the only address available
// is a request HEADER, and a header a client can set is not a limit: keying a
// bound on `x-forwarded-for` lets the attacker rotate one line and try forever.
// The account key cannot be forged — it is the thing being guessed — so the
// per-account delay holds with no proxy at all. An address key is used ONLY when
// the deployment declares a trusted proxy AND the request can be attributed
// through it; whether it can is decided in ONE place, `client-address.ts`, whose
// header note states the provider evidence for counting a fixed number of hops
// FROM THE RIGHT rather than trusting a header name.
//
// WHY A FIXED WINDOW AND NOT A SLIDING ONE.
//
// A counter that keeps counting past the ceiling is a window an attacker can
// hold open forever by continuing to try: the victim's window never starts
// expiring. Here a HARD refusal does NOT increment, so the window opened by the
// first failure closes on schedule whatever happens next, and a SOFT window's
// `resetAt` is stamped once and never moved. Both properties are asserted in
// `npm run verify` rather than left as a comment.
/** How a bound behaves once its budget is spent. */
export type LimitMode = "hard" | "soft";

export interface LimitPolicy {
  /** Failures allowed inside one window before the bound applies. */
  readonly max: number;
  /** How long the window lives, in ms. Stamped when it opens, never extended. */
  readonly windowMs: number;
  /** `hard` refuses; `soft` slows down. See the header note. */
  readonly mode: LimitMode;
}

export interface Verdict {
  /** May this attempt proceed? Only a `hard` policy answers false. */
  allowed: boolean;
  /** Attempts left in the current window (0 once the budget is spent). */
  remaining: number;
  /** Seconds until the window resets — 0 unless a HARD policy refused. */
  retryAfterSec: number;
  /**
   * How long the NEXT password check against this key must pause before it runs.
   *
   * A soft policy answers `> 0` instead of `allowed: false`, which is what makes
   * the attempt still happen: the learner who knows the password signs in, the
   * attacker waits. Never applied to a hard policy (it refuses instead).
   *
   * "Next" rather than "this one" because the pause is a property of the attempt
   * that is about to overspend the budget: at exactly `max` failures there is
   * still no pause, and the `max + 1`th attempt takes the first step. `peek` is
   * called before the check, so there it names the attempt in hand.
   */
  delayMs: number;
}

/** Sign-in: how many wrong passwords one account may receive in 15 minutes
 *  before each further attempt is SLOWED. Deliberately soft — see the header. */
export const SIGNIN_PER_ACCOUNT: LimitPolicy = { max: 8, windowMs: 15 * 60_000, mode: "soft" };
/** Sign-in: the same bound per source address, when a trusted proxy names it.
 *  Hard, because the bucket belongs to one source: it bounds the scrypt work an
 *  attacker can demand before a derivation is started, and it is cleared by any
 *  successful sign-in from that address so a classroom behind one network is not
 *  locked out by its own typos. Deliberately looser than the per-account bound —
 *  thirty learners on one address must not add up to a refusal for the owner. */
export const SIGNIN_PER_ADDRESS: LimitPolicy = { max: 40, windowMs: 15 * 60_000, mode: "hard" };
/** Sign-in: how many password derivations the PROCESS will accept per minute
 *  before every further one is slowed. This is the resource bound that a
 *  distributed attack cannot get around, because it is not keyed on anything the
 *  attacker chooses. Soft on purpose: a hard global ceiling is a switch one
 *  attacker could throw to take sign-in down for everyone. */
export const SIGNIN_PER_PROCESS: LimitPolicy = { max: 120, windowMs: 60_000, mode: "soft" };
/** Sign-up: how many accounts one source address may create in an hour. Only
 *  applies when a trusted proxy names the address (see `client-address.ts`). */
export const SIGNUP_PER_ADDRESS: LimitPolicy = { max: 10, windowMs: 60 * 60_000, mode: "hard" };

// ── THE OTHER DOORS THAT COST MONEY OR CPU ─────────────────────────────────
//
// Sign-in was never the expensive door; it was the one whose abuse is shaped
// like a guess. These are the ones whose abuse is shaped like a bill: every AI
// turn can be a paid model call, every answer runs the grader and the
// projection, every sync batch writes a ledger, and a personal paper runs the
// whole marking analysis. They are all HARD and all GENEROUS, keyed on the
// AUTHENTICATED learner — which is unforgeable because the secret was checked
// first, so the only person who can spend a learner's budget is someone who
// already holds that learner's credential. Refusing at these bars therefore
// cannot deny a learner their own record; it stops a loop.
//
// A request that reaches one of these doors unauthenticated has no learner to
// key on. The AI doors are the only ones where that is a real path (a signed-out
// visitor gets the offline tutor), so they also carry a process-wide SOFT bound
// — counted, never refused — which is the difference between "the bill has a
// ceiling" and "the bill is whatever one script wants".

/** AI turns per learner per minute. A learner reading explanations cannot reach
 *  this; a refresh loop reaches it in fifteen seconds. */
export const AI_PER_LEARNER: LimitPolicy = { max: 20, windowMs: 60_000, mode: "hard" };
/** AI turns across the PROCESS per minute, soft: it only slows. Same reason as
 *  the sign-in process bound — a hard global ceiling is a switch an attacker
 *  could throw to make the tutor unavailable to everyone. */
export const AI_PER_PROCESS: LimitPolicy = { max: 120, windowMs: 60_000, mode: "soft" };
/** Progress actions (a serve, an answer, a hint) per learner per five minutes.
 *  Two a second sustained: a person working flat out is at ~12 a minute and a
 *  whole e2e journey on one learner stays well under this, while a script in a
 *  loop is thousands a second. It bounds the loop, not the learner. */
export const ANSWERS_PER_LEARNER: LimitPolicy = { max: 600, windowMs: 5 * 60_000, mode: "hard" };
/** Offline sync batches per learner per minute. A device that has been offline
 *  for a week drains in a handful of batches; a hundred a minute is a script. */
export const SYNC_PER_LEARNER: LimitPolicy = { max: 60, windowMs: 60_000, mode: "hard" };
/** Personal-paper submissions per learner per ten minutes. Each one runs the
 *  marking analysis over every question on the paper. */
export const UPLOAD_PER_LEARNER: LimitPolicy = { max: 10, windowMs: 10 * 60_000, mode: "hard" };
/** Diagnostic actions (start, answer, finish) per learner per five minutes. The
 *  sitting's own ladder bounds it; this bounds a client that ignores the ladder. */
export const DIAGNOSTIC_PER_LEARNER: LimitPolicy = { max: 200, windowMs: 5 * 60_000, mode: "hard" };

/** The fixed key the AI process bound is counted against. */
export const AI_PROCESS_KEY = "ai:process:all";

/** The fixed key the process-wide bound is counted against. Exported so the
 *  route and its test cannot disagree about what "the process" means. */
export const SIGNIN_PROCESS_KEY = "signin:process:all";

/** The pauses a soft bound applies, by how far over budget the key is. Capped at
 *  2 s: the point is to make guessing slow, not to make a learner wait. */
export const SIGNIN_BACKOFF_MS = [250, 500, 1000, 2000] as const;

/** The pause for an overage of `over` attempts (0 = still inside the budget). */
export function backoffFor(over: number): number {
  if (over <= 0) return 0;
  return SIGNIN_BACKOFF_MS[Math.min(over - 1, SIGNIN_BACKOFF_MS.length - 1)];
}

interface Bucket {
  /** Attempts already counted in this window. */
  count: number;
  /** When this window expires (epoch ms). */
  resetAt: number;
}

/** Ceiling on tracked keys. A box that stops growing is the point: the keys are
 *  attacker-supplied (an email address), so an unbounded map is a memory leak an
 *  attacker can drive. */
const MAX_ENTRIES = 10_000;
/** Sweep expired buckets every N calls rather than on every one. */
const SWEEP_EVERY = 256;

const buckets = new Map<string, Bucket>();
let calls = 0;

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Trim back to 90% of the ceiling when it is crossed.
 *
 * Dropping the OLDEST-INSERTED keys is deliberate: `Map` iterates in insertion
 * order, so this is a single pass with no sort, and an old key is the one most
 * likely to have expired anyway (`sweep` already removed the genuinely expired
 * ones). Trimming a BATCH rather than one key is what keeps the cost amortised
 * O(1) per attempt instead of a sort on every insert once the map is full.
 *
 * A dropped counter is a counter that starts again, so a limit that evicts is a
 * limit that can be pushed over — which is why the ceiling is far above any
 * real deployment's concurrent sign-in attempts, and why the suite asserts the
 * bound rather than assuming it. */
const TRIM_TO = Math.floor(MAX_ENTRIES * 0.9);

function evict(): void {
  if (buckets.size <= MAX_ENTRIES) return;
  let drop = buckets.size - TRIM_TO;
  for (const key of buckets.keys()) {
    if (drop-- <= 0) break;
    buckets.delete(key);
  }
}

function bucketFor(key: string, policy: LimitPolicy, now: number): Bucket {
  const existing = buckets.get(key);
  if (existing && existing.resetAt > now) return existing;
  // A fresh window: the old one expired, or there never was one.
  const fresh: Bucket = { count: 0, resetAt: now + policy.windowMs };
  buckets.set(key, fresh);
  return fresh;
}

function waitOf(bucket: Bucket, now: number): number {
  return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
}

/** The pause the next check against this bucket must take: 0 inside the budget,
 *  then one step of `SIGNIN_BACKOFF_MS` per attempt past it, capped.
 *
 * `+ 1` because the bucket holds the FAILURES SO FAR: at `count === max` the next
 * attempt is the first one over budget. Without it the ceiling attempt got a
 * pause and the attempt after it got none, which is the wrong way round. */
function pauseFor(bucket: Bucket, policy: LimitPolicy): number {
  return backoffFor(bucket.count + 1 - policy.max);
}

/**
 * Look at a key WITHOUT consuming an attempt. Called before the password check,
 * so a hard-refused source costs this server nothing and a soft one knows how
 * long to pause before the derivation.
 */
export function peek(key: string, policy: LimitPolicy, now: number = Date.now()): Verdict {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    return { allowed: true, remaining: policy.max, retryAfterSec: 0, delayMs: 0 };
  }
  // `allowed` answers "may the NEXT attempt proceed", so the budget is spent
  // once `count` has reached `max` — reaching the ceiling is not itself excess.
  const remaining = Math.max(0, policy.max - existing.count);
  if (remaining > 0) return { allowed: true, remaining, retryAfterSec: 0, delayMs: 0 };
  if (policy.mode === "soft") {
    // NOT REFUSED. The attempt proceeds after a pause; that is the difference
    // between a bound that protects an account and one that imprisons it.
    return { allowed: true, remaining: 0, retryAfterSec: 0, delayMs: pauseFor(existing, policy) };
  }
  return { allowed: false, remaining: 0, retryAfterSec: waitOf(existing, now), delayMs: 0 };
}

/**
 * Record one attempt.
 *
 * A HARD refusal does not increment, which is what keeps its window from being
 * held open by an attacker who keeps knocking. A SOFT bound never refuses, so it
 * keeps counting — saturated at `max + SIGNIN_BACKOFF_MS.length` so the count (and
 * therefore the pause) cannot grow without bound inside one window.
 */
export function hit(key: string, policy: LimitPolicy, now: number = Date.now()): Verdict {
  if (++calls % SWEEP_EVERY === 0) sweep(now);
  const bucket = bucketFor(key, policy, now);
  if (bucket.count >= policy.max) {
    if (policy.mode === "hard") {
      // Refused, and deliberately not counted (see the header note).
      return { allowed: false, remaining: 0, retryAfterSec: waitOf(bucket, now), delayMs: 0 };
    }
    bucket.count = Math.min(bucket.count + 1, policy.max + SIGNIN_BACKOFF_MS.length);
    return { allowed: true, remaining: 0, retryAfterSec: 0, delayMs: pauseFor(bucket, policy) };
  }
  bucket.count += 1;
  evict();
  // THIS attempt was within the budget, including the one that reaches the
  // ceiling. `allowed: false` from `hit` means the attempt was refused, not
  // that the budget is now used up.
  const remaining = Math.max(0, policy.max - bucket.count);
  return {
    allowed: true,
    remaining,
    retryAfterSec: remaining > 0 ? 0 : policy.mode === "hard" ? waitOf(bucket, now) : 0,
    delayMs: 0,
  };
}

/** Forget a key — called on a SUCCESSFUL sign-in, so a learner who mistyped
 *  seven times and then got it right starts the next window clean, and so a
 *  shared device does not accumulate the whole class's slip-ups. */
export function clear(key: string): void {
  buckets.delete(key);
}

/** Pause for a soft bound. Exported so the route does not spell out a timer, and
 *  so a reader can find the one place a sign-in can be made to wait. */
export function sleep(ms: number): Promise<void> {
  if (!(ms > 0)) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, Math.min(ms, SIGNIN_BACKOFF_MS[SIGNIN_BACKOFF_MS.length - 1])));
}

/** Tracked keys — for the suite's bounded-memory assertion, not for the app. */
export function trackedKeys(): number {
  return buckets.size;
}

/** Drop everything. Tests only: a module-level Map would otherwise carry state
 *  from one fixture to the next and make a pass depend on test order. */
export function resetAll(): void {
  buckets.clear();
  calls = 0;
}

/** The normalised account key a sign-in is counted against. Exported so the
 *  route and its test cannot disagree about what "the same account" means. */
export function signinKeyFor(email: string): string {
  return `signin:acct:${email.trim().toLowerCase()}`;
}
