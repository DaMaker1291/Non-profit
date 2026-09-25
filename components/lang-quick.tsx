"use client";

import { LANGS } from "@/lib/i18n";
import { useI18n, useLearnLangs } from "@/lib/client";

/** Teaching / answer / school language — the three learning languages. The
 *  INTERFACE language is deliberately not here: it is configuration, not
 *  learning, and it lives with the interface settings (/access) rather than on
 *  the learning pages. Home shows at most a quiet pointer to that panel. */
export default function LangQuick({ profileLang }: { profileLang?: string }) {
  const { langs, set } = useLearnLangs(profileLang);
  const { t } = useI18n();

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
      <label className="field" style={{ minWidth: 120 }}>
        <span className="small">🌐 {t("lq.teaching")}</span>
        <select value={langs.teaching} onChange={(e) => set({ teaching: e.target.value })}>
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
        </select>
        <span className="small muted" style={{ display: "block", maxWidth: 320, marginTop: 2 }}>{t("lq.teachNote")}</span>
      </label>
      <label className="field" style={{ minWidth: 120 }}>
        <span className="small">✍️ {t("lq.answer")}</span>
        <select value={langs.answer} onChange={(e) => set({ answer: e.target.value })}>
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
        </select>
      </label>
      <label className="field" style={{ minWidth: 120 }}>
        <span className="small">📚 {t("lq.school")}</span>
        <select value={langs.school} onChange={(e) => set({ school: e.target.value })}>
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
        </select>
      </label>
    </div>
  );
}
