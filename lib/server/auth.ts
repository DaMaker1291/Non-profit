import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
// DATA_DIR comes from the store rather than being re-derived here. It used to be a
// SECOND copy (`const DATA_DIR = …`), which is the shape that fails quietly: three
// resolvers of OPENMIND_DATA_DIR means a deployment can be pointed at two
// directories by editing one of them. What is left of this module's own file I/O is
// the SESSION SECRET — a signing key, not a record, and deliberately not in a
// database: a deployment that copied its data directory and left the key behind
// would sign everyone out, and one that restored it without the records would
// validate tokens for accounts that are about to be recreated with the same ids.
import {
  DATA_DIR, ensureProfileSecretFor, getProfile, hashPassword, makeSalt, normaliseEmail,
  publicProfileState, resolveKioskSession, saveProfile,
} from "./store";
import type { Account, AccountRole, ProfileState, PublicAccount } from "../types";
// THE BACKEND, NOT A FILE. Accounts live on the storage port (lib/server/storage.ts)
// exactly like a learner's record and its ledger, and this module asks the
// CONFIGURED backend for them — the same one the profile comes from. That is what
// replaced the private `accounts.json` reader/writer this file used to own: on any
// deployment whose store is not the file store, two writers for the same file is
// one learner's identity in two places.
import { activeStorage } from "./storage-file";
// The credential's SHAPE is pure and lives on its own (lib/recovery-code.ts): the
// alphabet, the grouping, the lookup key and the 79-bit length are all facts a test
// can check without an account. What this module adds is the hashing and the
// lifecycle — mint, verify, rotate, expire.
import {
  mintRecoveryCode, normaliseCode, RECOVERY_SYMBOLS, resetGrantCode, RESET_TTL_MS, splitGrant,
} from "../recovery-code";
// The ONE implementation of hashing / normalisation / id minting.
//
// These used to exist here AND in the store. One copy is not tidiness: a second
// scrypt parameter set, a second email normalisation or a second profile-id shape
// is how a sign-in stops matching an account written minutes earlier, and the
// failure looks like "wrong password" rather than like a duplicated helper.
export {
  ensureProfileSecretFor,
  hashPassword,
  makeSalt,
  newProfileId,
  normaliseEmail,
} from "./store";

// ─────────────────────────────────────────────────────────────────────────────
// REAL accounts. Before this module OpenMind had no sign-up at all: a learner
// was a random `stu_…` id plus a capability secret in localStorage, so the
// "account" died with the browser profile and could not be opened on a second
// device. Here an account is an email + password (scrypt, per-account salt),
// and it owns exactly one learner profile — so signing in anywhere restores
// the full history: progress, diagnostics, mastery, misconceptions.
//
// Anonymous learning still works and is still first-class: a guest profile can
// be *claimed* by a new account, which moves every recorded interaction over
// rather than starting again.
// ─────────────────────────────────────────────────────────────────────────────

// ── The SHAPES are the app's, not this module's ─────────────────────────────
//
// `Account`, `PublicAccount` and `AccountRole` live in lib/types.ts beside the
// profile they point at. They used to be declared HERE as well, which is three
// declarations of one role union and two of the account shape — and the client
// (which can only import lib/types.ts) was reading the other copy. A field added
// to one was invisible to the other, and the symptom is a UI that quietly shows
// `undefined`. The re-exports below keep every existing import working.
export type { Account, AccountRole, PublicAccount };

/** Everything about an account that is safe to send to the client. */
export function publicAccount(a: Account): PublicAccount {
  return {
    id: a.id, email: a.email, name: a.name, role: a.role,
    createdAt: a.createdAt, lastSeenAt: a.lastSeenAt,
    profileId: a.profileId, verified: a.verified,
  };
}

// ── Passwords ───────────────────────────────────────────────────────────────

/** Constant-time compare — a length mismatch is itself rejected first, since
 *  timingSafeEqual throws on unequal buffers. */
