// ─────────────────────────────────────────────────────────────────────────────
// THE FILE BACKEND, sitting behind the port.
//
// This file adds no behaviour. It assembles the store's existing functions into
// one object typed as `Storage`, so that the port is proved to describe what the
// product already does — and so that a second backend has something exact to be
// interchangeable with.
//
// WHY IT IS ITS OWN MODULE and not a section of `store.ts`: the ledger
// (`lib/server/evidence-file.ts`) imports `DATA_DIR` and `withLock` from the
// store, so a store that imported the ledger back would close a cycle. The
// backend is the one place that legitimately depends on both, which keeps the
// direction of every existing import exactly as it is.
//
// IT IS ALSO THE ONE IMPORTER of the file ledger. The application reaches a
// learner's history through `lib/server/evidence.ts` (the facade), which asks the
// PORT for the configured backend — so there is exactly one path in, and
// `npm run verify` fails if a second module starts naming the file ledger
// directly. (That is exactly why the ledger moved out of `evidence.ts` into its
// own module: importing the file implementation and importing the facade used to
// be the same import, which is how a backend silently stops being swappable.)
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
  confirmErasure,
  counts,
  deletePersonalPapersFor,
  deleteProfile,
  updateProfile,
  withLearner,
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
  readErasureLog,
  recordErasure,
  registerLedgerIO,
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
import { appendEvidence, deleteEvidence, hasEvidence, learnersWithEvidence, readEvidence } from "./evidence-file";
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

  // Profiles. `deleteProfile` removes the RECORD and nothing else, and
  // `recordErasure` writes the instruction — a deliberate pair, because the
  // erasure is one workflow over both (lib/server/erasure.ts) and it must be able
  // to write the instruction BEFORE the effects to stay resumable.
  getProfile,
  listProfiles: listProfileStates,
  saveProfile,
  // THE LEARNER TRANSACTION, and here it is literally the store's own
  // read-modify-write: the file backend does not re-implement it, so the two
  // cannot drift into disagreeing about what a serialised write means. `withLearner`
  // is the general contract and `updateProfile` is its one-mutator specialisation.
  updateProfile,
  withLearner,
  deleteProfile,
  recordErasure,
  confirmErasure,
  readErasures: readErasureLog,
  deletePersonalPapersFor,
  removeMemberEverywhere,
  counts,

  // The ledger. `readEvents` is in CLOCK order, which is what the port promises
  // and what `replayModel` folds; `appendEvents` is the store's own append (the
  // one function that writes to a ledger, with the framing rule and the ids
  // dedupe that F1–F5 of the conformance suite pin).
  //
  // Each is wrapped in an already-resolved promise because the PORT is
  // asynchronous — a database cannot answer synchronously — while these file
  // functions are not, and `await` on a settled value costs one microtask. The
  // wrappers are deliberately thin: a second implementation of a promise would be
  // a second place for the port's promises to be broken.
  //
  // These five are now what `lib/server/evidence.ts` delegates to, so the
  // application's ledger calls run through this object rather than around it —
  // which is what makes a second backend a matter of swapping a backend instead
  // of a migration of every call site.
  readEvents: async (learnerId) => orderEvents(readEvidence(learnerId)),
  appendEvents: appendEvidence,
  learnersWithEvents: async () => learnersWithEvidence(),
  hasEvent: async (learnerId, eventId) => hasEvidence(learnerId, eventId),
  deleteEvents: async (learnerId) => deleteEvidence(learnerId),

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

  // The AI result cache. The ONE method pair this file is allowed to keep
  // file-backed: `ai-cache.json` is regenerable by design (§5 of the spec — a lost
  // entry costs one model call), so it is the only declared exception to "every
  // durable record goes through the selected backend". It is listed as EXCEPTIONAL
  // rather than silently file-shaped because the exception has to be visible to a
  // reader of the port, not discovered by one.
  cacheGet,
  cacheSet,
};

// ── THE BACKEND DECLARES ITS OWN LEDGER ─────────────────────────────────────
//
// One line, and it is the price of a rule worth keeping: `lib/server/evidence-file.ts`
// has exactly ONE importer — this file — and `npm run verify` fails if a second
// module starts naming it. A transaction (`store.ts#withLearner`) needs to read
// and append a learner's events inside the profile lock, and if it imported the
// ledger itself that rule would be false for the most important caller of all.
// So the backend registers its ledger here, at module load, and the context calls
// through the registration. The direction is still backend → both halves; nothing
// the transaction does can reach a file the configured backend did not write.
registerLedgerIO({
  // APPEND order, deliberately: the context applies the repo's one ordering rule
  // (`orderEvents`) to what this returns, exactly as `readEvents` above does — so
  // the port's "oldest first" promise holds identically on both paths.
  read: (learnerId) => readEvidence(learnerId),
  append: (learnerId, events) => appendEvidence(learnerId, events),
});

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
