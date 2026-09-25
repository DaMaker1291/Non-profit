import { NextResponse } from "next/server";
import { getClass } from "@/lib/server/store";
import { authorizeLearner } from "@/lib/server/capability";
import { buildWeeklyPlan, classSubject } from "@/lib/teacher-plan";
import { isMemberOf } from "@/lib/server/class-membership";
import { liveRoster } from "@/lib/server/class-view";
import { generateQuestion } from "@/lib/questions";
import { getConcept } from "@/lib/genome";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { translator, isRtl } from "@/lib/i18n";

/** GET /api/pack-export?id=...&lang=... — the offline pack.
 *
 *  ?format=json → machine-readable bundle (JSON API of the whole week)
 *  ?format=html → a single printable file: the weekly plan, the full question
 *  bank for every day with a separate answer key, and each concept's lesson
 *  and coaching notes. One download while connected → the school keeps
 *  operating with no internet at all.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const cls = await getClass(id);
  if (!cls) return NextResponse.json({ error: "not found" }, { status: 404 });
  // The pack carries the week's full question bank WITH its answer key, so it
  // answers only to a member of the class — the same rule the roster door
  // enforces. (An unauthenticated GET here used to hand the key to anyone
  // holding a class id.) The teacher page presents its capability on both
  // links; `me` names the member, not the class.
  const auth = await authorizeLearner(searchParams.get("me"), searchParams.get("secret"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isMemberOf(cls, auth.state)) return NextResponse.json({ error: "not a member" }, { status: 403 });
  // The plan reads the LIVE projection view — the same derivation the roster
  // door serves — so the printed pack and the on-screen table can never
  // disagree about the same students.
  const planCls = await liveRoster(cls);

  const lang = cls.language || searchParams.get("lang") || "en";
  const format = searchParams.get("format") === "html" ? "html" : "json";
  const plan = buildWeeklyPlan(planCls);
  const t = translator(lang);

  const bank = plan.days.map((d) => {
    const concept = getConcept(d.conceptId);
    const questions = d.seeds.map((seed) => generateQuestion(d.conceptId, seed)).filter((q): q is NonNullable<typeof q> => Boolean(q));
    return {
      day: d.day,
      kind: d.kind,
      conceptId: d.conceptId,
      conceptTitle: concept?.title ?? d.conceptId,
      minutes: d.minutes,
      coaching: d.coaching,
      questions: questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        choices: q.choices,
        answerIndex: q.answer,
        answer: q.choices[q.answer],
        explanation: q.explanation,
      })),
    };
  });

  if (format === "json") {
    return NextResponse.json({
      cls: { id: cls.id, name: cls.name, joinCode: cls.joinCode, language: lang },
      plan,
      bank,
    });
  }

  // ── Printable pack ─────────────────────────────────────────────────────────
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const dayName = (d: number) => t(`pack.day${d}`);
  const kindName = (k: string) => t(`pack.${k}`);

  const lessons = plan.focus
    .map((cid) => getConcept(cid))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map(
      (c) => `
  <section class="lesson">
    <h2>${esc(c.title)}</h2>
    <p class="blurb">${esc(c.blurb)}</p>
    <p>${esc(c.lesson)}</p>
    ${(c.misconceptions ?? [])
      .map((mid) => MISCONCEPTIONS_BY_ID[mid])
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((m) => `<div class="coach"><b>${t("pack.coaching")}</b> ${esc(m.coaching)}</div>`)
      .join("\n")}
  </section>`,
    )
    .join("\n");

  const sections = bank
    .map(
      (d) => `
  <section class="day">
    <h2>${dayName(d.day)} — ${kindName(d.kind)} · ${esc(d.conceptTitle)} · ${d.minutes}′</h2>
    ${d.coaching.map((c) => `<div class="coach"><b>${t("pack.coaching")}</b> ${esc(c)}</div>`).join("\n")}
    <ol class="qs">
      ${d.questions
        .map(
          (q) => `<li><p>${esc(q.prompt)}</p><ul class="choices">${q.choices.map((c, i) => `<li>${String.fromCharCode(65 + i)}. ${esc(c)}</li>`).join("")}</ul></li>`,
        )
        .join("\n")}
    </ol>
  </section>`,
    )
    .join("\n");

  const key = bank
    .map(
      (d) =>
        `<p><b>${dayName(d.day)}:</b> ${d.questions
          .map((q, i) => `${i + 1}${String.fromCharCode(65 + q.answerIndex)}`)
          .join(" · ")}</p>`,
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="${lang}" dir="${isRtl(lang) ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OpenMind — ${esc(cls.name)}</title>
<style>
  :root { color-scheme: light; }
  body { font: 15px/1.5 Georgia, "Times New Roman", serif; max-width: 720px; margin: 24px auto; padding: 0 16px; color: #111; }
  h1 { font-size: 22px; margin: 0 0 2px; }
  h2 { font-size: 17px; margin: 28px 0 8px; border-bottom: 1px solid #999; padding-bottom: 4px; }
  .sub { color: #555; margin: 0 0 20px; }
  .qs li { margin: 10px 0; }
  .choices { list-style: none; padding-left: 18px; margin: 4px 0; }
  .coach { background: #f4f1e8; border-left: 3px solid #b09a4d; padding: 6px 10px; margin: 8px 0; font-size: 14px; }
  .key { background: #efefef; padding: 10px 14px; margin-top: 24px; font-family: ui-monospace, monospace; font-size: 13px; page-break-before: always; }
  .lesson .blurb { font-style: italic; color: #444; }
  section.day { page-break-inside: avoid; }
  @media print { body { margin: 8mm auto; } }
</style>
</head>
<body>
  <h1>OpenMind — ${esc(cls.name)}</h1>
  <p class="sub">${t("pack.weekOf")} ${new Date(plan.generatedAt).toISOString().slice(0, 10)} · ${t("pack.offlineNote")}</p>

  <h2>${t("pack.planTitle")}</h2>
  ${plan.days
    .map((d) => {
      const c = getConcept(d.conceptId);
      return `<p><b>${dayName(d.day)}</b> — ${kindName(d.kind)}: ${esc(c?.title ?? d.conceptId)} (${d.minutes}′)</p>`;
    })
    .join("\n")}
  ${plan.fromCurriculum ? `<p class="sub">${t("pack.noData")}</p>` : ""}

  ${sections}

  <h2>${t("pack.lessonsTitle")}</h2>
  ${lessons}

  <div class="key">
    <b>${t("pack.keyTitle")}</b>
    ${key}
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="openmind-${cls.id}-pack.html"`,
    },
  });
}
