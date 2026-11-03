// ── LIVE CLASSROOM STATE ─────────────────────────────────────────────────────
//
// One persisted record per live class session. The record is deliberately the
// ROOM's state, not a second learner record: a submission is written to the
// learner's evidence ledger by the route, and only its room-level outcome is
// kept here so the teacher can see participation and the pupil can see that
// their answer arrived.
//
// Everything is file-backed through the same store port and lock as classes and
// interventions, so a server restart does not end a lesson. The SSE route reads
// this record and sends a new snapshot whenever `version` moves.
import { readClassroomSessionsJson, withLock, writeClassroomSessionsJson } from "./store";
import type {
  ClassroomSession,
  ClassroomSessionView,
  ClassroomSubmission,
  ClassroomSubmissionView,
} from "../types";

const FILE = "classroom-sessions.json";
const CAP = 200;
export const CLASSROOM_STORE_VERSION = 1;

interface Store {
  version: number;
  sessions: ClassroomSession[];
}

async function readStore(): Promise<Store> {
  const raw = await readClassroomSessionsJson<Store>({ version: CLASSROOM_STORE_VERSION, sessions: [] });
  return {
    version: CLASSROOM_STORE_VERSION,
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
  };
}

async function writeStore(store: Store): Promise<void> {
  await writeClassroomSessionsJson({
    version: CLASSROOM_STORE_VERSION,
    sessions: store.sessions
      .slice()
      .sort((a, b) => a.startedAt - b.startedAt)
      .slice(-CAP),
  });
}

export async function listClassroomSessions(): Promise<ClassroomSession[]> {
  return (await readStore()).sessions;
}

export async function getClassroomSession(id: string): Promise<ClassroomSession | null> {
  return (await listClassroomSessions()).find((s) => s.id === id) ?? null;
}

/** The class's current live or paused room. Ended rooms are history. */
export async function activeClassroomSession(clsId: string): Promise<ClassroomSession | null> {
  return (await listClassroomSessions())
    .filter((s) => s.clsId === clsId && (s.status === "live" || s.status === "paused"))
    .sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;
}

/** The latest room of ANY status. Used when a room ends: the pupils must see
 *  the ended room, not the same "no class" state as a class that never had one. */
export async function latestClassroomSession(clsId: string): Promise<ClassroomSession | null> {
  return (await listClassroomSessions())
    .filter((s) => s.clsId === clsId)
    .sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;
}

export async function saveClassroomSession(session: ClassroomSession): Promise<void> {
  await withLock(FILE, async () => {
    const store = await readStore();
    const i = store.sessions.findIndex((s) => s.id === session.id);
    if (i >= 0) store.sessions[i] = session;
    else store.sessions.push(session);
    await writeStore(store);
  });
}

/** Atomic read-modify-write. The mutator runs under the store lock, so two
 *  teacher controls or two pupil submissions cannot interleave their version
 *  changes. Returns null when the session does not exist. */
export async function withClassroomSession<T>(
  id: string,
  mutator: (session: ClassroomSession) => T | Promise<T>,
): Promise<T | null> {
  let out: T | null = null;
  let found = false;
  await withLock(FILE, async () => {
    const store = await readStore();
    const session = store.sessions.find((s) => s.id === id);
    if (!session) return;
    found = true;
    out = await mutator(session);
    session.updatedAt = Date.now();
    await writeStore(store);
  });
  return found ? out : null;
}

/** Create a room under the class lock's session counterpart, refusing a second
 *  live room for the same class. */
export async function createClassroomSession(
  make: (now: number) => ClassroomSession,
  clsId: string,
): Promise<{ ok: true; session: ClassroomSession } | { ok: false; active: ClassroomSession }> {
  let conflict: ClassroomSession | null = null;
  let created: ClassroomSession | null = null;
  await withLock(FILE, async () => {
    const store = await readStore();
    conflict = store.sessions.find(
      (s) => s.clsId === clsId && (s.status === "live" || s.status === "paused"),
    ) ?? null;
    if (conflict) return;
    created = make(Date.now());
    store.sessions.push(created);
    await writeStore(store);
  });
  if (conflict) return { ok: false, active: conflict };
  // The lock guarantees one of the two was assigned.
  return { ok: true, session: created as unknown as ClassroomSession };
}

/** The wire shape. A pupil never receives the answer key or another pupil's
 *  submission; the teacher receives both. */
export function classroomSessionView(
  session: ClassroomSession,
  opts: {
    canControl: boolean;
    learnerId: string | null;
    handle: string | null;
  },
): ClassroomSessionView {
  const activity = session.activity;
  const currentSubs = activity
    ? session.submissions.filter((s) => s.activityVersion === activity.version)
    : [];
  const byLearner = new Map(currentSubs.map((s) => [s.learnerId, s]));
  const mine = opts.learnerId ? byLearner.get(opts.learnerId) ?? null : null;
  const toView = (s: ClassroomSubmission): ClassroomSubmissionView => ({
    submissionId: s.submissionId,
    activityVersion: s.activityVersion,
    choiceIndex: s.choiceIndex,
    correct: s.correct,
    at: s.at,
  });
  const participants = opts.canControl
    ? session.participants.map((p) => {
      const sub = byLearner.get(p.learnerId);
      return {
        handle: p.handle,
        joinedAt: p.joinedAt,
        lastSeenAt: p.lastSeenAt,
        submitted: !!sub,
        correct: sub ? sub.correct : null,
      };
    })
    : session.participants
      .filter((p) => p.learnerId === opts.learnerId)
      .map((p) => ({
        handle: p.handle,
        joinedAt: p.joinedAt,
        lastSeenAt: p.lastSeenAt,
        submitted: !!mine,
        correct: mine ? mine.correct : null,
      }));

  return {
    id: session.id,
    clsId: session.clsId,
    className: session.className,
    status: session.status,
    version: session.version,
    activity: activity
      ? {
        version: activity.version,
        conceptId: activity.conceptId,
        conceptTitle: activity.conceptTitle,
        questionId: activity.question.id,
        prompt: activity.question.prompt,
        choices: activity.question.choices,
        figure: activity.question.figure,
        publishedAt: activity.publishedAt,
        submissionsOpen: activity.submissionsOpen,
      }
      : null,
    me: {
      learnerId: opts.learnerId,
      handle: opts.handle,
      joined: !!opts.learnerId && session.participants.some((p) => p.learnerId === opts.learnerId),
      submission: mine ? toView(mine) : null,
    },
    participants,
    counts: {
      participants: session.participants.length,
      submitted: currentSubs.length,
      correct: currentSubs.filter((s) => s.correct).length,
    },
    canControl: opts.canControl,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    endedAt: session.endedAt,
    ...(opts.canControl && activity
      ? {
        answerIndex: activity.question.answer,
        explanation: activity.question.explanation,
      }
      : {}),
  };
}
