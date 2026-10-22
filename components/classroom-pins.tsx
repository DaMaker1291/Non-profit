"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE TEACHER'S HALF OF THE CLASSROOM IDENTITY MODEL.
//
// `POST /api/classes {action:"provision"}` has been able to mint forty PINs since
// the kiosk work landed, but until this panel there was no way to ASK for them
// from the console — the flow existed as an API and a curl script, which is not a
// flow a teacher can run. The two things it offers are the two a classroom needs:
//
//   • ENROL, for the learners on the register (names in, PINs out);
//   • RE-ISSUE, for the ordinary event of a forgotten PIN — a NEW secret on the
//     SAME record, so the learner keeps their work. Provisioning a second
//     profile for the same child would split their evidence in two, which is the
//     quiet version of losing it.
//
// A PIN IS SHOWN ONCE, AND THIS PANEL SAYS SO. The server stores a scrypt hash on
// the class and cannot read a PIN back; what is on screen came from the response
// that created it. Print it or write it down now — the panel keeps it visible
// until the page is reloaded, and no second request can produce it again.
//
// NOTHING HERE IS A CREDENTIAL IN THE PAGE. The teacher's authority travels as
// their account session cookie (the class door checks it server-side); a PIN is
// shown to the person who issued it and stored nowhere.
import { useState } from "react";
import * as api from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/client";
import type { ClassRoster } from "@/lib/types";

interface Issued {
  id: string;
  handle: string;
  pin: string;
}

export function ClassroomPins({ cls, me }: { cls: ClassRoster; me: string }) {
  const { t } = useI18n();
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<Issued[]>([]);
  const [notice, setNotice] = useState("");
  const [err, setErr] = useState("");

  // The learners who already have a classroom credential, by id — the roster's
  // own answer, not a second list the page keeps. The ones THIS panel just
  // enrolled are merged in because the class object it was given is the page's
  // snapshot: re-issue has to be available for the children the teacher just
  // created, and a reload is not an answer (it would clear the PINs on screen).
  const classroom = (() => {
    const byId = new Map<string, string>();
    for (const id of Object.keys(cls.kiosk ?? {})) {
      byId.set(id, Object.entries(cls.membersById ?? {}).find(([, v]) => v === id)?.[0] ?? id);
    }
    for (const l of issued) if (!byId.has(l.id)) byId.set(l.id, l.handle);
    return [...byId].map(([id, handle]) => ({ id, handle }));
  })();

  async function send(learners: { handle?: string; id?: string }[], done: string) {
    if (busy) return;
    setBusy(true);
    setErr("");
    setNotice("");
    try {
      const r = (await api.classAction({ action: "provision", id: me, clsId: cls.id, learners })) as {
        learners?: Issued[];
      };
      setIssued(r.learners ?? []);
      setNotice(done);
    } catch (e) {
      // The store's own reason when there is one (a class whose teacher account
      // could not be resolved, a refused write), never a generic sentence over a
      // specific refusal.
      setErr(e instanceof ApiError && e.code ? e.code : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function enrol() {
    const learners = names
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 200)
      .map((handle) => ({ handle }));
    if (learners.length === 0) return;
    await send(learners, t("teach.pinsOnce"));
    setNames("");
  }

  return (
    <details className="note" style={{ marginBottom: 12 }}>
      <summary style={{ cursor: "pointer" }}>
        <strong>{t("teach.pinsTitle")}</strong>
      </summary>
      <p className="small muted" style={{ margin: "8px 0" }}>{t("teach.pinsLead")}</p>

      <label className="field" style={{ maxWidth: 420 }}>
        <span>{t("teach.pinsNames")}</span>
        <textarea
          value={names}
          onChange={(e) => setNames(e.target.value)}
          rows={3}
          placeholder={"Amina\nBaraka\nChidi"}
        />
      </label>
      <div className="actions tight">
        <button className="btn small" type="button" onClick={() => void enrol()} disabled={busy || !names.trim()}>
          {busy ? t("teach.pinsWorking") : t("teach.pinsIssue")}
        </button>
      </div>

      {/* THE ORDINARY EVENT: a forgotten PIN. A new secret on the SAME learner —
          their record, their evidence and their place on this roster stay put. */}
      {classroom.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <p className="eyebrow" style={{ marginBottom: 4 }}>{t("teach.pinsReissue")}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {classroom.map((l) => (
              <button
                key={l.id}
                className="btn ghost small"
                type="button"
                disabled={busy}
                onClick={() => void send([{ id: l.id, handle: l.handle }], t("teach.pinsOnce"))}
              >
                {l.handle} · {t("teach.pinsNew")}
              </button>
            ))}
          </div>
        </div>
      )}

      {notice && <p className="small" style={{ marginTop: 8 }}>{notice}</p>}
      {err && <p className="note" role="alert" style={{ borderInlineStartColor: "var(--margin-red)" }}>{err}</p>}

      {issued.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>{t("onb.handle")}</th><th>PIN</th></tr>
              </thead>
              <tbody>
                {issued.map((l) => (
                  <tr key={l.id}>
                    <td>{l.handle}</td>
                    <td className="mono" style={{ fontWeight: 700, letterSpacing: 1 }}>{l.pin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions tight">
            <button className="btn small ghost" type="button" onClick={() => window.print()}>
              {t("teach.pinsPrint")}
            </button>
          </div>
        </div>
      )}
    </details>
  );
}
