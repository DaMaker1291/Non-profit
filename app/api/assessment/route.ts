import { NextResponse } from "next/server";
import {
  ASSESSMENT_BLUEPRINTS,
  ASSESSMENT_FIXTURES,
  advisoryMisconceptions,
  compileAssessmentItem,
  gradeCompiledAssessment,
  publicAssessmentItem,
  fixtureAssessmentItem,
  publicFixtureItem,
  servedAssessmentItem,
  validateAssessmentResponse,
  type CompiledAssessment,
} from "@/lib/assessment-serving";
import { assessmentServingDecision, type AssessmentBlueprint } from "@/lib/assessment-intelligence";
import { assessmentFixtureEnabled } from "@/lib/server/assessment-fixture";
import { getConcept } from "@/lib/genome";
import { authorisedProfile } from "@/lib/server/auth";
import { withLearnerState } from "@/lib/server/transaction";
import { commitAndProjectIn } from "@/lib/server/projection";
import { storeWriteRefusal, storeWriteRefusalNow } from "@/lib/server/write-refusal";
import { answerEvidence, submissionEventId, type EvidenceEvent } from "@/lib/evidence";
import { decideOne, decisionContext } from "@/lib/decision";
import type { ProfileState } from "@/lib/types";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

function findBlueprint(id: string): AssessmentBlueprint | undefined {
  return ASSESSMENT_BLUEPRINTS.find((bp) => bp.id === id);
}

function statusView() {
  return {
    contract: "openmind.assessment-serve/1.0",
    approved: ASSESSMENT_BLUEPRINTS.filter((bp) => assessmentServingDecision(bp).ok).length,
    blueprints: ASSESSMENT_BLUEPRINTS.map((bp) => {
      const decision = assessmentServingDecision(bp);
      return {
        id: bp.id,
        version: bp.version,
        title: bp.title,
        subject: bp.subject,
        level: bp.level,
        reviewStatus: bp.reviewStatus,
        clearance: {
          pedagogical: bp.reviewStatus,
          rights: bp.sources.every((s) => s.rights === "cleared") ? "cleared" : "unknown",
          licensing: bp.sources.every((s) => s.licensing === "cleared") ? "cleared" : "unknown",
          confidentiality: bp.sources.some((s) => s.studentDataObserved) ? "student-data-present" : "clear",
        },
        servable: decision.ok,
        reasons: decision.reasons,
        items: bp.items.length,
        marks: bp.items.reduce((n, item) => n + item.marks, 0),
      };
    }),
    fixture: assessmentFixtureEnabled()
      ? {
          ...(() => {
            const fixture = publicFixtureItem("dd-05");
            return {
              id: "openmind.assessment-journey-fixture/1.0",
              label: "TEST FIXTURE — not a teacher review",
              notTeacherApproval: true,
              itemIds: ASSESSMENT_FIXTURES.flatMap((fixture) => [...fixture.itemIds]),
              example: fixture?.blueprintId,
            };
          })(),
        }
      : null,
  };
}

function refusal(decision: ReturnType<typeof assessmentServingDecision>, status = 403) {
  return NextResponse.json(
    {
      error: "not_servable",
      servable: false,
      reviewStatus: decision.reviewStatus,
      reasons: decision.reasons,
    },
    { status, headers: NO_STORE },
  );
}

/** GET /api/assessment — what the assessment layer can and cannot serve.
 *  `?itemId=…&fixture=1` returns the TEST FIXTURE item, without its key.
 *  A real blueprint item goes through `servedAssessmentItem`, which refuses all
 *  three current blueprints. The fixture is never a blueprint approval. */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json(statusView(), { headers: NO_STORE });
  }

  if (searchParams.get("fixture") === "1") {
    if (!assessmentFixtureEnabled()) {
      return NextResponse.json(
        { error: "fixture_disabled", detail: "The test fixture requires a non-production server, OPENMIND_ASSESSMENT_FIXTURE=1 and a temporary data directory." },
        { status: 403, headers: NO_STORE },
      );
    }
    const item = publicFixtureItem(itemId);
    if (!item) return NextResponse.json({ error: "unknown_fixture_item" }, { status: 404, headers: NO_STORE });
    return NextResponse.json({ item, notTeacherApproval: true }, { headers: NO_STORE });
  }

  const blueprintId = searchParams.get("blueprintId") ?? "";
  const bp = findBlueprint(blueprintId);
  if (!bp) return NextResponse.json({ error: "unknown_blueprint" }, { status: 404, headers: NO_STORE });
  const decision = assessmentServingDecision(bp);
  if (!decision.ok) return refusal(decision);
  const served = servedAssessmentItem(bp, itemId);
  if (!served.ok) return refusal(served.decision);
  const item = bp.items.find((candidate) => candidate.id === itemId)!;
  return NextResponse.json(
    { item: publicAssessmentItem(bp, item, served.compiled), notTeacherApproval: false },
    { headers: NO_STORE },
  );
}

type AssessmentBody = {
  id?: string;
  secret?: string;
  blueprintId?: string;
  itemId?: string;
  fixture?: boolean;
  responses?: unknown;
  working?: unknown;
  submissionId?: string;
};

function readStrings(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) return null;
  return value as string[];
}

function outcome(
  state: ProfileState,
  events: readonly EvidenceEvent[],
  conceptId: string,
) {
  const action = decideOne(decisionContext(state, events), { max: 1 });
  return {
    mastery: state.progress[conceptId]?.mastery ?? null,
    nextStep: action
      ? {
          kind: action.kind,
          conceptId: action.conceptId,
          reason: action.reason,
          why: action.why,
          href: action.href,
          expectedOutcome: action.expectedOutcome,
          basis: action.basis,
          evidenceIds: action.evidenceIds,
        }
      : null,
  };
}

