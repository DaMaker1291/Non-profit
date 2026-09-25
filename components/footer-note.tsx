"use client";

import { useI18n } from "@/lib/client";

export function Footer() {
  const { t } = useI18n();
  return (
    <>
      <span>OpenMind — {t("footer.brand")}</span>
      <span className="mono small">
        {t("footer.noAccounts")} · {t("home.offline")} · {t("home.languages")}
      </span>
    </>
  );
}
