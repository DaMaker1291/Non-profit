"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MATHS, DRAWN.
//
// The sibling of components/prompt-text.tsx, one layer down: lib/math-text.ts
// decides WHICH run of a string is a power, an index, a fraction or a root, and
// this file decides how each one is DRAWN. Nothing here parses — a renderer that
// parses is how two surfaces come to disagree about what "5/6" is.
//
// Every surface that shows authored maths goes through it: the prompt, each of
// the four options, and the marking explanation. Before this existed only the
// prompt had a component of its own, and the options and the reasoning — where
// most of a question's fractions actually live — were printed as typed.
//
// THE WRAPPER SPAN IS NOT DECORATION. The rules that set a superscript or a
// stacked fraction live under `.math` in app/globals.css rather than on bare
// `sup`/`sub` element selectors, so this markup can never restyle a superscript
// somewhere else in the product.
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment, type ReactNode } from "react";
import { mathSpans } from "@/lib/math-text";

/** An atom's payload can hold more of the same (`1/2^3` has a power in its
 *  denominator), so payloads recurse through here rather than being printed as a
 *  string. */
function payload(text: string): ReactNode {
  return <MathText text={text} />;
}

export default function MathText({ text }: { text: string }) {
  const spans = mathSpans(text);
  return (
    <span className="math">
      {spans.map((span, i) => {
        switch (span.kind) {
          case "text":
            return <Fragment key={i}>{span.text}</Fragment>;
          case "sup":
            return <sup key={i}>{payload(span.text)}</sup>;
          case "sub":
            return <sub key={i}>{payload(span.text)}</sub>;
          case "times":
            return <Fragment key={i}>×</Fragment>;
          case "approx":
            return <Fragment key={i}>≈</Fragment>;
          case "radical":
            // The vinculum is CSS on the body, drawn in the text's own colour,
            // so a radical inside an option marked wrong is red with it.
            return (
              <span key={i} className="mrad">
                <span className="mrad-sign" aria-hidden="true">√</span>
                <span className="mrad-body">{payload(span.text)}</span>
              </span>
            );
          case "frac":
            // Numerator, then a slash for whoever is LISTENING, then the
            // denominator. A reader hears "3 slash 4" — the way a fraction is
            // said aloud — while the page draws it stacked; hiding the slash
            // from the accessibility tree would leave "3 4".
            return (
              <span key={i} className="mfrac">
                <span className="mfrac-n">{payload(span.numerator)}</span>
                <span className="visually-hidden">/</span>
                <span className="mfrac-d">{payload(span.denominator)}</span>
              </span>
            );
        }
      })}
    </span>
  );
}
