import { NextResponse } from "next/server";
import {
  accountFromRequest, passwordMatches, publicAccount, sessionPayload, setPassword, updateAccount,
  type AccountRole,
} from "@/lib/server/auth";
import { readBody, str } from "../_shared";

const ROLES: AccountRole[] = ["student", "teacher", "org"];

/** GET /api/auth/me — who is signed in, plus their learner profile. */
export async function GET(req: Request): Promise<NextResponse> {
  const account = await accountFromRequest(req);
  if (!account) return NextResponse.json({ account: null });
  const payload = await sessionPayload(account);
  if (!payload) return NextResponse.json({ account: null });
  return NextResponse.json(payload);
}

/**
 * POST /api/auth/me — update the account itself (display name, role, password).
 * Changing the password requires the current one even though the session is
 * valid: a borrowed laptop must not be able to lock the owner out.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const account = await accountFromRequest(req);
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await readBody(req);

  const name = str(body.name);
  const role = str(body.role);
  const updated = await updateAccount(account.id, {
    name: name || undefined,
    role: ROLES.includes(role as AccountRole) ? (role as AccountRole) : undefined,
  });

  const newPassword = str(body.newPassword);
  if (newPassword) {
    if (newPassword.length < 8) return NextResponse.json({ error: "weak_password" }, { status: 400 });
    if (!passwordMatches(account, str(body.currentPassword))) {
      return NextResponse.json({ error: "bad_current_password" }, { status: 403 });
    }
    await setPassword(account.id, newPassword);
  }

  if (!updated) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const payload = await sessionPayload(updated);
  if (!payload) return NextResponse.json({ error: "profile_missing" }, { status: 500 });
  return NextResponse.json(payload);
}
