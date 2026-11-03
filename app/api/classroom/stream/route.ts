import { resolveClassroomAccess } from "@/lib/server/classroom-access";
import {
  activeClassroomSession,
  classroomSessionView,
  getClassroomSession,
  latestClassroomSession,
} from "@/lib/server/classroom";

export const dynamic = "force-dynamic";

/**
 * GET /api/classroom/stream?cls=… — the live room, as Server-Sent Events.
 *
 * The stream does not trust a version sent by a browser and does not push local
 * state: it rereads the persisted session, and emits only when its server-side
 * `version` has moved. A teacher advancing the activity is therefore visible on
 * every connected pupil device without a refresh, and a reconnect after a
 * dropped connection gets the current snapshot immediately.
 *
 * The same access rule as `/api/classroom` runs before the stream is opened. A
 * pupil who is not in the class gets a 403, not a silent empty room.
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const access = await resolveClassroomAccess(
    req,
    url.searchParams.get("cls"),
    url.searchParams.get("me"),
    url.searchParams.get("secret"),
  );
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const fixedSession = url.searchParams.get("session");
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  let lastVersion = -1;

  const stop = () => {
    closed = true;
    if (timer !== null) clearInterval(timer);
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          stop();
        }
      };
      const tick = async () => {
        if (closed) return;
        try {
          // An ENDED room is still the room's state. Falling back to "absent"
          // as soon as it ended made every pupil's screen jump back to "your
          // teacher has not started" at the moment the teacher ended it.
          const session = fixedSession
            ? await getClassroomSession(fixedSession)
            : await activeClassroomSession(access.cls.id) ?? await latestClassroomSession(access.cls.id);
          if (!session || session.clsId !== access.cls.id) {
            send("absent", { clsId: access.cls.id });
            return;
          }
          if (session.version === lastVersion) return;
          lastVersion = session.version;
          send("session", classroomSessionView(session, {
            canControl: access.canControl,
            learnerId: access.learner?.profile.id ?? null,
            handle: access.handle,
          }));
        } catch {
          // A transient store read must not tear down a classroom display; the
          // next tick retries. The browser's EventSource reconnects separately.
        }
      };
      void tick();
      timer = setInterval(() => { void tick(); }, 1200);
      req.signal.addEventListener("abort", () => {
        stop();
        try { controller.close(); } catch { /* already closed */ }
      }, { once: true });
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
