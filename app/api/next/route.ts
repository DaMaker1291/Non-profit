import { NextResponse } from "next/server";
import { decide } from "@/lib/decision";
import { decisionContextFor } from "@/lib/server/decision";
import { buildSnapshot } from "@/lib/learner-model";
import { authorizeLearner } from "@/lib/server/capability";
import { incompleteSubjects } from "@/lib/specifications";

/** GET /api/next?id=... — the central decision API.
 *
 *  Architectural rule: every major learner-facing action either originates
 *  here or produces evidence this engine consumes. Projects, review, mind
 *  map, offline, peer teaching and teacher interventions all read the same
 *  learner model — no feature bypasses the loop.
 *
 *  Since the decision door exists, this route does not call the engine for
 *  itself. It asks the SERVER for the canonical context (model + the ledger the
 *  model was projected from) and makes the decision through `decide`, which is
 *  the same door Home and the offline pack use — so all three MUST agree about
 *  the same learner. It used to pass the model and no evidence, which made this
 *  the one surface that could recommend the same thing for a different reason.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  // The decision is the most learner-specific thing this API serves — a plan,
  // its reasons, and the answers behind them — so it is held to exactly the
  // rule the ledger it is derived from enforces. Without this, an id alone
  // bought a learner's whole plan (audit finding).
  const auth = await authorizeLearner(id, searchParams.get("secret"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const ctx = await decisionContextFor(id!);
  if (!ctx) return NextResponse.json({ error: "not found" }, { status: 404 });
  const snap = buildSnapshot(ctx.model);
  const actions = decide(ctx, { max: 6 });
  return NextResponse.json({
    actions,
    // The decision's provenance travels with it: which projection produced the
    // model, how much ledger it was decided from, and what the evidence cannot
    // account for. A caller can disclose all three rather than guess.
    decision: {
      projectionVersion: actions[0]?.projectionVersion ?? ctx.projectionVersion,
      evidenceEvents: ctx.events.length,
      unprojectable: ctx.unprojectable,
    },
    snapshot: { touched: snap.touched, strong: snap.strong, due: snap.dueCount },
    // Whose course is still unchosen, DERIVED from the profile on this read. A
    // recommendation must never rest on a qualification nobody picked, so the
    // consumer is told rather than left to trust the fallback: a subject listed
    // here has no course yet and its plan is provisional until one is chosen.
    courseGaps: incompleteSubjects(ctx.model.profile),
  });
}
