import { NextResponse } from "next/server";
import { listPersonalPapers, newId, savePersonalPaper, updateProfile } from "@/lib/server/store";
import { analysePersonalPaper, mayStorePersonalPaper, personalPaperEvidence, validatePersonalPaper, type PersonalPaper } from "@/lib/personal-paper";
import { rightsFor, type ContentAction } from "@/lib/content-rights";
import { getConcept } from "@/lib/genome";
import { answerEvidence, type EvidenceEvent } from "@/lib/evidence";
import { commitAndProject } from "@/lib/server/projection";
import type { SubjectId } from "@/lib/types";
import type { ProfileState } from "@/lib/types";

/**
 * POST /api/my-paper — "bring your own paper".
 *
 * The learner sits a paper OpenMind cannot host (their board's own, with no
 * licence) and hands OpenMind only what they type: question numbers, marks
 * available, marks awarded, and which idea each question tested. The paper
 * itself never reaches this server.
 *
 * That is a RIGHTS decision, enforced here rather than described in a policy:
 * `validatePersonalPaper` rejects any content-bearing field, and the store is
 * only ever written through `mayStorePersonalPaper()` — whose permissions come
 * from lib/content-rights.ts (private storage for the owner, no hosting, no
 * sharing, no AI training). A payload containing question text is refused with
 * the offending field name, not silently stripped: a client must not be able to
 * use this route as an upload path for a copyrighted document.
 *
 * What the learner gets back is the SAME diagnosis an OpenMind paper produces
 * (`analyseMarked`): marks lost by idea, ideas that recurred, a weakest-idea
 * drill target — and every figure those numbers rest on.
 *
 * Evidence recorded: one answer per question, hint-free (a paper is worked
 * without OpenMind's help, so it is INDEPENDENT evidence). Unanswered questions
 * are recorded but never as wrong answers and never as misconceptions: a mark
 * total says which idea cost marks, never why.
 */

/** Fields that steer the request rather than describing the paper. */
const CONTROL_KEYS = ["action", "id", "secret", "paperId"];

function checkSecret(state: ProfileState, presented: unknown): void {
  if (typeof presented !== "string" || !presented) throw new Error("unauthorized");
  if (!state.secret) { state.secret = presented; return; }
  if (state.secret !== presented) throw new Error("unauthorized");
}

/** The rights facts, derived from the one rights model so no surface can state
 *  something the code does not believe. */
