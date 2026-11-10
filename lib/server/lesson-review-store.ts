// Durability boundary for authored-lesson reviews and their improvement tasks.
// The route reads and writes through this facade, not a file path, so a future
// backend can hold the same records without the route learning the file layout.
import { activeStorage } from "./storage-file";
import type { EducatorReviewRecord, ImprovementTask } from "../validation/types";

export function listLessonReviews(): Promise<EducatorReviewRecord[]> {
  return activeStorage().listLessonReviews();
}

export function appendLessonReview(
  record: EducatorReviewRecord,
  tasks: readonly ImprovementTask[],
): Promise<void> {
  return activeStorage().appendLessonReview(record, tasks);
}

export function listLessonImprovementTasks(): Promise<ImprovementTask[]> {
  return activeStorage().listLessonImprovementTasks();
}

export function updateLessonImprovementTask(
  id: string,
  patch: { status: ImprovementTask["status"]; resolution?: ImprovementTask["resolution"] },
): Promise<ImprovementTask | null> {
  return activeStorage().updateLessonImprovementTask(id, patch);
}
