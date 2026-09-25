import { NextResponse } from "next/server";
import { getRoom, listRooms, newId, saveRoom, updateRoomById } from "@/lib/server/store";
import { roomTutorTurn } from "@/lib/server/room-tutor";
import type { StudyRoom } from "@/lib/types";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ rooms: await listRooms() });
}

interface Body {
  action: "create" | "join" | "message" | "fork";
  id?: string;
  name?: string;
  subject?: StudyRoom["subject"];
  conceptIds?: string[];
  language?: string;
  handle?: string;
  text?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Body;
    const handle = (body.handle ?? "student").slice(0, 24);

    switch (body.action) {
      case "create": {
        const room: StudyRoom = {
          id: newId("room"),
          name: (body.name ?? "Untitled room").slice(0, 60),
          subject: body.subject ?? "maths",
          conceptIds: (body.conceptIds ?? []).slice(0, 8),
          language: body.language ?? "en",
          createdBy: handle,
          createdAt: Date.now(),
          members: [handle],
          messages: [],
          nextMsgId: 1,
        };
        await saveRoom(room);
        return NextResponse.json({ room });
      }
      case "join": {
        if (!body.id) return NextResponse.json({ error: "bad request" }, { status: 400 });
        const upd = await updateRoomById(body.id, (room) => {
          if (!room.members.includes(handle)) room.members.push(handle);
          return { joined: handle };
        });
        if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json({ room: upd.room });
      }
      case "message": {
        if (!body.id) return NextResponse.json({ error: "bad request" }, { status: 400 });
        // ── THE TURN HAPPENS OUTSIDE THE ROOM LOCK ────────────────────────
        // A tutor turn may call a model (bounded by its own timeout), and the
        // room lock must not be held across a network call: members are writing
        // to the same room. So: read the room, take the turn, then append the
        // message and the reply together under the lock, atomically.
        const current = await getRoom(body.id);
        if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });
        const text = (body.text ?? "").slice(0, 500);
        const turn = await roomTutorTurn({ room: current, message: text });
        const upd = await updateRoomById(body.id, (room) => {
          if (!room.members.includes(handle)) room.members.push(handle);
          room.messages.push({
            id: `${room.nextMsgId++}`,
            author: handle,
            text,
            at: Date.now(),
            // The room's tutor replies in the room's declared language, through
            // the same door every other tutor surface uses — and the reply
            // carries WHO answered with it (lib/server/room-tutor.ts).
            tutorReply: turn.reply,
            tutorSource: turn.answerSource,
            tutorLabelKey: turn.labelKey,
            tutorUnavailable: turn.aiUnavailable,
            tutorFocus: turn.focus,
          });
          if (room.messages.length > 200) room.messages.splice(0, room.messages.length - 200);
          return { ok: true };
        });
        if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
        return NextResponse.json({ room: upd.room });
      }
      case "fork": {
        const src = body.id ? await getRoom(body.id) : null;
        if (!src) return NextResponse.json({ error: "not found" }, { status: 404 });
        const copy: StudyRoom = {
          ...src,
          id: newId("room"),
          name: `${src.name} (fork)`,
          createdBy: handle,
          createdAt: Date.now(),
          members: [handle],
          messages: [],
          nextMsgId: 1,
          forkOf: src.id,
        };
        await saveRoom(copy);
        return NextResponse.json({ room: copy });
      }
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
