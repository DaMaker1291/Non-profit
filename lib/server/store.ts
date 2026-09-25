import { promises as fs } from "fs";
import path from "path";
import type { ClassRoster, ProfileState, StudentProfile, StudyPack, StudyRoom } from "../types";
import type { BuiltPaperAnswerKey } from "../papers";
import type { PersonalPaper } from "../personal-paper";

// Where all learning data lives. Overridable so a deployment can point at a
// mounted drive, a synced folder or a Docker volume — copy that one directory
// to back up or move an entire school's OpenMind.
export const DATA_DIR = process.env.OPENMIND_DATA_DIR
  ? path.resolve(process.env.OPENMIND_DATA_DIR)
  : path.join(process.cwd(), ".openmind-data");

/** Per-file write locks: serialise read-modify-write cycles so concurrent
 *  requests (double-fired effects, parallel tabs) can never interleave and
 *  corrupt the JSON. Exported (with DATA_DIR) for the evidence ledger, which
 *  must share this table: a lock per module would let an evidence append and a
 *  profile write race on the same learner. */
export const locks = new Map<string, Promise<unknown>>();
export function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(key, next.then(() => undefined, () => undefined));
  return next;
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    // Missing or unreadable file — start from the fallback rather than crashing.
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDir();
  // Unique temp name per write: two writers must never share one tmp file.
  const tmp = path.join(DATA_DIR, `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(data), "utf8");
  await fs.rename(tmp, path.join(DATA_DIR, file));
}

// ── Profiles ────────────────────────────────────────────────────────────────

/** A brand-new learner state. Used by both the anonymous path (POST
 *  /api/profile) and account sign-up, so an account is born with a real,
 *  empty learner profile rather than a dangling id. */
export function newProfileState(id: string, init: Partial<StudentProfile> = {}): ProfileState {
  return {
    profile: {
      id,
      handle: "student",
      country: "XX",
      birthYear: null,
      language: "en",
      teachingLang: "en",
      answerLang: "en",
      schoolLang: "en",
      goal: "",
      intent: "",
      subjects: ["maths"],
      createdAt: Date.now(),
      ...init,
    },
    progress: {},
    diagnostics: {},
    masteries: {},
    secret: "",
  };
}

export async function getProfile(id: string): Promise<ProfileState | null> {
  const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
  return all[id] ?? null;
}

/* * Strip transient server-only state before a profile crosses the wire: live
 *  diagnostic sessions (keys containing ":session"), pending practice
 *  questions, whose answer keys must never reach the client, and the open
 *  learning session's ledger — which holds the baseline the result is compared
 *  against, so a client that could read or edit it could fake adaptation.
 *
 * `projectionBase` (lib/server/projection.ts) is stripped for a different
 *  reason: it is not secret, but it is server-side bookkeeping — a duplicate of
 *  `progress` as it stood at cutover, plus the note of what the ledger could
 *  not rebuild. It is the server's account of its own architecture, not the
 *  learner's state, and nothing in the UI has a use for it. */
export function publicProfileState(state: ProfileState): ProfileState {
  const out: Record<string, unknown> = { ...state };
  for (const k of Object.keys(out)) {
    if (k.includes(":session") || k === "practice" || k === "learnSession" || k === "projectionBase") delete out[k];
  }
  return out as unknown as ProfileState;
}

export async function saveProfile(state: ProfileState): Promise<void> {
  await withLock("profiles.json", async () => {
    const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
    all[state.profile.id] = state;
    await writeJson("profiles.json", all);
  });
}

/** Every profile state on disk, in one read. Used by the class door to derive
 *  a roster's LIVE mastery from each member's own ledger — one file, one read,
 *  rather than a store probe per student (a class of 45 would otherwise be 45
 *  reads per roster view). Callers see secrets and are expected not to ship
 *  them: the class door maps each state down to its projection immediately. */
export async function listProfileStates(): Promise<ProfileState[]> {
  const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
  return Object.values(all);
}

/**
 * Atomic read-modify-write: the mutator runs while the file lock is held, so
 * concurrent handlers (double-fired effects, parallel tabs, racing answers)
 * can never lose each other's updates.
 */
export async function updateProfile<T>(
  id: string,
  mutator: (state: ProfileState) => T | Promise<T>,
): Promise<{ state: ProfileState; result: T } | null> {
  return withLock("profiles.json", async () => {
    const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
    const state = all[id];
    if (!state) return null;
    const result = await mutator(state);
    await writeJson("profiles.json", all);
    return { state, result };
  });
}

// ── Study packs ─────────────────────────────────────────────────────────────
export async function listPacks(conceptId: string): Promise<StudyPack[]> {
  const all = await readJson<Record<string, StudyPack[]>>("packs.json", {});
  return (all[conceptId] ?? []).sort(
    (a, b) => b.helpful - a.helpful || b.createdAt - a.createdAt,
  );
}

export async function savePack(pack: StudyPack): Promise<void> {
  await withLock("packs.json", async () => {
    const all = await readJson<Record<string, StudyPack[]>>("packs.json", {});
    const list = all[pack.conceptId] ?? [];
    const i = list.findIndex((p) => p.id === pack.id);
    if (i >= 0) list[i] = pack; else list.push(pack);
    all[pack.conceptId] = list.slice(-200);
    await writeJson("packs.json", all);
  });
}

/** All packs across concepts — used by fork/helpful to resolve a pack id. */
export async function readAllPacks(): Promise<StudyPack[]> {
  const all = await readJson<Record<string, StudyPack[]>>("packs.json", {});
  return Object.values(all).flat();
}

// ── Rooms ───────────────────────────────────────────────────────────────────
export async function listRooms(): Promise<StudyRoom[]> {
  const rooms = await readJson<StudyRoom[]>("rooms.json", []);
  return rooms.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
}

export async function saveRoom(room: StudyRoom): Promise<void> {
  await withLock("rooms.json", async () => {
    const rooms = await readJson<StudyRoom[]>("rooms.json", []);
    const i = rooms.findIndex((r) => r.id === room.id);
    if (i >= 0) rooms[i] = room; else rooms.push(room);
    await writeJson("rooms.json", rooms.slice(-500));
  });
}

export async function getRoom(id: string): Promise<StudyRoom | null> {
  const rooms = await readJson<StudyRoom[]>("rooms.json", []);
  return rooms.find((r) => r.id === id) ?? null;
}

/** Atomic read-modify-write on a single room (joins, messages, forks). */
export async function updateRoomById<T>(
  id: string,
  mutator: (room: StudyRoom) => T | Promise<T>,
): Promise<{ room: StudyRoom; result: T } | null> {
  return withLock("rooms.json", async () => {
    const rooms = await readJson<StudyRoom[]>("rooms.json", []);
    const room = rooms.find((r) => r.id === id);
    if (!room) return null;
    const result = await mutator(room);
    await writeJson("rooms.json", rooms.slice(-500));
    return { room, result };
  });
}

// ── Exam papers ─────────────────────────────────────────────────────────────
// A sitting's answer key lives on the server (exactly like a staged practice
// question): the paper handed to the browser has no answers in it, and marking
// reads the key back by the paper's own id. Papers are capped and pruned so a
// school laptop cannot fill the disk with abandoned mocks.

export async function saveStoredPaper(key: BuiltPaperAnswerKey): Promise<void> {
  await withLock("papers.json", async () => {
    const all = await readJson<Record<string, BuiltPaperAnswerKey>>("papers.json", {});
    all[key.id] = key;
    const entries = Object.entries(all).sort((a, b) => b[1].createdAt - a[1].createdAt);
    const trimmed = Object.fromEntries(entries.slice(0, 300));
    await writeJson("papers.json", trimmed);
  });
}

export async function getStoredPaper(id: string): Promise<BuiltPaperAnswerKey | null> {
  const all = await readJson<Record<string, BuiltPaperAnswerKey>>("papers.json", {});
  return all[id] ?? null;
}

// ── Personal papers ─────────────────────────────────────────────────────────
// A learner's OWN paper, brought to OpenMind as marks and concept tags only —
// no question text ever reaches this file, which is what makes storing it
// defensible at all (see lib/content-rights.ts and lib/personal-paper.ts).
// Reads are owner-scoped: a personal paper is private to the learner who made
// it, and the route checks the owner rather than trusting an id.

export async function savePersonalPaper(paper: PersonalPaper): Promise<void> {
  await withLock("personal-papers.json", async () => {
    const all = await readJson<Record<string, PersonalPaper>>("personal-papers.json", {});
    all[paper.id] = paper;
    // Capped and pruned like every other growing store: a school laptop must not
    // fill up with abandoned worksheets. Newest kept.
    const entries = Object.entries(all).sort((a, b) => b[1].createdAt - a[1].createdAt);
    await writeJson("personal-papers.json", Object.fromEntries(entries.slice(0, 2000)));
  });
}

/** Owner-scoped read: returns null when the paper is not THIS learner's. */
export async function getPersonalPaper(id: string, owner: string): Promise<PersonalPaper | null> {
  const all = await readJson<Record<string, PersonalPaper>>("personal-papers.json", {});
  const paper = all[id];
  return paper && paper.owner === owner ? paper : null;
}

export async function listPersonalPapers(owner: string): Promise<PersonalPaper[]> {
  const all = await readJson<Record<string, PersonalPaper>>("personal-papers.json", {});
  return Object.values(all)
    .filter((p) => p.owner === owner)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ── AI result cache ─────────────────────────────────────────────────────────
// Generated content is cached on disk so a school that pays for one AI call can
// serve that question to every learner offline afterwards — and so a paper is
// reproducible on a connection that has since dropped.

export async function cacheGet(key: string): Promise<unknown | null> {
  const all = await readJson<Record<string, unknown>>("ai-cache.json", {});
  return all[key] ?? null;
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  await withLock("ai-cache.json", async () => {
    const all = await readJson<Record<string, unknown>>("ai-cache.json", {});
    all[key] = value;
    const entries = Object.entries(all).slice(-4000);
    await writeJson("ai-cache.json", Object.fromEntries(entries));
  });
}

// ── Classes ─────────────────────────────────────────────────────────────────
export async function listClasses(): Promise<ClassRoster[]> {
  return readJson<ClassRoster[]>("classes.json", []);
}

export async function saveClass(cls: ClassRoster): Promise<void> {
  await withLock("classes.json", async () => {
    const all = await readJson<ClassRoster[]>("classes.json", []);
    const i = all.findIndex((c) => c.id === cls.id);
    if (i >= 0) all[i] = cls; else all.push(cls);
    await writeJson("classes.json", all);
  });
}

export async function getClass(id: string): Promise<ClassRoster | null> {
  const all = await readJson<ClassRoster[]>("classes.json", []);
  return all.find((c) => c.id === id) ?? null;
}

/** Atomic read-modify-write on a class located by join code. */
export async function updateClassByCode<T>(
  code: string,
  mutator: (cls: ClassRoster) => T | Promise<T>,
): Promise<{ cls: ClassRoster; result: T } | null> {
  return withLock("classes.json", async () => {
    const all = await readJson<ClassRoster[]>("classes.json", []);
    const cls = all.find((c) => c.joinCode === code.toUpperCase());
    if (!cls) return null;
    const result = await mutator(cls);
    await writeJson("classes.json", all);
    return { cls, result };
  });
}

/** Atomic read-modify-write on a class located by id. Used by the assignment
 *  door, which knows the class it is editing (the id is in the assignment it
 *  was handed) rather than its join code. Same lock as every other class write,
 *  so an assignment cannot interleave with a join. */
export async function updateClassById<T>(
  id: string,
  mutator: (cls: ClassRoster) => T | Promise<T>,
): Promise<{ cls: ClassRoster; result: T } | null> {
  return withLock("classes.json", async () => {
    const all = await readJson<ClassRoster[]>("classes.json", []);
    const cls = all.find((c) => c.id === id);
    if (!cls) return null;
    const result = await mutator(cls);
    await writeJson("classes.json", all);
    return { cls, result };
  });
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function joinCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
