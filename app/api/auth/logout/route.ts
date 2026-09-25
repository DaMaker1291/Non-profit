import { NextResponse } from "next/server";
import { accountFromRequest, clearCookieHeader, revokeSessions } from "@/lib/server/auth";

/**
 * POST /api/auth/logout — end the session, on the server.
 *
 * This used to clear the cookie and nothing else, which is not the same thing:
 * the signed token stayed valid until its 60-day expiry, so a copy of it (a
 * synced browser profile, a shared phone's history) remained signed in even
 * after the learner pressed "sign out". Bumping the account's session epoch
 * invalidates EVERY outstanding token for that account — which means a shared
 * phone genuinely ends up signed out. The learner's progress is untouched, and
 * signing back in restores it.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const account = await accountFromRequest(req);
  if (account) await revokeSessions(account.id);
  return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": clearCookieHeader() } });
}
