import { NextResponse } from "next/server";
import { accountFromRequest } from "@/lib/server/auth";
import { sendVerificationEmail } from "@/lib/server/verification";
import { hit, type LimitPolicy } from "@/lib/server/rate-limit";
import { tooManyAttempts } from "@/lib/server/limits";

/**
 * POST /api/auth/resend-verification — send the confirmation link again.
 *
 * SESSION-AUTHENTICATED, deliberately. An endpoint that took an address and
 * mailed a link to it would be a free way to make this domain send mail to
 * anybody: a spam relay with an educational front page. Requiring the account
 * means the only address this can reach is one the caller can already sign in to —
 * which is also the only case where a resend helps.
 *
 * Three per fifteen minutes, per ACCOUNT (not per address): the limit exists to
 * bound an accidental click loop and a provider bill, not to defend a credential.
 */
const RESEND_POLICY: LimitPolicy = { max: 3, windowMs: 15 * 60 * 1000, mode: "hard" };

export async function POST(req: Request): Promise<NextResponse> {
  const account = await accountFromRequest(req);
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const budget = hit(`verify:resend:${account.id}`, RESEND_POLICY);
  if (!budget.allowed) return tooManyAttempts(budget.retryAfterSec);

  const result = await sendVerificationEmail(account);
  // `sent: false` is reported, not raised: the caller is a signed-in learner whose
  // account is fine, and the honest sentence is "we could not send it", with the
  // reason, rather than a 500 that reads like the account broke.
  return NextResponse.json({
    sent: result.sent,
    ...(result.reason ? { reason: result.reason } : {}),
  });
}
