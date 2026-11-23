import { NextResponse } from "next/server";
import { authorisedProfile } from "@/lib/server/auth";
import { newId } from "@/lib/server/store";
import { getConcept } from "@/lib/genome";
import { generateQuestion } from "@/lib/questions";
import { lessonStatus, PILOT_SEQUENCE } from "@/lib/pilot";
import { planFor, teachingLanguages } from "@/lib/lesson-plans";
import { languageProfile } from "@/lib/language-profile";
import { AUTHORED_LESSONS, authoredLessonFor } from "@/lib/lessons/authored";
import { offlineAssessmentItems } from "@/lib/offline-assessment";
import type { OfflinePlan } from "@/lib/offline-pack";

export const dynamic = "force-dynamic";

/**
 * GET /api/offline-pack — a package a learner can keep on the device.
 *
 * WHAT IS SELECTABLE, AND WHY. Every lesson with an OpenMind-authored plan —
 * the original pilot set and the full authored curriculum — is eligible. Their
 * rights basis is the repository's own MIT licence rather than an imported
 * text with unclear permissions. This endpoint does not claim educator
 * approval — `review` says exactly what the lesson's review state is.
 *
 * A lesson authored after the pilot has no `lesson-plans` plan. It is packaged
 * from its AuthoredLesson instead, so the offline copy is still the authored
 * teaching rather than a placeholder. The generated multiple-choice practice
 * is the same bank the rest of the product uses.
 *
 * THE ANSWER KEY IS PART OF THE PACK. That is the point of an offline activity:
 * the device has to mark the answer without a server. The resulting evidence is
 * later ingested with `provenance: "device"` — real work, disclosed as
 * unverified — through /api/evidence. Online serving never uses this path.
 */
const OFFLINE_IDS: readonly string[] = Array.from(new Set([
  ...PILOT_SEQUENCE,
  ...AUTHORED_LESSONS.map((l) => l.conceptId),
]));

/** A compact offline plan from the authored contract. It is deliberately a
 *  translation of the same fields the printed sheet uses, not a new summary. */
function authoredOfflinePlan(conceptId: string): OfflinePlan | null {
  const l = authoredLessonFor(conceptId, "en");
  if (!l) return null;
  return {
    objective: l.objectives[0]?.statement ?? l.curriculum.reference,
    intuition: l.introduction.hook,
    idea: l.explanation.flatMap((e) => [e.heading, ...e.paragraphs]),
    traps: l.misconceptions.map((m) => ({ move: m.belief, why: m.whyItFails })),
    usedFor: l.curriculum.reference,
    figure: null,
    workedExamples: l.workedExamples.map((w) => ({
      prompt: w.prompt,
      steps: w.steps.map((s) => `${s.move} — ${s.why}`),
      answer: w.answer,
    })),
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const me = await authorisedProfile(req, url.searchParams.get("id"), url.searchParams.get("secret"));
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const learnerLanguage = languageProfile(me.profile);
  const requestedLanguage = learnerLanguage.teaching;
  const requestedTranslated = (id: string) => teachingLanguages(id).includes(requestedLanguage);
  const packLanguage = (id: string) => requestedTranslated(id) ? requestedLanguage : "en";

  if (url.searchParams.get("list") === "1") {
    return NextResponse.json({
      concepts: OFFLINE_IDS
        .filter((id) => planFor(id) !== null || authoredLessonFor(id) !== null)
        .map((id) => {
          const c = getConcept(id);
          const status = lessonStatus(id);
          const language = packLanguage(id);
          return {
            id,
            title: c?.title ?? id,
            subject: c?.subject ?? null,
            review: status.state,
            language,
            requestedLanguage,
            teachingTranslated: language === requestedLanguage,
            questionLanguage: "en",
            complete: language === requestedLanguage && requestedLanguage === "en",
          };
        }),
      requestedLanguage,
      rights: "OpenMind-authored lessons, MIT-licensed; no third-party text is packaged.",
    });
  }

  const conceptId = url.searchParams.get("concept") ?? "";
  if (!OFFLINE_IDS.includes(conceptId)) {
    return NextResponse.json({ error: "not an offline lesson" }, { status: 400 });
  }
  // A pack is labelled with the language its teaching is ACTUALLY in. When a
  // complete translation does not exist, `planFor` falls back to English; the
  // pack says so rather than relabelling English text as the learner's language.
  const language = packLanguage(conceptId);
  const teachingTranslated = language === requestedLanguage;
  const questionsTranslated = requestedLanguage === "en";
  const plan = planFor(conceptId, language) ?? authoredOfflinePlan(conceptId);
  if (!plan) return NextResponse.json({ error: "no complete lesson" }, { status: 404 });
  const authored = authoredLessonFor(conceptId, "en");
  const assessments = authored ? offlineAssessmentItems(authored) : [];
  const concept = getConcept(conceptId);
  const questions = [0, 1, 2]
    .map((i) => generateQuestion(conceptId, `offline:${me.profile.id}:${conceptId}:${i}`))
    .filter((q): q is NonNullable<typeof q> => q !== null);

  return NextResponse.json({
    packId: newId("opack"),
    conceptId,
    title: concept?.title ?? conceptId,
    subject: concept?.subject ?? null,
    language,
    requestedLanguage,
    questionLanguage: "en",
    assessmentLanguage: "en",
    teachingTranslated,
    questionsTranslated,
    complete: teachingTranslated && questionsTranslated,
    rights: {
      basis: "OpenMind-authored",
      licence: "MIT",
      note: "Only lessons authored in this repository are packaged. No third-party text is included.",
    },
    review: lessonStatus(conceptId).state,
    issuedAt: Date.now(),
    plan: {
      objective: plan.objective,
      intuition: plan.intuition,
      idea: plan.idea,
      traps: plan.traps,
      usedFor: plan.usedFor,
      figure: plan.figure ?? null,
      workedExamples: plan.workedExamples ?? [],
    },
    questions,
    assessments,
  });
}
