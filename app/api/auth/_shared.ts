import { NextResponse } from "next/server";
import { cookieHeader, createSessionToken } from "@/lib/server/auth";

/** Attach the freshly-minted session cookie to a JSON response. Centralised so
 *  sign-up, sign-in and claim cannot drift in their cookie flags. */
export function withSession<T extends object>(payload: T, token: string, status = 200): NextResponse {
  return NextResponse.json(payload, { status, headers: { "Set-Cookie": cookieHeader(token) } });
}

/** Mint a session token in the account's CURRENT epoch. The epoch matters: it
 *  is what a later sign-out bumps, so a token has to record the world it was
 *  issued in. */
export async function sessionTokenFor(account: { id: string; sessionEpoch?: number }): Promise<string> {
  return createSessionToken(account.id, account.sessionEpoch ?? 0);
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
