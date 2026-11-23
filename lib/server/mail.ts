// ─────────────────────────────────────────────────────────────────────────────
// THE MAIL DOOR — one HTTP POST, and an honest answer when there is no key.
//
// Until this module existed, `Account.verified` was false for everybody because
// the deployment could not send a message at all. That was the truth, and the UI
// said it. It stops being the truth the moment an operator sets `RESEND_API_KEY`,
// so the two states have to be distinguishable in CODE rather than in a README:
// `mailConfigured()` is the one owner of the question, and every caller asks it
// instead of assuming either answer.
//
// WHY A RAW POST RATHER THAN AN SDK. Resend's send endpoint is one JSON body and
// one bearer header; a dependency here would be a supply-chain surface for twenty
// lines, and the repository already treats `fetch` as the transport everywhere
// else. The timeout is explicit because a mail provider that hangs must not hang
// a sign-up — the learner's account is already written by the time this runs, and
// a slow message is a resend, not a failure.
//
// WHAT THIS IS NOT. It cannot prove an address on its own: a token is minted and
// checked in `lib/server/verification.ts`, and this module only carries the text.
// Keeping delivery and proof apart is what lets the suite test the proof without
// a network, and lets an operator swap the provider without touching the tokens.
// ─────────────────────────────────────────────────────────────────────────────

const ENDPOINT = "https://api.resend.com/emails";

/** A from-address the provider will accept on its own test domain. Operators on
 *  their own domain set `OPENMIND_MAIL_FROM`; the default keeps a fresh clone
 *  working against `onboarding@resend.dev`. */
const DEFAULT_FROM = "OpenMind <onboarding@resend.dev>";

/** Is this deployment able to send mail at all? Asked, never assumed. */
export function mailConfigured(): boolean {
  return typeof process.env.RESEND_API_KEY === "string" && process.env.RESEND_API_KEY.trim().length > 0;
}

// The absolute origin a link in an email must point at. It is NOT derived from the
// request's Host header (see lib/server/seo.ts), and `null` means this deployment
// has not declared one — in which case this module refuses to send rather than
// mail a link nobody can open.
import { publicBaseUrl } from "./seo";
// Re-exported so a caller that already imports `publicBaseUrl` from the mail door
// does not have to know where the origin moved to.
export { publicBaseUrl };

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type MailResult = { sent: true } | { sent: false; reason: "unconfigured" | "no_public_url" | "provider_error" };

/**
 * Send one message. NEVER THROWS: every caller is mid-flow (a sign-up that has
 * already written an account, a resend from a signed-in session), and a delivery
 * problem must not turn into a lost learner. The failure is returned with its
 * reason so a surface can say "we could not send it" instead of pretending it
 * sent, which is the same rule `/api/health` follows for storage.
 */
export async function sendMail(msg: MailMessage): Promise<MailResult> {
  if (!mailConfigured()) return { sent: false, reason: "unconfigured" };
  if (!publicBaseUrl()) return { sent: false, reason: "no_public_url" };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.OPENMIND_MAIL_FROM?.trim() || DEFAULT_FROM,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { sent: false, reason: "provider_error" };
    return { sent: true };
  } catch {
    // A timeout, DNS failure or refused connection is the same fact to a learner:
    // the message did not go. The account is unaffected, and a resend is the way
    // forward.
    return { sent: false, reason: "provider_error" };
  }
}
