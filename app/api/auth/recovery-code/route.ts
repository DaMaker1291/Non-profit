import { NextResponse } from "next/server";
import { accountFromRequest, rotateRecoveryCode } from "@/lib/server/auth";
import { readBody, str } from "../_shared";

/**
 * POST /api/auth/recovery-code — mint a new recovery code for the signed-in learner.
 *
 * Two states need this, and they are the same write:
 *
 *   · an account created before recovery codes existed, which has none yet;
 *   · a learner who is about to hand the phone to somebody else, or who has lost
 *     the paper and is still signed in — rotating now is cheaper than losing the
 *     record later.
 *
 * THE CURRENT PASSWORD IS REQUIRED. A borrowed laptop already holds a session;
 * letting that session mint a permanent key to the record would turn "someone left
 * themselves signed in" into "someone owns this learner's account forever". That is
 * the same rule the password change follows, and for the same reason.
 *
 * The plaintext code is returned ONCE and is not recoverable afterwards — only its
 * scrypt hash is stored (lib/server/types.ts `Account.recoverySalt/Hash`).
 */
export async function POST(req: Request): Promise<NextResponse> {
  const account = await accountFromRequest(req);
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await readBody(req);
  const currentPassword = str(body.currentPassword);
  if (!currentPassword) return NextResponse.json({ error: "missing_password" }, { status: 400 });

  const rotated = await rotateRecoveryCode(account.id, currentPassword);
  if (!rotated.ok) {
    // One message for both refusals on purpose? No: `no_account` here means the
    // session named an account the store no longer holds, which is a 401 like any
    // other dead session; a wrong password is a 403 with its own sentence, because
    // the learner can act on it.
    if (rotated.reason === "bad_password") {
      return NextResponse.json({ error: "bad_current_password" }, { status: 403 });
    }
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ recoveryCode: rotated.code });
}
