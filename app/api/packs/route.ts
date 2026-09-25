import { NextResponse } from "next/server";
import { listPacks, readAllPacks, savePack, getProfile } from "@/lib/server/store";
import { getConcept } from "@/lib/genome";
import type { StudyPack } from "@/lib/types";

const MAX_BODY = 2000;

interface CreateBody { id: string; conceptId: string; title: string; body: string; language?: string }
interface ForkBody { id: string; packId: string; language?: string; title?: string; body?: string }
interface HelpfulBody { id: string; packId: string }

type Payload =
  | (CreateBody & { action: "create" })
  | (ForkBody & { action: "fork" })
  | (HelpfulBody & { action: "helpful" });

async function handle(req: Request): Promise<NextResponse> {
  try {
    const payload = (await req.json()) as Payload;
    if (!payload?.id || !payload?.action) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    const profile = await getProfile(payload.id);
    if (!profile) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (payload.action === "create") {
      const { conceptId, title, body: text } = payload;
      if (!conceptId || !getConcept(conceptId)) {
        return NextResponse.json({ error: "unknown concept" }, { status: 400 });
      }
      if (typeof title !== "string" || !title.trim() || title.length > 120) {
        return NextResponse.json({ error: "title required (max 120)" }, { status: 400 });
      }
      if (typeof text !== "string" || !text.trim() || text.length > MAX_BODY) {
        return NextResponse.json({ error: `body required (max ${MAX_BODY})` }, { status: 400 });
      }
      const pack: StudyPack = {
        id: `pack_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        conceptId,
        language: typeof payload.language === "string" && payload.language ? payload.language : profile.profile.language,
        title: title.trim(),
        body: text.trim(),
        author: profile.profile.handle ?? "",
        createdAt: Date.now(),
        helpful: 0,
      };
      await savePack(pack);
      return NextResponse.json({ pack });
    }

    if (payload.action === "fork") {
      const parent = (await readAllPacks()).find((p) => p.id === payload.packId);
      if (!parent) return NextResponse.json({ error: "pack not found" }, { status: 404 });
      const fork: StudyPack = {
        ...parent,
        id: `pack_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        forkOf: parent.forkOf ?? parent.id,
        language: typeof payload.language === "string" && payload.language ? payload.language : parent.language,
        title: typeof payload.title === "string" && payload.title.trim() && payload.title.length <= 120 ? payload.title.trim() : parent.title,
        body: typeof payload.body === "string" && payload.body.trim() && payload.body.length <= MAX_BODY ? payload.body.trim() : parent.body,
        author: profile.profile.handle ?? "",
        createdAt: Date.now(),
        helpful: 0,
      };
      await savePack(fork);
      return NextResponse.json({ pack: fork });
    }

    if (payload.action === "helpful") {
      const pack = (await readAllPacks()).find((p) => p.id === payload.packId);
      if (!pack) return NextResponse.json({ error: "pack not found" }, { status: 404 });
      pack.helpful += 1;
      await savePack(pack);
      return NextResponse.json({ helpful: pack.helpful });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  return handle(req);
}

export async function GET(req: Request): Promise<NextResponse> {
  const conceptId = new URL(req.url).searchParams.get("conceptId") ?? "";
  if (!getConcept(conceptId)) {
    return NextResponse.json({ error: "unknown concept" }, { status: 400 });
  }
  return NextResponse.json({ packs: await listPacks(conceptId) });
}
