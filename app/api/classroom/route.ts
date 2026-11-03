import { NextResponse } from "next/server";
import { answerEvidence, submissionEventId } from "@/lib/evidence";
import { hasEvidence } from "@/lib/server/evidence";
import { gradeChoice } from "@/lib/answer";
import { generateQuestion } from "@/lib/questions";
import { getConcept } from "@/lib/genome";
import { storeWriteRefusal } from "@/lib/server/write-refusal";
import { withLearnerState } from "@/lib/server/transaction";
import { commitAndProjectIn } from "@/lib/server/projection";
import { resolveClassroomAccess } from "@/lib/server/classroom-access";
import { assignableConcepts } from "@/lib/server/assignment-view";
import {
  activeClassroomSession,
  classroomSessionView,
  createClassroomSession,
  getClassroomSession,
  latestClassroomSession,
  withClassroomSession,
} from "@/lib/server/classroom";
import { getClass, newId } from "@/lib/server/store";
import type {
  ClassroomParticipant,
  ClassroomSession,
  ClassroomSubmission,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface Body {
  action?: "start" | "join" | "publish" | "pause" | "resume" | "end" | "submit" | "heartbeat";
  clsId?: string;
  sessionId?: string;
  id?: string;
  secret?: string;
  conceptId?: string;
  questionId?: string;
  choiceIndex?: number;
  submissionId?: string;
}

const json = NextResponse.json;


function view(session: ClassroomSession, access: Awaited<ReturnType<typeof resolveClassroomAccess>>) {
  if (!access.ok) throw new Error("unreachable");
  return classroomSessionView(session, {
    canControl: access.canControl,
    learnerId: access.learner?.profile.id ?? null,
    handle: access.handle,
  });
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const access = await resolveClassroomAccess(
      req,
      url.searchParams.get("cls"),
      url.searchParams.get("me"),
      url.searchParams.get("secret"),
    );
    if (!access.ok) return json({ error: access.error }, { status: access.status });

    const sessionId = url.searchParams.get("session");
    const session = sessionId
      ? await getClassroomSession(sessionId)
      : await activeClassroomSession(access.cls.id) ?? await latestClassroomSession(access.cls.id);
    if (session && session.clsId !== access.cls.id) {
      return json({ error: "not found" }, { status: 404 });
    }

    const availableConcepts = access.canControl && access.cls.subject
      ? assignableConcepts(access.cls.subject, access.cls.specificationId ?? null).map((id) => ({
        id,
        title: getConcept(id)?.title ?? id,
      }))
      : [];

    return json({
      session: session ? view(session, access) : null,
      availableConcepts,
      // A class whose course has nothing past the review gate is told why the
      // picker is empty instead of being offered a lesson the door would refuse.
      reviewGate: access.canControl && availableConcepts.length === 0
        ? "No lesson in this class's course has completed educator review, so no live activity can be published."
        : null,
    });
  } catch (e) {
    const refusal = storeWriteRefusal(e);
    if (refusal) return refusal;
    return json({ error: "bad request" }, { status: 400 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Body;
    const access = await resolveClassroomAccess(req, body.clsId ?? null, body.id ?? null, body.secret ?? null);
    if (!access.ok) return json({ error: access.error }, { status: access.status });

    if (body.action === "start") {
      if (!access.canControl) return json({ error: "not_session_owner" }, { status: 403 });
      const created = await createClassroomSession((now) => ({
        id: newId("clsess"),
        clsId: access.cls.id,
        className: access.cls.name,
        teacherAccountId: access.accountId ?? "",
        teacherId: access.learner?.profile.id ?? access.cls.ownerId ?? "",
        status: "live",
        version: 1,
        activity: null,
        participants: [],
        submissions: [],
        startedAt: now,
        updatedAt: now,
      }), access.cls.id);
      if (!created.ok) {
        return json({ error: "session_already_live", session: view(created.active, access) }, { status: 409 });
      }
      return json({ session: view(created.session, access) });
    }

    if (body.action === "join") {
      if (!access.learner) return json({ error: "learner_required" }, { status: 401 });
      const learner = access.learner;
      const now = Date.now();
      const updated = await withClassroomSession(body.sessionId ?? "", (session) => {
        if (session.clsId !== access.cls.id) return { error: "not found" as const, status: 404 as const };
        if (session.status === "ended") return { error: "session_ended" as const, status: 409 as const };
        let p = session.participants.find((x) => x.learnerId === learner.profile.id);
        if (!p) {
          p = {
            learnerId: learner.profile.id,
            handle: access.handle ?? learner.profile.handle ?? "student",
            joinedAt: now,
            lastSeenAt: now,
          } satisfies ClassroomParticipant;
          session.participants.push(p);
          session.version += 1;
        } else {
          p.lastSeenAt = now;
        }
        return { session };
      });
      if (!updated) return json({ error: "not found" }, { status: 404 });
      if ("error" in updated) return json({ error: updated.error }, { status: updated.status });
      return json({ session: view(updated.session, access) });
    }

    if (body.action === "heartbeat") {
      if (!access.learner) return json({ error: "learner_required" }, { status: 401 });
      const updated = await withClassroomSession(body.sessionId ?? "", (session) => {
        const p = session.participants.find((x) => x.learnerId === access.learner?.profile.id);
        if (p) p.lastSeenAt = Date.now();
        return { session };
      });
      if (!updated) return json({ error: "not found" }, { status: 404 });
      return json({ session: view(updated.session, access) });
    }

    // ── SUBMISSION IS A PUPIL ACTION ──────────────────────────────────────
    // It must be handled BEFORE the teacher-control guard below. The guard is
    // about starting, publishing, pausing and ending; a pupil's answer is the
    // one thing the room exists for.
    if (body.action === "submit") {
      if (!access.learner) return json({ error: "learner_required" }, { status: 401 });
      if (access.canControl) return json({ error: "teacher_does_not_submit" }, { status: 403 });
      if (!body.sessionId || !body.questionId || typeof body.choiceIndex !== "number" || !body.submissionId) {
        return json({ error: "bad request" }, { status: 400 });
      }
      const learner = access.learner;
      const session = await getClassroomSession(body.sessionId);
      if (!session || session.clsId !== access.cls.id) return json({ error: "not found" }, { status: 404 });
      if (session.status === "ended") return json({ error: "session_ended" }, { status: 409 });
      if (session.status === "paused" || !session.activity?.submissionsOpen) {
        return json({ error: "submissions_paused" }, { status: 409 });
      }
      if (session.activity.question.id !== body.questionId) {
        return json({ error: "activity_changed" }, { status: 409 });
      }
      if (body.choiceIndex < 0 || body.choiceIndex >= session.activity.question.choices.length) {
        return json({ error: "choice out of range" }, { status: 400 });
      }
      const priorRoom = session.submissions.find(
        (s) => s.learnerId === learner.profile.id && s.activityVersion === session.activity?.version,
      );
      if (priorRoom) {
        return priorRoom.submissionId === body.submissionId
          ? json({ duplicate: true, session: view(session, access) })
          : json({ error: "already_submitted", session: view(session, access) }, { status: 409 });
      }

      const correct = gradeChoice(session.activity.question, body.choiceIndex);
      const eventId = submissionEventId(body.submissionId);
      const already = !!eventId && await hasEvidence(learner.profile.id, eventId);
      if (!already) {
        const at = Date.now();
        const recorded = await withLearnerState(learner.profile.id, async (ctx, state) => {
          const event = answerEvidence({
            learnerId: learner.profile.id,
            at,
            id: eventId ?? undefined,
            source: "practice",
            subject: getConcept(session.activity!.conceptId)?.subject ?? null,
            conceptId: session.activity!.conceptId,
            specificationId: state.profile.spec ?? null,
            questionId: session.activity!.question.id,
            correct,
            chosen: body.choiceIndex as number,
            mode: "independent",
            hints: 0,
            tags: session.activity!.question.misconceptionTags ?? [],
          });
          await commitAndProjectIn(ctx, state, [event]);
          return true;
        });
        if (!recorded) return json({ error: "not found" }, { status: 404 });
      }

      const submission: ClassroomSubmission = {
        learnerId: learner.profile.id,
        handle: access.handle ?? learner.profile.handle ?? "student",
        activityVersion: session.activity.version,
        questionId: session.activity.question.id,
        submissionId: body.submissionId,
        choiceIndex: body.choiceIndex,
        correct,
        at: Date.now(),
      };
      const updated = await withClassroomSession(session.id, (live) => {
        if (live.status !== "live" || !live.activity?.submissionsOpen || live.activity.version !== submission.activityVersion) {
          return { error: "activity_closed" as const, status: 409 as const };
        }
        const existing = live.submissions.find(
          (s) => s.learnerId === submission.learnerId && s.activityVersion === submission.activityVersion,
        );
        if (existing) {
          return existing.submissionId === submission.submissionId
            ? { session: live, duplicate: true }
            : { error: "already_submitted" as const, status: 409 as const };
        }
        live.submissions.push(submission);
        live.version += 1;
        return { session: live, duplicate: false };
      });
      if (!updated) return json({ error: "not found" }, { status: 404 });
      if ("error" in updated) return json({ error: updated.error }, { status: updated.status });
      return json({ duplicate: updated.duplicate, correct, session: view(updated.session, access) });
    }

    // Every remaining action is teacher control.
    if (!access.canControl) return json({ error: "not_session_owner" }, { status: 403 });
    const sessionId = body.sessionId ?? "";
    if (!sessionId) return json({ error: "missing session" }, { status: 400 });

    if (body.action === "publish") {
      if (!access.cls.subject) return json({ error: "class has no course" }, { status: 400 });
      const allowed = assignableConcepts(access.cls.subject, access.cls.specificationId ?? null);
      if (!body.conceptId || !allowed.includes(body.conceptId)) {
        return json({ error: "not yet approved for a live class" }, { status: 400 });
      }
      const concept = getConcept(body.conceptId);
      if (!concept) return json({ error: "unknown concept" }, { status: 400 });
      const updated = await withClassroomSession(sessionId, (session) => {
        if (session.clsId !== access.cls.id) return { error: "not found" as const, status: 404 as const };
        if (session.status === "ended") return { error: "session_ended" as const, status: 409 as const };
        const next = session.version + 1;
        const q = generateQuestion(body.conceptId as string, `${session.id}:${next}`);
        if (!q) return { error: "no question" as const, status: 400 as const };
        session.activity = {
          version: next,
          conceptId: body.conceptId as string,
          conceptTitle: concept.title,
          question: q,
          publishedAt: Date.now(),
          submissionsOpen: session.status === "live",
        };
        session.version = next;
        return { session };
      });
      if (!updated) return json({ error: "not found" }, { status: 404 });
      if ("error" in updated) return json({ error: updated.error }, { status: updated.status });
      return json({ session: view(updated.session, access) });
    }

    if (body.action === "pause" || body.action === "resume" || body.action === "end") {
      const updated = await withClassroomSession(sessionId, (session) => {
        if (session.clsId !== access.cls.id) return { error: "not found" as const, status: 404 as const };
        if (session.status === "ended") return { error: "session_ended" as const, status: 409 as const };
        if (body.action === "end") {
          session.status = "ended";
          session.endedAt = Date.now();
          if (session.activity) session.activity.submissionsOpen = false;
        } else {
          session.status = body.action === "pause" ? "paused" : "live";
          if (session.activity) session.activity.submissionsOpen = session.status === "live";
        }
        session.version += 1;
        return { session };
      });
      if (!updated) return json({ error: "not found" }, { status: 404 });
      if ("error" in updated) return json({ error: updated.error }, { status: updated.status });
      return json({ session: view(updated.session, access) });
    }

    return json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    const refusal = storeWriteRefusal(e);
    if (refusal) return refusal;
    return json({ error: "bad request" }, { status: 400 });
  }
}
