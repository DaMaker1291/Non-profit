import { NextResponse } from "next/server";
import { updateProfile } from "@/lib/server/store";
import { authorisedProfile } from "@/lib/server/auth";
import { getConcept } from "@/lib/genome";
import { hasGenerator } from "@/lib/questions";
import { isNextKind, type NextKind } from "@/lib/next-engine";
import { readEvidence } from "@/lib/server/evidence";
import {
  SESSION_TARGET,
  computeResult,
  isComplete,
  openSession,
  toSummary,
  type SessionLedger,
} from "@/lib/session";
import type { ProfileState } from "@/lib/types";

// ── The closed learning loop, server side ───────────────────────────────────
// POST /api/session { action: "start"  } — capture the baseline and open a session
// POST /api/session { action: "finish" } — recompute the plan and report the diff
// GET  /api/session?id=…&secret=…       — what is open, and what changed last time
//
// The baseline lives on the profile as transient server-only state
// (`learnSession`), stripped by publicProfileState before the profile crosses
// the wire: a client that could read or edit its own baseline could fake
// adaptation, and this whole endpoint exists to make adaptation provable.

type Session = ProfileState & { learnSession?: SessionLedger };

function asKind(v: unknown): NextKind | null {
  return isNextKind(v) ? v : null;
}

/** What the client may see about an open session. The baseline *metrics* are
 *  shown (they are derived from the learner's own evidence); the ledger itself
 *  is not, because the result screen's honesty depends on it being frozen. */
function publicSession(ledger: SessionLedger) {
  return {
    conceptId: ledger.conceptId,
    kind: ledger.kind,
    target: ledger.target,
    startedAt: ledger.startedAt,
    asked: ledger.activity.asked,
    correct: ledger.activity.correct,
    independentCorrect: ledger.activity.independentCorrect,
    complete: isComplete(ledger),
    before: ledger.baseline.metrics,
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const profile = await authorisedProfile(req, searchParams.get("id"), searchParams.get("secret"));
  if (!profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ledger = (profile as Session).learnSession;
  return NextResponse.json({
    session: ledger && isValid(ledger) ? publicSession(ledger) : null,
    lastSession: profile.lastSession ?? null,
  });
}

/** An open session with no activity and an unknown concept is stale state, not
 *  a session — never let it produce a fake "before" column. */
function isValid(ledger: SessionLedger): boolean {
  return Boolean(ledger?.conceptId && getConcept(ledger.conceptId) && hasGenerator(ledger.conceptId));
}

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = typeof body.action === "string" ? body.action : "";
  const profile = await authorisedProfile(
    req,
    typeof body.id === "string" ? body.id : null,
    typeof body.secret === "string" ? body.secret : null,
  );
  if (!profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (action === "start") {
    const conceptId = typeof body.conceptId === "string" ? body.conceptId : "";
    if (!conceptId || !getConcept(conceptId) || !hasGenerator(conceptId)) {
      // Honest refusal: a concept with no generator cannot be practised, and a
      // session that cannot ask anything must not open at all.
      return NextResponse.json({ error: "no practice for concept" }, { status: 404 });
    }
    const kind = asKind(body.kind) ?? "PRACTISE";
    const rawTarget = typeof body.target === "number" ? Math.round(body.target) : SESSION_TARGET;
    const target = Math.max(3, Math.min(10, rawTarget));
    const upd = await updateProfile(profile.profile.id, (state) => {
      const sess = state as Session;
      // The baseline's "step" is the SAME decision Home will make for this
      // learner, so the ledger is read here rather than the decision being
      // taken from the model alone — otherwise a session could record a plan
      // the learner was never shown, and "the plan moved" would be unfalsifiable.
      const events = readEvidence(profile.profile.id);
      const { ledger, resumed } = openSession(state, conceptId, kind, sess.learnSession, target, Date.now(), undefined, events);
      sess.learnSession = ledger;
      return { ...publicSession(ledger), resumed };
    });
    if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ session: upd.result, lifecycle: "active" });
  }

  if (action === "finish") {
    const conceptId = typeof body.conceptId === "string" ? body.conceptId : "";
    const upd = await updateProfile(profile.profile.id, (state) => {
      const sess = state as Session;
      const ledger = sess.learnSession;
      // No baseline → no honest diff. Refuse rather than manufacture one.
      if (!ledger || (conceptId && ledger.conceptId !== conceptId)) return { error: "no_session" as const };
      // Same door, same ledger as the baseline: the closing decision is
      // comparable with the opening one because both came from the evidence.
      const result = computeResult(state, ledger, Date.now(), undefined, readEvidence(profile.profile.id));
      state.lastSession = toSummary(result);
      delete sess.learnSession;
      return { result };
    });
    if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
    const r = upd.result as { error?: string };
    if (r.error) return NextResponse.json({ error: r.error }, { status: 409 });
    return NextResponse.json({ ...(upd.result as object), lifecycle: "completed" });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
