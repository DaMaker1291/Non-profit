import { NextResponse } from "next/server";
import { consumeVerificationToken } from "@/lib/server/verification";
import { publicAccount } from "@/lib/server/auth";
import { hit, SIGNUP_PER_ADDRESS } from "@/lib/server/rate-limit";
import { ingressFor } from "@/lib/server/client-address";
import { tooManyAttempts, untrustedIngress } from "@/lib/server/limits";
import { readBody, str } from "../_shared";

/**
 * POST /api/auth/verify — prove the address a confirmation link was sent to.
 *
 * WHY THIS IS A POST AND NOT A GET. The link in the message opens the page
 * `/verify?token=…`, and THE PAGE posts the token here. A GET that changed state
 * would be confirmed by any mail scanner, link preview or corporate proxy that
 * fetched the URL before the learner ever saw it — a verification performed by a
 * robot on the learner's behalf. The token also therefore never reaches a server
 * log as a query string on this route.
 *
 * ONE ANSWER FOR EVERY FAILURE. Unknown, expired and already-used tokens all
 * answer `400 bad_token`: telling them apart would make this door an oracle for
 * which tokens were once real.
 *
 * The token is a bearer credential, so the attempt is bounded by the source
 * address where the deployment can attribute one — the same hard bound sign-up
 * uses. There is no account key: the token is unguessable, and a bound keyed on a
 * guessable id would let a stranger spend somebody else's budget.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await readBody(req);
  const token = str(body.token).trim();
  if (!token || token.length > 200) return NextResponse.json({ error: "bad_token" }, { status: 400 });

  const ingress = ingressFor(req);
  if (ingress.kind === "refused") return untrustedIngress(ingress.reason);
  if (ingress.kind === "client") {
    const after = hit(`verify:ip:${ingress.address}`, SIGNUP_PER_ADDRESS);
    if (!after.allowed) return tooManyAttempts(after.retryAfterSec);
  }

  const outcome = await consumeVerificationToken(token);
  if (!outcome.ok) return NextResponse.json({ error: "bad_token" }, { status: 400 });

  // The session cookie is NOT touched. Verifying an address is not a sign-in:
  // the learner may have opened the message on a different device, and minting a
  // session there from a mailed link is exactly the capability the link should
  // not carry.
  return NextResponse.json({ verified: true, account: publicAccount(outcome.account) });
}
