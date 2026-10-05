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

export default function PromptText({ text }: { text: string }) {
  const segments = splitPrompt(text);
  return (
    <>
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
