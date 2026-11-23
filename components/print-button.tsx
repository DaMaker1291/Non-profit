"use client";

/** Printing is a browser capability, not a server one. A single button keeps
 *  the worksheet otherwise server-rendered and JavaScript-free. */
export function PrintButton({ label = "Print / save as PDF" }: { label?: string }) {
  return (
    <button type="button" className="btn secondary print-hide" onClick={() => window.print()}>
      {label}
    </button>
  );
}
