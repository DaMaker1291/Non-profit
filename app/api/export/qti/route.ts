import { NextResponse } from "next/server";
import { getConcept } from "@/lib/genome";
import { conceptDepth, generateQuestionNear } from "@/lib/questions";
import { qtiPackage } from "@/lib/export/qti";
import { pace, ingressLimitKey } from "@/lib/server/limits";
import type { LimitPolicy } from "@/lib/server/rate-limit";
import type { Question } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 40;

// ── THIS DOOR COSTS CPU, SO IT NAMES ITS BOUND ──────────────────────────────
//
// One request draws up to `MAX_LIMIT × 4 × 12` generated items. That is real work
// on a public endpoint with no account to charge it to, which is exactly the
// shape the project's "every door that costs money or CPU names its bound" rule
// exists for. Two bounds, and the split is the same one sign-in uses:
//
//   · the SOURCE ADDRESS is HARD, and only exists when the deployment declares a
//     trusted proxy (a client-set header is not a limit — lib/server/client-address);
//   · the PROCESS is SOFT and keyed on nothing the caller chooses, so a direct
//     deployment (which has no trustworthy address at all) is still bounded and a
//     distributed caller cannot exhaust the generator.
const EXPORT_PER_ADDRESS: LimitPolicy = { max: 30, windowMs: 10 * 60_000, mode: "hard" };
const EXPORT_PER_PROCESS: LimitPolicy = { max: 60, windowMs: 60_000, mode: "soft" };
const EXPORT_PROCESS_KEY = "export:process:all";

/**
 * PUT DISTINCT ITEMS IN THE PACKAGE, DETERMINISTICALLY.
 *
 * `generateQuestionNear` searches a fixed number of draws for the one nearest the
 * target, so calling it once per index returns the SAME item many times — a
 * package of twelve identical questions is worse than a package of one, because
 * an importer cannot tell it from a content bug. The dedupe is on the prompt text
 * because that is what a learner (and an importer's preview) actually sees; two
 * items with different ids but identical prompts are the same question.
 *
 * The target is the concept's own measured ceiling (`conceptDepth`) rather than a
 * course tier: this route has no learner and no profile, so the honest answer is
 * "the deepest this concept can go", and the receiving teacher decides placement.
 */
function drawItems(conceptId: string, limit: number): Question[] {
  const target = conceptDepth(conceptId);
  const out: Question[] = [];
  const seen = new Set<string>();
  // Four candidate draws per requested item: the bank has concepts whose whole
  // catalogue is a handful of variants, so a 1:1 loop would stop at three items
  // while the caller asked for twelve and the generator could have supplied more.
  for (let i = 0; i < limit * 4 && out.length < limit; i++) {
    const q = generateQuestionNear(conceptId, `export:${conceptId}:${i}`, target, 12);
    if (!q) break;
    const key = q.prompt.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

/** A download name built from the concept id, not from the title: a title can
 *  contain slashes, quotes and non-ASCII, and a Content-Disposition header that
 *  a browser cannot parse becomes a file called `download`. */
function fileNameFor(conceptId: string): string {
  const safe = conceptId.replace(/[^A-Za-z0-9-]/g, "");
  return `openmind-${safe || "concept"}.qti.zip`;
}

/**
 * GET /api/export/qti?concept=<id>&limit=<n>
 *
 * PUBLIC, on purpose: the item bank is the product's authored content, not a
 * learner's data, and hiding it behind an account would mean a teacher cannot
 * evaluate it before asking for one. Nothing here is per-learner.
 */
export async function GET(req: Request): Promise<NextResponse> {
  let refusal = await pace(ingressLimitKey("export:qti", req), EXPORT_PER_ADDRESS);
  if (!refusal) refusal = await pace(EXPORT_PROCESS_KEY, EXPORT_PER_PROCESS);
  if (refusal) return refusal;

  const { searchParams } = new URL(req.url);
  const conceptId = (searchParams.get("concept") ?? "").trim();
  if (!conceptId) return NextResponse.json({ error: "concept_required" }, { status: 400 });

  const concept = getConcept(conceptId);
  if (!concept) return NextResponse.json({ error: "unknown_concept" }, { status: 404 });

  const rawLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(rawLimit, MAX_LIMIT))
    : DEFAULT_LIMIT;

  const items = drawItems(concept.id, limit);
  // A concept with no generator (there are none today, but the genome and the
  // question bank are separate registries) exports nothing rather than a package
  // whose manifest lists zero resources — which imports as a silent no-op.
  if (items.length === 0) return NextResponse.json({ error: "no_items" }, { status: 404 });

  // Copy into a fresh buffer: the ZIP's bytes may be a view over a larger
  // allocation, and a response body must be exactly the file.
  const body = new Uint8Array(qtiPackage({ concept, items }));
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${fileNameFor(concept.id)}"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
