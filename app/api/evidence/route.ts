import { NextResponse } from "next/server";
import { getProfile } from "@/lib/server/store";
// The learner transaction. A route reaches it through this door rather than the
// store's own function, so the configured backend decides where the record and
// its evidence live (lib/server/transaction.ts).
import { withLearnerState } from "@/lib/server/transaction";
import { readEvidence } from "@/lib/server/evidence";
import { PROJECTION_VERSION, projectLearner, validateEvent, impactSnapshot, type EvidenceEvent } from "@/lib/evidence";
import { replayModel, reconcileDeep } from "@/lib/replay";
import { commitAndProjectIn, unprojectableShare } from "@/lib/server/projection";
// A store that cannot keep this write answers 503 with its reason — never a 500.
import { storeWriteRefusal } from "@/lib/server/write-refusal";
import { learnerLimitKey, pace } from "@/lib/server/limits";
import { SYNC_PER_LEARNER } from "@/lib/server/rate-limit";
import { checkPresentedSecret, classroomSessionFor } from "@/lib/server/capability";

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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") ?? "";
    const secret = url.searchParams.get("secret");
    const sinceRaw = url.searchParams.get("since");
    const since = sinceRaw && Number.isFinite(Number(sinceRaw)) ? Number(sinceRaw) : null;

    const state = await getProfile(id);
    if (!state) return NextResponse.json({ error: "not_found" }, { status: 404 });
    // Two credentials are valid (lib/server/capability.ts#checkPresentedSecret);
    // `bind: false` keeps THIS door's older, stricter rule that a profile with no
    // secret is refused rather than adopting the first token it is shown.
    checkPresentedSecret(state, secret, await classroomSessionFor(id, secret), { bind: false });

    const all = await readEvidence(id);
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
    checkPresentedSecret(state, body.secret, await classroomSessionFor(id, body.secret), { bind: false });

    // A drained offline queue is a legitimate burst, and a device that has been
    // dark for a week still arrives in pages (500 events each). What this bounds
    // is a client that ignores the paging and posts without end — keyed on the
    // learner whose secret was just checked, so it cannot spend another's.
    const syncGate = await pace(learnerLimitKey("sync", id), SYNC_PER_LEARNER);
    if (syncGate) return syncGate;

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
    // It runs inside the learner TRANSACTION, and the append travels on that
    // transaction's own connection (`commitAndProjectIn`): a batch of duplicates
    // is a no-op rather than a double count, and a database deployment does not
    // open a second connection for a ledger write it already holds the lock for
    // (docs/STORAGE_SPEC.md §14.1).
    const upd = await withLearnerState(id, (ctx, state) => commitAndProjectIn(ctx, state, validated));
    if (!upd) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const result = upd.result;
    return NextResponse.json({
      accepted: result.accepted.length,
      duplicates: result.duplicates.length,
      refused,
      ids: result.accepted,
    });
  } catch (err) {
    // The refusal is checked BEFORE the 401: a deployment whose store cannot
    // hold evidence must say so rather than telling a syncing device that its
    // capability is wrong, which would send it looking for a new secret.
    const refusal = storeWriteRefusal(err);
    if (refusal) return refusal;
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}
