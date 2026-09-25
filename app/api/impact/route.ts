import { NextResponse } from "next/server";
import { readEvidence, learnersWithEvidence } from "@/lib/server/evidence";
import { generateImpactReport } from "@/lib/evidence";

/**
 * /api/impact — the deployment-level outcome report, generated from the ledger.
 *
 * AGGREGATE ONLY, and by construction rather than by convention: this route
 * walks the ledgers and emits counts, never a learner's events or identity. The
 * response carries `containsIndividualData: false` so a page cannot render
 * individual learners through this door even by mistake.
 *
 * It is not a marketing number. It reports what the evidence supports, refuses
 * percentages where there is no denominator, and ships its own `limitations`
 * with every response so a figure cannot be quoted without them. The causal
 * claim — "OpenMind improves grades by X" — is not computable here and is
 * deliberately absent; only a controlled evaluation could produce it.
 *
 * Auth: no learner capability secret, because nothing learner-identifying is
 * returned. Set OPENMIND_IMPACT_KEY to require a publisher key before exposing
 * this on a public deployment; without it the route is open, which is the right
 * default for a local or single-school install.
 */
export async function GET(req: Request) {
  const required = process.env.OPENMIND_IMPACT_KEY;
  if (required) {
    const url = new URL(req.url);
    const presented = url.searchParams.get("key") ?? req.headers.get("x-openmind-key");
    if (presented !== required) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const learners = learnersWithEvidence();
  const report = generateImpactReport(
    learners.map((learnerId) => ({ learnerId, events: readEvidence(learnerId) })),
  );

  return NextResponse.json({
    ...report,
    generatedAt: Date.now(),
    methodology: {
      unit: "one learner's append-only evidence ledger",
      changeMeasuredAs: "the learner's own first measuring sitting vs their last, never across learners",
      excludedFromChange: "learners lacking either a baseline or a later measurement",
      serverObserved: "events the server graded itself (provenance: \"server\")",
      deviceReported: "events synced from an offline device (provenance: \"device\") — counted, disclosed, unverifiable",
    },
  });
}
