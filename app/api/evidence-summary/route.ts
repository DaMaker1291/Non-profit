import { NextResponse } from "next/server";
import { getProfile } from "@/lib/server/store";
import { readEvidence } from "@/lib/server/evidence";
import { isDeviceReported, orderEvents, projectLearner, type AnswerSubmitted } from "@/lib/evidence";

/**
 * /api/evidence-summary — the learner's own evidence, for their own pages.
 *
 * The ledger already answers "what has this learner demonstrated?" through its
 * projection; this route exposes exactly that slice to the UI. Three honesty
 * rules travel with it:
 *
 *   - unknown stays unknown: a concept with no independent (or transfer)
 *     answers returns `null` for that dimension, never 0;
 *   - provenance is disclosed: device-reported answers are flagged, so a page
 *     can say "recorded offline" instead of passing them off as verified;
 *   - it is the learner's OWN ledger: the capability secret is required, and
 *     the response carries no other learner's data because none is read.
 *
 * The full event stream stays at /api/evidence (the sync door). This route is
 * the display door — the projection and a bounded recent window, not the log.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") ?? "";
    const secret = url.searchParams.get("secret");
    const state = await getProfile(id);
    if (!state) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (typeof secret !== "string" || !secret || !state.secret || state.secret !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const events = readEvidence(id);
    const projection = projectLearner(events);
    const ordered = orderEvents(events);
    const answers = ordered.filter((e): e is AnswerSubmitted => e.type === "answer_submitted");

    const concepts = Object.entries(projection.byConcept).map(([conceptId, c]) => ({
      conceptId,
      attempts: c.attempts,
      correct: c.correct,
      lastAt: c.lastAt,
      // Null, never 0, when the dimension has never been attempted.
      measured: c.measured.asked > 0 ? { ...c.measured } : null,
      independent: c.independent.asked > 0 ? { ...c.independent } : null,
      transfer: c.transfer.asked > 0 ? { ...c.transfer } : null,
    }));

    return NextResponse.json({
      learnerId: id,
      totals: {
        events: projection.events,
        answers: projection.totals.answers,
        correct: projection.totals.correct,
        diagnostics: projection.totals.diagnostics,
        papers: projection.totals.papers,
        sessions: projection.totals.sessions,
        independent: projection.totals.independent.asked > 0 ? { ...projection.totals.independent } : null,
        transfer: projection.totals.transfer.asked > 0 ? { ...projection.totals.transfer } : null,
        // A device-authored event AND an answer the server graded only after it
        // arrived from an offline queue: one rule, lib/evidence#isDeviceReported.
        deviceReported: ordered.filter(isDeviceReported).length,
      },
      concepts,
      recent: answers.slice(-12).reverse().map((a) => ({
        id: a.id,
        at: a.at,
        conceptId: a.conceptId,
        subject: a.subject,
        source: a.source,
        mode: a.mode,
        correct: a.correct,
        score: a.score,
        hints: a.hints,
        offline: isDeviceReported(a),
        // The device's own claim about when it was answered, kept beside the
        // server's stamp so a reader can see both and trust the right one.
        claimedAt: a.deviceAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