export function passwordMatches(account: Account, password: string): boolean {
  const candidate = Buffer.from(hashPassword(password, account.salt), "hex");
  const known = Buffer.from(account.passHash, "hex");
  if (candidate.length !== known.length) return false;
  return timingSafeEqual(candidate, known);
}

/** Minimum bar: long enough to matter, short enough to type on a phone. */
export function passwordProblem(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) return "weak_password";
  if (password.length > 200) return "long_password";
  return null;
}

export function emailProblem(email: unknown): string | null {
  if (typeof email !== "string") return "bad_email";
  const e = email.trim();
  if (e.length < 5 || e.length > 160) return "bad_email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return "bad_email";
  return null;
}

// ── Account operations: the facade over the storage port ────────────────────
//
// Every one of these is ONE LINE, deliberately. The bodies used to live here and
// wrote `accounts.json` directly, which made this module a second store: it had its
// own reader, its own writer and its own idea of what a normalised email or a
// profile id looks like. The identities of a school now live wherever its learner
// records live, chosen by `resolveStoreKind()` — and the files behind that choice
// are the backend's business, not authentication's.
//
// This is the same shape as `lib/server/evidence.ts`: a facade holding no storage,
// so a second backend is a matter of implementing the port rather than of finding
// every call site. Authentication itself (hashing, the signed token, the cookie,
// the epoch check) stays HERE, because that is policy rather than persistence.

export function getAccount(id: string): Promise<Account | null> {
  return activeStorage().getAccount(id);
}

export function findAccountByEmail(email: string): Promise<Account | null> {
  return activeStorage().findAccountByEmail(email);
}

export function countAccounts(): Promise<number> {
  return activeStorage().countAccounts();
}

export function accountOwningProfile(
  profileId: string,
  exceptAccountId?: string,
): Promise<Account | null> {
  return activeStorage().accountOwningProfile(profileId, exceptAccountId);
}

/**
 * Create an account bound to a learner profile. The caller creates (or claims)
 * the profile first, so a sign-up never leaves an account pointing at nothing.
 * A duplicate address is refused by the BACKEND, inside its own write — a check
 * made here and an insert made later protects nothing under concurrency.
 */
export function createAccount(input: {
  email: string;
  password: string;
  name: string;
  role?: AccountRole;
  profileId: string;
}): Promise<Account> {
  return activeStorage().createAccount(input);
}

/** Point an existing account at a different profile (used when a signed-in
 *  learner claims the anonymous profile they were already using). */
export function setAccountProfile(accountId: string, profileId: string): Promise<Account | null> {
  return activeStorage().setAccountProfile(accountId, profileId);
}

export function touchAccount(accountId: string): Promise<void> {
  return activeStorage().touchAccount(accountId);
}

/** Change the display name / role stored on the account. */
export function updateAccount(
  accountId: string,
  patch: { name?: string; role?: AccountRole },
): Promise<Account | null> {
  return activeStorage().updateAccount(accountId, patch);
}

/** Set a new password (requires the current one at the route level). */
export function setPassword(accountId: string, password: string): Promise<void> {
  return activeStorage().setPassword(accountId, password);
}

/** End every outstanding session for this account (bump the epoch). */
export function revokeSessions(accountId: string): Promise<void> {
  return activeStorage().revokeSessions(accountId);
}

// ── Recovery credentials ────────────────────────────────────────────────────
//
// THE HOLE THIS CLOSES: an account is an email and a password, and this
// deployment has no mail service, so a forgotten password ended the learner's
// record — the ledger, the diagnostics, the misconceptions a teacher was working
// from. There was no reset route at all. An email reset would have been the wrong
// answer for this population anyway (a shared phone, a borrowed address), so the
// credential is a printed code plus a short-lived teacher grant.
//
// Every function here works on a HASH of the normalised code. The plaintext exists
// only in the value returned to the caller that is about to show it once.

/** scrypt of the NORMALISED code. Normalising before hashing is what makes
 *  `abcd-efgh-jkmn-pqrs` and `ABCD EFGH JKMN PQRS` the same credential — a learner
 *  typing it from paper will produce both. */
function digestCode(code: string, salt: string): string {
  return hashPassword(normaliseCode(code), salt);
}

