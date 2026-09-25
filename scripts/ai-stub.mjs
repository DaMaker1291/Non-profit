// An OpenAI-compatible endpoint that behaves like a model in the good case and
// like the four bad ones on demand.
//
// The AI layer's fallback is only real if the failures are real: a provider
// that 500s, one that hangs past the timeout, and one that answers 200 with a
// body that is not a completion at all. Mocking `fetch` proves the code path
// but not the transport, and the transport is where the timeout lives. So the
// dev server is pointed at this with OPENMIND_AI_BASE_URL and the suites drive
// it over real HTTP.
//
// It is not a fake of the product — it is a fake of a MODEL. The dev server
// runs the real lib/llm.ts, the real tutor turn and the real offline engine.
//
// Behaviour is chosen by a marker in the prompt, so one stub covers every case
// on one port:
//
//   [[FAIL]]        → 500, exactly what a provider outage looks like
//   [[HANG]]        → never answers (the client's own timeout must fire)
//   [[NOTJSON]]     → 200 with an HTML error page body
//   [[EMPTY]]       → 200 with a well-formed envelope and no completion in it
//   anything else   → 200 with a completion, marked so tests can recognise it
//
// Every received request is appended to OPENMIND_AI_STUB_LOG (newline-delimited
// JSON) so a test can read back exactly what the model was told — which is how
// "the tutor knows why this learner is seeing this question" is asserted
// against the prompt rather than against our own code.
import fs from "node:fs";
import http from "node:http";

const PORT = Number(process.env.OPENMIND_AI_STUB_PORT ?? 8791);
const LOG = process.env.OPENMIND_AI_STUB_LOG ?? "";
const reply = process.env.OPENMIND_AI_STUB_REPLY ?? "STUB-AI-REPLY: what do you already know about this?";

function record(entry) {
  if (!LOG) return;
  try {
    fs.appendFileSync(LOG, JSON.stringify(entry) + "\n");
  } catch {
    /* a logging failure must never change what the stub returns */
  }
}

const server = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => { raw += c; });
  req.on("end", () => {
    let body = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const userText = messages.filter((m) => m?.role === "user").map((m) => String(m.content ?? "")).join("\n");
    const systemText = messages.filter((m) => m?.role === "system").map((m) => String(m.content ?? "")).join("\n");
    record({ at: Date.now(), url: req.url, auth: req.headers.authorization ?? null, model: body?.model ?? null, prompt: userText, system: systemText });

    if (!req.url?.includes("/chat/completions")) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
      return;
    }
    if (userText.includes("[[FAIL]]")) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "upstream is down" } }));
      return;
    }
    if (userText.includes("[[HANG]]")) {
      // Deliberately never answered: the request stays open until the CLIENT's
      // timeout fires, which is the only way to prove the timeout exists.
      return;
    }
    if (userText.includes("[[NOTJSON]]")) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><body>502 Bad Gateway</body></html>");
      return;
    }
    if (userText.includes("[[EMPTY]]")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id: "stub", choices: [{ message: { role: "assistant", content: "" }, finish_reason: "stop" }] }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      id: "stub",
      object: "chat.completion",
      model: body?.model ?? "stub",
      choices: [{ index: 0, message: { role: "assistant", content: reply }, finish_reason: "stop" }],
    }));
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`ai-stub listening on http://127.0.0.1:${PORT}/v1/chat/completions${LOG ? ` (log: ${LOG})` : ""}`);
});
