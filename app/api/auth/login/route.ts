import { NextResponse } from "next/server";
import { findAccountByEmail, passwordMatches, sessionPayload, touchAccount } from "@/lib/server/auth";
import {
  clear, hit, peek, SIGNIN_PER_ACCOUNT, SIGNIN_PER_ADDRESS, SIGNIN_PER_PROCESS,
  SIGNIN_PROCESS_KEY, signinKeyFor, sleep, type LimitPolicy,
} from "@/lib/server/rate-limit";
import { ingressFor } from "@/lib/server/client-address";
import { tooManyAttempts, untrustedIngress } from "@/lib/server/limits";
import { readBody, sessionTokenFor, str, withSession } from "../_shared";

/**
 * POST /api/auth/login — sign in and get the learner profile back.
 *
 * The response carries the profile's capability secret too: that is what makes
 * "my account" mean something on a second device, because the whole existing
 * learner API is then callable from the new browser without another prompt.
 *
 * THE ATTEMPT COUNT, IN TWO HALVES (lib/server/rate-limit.ts explains the rule).
 *
 * This door used to verify passwords with no bound on how many times it could be
 * asked (docs/SECURITY.md §9). scrypt made each guess expensive, but the number
 * of guesses was unlimited, so the only cost was the attacker's.
 *
 * The first bound written here was a HARD refusal of every attempt against an
 * account after eight failures — which also refused the account's own correct
 * password, so anyone who knew an email address could keep its owner out for
 * fifteen minutes. That is a denial of service wearing the costume of a
 * defence, and the assertions at the bottom of §7 of verify-permissions say so
 * in the learner's terms: an attacked account still signs its owner in.
 *
 * So:
 *   · the SOURCE ADDRESS (only when the deployment declares a trusted proxy) is
 *     HARD — refused before the derivation, because a refusal there cannot deny
 *     a person their own account, and it is the one bound that stops an attacker
 *     making this server do scrypt work;
 *   · the ACCOUNT is SOFT — after eight failures each attempt pauses
 *     (250 ms → 2 s) and then STILL CHECKS the password, so the learner who
 *     knows it gets in and the attacker gets slower;
 *   · the PROCESS is SOFT too, keyed on nothing the attacker chooses, so a
 *     distributed attack cannot exhaust the derivation budget. It is soft
 *     because a hard global ceiling would be a switch one attacker could throw
 *     to take sign-in down for everyone.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await readBody(req);
  const email = str(body.email);
  const password = str(body.password);
  if (!email || !password) return NextResponse.json({ error: "missing" }, { status: 400 });

  // 0. CAN THIS REQUEST BE ATTRIBUTED AT ALL? A declared proxy that did not
  //    deliver a usable chain means this request did not arrive through the
  //    ingress the deployment declared — either a misconfigured proxy or someone
  //    reaching the origin directly. Refusing is the loud, correct answer: the
  //    alternative is running this door unbounded while reporting it bounded.
  const ingress = ingressFor(req);
  if (ingress.kind === "refused") return untrustedIngress(ingress.reason);

  // 1. HARD BOUNDS FIRST: a source that has spent its budget is refused before
  //    this server spends a derivation on it.
  const hard: [string, LimitPolicy][] = [];
  if (ingress.kind === "client") hard.push([`signin:ip:${ingress.address}`, SIGNIN_PER_ADDRESS]);
  for (const [key, policy] of hard) {
    const now = peek(key, policy);
    if (!now.allowed) return tooManyAttempts(now.retryAfterSec);
  }

  // 2. SOFT BOUNDS: never refuse, only slow. Split from the hard list on purpose
  //    — the mode is a property of the POLICY, and this loop treats every soft
  //    verdict as "proceed, after at most the longest pause any key asks for".
  const soft: [string, LimitPolicy][] = [
    [signinKeyFor(email), SIGNIN_PER_ACCOUNT],
    [SIGNIN_PROCESS_KEY, SIGNIN_PER_PROCESS],
  ];
  let delayMs = 0;
  for (const [key, policy] of soft) delayMs = Math.max(delayMs, peek(key, policy).delayMs);
  // The pause happens BEFORE the derivation, which is the only place it can cost
  // an attacker anything. The learner experiences it only while somebody else is
  // working their account — and never longer than two seconds.
  if (delayMs > 0) await sleep(delayMs);

  // 3. Count the derivation this request is about to spend. The process key is
  //    counted whatever happens next and is NEVER cleared — it measures work
  //    done, not failures — while the account key is cleared by a success below.
  for (const [key, policy] of soft) hit(key, policy);

  const account = await findAccountByEmail(email);
  // Same message and status for "no such account" and "wrong password" — the
  // difference would tell a stranger which addresses are registered. It also
  // means the soft bounds spend exactly the same on an unknown address, so their
  // timing says nothing about whether the account exists.
  if (!account || !passwordMatches(account, password)) {
    // The failure is counted for an address that does not exist too, so the
    // address bound says nothing about whether an account is registered either.
    let retryAfterSec = 0;
    for (const [key, policy] of hard) {
      const after = hit(key, policy);
      if (!after.allowed) retryAfterSec = Math.max(retryAfterSec, after.retryAfterSec);
    }
    if (retryAfterSec) return tooManyAttempts(retryAfterSec);
    // NOTE the absence of a 429 here: a wrong password is a wrong password, and
    // an account over its soft budget has already paid with the pause above.
    // Answering `too_many_attempts` would tell the owner of a real account that
    // someone else had been trying — and would be the lockout again, in words.
    return NextResponse.json({ error: "bad_credentials" }, { status: 401 });
  }

  // The password was right: this account's window starts clean, and so does its
  // source's failure count (a classroom shares one address, and its learners
  // must not inherit each other's typos). Cleared per key rather than globally,
  // so one learner's success cannot lift another source's bound — and the
  // process key is NOT cleared, because it counts derivations already spent.
  clear(signinKeyFor(email));
  for (const [key] of hard) clear(key);

  const payload = await sessionPayload(account);
  if (!payload) return NextResponse.json({ error: "profile_missing" }, { status: 500 });
  void touchAccount(account.id);

  const token = await sessionTokenFor(account);
  return withSession(payload, token, 200, req);
}
