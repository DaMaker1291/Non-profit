import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = process.env.OPENMIND_DATA_DIR
  ? path.resolve(process.env.OPENMIND_DATA_DIR)
  : path.join(process.cwd(), ".openmind-data");

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
  return NextResponse.json({
    hub: true,
    version: "1.0.0",
    now: Date.now(),
    learners: profiles,
    rooms,
    classes,
  });
}
