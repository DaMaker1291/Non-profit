import { NextResponse } from "next/server";
import { findAccountByEmail, passwordMatches, sessionPayload, touchAccount } from "@/lib/server/auth";
import { readBody, sessionTokenFor, str, withSession } from "../_shared";

/**
 * POST /api/auth/login — sign in and get the learner profile back.
 *
 * The response carries the profile's capability secret too: that is what makes
 * "my account" mean something on a second device, because the whole existing
 * learner API is then callable from the new browser without another prompt.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await readBody(req);
  const email = str(body.email);
  const password = str(body.password);
  if (!email || !password) return NextResponse.json({ error: "missing" }, { status: 400 });

  const account = await findAccountByEmail(email);
  // Same message and status for "no such account" and "wrong password" — the
  // difference would tell a stranger which addresses are registered.
  if (!account || !passwordMatches(account, password)) {
    return NextResponse.json({ error: "bad_credentials" }, { status: 401 });
  }

  const payload = await sessionPayload(account);
  if (!payload) return NextResponse.json({ error: "profile_missing" }, { status: 500 });
  void touchAccount(account.id);

  const token = await sessionTokenFor(account);
  return withSession(payload, token);
}
