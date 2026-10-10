"use client";

// ─────────────────────────────────────────────────────────────────────────────
// A QUESTION PROMPT, DRAWN AS WHAT IT IS.
//
// The one place a prompt becomes elements. Every surface that shows a question
// (practice, the diagnostic, the transfer and prove steps, the micro-check)
// renders through this, so a code block is set in monospace in all of them at
// once, and none of them can drift from the others.
//
// The split itself lives in lib/prompt.ts — pure, shared with the static build.
// This file only decides how the two kinds are DRAWN.
// ─────────────────────────────────────────────────────────────────────────────

import { splitPrompt } from "@/lib/prompt";
import QuestionFigure from "@/components/question-figure";
import type { FigureSpec } from "@/lib/types";

/**
 * A question's body: its DIAGRAM (when it has one) and its text.
 *
 * The figure rides here rather than at the six call sites, because a diagram is
 * part of the question in exactly the way its prose is: a surface that shows one
 * and not the other is showing a different question. That is not hypothetical —
 * the paper sitting rendered only the text, which is how "What is printed?"
 * arrived as a single collapsed line (see app/papers/page.tsx). One component
 * owns both, so the next surface to render a question gets the whole of it.
 */
export default function PromptText({ text, figure }: { text: string; figure?: FigureSpec | null }) {
  const segments = splitPrompt(text);
  return (
    <>
      <QuestionFigure spec={figure} />
      {segments.map((seg, i) =>
        seg.kind === "code" ? (
          // One <pre> per run, so the author's own indentation reaches the page
          // exactly as written — the alignment IS the example in a code question.
          <pre key={i} className="qcode">
            <code>{seg.text}</code>
          </pre>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}
