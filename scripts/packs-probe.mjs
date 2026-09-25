// Throwaway lifecycle probe for the study-packs pipeline (MAKE ALL, feature 2).
// Traces: create pack → fork into another language → vote → ranking order.
const BASE = "http://localhost:4173";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.error("  ✗", m); } };
const post = (p, b) => fetch(BASE + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));

const stamp = Date.now().toString(36);
const mk = (handle) => post("/api/profile", { handle, country: "KE", birthYear: 2009, language: "en", goal: "engineer", subjects: ["maths"] });

// Two distinct students
const a = await mk("probe_a_" + stamp);
const b = await mk("probe_b_" + stamp);
ok(a.status === 200 && a.body.profile?.id, "student A created");
ok(b.status === 200 && b.body.profile?.id, "student B created");
const idA = a.body.profile?.id, idB = b.body.profile?.id;

// A writes the first pack on fractions
const c1 = await post("/api/packs", { id: idA, action: "create", conceptId: "fractions", title: "Bottom is the whole", body: "The bottom number names the slice size. 1/8 is a THIN slice — say it out loud before comparing." });
ok(c1.status === 200 && c1.body.pack?.id, "pack created by A");
const packId = c1.body.pack?.id;
ok(c1.body.pack?.author === "probe_a_" + stamp, "author handle recorded");
ok(c1.body.pack?.helpful === 0, "new pack starts at 0 helpful");

// Guard rails
const bad1 = await post("/api/packs", { id: idA, action: "create", conceptId: "fractions", title: "", body: "x" });
ok(bad1.status === 400, "empty title rejected");
const bad2 = await post("/api/packs", { id: idA, action: "create", conceptId: "fractions", title: "t", body: "x".repeat(2001) });
ok(bad2.status === 400, "oversize body rejected");
const bad3 = await post("/api/packs", { id: idA, action: "create", conceptId: "no-such-concept", title: "t", body: "b" });
ok(bad3.status === 400, "unknown concept rejected");
const bad4 = await post("/api/packs", { id: "ghost", action: "create", conceptId: "fractions", title: "t", body: "b" });
ok(bad4.status === 404, "unknown profile rejected");

// B forks it into Swahili (translate-and-improve loop)
const f1 = await post("/api/packs", { id: idB, action: "fork", packId, language: "sw", title: "Chini ni chote", body: "Namba ya chini inaonyesha ukubwa wa kipande." });
ok(f1.status === 200 && f1.body.pack?.forkOf === packId, "fork points at parent");
ok(f1.body.pack?.language === "sw" && f1.body.pack?.author === "probe_b_" + stamp, "fork carries new language + author");

// Voting: fork gets 2, parent gets 1
await post("/api/packs", { id: idB, action: "helpful", packId: f1.body.pack.id });
await post("/api/packs", { id: idA, action: "helpful", packId: f1.body.pack.id });
await post("/api/packs", { id: idB, action: "helpful", packId });
const list = await fetch(BASE + "/api/packs?conceptId=fractions").then((r) => r.json());
ok(list.packs?.length === 2, "list shows both packs");
ok(list.packs[0].id === f1.body.pack.id && list.packs[0].helpful === 2, "fork ranks first with 2 helpful");
ok(list.packs[1].helpful === 1, "parent has 1 helpful");

// Persistence across a re-read (store wrote to disk)
const again = await fetch(BASE + "/api/packs?conceptId=fractions").then((r) => r.json());
ok(again.packs[0].helpful === 2, "votes persist on disk");

console.log(`PACKS PROBE: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