function rightsSummary(): { origin: "user_provided"; permitted: ContentAction[]; stored: string[] } {
  const r = rightsFor("user_provided");
  const permitted = (Object.entries(r) as Array<[string, boolean]>)
    .filter(([, ok]) => ok)
    .map(([k]) => k.replace(/^can/, "").replace(/^./, (c) => c.toLowerCase())) as ContentAction[];
  return {
    origin: "user_provided",
    permitted,
    // What actually lands on disk — stated so the UI can say it, and asserted
    // by the harness so the sentence cannot drift away from the file.
    stored: ["marks", "concept", "questionNumber"],
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const secret = searchParams.get("secret");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const { getProfile } = await import("@/lib/server/store");
  const state = await getProfile(id);
  if (!state) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    checkSecret(state, secret);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const mine = await listPersonalPapers(id);
  return NextResponse.json({
    papers: mine.map((p) => ({ id: p.id, title: p.title, board: p.board, year: p.year, questionCount: p.questions.length, createdAt: p.createdAt })),
    rights: rightsSummary(),
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      action: "create" | "mark"; id: string; secret?: string;
      title?: unknown; board?: unknown; specId?: unknown; year?: unknown; questions?: unknown;
      paperId?: string;
    };
    if (!body?.id || (body.action !== "create" && body.action !== "mark")) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    // A deployment that has not permitted private storage must not silently
    // store anyway: the rights gate is the precondition, asked out loud.
    if (!mayStorePersonalPaper()) {
      return NextResponse.json({ error: "storage not permitted" }, { status: 403 });
    }

    if (body.action === "create") {
      // Everything that is not a control field is paper input, and the validator
      // refuses anything it does not recognise. Picking the known fields out by
      // name would have silently DROPPED an uploaded document — accepting the
      // request while ignoring the thing that must never be accepted.
      const raw = body as unknown as Record<string, unknown>;
      const paperInput = Object.fromEntries(Object.entries(raw).filter(([k]) => !CONTROL_KEYS.includes(k)));
      const check = validatePersonalPaper(paperInput);
      if (!check.ok) {
        const { error, ...rest } = check;
        return NextResponse.json({ error, ...rest }, { status: 400 });
      }
      const paper: PersonalPaper = {
        id: newId("pp"), owner: body.id, origin: "user_provided",
        createdAt: Date.now(), ...check.paper,
      };
      await savePersonalPaper(paper);
      const analysis = analysePersonalPaper(paper);
      // Evidence into the learner model, inside the profile lock. One clock
      // for the sitting: the model writes and the ledger events below carry
      // the same stamp, so replay reproduces this paper's model footprint.
      const paperAt = Date.now();
      const pending: EvidenceEvent[] = [];
      let committed = true;
      const upd = await updateProfile(body.id, async (state: ProfileState) => {
        checkSecret(state, body.secret);
        if (!state.personalPapers) state.personalPapers = [];
        if (!state.personalPapers.includes(paper.id)) state.personalPapers.push(paper.id);
        for (const e of personalPaperEvidence(paper)) {
          // Concept tags only, NEVER misconception tags: we know a question
          // lost marks and which idea it tested; we do not know why, and a
          // guess here would corrupt every later diagnosis.
          //
          // The answer reaches the ledger first and the model is projected
          // from it (below). Marked by the OWNER's key, not observed by the
          // server, so provenance is forced to "device": answerEvidence mints
          // "server", and the ledger must not claim to have watched a marking
          // it did not see. (The fold does not care: unverified work still
          // moves the model, and the impact report discloses the share.)
          const ev = answerEvidence({
            learnerId: body.id,
            at: paperAt,
            source: "past_paper",
            subject: getConcept(e.conceptId)?.subject ?? null,
            conceptId: e.conceptId,
            specificationId: state.profile.spec ?? null,
            questionId: e.questionId,
            correct: e.correct,
            chosen: e.correct ? 0 : 1,
            mode: "independent",
            hints: 0,
            score: { awarded: e.awarded, max: e.marks },
            tags: [],
          }) as EvidenceEvent;
          pending.push({ ...ev, provenance: "device" });
        }
        // ── THE CUTOVER: WRITE EVENT → CONFIRM APPEND → REPLAY → RESPOND ──
        try {
          await commitAndProject(body.id, state, pending);
        } catch {
          committed = false;
        }
        return { recorded: personalPaperEvidence(paper).length, concepts: [...new Set(paper.questions.map((q) => q.conceptId))] };
      });
      if (!upd) return NextResponse.json({ error: "not found" }, { status: 404 });
      const r = upd.result as { error?: string };
      if (r?.error) return NextResponse.json({ error: r.error }, { status: 400 });
      return NextResponse.json({
        paper: { id: paper.id, title: paper.title, questions: paper.questions.length },
        analysis,
        recorded: (upd.result as { recorded: number }).recorded,
        // Honest: the paper is stored and diagnosed either way, but a ledger
        // that could not be written means the learner model did NOT move.
        evidenceRecorded: committed,
      });
    }

    // mark: re-read a paper by id and return its diagnosis again (owner-scoped).
    const { getPersonalPaper } = await import("@/lib/server/store");
    if (!body.paperId) return NextResponse.json({ error: "bad request" }, { status: 400 });
    const paper = await getPersonalPaper(body.paperId, body.id);
    if (!paper) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ paper: { id: paper.id, title: paper.title, questions: paper.questions.length }, analysis: analysePersonalPaper(paper) });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

export type { ProfileState };
