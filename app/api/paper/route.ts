import { NextResponse } from "next/server";
import {
  buildPaper, defaultPaperFor, genericPaper, markPaper, paperConceptsTested, paperById, PAPERS,
  papersForSpec, type BuiltPaperAnswerKey,
} from "@/lib/papers";
import { specById, specForProfile, levelOf, type ActiveSpec, type CourseFields } from "@/lib/specifications";
import { cacheGet, cacheSet, getStoredPaper, saveStoredPaper, updateProfile } from "@/lib/server/store";
import { authorisedProfile } from "@/lib/server/auth";
import { analysePaper } from "@/lib/paper-analysis";
import { answerEvidence, type EvidenceEvent } from "@/lib/evidence";
import { commitAndProject } from "@/lib/server/projection";
import { asQuestion, aiStatus, llmExamQuestions, type QuestionRequest } from "@/lib/llm";
import { subjectLabel } from "@/lib/subjects";
import type { SubjectId } from "@/lib/types";

const SUBJECTS: SubjectId[] = ["maths", "physics", "chemistry", "biology", "computing"];

function subjectFrom(raw: string | null): SubjectId {
  return SUBJECTS.includes(raw as SubjectId) ? (raw as SubjectId) : "maths";
}

/** Resolve the qualification a paper should be written to: the explicit
 *  request first, otherwise the learner's OWN course for this subject — a paper
 *  in physics is written to the physics course, not to whatever qualification
 *  happens to be first on the profile. */
function activeSpecFor(
  specParam: string | null,
  levelParam: string | null,
  profile: CourseFields | null,
  subject: SubjectId,
): ActiveSpec {
  if (specParam) {
    const s = specById(specParam);
    if (s) return { spec: s, level: levelOf(s, levelParam ?? undefined) ?? s.levels[0] };
  }
  return specForProfile(profile ?? {}, subject);
}

/** GET /api/paper — build (and store) a paper.
 *
 *  `ai=1` asks the model for exam-style questions in the learner's own
 *  qualification; every one is validated against the four-choice contract and
 *  anything malformed is dropped and backfilled from the deterministic engine,
 *  so the paper is never incomplete and never wrong. Results are cached on
 *  disk, so the second learner to sit that paper needs no connection at all. */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const subject = subjectFrom(searchParams.get("subject"));
  const lang = searchParams.get("lang") ?? "en";
  const seed = searchParams.get("seed") ?? `p${Date.now().toString(36)}`;
  const profile = await authorisedProfile(req, searchParams.get("id"), searchParams.get("secret"));
  const active = activeSpecFor(searchParams.get("spec"), searchParams.get("level"), profile?.profile ?? null, subject);

  // ?list=1 — what papers exist for this qualification.
  if (searchParams.get("list") === "1") {
    const authored = papersForSpec(active.spec.id).map((p) => ({
      id: p.id, name: p.name, subject: p.subject, minutes: p.minutes, marks: p.marks,
      calculator: p.calculator, authored: true as const,
    }));
    const list = authored.length
      ? authored
      : SUBJECTS.filter((s) => active.spec.coverage[s]).map((s) => {
        const g = genericPaper(active, s, lang);
        return { id: g.id, name: g.name, subject: s, minutes: g.minutes, marks: g.marks, calculator: g.calculator, authored: false as const };
      });
    return NextResponse.json({
      qualification: active.spec.name,
      level: active.level.name || active.level.id,
      papers: list,
      ai: aiStatus(),
    });
  }

  const templateId = searchParams.get("templateId") ?? searchParams.get("template");
  const template = (templateId ? paperById(templateId) : null) ?? defaultPaperFor(active, subject, lang);

  let built = buildPaper({ active, subject, seed, lang, template });
  let aiUsed = 0;
  const status = aiStatus();

  if (searchParams.get("ai") === "1" && status.enabled) {
    const slots = built.paper.sections.flatMap((s) => s.questions.map((q) => ({ section: s.name, q })));
    // Bounded on purpose: a paper is written at the start of a sitting, and a
    // learner on a slow connection should not wait for thirty model calls.
    const capped = slots.slice(0, 12);
    const reqs: QuestionRequest[] = capped.map((s) => ({
      conceptId: s.q.conceptId,
      qualification: `${active.spec.name}${active.level.name ? ` ${active.level.name}` : ""} — ${subjectLabel(subject, "en")}`,
      difficulty: s.q.difficulty,
      language: lang,
      marks: s.q.marks,
      avoid: slots.map((x) => x.q.view.prompt),
    }));

    const cacheKey = `paper:${active.spec.id}:${active.level.id}:${subject}:${lang}:${seed}:${capped.length}`;
    let generated: Awaited<ReturnType<typeof llmExamQuestions>> =
      ((await cacheGet(cacheKey)) as Awaited<ReturnType<typeof llmExamQuestions>> | null) ?? [];
    if (generated.length === 0) {
      generated = await llmExamQuestions(reqs);
      if (generated.length) await cacheSet(cacheKey, generated);
    }

    // Pair each returned question with the first still-unclaimed slot for its
    // concept — an AI answer attached to the wrong concept would be recorded
    // against the wrong node of the learner model.
    const used = new Set<string>();
    const replacements: Record<string, { conceptId: string; question: ReturnType<typeof asQuestion> }> = {};
    for (const g of generated) {
      const slot = capped.find((s) => s.q.conceptId === g.conceptId && !used.has(s.q.id));
      if (!slot) continue;
      used.add(slot.q.id);
      replacements[slot.q.id] = {
        conceptId: g.conceptId,
        question: asQuestion(g, g.conceptId, slot.q.difficulty),
      };
      aiUsed++;
    }
    if (Object.keys(replacements).length) {
      built = buildPaper({ active, subject, seed, lang, template, replacements });
    }
  }

  await saveStoredPaper(built.key);

  return NextResponse.json({
    paper: built.paper,
    qualification: active.spec.name,
    level: active.level.name || active.level.id,
    specId: active.spec.id,
    // Honest provenance: the learner is told which questions a model wrote and
    // which the offline engine assembled, and that this is exam-style practice
    // written to their qualification rather than a scan of a copyrighted paper.
    source: aiUsed === 0 ? "engine" : aiUsed === built.paper.questionCount ? "ai" : "mixed",
    aiQuestions: aiUsed,
    engineQuestions: built.paper.questionCount - aiUsed,
    ai: status,
    specs: PAPERS.map((p) => p.id).length,
  });
}

