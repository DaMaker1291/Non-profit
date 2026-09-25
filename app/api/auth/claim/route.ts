import { NextResponse } from "next/server";
import { accountFromRequest, ensureProfileSecretFor, publicAccount, setAccountProfile } from "@/lib/server/auth";
import { getProfile, publicProfileState } from "@/lib/server/store";
import { readBody, str } from "../_shared";

/**
 * POST /api/auth/claim — attach the anonymous profile on THIS device to the
 * signed-in account, so work done before signing up is not lost.
 *
 * Refused when the account already has recorded answers: silently swapping one
 * learner's history for another's is exactly the kind of quiet data loss this
 * project must not do. The UI explains that instead.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const account = await accountFromRequest(req);
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await readBody(req);
  const profileId = str(body.profileId);
  if (!profileId) return NextResponse.json({ error: "bad_profile" }, { status: 400 });

  const candidate = await getProfile(profileId);
  if (!candidate) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const proven = !candidate.secret || candidate.secret === str(body.secret);
  if (!proven) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const current = await getProfile(account.profileId);
  const currentHasWork = current ? Object.keys(current.progress).length > 0 : false;
  if (currentHasWork && account.profileId !== profileId) {
    return NextResponse.json({ error: "account_has_progress" }, { status: 409 });
  }

  const updated = await setAccountProfile(account.id, profileId);
  if (!updated) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const secret = await ensureProfileSecretFor(candidate);
  return NextResponse.json({ account: publicAccount(updated), profile: publicProfileState(candidate), secret });
}
