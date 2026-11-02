// ─────────────────────────────────────────────────────────────────────────────
// REVIEW RECORDS ARE DURABLE AND APPEND-ONLY.
//
// They live with the other platform records under OPENMIND_DATA_DIR, not in a
// browser or a generated document. A review is a statement about a version of a
// lesson, so it is never edited in place: a correction is another record.
//
// This module is a FACADE over the storage port. The file layout belongs to the
// backend (lib/server/store.ts), so the same review operations can be served by
// another backend without a route learning what content-reviews.json is.
// Writes use the store's learner-record purpose deliberately: a deployment that
// has refused learner-record writes is not one that should be recording a
// publication approval it cannot keep.
// ─────────────────────────────────────────────────────────────────────────────
import { activeStorage } from "./storage-file";
import type { ContentReviewRecord } from "../content-platform/types";

export function listContentReviews(): Promise<ContentReviewRecord[]> {
  return activeStorage().listContentReviews();
}

export function appendContentReview(record: ContentReviewRecord): Promise<void> {
  return activeStorage().appendContentReview(record);
}
