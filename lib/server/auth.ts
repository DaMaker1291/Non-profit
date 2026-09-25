import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { getProfile, newId, publicProfileState, saveProfile } from "./store";
import type { ProfileState } from "../types";

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

const DATA_DIR = process.env.OPENMIND_DATA_DIR
  ? path.resolve(process.env.OPENMIND_DATA_DIR)
  : path.join(process.cwd(), ".openmind-data");

export type AccountRole = "student" | "teacher" | "org";

export interface Account {
  id: string;
  /** Normalised (lowercased, trimmed) — the unique key for sign-in. */
  email: string;
  /** Display name the learner typed. Never required to be a real name. */
  name: string;
  role: AccountRole;
  /** scrypt(password, salt) hex. The plain password is never stored or logged. */
  passHash: string;
  salt: string;
  createdAt: number;
  lastSeenAt: number;
  /** The learner profile this account owns (lib/types.ts ProfileState). */
  profileId: string;
  /**
   * Honest status: OpenMind ships no mail service, so an address cannot be
   * proved. False means "nobody has verified this address" — the UI says so
   * rather than implying a verification step that never ran.
   */
  verified: boolean;
  /**
   * Bumped on sign-out. Every session token records the epoch it was issued
   * in, so bumping this invalidates every outstanding token for the account —
   * which is what makes signing out a SERVER decision rather than a client
   * courtesy. Without it, "sign out" only cleared the cookie: the token kept
   * verifying until its 60-day expiry, so anyone who had a copy of it (a shared
   * phone's history, a synced profile) stayed signed in. On a shared phone that
   * is the behaviour a learner actually needs.
   */
  sessionEpoch?: number;
}

/** Everything about an account that is safe to send to the client. */
export interface PublicAccount {
  id: string;
  email: string;
  name: string;
  role: AccountRole;
  createdAt: number;
  profileId: string;
  verified: boolean;
}

export function publicAccount(a: Account): PublicAccount {
  return {
    id: a.id, email: a.email, name: a.name, role: a.role,
    createdAt: a.createdAt, profileId: a.profileId, verified: a.verified,
  };
}

// ── Storage ─────────────────────────────────────────────────────────────────
// Same one-directory-is-the-deployment model as the rest of the store: copy
// .openmind-data and you have carried every account and every learner with it.

const locks = new Map<string, Promise<unknown>>();
function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(key, next.then(() => undefined, () => undefined));
  return next;
}

async function readAccounts(): Promise<Record<string, Account>> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "accounts.json"), "utf8");
    return JSON.parse(raw) as Record<string, Account>;
  } catch {
    return {};
  }
}

async function writeAccounts(all: Record<string, Account>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = "accounts.json";
  const tmp = path.join(DATA_DIR, `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(all), "utf8");
  await fs.rename(tmp, path.join(DATA_DIR, file));
}

// ── Passwords ───────────────────────────────────────────────────────────────

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export function makeSalt(): string {
  return randomBytes(16).toString("hex");
}

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

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ── Account operations ──────────────────────────────────────────────────────

export async function getAccount(id: string): Promise<Account | null> {
  const all = await readAccounts();
  return all[id] ?? null;
}

export async function findAccountByEmail(email: string): Promise<Account | null> {
  const target = normaliseEmail(email);
  const all = await readAccounts();
  return Object.values(all).find((a) => a.email === target) ?? null;
}

export async function countAccounts(): Promise<number> {
  return Object.keys(await readAccounts()).length;
}

/**
 * Create an account bound to a learner profile. The caller creates (or claims)
 * the profile first, so a sign-up never leaves an account pointing at nothing.
 */
export async function createAccount(input: {
  email: string;
  password: string;
  name: string;
  role?: AccountRole;
  profileId: string;
}): Promise<Account> {
  return withLock("accounts.json", async () => {
    const all = await readAccounts();
    const email = normaliseEmail(input.email);
    if (Object.values(all).some((a) => a.email === email)) throw new Error("email_taken");
    const salt = makeSalt();
    const account: Account = {
      id: newId("acc"),
      email,
      name: input.name.trim().slice(0, 40) || email.split("@")[0],
      role: input.role ?? "student",
      salt,
      passHash: hashPassword(input.password, salt),
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      profileId: input.profileId,
      verified: false,
    };
    all[account.id] = account;
    await writeAccounts(all);
    return account;
  });
}

/** Point an existing account at a different profile (used when a signed-in
 *  learner claims the anonymous profile they were already using). */
export async function setAccountProfile(accountId: string, profileId: string): Promise<Account | null> {
  return withLock("accounts.json", async () => {
    const all = await readAccounts();
    const a = all[accountId];
    if (!a) return null;
    a.profileId = profileId;
    a.lastSeenAt = Date.now();
    await writeAccounts(all);
    return a;
  });
}

export async function touchAccount(accountId: string): Promise<void> {
  await withLock("accounts.json", async () => {
    const all = await readAccounts();
    const a = all[accountId];
    if (!a) return;
    a.lastSeenAt = Date.now();
    await writeAccounts(all);
  });
}

/** Change the display name / role stored on the account. */
export async function updateAccount(
  accountId: string,
  patch: { name?: string; role?: AccountRole },
): Promise<Account | null> {
  return withLock("accounts.json", async () => {
    const all = await readAccounts();
    const a = all[accountId];
    if (!a) return null;
    if (typeof patch.name === "string" && patch.name.trim()) a.name = patch.name.trim().slice(0, 40);
    if (patch.role) a.role = patch.role;
    await writeAccounts(all);
    return a;
  });
}

/** Set a new password (requires the current one at the route level). */
export async function setPassword(accountId: string, password: string): Promise<void> {
  await withLock("accounts.json", async () => {
    const all = await readAccounts();
    const a = all[accountId];
    if (!a) return;
    a.salt = makeSalt();
    a.passHash = hashPassword(password, a.salt);
    await writeAccounts(all);
  });
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

/** End every outstanding session for this account (bump the epoch). */
export async function revokeSessions(accountId: string): Promise<void> {
  await withLock("accounts.json", async () => {
    const all = await readAccounts();
    const a = all[accountId];
    if (!a) return;
    a.sessionEpoch = (a.sessionEpoch ?? 0) + 1;
    await writeAccounts(all);
  });
}

export function cookieHeader(token: string): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  // HttpOnly so a script cannot read it; Lax so ordinary link navigation works
  // from a school's portal without CSRF exposure on state-changing posts.
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
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

/** A fresh, unguessable id for a newly created learner profile. Kept here so
 *  the auth routes and the profile route agree on the shape. */
export function newProfileId(): string {
  return `${newId("stu")}${randomUUID().slice(0, 4)}`;
}

/**
 * Hand the profile's capability secret back to a *session-authenticated*
 * caller. The session proves the password; the secret then lets every existing
 * `/api/progress`, `/api/diagnostic` call work unchanged on a brand-new device
 * — which is exactly what "my work is saved to my account" has to mean.
 */
export async function ensureProfileSecretFor(state: ProfileState): Promise<string> {
  if (!state.secret) {
    state.secret = randomUUID().replace(/-/g, "");
    await saveProfile(state);
  }
  return state.secret;
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
