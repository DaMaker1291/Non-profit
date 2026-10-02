"use client";

import { useI18n } from "@/lib/client";

// ─────────────────────────────────────────────────────────────────────────────
// LOADING · EMPTY · ERROR — three states, and they are never the same screen.
//
// The failure this module exists to prevent is one shape: a fetch that has not
// come back (or came back refused) rendering as "you have nothing". On a
// learning product that is not a cosmetic bug — it tells a learner with three
// hundred recorded answers that their history does not exist, and it tells them
// while the network is merely slow.
//
// So every surface that waits for something has all three, and each says only
// what it knows:
//
//   Loading  — a skeleton, no claims, and a screen-reader line that says so.
//   Empty    — the request came back and there is genuinely nothing. It names
//              the missing thing and offers the action that fixes it.
//   Error    — it did not come back. Plain language, and a retry that retries.
//
// None of them is ever a blank page, and none of them invents a zero.
// ─────────────────────────────────────────────────────────────────────────────

/** Skeleton lines shaped like the content they stand in for. */
export function Loading({ lines = 3, label }: { lines?: number; label?: string }) {
  const { t } = useI18n();
  return (
    <div className="skeleton" role="status" aria-live="polite" aria-busy="true">
      <i className="title" />
      {Array.from({ length: lines }).map((_, i) => <i key={i} className={i % 3 === 2 ? "short" : ""} />)}
      <span className="visually-hidden">{label ?? t("common.loading")}</span>
    </div>
  );
}

/** The request came back, and there is nothing here yet. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="state">
      <p className="state-title" style={{ margin: 0 }}>{title}</p>
      {body && <p className="state-body" style={{ margin: 0 }}>{body}</p>}
      {action && <div className="actions" style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}

/** The request did not come back. Say what happened, and offer the retry. */
export function ErrorState({
  body,
  onRetry,
  title,
}: {
  body?: string;
  onRetry?: () => void;
  title?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="state error" role="alert">
      <p className="state-title" style={{ margin: 0 }}>{title ?? t("common.error")}</p>
      {body && <p className="state-body" style={{ margin: 0 }}>{body}</p>}
      {onRetry && (
        <div className="actions" style={{ marginTop: 4 }}>
          <button type="button" className="btn ghost small" onClick={onRetry}>{t("common.retry")}</button>
        </div>
      )}
    </div>
  );
}
