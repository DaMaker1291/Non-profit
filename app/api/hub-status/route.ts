import { NextResponse } from "next/server";
import { resolveDeployment } from "@/lib/deployment";
// THE COUNTS COME FROM THE STORE, NOT FROM THE FILESYSTEM.
//
// This route used to read the data directory itself:
//
//     countFile("profiles.json") → fs.readFile(path.join(DATA_DIR, …)) → catch → 0
//
// and that is F-1 of docs/STORAGE_SPEC.md §13. Three things were wrong with it,
// and only the third is visible:
//
//   1. It named the FILE LAYOUT — the one thing the storage port exists to keep
//      private — so it was a second answer to "where does learner data live", and
//      the first casualty was a database deployment, where there is no
//      `profiles.json` at all.
//   2. Its failure path was a COUNT OF ZERO, so a hub whose store could not be
//      read told a school `learners: 0`. That is not a degraded answer; it is a
//      false statement about the school, wearing the costume of an empty one, and
//      it arrived with HTTP 200.
//   3. The source-level guard did not catch it either: that guard forbids importing
//      `readJson`/`writeJson`, and this used `fs.readFile` — which is exactly the
//      lesson `npm run verify` now pins (a route may not NAME a store file).
//
// So: one call to the port, which a database answers with a COUNT(*), and a
// REFUSAL rather than a number when the store cannot be read.
import { activeStorage } from "@/lib/server/storage-file";

/** GET /api/hub-status — community hub at a glance. Counts only, no PII —
 *  and deliberately no filesystem paths: a hub's data directory layout is
 *  infrastructure detail the LAN doesn't need. */
export async function GET(): Promise<NextResponse> {
  let counts: { learners: number; rooms: number; classes: number };
  try {
    counts = await activeStorage().counts();
  } catch (e) {
    // A hub that cannot count is NOT a hub with no learners. 503 with a code (and
    // no numbers at all, rather than numbers that are wrong), which is what a
    // monitor and a teacher both need to see.
    return NextResponse.json(
      { hub: true, error: "store_unavailable", detail: (e as Error)?.message ?? "store read failed" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  // THE ENVIRONMENT THIS HUB IS ACTUALLY RUNNING AS. A school's constraints
  // are declared in the environment, which means the person who can see the
  // hub could not see the declaration without going to the machine — and
  // "which profile am I running?" is the first question a pilot asks. The
  // whole profile is reported for that reason (storage budget, device mode and
  // languages included), together with WHY a requested profile was not
  // honoured: an unreadable declaration is a configuration error, and this is
  // where it becomes visible instead of silently shaping what children learn.
  const { profile, problem, requested } = resolveDeployment(process.env);
  return NextResponse.json({
    hub: true,
    version: "1.0.0",
    now: Date.now(),
    learners: counts.learners,
    rooms: counts.rooms,
    classes: counts.classes,
    deployment: {
      id: profile.id,
      label: profile.label,
      connectivity: profile.connectivity,
      deviceMode: profile.deviceMode,
      maxDeviceStorageBytes: profile.maxDeviceStorageBytes,
      languages: profile.languages,
      teacherDevices: profile.teacherDevices,
      learnerDevices: profile.learnerDevices,
      syncFrequency: profile.syncFrequency,
      requested,
      problem,
    },
  });
}
