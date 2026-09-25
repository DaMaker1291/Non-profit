"use client";

// "Teach me from what I have" (§have-plan): the student's real materials
// become an ordered plan. Textbook → diagnostic → practice → worksheets →
// prove → transfer → review → offline pack. Same loop, their resources.
import Link from "next/link";
import { adviceFor } from "@/lib/resources";
import { decideOne, decisionContextFrom } from "@/lib/decision";
import { getConcept } from "@/lib/genome";
import { ctitle } from "@/lib/content-i18n";
import { useI18n } from "@/lib/client";
import type { LedgerFetch } from "@/lib/evidence-view";
import type { ProfileState, SubjectId } from "@/lib/types";

export default function HavePlan({ state, ledger }: { state: ProfileState; ledger?: LedgerFetch | null }) {
  const { t, lang } = useI18n();
  const resources = state.profile.resources ?? [];
  const tips = adviceFor(resources, t);
  // Concept names come from the content layer, so the plan is never English
  // inside an otherwise translated interface — and the same door as Home, over
  // the same ledger, so this plan cannot describe different work from the card
  // above it.
  const top = decideOne(decisionContextFrom(state, ledger), {
    tt: t,
    title: (id) => ctitle(lang, id),
  });
  // Diagnose the subject the student is actually working in — the one whose
  // evidence is newest. A hardcoded /diagnostic/maths link pushed every physics,
  // chemistry, biology and computing student into a maths diagnostic.
  const activeSubject: SubjectId = (() => {
    let best: { subject: SubjectId; at: number } | null = null;
    for (const [cid, p] of Object.entries(state.progress ?? {})) {
      const c = getConcept(cid);
      if (!c) continue;
      const at = p.lastSeen ?? 0;
      if (!best || at > best.at) best = { subject: c.subject, at };
    }
    return best?.subject ?? "maths";
  })();
  const steps: Array<{ t: string; href: string; label: string }> = [];
  if (resources.includes("textbook")) steps.push({ t: t("have.textbook"), href: top?.href ?? "/dashboard", label: top?.title ?? t("next.eyebrow") });
  steps.push({ t: t("have.diagnostic"), href: `/diagnostic/${activeSubject}`, label: t("have.diagnose") });
  if (top) steps.push({ t: top.title, href: top.href, label: t("next.title.practise") });
  if (resources.includes("worksheets")) steps.push({ t: t("have.worksheet"), href: top?.href ?? "/dashboard", label: t("have.apply") });
  steps.push({ t: t("have.prove"), href: "/solve", label: t("have.proveTag") });
  steps.push({ t: t("have.transfer"), href: "/solve", label: t("have.transferTag") });
  steps.push({ t: t("have.review"), href: "/progress", label: t("have.retain") });
  if (resources.includes("internet-sometimes")) steps.push({ t: t("have.download"), href: "/offline", label: t("have.offlineTag") });
  return (
    <section className="card" style={{ marginBottom: 20 }}>
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">🌱</span> {t("have.eyebrow")}</p>
      <ol style={{ margin: "8px 0", paddingLeft: 20 }}>
        {steps.map((s, i) => (
          <li key={i} className="small" style={{ margin: "4px 0" }}>
            {s.t} — <Link href={s.href}>{s.label} →</Link>
          </li>
        ))}
      </ol>
      {tips.length > 0 && (
        <p className="small muted" style={{ marginBottom: 0 }}>
          {tips[0].text} <Link href={tips[0].href}>{tips[0].label} →</Link>
        </p>
      )}
      <p className="small muted" style={{ marginBottom: 0 }}><Link href="/access">{t("have.update")}</Link></p>
    </section>
  );
}
