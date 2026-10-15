import { NextResponse } from "next/server";
import { APP_VERSION, deploymentId } from "@/lib/version";
import { storeReadiness } from "@/lib/env";

/**
 * GET /api/health — LIVENESS. "Is this process alive?"
 *
 * The two questions the deployment brief (§11) separates, kept separate here:
 * this route answers the cheap one and answers it without touching the disk, the
 * network or the content graph. A load balancer, a container orchestrator or an
 * uptime monitor polls it, so it must never do work that can be slow — a health
 * check that queries storage is a readiness check wearing the wrong name, and a
 * slow one gets a healthy process killed.
 *
 * It reports no data directory, no learner counts and no secret: the answer to
 * "are you alive" is the same for a friend and a stranger, and a public route
 * should not enumerate a deployment's internals.
 *
 * THE ONE THING BESIDES LIVENESS that it does report, and why: whether this
 * deployment can KEEP what a learner writes (`store.durability`,
 * `store.writesPermitted`). A live service answered every health probe while
 * losing a canary learner to the next deploy, so "is it alive?" and "does it
 * keep anything?" are answers a monitor needs side by side without fetching a
 * second endpoint. It stays cheap — the judgement is a pure function of the
 * environment plus one memoised kernel read (see lib/env.ts#readMountTable), and
 * nothing here touches the data directory, which is the rule the paragraph above
 * exists to protect. The full statement, including what was declared and what
 * has been measured, is GET /api/ready.
 *
 * Readiness — "can this instance actually serve a learner right now?" — is
 * GET /api/ready.
 */
export async function GET(): Promise<NextResponse> {
  const store = storeReadiness(process.env);
  return NextResponse.json(
    {
      status: "ok",
      service: "openmind",
      version: APP_VERSION,
      deployment: deploymentId(process.env),
      uptimeSeconds: Math.round(process.uptime()),
      now: Date.now(),
      store: {
        kind: store.kind,
        /** The one-word judgement a monitor alarms on (lib/env.ts owns it). */
        durability: store.durability,
        /** What the operator declared — configuration, not evidence. */
        mode: store.mode,
        /** May this deployment accept a learner record? When false, learner-data
         *  writes answer 503 with `store_not_durable`. */
        writesPermitted: store.writesPermitted,
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
