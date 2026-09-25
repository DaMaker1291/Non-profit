"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/client";

/** The exercise-book margin: a fixed red rule with a vertical section label.
 *  Flips to the right in RTL, like notebooks in Arabic and Urdu. */
export function MarginRail() {
  const { t } = useI18n();
  useEffect(() => {
    document.body.classList.add("loaded");
    return () => { document.body.classList.remove("loaded"); };
  }, []);
  return (
    <div className="margin-rail" aria-hidden="true">
      <span className="rail-label">{t("brand.rail")}</span>
    </div>
  );
}
