import { NextResponse } from "next/server";
import { accountFromRequest, accountOwningProfile, grantResetCode } from "@/lib/server/auth";
import { isMemberOf, isTeacherOf } from "@/lib/server/class-membership";
import { getProfile, listClasses } from "@/lib/server/store";
import { readBody, str } from "../_shared";

/**
 * POST /api/auth/reset-grant — a teacher issues a short-lived code for one learner.
 *
 * THE CASE THIS EXISTS FOR, in one sentence: a learner in front of a teacher, on a
 * shared phone, who cannot remember the password and has lost the printed code —
 * and whose email is a borrowed address nobody can open. Every other reset design
 * fails that learner: mail needs a mailbox, "contact support" needs a support desk,
 * and "ask an administrator" needs an administrator.
 *
 * But the teacher can already SEE the learner: they are on one of the teacher's own
 * rosters. So the authority is membership, not a role name — an account with the
 * role "teacher" who does not teach this learner gets nothing, and being the
 * learner's own teacher is exactly the relationship that justifies handing them a
 * key to the record.
 *
 * WHAT THE TEACHER RECEIVES: a code that works once, for fifteen minutes, and that
 * also names its own account (the lookup key) so the learner does not need to
 * remember which address they typed. What the teacher CANNOT do: see the learner's
 * password, choose a new one, or keep the grant alive past its expiry. They read six
 * words aloud and the learner takes it from there.
 *
 * THE AUTHORITY IS CHECKED SERVER-SIDE, against the roster, every time. A client
 * that calls this with a learner id it made up gets 403, and the 403 is the same
 * whether the learner does not exist or is simply not in this teacher's class —
 * otherwise the route tells a stranger which learner ids are real.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const account = await accountFromRequest(req);
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await readBody(req);
  const learnerId = str(body.learnerId).trim();
  if (!learnerId) return NextResponse.json({ error: "missing_learner" }, { status: 400 });

  const teacher = await getProfile(account.profileId);
  const learner = await getProfile(learnerId);
  if (!teacher || !learner) return NextResponse.json({ error: "not_your_learner" }, { status: 403 });

  const classes = await listClasses();
  const teaches = classes.some((cls) => isTeacherOf(cls, teacher) && isMemberOf(cls, learner));
  if (!teaches) return NextResponse.json({ error: "not_your_learner" }, { status: 403 });

  // A learner can have a profile and no account (the anonymous `/solve` path); a
  // reset grant only makes sense for one who has a password to reset.
  const owner = await accountOwningProfile(learnerId);
  if (!owner) return NextResponse.json({ error: "no_account" }, { status: 404 });

  const grant = await grantResetCode(owner.id);
  if (!grant) return NextResponse.json({ error: "no_account" }, { status: 404 });

  return NextResponse.json({
    code: grant.code,
    expiresAt: grant.expiresAt,
    // The handle, not the email: this is what the teacher recognises on their
    // roster, and the route has no business telling them an address the learner
    // never chose to share.
    learner: learner.profile.handle ?? learner.profile.id,
  });
}