/** Constant-time comparison of a typed code against a stored digest. A missing
 *  salt or hash answers false rather than throwing: an account with no code is a
 *  state, not an error. */
function digestMatches(code: string, salt: string | undefined, hash: string | undefined): boolean {
  if (!salt || !hash) return false;
  const candidate = Buffer.from(digestCode(code, salt), "hex");
  const known = Buffer.from(hash, "hex");
  if (candidate.length === 0 || candidate.length !== known.length) return false;
  return timingSafeEqual(candidate, known);
}

/** Is this grant still live? A missing expiry is NOT an open-ended grant: it is a
 *  record that this build no longer understands, and refusing is the safe reading. */
function grantLive(account: Account): boolean {
  return (account.resetExpiresAt ?? 0) > Date.now();
}

/**
 * Mint a recovery code for an account and return the PLAINTEXT once.
 *
 * Called at sign-up (so every new learner gets one before they need it) and after
 * every successful recovery (so a code that has been typed into a shared phone
 * does not stay valid for the life of the account). `null` means the account does
 * not exist — the caller answers 401/404 rather than pretending it worked.
 */
export async function mintRecoveryCodeFor(accountId: string): Promise<string | null> {
  const code = mintRecoveryCode();
  const salt = makeSalt();
  const updated = await activeStorage().setRecoveryCode(accountId, { salt, hash: digestCode(code, salt) });
  return updated ? code : null;
}

/**
 * Replace a learner's recovery code from a session that can already prove the
 * password.
 *
 * The current password is required for the same reason a password change requires
 * it: a borrowed laptop must not be able to mint itself a permanent key to
 * somebody else's record.
 */
export async function rotateRecoveryCode(
  accountId: string,
  currentPassword: string,
): Promise<{ ok: true; code: string } | { ok: false; reason: "bad_password" | "no_account" }> {
  const account = await getAccount(accountId);
  if (!account) return { ok: false, reason: "no_account" };
  if (!passwordMatches(account, currentPassword)) return { ok: false, reason: "bad_password" };
  const code = await mintRecoveryCodeFor(accountId);
  if (!code) return { ok: false, reason: "no_account" };
  return { ok: true, code };
}

/**
 * A teacher-issued grant, for the learner who has lost the paper.
 *
 * The code carries its own LOOKUP KEY (the first eight characters), so the learner
 * does not have to remember an address to use it — which is the whole point, since
 * the population this exists for is the one whose email is borrowed or invented.
 * The grant is single use and expires in fifteen minutes; using it also rotates the
 * learner's long-term code, so the short-lived one never becomes the permanent one.
 */
export async function grantResetCode(
  accountId: string,
): Promise<{ code: string; expiresAt: number } | null> {
  const code = resetGrantCode(accountId);
  const salt = makeSalt();
  const expiresAt = Date.now() + RESET_TTL_MS;
  const updated = await activeStorage().setResetGrant(accountId, {
    salt, hash: digestCode(code, salt), expiresAt,
  });
  return updated ? { code, expiresAt } : null;
}

/**
 * Use a recovery code (or a teacher's grant) to set a new password.
 *
 * THE LOOKUP RULE, stated because it is the security boundary:
 *
 *   · an email names ONE account, and the code must match THAT account — a grant
 *     for a different account is refused rather than silently resetting somebody
 *     else's record;
 *   · with no email, the code must split into a lookup key + secret, and the secret
 *     must verify against the account the key names. This is the path a learner uses
 *     when they cannot remember which address they typed.
 *
 * On success: the password is replaced, every session is revoked (a recovery is
 * exactly when a shared phone's stale cookie must stop working), the grant is
 * cleared, and a NEW recovery code is minted and returned. `null` is the single
 * failure answer for "no such account", "wrong code", "expired grant" and "code
 * does not belong to this email" — the caller must not be able to tell them apart.
 */
