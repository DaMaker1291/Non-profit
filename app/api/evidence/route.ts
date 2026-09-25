import { NextResponse } from "next/server";
import { getProfile, updateProfile } from "@/lib/server/store";
import { readEvidence } from "@/lib/server/evidence";
import { PROJECTION_VERSION, projectLearner, validateEvent, impactSnapshot, type EvidenceEvent } from "@/lib/evidence";
import { replayModel, reconcileDeep } from "@/lib/replay";
import { commitAndProject, unprojectableShare } from "@/lib/server/projection";

/**
 * /api/evidence — the ledger's read and sync door.
 *
 * GET  ?id=<profileId>&secret=<capability[&since=<ms>]>
 *      The learner's own timeline, plus the projection the ledger implies.
 *
 * POST { id, secret, events: [...] }
 *      Ingest a batch (the offline queue draining after reconnecting).
 *      Idempotent by event id, so a device that retries after a dropped
 *      response cannot double-count its work.
 *
 * What this route can and cannot establish, stated plainly because a ledger
 * that overstates itself is worse than no ledger:
 *
 *   - It CAN establish that a batch is about the authorised learner. The
 *     capability secret is checked against the profile, and an event naming
 *     anyone else is refused.
 *   - It CANNOT verify what a device says happened. Every event that arrives
 *     here is stamped `provenance: "device"` by the validator, regardless of
 *     what the body claims, so offline work is recorded as real and as
 *     unverified at the same time. Server-authored events (the live answer
 *     path) are the only ones the impact report treats as observed.
 */

/** Same capability model as the other learner routes: the profile's secret is
 *  presented and compared. Throws → 401 via the outer catch. */
function checkSecret(state: { secret?: string }, presented: unknown): void {
  if (typeof presented !== "string" || !presented) throw new Error("unauthorized");
  if (!state.secret || state.secret !== presented) throw new Error("unauthorized");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") ?? "";
    const secret = url.searchParams.get("secret");
    const sinceRaw = url.searchParams.get("since");
    const since = sinceRaw && Number.isFinite(Number(sinceRaw)) ? Number(sinceRaw) : null;

    const state = await getProfile(id);
    if (!state) return NextResponse.json({ error: "not_found" }, { status: 404 });
    checkSecret(state, secret);

    const all = readEvidence(id);
    const events = since === null ? all : all.filter((e) => e.at > since);
    const projection = projectLearner(all);
    // The deep reconciliation: rebuild the model from the ledger — from the
    // ledger PLUS the pre-ledger base, for a learner whose history predates it
    // — and compare it against the model the product actually holds, across
    // every derivable field. An empty list is the claim the whole architecture
    // rests on: the learner's history is sufficient to reconstruct their
    // current state. Reported on EVERY read, so divergence is never a special
    // request away, and a model that stops being a projection of its own
    // evidence says so out loud.
    const replayed = replayModel(all, id, state.projectionBase);
    const deep = reconcileDeep(replayed, state);
    // What the ledger cannot rebuild about this learner, named. Null when the
    // ledger is the whole history — the answer worth claiming, and the one the
    // whole design aims at.
    const unprojectable = unprojectableShare(state);

    return NextResponse.json({
      learnerId: id,
      // `cursor` is what a syncing device stores so it only asks for what is new.
      cursor: projection.lastAt,
      count: events.length,
      total: all.length,
      events,
      projection,
      deepReconcile: {
        compared: true,
        // Which ALGORITHM produced the model (lib/evidence.ts#PROJECTION_VERSION)
        // — a different question from the events' schemaVersion, and the tag
        // that makes "project the same history better, later" auditable.
        projectionVersion: PROJECTION_VERSION,
        differences: deep,
        unprojectable,
        note: unprojectable
          ? `${unprojectable.attempts} recorded answer(s) across ${unprojectable.concepts} concept(s) predate this learner's evidence ledger. They are held in the learner's pre-ledger snapshot and cannot be rebuilt from evidence.`
          : "the ledger alone reconstructs this learner model",
      },
      impact: impactSnapshot(all),
      // The client is told whose ledger this is and what a returned batch means.
      provenanceNote: "events returned here may be server-observed or device-reported; the `provenance` field says which",
    });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    const state = await getProfile(id);
    if (!state) return NextResponse.json({ error: "not_found" }, { status: 404 });
    checkSecret(state, body.secret);

    const raw = Array.isArray(body.events) ? (body.events as unknown[]) : null;
    if (!raw) return NextResponse.json({ error: "events_required" }, { status: 400 });
    // A cap keeps one request from becoming an unbounded write. A device that
    // has been offline for a long time syncs in pages and keeps its cursor.
    if (raw.length > 500) return NextResponse.json({ error: "too_many_events", max: 500 }, { status: 413 });

    const validated: EvidenceEvent[] = [];
    const refused: { reason: string }[] = [];
    const seenInBatch = new Set<string>();
    for (const item of raw) {
      const v = validateEvent(item, id);
      if (!v.ok) { refused.push({ reason: v.reason }); continue; }
      // Two copies inside one batch would otherwise both be written on the
      // first pass and neither on the second, which is not idempotent.
      if (seenInBatch.has(v.event.id)) { refused.push({ reason: "duplicate_in_batch" }); continue; }
      seenInBatch.add(v.event.id);
      validated.push(v.event);
    }

    // Ingest is a WRITE, and since the cutover every write is the same one:
    // the events are appended and confirmed, and the learner model is then
    // projected from the ledger (lib/server/projection.ts). A device that comes
    // back from a week offline does not merely fill a log — the work it did
    // moves the model, which is the whole point of recording it.
    //
    // It runs inside the profile lock so the append and the projection cannot
    // interleave with another request for the same learner — and so a batch of
    // duplicates is a no-op rather than a double count.
    const upd = await updateProfile(id, (state) => commitAndProject(id, state, validated));
    if (!upd) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const result = upd.result;
    return NextResponse.json({
      accepted: result.accepted.length,
      duplicates: result.duplicates.length,
      refused,
      ids: result.accepted,
    });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
