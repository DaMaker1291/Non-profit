"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n, useProfile } from "@/lib/client";
import { getConcept } from "@/lib/genome";
import { ctitle } from "@/lib/content-i18n";
import { SUBJECT_LABELS, SUBJECT_IDS } from "@/lib/subjects";
import type { StudyRoom, SubjectId } from "@/lib/types";

export default function RoomsPage() {
  const { t } = useI18n();
  const { state } = useProfile();
  const handle = state?.profile.handle ?? "guest";
  const lang = state?.profile.language ?? "en";

  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [open, setOpen] = useState<StudyRoom | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<SubjectId>("maths");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/rooms");
    const j = (await res.json()) as { rooms: StudyRoom[] };
    setRooms(j.rooms ?? []);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { chatRef.current?.scrollTo(0, 1e6); }, [open?.messages.length]);

  async function create() {
    setErr("");
    // Give the room a concrete focus concept so the tutor has subject context.
    const focus: Record<SubjectId, string> = {
      maths: "linear-equations", physics: "forces-basics", chemistry: "acids-bases",
      biology: "cells", computing: "variables",
    };
    const res = await fetch("/api/rooms", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create", name: name || `${t(SUBJECT_LABELS[subject])} ${t("rooms.room")}`,
        subject, conceptIds: [focus[subject]], language: lang, handle,
      }),
    });
    if (!res.ok) { setErr(`HTTP ${res.status}`); return; }
    setName("");
    void refresh();
  }

  async function openRoom(id: string) {
    setErr("");
    const res = await fetch("/api/rooms", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", id, handle }),
    });
    const j = await res.json();
    if (j.room) setOpen(j.room); else setErr(t("common.error"));
  }

  async function send() {
    if (!open || !text.trim()) return;
    const res = await fetch("/api/rooms", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "message", id: open.id, handle, text }),
    });
    const j = await res.json();
    if (j.room) setOpen(j.room);
    setText("");
  }

  async function fork(id: string) {
    const res = await fetch("/api/rooms", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fork", id, handle }),
    });
    const j = await res.json();
    if (j.room) setOpen(j.room);
    void refresh();
  }

  return (
    <main className="container" style={{ paddingTop: 36 }}>
      <p className="eyebrow"><span className="no">◍</span> {t("rooms.title")}</p>
      <h1 className="visually-small">{t("rooms.title")}</h1>
      <p className="lead" style={{ maxWidth: 720 }}>{t("rooms.sub")}</p>
      {err && <div className="feedback no" style={{ marginTop: 14 }}>{err}</div>}

      {!open ? (
        <>
          <div className="card" style={{ marginTop: 18, marginBottom: 18 }}>
            <p className="eyebrow"><span className="no">＋</span> {t("rooms.create")}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input type="text" placeholder={t("rooms.name")} value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 2, minWidth: 200 }} />
              <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectId)} style={{ flex: 1, minWidth: 150 }}>
                {SUBJECT_IDS.map((s) => <option key={s} value={s}>{t(SUBJECT_LABELS[s])}</option>)}
              </select>
              <button className="btn" onClick={create}>{t("rooms.create")}</button>
            </div>
          </div>

          {rooms.length === 0 ? (
            <p className="muted">{t("rooms.empty")}</p>
          ) : (
            <div className="grid cols3">
              {rooms.map((r) => (
                <div key={r.id} className="card">
                  <b>{r.name}</b>
                  <div className="muted small" style={{ margin: "4px 0 10px" }}>
                    {SUBJECT_LABELS[r.subject]} · {r.members.length} {t("rooms.members")} · {r.createdBy}
                    {r.forkOf ? " · ⑂" : ""}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn small" onClick={() => openRoom(r.id)}>{t("rooms.join")}</button>
                    <button className="btn small ghost" onClick={() => fork(r.id)}>⑂ {t("rooms.fork")}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h2 className="section" style={{ margin: 0 }}>{open.name}</h2>
            <button className="btn ghost small" onClick={() => { setOpen(null); void refresh(); }}>← {t("learn.back")}</button>
          </div>
          <p className="muted small">
            {open.conceptIds.length
              ? open.conceptIds.map((cid) => ctitle(lang, cid)).join(" · ")
              : t(`subj.${open.subject}`)}
            {" "}· {open.members.length} {t("rooms.members")} · {t("rooms.tutorNote")}
          </p>
          <div className="chat" ref={chatRef}>
            {open.messages.length === 0 && (
              <p className="muted small">{t("rooms.hello")}</p>
            )}
            {open.messages.map((m) => (
              <div key={m.id}>
                <div className={`msg ${m.author === handle ? "me" : "them"}`}>
                  <span className="who">{m.author}</span>
                  {m.text}
                </div>
                {m.tutorReply && (
                  <div className="msg tutor">
                    <span className="who">
                      {t("tutor.title")}
                      {/* WHICH IDEA the turn was grounded in, when the tutor had
                          to read it out of what was typed (the room declared
                          none). The concept titles are the app's own content
                          names, not a claim about a person. */}
                      {m.tutorFocus && !open.conceptIds.includes(m.tutorFocus) && (
                        <span className="chip" style={{ marginLeft: 8 }}>{ctitle(lang, m.tutorFocus)}</span>
                      )}
                    </span>
                    {m.tutorReply}
                    {/* WHO answered. The server decides this key and a fallback
                        reply can never be given the AI one
                        (lib/server/room-tutor.ts) — this renders what it is
                        told, and older messages without a key were all produced
                        by the offline engine, which is what that key says. */}
                    <span className="small muted" style={{ display: "block", marginTop: 6 }}>
                      {t(m.tutorLabelKey ?? "tutor.offlineNote")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input
              type="text" value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`${t("rooms.send")}…`}
            />
            <button className="btn" onClick={send}>{t("rooms.send")}</button>
          </div>
        </div>
      )}
      <div style={{ height: 36 }} />
    </main>
  );
}
