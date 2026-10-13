import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { resolveDeployment } from "@/lib/deployment";
// The store owns where the data is. This route resolved OPENMIND_DATA_DIR for
// itself, which made a third answer to "where is the store" — see the
// one-data-directory assertion in scripts/verify-engines.mjs.
import { DATA_DIR } from "@/lib/server/store";

async function countFile(file: string): Promise<number> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
    const j = JSON.parse(raw);
    if (Array.isArray(j)) return j.length;
    return Object.keys(j).length;
  } catch {
    return 0;
  }
}

/** GET /api/hub-status — community hub at a glance. Counts only, no PII —
 *  and deliberately no filesystem paths: a hub's data directory layout is
 *  infrastructure detail the LAN doesn't need. */
export async function GET(): Promise<NextResponse> {
  const [profiles, rooms, classes] = await Promise.all([
    countFile("profiles.json"), countFile("rooms.json"), countFile("classes.json"),
  ]);
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
    learners: profiles,
    rooms,
    classes,
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