/** POST /api/assessment — submit a response to a SERVED item, or to the TEST
 *  FIXTURE. Marking is `gradeStructuredParts`, the existing marker. Evidence is
 *  written first and the model is projected from it; prose is returned as a
 *  rubric, has no score, and is NOT recorded as answer evidence. */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as AssessmentBody;
    if (!body?.id) return NextResponse.json({ error: "bad request" }, { status: 400, headers: NO_STORE });
    const responses = readStrings(body.responses);
    const working = readStrings(body.working);
    if (!responses || !working) return NextResponse.json({ error: "bad request" }, { status: 400, headers: NO_STORE });

    const caller = await authorisedProfile(req, body.id, body.secret ?? null);
    if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });

    let bp: AssessmentBlueprint | undefined;
    let compiled: CompiledAssessment | undefined;
    let fixture = false;
    const itemId = typeof body.itemId === "string" ? body.itemId : "";

    if (body.fixture === true) {
      if (!assessmentFixtureEnabled()) {
        return NextResponse.json(
          { error: "fixture_disabled", detail: "The test fixture requires a non-production server, OPENMIND_ASSESSMENT_FIXTURE=1 and a temporary data directory." },
          { status: 403, headers: NO_STORE },
        );
      }
      const fixtureItem = fixtureAssessmentItem(itemId);
      if (!fixtureItem.ok) return NextResponse.json({ error: "unknown_fixture_item" }, { status: 404, headers: NO_STORE });
      fixture = true;
      bp = fixtureItem.fixture.blueprint;
      compiled = fixtureItem.compiled;
    } else {
      bp = findBlueprint(typeof body.blueprintId === "string" ? body.blueprintId : "");
      if (!bp) return NextResponse.json({ error: "unknown_blueprint" }, { status: 404, headers: NO_STORE });
      const served = servedAssessmentItem(bp, itemId);
      if (!served.ok) return refusal(served.decision);
      compiled = served.compiled;
    }

    if (!compiled) return NextResponse.json({ error: "unknown_item" }, { status: 404, headers: NO_STORE });
    const item = bp.items.find((candidate) => candidate.id === compiled!.itemId);
    if (!item) return NextResponse.json({ error: "unknown_item" }, { status: 404, headers: NO_STORE });

    if (!compiled.machineMarkable) {
      // PROSE IS NOT MACHINE-MARKED AND NOT RECORDED. The rubric and the model
      // answer are returned so the learner (or a teacher) can mark it; no score,
      // no evidence event, and no mastery movement can be invented from words.
      return NextResponse.json(
        {
          itemId: item.id,
          blueprintId: bp.id,
          responseKind: "extended-response",
          unscored: true,
          recorded: false,
          score: null,
          rubric: compiled.rubric,
          advisory: advisoryMisconceptions(bp, item, responses.join("\n")),
          modelAnswer: item.modelAnswer,
          notTeacherApproval: fixture,
          fixture: fixture ? { label: "TEST FIXTURE — not a teacher review", notTeacherApproval: true } : null,
          note: "A prose response is advisory only. It has no machine mark and is not recorded as answer evidence.",
        },
        { headers: NO_STORE },
      );
    }

    const validation = validateAssessmentResponse(compiled, responses, working);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.reason, partId: validation.partId ?? null },
        { status: 400, headers: NO_STORE },
      );
    }

    const graded = gradeCompiledAssessment(compiled, responses, working);
    const refusalNow = storeWriteRefusalNow();
    if (refusalNow) return refusalNow;

    const at = Date.now();
    const eventId = submissionEventId(body.submissionId);
    const concept = getConcept(item.conceptId);
    const tags = graded.parts
      .flatMap((part) => part.criteria)
      .map((criterion) => criterion.misconception?.id)
      .filter((id): id is string => typeof id === "string");
    const event = answerEvidence({
      learnerId: body.id,
      at,
      source: "assessment",
      subject: concept?.subject ?? null,
      conceptId: item.conceptId,
      specificationId: caller.profile.spec ?? null,
      questionId: `assessment:${bp.id}:${item.id}`,
      correct: graded.awarded === graded.marks,
      // A constructed response has no option index. −1 is the typed marker,
      // never a real choice.
      chosen: -1,
      mode: "independent",
      hints: 0,
      score: { awarded: graded.awarded, max: graded.marks },
      tags: [...new Set(tags)],
      ...(eventId ? { id: eventId } : {}),
    }) as EvidenceEvent;

    const written = await withLearnerState(body.id, async (ctx, state) => {
      try {
        await commitAndProjectIn(ctx, state, [event]);
      } catch {
        return { error: "evidence_not_recorded" as const };
      }
      const events = await ctx.readEvents();
      return outcome(state, events, item.conceptId);
    });
    if (!written) return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
    if ("error" in written.result) {
      return NextResponse.json({ error: written.result.error }, { status: 503, headers: NO_STORE });
    }

    return NextResponse.json(
      {
        itemId: item.id,
        blueprintId: bp.id,
        responseKind: item.responseKind,
        unscored: false,
        recorded: true,
        score: { awarded: graded.awarded, total: graded.marks },
        grade: graded,
        modelAnswer: item.modelAnswer,
        advisory: advisoryMisconceptions(bp, item, responses.join("\n")),
        mastery: written.result.mastery,
        nextStep: written.result.nextStep,
        notTeacherApproval: fixture,
        fixture: fixture ? { label: "TEST FIXTURE — not a teacher review", notTeacherApproval: true } : null,
      },
      { headers: NO_STORE },
    );
  } catch (e) {
    const refused = storeWriteRefusal(e);
    if (refused) return refused;
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
    }
    return NextResponse.json({ error: "bad request" }, { status: 400, headers: NO_STORE });
  }
}
