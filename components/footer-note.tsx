"use client";

import { useI18n } from "@/lib/client";
import { claim } from "@/lib/claims";

export function Footer() {
  const { t, lang } = useI18n();
  return (
    <>
      <span>OpenMind — {t("footer.brand")}</span>
      <span className="mono small">
        {t("footer.noAccounts")} · {t("home.offline")} · {claim("home.languages", lang)}
      </span>
    </>
  );
}
