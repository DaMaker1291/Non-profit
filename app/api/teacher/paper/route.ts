import { NextResponse } from "next/server";
import { teacherAnswerEvidence, type AnswerSubmitted } from "@/lib/evidence";
import { authoredLessonFor } from "@/lib/lessons/authored";
import { getClass } from "@/lib/server/store";
import { teacherOfClass } from "@/lib/server/authority";
import { storeWriteRefusal } from "@/lib/server/write-refusal";
import { withLearnerState } from "@/lib/server/transaction";
import { commitAndProjectIn } from "@/lib/server/projection";

/**
 * POST /api/teacher/paper — record marks from a printed worksheet.
 *
 * The server never pretends this was auto-marked. Every event carries:
 *   provenance: "teacher", assessmentVersion, rubric, teacher account/name,
 *   entry time, whether individual work was observed, evidence quality, and an
 *   optional group id.
 *
 * An UNOBSERVED (group) entry is written to the ledger but excluded from the
 * learner's individual projection. A teacher can see that the group answered;
 * the system does not turn it into one pupil's mastery.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const clsId = typeof body.clsId === "string" ? body.clsId : "";
    const learnerId = typeof body.learnerId === "string" ? body.learnerId : "";
    const conceptId = typeof body.conceptId === "string" ? body.conceptId : "";
    if (!clsId || !learnerId || !conceptId) return NextResponse.json({ error: "class_learner_and_lesson_required" }, { status: 400 });

    const cls = await getClass(clsId);
    if (!cls) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const teacher = await teacherOfClass(req, cls);
    if (!teacher.ok) return NextResponse.json({ error: teacher.error }, { status: teacher.status });

    // A teacher may only enter evidence for a learner on THIS class's roster.
    // Identity, through the same two stored shapes the membership helper reads.
    const member = (cls.members ?? []).includes(learnerId)
      || Object.values(cls.membersById ?? {}).includes(learnerId);
    if (!member) return NextResponse.json({ error: "not_a_member" }, { status: 403 });

    const lesson = authoredLessonFor(conceptId);
    if (!lesson) return NextResponse.json({ error: "no_authored_lesson" }, { status: 404 });
    if (lesson.subject !== cls.subject && cls.subject) {
      return NextResponse.json({ error: "lesson_not_in_class_subject" }, { status: 400 });
    }

    const assessmentVersion = typeof body.assessmentVersion === "string" ? body.assessmentVersion.trim().slice(0, 40) : "";
    if (!assessmentVersion) return NextResponse.json({ error: "assessment_version_required" }, { status: 400 });
    // The printed sheet names its version. A mark entered against a different
    // version would point at questions the teacher did not mark.
    if (assessmentVersion !== lesson.version) {
      return NextResponse.json({ error: "assessment_version_mismatch", expected: lesson.version }, { status: 409 });
    }

    const rubric = typeof body.rubric === "string" ? body.rubric.trim().slice(0, 2000) : "";
    if (!rubric) return NextResponse.json({ error: "rubric_required" }, { status: 400 });

    const observed = body.observed === true;
    const evidenceQuality = body.evidenceQuality;
    if (evidenceQuality !== "high" && evidenceQuality !== "medium" && evidenceQuality !== "low") {
      return NextResponse.json({ error: "evidence_quality_required" }, { status: 400 });
    }
    const groupId = typeof body.groupId === "string" && body.groupId.trim() ? body.groupId.trim().slice(0, 60) : null;
    if (!observed && !groupId) return NextResponse.json({ error: "group_id_required_for_unobserved" }, { status: 400 });

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) return NextResponse.json({ error: "marks_required" }, { status: 400 });
    if (rawItems.length > 100) return NextResponse.json({ error: "too_many_marks", max: 100 }, { status: 413 });

    const taught = new Set([
      ...lesson.assessment.map((a) => a.id),
      ...lesson.transfer.map((t) => t.id),
      ...lesson.priorKnowledge.check.map((q) => q.id),
    ]);
    const now = Date.now();
    const teacherName = teacher.profile.profile.handle?.trim() || teacher.account.email || "teacher";

    const events: AnswerSubmitted[] = [];
    for (const raw of rawItems) {
      const item = raw as Record<string, unknown>;
      const questionId = typeof item.questionId === "string" ? item.questionId : "";
      const awarded = item.awarded;
      const max = item.max;
      if (!taught.has(questionId)) return NextResponse.json({ error: "question_not_in_lesson", questionId }, { status: 400 });
      if (typeof awarded !== "number" || !Number.isFinite(awarded) || awarded < 0) {
        return NextResponse.json({ error: "bad_award", questionId }, { status: 400 });
      }
      if (typeof max !== "number" || !Number.isFinite(max) || max <= 0 || max > 100 || awarded > max) {
        return NextResponse.json({ error: "bad_max", questionId }, { status: 400 });
      }
      events.push(teacherAnswerEvidence({
        learnerId,
        at: now,
        subject: lesson.subject,
        conceptId: lesson.conceptId,
        specificationId: cls.specificationId ?? null,
        questionId,
        awarded,
        max,
        tags: Array.isArray(item.tags) ? item.tags.filter((t): t is string => typeof t === "string").slice(0, 8) : [],
        assessmentVersion,
        rubric,
        teacherAccountId: teacher.account.id,
        teacherName,
        observed,
        evidenceQuality,
        groupId,
      }));
    }

    const upd = await withLearnerState(learnerId, (ctx, state) => commitAndProjectIn(ctx, state, events));
    if (!upd) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({
      accepted: upd.result.accepted.length,
      duplicates: upd.result.duplicates.length,
      provenance: "teacher",
      observed,
      countsTowardsMastery: observed,
      note: observed
        ? "Recorded as teacher-entered individual evidence."
        : "Recorded as teacher-entered group evidence. It is visible in the ledger but excluded from individual mastery.",
    });
  } catch (err) {
    const refusal = storeWriteRefusal(err);
    if (refusal) return refusal;
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
