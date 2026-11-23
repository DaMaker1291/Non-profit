import { NextResponse } from "next/server";
import { decide } from "@/lib/decision";
import { decisionContextFor } from "@/lib/server/decision";
import { buildSnapshot } from "@/lib/learner-model";
import { authorizeLearner } from "@/lib/server/capability";
import { incompleteSubjects } from "@/lib/specifications";
import { ctitle } from "@/lib/content-i18n";
import { translator } from "@/lib/i18n";
import { listClasses } from "@/lib/server/store";
import { adjustActions, rungForHandle } from "@/lib/right-level-serve";
import type { RungLevel } from "@/lib/right-level";

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
  // ── THE DECISION IS SERVED IN THE LEARNER'S LANGUAGE ────────────────────
  // `decideNext` falls back to its English table when it is given no translator
  // and no title resolver, silently. This route passed neither, so an Arabic or
  // Japanese learner reading a reason from THIS door got English — while
  // /api/my-pack, which does pass them, got it right (its own comment records
  // the hazard). The client surfaces pass a translator too, so the server was
  // the only place a reason could come out in the wrong language. The teaching
  // language wins when a learner has named one, exactly as the pack resolves it.
  const lang = ctx.model.profile.teachingLang ?? ctx.model.profile.language ?? "en";
  const recommendations = decide(ctx, { max: 6, tt: translator(lang), title: (cid) => ctitle(lang, cid) });

  // ── THE TEACHER'S PLACEMENT CHANGES THE RECOMMENDATION ────────────────
  // The rung is stored on the class (`levels`, written by the teacher's own
  // account through POST /api/classes), and this is the door that has to read
  // it: a pupil placed at rung 2 was being recommended stage-3 work, which is
  // exactly the defect right-level placement exists to prevent. A learner in
  // several classes is served at the LOWEST rung set for them, because the
  // cautious reading is the one that cannot teach over a child's head, and no
  // placement at all leaves the decision exactly as it was.
  let rung: RungLevel | null = null;
  try {
    const classes = await listClasses();
    for (const cls of classes) {
      if (!cls.levels) continue;
      const handle = Object.entries(cls.membersById ?? {}).find(([, learnerId]) => learnerId === id)?.[0];
      const candidate = rungForHandle(cls.levels, handle);
      if (candidate !== null && (rung === null || candidate < rung)) rung = candidate;
    }
  } catch {
    // A class read that fails must not fail the learner's decision: the
    // recommendation degrades to the un-placed one, which is what it was.
    rung = null;
  }
  const actions: typeof recommendations = adjustActions(recommendations, rung);
  const adjusted = actions.filter((a, i) => a.conceptId !== recommendations[i]?.conceptId).length;

  return NextResponse.json({
    actions,
    rightLevel: { rung, adjusted },
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
