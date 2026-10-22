// ── ONE PLACE THAT ANSWERS A REFUSAL ───────────────────────────────────────
//
// The counter (lib/server/rate-limit.ts) decides whether a key has spent its
// budget; the ingress (lib/server/client-address.ts) decides whether a request
// can be attributed at all. This module turns either answer into an HTTP
// response, so the credential doors, the AI doors, the answer door, the sync
// door and the upload door cannot drift into five different statuses or five
// different cache headers for the same fact.
//
// TWO REFUSALS, AND THEY MEAN DIFFERENT THINGS:
//
//   429 `too_many_attempts` — this caller has spent its budget. `Retry-After`
//   says how long, because a proxy, a load test and a browser all already
//   understand the header, and `no-store` keeps a cached error page from
//   outliving the window it describes.
//
//   403 `untrusted_ingress` — the deployment declared a proxy and this request
//   did not come through it, so the address bound cannot be applied. The app
//   says so rather than silently running unbounded, and the reason is a fixed
//   string from a closed set (never anything the client sent).
import { NextResponse } from "next/server";
import { ingressFor, type IngressRefusal } from "./client-address";
import { hit, peek, sleep, type LimitPolicy } from "./rate-limit";

export function tooManyAttempts(retryAfterSec: number): NextResponse {
  const seconds = Math.max(1, Math.ceil(retryAfterSec));
  return NextResponse.json(
    { error: "too_many_attempts", retryAfterSec: seconds },
    { status: 429, headers: { "Retry-After": String(seconds), "Cache-Control": "no-store" } },
  );
}

export function untrustedIngress(reason: IngressRefusal): NextResponse {
  return NextResponse.json(
    { error: "untrusted_ingress", reason },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Spend one attempt against `key`, applying the policy's own kind of bound:
 * a HARD one answers with the refusal, a SOFT one waits out its pause and lets
 * the request through.
 *
 * One function for both, because a caller that only knew how to refuse would
 * silently turn every soft policy into a counter that bounds nothing — which is
 * exactly what the process-wide bounds exist to avoid.
 *
 * `null` key means there is nothing to count against (no learner, no declared
 * proxy). It is NOT a placeholder key: one shared bucket would turn a limit into
 * an outage for every visitor at once.
 */
export async function pace(key: string | null, policy: LimitPolicy, now: number = Date.now()): Promise<NextResponse | null> {
  if (!key) return null;
  const ahead = peek(key, policy, now);
  if (ahead.delayMs > 0) await sleep(ahead.delayMs);
  const verdict = hit(key, policy, now);
  if (verdict.allowed) return null;
  return tooManyAttempts(verdict.retryAfterSec);
}

/** The key an authenticated learner is counted against.
 *
 *  Unforgeable BY CONSTRUCTION rather than by inspection: every caller passes an
 *  id it has already checked a capability or session against, so no attacker can
 *  choose whose budget to spend. */
export function learnerLimitKey(prefix: string, learnerId: string | null): string | null {
  return learnerId ? `${prefix}:learner:${learnerId}` : null;
}

/** The key an UNauthenticated caller is counted against, when the deployment
 *  declares a trusted ingress. `null` with no proxy — the honest answer, since
 *  a client-set header would let the caller choose its own bucket. */
export function ingressLimitKey(prefix: string, req: Request): string | null {
  const ingress = ingressFor(req);
  return ingress.kind === "client" ? `${prefix}:ip:${ingress.address}` : null;
}
