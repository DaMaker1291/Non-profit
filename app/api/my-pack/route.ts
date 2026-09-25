import { NextResponse } from "next/server";
import { authorizeLearner } from "@/lib/server/capability";
import { getConcept } from "@/lib/genome";
import { decide } from "@/lib/decision";
import { decisionContextFor } from "@/lib/server/decision";
import { buildSnapshot } from "@/lib/learner-model";
import { cblurb, ctitle } from "@/lib/content-i18n";
import { translator } from "@/lib/i18n";
import { teachingDirective } from "@/lib/language-profile";

/** GET /api/my-pack?id=... — personal offline learning pack.
 *  One download while connected: lessons + progress + review queue +
 *  regenerable question seeds. No answers are embedded beyond the student's
 *  own recorded progress; grading stays server-side when back online. */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  // The pack carries the learner's own plan, weak concepts and recorded work,
  // so it is behind the capability rule like the ledger it is built from — a
  // downloadable pack of somebody else's weaknesses is not a public document.
  const auth = await authorizeLearner(id, searchParams.get("secret"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const state = auth.state;

  // The pack is THE artefact for a school with no internet, so it has to be in
  // the learner's own language. `decideNext` silently falls back to English
  // when it is given no translator and no title resolver — which is where this
  // surface used to ship "Practise: Negative numbers" to an Arabic learner.
  const lang = state.profile.teachingLang ?? state.profile.language ?? "en";
  const tt = translator(lang);

  // The pack's plan comes through the SAME door as Home's (lib/decision.ts),
  // over the same ledger. This route has no profile state of its own to lean
  // on, so it asks the server for the canonical context: a downloaded pack that
  // disagreed with Home would be worse than no pack at all, because it would be
  // acted on with no connection to correct it.
  const ctx = await decisionContextFor(id!);
  if (!ctx) return NextResponse.json({ error: "not found" }, { status: 404 });

  const touched = Object.keys(state.progress).filter((cid) => getConcept(cid));
  const lessons = touched.map((cid) => {
    const c = getConcept(cid)!;
    return {
      conceptId: cid, subject: c.subject,
      title: ctitle(lang, cid), blurb: cblurb(lang, cid),
      // The lesson paragraph is the authored English teaching text: the same
      // tier as a generated explanation, and it is labelled as such on screen.
      lesson: c.lesson, prereqs: c.prereqs,
      mastery: state.progress[cid]?.mastery ?? 0,
    };
  });
  const snap = buildSnapshot(state);
  const actions = decide(ctx, { max: 6, tt, title: (cid) => ctitle(lang, cid) });
  const weakAreas = snap.evidence.filter((e) => e.mastery < 0.65 && e.attempts > 0).slice(0, 5).map((e) => e.conceptId);
  return NextResponse.json({
    exportedAt: Date.now(),
    profile: {
      handle: state.profile.handle, country: state.profile.country,
      language: state.profile.language,
      teachingLang: state.profile.teachingLang ?? state.profile.language,
      answerLang: state.profile.answerLang ?? state.profile.language,
      schoolLang: state.profile.schoolLang ?? state.profile.language,
      subjects: state.profile.subjects,
      teachingDirective: teachingDirective(state.profile),
    },
    summary: {
      touched: snap.touched, strong: snap.strong,
      due: snap.dueCount,
      activities: actions.length + lessons.length,
    },
    today: actions,
    weakAreas,
    // Honest provenance for the download: which projection produced the plan and
    // how much evidence it rests on.
    decision: {
      projectionVersion: actions[0]?.projectionVersion ?? ctx.projectionVersion,
      evidenceEvents: ctx.events.length,
      unprojectable: ctx.unprojectable,
    },
    review: snap.dueCount,
    progress: state.progress,
    lessons,
    note: tt("off.packNote"),
  });
}
