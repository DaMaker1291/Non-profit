import { NextResponse } from "next/server";
import { CLIENT_ADDRESS_HEADER, ingressConfig, readIngress } from "@/lib/server/client-address";

/**
 * GET /api/ingress — what did the deployment's ingress actually deliver?
 *
 * This exists because the ONE claim a local test cannot make is that the live
 * proxy is configured the way the application expects. `OPENMIND_TRUSTED_PROXY=1`
 * is a declaration; this route is the measurement of it, from the outside, on the
 * real ingress.
 *
 * It reports only facts about the CALLER'S OWN request: whether a proxy is
 * declared, how many chain entries this request carried, and which address the
 * app attributed it to. Nothing about any other learner, no store access, no
 * counters. A public reader learns their own IP and the deployment's hop count,
 * which is already visible in the response headers of every request they make.
 *
 * A staging check reads this through the public URL and asserts that
 *   1. the deployment says it has a proxy,
 *   2. the request was attributed (not refused), and
 *   3. a FORGED forwarded entry does not change the answer.
 * Point 3 is the one worth having: it is the difference between "the proxy
 * appends and we read the append" and "the proxy prepends, so the client chooses
 * its own identity" — a difference no amount of local testing can settle.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const config = ingressConfig();
  const ingress = readIngress(req.headers);
  return NextResponse.json(
    {
      declared: config.declared,
      hops: config.hops,
      header: CLIENT_ADDRESS_HEADER,
      /** What the app did with THIS request. */
      kind: ingress.kind,
      /** Present only when this request was attributable. */
      address: ingress.kind === "client" ? ingress.address : null,
      chainLength: ingress.kind === "client" ? ingress.chainLength : null,
      /** Why attribution failed, from a closed set — never an echo of input. */
      reason: ingress.kind === "refused" ? ingress.reason : null,
    },
    {
      // The answer is about one request, so it must never be cached or shared.
      headers: { "Cache-Control": "no-store" },
    },
  );
}
