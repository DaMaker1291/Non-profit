"use client";

import { useEffect, useState } from "react";
import { deviceLearners, forgetDeviceLearner, switchToDeviceLearner, useI18n } from "@/lib/client";
import type { RosterLearner } from "@/lib/client";

// ─────────────────────────────────────────────────────────────────────────────
// WHO ELSE USES THIS PHONE.
//
// The deployment this project is built for is not one learner per device. It is
// three handsets for a class of forty, and two siblings sharing a phone at home.
// Until this component existed, the second learner to enrol on a device simply
// REPLACED the first: the identity storage holds one id and one secret, and the
// first child's record was still on the server but unreachable from that device
// for ever — the exact failure a printed recovery code only partly answers,
// because a twelve-year-old will not have written it down.
//
// The list itself is not new authority. Each entry is that learner's own
// capability secret, the same token their personal phone would hold, and every
// route still verifies it; switching writes the pair the whole app already reads.
// So this exposes nothing a person holding the device did not already have — it
// makes an existing, unstated power visible enough to choose deliberately.
//
// TWO DESIGN RULES. (1) It renders only when there IS a choice — one learner on
// a device is not a menu. (2) Switching and removing both RELOAD the page. The
// shell caches a full profile, a diagnostic lifecycle and a session in React
// state, and re-rendering those from a new identity in place is how a page ends
// up showing one learner's marks under another learner's name; a reload is the
// cheap, obviously-correct reset, and it is what a phone does anyway.
// ─────────────────────────────────────────────────────────────────────────────

export default function DeviceLearners() {
  const { t } = useI18n();
  const [roster, setRoster] = useState<RosterLearner[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Read after mount: localStorage does not exist during the server render, and
  // a first paint that guessed would disagree with the second.
  useEffect(() => {
    setRoster(deviceLearners());
    setActiveId(typeof window === "undefined" ? null : window.localStorage.getItem("openmind:profileId"));
  }, []);

  if (roster.length < 2) return null;

  const switchTo = (id: string) => {
    if (busy) return;
    setBusy(true);
    const ok = switchToDeviceLearner(id);
    // A failure here means the entry vanished between render and click (another
    // tab removed it). Reloading regardless is honest: the screen is stale.
    if (!ok) setBusy(false);
    window.location.reload();
  };

  const remove = (id: string) => {
    if (busy) return;
    setBusy(true);
    forgetDeviceLearner(id);
    window.location.reload();
  };

  return (
    <section className="exercise" style={{ marginTop: 20 }} aria-labelledby="device-learners">
      <h2 id="device-learners" style={{ fontSize: 16, marginTop: 0 }}>{t("acct.learners")}</h2>
      <p className="small muted" style={{ marginTop: 0 }}>{t("acct.learnersHint")}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
        {roster.map((entry) => {
          const active = entry.id === activeId;
          // A learner enrolled before handles were optional has no name to
          // show. The fallback is a neutral word, never the profile id — an id
          // is credential-adjacent and nobody should read one off a school
          // phone to decide who they are.
          const label = entry.name || t("acct.learner");
          return (
            <li
              key={entry.id}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: "1px solid var(--line, rgba(0,0,0,.08))" }}
            >
              <span style={{ flex: 1, fontWeight: active ? 600 : 400 }}>{label}</span>
              {active ? (
                <span className="small muted">{t("acct.active")}</span>
              ) : (
                <button type="button" className="btn ghost" onClick={() => switchTo(entry.id)} disabled={busy}>
                  {t("acct.switch")}
                </button>
              )}
              <button
                type="button"
                className="btn ghost"
                onClick={() => remove(entry.id)}
                disabled={busy}
                title={t("acct.removeHint")}
                aria-label={`${t("acct.remove")} — ${label}`}
              >
                {t("acct.remove")}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="small muted" style={{ marginBottom: 0 }}>{t("acct.removeHint")}</p>
    </section>
  );
}
