import { NextResponse } from "next/server";
import { APP_VERSION, deploymentId } from "@/lib/version";

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
 * It reports no data directory, no learner counts and no configuration detail:
 * the answer to "are you alive" is the same for a friend and a stranger, and a
 * public route should not enumerate a deployment's internals.
 *
 * Readiness — "can this instance actually serve a learner right now?" — is
 * GET /api/ready.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: "ok",
      service: "openmind",
      version: APP_VERSION,
      deployment: deploymentId(process.env),
      uptimeSeconds: Math.round(process.uptime()),
      now: Date.now(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
