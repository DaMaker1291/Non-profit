// ─────────────────────────────────────────────────────────────────────────────
// THE FILE BACKEND, sitting behind the port.
//
// This file adds no behaviour. It assembles the store's existing functions into
// one object typed as `Storage`, so that the port is proved to describe what the
// product already does — and so that a second backend has something exact to be
// interchangeable with.
//
// WHY IT IS ITS OWN MODULE and not a section of `store.ts`: the ledger
// (`lib/server/evidence.ts`) imports `DATA_DIR` and `withLock` from the store, so
// a store that imported the ledger back would close a cycle. The backend is the
// one place that legitimately depends on both, which keeps the direction of every
// existing import exactly as it is.
//
// The typed object is the completeness proof: a method in the interface and not
// in this object is a compile error, not a runtime surprise. `npm run verify`
// walks STORAGE_METHODS against this object as well, because a cast could defeat
// the type and a method that answers `undefined` is the failure the port exists to
// prevent.
// ─────────────────────────────────────────────────────────────────────────────
import {
  cacheGet,
  cacheSet,
  deleteProfile,
  getClass,
  getPersonalPaper,
  getProfile,
  getRoom,
  getStoredPaper,
  listClasses,
  listPacks,
  listPersonalPapers,
  listProfileStates,
  listRooms,
  readAllPacks,
  removeMemberEverywhere,
  saveClass,
  savePack,
  savePersonalPaper,
  saveProfile,
  saveRoom,
  saveStoredPaper,
  updateClassByCode,
  updateClassById,
  updateRoomById,
} from "./store";
import { deleteEvidence, hasEvidence, learnersWithEvidence, readEvidence } from "./evidence";
// The repo's ONE ordering rule (stable by clock, tie-broken by id). The port
// promises `readEvents` is "oldest first", and the file's append order is NOT
// that the moment a device syncs offline work — it appends events that happened
// before ones already written. Before this, the promise was kept by each
// CONSUMER remembering to call `orderEvents` (lib/server/projection.ts does),
// which is a contract no backend had to satisfy. The conformance suite found it.
import { orderEvents } from "../evidence";
import { resolveStoreKind, type Storage } from "./storage";

/**
 * The file store, as the port describes it.
 *
 * Each entry is a direct reference to the function that already serves the
 * routes, so there is no second implementation to drift: if `saveProfile` changes
 * behaviour, the backend changes with it, and the conformance walk in `verify`
 * stays meaningful because it calls the real thing.
 */
export const fileStorage: Storage = {
  kind: "file",

  // Profiles. `eraseProfile` is `deleteProfile`, which removes the record AND
  // appends the erasure intent — the pair a restore re-applies.
  getProfile,
  listProfiles: listProfileStates,
  saveProfile,
  eraseProfile: deleteProfile,
  removeMemberEverywhere,

  // The ledger, read side — in CLOCK order, which is what the port promises and
  // what `replayModel` folds. The write path (`withLearner`) is slice 3 of
  // docs/STORAGE_SPEC.md and deliberately absent until then.
  readEvents: (learnerId) => orderEvents(readEvidence(learnerId)),
  learnersWithEvents: learnersWithEvidence,
  hasEvent: hasEvidence,
  deleteEvents: deleteEvidence,

  // Classes and membership.
  listClasses,
  getClass,
  saveClass,
  updateClassByCode,
  updateClassById,

  // Rooms.
  listRooms,
  getRoom,
  saveRoom,
  updateRoomById,

  // Community packs.
  listPacks,
  savePack,
  readAllPacks,

  // Papers — the answer key stays server-side.
  saveStoredPaper,
  getStoredPaper,

  // Personal papers — owner-scoped on read.
  savePersonalPaper,
  getPersonalPaper,
  listPersonalPapers,

  // The AI result cache.
  cacheGet,
  cacheSet,
};

/**
 * The backend this deployment runs, resolved from the environment.
 *
 * Throws for `OPENMIND_STORE=postgres` (specified, not implemented) and for an
 * unrecognised value — see `lib/server/storage.ts#resolveStoreKind` for why
 * refusing beats defaulting. Callers that need to REPORT the problem rather than
 * throw on it use `storeKindReport`.
 */
export function activeStorage(env: Record<string, string | undefined> = process.env): Storage {
  const kind = resolveStoreKind(env);
  if (kind === "file") return fileStorage;
  // Unreachable while `resolveStoreKind` refuses every non-file kind; kept so a
  // future backend cannot be added by editing only one of the two functions.
  throw new Error(`no implementation for store kind "${kind}"`);
}
