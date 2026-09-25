// Peer teach review (§13/§35): offline keyword-coverage check. Honest about
// being a coverage heuristic — feedback strings are translatable via peer.*.
import type { NextT } from "./next-engine";

export interface PeerVerdict {
  coverage: number;
  missing: string[];
  verdict: "strong" | "good" | "partial" | "thin";
  feedback: string;
}

function keywordsOf(lesson: string): string[] {
  return [...new Set(
    lesson
      .toLowerCase()
      .replace(/[^a-zà-ÿа-я一-鿿à-ʼ\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4),
  )];
}

export function reviewExplanation(lesson: string, explanation: string, tt?: NextT): PeerVerdict {
  const t: NextT = tt ?? ((k) => k);
  const keys = keywordsOf(lesson);
  const expl = explanation.toLowerCase();
  const missing = keys.filter((k) => !expl.includes(k));
  const coverage = keys.length ? 1 - missing.length / keys.length : 0;
  const verdict = coverage >= 0.6 ? "strong" : coverage >= 0.4 ? "good" : coverage >= 0.2 ? "partial" : "thin";
  const feedback =
    verdict === "strong"
      ? t("peer.strong")
      : verdict === "good"
        ? `${t("peer.goodPre")}${missing.slice(0, 2).join(", ") || t("peer.aDetail")}${t("peer.goodPost")}`
        : verdict === "partial"
          ? `${t("peer.partialPre")}${missing.slice(0, 3).join(", ")}${t("peer.partialPost")}`
          : t("peer.thin");
  return { coverage, missing: missing.slice(0, 5), verdict, feedback };
}
