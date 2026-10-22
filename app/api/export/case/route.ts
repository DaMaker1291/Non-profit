import { NextResponse } from "next/server";
import { CONCEPTS_BY_ID } from "@/lib/genome";
import { courseConceptIds, specById } from "@/lib/specifications";
import { caseFramework } from "@/lib/export/case";
import type { Concept } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/export/case?spec=<id>
 *
 * The curriculum framework for one qualification, in CASE 1.1 JSON. PUBLIC, for
 * the same reason the QTI route is: this is what the product TEACHES, and a
 * ministry's curriculum officer has to be able to read it before a meeting, not
 * after a procurement.
 *
 * THE CONCEPT SET IS THE COURSE'S OWN (`courseConceptIds`), not the whole genome
 * filtered by subject: a framework that claimed every stage of a subject for a
 * Foundation tier would be wrong about the qualification, and a receiver would
 * map content the course does not teach.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const specId = (searchParams.get("spec") ?? "").trim();
  if (!specId) return NextResponse.json({ error: "spec_required" }, { status: 400 });

  const spec = specById(specId);
  if (!spec) return NextResponse.json({ error: "unknown_spec" }, { status: 404 });

  const ids = [...courseConceptIds(spec)];
  const concepts = ids
    .map((id) => CONCEPTS_BY_ID[id])
    .filter((c): c is Concept => Boolean(c));

  return NextResponse.json(caseFramework({ spec, concepts }), {
    status: 200,
    headers: {
      // A framework is public content and deterministic, so a shared cache is
      // safe and saves a ministry's repeated downloads.
      "cache-control": "public, max-age=3600",
    },
  });
}
