import { NextResponse } from "next/server";
import { passwordProblem, recoverAccount, sessionPayload } from "@/lib/server/auth";
import {
  clear, hit, peek, SIGNIN_PER_ACCOUNT, SIGNIN_PER_ADDRESS, SIGNIN_PER_PROCESS,
  SIGNIN_PROCESS_KEY, signinKeyFor, sleep, type LimitPolicy,
} from "@/lib/server/rate-limit";
import { ingressFor } from "@/lib/server/client-address";
import { tooManyAttempts, untrustedIngress } from "@/lib/server/limits";
import { readBody, sessionTokenFor, str, withSession } from "../_shared";

/**
 * POST /api/auth/recover — set a new password with a recovery code.
 *
 * WHY THIS DOOR EXISTS. `accounts.json` has no mail service behind it (see
 * docs/PRIVACY.md and `Account.verified`), so a forgotten password used to mean a
 * lost learner record: the ledger, the diagnostics, the misconceptions. This is
 * the way back in, and it deliberately does not need a mailbox — an email NAMES
 * the account when the learner remembers it, and a teacher's grant carries its own
 * lookup key when they do not.
 *
 * THE BOUNDS, and they are the sign-in bounds for the same reason. A recovery code
 * is a bearer credential, so guessing one must be as expensive as guessing a
 * password: the ACCOUNT is soft-bounded (never refused, only slowed, because the
 * owner must always be able to get in), the SOURCE ADDRESS is hard-bounded where a
 * trusted proxy makes it meaningful, and the PROCESS is soft-bounded so a
 * distributed attempt cannot exhaust the scrypt budget. All three are counted on
 * FAILURE and cleared on success, exactly as `login` does — a code typed correctly
 * after three typos is not a slower learner, it is the same learner.
 *
 * A WRONG CODE IS A 401 WITH ONE MESSAGE. "No such account", "expired grant",
 * "this code belongs to another learner" and "wrong code" answer identically, and
 * the response never says which — otherwise this door becomes an oracle for which
 * addresses are registered and whose grant is live.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await readBody(req);
  const email = str(body.email).trim();
  const code = str(body.code);
  const newPassword = str(body.newPassword);

  if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });
  // The password rule is the sign-up rule, not a second one: a recovery must not be
  // able to install a password that sign-up would have refused.
  const weak = passwordProblem(newPassword);
  if (weak) return NextResponse.json({ error: weak }, { status: 400 });

  const ingress = ingressFor(req);
  if (ingress.kind === "refused") return untrustedIngress(ingress.reason);

  const hard: [string, LimitPolicy][] = [];
  if (ingress.kind === "client") hard.push([`recover:ip:${ingress.address}`, SIGNIN_PER_ADDRESS]);
  for (const [key, policy] of hard) {
    const now = peek(key, policy);
    if (!now.allowed) return tooManyAttempts(now.retryAfterSec);
  }

  // The account key is the ADDRESS when one is given. Without an address the
  // per-account key has nothing to key on, and that is honest rather than
  // circumventable: the process bound and the source bound still apply, and a
  // grant expires in fifteen minutes.
  const soft: [string, LimitPolicy][] = [[SIGNIN_PROCESS_KEY, SIGNIN_PER_PROCESS]];
  if (email) soft.push([signinKeyFor(email), SIGNIN_PER_ACCOUNT]);
  let delayMs = 0;
  for (const [key, policy] of soft) delayMs = Math.max(delayMs, peek(key, policy).delayMs);
  if (delayMs > 0) await sleep(delayMs);
  for (const [key, policy] of soft) hit(key, policy);

  const recovered = await recoverAccount({ email: email || undefined, code, newPassword });

  if (!recovered) {
    let retryAfterSec = 0;
    for (const [key, policy] of hard) {
      const after = hit(key, policy);
      if (!after.allowed) retryAfterSec = Math.max(retryAfterSec, after.retryAfterSec);
    }
    if (retryAfterSec) return tooManyAttempts(retryAfterSec);
    return NextResponse.json({ error: "bad_recovery" }, { status: 401 });
  }

  // A successful recovery clears this account's failure budget, like a sign-in.
  clear(signinKeyFor(recovered.account.email));
  for (const [key] of hard) clear(key);

  const payload = await sessionPayload(recovered.account);
  if (!payload) return NextResponse.json({ error: "profile_missing" }, { status: 500 });

  const token = await sessionTokenFor(recovered.account);
  // The new code rides on the response because the old one is now dead — the
  // learner has to write this one down, and a second round trip would be a window
  // in which they have no code at all.
  return withSession({ ...payload, recoveryCode: recovered.recoveryCode }, token, 200, req);
}
