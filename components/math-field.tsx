"use client";

// ─────────────────────────────────────────────────────────────────────────────
// A MATHEMATICAL FIELD, WITH A KEYBOARD PATH.
//
// MathLive is loaded from a pinned CDN build at runtime. It gives the learner a
// structured editor: fractions, powers, roots and a virtual keyboard, rather
// than a text box that has to imitate them. If the CDN is unavailable the field
// falls back to plain text, and the marker still parses it — a lesson must not
// become unusable because one enhancement did not load.
//
// The value crossing to the marker is ASCII maths (`getValue("ascii-math")`),
// never LaTeX. The marker parses that; comparing LaTeX strings would be the bug
// this component exists to avoid.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";

const MATHLIVE_CDN = "https://cdn.jsdelivr.net/npm/mathlive@0.111.4/mathlive.min.js";
const MATHLIVE_FONTS = "https://cdn.jsdelivr.net/npm/mathlive@0.111.4/fonts/";

type MathfieldElementLike = HTMLElement & {
  value: string;
  getValue(format?: string): string;
  mathVirtualKeyboardPolicy?: string;
};

type MathfieldConstructor = CustomElementConstructor & {
  /** This is a STATIC property in MathLive 0.111.4. Setting it on an instance
   *  throws, which leaves the field stuck in its loading state. */
  fontsDirectory?: string;
};

let loading: Promise<boolean> | null = null;

function loadMathLive(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.customElements.get("math-field")) return Promise.resolve(true);
  if (loading) return loading;
  loading = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = MATHLIVE_CDN;
    script.async = true;
    script.onload = () => {
      const constructor = window.customElements.get("math-field") as
        | MathfieldConstructor
        | undefined;
      if (constructor) constructor.fontsDirectory = MATHLIVE_FONTS;
      resolve(Boolean(constructor));
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return loading;
}

export default function MathField({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
  disabled?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const field = useRef<MathfieldElementLike | null>(null);
  const callback = useRef(onChange);
  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");
  const [plain, setPlain] = useState(value);

  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let live = true;
    loadMathLive().then((available) => {
      if (!live) return;
      if (!available || !host.current) {
        setState("fallback");
        return;
      }
      const element = document.createElement("math-field") as MathfieldElementLike;
      element.value = value;
      element.setAttribute("aria-label", label);
      element.setAttribute("data-math-input", "mathlive");
      element.mathVirtualKeyboardPolicy = "manual";
      element.style.display = "block";
      element.style.width = "100%";
      element.style.minHeight = "48px";
      element.style.padding = "6px 8px";
      element.style.border = "1px solid var(--line, #d8ddd8)";
      element.style.borderRadius = "8px";
      element.style.background = "var(--surface, #fff)";
      element.addEventListener("input", () => callback.current(element.getValue("ascii-math")));
      host.current.appendChild(element);
      field.current = element;
      setState("ready");
    });
    return () => {
      live = false;
      field.current?.remove();
      field.current = null;
    };
    // The field is created once. Incoming value changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (field.current && field.current.getValue("ascii-math") !== value) field.current.value = value;
    setPlain(value);
  }, [value]);

  return (
    <div data-math-entry={state}>
      <div ref={host} />
      {state !== "ready" && (
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          aria-label={label}
          data-math-input="plain"
          disabled={disabled}
          value={plain}
          onChange={(e) => { setPlain(e.target.value); onChange(e.target.value); }}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid var(--line, #d8ddd8)",
            borderRadius: 8,
            fontFamily: "var(--mono, monospace)",
            background: "var(--surface, #fff)",
          }}
        />
      )}
      {state === "fallback" && (
        <p className="small muted" role="status" style={{ margin: "4px 0 0" }}>
          The structured maths editor is unavailable here. Plain text still works: write
          {" "}<code>2(x+3)</code> or <code>R=V/I</code>.
        </p>
      )}
      {state === "loading" && (
        <p className="small muted" role="status" style={{ margin: "4px 0 0" }}>
          Loading the structured maths editor. You can type in the box now.
        </p>
      )}
    </div>
  );
}
