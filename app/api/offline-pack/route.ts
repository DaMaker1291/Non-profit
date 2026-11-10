import { NextResponse } from "next/server";
import { authorisedProfile } from "@/lib/server/auth";
import { newId } from "@/lib/server/store";
import { getConcept } from "@/lib/genome";
import { generateQuestion } from "@/lib/questions";
import { lessonStatus, PILOT_SEQUENCE } from "@/lib/pilot";
import { planFor, teachingLanguages } from "@/lib/lesson-plans";
import { languageProfile } from "@/lib/language-profile";

export const dynamic = "force-dynamic";

/**
 * GET /api/offline-pack — a package a learner can keep on the device.
 *
 * WHAT IS SELECTABLE, AND WHY. Only the authored pilot lessons are eligible:
 * they carry a complete OpenMind-authored plan, and their rights basis is the
 * repository's own MIT licence rather than an imported text with unclear
 * permissions. This endpoint does not claim educator approval — `review` says
 * exactly what the lesson's review state is.
 *
 * THE ANSWER KEY IS PART OF THE PACK. That is the point of an offline activity:
 * the device has to mark the answer without a server. The resulting evidence is
 * later ingested with `provenance: "device"` — real work, disclosed as
 * unverified — through /api/evidence. Online serving never uses this path.
 */
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
      concepts: PILOT_SEQUENCE
        .filter((id) => planFor(id) !== null)
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
  if (!PILOT_SEQUENCE.includes(conceptId)) {
    return NextResponse.json({ error: "not an offline lesson" }, { status: 400 });
  }
  // A pack is labelled with the language its teaching is ACTUALLY in. When a
  // complete translation does not exist, `planFor` falls back to English; the
  // pack says so rather than relabelling English text as the learner's language.
  const language = packLanguage(conceptId);
  const teachingTranslated = language === requestedLanguage;
  const questionsTranslated = requestedLanguage === "en";
  const plan = planFor(conceptId, language);
  if (!plan) return NextResponse.json({ error: "no complete lesson" }, { status: 404 });
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
  });
}
