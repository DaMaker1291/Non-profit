import { promises as fs } from "fs";
import path from "path";
// The profile's own shape and its wire-stripping rule are PURE, and the static
// build (no server at all) needs both — so they live in lib/learner-profile.ts
// and are re-exported here. A second copy would be a default that drifts.
import { newProfileState, publicProfileState } from "../learner-profile";
// The membership rule, in one place: the store is only the caller that makes a
// legacy roster's identities durable.
import { bindLegacyHandles, handleOf, hasRow } from "./class-membership";
export { newProfileState, publicProfileState };
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

// `newProfileState` and `publicProfileState` are re-exported above from
// lib/learner-profile.ts, where they live so the static build can share them.

export async function getProfile(id: string): Promise<ProfileState | null> {
  const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
  return all[id] ?? null;
}

export async function saveProfile(state: ProfileState): Promise<void> {
  await withLock("profiles.json", async () => {
    const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
    all[state.profile.id] = state;
    await writeJson("profiles.json", all);
  });
}

/**
 * Delete a profile's record entirely. The one path privacy's right to erasure
 * can take (§23): the profile, its ledger and its personal papers all go.
 * Evidence is append-only on the normal paths — deletion is a deliberate,
 * learner-initiated act, not an edit, which is why it lives here beside the
 * store's other whole-record operations rather than on any route.
 */
export async function deleteProfile(id: string): Promise<boolean> {
  return withLock("profiles.json", async () => {
    const all = await readJson<Record<string, ProfileState>>("profiles.json", {});
    if (!all[id]) return false;
    delete all[id];
    await writeJson("profiles.json", all);
    return true;
  });
}

/** Remove one learner's membership from every class roster, in place. Used by
 *  the account's own erase path (§23: leaving is part of erasure) and returns
 *  how many rosters changed. Handles recorded under the learner's id are
 *  dropped from the self-report maps too, so the teacher's table stops listing
 *  a member who has left. */
export async function removeMemberEverywhere(profileId: string): Promise<number> {
  return withLock("classes.json", async () => {
    const rosters = await readJson<ClassRoster[]>("classes.json", []);
    let changed = 0;
    for (const cls of rosters) {
      // The row is named by IDENTITY, the way every other membership decision
      // names it: `membersById` maps handle -> learner, so looking the learner
      // up in it by their own id found nothing and left the erased learner's row
      // (and its binding) in the roster for good — a member the teacher's table
      // still listed, and one `isMemberOf` still answered true for.
      const handle = handleOf(cls, profileId);
      const members = cls.members ?? [];
      if (!members.includes(profileId) && !handle) continue;
      cls.members = members.filter((m) => m !== profileId);
      if (handle) {
        if (cls.membersById) delete cls.membersById[handle];
        delete cls.students[handle];
        if (cls.misconceptions) delete cls.misconceptions[handle];
      }
      changed++;
    }
    if (changed > 0) await writeJson("classes.json", rosters);
    return changed;
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

/**
 * EVERY class read passes through here, so a roster written before member ids
 * existed is reconciled ONCE (lib/server/class-membership#bindLegacyHandles)
 * and the result is written back — after which every membership decision is
 * identity-only. The alternative was matching a display name on every read,
 * which let any profile with the same name into the class.
 *
 * The write happens only when something actually changed, so a normal read
 * costs one extra JSON read and no write. A class whose handles are ambiguous
 * is left alone: an unowned row grants nothing, and it is tried again on a
 * later read in case the ambiguity resolves (two profiles, one name is the
 * only case this refuses to guess about).
 *
 * Two shapes need reconciling, and both are the same missing fact: a row with
 * no identity (written before member ids existed), and a member with no row
 * (a learner whose row the old join rebound onto somebody else).
 */
function needsIdentity(cls: ClassRoster): boolean {
  if (Object.keys(cls.students ?? {}).some((h) => !cls.membersById?.[h])) return true;
  return (cls.members ?? []).some((id) => !hasRow(cls, id));
}

async function classesWithIdentity(): Promise<ClassRoster[]> {
  const all = await readJson<ClassRoster[]>("classes.json", []);
  if (!all.some(needsIdentity)) return all;
  const states = await listProfileStates();
  let changed = false;
  for (const cls of all) if (bindLegacyHandles(cls, states)) changed = true;
  if (changed) await withLock("classes.json", () => writeJson("classes.json", all));
  return all;
}

export async function listClasses(): Promise<ClassRoster[]> {
  return classesWithIdentity();
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
  const all = await classesWithIdentity();
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
