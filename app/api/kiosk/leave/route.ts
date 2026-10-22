import { NextResponse } from "next/server";
import { deleteKioskSession } from "@/lib/server/store";

/**
 * POST /api/kiosk/leave — HAND-BACK.
 *
 * A classroom handset changes hands at the end of every lesson, and the one thing
 * a client cannot promise is that it will clear itself: a refresh, a killed tab, a
 * failed request and a browser that restores its last session all exist. The
 * server therefore ends the session ITSELF, and this door is that act.
 *
 * The token is the credential, so presenting it is proof enough to destroy it —
 * and destroying it is the safe direction: a session can be ended by whoever holds
 * it, but ending it grants nothing they did not already have. The reply is the
 * same for a token that existed and one that did not, so this door is not an
 * oracle for "is this session still live?".
 *
 * A TEACHER's revocation is a different act (POST /api/classes {action:"revoke"}),
 * which is why there is no `all` flag here: ending every session for a learner is
 * a class administration action, and this door is deliberately not one.
 */
export async function POST(req: Request): Promise<NextResponse> {
  let token = "";
  try {
    const body = (await req.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token : "";
  } catch {
    // No body is not an error: a client that cleared its storage before calling
    // still deserves the ok, and there is nothing to end.
  }
  if (token) await deleteKioskSession(token);
  return NextResponse.json({ ok: true });
}