export async function recoverAccount(input: {
  email?: string;
  code: string;
  newPassword: string;
}): Promise<{ account: Account; recoveryCode: string } | null> {
  const typed = normaliseCode(input.code);
  // Shape check before any storage read: a code that cannot be one of ours is not
  // a lookup, it is a typo.
  if (typed.length !== RECOVERY_SYMBOLS) return null;

  const email = normaliseEmail(input.email ?? "");
  let target: Account | null = null;

  if (email) {
    const account = await findAccountByEmail(email);
    if (!account) return null;
    const own = digestMatches(typed, account.recoverySalt, account.recoveryHash);
    const granted = grantLive(account) && digestMatches(typed, account.resetSalt, account.resetHash);
    if (!own && !granted) return null;
    target = account;
  } else {
    // No email: only a teacher grant can be used, and only by its own lookup key.
    const grant = splitGrant(typed);
    if (!grant) return null;
    const account = await activeStorage().findAccountByResetKey(grant.key);
    if (!account || !grantLive(account)) return null;
    if (!digestMatches(typed, account.resetSalt, account.resetHash)) return null;
    target = account;
  }

  await activeStorage().setPassword(target.id, input.newPassword);
  await activeStorage().revokeSessions(target.id);
  await activeStorage().setResetGrant(target.id, null);
  const recoveryCode = await mintRecoveryCodeFor(target.id);
  const fresh = await getAccount(target.id);
  if (!fresh || !recoveryCode) return null;
  return { account: fresh, recoveryCode };
}

// ── Sessions ────────────────────────────────────────────────────────────────
// A session is a signed cookie: `acc_….<expiry>.<hmac>`. The HMAC key lives in
// the data directory (or OPENMIND_SESSION_SECRET), so the same deployment can
// restart without signing everyone out, and a copied cookie from another
// deployment is worthless.

export const SESSION_COOKIE = "om_session";
export const SESSION_DAYS = 60;

