/** ProgressEvent — separate module to avoid cycles. */
export interface ProgressEvent {
  conceptId: string;
  questionId: string;
  chosen: number;
  correct: boolean;
  at: number;
  /** Milliseconds from question served to answered (omitted when unknown). */
  ms?: number;
  /** Hint levels opened before answering (0 = independent). */
  hints?: number;
  /** Practice mode: guided (hints welcome) · independent (prove it) · transfer (unfamiliar). */
  mode?: "guided" | "independent" | "transfer";
  /** Teaching language the question was served in. */
  lang?: string;
}
