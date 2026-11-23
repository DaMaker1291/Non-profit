// ─────────────────────────────────────────────────────────────────────────────
// PROVING AN ADDRESS — a token that is stored only as a hash, and dies when used.
//
// The account record has carried `verified: false` since accounts existed, with a
// comment saying why: there was no mail service, so nobody could prove an address
// and the UI said so rather than implying a step that never ran. This module is
// the step. It changes the ANSWER, never the honesty: an account is `verified`
// only when a token minted here came back through the mail and was consumed once.
//
// THREE PROPERTIES, and each one is a decision rather than an implementation
// detail:
//
//   · ONLY THE HASH IS STORED (`verifySalt`/`verifyHash` on the account, exactly
//     as the recovery code is). A verification link is a bearer credential: a
//     store that held it in the clear would make every backup and every
//     `.openmind-data` copy a way to confirm somebody else's address.
//
//   · IT EXPIRES IN 24 HOURS AND IS SINGLE USE. Consuming it clears the hash in
//     the same write that sets `verified`, so the second click on the same link is
//     a refusal rather than a second confirmation — and a link found later in an
//     inbox is inert.
//
//   · THE ACCOUNT ID TRAVELS IN THE TOKEN, THE SECRET VERIFIES. Without that,
//     verifying would be a scan over every account; with it, the token names one
//     account and the hash still has to match. The id is not a secret (`acc_…`
//     appears in every session payload) and knowing it proves nothing.
//
// WHY THE TOKEN LOOKUP IS NOT AN ORACLE. A wrong token, an expired token and a
// token for an account that no longer exists all answer the same 400 at the route,
// which is the rule `recover` already follows.
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes, timingSafeEqual } from "crypto";
import { hashPassword, makeSalt } from "./store";
// THE BACKEND, NOT THE FILE. Accounts live on the storage port, so the token
// writes go through `activeStorage()` exactly as `lib/server/auth.ts` does — a
// second module reaching the file functions directly would be the second writer
// the port exists to prevent.
import { activeStorage } from "./storage-file";
import { mailConfigured, publicBaseUrl, sendMail } from "./mail";
import type { Account } from "../types";

/** A day is long enough to survive a school night and short enough that a
 *  forwarded message is not a permanent key. */
export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

const SEPARATOR = ".";

/** `${accountId}.${secret}` — two parts, both hex-safe. */
export function verificationToken(accountId: string, secret: string): string {
  return `${accountId}${SEPARATOR}${secret}`;
}

export function splitVerificationToken(token: string): { accountId: string; secret: string } | null {
  const at = token.indexOf(SEPARATOR);
  if (at <= 0) return null;
  const accountId = token.slice(0, at);
  const secret = token.slice(at + 1);
  if (!/^acc_[A-Za-z0-9]+$/.test(accountId)) return null;
  if (!/^[a-f0-9]{32,}$/.test(secret)) return null;
  return { accountId, secret };
}

/**
 * Mint a token for this account and store its hash. Returns the PLAINTEXT token,
 * which is the only moment it exists outside the hash — the caller puts it in a
 * link and forgets it.
 *
 * Rotation is a replacement, not an addition: asking for a second link must not
 * leave the first one live, or "send it again" would double the number of ways
 * into the account.
 */
export async function issueVerificationToken(account: Account): Promise<string | null> {
  const secret = randomBytes(32).toString("hex");
  const salt = makeSalt();
  const stored = await activeStorage().setEmailVerification(account.id, {
    salt,
    hash: hashPassword(secret, salt),
    expiresAt: Date.now() + VERIFY_TTL_MS,
  });
  if (!stored) return null;
  return verificationToken(account.id, secret);
}

export type VerifyOutcome =
  | { ok: true; account: Account }
  | { ok: false; reason: "bad_token" | "expired" };

/**
 * Consume a token. One success per token, and the proof is cleared as it is used.
 *
 * The comparison is constant-time for the same reason password comparison is: a
 * byte-by-byte early exit is a way to learn a valid hash without guessing it.
 */
export async function consumeVerificationToken(token: string): Promise<VerifyOutcome> {
  const parts = splitVerificationToken(token);
  if (!parts) return { ok: false, reason: "bad_token" };

  const account = await activeStorage().getAccount(parts.accountId);
  if (!account || !account.verifyHash || !account.verifySalt) return { ok: false, reason: "bad_token" };

  const candidate = Buffer.from(hashPassword(parts.secret, account.verifySalt), "hex");
  const known = Buffer.from(account.verifyHash, "hex");
  if (candidate.length !== known.length || !timingSafeEqual(candidate, known)) {
    return { ok: false, reason: "bad_token" };
  }

  // Expiry is checked AFTER the hash matches, so an expired token cannot be
  // distinguished from a wrong one by timing or by message until the holder has
  // already proved they were sent it.
  if (typeof account.verifyExpiresAt !== "number" || account.verifyExpiresAt < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const updated = await activeStorage().markEmailVerified(account.id);
  if (!updated) return { ok: false, reason: "bad_token" };
  return { ok: true, account: updated };
}

export interface VerificationMail {
  sent: boolean;
  reason?: "unconfigured" | "no_public_url" | "provider_error" | "already_verified" | "unavailable";
}

function body(link: string, name: string): { subject: string; text: string; html: string } {
  const subject = "Confirm your OpenMind email address";
  const text = [
    `Hi ${name},`,
    "",
    "Open this link to confirm that this address belongs to you:",
    link,
    "",
    "The link works once and expires in 24 hours.",
    "",
    "If you did not create an OpenMind account, ignore this message — nothing changes and no one can sign in with this address.",
  ].join("\n");
  const html = `<!doctype html><html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.5;color:#14232b">
<p>Hi ${escapeHtml(name)},</p>
<p>Open the link below to confirm that this address belongs to you.</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 16px;background:#1f6f5c;color:#fff;border-radius:6px;text-decoration:none">Confirm my email</a></p>
<p style="font-size:14px;color:#5b6b73">Or paste this into your browser:<br><span style="word-break:break-all">${escapeHtml(link)}</span></p>
<p style="font-size:14px;color:#5b6b73">The link works once and expires in 24 hours. If you did not create an OpenMind account, ignore this message — nothing changes.</p>
</body></html>`;
  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Send the confirmation message for this account, describing honestly why it did
 * not go when it did not. Never throws; never fails the caller's flow.
 */
export async function sendVerificationEmail(account: Account): Promise<VerificationMail> {
  if (account.verified) return { sent: false, reason: "already_verified" };
  if (!mailConfigured()) return { sent: false, reason: "unconfigured" };
  const base = publicBaseUrl();
  if (!base) return { sent: false, reason: "no_public_url" };

  const token = await issueVerificationToken(account);
  if (!token) return { sent: false, reason: "unavailable" };

  const link = `${base}/verify?token=${encodeURIComponent(token)}`;
  const message = body(link, account.name || "there");
  const result = await sendMail({
    to: account.email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
  return result.sent ? { sent: true } : { sent: false, reason: result.reason };
}
