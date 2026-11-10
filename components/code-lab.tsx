"use client";

// ─────────────────────────────────────────────────────────────────────────────
// A CODE LAB THAT ACTUALLY RUNS CODE, WITHOUT RUNNING IT ON THE SERVER.
//
// The runner is a sandboxed iframe (`allow-scripts`, deliberately no
// `allow-same-origin`) loading Pyodide. Learner code therefore has an opaque
// origin, no cookies, no local storage and no access to the application DOM.
// The parent owns the timeout: if the iframe does not answer, it is removed and
// recreated, which is the only reliable way to stop a blocking loop in a
// browser. No learner code reaches OpenMind's server.
//
// The runtime is loaded from a pinned Pyodide CDN. That is a real availability
// dependency; when it cannot load, the lab says so and the rest of the lesson
// remains usable. It is not claimed to work offline.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import type { CodeTest } from "@/lib/content-platform/types";

type RunnerMessage =
  | { type: "ready" }
  | { type: "error"; error: string }
  | { type: "result"; stdout: string; stderr: string; error?: string };

function normalizeOutput(value: string): string {
  return String(value ?? "").replace(/\r\n/g, "\n").trimEnd();
}

export default function CodeLab({
  starterCode,
  timeoutMs,
  tests,
  prompt,
}: {
  starterCode: string;
  timeoutMs: number;
  tests: CodeTest[];
  prompt: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const timer = useRef<number | null>(null);
  const [code, setCode] = useState(starterCode);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "result" | "timeout" | "unavailable">("idle");
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [error, setError] = useState("");
  const [checks, setChecks] = useState<Array<{ name: string; pass: boolean }>>([]);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    function onMessage(event: MessageEvent<RunnerMessage>) {
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "ready") { setReady(true); return; }
      if (data.type === "error") {
        setReady(false);
        setStatus("unavailable");
        setError(data.error);
        return;
      }
      if (data.type === "result") {
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = null;
        const actual = normalizeOutput(data.stdout);
        setStdout(data.stdout);
        setStderr(data.stderr);
        setError(data.error ?? "");
        setChecks(tests.map((test) => ({ name: test.name, pass: !data.error && actual === normalizeOutput(test.expectedStdout) })));
        setStatus("result");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [tests]);

  useEffect(() => {
    const unavailable = window.setTimeout(() => {
      if (!ready) setStatus((s) => (s === "idle" ? "unavailable" : s));
    }, 15000);
    return () => window.clearTimeout(unavailable);
  }, [ready]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  function run() {
    if (!frame.current?.contentWindow) return;
    if (!ready) {
      setStatus("unavailable");
      setError("The Python runtime has not loaded. Check the connection and try again.");
      return;
    }
    setStatus("running");
    setStdout("");
    setStderr("");
    setError("");
    setChecks([]);
    frame.current.contentWindow.postMessage({ type: "run", code }, "*");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setStatus("timeout");
      setError(`The program ran for more than ${Math.round(timeoutMs / 1000)} seconds and was stopped.`);
      // Removing the iframe is the only way a parent can stop a blocked Python
      // loop; the next render creates a clean runner.
      setGeneration((g) => g + 1);
      setReady(false);
    }, timeoutMs);
  }

  const allPassed = checks.length === tests.length && checks.every((c) => c.pass);

  return (
    <section className="card" data-code-lab style={{ marginBottom: 18 }}>
      <p className="eyebrow" style={{ margin: 0 }}>Code lab · Python</p>
      <p className="small" style={{ margin: "6px 0 10px" }}>{prompt}</p>
      <label className="small muted" htmlFor="code-lab-editor">Your program</label>
      <textarea
        id="code-lab-editor"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        rows={8}
        style={{
          display: "block",
          width: "100%",
          marginTop: 6,
          padding: 12,
          border: "1px solid var(--line, #d8ddd8)",
          borderRadius: 8,
          fontFamily: "var(--mono, monospace)",
          fontSize: 14,
          lineHeight: 1.55,
          background: "#0f1c24",
          color: "#f0f7f4",
          resize: "vertical",
        }}
      />
      <div className="actions" style={{ marginTop: 10, alignItems: "center" }}>
        <button type="button" className="btn" onClick={run} disabled={status === "running"}>
          {status === "running" ? "Running…" : "Run program"}
        </button>
        <button type="button" className="btn ghost small" onClick={() => { setCode(starterCode); setStatus("idle"); setStdout(""); setStderr(""); setError(""); setChecks([]); }}>
          Reset
        </button>
        <span className="small muted" role="status" aria-live="polite">
          {!ready ? "Loading the sandboxed Python runtime…" : status === "running" ? "Running in the sandbox…" : "Ready"}
        </span>
      </div>
      <iframe
        key={generation}
        ref={frame}
        title="Sandboxed Python runner"
        src="/code-runner.html"
        sandbox="allow-scripts"
        style={{ display: "none" }}
      />
      {(stdout || stderr || error) && (
        <div style={{ marginTop: 12 }}>
          <p className="small muted" style={{ margin: "0 0 4px" }}>Output</p>
          <pre
            aria-live="polite"
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 8,
              background: "var(--surface-sunken, #f4f6f4)",
              color: "var(--text, #1d2a2e)",
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              fontFamily: "var(--mono, monospace)",
              fontSize: 13,
            }}
          >{stdout || "(no output)"}{stderr ? `\n${stderr}` : ""}{error ? `\n${error}` : ""}</pre>
        </div>
      )}
      {checks.length > 0 && (
        <div style={{ marginTop: 10 }} role="status">
          <p style={{ margin: 0, fontWeight: 700 }}>{allPassed ? "All checks passed." : "Not there yet."}</p>
          <ul className="small" style={{ margin: "6px 0 0 18px" }}>
            {checks.map((c, i) => <li key={i}>{c.pass ? "✓" : "✗"} {c.name}</li>)}
          </ul>
        </div>
      )}
      <p className="small muted" style={{ margin: "10px 0 0" }}>
        These checks are practice feedback, not a recorded mark. Use the criteria in the assessment to judge the explanation your program cannot show.
      </p>
      <p className="small muted" style={{ margin: "6px 0 0" }}>
        Python runs in a sandboxed browser iframe. No code is sent to OpenMind's server, and the iframe has no access to your account or this page.
      </p>
    </section>
  );
}
