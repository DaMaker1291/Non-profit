// "Teach me from what I have" (§resources): OpenMind builds around the
// learner's existing materials instead of demanding a new ecosystem.
import type { NextT } from "./next-engine";

/** Resource checklist — labels are i18n keys (`res.<id>`), rendered by the
 *  UI through the translator so the checklist is fully translatable. */
export const RESOURCE_OPTIONS = [
  { id: "textbook", label: "res.textbook" },
  { id: "worksheets", label: "res.worksheets" },
  { id: "phone", label: "res.phone" },
  { id: "internet-sometimes", label: "res.internet" },
  { id: "teacher-weekly", label: "res.teacher" },
] as const;

/** Tailored, honest advice for the resource set. Each line maps to a real action. */
export function adviceFor(resources: string[], tt?: NextT): Array<{ text: string; href: string; label: string }> {
  const t: NextT = tt ?? ((k) => k);
  const has = (id: string) => resources.includes(id);
  const out: Array<{ text: string; href: string; label: string }> = [];
  if (has("internet-sometimes")) {
    out.push({ text: t("res.advice.internet"), href: "/offline", label: t("res.advice.offlinePlan") });
  }
  if (has("teacher-weekly")) {
    out.push({ text: t("res.advice.teacher"), href: "/teacher", label: t("res.advice.weekPlan") });
  }
  if (has("textbook") || has("worksheets")) {
    out.push({ text: t("res.advice.paper"), href: "/solve", label: t("res.advice.identify") });
  }
  if (resources.length === 0) {
    out.push({ text: t("res.advice.phone"), href: "/diagnostic/maths", label: t("have.diagnose") });
  }
  return out;
}
