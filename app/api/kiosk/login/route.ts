import { NextResponse } from "next/server";
import {
  createKioskSession, deleteKioskSessionsFor, getProfile, kioskPinHash, listClasses, publicProfileState,
  updateClassById,
} from "@/lib/server/store";
import { storeWriteRefusal } from "@/lib/server/write-refusal";
import { getSessionTtlMs, hashEquals, kioskLimitKey, KIOSK_PIN_POLICY } from "@/lib/server/kiosk";
import { hit } from "@/lib/server/rate-limit";
import { tooManyAttempts } from "@/lib/server/limits";

/**
 * POST /api/kiosk/login — a learner exchanges the PIN their teacher issued for a
 * short-lived classroom session.
 *
 * ── WHY THIS DOOR EXISTS AT ALL ─────────────────────────────────────────────
 *
 * The shared-device audit measured what a classroom built on the household roster
 * costs: each remembered learner's PERMANENT capability sits in cleartext in
 * localStorage, so anyone holding the handset can read, export or erase every one
 * of them, and no revocation exists. A supervised classroom needs the opposite
 * properties, so the credential here is different in kind:
 *
 *   • the learner proves a PIN the teacher issued (6 digits, scrypt-hashed on the
 *     class — the server never stores it in the clear);
 *   • what comes back is a SESSION TOKEN, not the profile's capability. It is
 *     random, stored as a sha256 in `kiosk-sessions.json`, bounded by an expiry,
 *     and deleted by the server on hand-back — so a copy of it is worthless after
 *     the learner leaves, which clearing the phone alone could never achieve;
 *   • the session is marked `via: "kiosk"` where credentials are checked, and the
 *     doors that must refuse a classroom session ask that flag (erase, full
 *     export, class administration).
 *
 * ── THE BOUND ───────────────────────────────────────────────────────────────
 *
 * Six digits is ~20 bits. That is safe ONLY with a bound, so attempts are
 * rate-limited per (class, learner) — a HARD bound is right here where it is
 * wrong for sign-in: the attacker is somebody at that keyboard, and the owner of
 * the credential is not being locked out of a personal account, they are being
 * asked to wait. The failure counter also lives on the class, so a restart does
 * not reset it (a child will try exactly that).
 *
 * A refused attempt does not reveal WHICH part was wrong: unknown class, unknown
 * learner and wrong PIN all answer the same 401, because an unattended handset
 * must not become a directory of who is enrolled.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { joinCode?: unknown; classId?: unknown; handle?: unknown; pin?: unknown };
    const code = typeof body.joinCode === "string" ? body.joinCode.trim().toUpperCase() : "";
    const classId = typeof body.classId === "string" ? body.classId.trim() : "";
    const handle = typeof body.handle === "string" ? body.handle.trim().slice(0, 24) : "";
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";
    if ((!code && !classId) || !handle || !/^\d{4,8}$/.test(pin)) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const cls = (await listClasses()).find((c) => (classId ? c.id === classId : (c.joinCode ?? "").toUpperCase() === code));
    if (!cls) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // The member's id, from the SAME binding the roster uses (a handle is a
    // label chosen by the joiner, so the id is what names a learner).
    const learnerId = Object.prototype.hasOwnProperty.call(cls.membersById ?? {}, handle)
      ? cls.membersById?.[handle]
      : undefined;
    const credential = learnerId ? cls.kiosk?.[learnerId] : undefined;
    if (!learnerId || !credential) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // A LOCKED CREDENTIAL IS REFUSED BEFORE THE HASH IS COMPUTED, so a child
    // cannot keep the CPU busy guessing either.
    const verdict = hit(kioskLimitKey(cls.id, learnerId), KIOSK_PIN_POLICY);
    if (!verdict.allowed) return tooManyAttempts(verdict.retryAfterSec);
    if (credential.lockedUntil && credential.lockedUntil > Date.now()) {
      return tooManyAttempts(Math.ceil((credential.lockedUntil - Date.now()) / 1000));
    }

    if (!hashEquals(kioskPinHash(pin, credential.salt), credential.hash)) {
      // The failure is recorded on the CLASS so it survives a restart, and the
      // lockout is set when the budget is spent. `hit` above already counted it.
      await updateClassById(cls.id, (c) => {
        const row = c.kiosk?.[learnerId];
        if (!row) return { failed: true as const };
        row.failed = (row.failed ?? 0) + 1;
        if (row.failed >= KIOSK_PIN_POLICY.max) row.lockedUntil = Date.now() + KIOSK_PIN_POLICY.windowMs;
        return { failed: true as const };
      });
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const state = await getProfile(learnerId);
    if (!state) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // A NEW SESSION REPLACES THE OLD ONES FOR THIS LEARNER. Two live tokens for
    // one child is a token somebody forgot to end, and the hand-back property
    // ("the next learner cannot inherit this one") is easier to hold when the
    // count is one.
    await deleteKioskSessionsFor(learnerId);
    const session = await createKioskSession(learnerId, cls.id, getSessionTtlMs());

    // The success clears the failure count, in the same update that nothing else
    // needs — and it is best-effort: a store that refused this write must not
    // turn a correct PIN into a failed sign-in.
    await updateClassById(cls.id, (c) => {
      const row = c.kiosk?.[learnerId];
      if (row) {
        delete row.failed;
        delete row.lockedUntil;
      }
      return { ok: true as const };
    }).catch(() => null);

    return NextResponse.json({
      // The SAME shape the account session door returns, so the client adopts a
      // classroom identity with the code that already exists — but with no
      // `account`, and a token where the capability would be.
      profile: publicProfileState(state),
      secret: session.token,
      expiresAt: session.expiresAt,
      classId: cls.id,
      className: cls.name,
      handle,
    });
  } catch (e) {
    const refusal = storeWriteRefusal(e);
    if (refusal) return refusal;
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
