import { NextResponse } from "next/server";
import {
  buildPaper, defaultPaperFor, markPaper, needsPaper, needsPaperId, needsReading,
  paperAllowedFor, paperConceptsTested, paperById, PAPERS, papersForSubject, type BuiltPaperAnswerKey, type PaperBasis,
} from "@/lib/papers";
import { specById, specForProfile, levelOf, chosenSubjects, type ActiveSpec, type CourseFields } from "@/lib/specifications";
import { cacheGet, cacheSet, getProfile, getStoredPaper, saveStoredPaper } from "@/lib/server/store";
// The learner transaction, through the port-facing door (lib/server/transaction.ts).
import { withLearnerState } from "@/lib/server/transaction";
import { authorisedProfile } from "@/lib/server/auth";
// A paper is only sittable if it can be MARKED, and marking reads the key this
// route stores — so a store that cannot keep the key refuses the paper rather
// than handing over one that can never be marked.
import { storeWriteRefusalNow } from "@/lib/server/write-refusal";
import { analysePaper } from "@/lib/paper-analysis";
import { answerEvidence, type EvidenceEvent } from "@/lib/evidence";
import { commitAndProjectIn } from "@/lib/server/projection";
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
    // THE LEARNER'S OWN BOARD COMES FIRST, and every row says which board it is.
    // Two GCSE maths papers (AQA and Edexcel) carry the same published name, so
    // an unordered list of them read as the same paper listed twice — and an AQA
    // learner's "first" paper was whichever happened to be declared first in
    // lib/papers.ts. The ordering is explicit and the label is on the row.
    const mine = active.spec.board;
    // WHAT THE PAPER IS travels with every row: a blueprint read from the
    // awarding body's own structure says so and cites it, and the shape
    // OpenMind built to the qualification's band says that instead. Before this,
    // both were presented under one sentence that claimed the learner's board
    // "specification and format" — true for the boards and false for everyone
    // else, which is the one thing a picker must not do.
    // ── ONLY THE SUBJECTS THIS LEARNER STUDIES ───────────────────────────
    //
    // This read the qualification's COVERAGE, so a learner who chose maths and
    // nothing else was offered physics, chemistry, biology and computing papers
    // — 28 rows across five subjects for a course of one. Coverage answers "what
    // can this qualification teach"; the learner's subjects answer "what am I
    // sitting" (`chosenSubjects`), and only the second is the picker's question.
    const subjects = chosenSubjects(profile?.profile ?? null, active.spec);
    // ONE SET PER SUBJECT: the board's own papers where the qualification has
    // them, OpenMind's exam-shaped set where it does not (`papersForSubject`).
    // The two used to be added together, so GCSE maths appeared ten times — six
    // board papers (two boards publish the same three) and three modelled ones.
    const all = subjects
      .flatMap((s) => papersForSubject(active, s, lang).map((p) => ({
        id: p.id, name: p.name, subject: s, minutes: p.minutes, marks: p.marks,
        calculator: p.calculator, board: p.board ?? null,
        authored: (p.basis ?? "published") === "published",
        basis: (p.basis ?? "published") as PaperBasis,
        shapeSource: p.shapeSource ?? null,
        shapeNote: p.shapeNote ?? null,
      })))
      // The learner's own board first, and the order inside each board is the
      // board's own paper order.
      .sort((a, b) => (a.board === mine ? 0 : 1) - (b.board === mine ? 0 : 1));
    const authored = all.filter((p) => p.basis === "published");
    const modelled = all.filter((p) => p.basis !== "published");
    // ── THE PAPER BUILT FROM THIS LEARNER'S OWN RECORD ────────────────────
    // Offered only where the record actually says something: a learner who has
    // established everything they have met is not handed a paper "for their weak
    // ideas", because there are none. Read with `getProfile` — a READ — so
    // opening the picker never writes the learner's record, and read ONCE for
    // every subject rather than once per subject. The row's length is the
    // paper's real length, so the marks and minutes shown are the ones sat.
    const record = profile ? await getProfile(profile.profile.id) : null;
    const needs = record
      ? subjects
        .map((s) => ({ subject: s, reading: needsReading(record, active, s) }))
        .filter((x) => x.reading.weak.length > 0)
        .map((x) => {
          const tpl = needsPaper(active, x.subject, lang, x.reading.slots);
          return {
            id: tpl.id, name: tpl.name, subject: x.subject, minutes: tpl.minutes,
            marks: tpl.marks, calculator: tpl.calculator, board: null,
            authored: false as const, needs: true as const,
            basis: "modelled" as const, shapeSource: null, shapeNote: null,
          };
        })
      : [];
    // ORDER, and it is a decision: the board's own paper leads, because that is
    // the one a learner actually sits (the picker is grouped by subject and keeps
    // this order inside each group), then the paper built from their own record —
    // more theirs than anything below it — and only then the specification's
    // generic sets. A record-built paper can be SHORT (it is as long as the
    // unfinished work it is about), so leading with it would open a learner's
    // papers page on a two-question paper above a real mock.
    const list = [...authored, ...needs, ...modelled];
    return NextResponse.json({
      qualification: active.spec.name,
      level: active.level.name || active.level.id,
      papers: list,
      ai: aiStatus(),
    });
  }

  const templateId = searchParams.get("templateId") ?? searchParams.get("template");
  // THE RECORD-BUILT PAPER IS READ, NOT LOOKED UP. It is in neither PAPERS nor
  // the built set — its length follows the learner's own record — so it is
  // recognised by its id, and when it is asked for the record is the only thing
  // that can say what the paper is about.
  const wantsNeeds = templateId !== null && templateId === needsPaperId(active, subject);
  const book = wantsNeeds && profile ? await getProfile(profile.profile.id) : null;
  const needsRead = book ? needsReading(book, active, subject) : null;
  if (wantsNeeds && (!needsRead || needsRead.weak.length === 0)) {
    // Asked for by name, but this record holds nothing to target. Refused rather
    // than quietly answered with the ordinary paper: the learner asked for their
    // own weak ground, and a generic mock is not that.
    return NextResponse.json({ error: "no_evidence_to_target" }, { status: 400 });
  }
  // A paper named by id is still bounded by WHOSE paper it is. `paperById` reads
  // the catalogue without knowing who is asking, so a link saved by a Core
  // IGCSE candidate (or by a learner who has since changed qualification) would
  // otherwise build the Extended paper, or another country's paper, for a
  // learner who cannot sit it. `paperAllowedFor` is the same rule the picker
  // filtered with, so what can be started and what is offered cannot disagree.
  const named = templateId ? paperById(templateId) : null;
  const template =
    (needsRead ? needsPaper(active, subject, lang, needsRead.slots) : null)
    ?? (named && paperAllowedFor(named, active) ? named : null)
    // A specification-built paper's id is DERIVED from the qualification, so it
    // is not in PAPERS — and without this lookup every choice in the picker
    // built Paper 1, whatever the learner had chosen.
    ?? (templateId ? papersForSubject(active, subject, lang).find((p) => p.id === templateId) ?? null : null)
    ?? defaultPaperFor(active, subject, lang);

  let built = buildPaper({
    active, subject, seed, lang, template,
    // The record's own candidates, in its own order, for the record-built paper.
    ...(needsRead ? { concepts: needsRead.candidates } : {}),
  });
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

  const refusal = storeWriteRefusalNow();
  if (refusal) return refusal;
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
    // The marking below is computed from the key, but its whole point is the
    // EVIDENCE it records — so the refusal is asked before the work rather than
    // suffered after it.
    const refusal = storeWriteRefusalNow();
    if (refusal) return refusal;
    const learnerId = profile.profile.id;
    // One clock for the sitting: every model write and every event below
    // carries it, so replay reproduces the paper's model footprint exactly.
    const paperAt = Date.now();
    const pending: EvidenceEvent[] = [];
    await withLearnerState(learnerId, async (ctx, state) => {
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
      // The sitting is written and confirmed BEFORE the learner model moves, and
      // the events travel on the transaction's own connection (§14.1).
      try {
        await commitAndProjectIn(ctx, state, pending);
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
