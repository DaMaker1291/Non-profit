import { NextResponse } from "next/server";
import { cookieHeader, createSessionToken } from "@/lib/server/auth";

/** Attach the freshly-minted session cookie to a JSON response. Centralised so
 *  sign-up, sign-in and claim cannot drift in their cookie flags. */
export function withSession<T extends object>(payload: T, token: string, status = 200, req?: Request): NextResponse {
  return NextResponse.json(payload, { status, headers: { "Set-Cookie": cookieHeader(token, req) } });
}

/** Mint a session token in the account's CURRENT epoch. The epoch matters: it
 *  is what a later sign-out bumps, so a token has to record the world it was
 *  issued in. */
export async function sessionTokenFor(account: { id: string; sessionEpoch?: number }): Promise<string> {
  return createSessionToken(account.id, account.sessionEpoch ?? 0);
}

/**
 * The refusal a bounded door gives when its window is full.
 *
 * `Retry-After` is on the response as well as in the body, because the header is
 * what a proxy, a load test and a browser all already understand — and because a
 * client that only reads the status must still be able to wait the right amount.
 * `Cache-Control: no-store` keeps the refusal out of any intermediary cache: an
 * error page cached for a minute would lock out a learner who had just typed the
 * right password.
 */
export function tooManyAttempts(retryAfterSec: number): NextResponse {
  const seconds = Math.max(1, Math.ceil(retryAfterSec));
  return NextResponse.json(
    { error: "too_many_attempts", retryAfterSec: seconds },
    { status: 429, headers: { "Retry-After": String(seconds), "Cache-Control": "no-store" } },
  );
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