async function sessionSecret(): Promise<string> {
  if (process.env.OPENMIND_SESSION_SECRET) return process.env.OPENMIND_SESSION_SECRET;
  const file = path.join(DATA_DIR, "session-secret");
  try {
    const existing = (await fs.readFile(file, "utf8")).trim();
    if (existing.length >= 32) return existing;
  } catch {
    // first run — generate below
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const secret = randomBytes(32).toString("hex");
  await fs.writeFile(file, secret, "utf8");
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * `acc_….<epoch>.<expiry>.<hmac>`. The epoch rides inside the SIGNED payload,
 * so it cannot be forged or edited — it is the only reason a valid-looking
 * token can be refused before its expiry.
 */
export async function createSessionToken(accountId: string, epoch = 0): Promise<string> {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${accountId}.${epoch}.${exp}`;
  const secret = await sessionSecret();
  return `${payload}.${sign(payload, secret)}`;
}

/** The epoch a token was issued in. Tokens minted before epochs existed (three
 *  parts) are epoch 0, so a browser holding one is not signed out by this
 *  change — it is only invalidated by an actual sign-out. */
export function sessionEpochFrom(token: string | undefined | null): number {
  if (!token) return 0;
  const parts = token.split(".");
  if (parts.length !== 4) return 0;
  const n = Number(parts[1]);
  return Number.isFinite(n) ? n : 0;
}

/** Verify a raw cookie value's signature and expiry; returns the account id or
 *  null. Revocation is a separate, deliberate step — see `accountFromRequest`. */
export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  // 4 = current (with epoch), 3 = pre-epoch token, still valid until sign-out.
  if (parts.length !== 4 && parts.length !== 3) return null;
  const accountId = parts[0];
  const expRaw = parts[parts.length - 2];
  const sig = parts[parts.length - 1];
  const exp = Number(expRaw);
  if (!accountId || !Number.isFinite(exp) || exp < Date.now()) return null;
  const secret = await sessionSecret();
  const expected = sign(parts.slice(0, -1).join("."), secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return accountId;
}

/** The attributes every session cookie carries, wherever it is written.
 *
 *  `Secure` is added only when the request is actually served over HTTPS (or
 *  behind a proxy that terminated TLS and set `x-forwarded-proto`). A blanket
 *  `Secure` would make the cookie invisible on the plain-HTTP local and school
 *  deployments this product explicitly supports, and a cookie that is never
 *  sent is not a security improvement — it is a login that silently fails. A
 *  blanket omission is worse: a real HTTPS deployment would then transmit the
 *  session over any downgraded request. So the flag follows the scheme. */
export function cookieAttributes(req?: Request): string {
  const proto = req?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  const https = proto ? proto === "https" : (() => {
    try { return new URL(req?.url ?? "").protocol === "https:"; } catch { return false; }
  })();
  return `Path=/; HttpOnly; SameSite=Lax${https ? "; Secure" : ""}`;
}

export function cookieHeader(token: string, req?: Request): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  // HttpOnly so a script cannot read it; Lax so ordinary link navigation works
  // from a school's portal without CSRF exposure on state-changing posts;
  // Secure over HTTPS only (see cookieAttributes).
  return `${SESSION_COOKIE}=${token}; ${cookieAttributes(req)}; Max-Age=${maxAge}`;
}

export function clearCookieHeader(req?: Request): string {
  return `${SESSION_COOKIE}=; ${cookieAttributes(req)}; Max-Age=0`;
}

/** Read the session cookie out of a plain Request (keeps this module free of
 *  next/headers so the harnesses can exercise it directly). */
export function sessionCookieFrom(req: Request): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === SESSION_COOKIE) return rest.join("=") || null;
  }
  return null;
}

/** The signed-in account for a request, or null for an anonymous visitor.
 *
 *  Three things must hold, and the third is the one that used to be missing: a
 *  valid signature, an unexpired token, AND a token issued in the account's
 *  current epoch. That last check is what makes sign-out real. Since every
 *  authenticated route already funnels through here, revocation needs no
 *  second implementation anywhere. */
export async function accountFromRequest(req: Request): Promise<Account | null> {
  const token = sessionCookieFrom(req);
  const id = await verifySessionToken(token);
  if (!id) return null;
  const account = await getAccount(id);
  if (!account) return null;
  if (sessionEpochFrom(token) !== (account.sessionEpoch ?? 0)) return null;
  return account;
}

/**
 * Resolve the caller's learner profile from either credential: a signed-in
 * session, or the profile's capability secret. Used by the routes that act on
 * behalf of a learner (papers, progress) so the account path and the anonymous
 * path share exactly one authorisation rule.
 */
export async function authorisedProfile(
  req: Request,
  profileId: string | null,
  secret: string | null,
): Promise<ProfileState | null> {
  const account = await accountFromRequest(req);
  const id = profileId ?? account?.profileId ?? null;
  if (!id) return null;
  const state = await getProfile(id);
  if (!state) return null;
  if (account && account.profileId === id) return state;
  if (!state.secret) {
    // Legacy migration: the first writer's token becomes the credential.
    if (secret && secret.length >= 16 && secret.length <= 128) {
      state.secret = secret;
      await saveProfile(state);
      return state;
    }
    return null;
  }
  // A CLASSROOM SESSION IS A LEARNER CREDENTIAL TOO, and it is checked before
  // the permanent secret because a kiosk learner has none they may use: their
  // PIN was exchanged (server-side) for this token. Doors that must refuse a
  // classroom session ask `authorizeLearner`'s `via` flag; this door exists for
  // the read paths that only need to know "is this the learner they name?".
  if (typeof secret === "string" && secret.length >= 32) {
    const session = await resolveKioskSession(secret);
    if (session && session.profileId === id) return state;
  }
  return secret && secret === state.secret ? state : null;
}

/** What every auth route answers with: who you are, your learner profile, and
 *  the capability secret that lets the existing learner APIs work from this
 *  device without another password prompt. */
export interface SessionPayload {
  account: PublicAccount;
  profile: ProfileState;
  secret: string;
}

export async function sessionPayload(account: Account): Promise<SessionPayload | null> {
  const state = await getProfile(account.profileId);
  if (!state) return null;
  const secret = await ensureProfileSecretFor(state);
  return { account: publicAccount(account), profile: publicProfileState(state), secret };
}
