import { NextResponse } from "next/server";
import { getProfile, publicProfileState } from "@/lib/server/store";
import { readEvidence } from "@/lib/server/evidence";
import { accountFromRequest } from "@/lib/server/auth";
import type { ProfileState } from "@/lib/types";

/**
 * GET /api/my-data — THE LEARNER'S OWN EXPORT (§23).
 *
 * A separate door from /api/profile because the answer is a different question:
 * the profile GET answers "what does the app need to run", this one answers
 * "what does the deployment hold about me". It returns the profile, the full
 * model state (progress, diagnostics, sessions) and the evidence ledger itself,
 * event by event — the machine-readable half of the privacy promise. A learner
 * can see, and take with them, exactly what OpenMind stores.
 *
 * Three credentials are accepted, exactly as on the profile route: a signed-in
 * session that owns the profile, the profile's capability secret, or (for a
 * profile that never bound one) the first writer's secret. The id alone is a
 * 401 — data leaves only through the same gate it entered.
 */
async function authorise(req: Request): Promise<{ state: ProfileState; id: string } | { missing: true } | null> {
  const { searchParams } = new URL(req.url);
  const account = await accountFromRequest(req);
  const id = searchParams.get("id") ?? account?.profileId ?? null;
  if (!id) return null;
  const state = await getProfile(id);
  // A profile that does not resolve is a 404 (as on the evidence doors) —
  // distinct from a 401, which names the CAPABILITY, not the record.
  if (!state) return { missing: true };
  const secret = searchParams.get("secret") ?? "";
  const owns = Boolean(account && account.profileId === state.profile.id);
  const bounded = typeof state.secret === "string" && state.secret.length > 0;
  if (!owns && !(bounded && secret.length > 0 && secret === state.secret)) return null;
  return { state, id };
}

export async function GET(req: Request): Promise<NextResponse> {
  const auth = await authorise(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if ("missing" in auth) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { state, id } = auth;
  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    profile: publicProfileState(state),
    progress: state.progress,
    diagnostics: state.diagnostics ?? {},
    events: readEvidence(id),
  });
}