interface MarkBody {
  paperId?: string;
  answers?: Record<string, number>;
  id?: string;
  secret?: string;
  lang?: string;
}

/** POST /api/paper — mark a sitting, and record the evidence.
 *
 *  A paper is sat under exam conditions: no hints, no scaffolding, so every
 *  answer is recorded as *independent* evidence. That is exactly the signal the
 *  learner model is starved of, and it is why a past paper is worth more to
 *  OpenMind than thirty practice questions. */
export async function POST(req: Request): Promise<NextResponse> {
  let body: MarkBody = {};
  try {
    body = (await req.json()) as MarkBody;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!body.paperId) return NextResponse.json({ error: "missing paperId" }, { status: 400 });

  const key: BuiltPaperAnswerKey | null = await getStoredPaper(body.paperId);
  if (!key) return NextResponse.json({ error: "paper not found" }, { status: 404 });

  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
  const result = markPaper(key, answers);

  // Feed the learner model when we know whose paper it is.
  const profile = await authorisedProfile(req, body.id ?? null, body.secret ?? null);
  let recorded = 0;
  if (profile) {
    const learnerId = profile.profile.id;
    // One clock for the sitting: every model write and every event below
    // carries it, so replay reproduces the paper's model footprint exactly.
    const paperAt = Date.now();
    const pending: EvidenceEvent[] = [];
    await updateProfile(learnerId, async (state) => {
      for (const q of result.perQuestion) {
        if (q.correct === null) continue; // unanswered is not evidence
        // Carry the key's misconception tags into the learner model. Without
        // them a paper says which IDEAS cost marks but never WHY — and the
        // tags are the one thing the mark scheme knows that the score does not.
        const tags = key.questions.find((k) => k.id === q.id)?.tags ?? [];
        // The answer reaches the ledger first and the model is projected from
        // it (below). One event per question, carrying the mark scheme's tags:
        // a paper question IS graded evidence, so it must survive a replay as
        // well as a model write, and it must say WHY. The whole sitting shares
        // ONE clock, so its model footprint replays as one sitting rather than
        // as answers spread over real time.
        pending.push(answerEvidence({
          learnerId,
          at: paperAt,
          source: "past_paper",
          subject: key.subject ?? null,
          conceptId: q.conceptId,
          specificationId: key.spec ?? null,
          questionId: `${key.id}:${q.id}`,
          correct: q.correct,
          chosen: q.chosen ?? -1,
          mode: "independent",
          hints: 0,
          score: { awarded: q.awarded, max: q.marks },
          tags,
        }) as EvidenceEvent);
        recorded++;
      }
      // ── THE CUTOVER: WRITE EVENT → CONFIRM APPEND → REPLAY → RESPOND ──
      // The sitting is written and confirmed BEFORE the learner model moves.
      try {
        await commitAndProject(learnerId, state, pending);
      } catch {
        // The paper is still marked and the diagnosis is still returned — the
        // marking is computed from the key. What is honest is that NOTHING was
        // recorded: a model that moved without evidence is the one outcome
        // this path must not produce.
        recorded = 0;
      }
      return recorded;
    });
  }

  return NextResponse.json({
    result,
    // A paper is diagnostic evidence, not a score: which ideas cost marks,
    // which recurred, and what to drill. Computed server-side so the client
    // never has to re-derive the diagnosis (and cannot flatter it).
    analysis: analysePaper(key, result),
    conceptsTested: paperConceptsTested(key),
    name: key.name,
    minutes: key.minutes,
    calculator: key.calculator,
    recorded,
    // Marking here is exact for OpenMind's own questions (the key is known), so
    // the result is a mark, not an estimate. The *grade* is the estimate.
    gradeIsEstimate: true,
  });
}
