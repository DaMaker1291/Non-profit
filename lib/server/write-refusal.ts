// ─────────────────────────────────────────────────────────────────────────────
// THE ONE SENTENCE EVERY ROUTE GIVES WHEN THE STORE WILL NOT KEEP THE WRITE.
//
// The rule lives in lib/env.ts (`storeReadiness`) and is enforced in
// lib/server/store.ts (every JSON write) and lib/server/evidence-file.ts (the
// ledger append), at the primitives every learner-record write goes through.
// The ledger half is reached through the facade lib/server/evidence.ts, so a
// route's `appendEvidence` is refused before the file is touched. This module is
// the HTTP half of it, and it
// exists so that half has ONE shape: `503` with the code, the sentence, and the
// two ways to fix the deployment — never a stack trace, never a 500.
//
// WHY 503 AND NOT 403. Nothing is forbidden to this caller; the DEPLOYMENT
// cannot hold what they are about to write. A learner hitting this is looking at
// a site whose operator has not finished configuring storage, and the status
// load balancers and monitors understand for "not able to serve" is 503.
//
// The check is by NAME rather than `instanceof`, because a store module loaded
// twice (a bundle boundary, a test importing from `.verify/`) would produce two
// distinct classes and an `instanceof` that silently fails — the failure mode
// being a 500 for exactly the state this exists to explain.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { storeWriteBlock } from "./store";

/**
 * The SAME refusal, asked BEFORE the work instead of caught after it — for a
 * handler that writes without a `catch` around it (a `POST` whose only try/catch
 * wraps its own JSON parse, say). Two ways in, one answer: the store throws it at
 * the primitive, and a handler may either translate that throw or refuse at its
 * own door. A route that could do both keeps both, and the catch is the backstop
 * against a write path nobody anticipated.
 *
 * Prefer this one where a handler writes unconditionally, because refusing first
 * costs nothing: no key is built, no session staged, no paper handed to a learner
 * who cannot be marked.
 */
export function storeWriteRefusalNow(): NextResponse | null {
  const block = storeWriteBlock();
  if (!block) return null;
  return NextResponse.json(
    {
      error: "store_not_durable",
      reason: block.code,
      detail: block.detail,
      writes: false,
    },
    { status: 503, headers: { "cache-control": "no-store" } },
  );
}

/** The status and body of a refused write, or null when this error is not one.
 *  Routes call it from their existing catch, so no handler needs restructuring:
 *
 *      catch (e) {
 *        const refusal = storeWriteRefusal(e);
 *        if (refusal) return refusal;
 *        …the route's own error handling
 *      }
 */
export function storeWriteRefusal(e: unknown): NextResponse | null {
  const err = e as { name?: unknown; code?: unknown; detail?: unknown; message?: unknown } | null;
  if (!err || err.name !== "StoreWriteBlockedError") return null;
  const code = typeof err.code === "string" ? err.code : "store_not_writable";
  const detail = typeof err.detail === "string" ? err.detail : String(err.message ?? "");
  return NextResponse.json(
    {
      // `store_not_durable` is the stable code a client or a log can branch on;
      // `reason` carries the report's own code (`durability_unknown`,
      // `data_dir_not_durable`, …) so an operator can find it in /api/ready.
      error: "store_not_durable",
      reason: code,
      // Named, because the alternative is a learner or a teacher staring at a
      // failed save with nothing to tell the person who runs the site.
      detail,
      writes: false,
    },
    { status: 503, headers: { "cache-control": "no-store" } },
  );
}
